import os
import logging
import time
from pathlib import Path
from dotenv import load_dotenv

try:
    import requests
except ImportError:
    requests = None

load_dotenv(Path(__file__).parent / ".env")

# Attempt to load LLM (após load_dotenv — o llm_config compartilhado lê as chaves do .env)
try:
    from llm_config import get_llm
    llm = get_llm()
except Exception:
    llm = None

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")

def scrape_agri_news():
    """Scrapes latest agri news using Firecrawl."""
    logger.info("Scraping for breaking agricultural news...")
    if not FIRECRAWL_API_KEY or not requests:
        return []

    try:
        resp = requests.post(
            "https://api.firecrawl.dev/v1/search",
            headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}", "Content-Type": "application/json"},
            json={"query": "notícias agronegócio brasil clima pragas safra", "limit": 3},
            timeout=25
        )
        if resp.status_code == 200:
            return resp.json().get("data", [])
    except Exception as e:
        logger.error(f"Failed to scrape news: {e}")
    return []

def inject_trend_to_content_director(news_items):
    """Uses LLM to evaluate news and inject a briefing if urgent."""
    if not news_items or not llm:
        return

    logger.info("Evaluating news for Trend Hijacking...")
    
    news_text = "\n".join([f"- {item.get('title')}: {item.get('description')}" for item in news_items])
    
    prompt = f"""
    Você é o News Agent da Agrostech. Analise estas notícias recentes do agronegócio:
    {news_text}
    
    Identifique se há alguma notícia URGENTE que justifique um post 'Trend Hijacking' (ex: seca extrema, geada, nova praga) onde mapeamento por drones ajude.
    Se não houver nada urgente, responda apenas 'NADA_URGENTE'.
    Se houver, escreva um briefing para o Content Director no formato:
    URGENTE: [Título da Trend]
    FATO: [O que aconteceu]
    ANGULO AGROSTECH: [Como vender nosso serviço com isso]
    """
    
    try:
        response = llm.call(prompt)
        if "NADA_URGENTE" not in response:
            logger.info("🔥 URGENT TREND DETECTED! Injecting to Content Director queue.")
            # In a real app, this would push to ClickUp or a database queue for the Content Director.
            # Here we will write it to a local markdown file to simulate the queue.
            queue_file = Path(__file__).parent.parent / "data" / "generated" / f"trend_briefing_{int(time.time())}.md"
            queue_file.write_text(response, encoding="utf-8")
            logger.info(f"Briefing saved to {queue_file}")
    except Exception as e:
        logger.error(f"LLM eval failed: {e}")

def run_hijacker():
    logger.info("Starting Trend Hijacker Cron Job...")
    news = scrape_agri_news()
    if news:
        inject_trend_to_content_director(news)
    else:
        logger.info("No news scraped.")

if __name__ == "__main__":
    run_hijacker()
