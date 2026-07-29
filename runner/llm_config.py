"""
Agrostech — Configuração compartilhada de LLM (CrewAI / LiteLLM)

Ponto único de criação de LLM para todo o sistema (agent_router, deal_desk,
whatsapp_bot, trend_hijacker). IMPORTANTE: importe este módulo ANTES de
qualquer `import crewai` — ele desliga a telemetria via variáveis de ambiente
que precisam existir antes do primeiro import do CrewAI.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

# Higiene: sem telemetria/OTel em produção; logs do LiteLLM só em erro.
os.environ.setdefault("CREWAI_DISABLE_TELEMETRY", "true")
os.environ.setdefault("OTEL_SDK_DISABLED", "true")
os.environ.setdefault("LITELLM_LOG", "ERROR")

from crewai import LLM  # noqa: E402  (após higiene de ambiente, por design)

# Bug do crewai 1.15.2: o executor marca mensagens com a chave "cache_breakpoint"
# (dica de prompt caching) e só os adaptadores nativos (Anthropic, Gemini) a
# removem antes de enviar. No caminho genérico via LiteLLM (usado por provedores
# como Groq), a chave vaza pro payload e a API rejeita ("property 'cache_breakpoint'
# is unsupported"). Corrige removendo a chave antes de litellm.completion() —
# patch no atributo do módulo, então funciona mesmo já importado pelo crewai/llm.py.
try:
    import litellm as _litellm

    _original_completion = _litellm.completion

    def _completion_strip_cache_breakpoint(*args, **kwargs):
        for msg in kwargs.get("messages") or []:
            if isinstance(msg, dict):
                msg.pop("cache_breakpoint", None)
        return _original_completion(*args, **kwargs)

    _litellm.completion = _completion_strip_cache_breakpoint
except ImportError:
    pass


def model_string() -> str:
    """Groq (grátis) se houver chave; senão Gemini. LiteLLM exige o prefixo do provedor."""
    if os.getenv("GROQ_API_KEY"):
        return "groq/llama-3.3-70b-versatile"
    if os.getenv("GEMINI_API_KEY"):
        return f"gemini/{os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')}"
    raise EnvironmentError("Set GROQ_API_KEY or GEMINI_API_KEY in .env")


def get_llm(temperature: float = 0.3) -> LLM:
    """LLM compartilhado. LiteLLM lê GROQ_API_KEY/GEMINI_API_KEY direto do ambiente."""
    return LLM(model=model_string(), temperature=temperature)
