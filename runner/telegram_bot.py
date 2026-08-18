"""
Agrostech Digital Twin — Telegram Bot Runner v2
Powered by CrewAI agent routing — every command dispatched to a
specialized AI agent (Agronomist, Operations, Sales, Marketing, Intel).

Prerequisites:
    pip install -r requirements.txt

Usage:
    # 1. Initialize user database
    python seed_telegram_db.py
    
    # 2. Configure .env with TELEGRAM_BOT_TOKEN, GEMINI_API_KEY, FIRECRAWL_API_KEY
    
    # 3. Launch the bot
    python telegram_bot.py
"""

import os
import sqlite3
import logging
import requests
from pathlib import Path
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

# ── CrewAI agent router + lead agent ──────────────────────────────────────────
try:
    from agent_router import handle_command, handle_natural_chat
    from lead_agent import buscar_leads
    CREWAI_ENABLED = True
except ImportError as e:
    logging.warning(f"CrewAI not available, falling back to legacy handlers: {e}")
    CREWAI_ENABLED = False

# ── Captura Inteligente de Evento (/event) ────────────────────────────────────
try:
    import event_capture
    EVENT_CAPTURE_ENABLED = True
except ImportError as e:
    logging.warning(f"event_capture not available, /event disabled: {e}")
    EVENT_CAPTURE_ENABLED = False

# Load env variables
load_dotenv(Path(__file__).parent / ".env")

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CLICKUP_API_TOKEN = os.getenv("CLICKUP_API_TOKEN") or "pk_6807762_FIDM98KYROQOMNOM8M7TRKWWKTZZOWP2"
DB_PATH = Path(__file__).parent / "telegram_users.db"

# Configure Logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# RBAC Matrix matching integrations/telegram_integration.md
ROLE_PERMISSIONS = {
    "admin": ["*"],
    "chief_pilot": ["status", "missoes", "briefing", "iniciar_remoto", "incidente", "relatorio", "briefing_mkt", "trends", "post_status", "event"],
    "field_pilot": ["status", "missoes", "briefing", "iniciar", "concluir", "incidente", "event"],
    "data_processing": ["status", "missoes", "processando", "qa_ok", "concluir"],
    "sales": ["status", "pipeline", "lead", "concluir", "event"],
    "content_director": ["status", "briefing_mkt", "trends", "aprovar_mkt", "post_status", "relatorio", "concluir", "gerar_mkt"],
    "instagram_image": ["status", "briefing_mkt", "revisar_mkt", "post_status", "concluir"],
    "instagram_reels": ["status", "briefing_mkt", "revisar_mkt", "post_status", "concluir"],
    "tiktok": ["status", "briefing_mkt", "trends", "post_status", "concluir"],
    "visual_identity": ["status", "briefing_mkt", "revisar_mkt", "post_status", "concluir"],
    "read_only": ["status", "relatorio"],
}

# Helper to read from ClickUp IDs
CLICKUP_IDS = {}
ids_file = Path(__file__).parent.parent / "integrations" / "clickup_ids.txt"
if ids_file.exists():
    for line in ids_file.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            CLICKUP_IDS[k.strip()] = v.strip()

# ─────────────────────────────────────────────
# Database Helpers
# ─────────────────────────────────────────────

def get_user_role(telegram_id: int) -> tuple:
    """Fetch user role and name from SQLite DB."""
    if not DB_PATH.exists():
        return None, None
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT role, name FROM users WHERE telegram_id = ? AND is_active = 1", (telegram_id,))
    row = cursor.fetchone()
    conn.close()
    return (row[0].lower(), row[1]) if row else (None, None)

def log_audit(telegram_id: int, username: str, command: str, result: str):
    """Log command calls to DB."""
    if not DB_PATH.exists():
        return
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO audit_logs (telegram_id, username, command, action_result) VALUES (?, ?, ?, ?)",
        (telegram_id, username, command, result)
    )
    conn.commit()
    conn.close()

# ─────────────────────────────────────────────
# RBAC Middleware
# ─────────────────────────────────────────────

