# Telegram Bot Integration — Agrostech Digital Company
## Canal de Acesso para Funcionários ao Sistema Inteligente

```yaml
integration_id: "telegram_bot_v1"
integration_name: "Agrostech Telegram Bot"
bot_handle: "@AgrosTechBot (a configurar)"
purpose: "Acesso controlado dos funcionários ao sistema de IA da Agrostech"
primary_users:
  - "Field Pilot (Humano)"
  - "Data Processing Specialist (Humano)"
  - "Equipe de Vendas (opcional)"
access_model: "RBAC — Role-Based Access Control"
version: "1.0"
status: "RECOMENDADO — Implementar após ClickUp"
updated: "Junho 2026"
```

---

## 1. Análise de Viabilidade — Resumo Executivo

### ✅ Conclusão: VIÁVEL e RECOMENDADO

O Telegram é uma plataforma robusta para conectar funcionários ao sistema digital da Agrostech. Aqui está a análise completa:

| Critério | Avaliação | Detalhe |
|----------|-----------|---------|
| **Custo** | ✅ Gratuito | API do Telegram Bot é gratuita e sem limites de uso |
| **Velocidade de implementação** | ✅ Rápida (3-5 dias) | Frameworks Python maduros disponíveis |
| **Adoção pelos usuários** | ✅ Alta | Telegram é amplamente usado no Brasil |
| **Segurança** | ✅ Aceitável | Requer RBAC personalizado (não nativo) |
| **Confiabilidade** | ✅ Alta | 99%+ uptime do Telegram |
| **Controle de acesso por papel** | ✅ Possível | Requer implementação de middleware próprio |
| **Integração com ClickUp** | ✅ Simples | Via webhooks e ClickUp API |
| **Offline** | ⚠️ Limitação | Requer conexão com internet |
| **Acesso em área rural remota** | ⚠️ Atenção | Depende de sinal 3G/4G no campo |

---

## 2. Arquitetura do Telegram Bot

```
╔══════════════════════════════════════════════════════════════╗
║                 AGROSTECH DIGITAL COMPANY                    ║
║                                                              ║
║  CEO ──► COO ──► Chief Pilot ──► [Evento de missão]         ║
║                                         │                    ║
║              ┌──────────────────────────▼──────────────┐    ║
║              │         BOT ENGINE (Python)              │    ║
║              │  • python-telegram-bot v21+              │    ║
║              │  • Middleware de RBAC                    │    ║
║              │  • ClickUp API Client                    │    ║
║              │  • DB de permissões (PostgreSQL/SQLite)  │    ║
║              └──────────────────────────┬──────────────┘    ║
╚═══════════════════════════════════════════════════════════════╝
                                          │
                              ┌───────────▼───────────┐
                              │   TELEGRAM API SERVER  │
                              │   (api.telegram.org)   │
                              └───────────┬───────────┘
                                          │
                     ┌────────────────────┼────────────────────┐
                     │                    │                     │
          ┌──────────▼──────┐  ┌──────────▼──────┐  ┌─────────▼───────┐
          │  📱 Field Pilot │  │  💻 Data Process│  │  👔 Sales Team  │
          │  (Celular)      │  │  (Desktop)      │  │  (Opcional)     │
          └─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 3. Modelo de Acesso por Papel (RBAC)

### Definição de Papéis

| Papel | Telegram ID | Permissões |
|-------|-------------|-----------|
| `admin` | CEO/COO (proprietários) | Tudo — ver relatórios, gerenciar usuários, forçar ações |
| `chief_pilot` | Piloto Chefe | Ver missões, criar briefings, ver status de campo |
| `field_pilot` | Pilotos de Campo | Ver suas missões, atualizar status, reportar incidente |
| `data_processing` | Analistas de Dados | Ver missões com dados prontos, atualizar progresso, entregar |
| `sales` | Sales Reps | Ver pipeline próprio, registrar lead, ver comissões |
| `content_director` | Diretor de Conteúdo | Gerenciar calendário, distribuir tarefas, gate final de aprovação |
| `instagram_image` | Especialista Imagem IG | Ver briefings de posts, submeter prompts e posts para review |
| `instagram_reels` | Especialista Reels IG | Ver briefings de posts, submeter roteiros e links de vídeo |
| `tiktok` | Especialista TikTok | Ver briefings, monitorar trends, submeter roteiros duais |
| `visual_identity` | Guardião de Marca | Revisar posts, aprovar/reprovar assets contra Brand Style Guide |
| `read_only` | Visitantes / Gestores | Ver dashboards e relatórios, sem ações |

### Mapa de Comandos por Papel

| Comando | field_pilot | data_processing | sales | content_director | visual_identity | admin |
|---------|-------------|----------------|-------|------------------|-----------------|-------|
| `/event` — Captura Inteligente de Evento (ver §4.6) | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `/status` — ver minhas tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/missoes` — listar missões do dia | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `/briefing [ID]` — ver briefing completo | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/iniciar [ID]` — iniciar voo | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/concluir [ID]` — concluir voo/task | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/incidente [ID]` — reportar incidente | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/processando [ID]` — processar dados | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `/qa_ok [ID]` — QA aprovado | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `/briefing_mkt [ID]` — ver briefing MKT | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/trends` — ver trends do TikTok/Reels | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/revisar_mkt [ID]` — revisar post contra marca | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/aprovar_mkt [ID]` — gate final de aprovação | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/post_status [ID]` — ver status do post | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/relatorio` — ver relatórios gerenciais | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/usuarios` — gerenciar usuários e papéis | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/ajuda` — ver comandos disponíveis | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 4. Fluxos Principais por Papel

### 4.1 Field Pilot — Fluxo de Missão

```
Bot: 📋 Nova missão atribuída!
     Fazenda: São João | Área: 450ha | Data: 19/06
     Tipo: NDVI + Ortofoto
     Autorização DECEA: ✅ Obtida
     
     [Ver Briefing Completo] [Confirmar Recebimento]

