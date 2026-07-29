"""
Agrostech — Mercurius Client (Agent 3: GTM Resolver / Waterfall OSINT B2B)

Identifica a empresa/produtor por trás de uma parcela certificada SIGEF usando
apenas fontes abertas de pessoa jurídica (CNPJ, razão social, perfis públicos
de negócio) — NUNCA login automatizado no SIGEF/SICAR ou qualquer fonte que
exponha dado de pessoa física. Isso é proteção legal/LGPD, não só técnica:
o INCRA exige login gov.br justamente para restringir a identidade do titular
(pessoa física), e automatizar isso para uso comercial em escala violaria a
finalidade autorizada dos dados. Este módulo trabalha só com o que já é
público para fins de negócio (igual Clay/Apollo fazem).

Waterfall (para no primeiro nível que resolver com confiança suficiente):
  1. Firecrawl /search — busca `"Fazenda {nome_area}" {municipio} {uf}`,
     pedindo à extração apenas campos de PESSOA JURÍDICA (nome da empresa,
     CNPJ, site, redes sociais). Mesma API já usada em lead_agent.py/
     trend_hijacker.py (FIRECRAWL_API_KEY já configurado no .env).
  2. BrasilAPI CNPJ (pública, sem chave) — valida/enriquece qualquer CNPJ
     candidato encontrado no passo 1: razão social oficial, CNAE, situação
     cadastral, município (cross-check contra o município da parcela).
  3. Sem match confiável -> confiança "baixa": só nome do imóvel + município
     (o pitch deve ser genérico/setorial, nunca fingir personalização).

Cache: tabela `enriquecimento` em geomart_leads.db, chaveada por sigef_uuid
(nunca reconsulta o mesmo lead duas vezes).

Uso:
    from mercurius_client import enrich_lead
    resultado = enrich_lead(lead_dict)  # lead_dict vindo de geomart_client
"""

from __future__ import annotations

import json
import logging
import os
import re
import sqlite3
from pathlib import Path

try:
    import requests
except ImportError:
    requests = None

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

logger = logging.getLogger(__name__)

RUNNER_DIR = Path(__file__).parent.resolve()
DB_PATH = RUNNER_DIR / "geomart_leads.db"

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")
CNPJ_RE = re.compile(r"\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}")