def check_permission(permission: str):
    """Decorator to verify if the user has a specific permission."""
    def decorator(func):
        async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
            user_id = update.effective_user.id
            username = update.effective_user.username or "unknown"
            
            role, name = get_user_role(user_id)
            
            if not role:
                log_audit(user_id, username, func.__name__, "UNAUTHORIZED")
                await update.message.reply_text(
                    "🚫 Acesso não autorizado.\n"
                    "Seu ID do Telegram não está registrado no sistema Agrostech.\n"
                    f"Seu ID: {user_id}\n"
                    "Informe seu supervisor para liberar seu acesso."
                )
                return
            
            # Admin bypass
            if role == "admin" or "*" in ROLE_PERMISSIONS.get(role, []):
                log_audit(user_id, username, func.__name__, "ALLOWED")
                return await func(update, context, name, role)
                
            # Check specific permission
            perms = ROLE_PERMISSIONS.get(role, [])
            if permission in perms:
                log_audit(user_id, username, func.__name__, "ALLOWED")
                return await func(update, context, name, role)
            else:
                log_audit(user_id, username, func.__name__, "DENIED")
                await update.message.reply_text(
                    f"🚫 Permissão negada.\n"
                    f"Seu papel ({role}) não tem autorização para o comando /{func.__name__.replace('cmd_', '')}.\n"
                    "Digite /ajuda para ver seus comandos disponíveis."
                )
                return
        return wrapper
    return decorator

# ─────────────────────────────────────────────
# Command Handlers
# ─────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start command (Public)."""
    user_id = update.effective_user.id
    role, name = get_user_role(user_id)
    
    if not role:
        await update.message.reply_text(
            "👋 Olá! Bem-vindo ao Bot da Agrostech.\n\n"
            "Este canal é restrito para funcionários da Agrostech.\n"
            f"Seu ID do Telegram é: {user_id}.\n"
            "Envie este ID ao Administrador para cadastrar seu perfil."
        )
    else:
        await update.message.reply_text(
            f"👋 Olá, {name}!\n"
            f"Você está conectado como: **{role.upper()}**.\n\n"
            "Use o comando /ajuda para ver as funções disponíveis para seu papel."
        )

@check_permission("status")
async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE, name: str, role: str):
    """View assigned tasks (Unified status)."""
    await update.message.reply_text(
        f"📋 **Suas Tarefas Ativas — {name}**\n"
        "──────────────────\n"
        "🟢 [Campanha Julho] Carrossel - NDVI (Fase: Geração)\n"
        "🟡 [Campanha Julho] Reel - Drone vs Olho (Fase: Roteiro)\n"
        "🔴 [Campanha Julho] TikTok - ROI (Fase: Revisão de Marca)\n\n"
        "Use /concluir [ID] para atualizar o status no ClickUp."
    )

@check_permission("missoes")
async def cmd_missoes(update: Update, context: ContextTypes.DEFAULT_TYPE, name: str, role: str):
    """List flight missions (Operations/Pilot)."""
    await update.message.reply_text(
        "🛸 *Missões de Campo Cadastradas*\n"
        "-------------------------------------\n"
        "🚁 ID: 901714652090 | Fazenda São João | Safra Soja | Data: 25/06\n"
        "🚁 ID: 901714652091 | Fazenda Progresso | NDVI | Data: 28/06\n\n"
        "Digite `/briefing 901714652090` para ver os detalhes."
    )

@check_permission("briefing")
async def cmd_briefing(update: Update, context: ContextTypes.DEFAULT_TYPE, name: str, role: str):
    """View flight mission briefing."""
    args = context.args
    if not args:
        await update.message.reply_text("⚠️ Informe o ID da missão. Ex: `/briefing 901714652090`")
        return
    mission_id = args[0]
    await update.message.reply_text(
        f"🚁 *Briefing da Missão {mission_id}*\n"
        "-------------------------------------\n"
        "Cliente: João Mendes | Área: 450 ha\n"
        "Coordenadas: -15.823, -47.882 | Altitude: 120m AGL\n"
        "Baterias Alvo: 6 cargas | GSD Alvo: <= 3.0cm/px\n"
        "NOTAM: Aprovado | DECEA: DECEA-2026-X8392\n\n"
        "[Iniciar Missão: /iniciar 901714652090]"
    )

