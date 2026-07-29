"""
Agrostech — Sequência Pré-Call (3 toques)

Monta a sequência de "valor antes da ligação" para um lead do Geomart,
seguindo a doutrina da proposta "Duas Alavancas de Dados": Raio-X da Fazenda
(quase gratuito, sempre que houver cena recente) + o melhor sinal proativo
disponível (estiagem > contexto de seguro rural, nesta ordem — nem sempre
há um sinal real no dia, e isso é ok) + a chamada para a call.

Camada de conteúdo pura — grava um .md em data/generated/ (mesmo espírito
dos abm_trigger_*.md já existentes), não manda nada sozinha. O envio real é
dos bots (telegram_bot.py/whatsapp_bot.py) já existentes.

Uso:
    python pre_call_drip.py --sigef-uuid <uuid>
"""

from __future__ import annotations

import argparse
import logging
import sqlite3
from datetime import date
from pathlib import Path

import geomart_client
import marketing_alerts
from credit_insurance_context import seguro_rural_contexto
from farm_snapshot import bbox_from_lead, build_snapshot

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

RUNNER_DIR = Path(__file__).parent.resolve()
OUTPUT_DIR = RUNNER_DIR.parent / "data" / "generated"


def _lead_row(sigef_uuid: str) -> dict:
    conn = sqlite3.connect(geomart_client.DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM parcelas WHERE sigef_uuid = ?", (sigef_uuid,)).fetchone()
    conn.close()
    if row is None:
        raise ValueError(f"Lead {sigef_uuid!r} não encontrado em {geomart_client.DB_PATH}")
    return dict(row)


def _build_touch1(sigef_uuid: str, nome: str, start: str, end: str) -> str | None:
    try:
        bbox, _ = bbox_from_lead(sigef_uuid)
        img_path = OUTPUT_DIR / "raiox" / f"{sigef_uuid}.png"
        build_snapshot(bbox, nome, img_path, start, end)
    except Exception as exc:
        logger.warning("Raio-X falhou para %s (%s): %s", sigef_uuid, type(exc).__name__, exc)
        return None
    return (
        f"Raio-X da Fazenda — imagem em {img_path}\n"
        f'Legenda sugerida: "{nome}, aqui está sua fazenda vista do espaço — dado real, não estimativa."'
    )


def _build_touch2(municipio: str | None, uf: str | None) -> str | None:
    if not municipio or not uf:
        return None
    drought_alerts = marketing_alerts.scan_drought_alerts(municipio=municipio, uf=uf)
    if drought_alerts:
        return drought_alerts[0]["mensagem"]
    seguro = seguro_rural_contexto(uf=uf, municipio=municipio)
    return seguro["mensagem"] if seguro else None


def build_drip_sequence(
    sigef_uuid: str, snapshot_start: str = "2026-05-01", snapshot_end: str = "2026-07-28"
) -> Path:
    lead = _lead_row(sigef_uuid)
    nome = lead.get("nome_area") or sigef_uuid
    municipio, uf, area_ha = lead.get("municipio"), lead.get("uf"), lead.get("area_ha")

    touch1 = _build_touch1(sigef_uuid, nome, snapshot_start, snapshot_end)
    touch2 = _build_touch2(municipio, uf)
    touch3 = "Quer uma leitura completa da sua fazenda, sem custo? 20 minutos — a gente mostra o resto."

    lines = [
        f"SEQUÊNCIA PRÉ-CALL (3 toques) — gerada em {date.today().isoformat()}",
        f"Lead: {nome} ({municipio}/{uf}, {area_ha} ha)",
        f"Sigef: {sigef_uuid}",
        "",
        "--- Toque 1 (imediato) ---",
        touch1 or "[Raio-X indisponível — sem cena Sentinel-2 recente/limpa para esta AOI]",
        "",
        "--- Toque 2 (dias +3 a +5) ---",
        touch2 or "[Nenhum sinal proativo real disponível hoje — pular para o toque 3 ou tentar de novo mais tarde]",
        "",
        "--- Toque 3 (dias +7 a +10) ---",
        touch3,
    ]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / f"pre_call_drip_{sigef_uuid}.md"
    out_path.write_text("\n".join(lines), encoding="utf-8")
    logger.info("Sequência pré-call salva em %s", out_path)
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Monta a sequência pré-call (3 toques) para um lead do Geomart")
    parser.add_argument("--sigef-uuid", required=True)
    parser.add_argument("--start", default="2026-05-01")
    parser.add_argument("--end", default="2026-07-28")
    args = parser.parse_args()
    build_drip_sequence(args.sigef_uuid, args.start, args.end)


if __name__ == "__main__":
    main()