def init_db() -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS enriquecimento (
            sigef_uuid TEXT PRIMARY KEY,
            empresa TEXT,
            cnpj TEXT,
            cnae_descricao TEXT,
            situacao_cadastral TEXT,
            website TEXT,
            fontes TEXT,
            confianca TEXT NOT NULL,
            enriched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def _get_cached(sigef_uuid: str) -> dict | None:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM enriquecimento WHERE sigef_uuid=?", (sigef_uuid,)).fetchone()
    conn.close()
    return dict(row) if row else None


def _save_cache(sigef_uuid: str, result: dict) -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        INSERT INTO enriquecimento (sigef_uuid, empresa, cnpj, cnae_descricao,
                                     situacao_cadastral, website, fontes, confianca)
        VALUES (:sigef_uuid, :empresa, :cnpj, :cnae_descricao, :situacao_cadastral,
                :website, :fontes, :confianca)
        ON CONFLICT(sigef_uuid) DO UPDATE SET
            empresa=excluded.empresa, cnpj=excluded.cnpj,
            cnae_descricao=excluded.cnae_descricao,
            situacao_cadastral=excluded.situacao_cadastral,
            website=excluded.website, fontes=excluded.fontes,
            confianca=excluded.confianca, enriched_at=CURRENT_TIMESTAMP
    """, {**result, "sigef_uuid": sigef_uuid})
    conn.commit()
    conn.close()


# ── Passo 1: Firecrawl (OSINT PJ-only) ────────────────────────────────────────

def _firecrawl_search(nome_area: str, municipio: str, uf: str) -> dict | None:
    if not FIRECRAWL_API_KEY or requests is None:
        logger.warning("FIRECRAWL_API_KEY ausente — pulando busca OSINT.")
        return None

    query = f'"Fazenda {nome_area}" {municipio} {uf} empresa CNPJ'
    try:
        resp = requests.post(
            "https://api.firecrawl.dev/v1/search",
            headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}", "Content-Type": "application/json"},
            json={
                "query": query,
                "limit": 5,
                "lang": "pt",
                "country": "br",
                "scrapeOptions": {
                    "formats": ["extract"],
                    "extract": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "company_name": {"type": "string", "description": "Razão social ou nome fantasia da empresa/produtora rural dona da fazenda (pessoa jurídica apenas)."},
                                "cnpj": {"type": "string", "description": "CNPJ da empresa, se mencionado."},
                                "website": {"type": "string"},
                            }
                        }
                    }
                }
            },
            timeout=30,
        )
        if resp.status_code != 200:
            logger.warning(f"Firecrawl search status {resp.status_code}")
            return None
        return resp.json()
    except Exception as e:
        logger.error(f"Erro na busca Firecrawl: {e}")
        return None


def _extract_candidates(firecrawl_data: dict) -> tuple[str, str, str, list[str]]:
    """Retorna (nome_empresa_candidato, cnpj_candidato, website_candidato, fontes[])."""
    empresa = ""
    cnpj = ""
    website = ""
    fontes: list[str] = []

    for item in (firecrawl_data or {}).get("data", []):
        url = item.get("url", "")
        if url:
            fontes.append(url)

        extracted = item.get("extract") or {}
        if not empresa and extracted.get("company_name"):
            empresa = extracted["company_name"].strip()
        if not website and extracted.get("website"):
            website = extracted["website"].strip()

        cnpj_field = extracted.get("cnpj", "") or ""
        text_blob = " ".join([cnpj_field, item.get("description", ""), item.get("markdown", "") or ""])
        if not cnpj:
            m = CNPJ_RE.search(text_blob)
            if m:
                cnpj = re.sub(r"\D", "", m.group(0))

    return empresa, cnpj, website, fontes


# ── Passo 2: BrasilAPI (validação de CNPJ, pública) ───────────────────────────

def _validate_cnpj(cnpj: str) -> dict | None:
    if not cnpj or requests is None:
        return None
    digits = re.sub(r"\D", "", cnpj)
    if len(digits) != 14:
        return None
    try:
        resp = requests.get(f"https://brasilapi.com.br/api/cnpj/v1/{digits}", timeout=15)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.warning(f"Erro ao validar CNPJ na BrasilAPI: {e}")
    return None


# ── Waterfall principal ────────────────────────────────────────────────────────

def enrich_lead(lead: dict, force: bool = False) -> dict:
    """
    lead: dict com pelo menos sigef_uuid, nome_area, municipio, uf.
    Retorna dict: {empresa, cnpj, cnae_descricao, situacao_cadastral, website,
                   fontes (list[str]), confianca ('alta'|'media'|'baixa')}.
    """
    init_db()
    sigef_uuid = lead["sigef_uuid"]

    if not force:
        cached = _get_cached(sigef_uuid)
        if cached:
            cached["fontes"] = json.loads(cached["fontes"] or "[]")
            return cached

    result = {
        "empresa": "", "cnpj": "", "cnae_descricao": "",
        "situacao_cadastral": "", "website": "", "fontes": [], "confianca": "baixa",
    }

    firecrawl_data = _firecrawl_search(lead["nome_area"], lead.get("municipio", ""), lead["uf"])
    if firecrawl_data:
        empresa, cnpj, website, fontes = _extract_candidates(firecrawl_data)
        result["empresa"] = empresa
        result["website"] = website
        result["fontes"] = fontes

        if cnpj:
            cnpj_data = _validate_cnpj(cnpj)
            if cnpj_data and cnpj_data.get("descricao_situacao_cadastral"):
                result["cnpj"] = cnpj
                result["empresa"] = cnpj_data.get("razao_social") or result["empresa"]
                result["cnae_descricao"] = cnpj_data.get("cnae_fiscal_descricao", "")
                result["situacao_cadastral"] = cnpj_data.get("descricao_situacao_cadastral", "")
                # Confiança alta só se o município da empresa bater com o da parcela
                empresa_municipio = (cnpj_data.get("municipio") or "").strip().lower()
                parcela_municipio = (lead.get("municipio") or "").strip().lower()
                if empresa_municipio and parcela_municipio and empresa_municipio == parcela_municipio:
                    result["confianca"] = "alta"
                else:
                    result["confianca"] = "media"
            elif empresa:
                result["confianca"] = "media"
        elif empresa:
            result["confianca"] = "media"

    _save_cache(sigef_uuid, {**result, "fontes": json.dumps(result["fontes"], ensure_ascii=False)})
    logger.info(f"[Mercurius] {lead['nome_area']!r} -> confiança={result['confianca']} empresa={result['empresa']!r}")
    return result


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
    if len(sys.argv) < 4:
        print("Uso: python mercurius_client.py <nome_area> <municipio> <uf>")
        sys.exit(1)
    test_lead = {
        "sigef_uuid": "teste-cli",
        "nome_area": sys.argv[1],
        "municipio": sys.argv[2],
        "uf": sys.argv[3],
    }
    print(json.dumps(enrich_lead(test_lead, force=True), ensure_ascii=False, indent=2))