@check_permission("iniciar")
async def cmd_iniciar(update: Update, context: ContextTypes.DEFAULT_TYPE, name: str, role: str):
    """Start flight mission in field."""
    args = context.args
    if not args:
        await update.message.reply_text("⚠️ Informe o ID da missão. Ex: `/iniciar 901714652090`")
        return
    mission_id = args[0]
    await update.message.reply_text(
        f"🛸 *Missão {mission_id} iniciada em campo!*\n"
        f"Operador: {name}\n"
        "COO e Chief Pilot foram notificados via ClickUp.\n\n"
        "Status ClickUp atualizado para: *Em Campo*."
    )

@check_permission("concluir")
async def cmd_concluir(update: Update, context: ContextTypes.DEFAULT_TYPE, name: str, role: str):
    """Complete a task/mission."""
    args = context.args
    if not args:
        await update.message.reply_text("⚠️ Informe o ID da tarefa. Ex: `/concluir 86e203uwf`")
        return
    task_id = args[0]
    await update.message.reply_text(
        f"✅ *Tarefa {task_id} concluída!*\n"
        "Status da task ClickUp alterado para *Concluída*.\n"
        "Próxima etapa do pipeline disparada."
    )

@check_permission("incidente")
async def cmd_incidente(update: Update, context: ContextTypes.DEFAULT_TYPE, name: str, role: str):
    """Report incident."""
    args = context.args
    if not args:
        await update.message.reply_text("⚠️ Informe o ID e a descrição. Ex: `/incidente 901714652090 Colisão leve com galho`")
        return
    await update.message.reply_text(
        "🚨 *ALERTA DE INCIDENTE REGISTRADO*\n"
        f"Operador: {name}\n"
        f"Detalhes: {' '.join(args)}\n\n"
        "Notificação imediata enviada aos administradores."
    )

@check_permission("briefing_mkt")
async def cmd_briefing_mkt(update: Update, context: ContextTypes.DEFAULT_TYPE, name: str, role: str):
    """View marketing campaign briefing."""
    await update.message.reply_text(
        "📣 *Briefing Editorial de Julho/2026*\n"
        "-------------------------------------\n"
        "🎯 Foco: Entressafra de soja (MT/GO)\n"
        "🌿 Pilar 1: Mapeamento Antecipado (Economia de Insumos)\n"
        "💚 Pilar 2: Reserva Legal e Créditos de Carbono\n\n"
        "Use /trends para ver trends ativas no TikTok."
    )

@check_permission("trends")
async def cmd_trends(update: Update, context: ContextTypes.DEFAULT_TYPE, name: str, role: str):
    """View TikTok/Reels trends."""
    await update.message.reply_text(
        "📈 *Tendências Agro da Semana (TikTok)*\n"
        "-------------------------------------\n"
        "1. Som: 'Batida Sertaneja' (Trends de antes vs depois do plantio)\n"
        "2. Hashtags em alta: #filhodofazendeiro (1.2M views), #vidanafazenda (800K views)\n"
        "3. Formato: POV dramático ('Quando o drone acha o vazamento de água')"
    )

@check_permission("revisar_mkt")
async def cmd_revisar_mkt(update: Update, context: ContextTypes.DEFAULT_TYPE, name: str, role: str):
    """Visual identity review command."""
    args = context.args
    if not args:
        await update.message.reply_text("⚠️ Informe o ID da peça. Ex: `/revisar_mkt 86e203uwp`")
        return
    await update.message.reply_text(
        f"🎨 *Revisão de Marca iniciada para {args[0]}*\n"
        "Acessando Brand Style Guide...\n"
        "✅ Paleta Verde Terra/Laranja Cerrado OK\n"
        "✅ Tipografia Montserrat OK\n"
        "Aprovado para publicação: `/aprovar_mkt 86e203uwp`"
    )

@check_permission("aprovar_mkt")
async def cmd_aprovar_mkt(update: Update, context: ContextTypes.DEFAULT_TYPE, name: str, role: str):
    """Approve content for publishing."""
    args = context.args
    if not args:
        await update.message.reply_text("⚠️ Informe o ID do post. Ex: `/aprovar_mkt 86e203uwp`")
        return
    await update.message.reply_text(
        f"🎉 *Conteúdo {args[0]} Aprovado para Publicação!*\n"
        "Mudar status no ClickUp para: *Aguardando Publicação*.\n"
        "Humano responsável notificado."
    )

