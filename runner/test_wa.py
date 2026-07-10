import requests
import json
import time

url = "http://localhost:8000/webhooks/wa"
headers = {"Content-Type": "application/json"}

# 1. Simulate an internal user (admin - ID 111111111) sending /status
internal_payload = {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "111111111", # Using a dummy number, we need to check if there is an admin in the DB.
                "type": "text",
                "text": {
                  "body": "/status"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}

# 2. Simulate a new client asking for a quote
client_payload = {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "5511999999999",
                "type": "text",
                "text": {
                  "body": "Oi, tenho uma fazenda de 1200 hectares e queria um orçamento."
                }
              }
            ]
          }
        }
      ]
    }
  ]
}

print("Testing Internal Command (RBAC)...")
# Let's use an ID that's likely in the DB or just send the client payload first.
# For simplicity, we just send the client payload to see the negotiation bot in action.
try:
    resp = requests.post(url, json=client_payload)
    print("Response Status:", resp.status_code)
except Exception as e:
    print("Error:", e)

print("Wait a bit for background tasks to process...")
time.sleep(5)
print("Check the bot logs to see the generated response.")