import os
import sqlite3
import logging
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
import uvicorn
import requests

try:
    from agent_router import handle_command
    LANGGRAPH_ENABLED = True
except ImportError as e:
    logging.warning(f"LangGraph not available: {e}")
    LANGGRAPH_ENABLED = False

load_dotenv(Path(__file__).parent / ".env")

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")
WHATSAPP_PHONE_ID = os.getenv("WHATSAPP_PHONE_ID")
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "agrostech2026")
DB_PATH = Path(__file__).parent / "telegram_users.db" # Reusing the same DB for now

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Agrostech WhatsApp Bot")

ROLE_PERMISSIONS = {
    "admin": ["*"],
    "chief_pilot": ["status", "missoes", "briefing", "iniciar_remoto", "incidente", "relatorio", "briefing_mkt", "trends", "post_status"],
    "field_pilot": ["status", "missoes", "briefing", "iniciar", "concluir", "incidente"],
    "data_processing": ["status", "missoes", "processando", "qa_ok", "concluir"],
    "sales": ["status", "pipeline", "lead", "concluir"],
    "content_director": ["status", "briefing_mkt", "trends", "aprovar_mkt", "post_status", "relatorio", "concluir", "gerar_mkt"],
    "instagram_image": ["status", "briefing_mkt", "revisar_mkt", "post_status", "concluir"],
    "instagram_reels": ["status", "briefing_mkt", "revisar_mkt", "post_status", "concluir"],
    "tiktok": ["status", "briefing_mkt", "trends", "post_status", "concluir"],
    "visual_identity": ["status", "briefing_mkt", "revisar_mkt", "post_status", "concluir"],
    "read_only": ["status", "relatorio"],
}

def get_user_by_phone(phone_number: str) -> tuple:
    """Fetch user role and name from SQLite DB by phone (mapped to telegram_id temporarily)."""
    if not DB_PATH.exists():
        return None, None
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # In a real migration, we'd add a phone_number column. Here we assume telegram_id stores the phone number for WhatsApp users.
    cursor.execute("SELECT role, name FROM users WHERE telegram_id = ? AND is_active = 1", (phone_number,))
    row = cursor.fetchone()
    conn.close()
    return (row[0].lower(), row[1]) if row else (None, None)

def send_whatsapp_message(to_phone: str, text: str):
    if not WHATSAPP_TOKEN or not WHATSAPP_PHONE_ID:
        logger.warning(f"Mock send to {to_phone}: {text}")
        return
        
    url = f"https://graph.facebook.com/v19.0/{WHATSAPP_PHONE_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to_phone,
        "type": "text",
        "text": {"body": text}
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code not in (200, 201):
        logger.error(f"Failed to send WA message: {response.text}")

async def handle_internal_command(phone: str, role: str, name: str, text: str):
    """Handles commands from internal staff (RBAC validated)."""
    parts = text.strip().split()
    cmd = parts[0].lower()
    if cmd.startswith("/"):
        cmd = cmd[1:]
    args = parts[1:]

    # Check permission
    perms = ROLE_PERMISSIONS.get(role, [])
    if role != "admin" and "*" not in perms and cmd not in perms:
        send_whatsapp_message(phone, f"🚫 Permissão negada para o comando '{cmd}'.")
        return

    # Route to LangGraph if enabled
    if LANGGRAPH_ENABLED:
        try:
            response = await handle_command(phone, f"/{cmd}", args) # Pass with slash for compatibility
            # Adapt HTML/Markdown for WhatsApp (basic adaptation)
            response = response.replace("<b>", "*").replace("</b>", "*")
            response = response.replace("<i>", "_").replace("</i>", "_")
            response = response.replace("<code>", "`").replace("</code>", "`")
            send_whatsapp_message(phone, response)
        except Exception as e:
            send_whatsapp_message(phone, f"❌ Erro ao processar comando: {str(e)}")
    else:
        send_whatsapp_message(phone, f"Comando '{cmd}' recebido, mas LangGraph está desativado.")