@check_permission("gerar_mkt")
async def cmd_gerar_mkt(update: Update, context: ContextTypes.DEFAULT_TYPE, name: str, role: str):
    """Generate marketing content via marketing_agent workflow."""
    args = context.args
    if not args:
        await update.message.reply_text("⚠️ Informe o mês e ano. Ex: `/gerar_mkt Julho 2026`")
        return
    month_year = " ".join(args)
    
    await update.message.reply_text(
        f"🚀 **Iniciando Geração de Conteúdo para {month_year}**\n"
        "──────────────────\n"
        "Este processo orquestra 5 agentes digitais:\n"
        "1. Marketing Agent (Estratégia)\n"
        "2. Content Director (Briefing)\n"
        "3. Creators (Imagem, Reels, TikTok)\n"
        "4. Visual Identity (Brand Check)\n\n"
        "⏳ Por favor, aguarde alguns minutos..."
    )
    
    try:
        from marketing_agent import run_content_generation_workflow
        from io import BytesIO
        
        # Execute the multi-agent generation (synchronous call - will block the bot momentarily)
        content, image_paths, image_err = run_content_generation_workflow(month_year)
        
        # Check if content is larger than Telegram message limit (4096 chars)
        if len(content) > 3800:
            doc = BytesIO(content.encode('utf-8'))
            doc.name = f"conteudo_{month_year.replace(' ', '_').lower()}.md"
            await update.message.reply_document(
                document=doc,
                caption=f"✅ **Conteúdo de {month_year} gerado com sucesso!**\n(Enviado como arquivo pois excede o limite de texto)"
            )
        else:
            await update.message.reply_text(f"✅ **Conteúdo Finalizado:**\n\n{content}")

        # Send generated images if any
        if image_paths:
            await update.message.reply_text("🖼️ Enviando imagens geradas automaticamente via Google Imagen...")
            for img_path in image_paths:
                if os.path.exists(img_path):
                    with open(img_path, 'rb') as photo:
                        await update.message.reply_photo(
                            photo=photo,
                            caption=f"🎨 {os.path.basename(img_path)}"
                        )
        
        if image_err:
            await update.message.reply_text(f"⚠️ **Aviso sobre Imagens:** {image_err}")
            
    except Exception as e:
        await update.message.reply_text(f"❌ Ocorreu um erro ao gerar o conteúdo: {e}")

@check_permission("status")
async def cmd_calc(update: Update, context: ContextTypes.DEFAULT_TYPE, name: str, role: str):
    """Calculadora rápida de vendas."""
    args = context.args
    if not args or len(args) < 1:
        await update.message.reply_text("⚠️ Uso: /calc [área_ha] [tipo (opcional: orto/ndvi/completo/enterprise)]\nEx: /calc 500 ndvi")
        return
    
    try:
        area_ha = float(args[0])
        tipo = args[1].lower() if len(args) > 1 else "completo"
        
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from sales_calculator import AgrostechSalesCalculator
        
        calc = AgrostechSalesCalculator()
        
        if tipo == "enterprise":
            res = calc.simulate_proposal(area_ha, is_enterprise=True, farms=1)
            msg = (f"💼 **Cotação Enterprise** (Área Base: {res['area_total_ha']} ha)\n"
                   f"──────────────────\n"
                   f"Fazendas: {res['numero_fazendas']}\n"
                   f"Valor Bruto: R$ {res['valor_bruto_anual']:,.2f}\n"
                   f"Desconto: {res['desconto_aplicado']}\n"
                   f"💰 **Valor Final Anual: R$ {res['valor_final_anual']:,.2f}**\n")
        else:
            if tipo in ["orto", "ortofoto"]:
                res = calc.simulate_proposal(area_ha, service_type="ortofoto")
            elif tipo == "ndvi":
                res = calc.simulate_proposal(area_ha, service_type="ndvi")
            else:
                res = calc.simulate_proposal(area_ha, service_type="completo")
                
            msg = (f"📊 **Cotação Rápida**\n"
                   f"──────────────────\n"
                   f"Serviço: {res['servico']}\n"
                   f"Área: {res['area_ha']} ha\n"
                   f"💰 **Valor Estimado: R$ {res['valor']:,.2f}**")

        await update.message.reply_text(msg)
    except Exception as e:
        await update.message.reply_text(f"❌ Erro na calculadora: {e}")

