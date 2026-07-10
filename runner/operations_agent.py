"""
Agrostech Digital Twin — Operations Agent Runner
Instantiates and runs the Chief Pilot and Data Processing agents.
Simulates a complete field mission workflow.

Usage:
    python operations_agent.py

    from operations_agent import chief_pilot, data_processing
    response = chief_pilot.chat("Temos uma missão de 800 ha em MT amanhã")
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta

sys.path.insert(0, str(Path(__file__).parent))

from base_agent import AgrostechAgent


# ─────────────────────────────────────────────
# Initialize Operations Team
# ─────────────────────────────────────────────

chief_pilot = AgrostechAgent(
    agent_id="chief_pilot_001",
    persona_file="agents/operations/chief_pilot.md",
    knowledge_topics=["DRONE_REGULATIONS"],
)

data_processing = AgrostechAgent(
    agent_id="data_processing_001",
    persona_file="agents/operations/data_processing.md",
    knowledge_topics=["CARBON_CREDITS"],
)


# ─────────────────────────────────────────────
# Mission Scenarios
# ─────────────────────────────────────────────

def plan_mission(
    farm_name: str,
    area_ha: int,
    coordinates: str,
    mission_type: str,
    requested_date: str
) -> str:
    """Chief Pilot plans a new mission."""
    prompt = f"""
    Recebi uma nova missão do COO. Precisa de planejamento completo.
    
    Fazenda: {farm_name}
    Área: {area_ha} ha
    Coordenadas/Localização: {coordinates}
    Tipo de missão: {mission_type}
    Data solicitada pelo cliente: {requested_date}
    
    Faça o planejamento completo incluindo:
    - Número de baterias necessárias
    - Número de GCPs recomendados
    - Altitude e GSD esperado
    - Necessidade de solicitação DECEA (e prazo)
    - Estimativa de tempo de campo
    - Riscos identificados
    """
    return chief_pilot.chat(prompt)


def process_mission_data(
    farm_name: str,
    area_ha: int,
    images_count: int,
    mission_type: str,
    field_notes: str = ""
) -> str:
    """Data Processing agent processes incoming mission data."""
    prompt = f"""
    Recebi dados brutos de uma missão do Field Pilot.
    
    Fazenda: {farm_name}
    Área: {area_ha} ha
    Imagens coletadas: {images_count}
    Tipo: {mission_type}
    Notas de campo: {field_notes if field_notes else 'Nenhuma anomalia reportada'}
    
    Descreva o processo de processamento que você vai executar, 
    os parâmetros que vai usar, os produtos que vai gerar e
    o que vai verificar no QA antes de aprovar a entrega.
    """
    return data_processing.chat(prompt)


def mission_to_delivery_workflow(
    farm_name: str,
    area_ha: int,
    mission_type: str
) -> dict:
    """
    Simulate the full mission -> delivery workflow with inter-agent communication.
    """
    print(f"\n[Workflow] MISSAO COMPLETA: {farm_name} ({area_ha} ha | {mission_type})")
    print("="*60)

    # Step 1: Chief Pilot plans
    print("\nPASSO 1: Planejamento (Chief Pilot)")
    mission_date = (datetime.now() + timedelta(days=7)).strftime("%d/%m/%Y")
    plan = chief_pilot.chat(f"""
        Planeje a missão: {farm_name}, {area_ha} ha de {mission_type}.
        Data solicitada: {mission_date}.
        Faça um briefing conciso para o Field Pilot.
    """)
    print(f"Chief Pilot: {plan[:300]}...")

    # Step 2: Data Processing receives data
    print("\nPASSO 2: Processamento de Dados")
    estimated_images = area_ha * 2  # rough estimate
    processing = chief_pilot.brief_other_agent(
        data_processing,
        f"""
        Missão de {farm_name} concluída com sucesso.
        Dados: {estimated_images} imagens de {area_ha} ha ({mission_type})
        Condições: Boas, sem anomalias.
        Por favor, inicie o processamento e informe prazo de entrega.
        """
    )
    print(f"Data Processing: {processing[:300]}...")

    return {
        "farm": farm_name,
        "area_ha": area_ha,
        "mission_type": mission_type,
        "mission_date": mission_date,
        "planning_summary": plan,
        "processing_summary": processing
    }


# ─────────────────────────────────────────────
# Interactive CLI
# ─────────────────────────────────────────────

def run_interactive():
    print("\n" + "="*60)
    print("AGROSTECH - OPERATIONS TEAM")
    print("="*60)
    print("1. Chief Pilot (Planejamento e Segurança)")
    print("2. Data Processing (Geoprocessamento)")
    print("3. Simulação: Planejar nova missão")
    print("4. Simulação: Workflow missão -> entrega")
    print("5. Sair")
    print("="*60)

    while True:
        choice = input("\nEscolha (1-5): ").strip()

        if choice == "1":
            active_agent = chief_pilot
            name = "Chief Pilot"
        elif choice == "2":
            active_agent = data_processing
            name = "Data Processing"
        elif choice == "3":
            farm = input("Nome da fazenda: ")
            area = int(input("Área (ha): ") or "500")
            mtype = input("Tipo (ortofoto/ndvi/mde/mrv): ") or "ortofoto + ndvi"
            date = input("Data solicitada (dd/mm/aaaa): ") or "próxima semana"
            coords = input("Localização (município/UF): ") or "Sorriso/MT"
            print(f"\nPlanejando missao...\n")
            print(plan_mission(farm, area, coords, mtype, date))
            continue
        elif choice == "4":
            farm = input("Nome da fazenda: ")
            area = int(input("Área (ha): ") or "500")
            mtype = input("Tipo de missão: ") or "mapeamento agrícola"
            result = mission_to_delivery_workflow(farm, area, mtype)
            print(f"\n[OK] Workflow simulado para {farm}")
            continue
        elif choice == "5":
            print("Encerrando Operations Team.")
            break
        else:
            print("Opcao invalida.")
            continue

        print(f"\nConversando com: {name}")
        print("Digite 'menu' para voltar\n")

        while True:
            user_input = input("Voce -> ").strip()
            if not user_input:
                continue
            if user_input.lower() == "menu":
                break
            response = active_agent.chat(user_input)
            print(f"\n{name} -> {response}\n")
            print("-" * 40)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        print(chief_pilot.chat(query))
    else:
        run_interactive()
