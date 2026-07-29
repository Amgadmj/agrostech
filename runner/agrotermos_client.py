"""
Agrostech — Embrapa Agrotermos API Client (Cached & Rate-Limit Conscious)

Coordinates queries to Embrapa's Agrotermos v1 API (https://api.cnptia.embrapa.br/agrotermos/v1).
Features:
  1. Reuses Embrapa AgroAPI OAuth2 authentication.
  2. SQLite-based caching inside agrofit_cache.db to avoid overcharging the free tier.
  3. High-quality mock dictionary fallback if credentials are absent.
"""

import os
import re
import time
import base64
import sqlite3
import logging
from pathlib import Path
from typing import Optional, Any

try:
    import requests
except ImportError:
    requests = None

logger = logging.getLogger(__name__)

RUNNER_DIR = Path(__file__).parent.resolve()
CACHE_DB_PATH = RUNNER_DIR / "agrofit_cache.db"

# ── Mock Data Fallback (Agrotermos Dictionary) ────────────────────────────────
MOCK_TERMS = {
    "ndvi": {
        "termo": "NDVI (Normalized Difference Vegetation Index)",
        "definicao": "Índice de Vegetação por Diferença Normalizada. É um indicador numérico simples que utiliza as bandas do espectro eletromagnético visível (vermelho) e do infravermelho próximo para analisar fotos de sensoriamento remoto, medindo se a área observada contém vegetação viva ativa e saudável.",
        "sinonimos": ["Índice de vegetação", "Sensoriamento remoto foliar"],
        "relacionados": ["Clorofila", "Refletância", "Vigor vegetativo"]
    },
    "agricultura de precisao": {
        "termo": "Agricultura de Precisão",
        "definicao": "Sistema de gerenciamento de produção que considera a variabilidade espacial e temporal do solo, clima e culturas na lavoura para aplicar insumos (sementes, fertilizantes, defensivos) no local correto, na quantidade correta e no momento correto, otimizando o retorno econômico e diminuindo os impactos ambientais.",
        "sinonimos": ["Manejo site-specific", "AP"],
        "relacionados": ["Taxa variável", "Grade de amostragem", "GPS agrícola"]
    },
    "manejo integrado de pragas": {
        "termo": "Manejo Integrado de Pragas (MIP)",
        "definicao": "Abordagem integrada de tomada de decisão que utiliza uma combinação de táticas (culturais, biológicas, genéticas e químicas) de forma harmoniosa para manter populações de pragas agrícolas abaixo do nível de dano econômico (NDE).",
        "sinonimos": ["MIP", "Controle integrado de pragas"],
        "relacionados": ["Nível de ação", "Controle biológico", "Monitoramento de pragas"]
    },
    "adubacao": {
        "termo": "Adubação (Fertilização)",
        "definicao": "Prática agrícola que consiste no fornecimento de fertilizantes (adubos) ao solo ou às plantas com o objetivo de suprir deficiências de nutrientes essenciais (macronutrientes NPK e micronutrientes) para maximizar o vigor e a produtividade da lavoura.",
        "sinonimos": ["Fertilização", "Nutrição de plantas"],
        "relacionados": ["NPK", "Adubação foliar", "Fertilizante solúvel"]
    },
    "npk": {
        "termo": "NPK (Nitrogênio, Fósforo e Potássio)",
        "definicao": "Sigla que representa os três macronutrientes primários fundamentais para o desenvolvimento vegetal: Nitrogênio (N) para crescimento de folhas e caule, Fósforo (P) para desenvolvimento de raízes, floração e frutos, e Potássio (K) para sanidade, resistência a estresses e enchimento de grãos.",
        "sinonimos": ["Adubação mineral primária", "Nutrientes NPK"],
        "relacionados": ["Ureia", "Superfosfato simples", "Cloreto de potássio"]
    }
}


