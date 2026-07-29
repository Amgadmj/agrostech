"""
Agrostech — CrewAI Agent Router
Roteia cada comando do Telegram/WhatsApp para o departamento CrewAI correto.

Arquitetura:
  Mensagem Telegram → Roteamento RBAC determinístico (Python) → Crew do
  departamento (agente único + Task) → Resposta em texto puro

O roteamento de comandos é um lookup em dicionário + checagem RBAC — nenhuma
chamada de LLM é gasta para rotear. Os departamentos LLM vivem em
crew_agents.py; o Deal Desk (finance_board) permanece 100% determinístico.

Install:
    pip install crewai
"""

from __future__ import annotations

import asyncio
import logging
import sqlite3
from pathlib import Path

import llm_config  # higiene de ambiente ANTES de qualquer import do crewai
from crew_agents import build_embrapa_context, run_department, sales_learnings_context

logger = logging.getLogger(__name__)

# LLM compartilhado para o classificador NLU (chamada direta, sem crew)
llm = llm_config.get_llm()
logger.info(f"LLM: {llm_config.model_string()}")

# ── RBAC permission map ───────────────────────────────────────────────────────
COMMAND_AGENT_MAP = {
    "copiloto": ("agronomist", ["*"]),
    "diagnostico": ("agronomist", ["admin", "field_pilot", "chief_pilot", "sales"]),
    "ndvi": ("agronomist", ["admin", "field_pilot", "chief_pilot", "data_processing"]),
    "monitorar": ("agronomist", ["admin", "data_processing"]),
    "adubar": ("agronomist", ["admin", "field_pilot"]),
    "missoes": ("operations", ["admin", "chief_pilot", "field_pilot"]),
    "briefing": ("operations", ["admin", "chief_pilot", "field_pilot"]),
    "iniciar": ("operations", ["admin", "chief_pilot", "field_pilot"]),
    "concluir": ("operations", ["admin", "field_pilot", "chief_pilot", "data_processing", "sales", "content_director"]),
    "incidente": ("operations", ["admin", "chief_pilot", "field_pilot"]),
    "pipeline": ("sales", ["admin", "sales", "chief_pilot"]),
    "proposta": ("sales", ["admin", "sales"]),
    "qualificar": ("sales", ["admin", "sales"]),
    "buscar_leads": ("sales", ["admin", "sales"]),
    "briefing_mkt": ("marketing", ["admin", "content_director", "instagram_image", "instagram_reels", "tiktok"]),
    "gerar_mkt": ("marketing", ["admin", "content_director"]),
    "trends": ("marketing", ["admin", "content_director", "tiktok"]),
    "intel_mercado": ("intel", ["admin", "sales", "chief_pilot"]),
    "alertas_agro": ("intel", ["admin"]),
    "cotacao": ("finance_board", ["admin", "sales", "chief_pilot"]),
    "resultado": ("finance_board", ["admin", "sales", "chief_pilot"]),
    "aprendizado": ("finance_board", ["admin", "sales", "chief_pilot"]),
    "leads_geomart": ("geomart", ["admin", "sales"]),
}

# ── Database helpers ──────────────────────────────────────────────────────────
DB_PATH = Path(__file__).parent / "telegram_users.db"

def get_user(user_id: str | int, default_name: str = "Visitante") -> tuple[str, str]:
    if not DB_PATH.exists():
        return "client", default_name
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT role, name FROM users WHERE telegram_id=? AND is_active=1", (user_id,))
    row = cur.fetchone()
    conn.close()
    return (row[0].lower(), row[1]) if row else ("client", default_name)

# ── Execução de departamentos ─────────────────────────────────────────────────

async def _run_department_cmd(agent_name: str, cmd: str, args: list[str], name: str) -> str:
    """Monta o contexto determinístico e executa a Crew do departamento."""
    args_text = " ".join(args)
    user_msg = f"Usuário: {name} | Comando: /{cmd} {args_text}"
    raw_text = f"{cmd} {args_text}".lower()

    extra_context = ""
    if agent_name == "sales":
        extra_context += sales_learnings_context()
    if agent_name in ("agronomist", "sales"):
        extra_context += build_embrapa_context(raw_text)

    try:
        return await run_department(agent_name, user_msg, extra_context)
    except Exception as e:
        logger.exception(f"Erro no departamento {agent_name}")
        return f"⚠️ Erro ao processar: {e}"


def _finance_board(cmd: str, args: list[str], name: str, user_id: str | int = "") -> str:
    """Deal Desk determinístico: cotação (/cotacao), resultado do cliente
    (/resultado) e painel de reaprendizado (/aprendizado)."""
    try:
        if cmd == "resultado":
            import deal_memory
            return deal_memory.handle_resultado(args)
        elif cmd == "aprendizado":
            import deal_memory
            return deal_memory.learning_report()
        else:
            import deal_desk
            return deal_desk.handle_cotacao(args, rep=name, user_id=user_id)
    except Exception as e:
        logger.exception("Deal Desk error")
        return f"⚠️ Erro no Deal Desk: {e}"