Piloto: [Confirmar Recebimento]

Bot: ✅ Confirmado! Briefing salvo.
     Lembrete configurado para amanhã às 06:30.
     
     📎 Checklist D-1 disponível no ClickUp:
     https://app.clickup.com/t/XXXXXXXX

---

[No dia da missão, 06:30]

Bot: 🌅 Bom dia! Missão de hoje:
     📍 Fazenda São João — 08:00
     🌤️ Previsão: Ensolarado, vento 4 m/s ✅
     
     [Iniciar Missão] [Reportar Problema]

Piloto: [Iniciar Missão]

Bot: 🛸 Missão iniciada às 08:12
     COO Agent notificado.
     Em caso de incidente, use /incidente
     
     [Concluir Missão] [Reportar Incidente]

---

[Após missão]

Piloto: /concluir SF001

Bot: ✅ Missão concluída! Preencha o pós-missão:
     
     📊 Imagens coletadas: [Digite o número]
     
Piloto: 1.847

Bot: 📂 Link para upload dos dados:
     https://drive.google.com/upload/XXXXX
     
     Após upload, confirme:
     [Upload Concluído] 

Piloto: [Upload Concluído]

Bot: 🎉 Perfeito! 
     ✅ Data Processing notificado
     ✅ COO Agent atualizado
     ✅ Task ClickUp marcada como concluída
     
     Prazo de processamento: até 19/06 às 21:00
```

---

### 4.2 Data Processing — Fluxo de Processamento

```
Bot: 🗺️ Dados disponíveis para processamento!
     Missão: Fazenda São João
     Imagens: 1.847 fotos (RGB + Multiespectral)
     GCPs: 7 pontos
     Anomalias reportadas: Nenhuma
     
     Prazo de entrega: 19/06 às 21:00 (6h restantes)
     Link de download: [Acessar Dados]
     
     [Iniciar Processamento] [Ver Detalhes no ClickUp]

Analista: [Iniciar Processamento]

