import os
import requests
from dotenv import load_dotenv

load_dotenv('.env')

WHATSAPP_TOKEN = os.getenv('WHATSAPP_TOKEN')
WHATSAPP_PHONE_ID = os.getenv('WHATSAPP_PHONE_ID')

# The number to send the test message to. 
# Make sure this number is registered in your Meta Developer portal as a test number if the app is not live.
# Format: Country code + area code + number, e.g., 5511999999999
TARGET_PHONE = "15551495431" # Replace with your actual test phone number when running

print(f"Token (first 10 chars): {WHATSAPP_TOKEN[:10]}...")
print(f"Phone ID: {WHATSAPP_PHONE_ID}")

url = f"https://graph.facebook.com/v19.0/{WHATSAPP_PHONE_ID}/messages"
headers = {
    "Authorization": f"Bearer {WHATSAPP_TOKEN}",
    "Content-Type": "application/json"
}
payload = {
    "messaging_product": "whatsapp",
    "to": TARGET_PHONE,
    "type": "text",
    "text": {"body": "Teste de conexão do Bot Agrostech!"}
}

try:
    print(f"Enviando mensagem para {TARGET_PHONE}...")
    response = requests.post(url, headers=headers, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Erro: {e}")
