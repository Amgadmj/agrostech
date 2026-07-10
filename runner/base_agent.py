"""
Agrostech Digital Twin — Base Agent
Base class for all Agrostech AI agents.

Usage:
    from base_agent import AgrostechAgent

    agent = AgrostechAgent(
        agent_id="ceo_001",
        persona_file="agents/c-suite/ceo.md",
        model="gemini-1.5-pro"
    )
    response = agent.chat("Qual é o status do pipeline de vendas?")
"""

import os
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Optional


# ─────────────────────────────────────────────
# Optional: use openai, anthropic, or google-generativeai
# Install whichever backend you prefer:
#   pip install google-generativeai   (Gemini)
#   pip install openai                (GPT)
#   pip install anthropic             (Claude)
# ─────────────────────────────────────────────

try:
    import google.generativeai as genai
    BACKEND = "gemini"
except ImportError:
    BACKEND = "mock"
    print("[WARNING] No LLM backend found. Running in mock mode.")
    print("   Install: google-generativeai")


AGENTS_ROOT = Path(__file__).parent.parent / "agents"
KNOWLEDGE_ROOT = Path(__file__).parent.parent / "knowledge-base"
LOGS_DIR = Path(__file__).parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)


def load_persona(persona_file: str) -> str:
    """Load agent persona from markdown file and extract the system prompt."""
    path = Path(__file__).parent.parent / persona_file
    if not path.exists():
        raise FileNotFoundError(f"Persona file not found: {path}")

    content = path.read_text(encoding="utf-8")

    # Try to extract the system prompt block from the markdown
    match = re.search(r"```\n(Você é .+?)```", content, re.DOTALL)
    if match:
        return match.group(1).strip()

    # Fallback: return the whole file content
    return content


def load_knowledge(topics: list[str]) -> str:
    """Load relevant knowledge base files."""
    knowledge = ""
    for topic in topics:
        kb_file = KNOWLEDGE_ROOT / f"{topic}.md"
        if kb_file.exists():
            knowledge += f"\n\n---\n## Conhecimento: {topic}\n"
            knowledge += kb_file.read_text(encoding="utf-8")
    return knowledge


class AgrostechAgent:
    """Base class for all Agrostech digital twin agents."""

    def __init__(
        self,
        agent_id: str,
        persona_file: str,
        knowledge_topics: Optional[list[str]] = None,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        self.agent_id = agent_id
        self.persona_file = persona_file
        self.knowledge_topics = knowledge_topics or []
        self.model = model
        self.conversation_history = []

        # Load persona
        self.system_prompt = load_persona(persona_file)

        # Append knowledge base context
        if self.knowledge_topics:
            kb_context = load_knowledge(self.knowledge_topics)
            self.system_prompt += f"\n\n{kb_context}"

        # Setup backend
        self._setup_backend(api_key)

        print(f"[OK] Agent [{self.agent_id}] initialized | Backend: {self.current_backend}")

    def _setup_backend(self, api_key: Optional[str]):
        """Initialize the chosen LLM backend."""
        self.current_backend = BACKEND

        if BACKEND == "gemini":
            key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            if not key:
                print(f"[WARNING] No GEMINI_API_KEY found. Falling back to mock backend for [{self.agent_id}].")
                self.current_backend = "mock"
                return
            genai.configure(api_key=key)
            default_model = os.getenv("GEMINI_MODEL") or "gemini-2.5-flash"
            self._model = genai.GenerativeModel(
                model_name=self.model or default_model,
                system_instruction=self.system_prompt,
            )
            self._chat = self._model.start_chat(history=[])



    def chat(self, message: str, context: Optional[str] = None) -> str:
        """
        Send a message to the agent and get a response.

        Args:
            message: The user's message to the agent
            context: Optional additional context (e.g., data from another agent)

        Returns:
            The agent's response as a string
        """
        full_message = message
        if context:
            full_message = f"[Contexto adicional]\n{context}\n\n[Mensagem]\n{message}"

        self.conversation_history.append({
            "role": "user",
            "content": full_message,
            "timestamp": datetime.now().isoformat()
        })

        response = self._call_llm(full_message)

        self.conversation_history.append({
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now().isoformat()
        })

        self._log_interaction(full_message, response)
        return response

    def _call_llm(self, message: str) -> str:
        """Call the configured LLM backend."""
        if self.current_backend == "mock":
            return f"[MOCK] Agente {self.agent_id} recebeu: '{message[:50]}...'"

        elif self.current_backend == "gemini":
            response = self._chat.send_message(message)
            return response.text

        return "[Erro: backend não reconhecido]"

    def brief_other_agent(self, target_agent: "AgrostechAgent", briefing: str) -> str:
        """
        Send a briefing to another agent (inter-agent communication).

        Args:
            target_agent: The agent to send the briefing to
            briefing: The message/context to pass

        Returns:
            The target agent's response
        """
        context = f"[Briefing recebido de: {self.agent_id}]"
        print(f"\n[BRIEFING] {self.agent_id} -> {target_agent.agent_id}")
        print(f"   Briefing: {briefing[:100]}...")
        response = target_agent.chat(briefing, context=context)
        print(f"   Resposta: {response[:100]}...")
        return response

    def get_conversation_summary(self) -> dict:
        """Return a summary of the conversation history."""
        return {
            "agent_id": self.agent_id,
            "total_turns": len(self.conversation_history),
            "last_interaction": self.conversation_history[-1]["timestamp"] if self.conversation_history else None,
            "history": self.conversation_history
        }

    def _log_interaction(self, message: str, response: str):
        """Log interaction to file for audit trail."""
        log_file = LOGS_DIR / f"{self.agent_id}_{datetime.now().strftime('%Y%m%d')}.jsonl"
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "agent_id": self.agent_id,
            "message": message,
            "response": response
        }
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

    def reset_conversation(self):
        """Reset conversation history (useful for new sessions)."""
        self.conversation_history = []
        if BACKEND == "gemini":
            self._chat = self._model.start_chat(history=[])
        print(f"[RESET] Agent [{self.agent_id}] conversation reset")

    def __repr__(self) -> str:
        return f"AgrostechAgent(id={self.agent_id}, backend={BACKEND}, turns={len(self.conversation_history)})"