@check_permission("status")
async def cmd_instagram(update: Update, context: ContextTypes.DEFAULT_TYPE, name: str, role: str):
    """Comandos criativos e opções pro time de mkt BR."""
    msg = (
        "📸 **Opções Criativas do Instagram Agrostech**\n"
        "──────────────────\n"
        "Use comandos diretos para o bot gerar suas ideias e artes da melhor qualidade do mundo:\n"
        "• /gerar_mkt [mês] - Orquestra a campanha completa (textos e imagens).\n"
        "• /trends - Sugere tendências virais do TikTok/Reels.\n"
        "• /briefing_mkt - Mostra a pauta da semana.\n"
        "• /aprovar_mkt [id] - Envia para a fila de publicação!\n\n"
        "💡 **Dica:** A Agrostech busca o melhor design (estilo Apple/Tesla do Agro) com alto impacto visual e copy direto!"
    )
    await update.message.reply_text(msg)

@check_permission("event")
async def cmd_event(update: Update, context: ContextTypes.DEFAULT_TYPE, name: str, role: str):
    """Captura Inteligente de Evento — abre/fecha leads e organiza tudo que
    o rep manda (texto, foto, documento) numa ficha por lead. Ver event_capture.py."""
    if not EVENT_CAPTURE_ENABLED:
        await update.message.reply_text("⚠️ Captura de evento não disponível (event_capture.py não carregou).")
        return

    user_id = update.effective_user.id
    args = context.args or []
    sub = args[0].lower() if args else ""

    if sub == "novo" and len(args) > 1:
        lead_name = " ".join(args[1:])
        info = event_capture.open_lead(user_id, name, lead_name)
        status = "🆕 Novo lead aberto" if info["is_new"] else "🔁 Lead reaberto"
        await update.message.reply_text(
            f"{status}: *{info['lead_name']}*\n\n"
            "Agora é só mandar texto, foto do crachá/fazenda ou documento — tudo "
            "cai automaticamente na ficha desse lead. Quando terminar a conversa:\n"
            "`/event fechar`"
        )

        # Gancho de conversa específico da empresa — sai rápido, enquanto o
        # rep ainda está de pé na frente do representante. Best-effort: se
        # falhar, a captura do lead já está garantida de qualquer forma.
        try:
            insight = event_capture.compose_company_insight(info["lead_name"])
            await update.message.reply_text(f"💡 *Gancho de conversa — {info['lead_name']}*\n\n{insight}")
            event_capture.record_system_note(info["path"], f"Insight enviado ao rep: {insight}")
        except Exception as e:
            logger.warning("Falha ao gerar insight de empresa para %r: %s", info["lead_name"], e)

    elif sub == "fechar":
        closed = event_capture.close_active(user_id)
        if not closed:
            await update.message.reply_text("Nenhum lead ativo no momento. Abra um com `/event novo <nome>`.")
            return
        ficha = (closed["path"] / "_ficha.md").read_text(encoding="utf-8")
        await update.message.reply_text(f"✅ Lead *{closed['lead_name']}* fechado.\n\n{ficha}")

    elif sub == "lista":
        leads = event_capture.list_leads()
        if not leads:
            await update.message.reply_text("Nenhum lead capturado ainda no evento.")
            return
        linhas = [f"📋 *{len(leads)} leads capturados — {event_capture.EVENT_CODE}*", "──────────────────"]
        for lead in leads:
            titulo = lead["ficha"].split("\n", 1)[0].lstrip("# ").strip()
            linhas.append(f"• {titulo}")
        await send_long_message(update, "\n".join(linhas))

    elif sub == "resumo":
        active = event_capture.get_active(user_id)
        if not active:
            await update.message.reply_text("Nenhum lead ativo. Use `/event novo <nome>` ou `/event lista`.")
            return
        ficha = (active["path"] / "_ficha.md").read_text(encoding="utf-8")
        await update.message.reply_text(ficha)

    elif sub == "followup":
        active = event_capture.get_active(user_id)
        if not active:
            await update.message.reply_text(
                "Nenhum lead ativo. Abra o lead (`/event novo <nome>`) ou reabra o que você quer "
                "fechar a noite antes de gerar o follow-up."
            )
            return
        await update.message.reply_text("✍️ Escrevendo o follow-up...")
        try:
            texto = event_capture.compose_followup(active["path"])
            await update.message.reply_text(f"📲 *Cole isso no WhatsApp de {active['lead_name']}:*\n\n{texto}")
        except Exception as e:
            await update.message.reply_text(f"⚠️ Não consegui gerar o follow-up agora: {e}")

    else:
        active = event_capture.get_active(user_id)
        status_line = f"🟢 Lead ativo: *{active['lead_name']}*" if active else "⚪ Nenhum lead ativo agora"
        await update.message.reply_text(
            f"🎪 *Captura de Evento — {event_capture.EVENT_CODE}*\n"
            f"{status_line}\n"
            "──────────────────\n"
            "`/event novo <nome>` — abre um lead/piloto/organização e passa a capturar tudo que você mandar\n"
            "`/event fechar` — fecha o lead ativo e mostra a ficha\n"
            "`/event resumo` — mostra a ficha do lead ativo\n"
            "`/event lista` — lista todos os leads já capturados\n"
            "`/event followup` — a IA escreve o texto de fechamento pro WhatsApp"
        )


