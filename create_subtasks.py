import requests
import sys

def get_list_id(task_id, token):
    url = f"https://api.clickup.com/api/v2/task/{task_id}"
    headers = {"Authorization": token}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json().get('list', {}).get('id')
    print(f"Failed to get list id for {task_id}: {response.text}")
    return None

def create_subtask(list_id, parent_id, name, description, token):
    url = f"https://api.clickup.com/api/v2/list/{list_id}/task"
    headers = {
        "Authorization": token,
        "Content-Type": "application/json"
    }
    payload = {
        "name": name,
        "description": description,
        "parent": parent_id
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        print(f"Created subtask '{name}'")
    else:
        print(f"Failed to create subtask '{name}': {response.status_code} - {response.text}")

def post_comment(task_id, comment_text, token):
    url = f"https://api.clickup.com/api/v2/task/{task_id}/comment"
    headers = {
        "Authorization": token,
        "Content-Type": "application/json"
    }
    payload = {
        "comment_text": comment_text,
        "notify_all": True
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        print(f"Added comment with website and materials to {task_id}")
    else:
        print(f"Failed to add comment to {task_id}")

token = "pk_6807762_FOFOUUQSJU5FT8Y5501O0T79JDUSM85E"
menarin_task = "86e24hd53"
larrisa_task = "86e24hbj9"

print("Fetching List IDs...")
menarin_list_id = get_list_id(menarin_task, token)
larrisa_list_id = get_list_id(larrisa_task, token)

if menarin_list_id:
    print("\nCreating subtasks for Menarin...")
    create_subtask(menarin_list_id, menarin_task, "@Bernardo - Liderar pitch consultivo (Modelo DaaS)", "Apresentar a AgroS Tech como parceira de integração. Focar no projeto piloto sem risco (R$ 150/ha) em um talhão de soja.", token)

if larrisa_list_id:
    print("\nCreating subtasks for Larrisa...")
    create_subtask(larrisa_list_id, larrisa_task, "@Bernardo & Você - Fechar negócio na viagem a Brasília", "Liderar o relacionamento comercial e fechar o piloto DaaS durante a demonstração em Brasília.", token)
    create_subtask(larrisa_list_id, larrisa_task, "@Pedro - Coordenar operadores e logística", "Levantar custos logísticos com os contatos de operadores de drones para a região de Brasília e garantir a margem sobre os R$ 150/ha.", token)
    create_subtask(larrisa_list_id, larrisa_task, "@Diana - Suporte técnico para demonstração", "Organizar a visão de operações e preparar a aplicação técnica teste na fazenda da Larrisa.", token)
    create_subtask(larrisa_list_id, larrisa_task, "Você - Confirmar datas e alinhar viagem", "Entrar em contato com a Larrisa para confirmar disponibilidade e travar as datas da viagem a Brasília.", token)

materials_comment = """🌐 **Referências Comerciais & Apresentações da AgroS Tech**

Equipe, por favor, utilizem o link do nosso site nas comunicações oficiais e tenham em mãos os argumentos dos nossos novos decks de vendas:

1. **Apresentação: "Agricultura de precisão impulsionada por sistemas multiagentes"**
   - Focar no nosso *Ecossistema Autônomo Multiagente* (satélites, drones e modelos preditivos em uma única camada).
   - Destacar os *Insights Acionáveis* (NDVI, mapas de cultivo, relatórios de drenagem que economizam até 70% de herbicidas).

2. **Apresentação: "Cultivo Autônomo Soberano"**
   - Focar nos 3 pilares: *Intervenções com Drones* (ações cirúrgicas), *Portal de Satélite* (monitoramento contínuo Solis) e *O Copiloto Agrônomo* (assistente de IA Ceres).

*Nota: Não esqueçam de anexar esses PDFs aos e-mails formais quando entrarem em contato com o cliente.*
"""

print("\nPosting materials comments...")
post_comment(menarin_task, materials_comment, token)
post_comment(larrisa_task, materials_comment, token)
