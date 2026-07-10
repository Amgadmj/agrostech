"""
Agrostech Digital Twin — CEO Agent Runner
Instantiates and runs the CEO agent interactively or programmatically.

Usage:
    # Interactive mode
    python ceo_agent.py

    # Programmatic mode
    from ceo_agent import ceo

    response = ceo.chat("Qual é o nosso forecast de receita para Q3?")
    print(response)
"""

import os
import sys
from pathlib import Path

# Add runner directory to path
sys.path.insert(0, str(Path(__file__).parent))

from base_agent import AgrostechAgent


# ─────────────────────────────────────────────
# Initialize CEO Agent
# ─────────────────────────────────────────────

ceo = AgrostechAgent(
    agent_id="ceo_001",
    persona_file="agents/c-suite/ceo.md",
    knowledge_topics=[
        "PRICING_MODEL",
        "CARBON_CREDITS",
        "DRONE_REGULATIONS",
    ],
)


# ─────────────────────────────────────────────
# Example Programmatic Use Cases
# ─────────────────────────────────────────────

def weekly_okr_review() -> str:
    """Simulate the CEO's weekly OKR review prompt."""
    prompt = """
    É segunda-feira. Hora da revisão semanal de OKRs.
    
    Dados desta semana:
    - Novos contratos fechados: 2 (R$ 18.000 + R$ 35.000)
    - Pipeline total atual: R$ 320.000
    - NPS última entrega: 8/10
    - Missões realizadas na semana: 3
    - Incidentes: 0
    
    Como você avalia o progresso dos OKRs e quais são suas 3 prioridades para esta semana?
    """
    return ceo.chat(prompt)


def strategic_decision(scenario: str) -> str:
    """Ask the CEO to evaluate a strategic decision."""
    return ceo.chat(f"Preciso de uma avaliação estratégica: {scenario}")


def new_market_analysis(state: str, opportunity: str) -> str:
    """CEO analysis of entering a new market."""
    prompt = f"""
    Temos uma oportunidade de expansão para o estado de {state}.
    Contexto: {opportunity}
    
    Qual é sua análise sobre entrar neste mercado? 
    Quais seriam os primeiros passos e os principais riscos?
    """
    return ceo.chat(prompt)


# ─────────────────────────────────────────────
# Interactive CLI
# ─────────────────────────────────────────────

def run_interactive():
    """Run the CEO agent in interactive mode."""
    print("\n" + "="*60)
    print("AGROSTECH - CEO AGENT")
    print("="*60)
    print("Voce esta conversando com o CEO da Agrostech.")
    print("Digite 'sair' para encerrar | 'reset' para nova sessao")
    print("Digite 'okr' para revisar OKRs | 'help' para comandos")
    print("="*60 + "\n")

    # Quick demo commands
    commands = {
        "okr": weekly_okr_review,
        "help": lambda: """
Comandos disponiveis:
  okr    - Revisao semanal de OKRs
  reset  - Nova sessao de conversa
  sair   - Encerrar
  
Ou simplesmente faca qualquer pergunta estrategica!
""",
    }

    while True:
        try:
            user_input = input("Voce -> ").strip()

            if not user_input:
                continue

            if user_input.lower() == "sair":
                print("\nEncerrando sessao do CEO. Ate a proxima reuniao!")
                break

            if user_input.lower() == "reset":
                ceo.reset_conversation()
                print("Nova sessao iniciada.\n")
                continue

            if user_input.lower() in commands:
                response = commands[user_input.lower()]()
            else:
                response = ceo.chat(user_input)

            print(f"\nCEO -> {response}\n")
            print("-" * 40 + "\n")

        except KeyboardInterrupt:
            print("\n\nSessao interrompida.")
            break
        except Exception as e:
            print(f"\n[ERROR] Erro: {e}\n")


# ─────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Run with command line argument
        query = " ".join(sys.argv[1:])
        print(f"\nCEO Agent respondendo: '{query}'\n")
        response = ceo.chat(query)
        print(response)
    else:
        # Interactive mode
        run_interactive()