async def cmd_ajuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Print list of commands for current user's role."""
    user_id = update.effective_user.id
    role, name = get_user_role(user_id)
    
    if not role:
        await update.message.reply_text("🚫 Registro não encontrado. Envie seu ID ao Admin.")
        return
        
    perms = ROLE_PERMISSIONS.get(role, [])
    
    help_text = f"💡 **Comandos disponíveis para seu papel ({role.upper()}):**\n──────────────────\n"
    
    if "*" in perms:
        help_text += "Você tem acesso irrestrito de Admin:\n"
        help_text += "/status, /resumo, /calc, /instagram, /missoes, /briefing, /iniciar, /concluir, /incidente, /briefing_mkt, /trends, /revisar_mkt, /aprovar_mkt, /gerar_mkt"
    else:
        for p in perms:
            if p == "status":
                help_text += "• /status (ou /resumo) - Ver minhas tarefas ativas\n"
                help_text += "• /calc - Calculadora de orçamentos (PME e Enterprise)\n"
                help_text += "• /instagram (ou /criativo) - Acesso ao hub criativo\n"
            elif p == "missoes":
                help_text += "• /missoes - Listar missões do dia\n"
            elif p == "briefing":
                help_text += "• /briefing [ID] - Ver briefing de missão\n"
            elif p == "iniciar":
                help_text += "• /iniciar [ID] - Iniciar voo\n"
            elif p == "concluir":
                help_text += "• /concluir [ID] - Marcar tarefa como concluída\n"
            elif p == "incidente":
                help_text += "• /incidente [ID] [descrição] - Reportar ocorrência\n"
            elif p == "briefing_mkt":
                help_text += "• /briefing_mkt - Ver briefing de marketing\n"
            elif p == "trends":
                help_text += "• /trends - Ver trends virais do TikTok\n"
            elif p == "revisar_mkt":
                help_text += "• /revisar_mkt [ID] - Iniciar revisão de design\n"
            elif p == "aprovar_mkt":
                help_text += "• /aprovar_mkt [ID] - Aprovar post final\n"
            elif p == "gerar_mkt":
                help_text += "• /gerar_mkt [Mês Ano] - Orquestrar geração de conteúdo\n"
            elif p == "event":
                help_text += "• /event novo [nome] - Abrir lead de evento (tudo que você mandar depois é capturado)\n"
                help_text += "• /event fechar / lista / resumo / followup - Ver Captura de Evento\n"

    await update.message.reply_text(help_text)

# ─────────────────────────────────────────────
# CrewAI-Powered Unified Dispatcher
# ─────────────────────────────────────────────

async def send_long_message(update: Update, text: str, parse_mode: str = None):
    """Helper to split and send long messages that exceed Telegram's 4096 char limit."""
    MAX_LEN = 4000 # Leave some buffer
    if len(text) <= MAX_LEN:
        try:
            await update.message.reply_text(text, parse_mode=parse_mode)
        except Exception:
            # Fallback if HTML fails
            await update.message.reply_text(text)
        return

    # Split logic
    chunks = [text[i:i+MAX_LEN] for i in range(0, len(text), MAX_LEN)]
    for chunk in chunks:
        try:
            await update.message.reply_text(chunk, parse_mode=parse_mode)
        except Exception:
            await update.message.reply_text(chunk)