def _geomart_status(cmd: str, args: list[str], name: str) -> str:
    """/leads_geomart — reporta o estado do Motor de Prospecção Geomart.
    Determinístico e só LEITURA: nunca dispara o crawl (Agent 1) nem o lote
    diário (Agent 3+4) ao vivo no chat — isso roda separado, via agendador
    (python geomart_pipeline.py --daily), porque a varredura de tiles pode
    levar minutos e não cabe na latência de uma resposta de bot."""
    try:
        import geomart_pipeline
        import os

        status = geomart_pipeline.get_status_summary()
        if not status.get("synced"):
            return (
                "📭 Motor de Prospecção Geomart ainda sem dados.\n"
                "Rode `python geomart_client.py --uf all` para popular o backlog inicial."
            )

        spreadsheet_id = os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID", "").strip()
        sheet_link = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}" if spreadsheet_id else "(planilha não configurada)"

        return (
            "🌾 Motor de Prospecção Geomart — Status\n"
            "──────────────────\n"
            f"• Pitches gerados hoje: {status['pitched_today']}\n"
            f"• Backlog restante (leads ≥500ha ainda não pitchados): {status['backlog']}\n"
            f"• Total de leads no radar: {status['total_leads']}\n"
            f"• Último pitch gerado em: {status['last_pitched_at'] or 'nunca'}\n"
            f"• Fila de revisão: {sheet_link}"
        )
    except Exception as e:
        logger.exception("Erro ao consultar status do Motor de Prospecção Geomart")
        return f"⚠️ Erro ao consultar o Motor de Prospecção Geomart: {e}"


async def handle_command(user_id: str | int, command: str, args: list[str]) -> str:
    """
    Main entry point called by whatsapp_bot.py or telegram_bot.py for every command.
    Returns the text response to send back to the user.
    """
    role, name = get_user(user_id)
    if not role:
        return (
            "🚫 Acesso não autorizado.\n"
            f"Seu ID: {user_id}\n"
            "Informe ao administrador para liberar seu acesso."
        )

    cmd = command.lstrip("/").split("@")[0].lower()

    if cmd not in COMMAND_AGENT_MAP:
        return f"❓ Comando /{cmd} não reconhecido. Use /ajuda para ver seus comandos."

    agent_name, allowed_roles = COMMAND_AGENT_MAP[cmd]

    if "*" not in allowed_roles and role not in allowed_roles and role != "admin":
        return (
            f"🚫 Seu perfil ({role.upper()}) não tem acesso ao comando /{cmd}.\n"
            "Digite /ajuda para ver os comandos disponíveis para você."
        )

    if agent_name == "finance_board":
        return _finance_board(cmd, args, name, user_id)

    if agent_name == "geomart":
        return _geomart_status(cmd, args, name)

    return await _run_department_cmd(agent_name, cmd, args, name)