class AgrotermosClient:
    """Cached & Robust API Client for Embrapa Agrotermos."""

    def __init__(self):
        self.consumer_key = os.getenv("AGROFIT_CONSUMER_KEY", "").strip()
        self.consumer_secret = os.getenv("AGROFIT_CONSUMER_SECRET", "").strip()
        self.access_token = None
        self.token_expiry = 0
        self._init_cache_db()

        if self.consumer_key and self.consumer_secret:
            self.mode = "api"
            logger.info("Agrotermos Client initialized in API mode.")
        else:
            self.mode = "mock"
            logger.info("Agrotermos Client initialized in Static Mock mode (no credentials provided).")

    def _init_cache_db(self):
        """Ensure cache table exists inside agrofit_cache.db."""
        conn = sqlite3.connect(CACHE_DB_PATH)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS api_cache (
                endpoint TEXT PRIMARY KEY,
                response_json TEXT NOT NULL,
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()

    def _get_cached_response(self, endpoint: str) -> Optional[str]:
        """Retrieve cached result."""
        try:
            conn = sqlite3.connect(CACHE_DB_PATH)
            row = conn.execute("SELECT response_json FROM api_cache WHERE endpoint=?", (endpoint,)).fetchone()
            conn.close()
            return row[0] if row else None
        except Exception as e:
            logger.warning(f"Error reading Agrotermos cache: {e}")
            return None

    def _save_to_cache(self, endpoint: str, response_json: str):
        """Save api query results to cache."""
        try:
            conn = sqlite3.connect(CACHE_DB_PATH)
            conn.execute("INSERT OR REPLACE INTO api_cache (endpoint, response_json) VALUES (?, ?)", (endpoint, response_json))
            conn.commit()
            conn.close()
        except Exception as e:
            logger.warning(f"Error saving to Agrotermos cache: {e}")

    def _get_access_token(self) -> Optional[str]:
        """Obtain or renew the OAuth2 Access Token from Embrapa."""
        if self.access_token and time.time() < self.token_expiry:
            return self.access_token

        if not self.consumer_key or not self.consumer_secret or requests is None:
            return None

        logger.info("Renewing Embrapa AgroAPI Access Token (Agrotermos)...")
        try:
            credentials = f"{self.consumer_key}:{self.consumer_secret}".encode("utf-8")
            b64_credentials = base64.b64encode(credentials).decode("utf-8")

            resp = requests.post(
                "https://api.cnptia.embrapa.br/token",
                headers={
                    "Authorization": f"Basic {b64_credentials}",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data={"grant_type": "client_credentials"},
                timeout=10
            )

            if resp.status_code == 200:
                data = resp.json()
                self.access_token = data.get("access_token")
                self.token_expiry = time.time() + float(data.get("expires_in", 3600)) - 60
                return self.access_token
        except Exception as e:
            logger.error(f"Error renewing token in Agrotermos: {e}")
        
        return None

    def _get_api(self, path: str, params: Optional[dict] = None) -> list[Any] | dict[str, Any]:
        """Make a GET request with caching."""
        import json
        cache_key = f"agrotermos:{path}?{json.dumps(params or {}, sort_keys=True)}"
        
        cached = self._get_cached_response(cache_key)
        if cached:
            return json.loads(cached)

        token = self._get_access_token()
        if not token or requests is None:
            return []

        url = f"https://api.cnptia.embrapa.br/agrotermos/v1{path}"
        try:
            resp = requests.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "accept": "application/json"
                },
                params=params,
                timeout=10
            )
            if resp.status_code == 200:
                self._save_to_cache(cache_key, resp.text)
                return resp.json()
            else:
                logger.warning(f"Agrotermos API Error calling {path}. Status: {resp.status_code}")
        except Exception as e:
            logger.error(f"Network error calling Agrotermos API: {e}")

        return []

    # ── Public API ──────────────────────────────────────────────────────────────

    def query_term(self, label: str) -> Optional[dict]:
        """Query a concept by label (exact or with relations)."""
        label_clean = label.strip().lower()
        if self.mode == "mock":
            # Search our mock vocabulary
            for key, data in MOCK_TERMS.items():
                if label_clean == key or label_clean in key:
                    return data
            return None

        # Call real API exact term search (/termoComRelacoes)
        data = self._get_api("/termoComRelacoes", params={"label": label.strip()})
        if isinstance(data, dict) and data.get("id"):
            return {
                "termo": data.get("label"),
                "definicao": data.get("description") or data.get("definition") or "Termo agrícola cadastrado.",
                "sinonimos": [s.get("label") for s in data.get("synonyms", [])],
                "relacionados": [r.get("label") for r in data.get("relations", [])]
            }
            
        # Fallback to partial /termoParcial
        data_parcial = self._get_api("/termoParcial", params={"label": label.strip()})
        if isinstance(data_parcial, list) and len(data_parcial) > 0:
            item = data_parcial[0]
            return {
                "termo": item.get("label"),
                "definicao": item.get("description") or "Termo agrícola cadastrado.",
                "sinonimos": [],
                "relacionados": []
            }

        return None


# Singleton instance
agrotermos_client = AgrotermosClient()


if __name__ == "__main__":
    client = AgrotermosClient()
    print("Testing Agrotermos Client...")
    print("Querying term 'ndvi':", client.query_term("ndvi"))