Bot: ⏱️ Processamento iniciado. Timer ativo.
     Prazo: 21:00 (5h 58min)
     
     Atualize o progresso:
     [Fotogrametria OK] [NDVI OK] [QA Iniciado] [Problema?]

Analista: [Fotogrametria OK]

Bot: ✅ Fotogrametria marcada.
     GSD: [Digite o valor em cm/px]

Analista: 2.8

Bot: ✅ GSD 2.8 cm/px — Dentro do padrão (≤ 3 cm/px)
     
     [NDVI OK] [QA Iniciado] [Problema?]

...

Bot: ✅ QA aprovado. Produto pronto!
     
     Gere o link de entrega e confirme:
     Link dos arquivos: [Digite URL]

Analista: https://drive.google.com/PRODUTO_FINAL

Bot: 📦 Entrega registrada!
     ✅ Delivery Agent notificado
     ✅ Account Manager informado
     ✅ Task ClickUp: Pronto para entrega
     
     ⏱️ Tempo total de processamento: 4h 32min ✅
```

---

### 4.3 Admin — Gestão de Usuários

```
Admin: /usuarios

Bot: 👥 GESTÃO DE USUÁRIOS
     
     Usuários ativos:
     • João Silva (@joaopiloto) — field_pilot ✅
     • Maria Santos (@msantos) — data_processing ✅
     
     [Adicionar Usuário] [Remover Usuário] [Ver Logs]

Admin: [Adicionar Usuário]

Bot: Compartilhe o @username ou user_id do novo membro:

Admin: @novopiloto

Bot: Papel para @novopiloto:
     [Field Pilot] [Data Processing] [Chief Pilot] [Read Only]

Admin: [Field Pilot]

Bot: ✅ @novopiloto adicionado como field_pilot
     Eles receberão uma mensagem de boas-vindas.
     Acesso liberado para: /status /missoes /briefing /iniciar /concluir /incidente
```

---

### 4.6 Sales Rep / Chief Pilot — Captura Inteligente de Evento (`/event`)

> Implementado em `runner/event_capture.py` (lógica) + `runner/drive_client.py`
> (espelho opcional no Google Drive). Nasceu para o Congresso AvAg 2026
> (`playbooks/PLANO_CONGRESSO_AVAG_2026.md`), mas o código é genérico —
> troque `EVENT_CODE` em `event_capture.py` para reusar no próximo evento.

**Problema que resolve:** no estande, ninguém para pra preencher formulário.
O rep fala, fotografa o crachá, solta o cartão de visita e segue andando.
O `/event` transforma esse fluxo bagunçado numa ficha organizada por lead,
sem nenhum passo extra além de abrir o lead uma vez.

```
Rep: /event novo Fazenda Progresso

Bot: 🆕 Novo lead aberto: Fazenda Progresso
     Agora é só mandar texto, foto do crachá/fazenda ou documento — tudo
     cai automaticamente na ficha desse lead. Quando terminar a conversa:
     /event fechar

Rep: Produtor João, 500ha de soja, WhatsApp 62999998888, Rio Verde GO

Bot: 📝 Anotado na ficha.

Rep: [envia foto do crachá]

Bot: 📎 Salvo na ficha.

Rep: /event fechar

Bot: ✅ Lead Fazenda Progresso fechado.

     Nome: João
     Empresa_Fazenda: Fazenda Progresso
     WhatsApp: 62999998888
     UF_Cidade: Rio Verde, GO
     Area_ha: 500
     Cultura: Soja
     Perfil: 🟢 Usina-fazenda-cooperativa
     Interesse: (vazio)
     Proximo_passo: (vazio)

Rep: /event followup

Bot: ✍️ Escrevendo o follow-up...
     📲 Cole isso no WhatsApp de Fazenda Progresso:

     "Boa noite, João! Foi ótimo te conhecer hoje no AvAg..."
