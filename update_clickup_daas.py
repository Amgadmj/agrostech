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
        "notify_all": True  # Attempt to notify all watchers
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        print(f"Successfully updated task {task_id}")
    else:
        print(f"Failed to update task {task_id}: Status {response.status_code} - {response.text}")

menarin_task = "86e24hd53"
larrisa_task = "86e24hbj9"

shared_strategy = """🚨 **STRATEGY UPDATE: Shift to Drone-as-a-Service (DaaS) Intermediation** 🚨

@Bernardo @Pedro @Diana - Please review the updated strategy for this engagement!

Instead of focusing on direct hardware sales, we are pivoting to a **Service Intermediation Model**. 

**The Game Plan:**
1. **The Offer:** We offer end-to-end drone spraying services at approximately **R$ 150 per hectare**.
2. **The Execution:** We are not just selling the drone; we are bringing the vetted operators (Pedro's contacts) directly to the location to perform the service.
3. **The Value:** Zero upfront CAPEX for the client, zero operational headache (we handle maintenance/piloting), and guaranteed quality.

**Next Steps for the Brasilia Trip (Larrisa):** 
The trip will focus on demonstrating our *service operation* rather than just a product demo. We will bring an operator to do a test run.

**Next Steps for Menarin Sementes:** 
Bernardo to position us as an integration partner to run his spraying operations seamlessly. Goal is to pitch a risk-free pilot program on a specific plot of his soy fields using our R$ 150/ha service.

Let's make sure we are all aligned on this world-class strategy before our next client interactions!
"""

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python update_clickup_daas.py <CLICKUP_API_TOKEN>")
        sys.exit(1)
        
    token = sys.argv[1]
    
    print("Updating Menarin task with new DaaS strategy...")
    update_task(menarin_task, shared_strategy, token)
    
    print("Updating Larrisa task with new DaaS strategy...")
    update_task(larrisa_task, shared_strategy, token)
