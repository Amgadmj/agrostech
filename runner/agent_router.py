"""
Agrostech — LangGraph Agent Router
Replaces the flat RBAC handler pattern with a stateful directed graph.
Each command is a node; state persists in PostgreSQL across Telegram sessions.

Architecture:
  Telegram Message → Router Node → Specialized Agent Node → Response

Install:
    pip install langgraph langchain-google-genai psycopg2-binary
"""

from __future__ import annotations
import os
import logging
from typing import Annotated, TypedDict, Literal
from pathlib import Path

from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
import sqlite3

load_dotenv(Path(__file__).parent / ".env")

logger = logging.getLogger(__name__)

# ── LLM — Groq (free) with Gemini fallback ────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if GROQ_API_KEY:
    from langchain_groq import ChatGroq
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",  # Free, 70B quality
        api_key=GROQ_API_KEY,
        temperature=0.3,
    )
    logger.info("LLM: Groq llama-3.3-70b-versatile [FREE]")
elif GEMINI_API_KEY:
    from langchain_google_genai import ChatGoogleGenerativeAI
    llm = ChatGoogleGenerativeAI(
        model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        google_api_key=GEMINI_API_KEY,
        temperature=0.3,
    )
    logger.info(f"LLM: Gemini {os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')} [fallback]")
else:
    raise EnvironmentError("Set GROQ_API_KEY or GEMINI_API_KEY in .env")

# ── Agent State ───────────────────────────────────────────────────────────────
class AgrostechState(TypedDict):
    user_id: str | int
    role: str
    name: str
    command: str
    args: list[str]
    messages: Annotated[list[BaseMessage], "conversation_history"]
    response: str
    next_node: str

# ── System Prompts per Agent ──────────────────────────────────────────────────
AGENT_PROMPTS = {
    "agronomist": """Você é o Copiloto Agrônomo da Agrostech — Ceres. 
Você possui expertise em agricultura de precisão, análise de solo, manejo de pragas e doenças.
Responda sempre em Português Brasileiro, de forma clara, objetiva e com dados quando possível.
Contexto da empresa: operamos drones de pulverização como serviço (DaaS) a R$150/hectare.""",

    "operations": """Você é o Agente de Operações da Agrostech.
Gerencia missões de voo, briefings de campo, escalas de pilotos e incidentes.
Responda em Português Brasileiro. Seja preciso, objetivo e seguro.""",

    "sales": """Você é o SDR Autônomo da Agrostech.
Qualifica leads, gera propostas de serviço DaaS (R$150/ha), e gerencia o pipeline.
Busque sempre agendar uma visita ou proposta. Seja consultivo, não agressivo.
Responda em Português Brasileiro.""",

    "marketing": """Você é o Agente de Marketing da Agrostech.
Gera conteúdo para Instagram, TikTok e LinkedIn focado no agronegócio brasileiro.
Conheça nossos 3 pilares: Drones de Pulverização, Portal Solis (satélite), IA Ceres.
Responda em Português Brasileiro.""",

    "intel": """Você é o Agente de Inteligência de Mercado da Agrostech.
Analisa concorrentes, tendências do mercado agro e oportunidades de negócio.
Use dados do setor: mercado de drones agro no Brasil vale R$2bi/ano e cresce 35%/ano.
Responda em Português Brasileiro com insights acionáveis.""",

    "finance_board": """Você é o Conselho Financeiro (Deal Desk) da Agrostech —
Estrategista de Pricing + Analista de Unit Economics + Inteligência de Mercado.
Toda cotação passa por pesquisa do cliente, custos reais e iteração de margem.
Pisos: walk-away 15% | saudável 25% | alvo 35% de margem líquida.
Responda em Português Brasileiro.""",
}

# ── RBAC permission map ───────────────────────────────────────────────────────
COMMAND_AGENT_MAP = {
    "copiloto": ("agronomist", ["admin", "field_pilot", "chief_pilot"]),
    "diagnostico": ("agronomist", ["admin", "field_pilot", "chief_pilot", "sales"]),
    "ndvi": ("agronomist", ["admin", "field_pilot", "chief_pilot", "data_processing"]),
    "monitorar": ("agronomist", ["admin", "data_processing"]),
    "adubar": ("agronomist", ["admin", "field_pilot"]),
    "missoes": ("operations", ["admin", "chief_pilot", "field_pilot"]),
    "briefing": ("operations", ["admin", "chief_pilot", "field_pilot"]),
    "iniciar": ("operations", ["admin", "chief_pilot", "field_pilot"]),
    "concluir": ("operations", ["*"]),
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
}

# ── Database helpers ──────────────────────────────────────────────────────────
DB_PATH = Path(__file__).parent / "telegram_users.db"

