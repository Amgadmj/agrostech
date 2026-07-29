"""
Agrostech — Embrapa SmartSolos Expert API Client (Cached & Rate-Limit Conscious)

Coordinates queries to Embrapa's SmartSolos Expert v1 API (https://api.cnptia.embrapa.br/smartsolos/expert/v1).
Features:
  1. Reuses Embrapa AgroAPI OAuth2 authentication.
  2. SQLite-based caching inside agrofit_cache.db to avoid overcharging the free tier.
  3. High-quality mock soil profile classification fallback if credentials are absent.
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

# ── Mock Data Fallback (SmartSolos Classifications) ──────────────────────────
MOCK_SOILS = {
    "latossolo": {
        "ordem": "Latossolos (L)",
        "descricao": "Solos minerais, profundos, altamente intemperizados, com excelente drenagem e textura uniforme (frequentemente argilosa ou muito argilosa). São muito comuns nas regiões do Cerrado e do Sudeste Brasileiro.",
        "recomendacoes_daas": "Excelente para tráfego de tratores e drones devido à topografia suave. Baixo risco de compactação, mas requer acompanhamento de matéria orgânica.",
        "manejo_nutricional": "Alta capacidade de fixação de fósforo (P). Requer calagem (correção de acidez) e adubação fosfatada localizada."
    },
    "argissolo": {
        "ordem": "Argissolos (P)",
        "descricao": "Solos com nítido aumento de argila do horizonte superficial para o subsuperficial (horizonte B textural), o que gera riscos de menor permeabilidade e erosão em declives.",
        "recomendacoes_daas": "Monitorar erosões via drone NDVI e relevo em épocas de chuvas fortes. Planejar plantio em curvas de nível.",
        "manejo_nutricional": "Fertilidade natural variável, mas suscetível à compactação de subsuperfície."
    },
    "neossolo": {
        "ordem": "Neossolos (R)",
        "descricao": "Solos jovens, pouco desenvolvidos, rasos ou arenosos, com pouca alteração mineralógica em relação à rocha de origem.",
        "recomendacoes_daas": "Alto risco de estresse hídrico e lixiviação. Mapeamento de satélite e índices NDVI essenciais para manejo localizado em tempo real.",
        "manejo_nutricional": "Baixa retenção de nutrientes. Exige adubação parcelada devido ao teor de areia elevado."
    }
}


class SmartSolosClient:
    """Cached & Robust API Client for Embrapa SmartSolos Expert."""

    def __init__(self):
        self.consumer_key = os.getenv("AGROFIT_CONSUMER_KEY", "").strip()
        self.consumer_secret = os.getenv("AGROFIT_CONSUMER_SECRET", "").strip()
        self.access_token = None
        self.token_expiry = 0
        self._init_cache_db()

        if self.consumer_key and self.consumer_secret:
            self.mode = "api"
            logger.info("SmartSolos Client initialized in API mode.")
        else:
            self.mode = "mock"
            logger.info("SmartSolos Client initialized in Static Mock mode (no credentials provided).")

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
            logger.warning(f"Error reading SmartSolos cache: {e}")
            return None

    def _save_to_cache(self, endpoint: str, response_json: str):
        """Save api query results to cache."""
        try:
            conn = sqlite3.connect(CACHE_DB_PATH)
            conn.execute("INSERT OR REPLACE INTO api_cache (endpoint, response_json) VALUES (?, ?)", (endpoint, response_json))
            conn.commit()
            conn.close()
        except Exception as e:
            logger.warning(f"Error saving to SmartSolos cache: {e}")

    def _get_access_token(self) -> Optional[str]:
        """Obtain or renew the OAuth2 Access Token from Embrapa."""
        if self.access_token and time.time() < self.token_expiry:
            return self.access_token

        if not self.consumer_key or not self.consumer_secret or requests is None:
            return None

        logger.info("Renewing Embrapa AgroAPI Access Token (SmartSolos)...")
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
            logger.error(f"Error renewing token in SmartSolos: {e}")
        
        return None

    def classify_soil_profile(self, point_id: str, horizons: list[dict]) -> dict:
        """
        Classifica um perfil de solo via SmartSolos Expert ou retorna Mock.
        
        Args:
            point_id: Identificador do ponto.
            horizons: Lista de horizontes com atributos físicos/químicos do SiBCS.
        """
        import json
        
        if self.mode == "mock":
            # Search our mock database based on first horizon description
            # Default to Latossolo for Cerrado / generic
            textura = horizons[0].get("TEXTURA", "Argilosa").lower() if horizons else "argilosa"
            if "are" in textura:
                return MOCK_SOILS["neossolo"]
            elif "text" in textura:
                return MOCK_SOILS["argissolo"]
            return MOCK_SOILS["latossolo"]

        # Call real API /classification via POST
        token = self._get_access_token()
        if not token or requests is None:
            return MOCK_SOILS["latossolo"]

        url = "https://api.cnptia.embrapa.br/smartsolos/expert/v1/classification"
        payload = {
            "items": [
                {
                    "ID_PONTO": point_id,
                    "HORIZONTES": horizons
                }
            ]
        }
        
        cache_key = f"smartsolos:classification?{json.dumps(payload, sort_keys=True)}"
        cached = self._get_cached_response(cache_key)
        if cached:
            return json.loads(cached)

        try:
            resp = requests.post(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "accept": "application/json"
                },
                json=payload,
                timeout=15
            )
            if resp.status_code == 200:
                # Save to cache and return the top match
                data = resp.json()
                self._save_to_cache(cache_key, json.dumps(data))
                return data
            else:
                logger.warning(f"SmartSolos API error. Status: {resp.status_code} | {resp.text}")
        except Exception as e:
            logger.error(f"Network error calling SmartSolos API: {e}")

        return MOCK_SOILS["latossolo"]


# Singleton instance
smartsolos_client = SmartSolosClient()


if __name__ == "__main__":
    client = SmartSolosClient()
    print("Testing SmartSolos Client...")
    test_horizons = [{
        "SIMB_HORIZ": "Ap",
        "LIMITE_SUP": 0,
        "LIMITE_INF": 20,
        "TEXTURA": "Argilosa"
    }]
    print("Classifying test profile:", client.classify_soil_profile("Point_01", test_horizons))