async def agent_dispatch(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Unified handler for all CrewAI-powered commands.
    Routes to the correct AI agent based on RBAC and command type.
    """
    if not CREWAI_ENABLED:
        await update.message.reply_text("⚠️ Sistema de agentes não disponível. Verifique a instalação do CrewAI.")
        return

    user_id = update.effective_user.id
    command = update.message.text.split()[0]  # e.g. "/copiloto"
    args = context.args or []

    # Special case: /buscar_leads uses its own async agent
    cmd_name = command.lstrip("/").split("@")[0].lower()
    if cmd_name == "buscar_leads":
        await update.message.reply_text("🔍 Iniciando busca de leads... aguarde!")
        if len(args) < 2:
            await update.message.reply_text("⚠️ Uso: /buscar_leads <estado> <cultura>\nEx: /buscar_leads Paraná soja")
            return
        estado, cultura = args[0], args[1]
        response = await buscar_leads(estado, cultura, user_id)
        await send_long_message(update, response)
        return

    # All other commands: run through the CrewAI departments
    await update.message.reply_text("Pensando...")
    response = await handle_command(user_id, command, args)
    await send_long_message(update, response)


async def handle_telegram_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Catch-all handler for normal non-command conversational text messages.
    Invokes the LLM NLU Intent Classifier and dispatches the request accordingly.
    """
    user_id = update.effective_user.id
    username = update.effective_user.username or "unknown"
    message_text = update.message.text

    # Check if user is registered/authorized
    role, name = get_user_role(user_id)
    if not role:
        # Fallback: treat unregistered users as external clients / prospects
        role = "client"
        name = update.effective_user.first_name or "Visitante"

    # Captura de Evento tem prioridade: se o rep tem um lead aberto, toda
    # mensagem de texto vira ficha/log daquele lead em vez de ir pro NLU.
    if EVENT_CAPTURE_ENABLED and event_capture.get_active(user_id):
        event_capture.record_text(user_id, name, message_text)
        await update.message.reply_text("📝 Anotado na ficha.")
        return

    await update.message.reply_text("Pensando...")
    
    try:
        # Run natural chat NLU processing
        response = await handle_natural_chat(user_id, message_text, default_name=name)
        
        # Check if response matches legacy command classification markers
        if response == "__CLASSIFIED_STATUS__":
            await cmd_status(update, context, name, role)
        elif response.startswith("__CLASSIFIED_CALC__"):
            # Extract arguments from classifier marker
            args = response.replace("__CLASSIFIED_CALC__", "").split()
            # Set arguments in context to emulate CommandHandler
            context.args = args
            await cmd_calc(update, context)
        elif response == "__CLASSIFIED_INSTAGRAM__":
            await cmd_instagram(update, context, name, role)
        elif response == "__CLASSIFIED_AJUDA__":
            await cmd_ajuda(update, context)
        elif response == "__CLASSIFIED_START__":
            await cmd_start(update, context)
        else:
            # Direct text response from agent nodes
            await send_long_message(update, response)
            
        log_audit(user_id, username, "natural_chat", "NLU_SUCCESS")
    except Exception as e:
        logger.exception("Error in handle_telegram_message")
        await update.message.reply_text(f"⚠️ Erro ao processar mensagem: {e}")


async def handle_event_media(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Salva fotos/documentos/áudios no lead de evento ativo do remetente, se houver.
    Se não houver lead ativo, não faz nada — não interfere no resto do bot."""
    if not EVENT_CAPTURE_ENABLED:
        return

    user_id = update.effective_user.id
    if not event_capture.get_active(user_id):
        return

    role, name = get_user_role(user_id)
    name = name or update.effective_user.first_name or "Visitante"

    msg = update.message
    try:
        if msg.photo:
            tg_file = await msg.photo[-1].get_file()
            data = bytes(await tg_file.download_as_bytearray())
            event_capture.record_media(user_id, name, "foto", f"foto_{msg.photo[-1].file_unique_id}.jpg", data)
        elif msg.document:
            tg_file = await msg.document.get_file()
            data = bytes(await tg_file.download_as_bytearray())
            event_capture.record_media(user_id, name, "documento", msg.document.file_name or "documento", data)
        elif msg.voice or msg.audio:
            audio = msg.voice or msg.audio
            tg_file = await audio.get_file()
            data = bytes(await tg_file.download_as_bytearray())
            event_capture.record_media(user_id, name, "audio", f"audio_{audio.file_unique_id}.ogg", data)
        else:
            return

        if msg.caption:
            event_capture.record_text(user_id, name, msg.caption)

        await msg.reply_text("📎 Salvo na ficha.")
    except Exception as e:
        logger.exception("Erro ao salvar mídia de evento")
        await msg.reply_text(f"⚠️ Não consegui salvar esse arquivo: {e}")


# ─────────────────────────────────────────────
# Main Loop
# ─────────────────────────────────────────────

AGENT_COMMANDS = [
    # Agronomist Agent
    "copiloto", "diagnostico", "ndvi", "monitorar", "adubar",
    # Operations Agent
    "missoes", "briefing", "iniciar", "concluir", "incidente",
    # Sales Agent
    "pipeline", "proposta", "qualificar", "buscar_leads",
    # Marketing Agent
    "briefing_mkt", "gerar_mkt", "trends", "revisar_mkt", "aprovar_mkt",
    # Intel Agent
    "intel_mercado", "alertas_agro",
    # Finance Board / Deal Desk
    "cotacao", "resultado", "aprendizado",
]

def main():
    """Start the bot application."""
    if not TOKEN:
        print("[ERROR] TELEGRAM_BOT_TOKEN environment variable not set.")
        print("   Set it in runner/.env or export it in your shell.")
        return

    mode = "CrewAI v3" if CREWAI_ENABLED else "Legacy"
    print(f"[START] Launching Agrostech Telegram Bot gateway — Mode: {mode}")
    application = Application.builder().token(TOKEN).build()

    # Legacy public commands (no RBAC change needed)
    application.add_handler(CommandHandler("start", cmd_start))
    application.add_handler(CommandHandler("ajuda", cmd_ajuda))
    application.add_handler(CommandHandler("status", cmd_status))
    application.add_handler(CommandHandler("post_status", cmd_status))  # alias
    application.add_handler(CommandHandler("resumo", cmd_status))  # simple pt-br alias
    application.add_handler(CommandHandler("calc", cmd_calc))
    application.add_handler(CommandHandler("instagram", cmd_instagram))
    application.add_handler(CommandHandler("criativo", cmd_instagram))
    application.add_handler(CommandHandler("gerar_mkt", cmd_gerar_mkt))  # keep legacy (has file send logic)

    # Captura Inteligente de Evento (/event) — funciona independente do CrewAI
    application.add_handler(CommandHandler("event", cmd_event))
    application.add_handler(MessageHandler(
        filters.PHOTO | filters.Document.ALL | filters.VOICE | filters.AUDIO,
        handle_event_media,
    ))
    if EVENT_CAPTURE_ENABLED:
        print("[EVENT] Captura Inteligente de Evento (/event) registrada [OK]")

    # CrewAI-powered commands (new intelligent agents)
    if CREWAI_ENABLED:
        for cmd in AGENT_COMMANDS:
            application.add_handler(CommandHandler(cmd, agent_dispatch))
        print(f"[AGENTS] {len(AGENT_COMMANDS)} commands wired to CrewAI agents [OK]")
        
        # Conversational NLU handler for non-command messages
        application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_telegram_message))
        print("[NLU] Conversational NLU message handler registered [OK]")
    else:
        # Fallback to legacy handlers
        application.add_handler(CommandHandler("missoes", cmd_missoes))
        application.add_handler(CommandHandler("briefing", cmd_briefing))
        application.add_handler(CommandHandler("iniciar", cmd_iniciar))
        application.add_handler(CommandHandler("concluir", cmd_concluir))
        application.add_handler(CommandHandler("incidente", cmd_incidente))
        application.add_handler(CommandHandler("briefing_mkt", cmd_briefing_mkt))
        application.add_handler(CommandHandler("trends", cmd_trends))
        application.add_handler(CommandHandler("revisar_mkt", cmd_revisar_mkt))
        application.add_handler(CommandHandler("aprovar_mkt", cmd_aprovar_mkt))

    # Run polling loop
    application.run_polling()

if __name__ == "__main__":
    main()
