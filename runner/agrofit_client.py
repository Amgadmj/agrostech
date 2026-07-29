"""
Agrostech — Embrapa Agrofit API Client (Cached & Rate-Limit Conscious)

Coordinates queries to Embrapa's Agrofit v1 API (https://api.cnptia.embrapa.br/agrofit/v1).
Features:
  1. Automated OAuth2 token generation and lifetime management.
  2. Permanent SQLite-based caching to avoid overcharging the free package / rate limits.
  3. Seamless high-quality mock data fallback if API keys are not provided.
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

# ── Mock Data Fallback ────────────────────────────────────────────────────────
MOCK_PRODUCTS = [
    {
        "nome": "Priori Xtra",
        "registro": "002008",
        "ingrediente_ativo": "Azoxistrobina + Ciproconazol",
        "classe": "Fungicida",
        "grupo": "Estrobirulina + Triazol",
        "indicacao": "Manejo de Ferrugem Asiática (Phakopsora pachyrhizi) em Soja."
    },
    {
        "nome": "Ranger",
        "registro": "003204",
        "ingrediente_ativo": "Glifosato",
        "classe": "Herbicida",
        "grupo": "Glicina Substituída",
        "indicacao": "Manejo de plantas daninhas de folha larga e estreita."
    },
    {
        "nome": "Engeo Pleno S",
        "registro": "006110",
        "ingrediente_ativo": "Tiametoxam + Lambda-Cialotrina",
        "classe": "Inseticida",
        "grupo": "Neonicotinoide + Piroide",
        "indicacao": "Manejo de Percevejo-Marrom (Euschistus heros) na cultura da Soja."
    },
    {
        "nome": "Kashmiri",
        "registro": "001518",
        "ingrediente_ativo": "Imidacloprido + Bifentrina",
        "classe": "Inseticida",
        "grupo": "Neonicotinoide + Piroide",
        "indicacao": "Manejo de pragas sugadoras e lagartas em milho e algodão."
    }
]

MOCK_INGREDIENTS = [
    {
        "nome": "Azoxistrobina",
        "classe": "Fungicida",
        "grupo_quimico": "Estrobirulina",
        "descricao": "Ingrediente ativo fungicida sistêmico de largo espectro, muito utilizado no controle de ferrugens e manchas foliares."
    },
    {
        "nome": "Glifosato",
        "classe": "Herbicida",
        "grupo_quimico": "Glicina Substituída",
        "descricao": "Herbicida sistêmico não seletivo, de ação pós-emergência, amplamente utilizado no controle de plantas daninhas anuais e perenes."
    },
    {
        "nome": "Tiametoxam",
        "classe": "Inseticida",
        "grupo_quimico": "Neonicotinoide",
        "descricao": "Inseticida sistêmico de contato e ingestão, altamente eficaz contra insetos sugadores (como percevejos e pulgões)."
    }
]


class AgrofitClient:
    """Cached & Robust API Client for Embrapa Agrofit."""

    def __init__(self):
        self.consumer_key = os.getenv("AGROFIT_CONSUMER_KEY", "").strip()
        self.consumer_secret = os.getenv("AGROFIT_CONSUMER_SECRET", "").strip()
        self.access_token = None
        self.token_expiry = 0
        self._init_cache_db()

        if self.consumer_key and self.consumer_secret:
            self.mode = "api"
            logger.info("Agrofit Client initialized in API mode.")
        else:
            self.mode = "mock"
            logger.info("Agrofit Client initialized in Static Mock mode (no credentials provided).")

    def _init_cache_db(self):
        """Initialize the local cache database."""
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
        """Retrieve a cached query if present."""
        try:
            conn = sqlite3.connect(CACHE_DB_PATH)
            row = conn.execute("SELECT response_json FROM api_cache WHERE endpoint=?", (endpoint,)).fetchone()
            conn.close()
            return row[0] if row else None
        except Exception as e:
            logger.warning(f"Error reading Agrofit cache: {e}")
            return None

    def _save_to_cache(self, endpoint: str, response_json: str):
        """Save api query results to cache."""
        try:
            conn = sqlite3.connect(CACHE_DB_PATH)
            conn.execute("INSERT OR REPLACE INTO api_cache (endpoint, response_json) VALUES (?, ?)", (endpoint, response_json))
            conn.commit()
            conn.close()
        except Exception as e:
            logger.warning(f"Error saving to Agrofit cache: {e}")

    def _get_access_token(self) -> Optional[str]:
        """Obtain or renew the OAuth2 Access Token from Embrapa."""
        if self.access_token and time.time() < self.token_expiry:
            return self.access_token

        if not self.consumer_key or not self.consumer_secret or requests is None:
            return None

        logger.info("Renewing Embrapa AgroAPI Access Token...")
        try:
            # Prepare Base64 Authorization Header
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
                # Expire token 60 seconds early to avoid race conditions
                self.token_expiry = time.time() + float(data.get("expires_in", 3600)) - 60
                logger.info("Embrapa AgroAPI Token renewed successfully.")
                return self.access_token
            else:
                logger.warning(f"Failed to obtain token. Status: {resp.status_code} | {resp.text}")
        except Exception as e:
            logger.error(f"Error renewing token: {e}")
        
        return None

    def _get_api(self, path: str, params: Optional[dict] = None) -> list[Any] | dict[str, Any]:
        """Make a GET request to Agrofit API with caching and error fallbacks."""
        import json
        cache_key = f"{path}?{json.dumps(params or {}, sort_keys=True)}"
        
        # 1. Check cache first to avoid hitting rate limits or overcharging
        cached = self._get_cached_response(cache_key)
        if cached:
            return json.loads(cached)

        # 2. Token refresh & calling
        token = self._get_access_token()
        if not token or requests is None:
            return []

        url = f"https://api.cnptia.embrapa.br/agrofit/v1{path}"
        try:
            resp = requests.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "accept": "application/json"
                },
                params=params,
                timeout=12
            )
            if resp.status_code == 200:
                # Save to cache
                self._save_to_cache(cache_key, resp.text)
                return resp.json()
            else:
                logger.warning(f"Agrofit API Error calling {path}. Status: {resp.status_code}")
        except Exception as e:
            logger.error(f"Network error calling Agrofit API: {e}")

        return []

    # ── Public APIs ──────────────────────────────────────────────────────────────

    def search_active_ingredient(self, name: str) -> list[dict]:
        """Search registered active ingredients by name."""
        name_clean = name.strip().lower()
        if self.mode == "mock":
            return [i for i in MOCK_INGREDIENTS if name_clean in i["nome"].lower()]

        # Query real API with query parameter if supported, or filter
        # Enforcing list endpoint: /ingredientes-ativos
        data = self._get_api("/ingredientes-ativos")
        if isinstance(data, list):
            results = []
            for item in data:
                # Structure: {"id": 1, "nome": "Azoxistrobina", "classe": ...}
                if name_clean in str(item.get("nome", "")).lower():
                    results.append(item)
            return results
        return []

    def search_product(self, name: str) -> list[dict]:
        """Search registered commercial formulated products by name."""
        name_clean = name.strip().lower()
        if self.mode == "mock":
            return [p for p in MOCK_PRODUCTS if name_clean in p["nome"].lower() or name_clean in p["ingrediente_ativo"].lower()]

        # Search real API formulated products
        data = self._get_api("/produtos-formulados")
        if isinstance(data, list):
            results = []
            for item in data:
                # Match by brand name or active ingredients
                m_comercial = str(item.get("marca_comercial", "")).lower()
                ingredientes = str(item.get("ingrediente_ativo", "")).lower()
                if name_clean in m_comercial or name_clean in ingredientes:
                    results.append({
                        "nome": item.get("marca_comercial"),
                        "registro": item.get("numero_registro"),
                        "ingrediente_ativo": item.get("ingrediente_ativo"),
                        "classe": item.get("classe_toxicologica"),
                        "grupo": item.get("grupo_quimico"),
                        "indicacao": item.get("indicacoes", "Consultar bula para dosagem e alvos.")
                    })
            return results
        return []

    def search_pests_and_targets(self, name: str) -> list[dict]:
        """Search agricultural pests/diseases by common or scientific name."""
        name_clean = name.strip().lower()
        if self.mode == "mock":
            return [
                {
                    "nome_comum": "Ferrugem Asiática",
                    "nome_cientifico": "Phakopsora pachyrhizi",
                    "culturas": "Soja",
                    "indicacao": "Manejo preventivo ou no aparecimento dos primeiros sintomas."
                },
                {
                    "nome_comum": "Percevejo-Marrom",
                    "nome_cientifico": "Euschistus heros",
                    "culturas": "Soja",
                    "indicacao": "Aplicação terrestre ou aérea via drone de pulverização."
                }
            ]

        data = self._get_api("/pragas")
        if isinstance(data, list):
            results = []
            for item in data:
                comum = str(item.get("nome_comum", "")).lower()
                cientifico = str(item.get("nome_cientifico", "")).lower()
                if name_clean in comum or name_clean in cientifico:
                    results.append(item)
            return results
        return []


# Singleton instance to reuse across the codebase
agrofit_client = AgrofitClient()


if __name__ == "__main__":
    # Quick Test Execution
    client = AgrofitClient()
    print("Testing Agrofit Client...")
    print("Active Ingredient Search (Glifosato):", client.search_active_ingredient("Glifosato"))
    print("Product Search (Priori):", client.search_product("Priori"))