# For simplicity, we'll keep conversation state in memory per phone number
conversation_states = {}

async def handle_client_message(phone: str, text: str):
    """Routes unrecognized numbers to the Autonomous Negotiation Agent."""
    global conversation_states
    
    if phone not in conversation_states:
        prompt_path = Path(__file__).parent.parent / "agents" / "sales" / "negotiation_bot.md"
        system_prompt = prompt_path.read_text(encoding="utf-8") if prompt_path.exists() else "Você é o SDR da Agrostech."
        
        # Initialize LLM
        from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
        if os.getenv("GROQ_API_KEY"):
            from langchain_groq import ChatGroq
            llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"), temperature=0.3)
        elif os.getenv("GEMINI_API_KEY"):
            from langchain_google_genai import ChatGoogleGenerativeAI
            llm = ChatGoogleGenerativeAI(model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"), google_api_key=os.getenv("GEMINI_API_KEY"), temperature=0.3)
        else:
            send_whatsapp_message(phone, "Nosso sistema está indisponível no momento.")
            return

        conversation_states[phone] = {
            "llm": llm,
            "messages": [SystemMessage(content=system_prompt)]
        }
    
    state = conversation_states[phone]
    
    # Very basic deal desk integration: If user says a number > 10 and "ha" or "hectares", run a quick quote
    import re
    area_match = re.search(r"(\d+)\s*(ha|hectare|hectares)", text.lower())
    if area_match:
        area = float(area_match.group(1))
        import deal_desk
        research = deal_desk.research_client("") 
        quote = deal_desk.build_quote(area, research=research)
        feat = quote["featured"]
        context_msg = f"SISTEMA (Invisível para o cliente): A cotação para {area}ha foi gerada. O preço recomendado é R$ {feat.price_recommended}/ha. O limite máximo de desconto (NUNCA ABAIXO) é R$ {feat.price_walkaway}/ha. Apresente o preço recomendado ao cliente."
        state["messages"].append(SystemMessage(content=context_msg))

    state["messages"].append(HumanMessage(content=text))
    
    try:
        response = state["llm"].invoke(state["messages"])
        state["messages"].append(AIMessage(content=response.content))
        send_whatsapp_message(phone, response.content)
    except Exception as e:
        logger.error(f"Negotiation Bot Error: {e}")
        send_whatsapp_message(phone, "Tivemos um problema técnico. Um humano falará com você em breve.")

@app.get("/webhooks/wa")
async def verify_webhook(request: Request):
    """Meta Webhook Verification."""
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode and token:
        if mode == "subscribe" and token == WHATSAPP_VERIFY_TOKEN:
            logger.info("WEBHOOK_VERIFIED")
            return int(challenge)
        else:
            raise HTTPException(status_code=403, detail="Verification token mismatch")
    raise HTTPException(status_code=400, detail="Missing parameters")

@app.post("/webhooks/wa")
async def webhook_events(request: Request, background_tasks: BackgroundTasks):
    """Handles incoming WhatsApp messages."""
    body = await request.json()
    
    if body.get("object") == "whatsapp_business_account":
        for entry in body.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                messages = value.get("messages", [])
                
                for msg in messages:
                    if msg.get("type") == "text":
                        phone_number = msg.get("from")
                        text = msg.get("text", {}).get("body", "")
                        
                        logger.info(f"Received WA message from {phone_number}: {text}")
                        
                        # RBAC Check
                        role, name = get_user_by_phone(phone_number)
                        
                        if role:
                            background_tasks.add_task(handle_internal_command, phone_number, role, name, text)
                        else:
                            background_tasks.add_task(handle_client_message, phone_number, text)
                            
        return {"status": "ok"}
    raise HTTPException(status_code=404, detail="Not Found")

if __name__ == "__main__":
    print("[START] Launching Agrostech WhatsApp Bot gateway...")
    uvicorn.run(app, host="0.0.0.0", port=8000)