def get_user(user_id: str | int) -> tuple[str, str] | tuple[None, None]:
    if not DB_PATH.exists():
        return None, None
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT role, name FROM users WHERE telegram_id=? AND is_active=1", (user_id,))
    row = cur.fetchone()
    conn.close()
    return (row[0].lower(), row[1]) if row else (None, None)

# ── Graph Nodes ───────────────────────────────────────────────────────────────

def router_node(state: AgrostechState) -> AgrostechState:
    """Routes command to the correct agent based on RBAC."""
    cmd = state["command"].lstrip("/").split("@")[0].lower()
    role = state["role"]

    if cmd not in COMMAND_AGENT_MAP:
        state["response"] = f"❓ Comando `/{cmd}` não reconhecido. Use /ajuda para ver seus comandos."
        state["next_node"] = END
        return state

    agent_name, allowed_roles = COMMAND_AGENT_MAP[cmd]

    if "*" not in allowed_roles and role not in allowed_roles and role != "admin":
        state["response"] = (
            f"🚫 Seu perfil ({role.upper()}) não tem acesso ao comando `/{cmd}`.\n"
            "Digite /ajuda para ver os comandos disponíveis para você."
        )
        state["next_node"] = END
        return state

    state["next_node"] = agent_name
    return state

def _run_agent(state: AgrostechState, agent_name: str) -> AgrostechState:
    """Generic LLM agent runner."""
    system_prompt = AGENT_PROMPTS[agent_name]
    cmd = state["command"]
    args = " ".join(state.get("args", []))
    name = state["name"]

    user_msg = f"Usuário: {name} | Comando: {cmd} {args}"
    messages = [HumanMessage(content=f"{system_prompt}\n\n{user_msg}")]

    try:
        response = llm.invoke(messages)
        state["response"] = response.content
    except Exception as e:
        state["response"] = f"⚠️ Erro ao processar: {e}"
    return state

def agronomist_node(state: AgrostechState) -> AgrostechState:
    return _run_agent(state, "agronomist")

def operations_node(state: AgrostechState) -> AgrostechState:
    return _run_agent(state, "operations")

def sales_node(state: AgrostechState) -> AgrostechState:
    return _run_agent(state, "sales")

def marketing_node(state: AgrostechState) -> AgrostechState:
    return _run_agent(state, "marketing")

def intel_node(state: AgrostechState) -> AgrostechState:
    return _run_agent(state, "intel")

def finance_board_node(state: AgrostechState) -> AgrostechState:
    """Deal Desk: cotação (/cotacao), resultado do cliente (/resultado) e
    painel de reaprendizado (/aprendizado)."""
    cmd = state["command"].lstrip("/").split("@")[0].lower()
    args = state.get("args", [])
    try:
        if cmd == "resultado":
            import deal_memory
            state["response"] = deal_memory.handle_resultado(args)
        elif cmd == "aprendizado":
            import deal_memory
            state["response"] = deal_memory.learning_report()
        else:
            import deal_desk
            state["response"] = deal_desk.handle_cotacao(args, rep=state.get("name", ""))
    except Exception as e:
        logger.exception("Deal Desk error")
        state["response"] = f"⚠️ Erro no Deal Desk: {e}"
    return state

# ── Graph Assembly ────────────────────────────────────────────────────────────

def build_graph() -> StateGraph:
    graph = StateGraph(AgrostechState)

    graph.add_node("router", router_node)
    graph.add_node("agronomist", agronomist_node)
    graph.add_node("operations", operations_node)
    graph.add_node("sales", sales_node)
    graph.add_node("marketing", marketing_node)
    graph.add_node("intel", intel_node)
    graph.add_node("finance_board", finance_board_node)

    graph.set_entry_point("router")

    graph.add_conditional_edges(
        "router",
        lambda s: s["next_node"],
        {
            "agronomist": "agronomist",
            "operations": "operations",
            "sales": "sales",
            "marketing": "marketing",
            "intel": "intel",
            "finance_board": "finance_board",
            END: END,
        },
    )

    for node in ["agronomist", "operations", "sales", "marketing", "intel", "finance_board"]:
        graph.add_edge(node, END)

    return graph.compile()

# Compile once at module import — reused across all Telegram updates
agrostech_graph = build_graph()


async def handle_command(user_id: str | int, command: str, args: list[str]) -> str:
    """
    Main entry point called by whatsapp_bot.py or telegram_bot.py for every command.
    Returns the text response to send back to the user.
    """
    role, name = get_user(user_id)
    if not role:
        return (
            "🚫 Acesso não autorizado.\n"
            f"Seu ID: `{user_id}`\n"
            "Informe ao administrador para liberar seu acesso."
        )

    initial_state: AgrostechState = {
        "user_id": user_id,
        "role": role,
        "name": name,
        "command": command,
        "args": args,
        "messages": [],
        "response": "",
        "next_node": "",
    }

    result = await agrostech_graph.ainvoke(initial_state)
    return result["response"]