```

**Onde fica salvo:** `runner/data/AvAg2026/<slug-do-lead>/` — um `_ficha.md`
(cartão estruturado, atualizado por IA a cada mensagem nova), um `log.md`
(histórico bruto, nunca sobrescrito) e uma pasta `midia/` com tudo que foi
enviado. Se `GOOGLE_DRIVE_SYNC=true` estiver configurado no `.env`, a mesma
árvore é espelhada dentro de uma pasta **Agrostech → AvAg2026 → `<lead>`**
no Google Drive (ver o cabeçalho de `drive_client.py` para o setup).

Sem lead ativo, `/event` não interfere em nada — foto/documento/texto seguem
o comportamento normal do bot (NLU/CrewAI).

---

## 5. Notificações Automáticas do Sistema

O Bot envia notificações automáticas para os funcionários. Estas não requerem comando — são disparadas pelos agentes digitais e automações do ClickUp:

### Notificações para Field Pilot
| Evento | Mensagem | Urgência |
|--------|----------|----------|
| Nova missão atribuída | "📋 Nova missão: [Fazenda] em [Data]. Ver ClickUp." | Normal |
| Lembrete D-1 (dia anterior) | "🔔 Missão amanhã: [Fazenda]. Checar equipamentos." | Normal |
| Lembrete D-0 (manhã do voo) | "🌅 Hoje é dia de voo! Previsão do tempo + checklist." | Alta |
| Missão cancelada | "⚠️ Missão cancelada: [Fazenda]. Motivo: [Razão]." | Urgente |
| Prazo de upload próximo | "⏰ Fazer upload dos dados da [Fazenda] em até 1h." | Alta |

### Notificações para Data Processing
| Evento | Mensagem | Urgência |
|--------|----------|----------|
| Dados disponíveis | "🗺️ Dados prontos: [Fazenda]. Prazo: [Hora]." | Alta |
| Prazo em 2 horas | "⚠️ URGENTE: Entrega de [Fazenda] em 2h." | Urgente |
| Reprocessamento necessário | "🔄 Reprocessar [Fazenda]: [Motivo]." | Urgente |

### Notificações para Todos (Admin)
| Evento | Mensagem |
|--------|----------|
| Incidente reportado | "🚨 INCIDENTE: [Piloto] reportou incidente em [Fazenda]." |
| SLA em risco | "⚠️ SLA: Entrega de [Fazenda] está em risco de atraso." |
| Missão concluída com sucesso | "✅ Missão concluída: [Fazenda]. Dados processados." |

---

## 6. Implementação Técnica

### Stack Recomendado

```python
# requirements.txt
python-telegram-bot==21.5      # Framework principal
sqlalchemy==2.0.23             # ORM para banco de permissões
aiohttp==3.9.1                 # HTTP async para ClickUp API
python-dotenv==1.0.0           # Variáveis de ambiente
psycopg2-binary==2.9.9         # PostgreSQL (produção)
# ou
aiosqlite==0.20.0              # SQLite (desenvolvimento)
```

### Estrutura do Projeto Bot

```
agrostech_bot/
├── bot.py                  ← Ponto de entrada principal
├── config.py               ← Configurações e variáveis de ambiente
├── database/
│   ├── models.py           ← Modelos: User, Role, Permission, AuditLog
│   └── crud.py             ← Operações de banco de dados
├── middleware/
│   └── rbac.py             ← Gatekeeper de permissões por papel
├── handlers/
│   ├── field_pilot.py      ← Comandos do Field Pilot
│   ├── data_processing.py  ← Comandos do Data Processing
│   ├── admin.py            ← Comandos de administração
│   └── common.py           ← /ajuda, /status, /missoes
├── services/
│   ├── clickup.py          ← Cliente da ClickUp API
│   ├── notifications.py    ← Envio de mensagens proativas
│   └── mission_flow.py     ← Lógica de fluxo de missão
└── .env                    ← BOT_TOKEN, CLICKUP_KEY, DB_URL (nunca no Git!)
```

### Middleware RBAC — Implementação Núcleo

```python
# middleware/rbac.py
from functools import wraps
from telegram import Update
from telegram.ext import ContextTypes
from database.crud import get_user_role, log_access_attempt

