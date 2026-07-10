"""
Agrostech Digital Twin — Sales Agent Runner
Instantiates the full sales team: Head of Sales + Sales Rep agent.

Demonstrates inter-agent communication: Sales Rep → Head of Sales.

Usage:
    python sales_agent.py

    # Or import:
    from sales_agent import head_of_sales, sales_rep
    response = sales_rep.chat("Tenho um lead de uma fazenda de 800 ha em MT")
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from base_agent import AgrostechAgent


# ─────────────────────────────────────────────
# Initialize Sales Team
# ─────────────────────────────────────────────

head_of_sales = AgrostechAgent(
    agent_id="head_of_sales_001",
    persona_file="agents/sales/head_of_sales.md",
    knowledge_topics=["PRICING_MODEL", "CARBON_CREDITS"],
)

sales_rep = AgrostechAgent(
    agent_id="sales_rep_001",
    persona_file="agents/sales/sales_rep.md",
    knowledge_topics=["PRICING_MODEL", "CARBON_CREDITS"],
)


# ─────────────────────────────────────────────
# Sales Scenarios
# ─────────────────────────────────────────────

def qualify_lead(description: str) -> str:
    """Sales Rep qualifies a new lead."""
    prompt = f"""
    Recebi um lead novo. Precisa da sua análise de qualificação.
    
    Descrição do lead:
    {description}
    
    Ele está qualificado? Como devo abordá-lo? Quais perguntas de descoberta usar?
    """
    return sales_rep.chat(prompt)


def build_proposal(
    client_name: str,
    area_ha: int,
    services: list[str],
    pain_points: str
) -> str:
    """Sales Rep builds a proposal."""
    prompt = f"""
    Preciso estruturar uma proposta comercial:
    
    Cliente: {client_name}
    Área: {area_ha} ha
    Serviços solicitados: {', '.join(services)}
    Dores identificadas: {pain_points}
    
    Monte a proposta seguindo nosso playbook. Inclua o valor total, 
    condições de pagamento e próximos passos.
    """
    return sales_rep.chat(prompt)


def pipeline_review() -> str:
    """Head of Sales reviews the weekly pipeline."""
    prompt = """
    É segunda-feira, hora da revisão de pipeline semanal.
    
    Pipeline atual dos 4 reps:
    - Rep 1 (MT/GO): 4 oportunidades ativas | Melhor deal: R$ 45.000 (500 ha soja MT)
    - Rep 2 (PR/RS): 3 oportunidades | Melhor deal: R$ 28.000 (300 ha milho PR)  
    - Rep 3 (Carbono): 2 projetos MRV em negociação | R$ 60.000 + R$ 35.000
    - Rep 4 (Cooperativas): 1 proposta enviada à Coamo (R$ 120.000)
    
    Total pipeline: R$ 388.000
    Meta do trimestre: R$ 450.000
    
    Qual é sua análise? Quais deals priorizar? Onde precisamos de coaching?
    """
    return head_of_sales.chat(prompt)


def escalate_to_hof(lead_description: str, proposed_value: float) -> dict:
    """
    Simulate Sales Rep escalating a big deal to Head of Sales.
    Returns both agents' responses.
    """
    # Sales Rep prepares the escalation
    rep_prompt = f"""
    Tenho um deal grande que precisa de aprovação do Head of Sales.
    
    Lead: {lead_description}
    Valor proposto: R$ {proposed_value:,.0f}
    
    Como devo apresentar este deal para o Head of Sales e quais informações preciso ter?
    """
    rep_response = sales_rep.chat(rep_prompt)

    # Head of Sales evaluates
    hof_prompt = f"""
    O Sales Rep 1 está escalando um deal para aprovação:
    
    {lead_description}
    Valor: R$ {proposed_value:,.0f}
    
    Você aprova a proposta? Há algum ajuste necessário antes de enviar ao cliente?
    """
    hof_response = sales_rep.brief_other_agent(
        head_of_sales,
        hof_prompt
    )

    return {
        "sales_rep": rep_response,
        "head_of_sales": hof_response
    }


# ─────────────────────────────────────────────
# Interactive CLI
# ─────────────────────────────────────────────

def run_interactive():
    """Choose which sales agent to interact with."""
    print("\n" + "="*60)
    print("AGROSTECH - SALES TEAM")
    print("="*60)
    print("1. Sales Rep (Executivo de Contas)")
    print("2. Head of Sales (Gerente Comercial)")
    print("3. Simulação: Qualificação de Lead")
    print("4. Simulação: Revisão de Pipeline")
    print("5. Sair")
    print("="*60)

    while True:
        choice = input("\nEscolha (1-5): ").strip()

        if choice == "1":
            active_agent = sales_rep
            name = "Sales Rep"
        elif choice == "2":
            active_agent = head_of_sales
            name = "Head of Sales"
        elif choice == "3":
            lead = input("Descreva o lead: ")
            print(f"\nQualificando lead...\n")
            print(qualify_lead(lead))
            continue
        elif choice == "4":
            print(f"\nRevisao de Pipeline Semanal...\n")
            print(pipeline_review())
            continue
        elif choice == "5":
            print("Encerrando Sales Team.")
            break
        else:
            print("Opcao invalida.")
            continue

        print(f"\nConversando com: {name}")
        print("Digite 'menu' para voltar | 'sair' para registrar\n")

        while True:
            user_input = input(f"Voce -> ").strip()
            if not user_input:
                continue
            if user_input.lower() == "menu":
                break
            if user_input.lower() == "sair":
                return

            response = active_agent.chat(user_input)
            print(f"\n{name} -> {response}\n")
            print("-" * 40)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        print(f"\nSales Rep respondendo: '{query}'\n")
        print(sales_rep.chat(query))
    else:
        run_interactive()
