"""
Agrostech — Geomart Pipeline (orquestrador + throttle de 5 pitches/dia)

Une os 4 agentes do Motor de Prospecção Geomart:
  Agent 1+2 (geomart_client.py)   -> já staged em geomart_leads.db
  Agent 3    (mercurius_client.py) -> roda sob demanda, só para os leads do dia
  Agent 4    (crew_agents.write_pitch) -> gera o pitch pronto p/ revisão humana
  Saída                            -> sheets_client.py (aba Fila_Pitches)

Por que o throttle drena um backlog em vez de rodar Agent 1 toda vez:
A Fase 1 mostrou que só MG já tem ~7.900 parcelas certificadas >=500ha — um
volume que dura anos a 5 pitches/dia. Por isso o re-sync completo (Agent 1) é
uma operação separada, esporádica (rodar `python geomart_client.py --uf ...`
manualmente ou via agendador semanal/mensal) — o dia a dia aqui só seleciona,
enriquece e redige os próximos 5 leads ainda não pitchados.

Seleção: os leads são ordenados por área (ha) decrescente — é o único sinal de
valor conhecido ANTES do enriquecimento (a confiança do Mercurius só existe
depois de rodar o waterfall, então não dá pra ordenar por ela previamente).

Uso:
    python geomart_pipeline.py --daily          # gera até 5 pitches novos
    python geomart_pipeline.py --daily --limit 3
"""

from __future__ import annotations

import argparse
import logging
import sqlite3
from datetime import date
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

RUNNER_DIR = Path(__file__).parent.resolve()
DB_PATH = RUNNER_DIR / "geomart_leads.db"

DAILY_LIMIT = 5


def _select_unpitched_leads(limit: int) -> list[dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
        SELECT sigef_uuid, cir, nome_area, municipio, uf, area_ha, status, sigef_link,
               cultura_provavel, cultura_area_pct
        FROM parcelas
        WHERE pitched_at IS NULL
        ORDER BY
            (cultura_provavel IS NOT NULL AND cultura_provavel != 'Indefinido') DESC,
            area_ha DESC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def _mark_pitched(sigef_uuid: str) -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.execute("UPDATE parcelas SET pitched_at = CURRENT_TIMESTAMP WHERE sigef_uuid = ?", (sigef_uuid,))
    conn.commit()
    conn.close()


def _write_pitch_with_retry(crew_agents_module, lead: dict, enrichment: dict, max_attempts: int = 5):
    """Groq free tier tem limite de 12.000 tokens/minuto (TPM) — transitório,
    não um erro real. Espera e tenta de novo em vez de derrubar o lote inteiro."""
    import time

    from litellm.exceptions import RateLimitError

    for attempt in range(1, max_attempts + 1):
        try:
            return crew_agents_module.write_pitch(lead, enrichment)
        except RateLimitError as e:
            if attempt == max_attempts:
                raise
            wait_s = 15 * attempt
            logger.warning(f"Rate limit do provedor LLM (tentativa {attempt}/{max_attempts}) — aguardando {wait_s}s: {e}")
            time.sleep(wait_s)


def run_daily_batch(limit: int = DAILY_LIMIT) -> int:
    """
    Processa um lead por vez: gera o pitch, escreve na Sheet e só então marca
    pitched_at — commit incremental, não em lote. Assim, se o provedor de LLM
    ficar sem cota no meio do caminho (ex.: teto diário do free tier), os leads
    já processados ficam salvos e visíveis, e o resto continua no backlog para
    a próxima rodada — em vez de perder tudo por causa de 1 falha no fim.
    """
    from litellm.exceptions import RateLimitError

    from mercurius_client import enrich_lead
    import crew_agents
    import sheets_client

    leads = _select_unpitched_leads(limit)
    if not leads:
        logger.info("Nenhum lead novo no backlog (todos já pitchados, ou geomart_client.py ainda não rodou).")
        return 0

    today = date.today().isoformat()
    done = 0

    for lead in leads:
        logger.info(f"Processando lead: {lead['nome_area']!r} ({lead['area_ha']} ha, {lead['uf']})")

        enrichment = enrich_lead(lead)
        try:
            pitch = _write_pitch_with_retry(crew_agents, lead, enrichment)
        except RateLimitError as e:
            logger.warning(
                f"Cota do provedor LLM esgotada após {done}/{len(leads)} pitches deste lote. "
                f"Parando aqui — o restante ({len(leads) - done} leads) continua no backlog "
                f"para a próxima rodada. Detalhe: {e}"
            )
            break

        sheets_client.append_pitch_queue([{
            "data": today,
            "nome_area": lead["nome_area"],
            "municipio": lead["municipio"],
            "uf": lead["uf"],
            "area_ha": lead["area_ha"],
            "status": lead["status"],
            "sigef_link": lead["sigef_link"],
            "cultura_provavel": lead.get("cultura_provavel") or "",
            "cultura_area_pct": lead.get("cultura_area_pct") or "",
            "empresa": enrichment.get("empresa", ""),
            "confianca": enrichment.get("confianca", ""),
            "fontes": enrichment.get("fontes", []),
            "pitch": pitch,
        }])
        _mark_pitched(lead["sigef_uuid"])
        done += 1

    logger.info(f"Lote concluído: {done}/{len(leads)} pitch(es) na fila de revisão (Google Sheets).")
    return done


def get_status_summary() -> dict:
    """Lido pelo comando /leads_geomart no bot — NUNCA dispara o crawl, só relata
    o estado atual de geomart_leads.db (a varredura roda separada, via cron)."""
    if not DB_PATH.exists():
        return {"synced": False}

    conn = sqlite3.connect(DB_PATH)
    total = conn.execute("SELECT COUNT(*) FROM parcelas").fetchone()[0]
    backlog = conn.execute("SELECT COUNT(*) FROM parcelas WHERE pitched_at IS NULL").fetchone()[0]
    pitched_today = conn.execute(
        "SELECT COUNT(*) FROM parcelas WHERE date(pitched_at) = date('now')"
    ).fetchone()[0]
    last_pitched_at = conn.execute(
        "SELECT MAX(pitched_at) FROM parcelas WHERE pitched_at IS NOT NULL"
    ).fetchone()[0]
    conn.close()

    return {
        "synced": True,
        "total_leads": total,
        "backlog": backlog,
        "pitched_today": pitched_today,
        "last_pitched_at": last_pitched_at,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Geomart Pipeline — throttle diário de pitches")
    parser.add_argument("--daily", action="store_true", help="Roda o lote diário (até --limit pitches novos)")
    parser.add_argument("--limit", type=int, default=DAILY_LIMIT, help="Máximo de pitches novos neste lote")
    args = parser.parse_args()

    if args.daily:
        run_daily_batch(limit=args.limit)
    else:
        parser.print_help()