# Mapeamento de permissões por papel
ROLE_PERMISSIONS = {
    "admin": ["*"],  # Tudo
    "chief_pilot": ["status", "missoes", "briefing", "iniciar_remoto", "incidente", "relatorio"],
    "field_pilot": ["status", "missoes", "briefing", "iniciar", "concluir", "incidente"],
    "data_processing": ["status", "missoes", "processando", "qa_ok", "concluir"],
    "sales": ["status", "pipeline", "lead"],
    "read_only": ["status", "relatorio"],
}


def require_role(*allowed_permissions: str):
    """
    Decorator que verifica se o usuário tem permissão para executar um comando.
    
    Uso:
        @require_role("iniciar")
        async def handle_iniciar(update, context):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
            user_id = update.effective_user.id
            username = update.effective_user.username
            command = func.__name__
            
            # Busca papel do usuário no banco
            user_role = await get_user_role(user_id)
            
            if not user_role:
                await log_access_attempt(user_id, username, command, "UNAUTHORIZED")
                await update.message.reply_text(
                    "🚫 Acesso não autorizado.\n"
                    "Você não está cadastrado no sistema Agrostech.\n"
                    "Contate seu supervisor para solicitar acesso."
                )
                return
            
            # Admin tem acesso total
            if user_role == "admin" or "*" in ROLE_PERMISSIONS.get(user_role, []):
                await log_access_attempt(user_id, username, command, "ALLOWED")
                return await func(update, context)
            
            # Verifica permissão específica
            user_permissions = ROLE_PERMISSIONS.get(user_role, [])
            has_permission = any(perm in user_permissions for perm in allowed_permissions)
            
            if not has_permission:
                await log_access_attempt(user_id, username, command, "DENIED")
                await update.message.reply_text(
                    f"🚫 Sem permissão para este comando.\n"
                    f"Seu papel ({user_role}) não tem acesso a esta função.\n"
                    f"Seus comandos disponíveis: /ajuda"
                )
                return
            
            await log_access_attempt(user_id, username, command, "ALLOWED")
            return await func(update, context)
        
        return wrapper
    return decorator


# Exemplo de uso nos handlers:
# @require_role("iniciar")
# async def cmd_iniciar_missao(update, context):
#     ...
```

### Modelo de Banco de Dados

```python
# database/models.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    """Usuários autorizados do Telegram Bot."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    telegram_id = Column(Integer, unique=True, nullable=False)  # user.id do Telegram
    telegram_username = Column(String(100))
    full_name = Column(String(200))
    role = Column(String(50), nullable=False)  # field_pilot, data_processing, etc.
    is_active = Column(Boolean, default=True)
    added_by_admin_id = Column(Integer)
    added_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime)

class AuditLog(Base):
    """Log de todas as ações realizadas pelo bot — compliance e segurança."""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True)
    telegram_id = Column(Integer, nullable=False)
    telegram_username = Column(String(100))
    command = Column(String(100))
    action_result = Column(String(20))  # ALLOWED, DENIED, UNAUTHORIZED
    details = Column(String(500))
    timestamp = Column(DateTime, default=datetime.utcnow)
