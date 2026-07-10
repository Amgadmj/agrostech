import requests
import sys

def update_task(task_id, comment_text, token):
    url = f"https://api.clickup.com/api/v2/task/{task_id}/comment"
    headers = {
        "Authorization": token,
        "Content-Type": "application/json"
    }
    payload = {
        "comment_text": comment_text
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        print(f"Successfully updated task {task_id}")
    else:
        print(f"Failed to update task {task_id}: Status {response.status_code} - {response.text}")

menarin_task = "86e24hd53"
larrisa_task = "86e24hbj9"

menarin_comment = """# Menarin Sementes (Paraná) - Short-term plan

### Talking Points for Bernardo's Initial Call
**Goal:** Build rapport, establish credibility, and identify his main pain points without overwhelming him with technical jargon.

* **Introduction & Acknowledgment:** "Hi [Owner's Name], thanks for taking the time. I've been following Menarin Sementes' work in Ventania, especially your high standards with Industrial Seed Treatment (TSI). It's impressive."
* **The "Why Now" (Consultative Hook):** "We're talking to a lot of top seed producers in Paraná who are looking to protect their margins and improve yield consistency. I wanted to hear directly from you—what are the biggest bottlenecks you're seeing in the field right now?"
* **Introducing Automation Gently:** "We specialize in helping farms like yours integrate new tech—like drones for field scouting and precision spraying—in a way that's easy to manage and actually solves the problems you mentioned."
* **Call to Action (Next Step):** "I don't want to take up too much of your time today. How about we schedule a brief follow-up next week where I can bring in our technical team? We can show you a couple of simple, concrete examples of how farms with similar operations to yours have benefited from these tools."
"""

larrisa_comment = """# Larrisa (Brasilia) - Short-term plan

### Initial Email/Message Draft
**Goal:** Acknowledge the request, provide a helpful but high-level pricing estimate, and push for a meeting/visit.

Hi Larrisa,

Thanks for reaching out! We're excited to hear about your interest in upgrading to spraying drones. 

Based on the new supplier contacts we've just secured, we have a few excellent options that offer great coverage and efficiency. Pricing for these units typically ranges from [Insert Price Range / e.g., R$ 80,000 to R$ 150,000+] depending on the payload capacity and specific automation features you need.

To give you the most accurate recommendation and final pricing, we'd love to understand a bit more about your specific operation in Brasilia. 

I'll be planning a trip to Brasilia shortly with Bernardo, Pedro, and Diana. We would love to stop by, meet you in person, and even demonstrate some of the capabilities of these new models. 

Are you available for a quick 15-minute call next week to discuss your needs so we can prepare the right options for you?

### Brasilia Trip Outline (You, Bernardo, Pedro, Diana)
* **Objective:** Close the drone sale with Larrisa, introduce the new supplier options, and explore other potential clients in the Brasilia region.
* **Roles:**
  * **You & Bernardo:** Lead the relationship building, commercial negotiations, and closing.
  * **Pedro:** Provide insights and specifics on the new drone suppliers he recently sourced.
  * **Diana:** Technical support / operations perspective during the demonstration.
* **Next Steps:**
  * Confirm Larrisa's availability.
  * Lock in travel dates.
  * Finalize the pricing sheet for the specific drones Pedro uploaded.
"""

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python update_clickup.py <CLICKUP_API_TOKEN>")
        sys.exit(1)
        
    token = sys.argv[1]
    
    print("Updating Menarin task...")
    update_task(menarin_task, menarin_comment, token)
    
    print("Updating Larrisa task...")
    update_task(larrisa_task, larrisa_comment, token)
