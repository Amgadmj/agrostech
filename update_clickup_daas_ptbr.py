import requests
import sys

def update_task(task_id, comment_text, token):
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
        print(f"Successfully updated task {task_id}")
    else:
        print(f"Failed to update task {task_id}: Status {response.status_code} - {response.text}")

menarin_task = "86e24hd53"
larrisa_task = "86e24hbj9"

shared_strategy_ptbr = """🚨 **ATUALIZAÇÃO DE ESTRATÉGIA: Mudança para Intermediação "Drone-as-a-Service" (DaaS)** 🚨

@Bernardo @Pedro @Diana - Equipe, por favor, deem uma olhada na nossa nova estratégia para essas oportunidades! 🎯

Em vez de focar apenas na venda do equipamento em si (hardware), estamos pivotando para um **Modelo de Intermediação de Serviços**.

**O Nosso Plano de Jogo:**
1. **A Oferta:** Oferecemos o serviço completo de pulverização com drones (ponta a ponta) por aproximadamente **R$ 150 por hectare**.
2. **A Execução:** Nós não vamos apenas "vender o drone"; nossa missão é levar operadores de confiança e homologados (os contatos do Pedro!) diretamente até a fazenda para executar o serviço com excelência.
3. **O Valor Entregue:** Zero investimento inicial pesado (CAPEX) para o produtor, zero dor de cabeça operacional (nós gerenciamos a manutenção e a pilotagem) e qualidade de aplicação garantida. 🚜✨

**Próximos Passos - Viagem a Brasília (Larrisa):** 
Nossa visita vai focar em demonstrar a nossa *operação de serviço* e não apenas fazer a exibição de um produto. A ideia é levar um operador para realizar uma aplicação teste na prática!

**Próximos Passos - Menarin Sementes (Paraná):** 
O Bernardo vai nos posicionar como os parceiros ideais de integração para rodar a pulverização deles de forma impecável. O grande objetivo é fechar um projeto piloto sem risco, em um talhão específico de soja, rodando no nosso modelo de R$ 150/ha.

Vamos garantir que todos estejamos 100% alinhados com essa estratégia de classe mundial antes das próximas interações com os clientes. Vamos pra cima! 🚀
"""

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python update_clickup_daas_ptbr.py <CLICKUP_API_TOKEN>")
        sys.exit(1)
        
    token = sys.argv[1]
    
    print("Updating Menarin task with PT-BR DaaS strategy...")
    update_task(menarin_task, shared_strategy_ptbr, token)
    
    print("Updating Larrisa task with PT-BR DaaS strategy...")
    update_task(larrisa_task, shared_strategy_ptbr, token)