```

---

## 7. Considerações de Segurança

### Princípios de Segurança Implementados

| Princípio | Implementação |
|-----------|---------------|
| **Princípio do Mínimo Privilégio** | Cada papel tem apenas os comandos necessários |
| **Autenticação por user_id** | Telegram user_id (integer) — não por username (mutável) |
| **Audit Log Completo** | Toda ação registrada com timestamp, quem fez, o quê |
| **Token Seguro** | BOT_TOKEN em variável de ambiente, nunca no código |
| **Input Validation** | Todo input tratado como não confiável |
| **Rate Limiting** | Máximo de 10 comandos/minuto por usuário |
| **HTTPS** | Webhooks do Telegram sempre via HTTPS |
| **Onboarding Controlado** | Somente admins podem adicionar novos usuários |

### Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Token do bot comprometido | Baixo | Ambiente seguro + rotação periódica |
| Usuário compartilha acesso | Médio | Audit log detecta IPs/dispositivos incomuns |
| Comando de missão errado | Baixo | Confirmação dupla para ações críticas |
| Funcionário demitido ainda tem acesso | Médio | Admin desativa conta imediatamente (`is_active=False`) |
| Bot cai / indisponível | Baixo | ClickUp continua funcionando independentemente |

---

## 8. Comparativo: Telegram vs. Alternativas

| Critério | **Telegram Bot** | WhatsApp Business API | Slack | Microsoft Teams |
|----------|-----------------|----------------------|-------|----------------|
| Custo | **🟢 Gratuito** | 🔴 Por mensagem (caro) | 🟡 Freemium | 🔴 Pago |
| Familiaridade Brasil | **🟢 Alta** | 🟢 Alta | 🟡 Corporativo | 🟡 Corporativo |
| API de Bot | **🟢 Excelente** | 🟡 Complexa | 🟢 Boa | 🟡 Complexa |
| Acesso em campo | **🟢 App móvel leve** | 🟢 App móvel | 🔴 Pesado | 🔴 Pesado |
| RBAC personalizado | **🟢 Possível** | 🟡 Limitado | 🟢 Nativo | 🟢 Nativo |
| Privacidade | **🟢 Alta** | 🔴 Meta/ads | 🟡 Médio | 🟡 Microsoft |
| Setup inicial | **🟢 Rápido (3-5 dias)** | 🔴 Burocrático | 🟡 Médio | 🟡 Médio |

**Recomendação: Telegram Bot é a melhor escolha para a Agrostech**, dado o perfil de usuários (trabalhadores de campo no Brasil), custo zero e velocidade de implementação.

---

## 9. Plano de Implementação

### Fase 1 — MVP (Semana 1-2)
- [ ] Criar bot via @BotFather no Telegram
- [ ] Setup do servidor (pode ser VPS simples ~R$50/mês ou Railway.app gratuito)
- [ ] Implementar banco de dados SQLite → migrar para PostgreSQL
- [ ] Implementar middleware RBAC
- [ ] Comandos básicos: `/start`, `/ajuda`, `/status`, `/missoes`
- [ ] Integração básica com ClickUp API

### Fase 2 — Fluxo de Missão (Semana 3)
- [ ] Comandos de Field Pilot: `/briefing`, `/iniciar`, `/concluir`, `/incidente`
- [ ] Notificações automáticas (briefing, lembretes, alertas)
- [ ] Fluxo completo de pós-missão + upload

### Fase 3 — Data Processing (Semana 4)
- [ ] Comandos de Data Processing: `/processando`, `/qa_ok`, `/concluir`
- [ ] Notificações de prazo e urgência
- [ ] Integração com Delivery Agent

### Fase 4 — Admin & Refinamento (Semana 5)
- [ ] Painel de admin: `/usuarios`, gestão de papéis
- [ ] Dashboard de audit logs
- [ ] Testes de segurança e penetração básicos
- [ ] Documentação de uso para funcionários

---

## 10. Mensagem de Boas-Vindas (Onboarding do Funcionário)

```
Quando um novo usuário é adicionado pelo admin, recebe:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚁 Bem-vindo ao Agrostech Bot!

Olá [Nome]! Você foi adicionado ao sistema 
digital da Agrostech com o papel de: Field Pilot

Seus comandos disponíveis:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 /missoes — Ver missões do dia
🗂️ /briefing [ID] — Ver briefing completo
▶️ /iniciar [ID] — Iniciar missão
✅ /concluir [ID] — Concluir missão
🚨 /incidente [ID] — Reportar incidente
❓ /ajuda — Ver todos os comandos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Você também receberá notificações automáticas
quando novas missões forem atribuídas.

Em caso de dúvidas, contate seu supervisor.
Boa sorte nas missões! 🛸
```

---

*Agrostech | Telegram Bot Integration v1.0 | Junho 2026*
*"O bot é a voz do sistema digital nos bolsos dos nossos trabalhadores de campo."*
