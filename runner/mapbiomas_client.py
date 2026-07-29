"""
Agrostech — MapBiomas Client (Agent 2.5: Predição de Cultura)

Cruza o polígono de cada parcela (geometry_geojson já staged em
geomart_leads.db pelo geomart_client.py) com um raster classificado do
MapBiomas (uso agrícola do solo) via estatística zonal categórica —
rasterstats.zonal_stats só lê a janela de pixels sob cada polígono, nunca o
raster inteiro (que cobre o Brasil todo, ~1GB), então é eficiente mesmo para
milhares de parcelas.

Códigos de classe confirmados por inspeção direta do raster de teste
(2024_agriculture_agricultural_use, recorte de Uberaba/MG — 970MB, CRS
EPSG:4326, mesma projeção da nossa geometria, sem necessidade de reprojeção):
  20 = Cana-de-açúcar  (30,4% da área dos leads de Uberaba)
  46 = Café             (0,5% da área dos leads de Uberaba)
Confirmado contra a legenda oficial MapBiomas (classes vizinhas observadas:
3/4=floresta/savana, 9=silvicultura, 11/12=campo/área úmida, 15=pastagem,
21=mosaico de usos, 24=área urbana, 25=outra área não vegetada, 30=mineração,
33=água, 39=soja, 41=outras lavouras temporárias, 47=citrus, 48=outras
lavouras perenes) — os códigos batem exatamente com o esperado, sem ambiguidade.

Uso:
    python mapbiomas_client.py --tiff data/mapbiomas/arquivo.tif --municipio Uberaba
    python mapbiomas_client.py --tiff data/mapbiomas/arquivo.tif   # todos os leads
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform as shp_transform

import geo_zonal
import geomart_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

RUNNER_DIR = Path(__file__).parent.resolve()
DB_PATH = geomart_client.DB_PATH

# Legenda oficial MapBiomas — classes de interesse deste motor (ver docstring).
CROP_CLASSES = {
    20: "Cana-de-açúcar",
    46: "Café",
}
MIN_AREA_PCT = 10.0  # abaixo disso, a cultura fica "Indefinido" (evita afirmar sem base)


def _fetch_leads(municipio: str | None) -> list[dict]:
    import sqlite3

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    if municipio:
        rows = conn.execute(
            "SELECT sigef_uuid, nome_area, municipio, geometry_geojson FROM parcelas WHERE municipio = ?",
            (municipio,),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT sigef_uuid, nome_area, municipio, geometry_geojson FROM parcelas"
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def _update_lead(sigef_uuid: str, cultura: str, pct: float) -> None:
    import sqlite3

    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "UPDATE parcelas SET cultura_provavel=?, cultura_area_pct=?, "
        "cultura_atualizado_em=CURRENT_TIMESTAMP WHERE sigef_uuid=?",
        (cultura, pct, sigef_uuid),
    )
    conn.commit()
    conn.close()


def predict_crops(tiff_path: str, municipio: str | None = None) -> int:
    geomart_client.init_db()
    leads = _fetch_leads(municipio)
    if not leads:
        logger.info("Nenhum lead encontrado para processar (confira o filtro de município).")
        return 0

    import rasterio

    with rasterio.open(tiff_path) as ds:
        raster_crs = ds.crs

    # Nossa geometry_geojson é EPSG:4326 (geomart_client.py); reprojeta só se o
    # raster estiver em outro CRS (no arquivo de teste é o mesmo — no-op).
    transformer = Transformer.from_crs("EPSG:4326", raster_crs, always_xy=True)

    updated = 0
    skipped_no_data = 0
    for lead in leads:
        geom = shape(json.loads(lead["geometry_geojson"]))
        geom_proj = shp_transform(transformer.transform, geom)

        stats = geo_zonal.categorical_zonal_stats(tiff_path, geom_proj)
        total_px = sum(stats.values())
        if not total_px:
            skipped_no_data += 1
            continue

        crop_pixels = {name: stats.get(code, 0) for code, name in CROP_CLASSES.items()}
        best_crop, best_px = max(crop_pixels.items(), key=lambda kv: kv[1])
        pct = 100.0 * best_px / total_px
        cultura = best_crop if pct >= MIN_AREA_PCT else "Indefinido"

        _update_lead(lead["sigef_uuid"], cultura, round(pct, 1))
        updated += 1
        logger.info(f"{lead['nome_area']!r}: {cultura} ({pct:.1f}% da área sob o raster)")

    logger.info(
        f"Concluído: {updated} leads atualizados com predição de cultura "
        f"({skipped_no_data} fora da cobertura do raster)."
    )
    return updated


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MapBiomas Client — predição de cultura por zonal stats")
    parser.add_argument("--tiff", required=True, help="Caminho do raster classificado MapBiomas")
    parser.add_argument("--municipio", default=None, help="Filtra leads por município (ex.: Uberaba). Omitir processa todos.")
    args = parser.parse_args()
    predict_crops(args.tiff, args.municipio)