def classify_intent_and_arguments(message_text: str, role: str) -> tuple[str, list[str]]:
    """
    Utiliza LLM para classificar mensagens de texto livre em comandos existentes do sistema
    e extrair seus argumentos apropriados (NLU).
    """
    import json
    import re

    # Lista de comandos permitidos conforme o RBAC
    available_commands = []
    for cmd, (agent, allowed_roles) in COMMAND_AGENT_MAP.items():
        if "*" in allowed_roles or role in allowed_roles or role == "admin":
            available_commands.append(cmd)

    # Comandos públicos e adicionais
    available_commands.extend(["status", "resumo", "calc", "instagram", "criativo", "gerar_mkt", "ajuda", "start"])

    prompt = (
        "Você é o Classificador de Intenção e NLU do sistema Agrostech.\n"
        "Sua tarefa é analisar a mensagem de texto enviada pelo usuário e mapeá-la para o comando do sistema mais apropriado, "
        "além de extrair quaisquer argumentos que devem ser passados para o comando.\n\n"
        "COMANDOS DISPONÍVEIS:\n"
        "- `cotacao`: Para orçamentos, cotações de serviços, áreas em hectares, planos de pulverização, etc.\n"
        "   Exemplo de argumentos extraídos: ['450', 'pulverizacao', 'Fazenda Santa Rosa']\n"
        "- `copiloto`: Perguntas agronômicas gerais (Ceres), dúvidas de pragas, adubação, solo, cana, soja, milho.\n"
        "   Exemplo de argumentos extraídos: ['espaçamento', 'recomendado', 'para', 'cana']\n"
        "- `missoes`: Listar ou pesquisar missões ativas, voos do dia ou tarefas.\n"
        "- `briefing`: Ver detalhes/briefing de uma missão específica por ID ou nome do cliente.\n"
        "- `iniciar`: Iniciar voo ou missão pelo ID.\n"
        "- `concluir`: Concluir uma missão ou tarefa pelo ID.\n"
        "- `incidente`: Reportar acidente, quebra ou imprevistos em voo.\n"
        "- `pipeline`: Consultar andamento de vendas, negócios ou funil.\n"
        "- `proposta`: Gerar ou consultar proposta comercial.\n"
        "- `buscar_leads`: Localizar novos clientes ou leads agrícolas por estado/cultura.\n"
        "- `trends`: Buscar tendências de marketing ou pautas quentes.\n"
        "- `gerar_mkt`: Orquestrar campanhas ou geração de posts.\n"
        "- `instagram`: Exibir o menu ou obter ideias criativas de mídia social.\n"
        "- `status`: Ver o resumo de suas tarefas ativas.\n"
        "- `ajuda`: Exibir a lista de comandos ou manual de ajuda.\n\n"
        f"Comandos permitidos para o papel atual ({role}): {available_commands}\n\n"
        "Se a mensagem for uma saudação ou conversa informal sem intenção de comando clara, classifique-a como `copiloto` "
        "para que o Copiloto Ceres responda de forma amigável e natural.\n\n"
        "INSTRUÇÕES DE SAÍDA:\n"
        "Você deve retornar estritamente um objeto JSON com o seguinte formato, sem qualquer outra palavra ou caractere:\n"
        "{\n"
        "  \"command\": \"<nome_do_comando_selecionado>\",\n"
        "  \"args\": [\"<argumento1>\", \"<argumento2>\", ...]\n"
        "}\n\n"
        f"MENSAGEM DO USUÁRIO: \"{message_text}\""
    )

    try:
        response = llm.call(prompt).strip()

        # Extração de JSON altamente robusta (encontra tudo entre o primeiro { e o último })
        json_match = re.search(r"\{.*\}", response, re.DOTALL)
        if json_match:
            response_clean = json_match.group(0)
        else:
            response_clean = response

        data = json.loads(response_clean.strip())
        cmd = data.get("command", "").lower().strip()

        if cmd not in available_commands:
            # Fallback para o chat do agrônomo
            cmd = "copiloto"
            args = message_text.split()
        else:
            args = data.get("args", [])

        return cmd, args
    except Exception as e:
        logger.warning(f"Erro na classificação NLU via LLM: {e}")
        return "copiloto", message_text.split()


async def handle_natural_chat(user_id: str | int, message_text: str, default_name: str = "Visitante") -> str:
    """
    Recebe texto livre do Telegram/WhatsApp, classifica a intenção via LLM e
    invoca programaticamente o departamento CrewAI correspondente.
    """
    role, name = get_user(user_id, default_name)

    # Descoberta consultiva pendente do /cotacao: se o Deal Desk perguntou qual
    # serviço o cliente quer, a resposta em texto livre do vendedor conclui a
    # cotação aqui — sem passar pelo NLU. Mensagens sem serviço/plano seguem
    # o fluxo normal (a conversa não é sequestrada).
    try:
        import deal_memory
        import deal_desk
        if deal_memory.get_pending(user_id):
            memo = await asyncio.to_thread(
                deal_desk.complete_pending_quote, user_id, message_text, name
            )
            if memo:
                return memo
    except Exception:
        logger.exception("Erro na continuação do /cotacao pendente")

    # Classificar a intenção e extrair argumentos (LLM.call é síncrono —
    # roda em worker thread para não bloquear o event loop do bot)
    cmd, args = await asyncio.to_thread(classify_intent_and_arguments, message_text, role)
    logger.info(f"NLU Conversational Router: '{message_text}' -> /{cmd} {args}")

    # Redireciona intenções de orçamento/cotação no chat livre para a SDR Ceres Vendas.
    # Isso evita expor planilhas de margem e limites de negociação internos no chat geral,
    # mantendo a conversa humana, natural e alinhada com as melhores práticas de SPIN Selling e FITD.
    if cmd == "cotacao":
        return await _run_department_cmd("sales", "vendas", [message_text], name)

    # Retornar marcadores para comandos legados que são executados diretamente no bot
    if cmd in ("status", "resumo"):
        return "__CLASSIFIED_STATUS__"
    elif cmd == "calc":
        return f"__CLASSIFIED_CALC__{' '.join(args)}"
    elif cmd in ("instagram", "criativo"):
        return "__CLASSIFIED_INSTAGRAM__"
    elif cmd == "ajuda":
        return "__CLASSIFIED_AJUDA__"
    elif cmd == "start":
        return "__CLASSIFIED_START__"

    # Caso contrário, roda no departamento CrewAI correspondente
    return await handle_command(user_id, f"/{cmd}", args)
