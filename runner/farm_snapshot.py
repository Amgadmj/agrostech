"""
Agrostech — "Raio-X da Fazenda" (Marketing pré-call)

Gera uma imagem PNG compartilhável por WhatsApp: composição colorida real +
NDVI colorizado da cena Sentinel-2 mais recente sobre a área de um lead.
Reaproveita `ceres_cubo.datacube` — mesmo fetch STAC + leitura por janela
HTTP já validado no piloto Ceres Cubo, sem baixar a cena inteira.

Usa Pillow em vez de matplotlib: confirmado nesta máquina que o `ft2font`
do matplotlib é bloqueado pela mesma política de Application Control que
bloqueia o `pyogrio` (ver `geo_zonal.py`) — Pillow não tem esse problema.

Simplificação deliberada: recorta por bounding box da parcela (com margem),
não pela geometria exata do polígono — recorte por silhueta é um
refinamento visual futuro, não essencial para provar o conceito.

Uso:
    python farm_snapshot.py --sigef-uuid <uuid> --out raiox.png
"""

from __future__ import annotations

import argparse
import json
import logging
import sqlite3
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from shapely.geometry import shape

import geomart_client
from ceres_cubo.datacube import Observation, build_datacube

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

NDVI_COLOR_STOPS = np.array([[178, 24, 43], [255, 255, 191], [26, 152, 80]], dtype="float64")
NDVI_RANGE = (-0.2, 0.9)

# ImageFont.load_default() (com ou sem `size=`) não tem glifos para
# acentuação PT-BR (í, ç, ã, õ) — confirmado: renderiza como tofu/caixa
# vazia. Nomes de fazenda reais têm acento com frequência (ex.: "Perímetro"),
# então usamos uma fonte TrueType do sistema com cobertura Latin-1 completa,
# com fallback multiplataforma em vez de um caminho fixo do Windows.
_FONT_CANDIDATES = (
    r"C:\Windows\Fonts\segoeui.ttf",
    r"C:\Windows\Fonts\arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
)


def _load_font(size: int = 14) -> ImageFont.FreeTypeFont:
    for path in _FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    logger.warning(
        "Nenhuma fonte TrueType do sistema encontrada — usando fonte padrão do Pillow, "
        "que não renderiza acentuação PT-BR corretamente (í, ç, ã, õ viram tofu)."
    )
    return ImageFont.load_default()


def _stretch_to_uint8(band: np.ndarray, p_low: float = 2, p_high: float = 98) -> np.ndarray:
    """Contrast stretch por percentil — reflectância bruta [0,1] fica escura/sem
    contraste numa imagem sem esse ajuste (prática padrão em true-color de satélite)."""
    valid = band[~np.isnan(band)]
    if valid.size == 0:
        return np.zeros(band.shape, dtype="uint8")
    lo, hi = np.percentile(valid, [p_low, p_high])
    if hi <= lo:
        hi = lo + 1e-6
    clipped = np.nan_to_num(np.clip((band - lo) / (hi - lo), 0, 1), nan=0.0)
    return (clipped * 255).astype("uint8")


def _true_color_image(obs: Observation) -> Image.Image:
    rgb = np.dstack([_stretch_to_uint8(obs.bands[c]) for c in ("red", "green", "blue")])
    return Image.fromarray(rgb, mode="RGB")


def _ndvi_colormap(ndvi: np.ndarray) -> Image.Image:
    """Rampa vermelho -> amarelo -> verde (baixo -> alto vigor), sem depender de matplotlib."""
    valid = ~np.isnan(ndvi)
    lo, hi = NDVI_RANGE
    norm = np.nan_to_num(np.clip((ndvi - lo) / (hi - lo), 0, 1), nan=0.0)

    idx = norm * (len(NDVI_COLOR_STOPS) - 1)
    lower = np.clip(idx.astype(int), 0, len(NDVI_COLOR_STOPS) - 2)
    frac = (idx - lower)[..., None]
    rgb = NDVI_COLOR_STOPS[lower] * (1 - frac) + NDVI_COLOR_STOPS[lower + 1] * frac
    rgb = rgb.astype("uint8")
    rgb[~valid] = [40, 40, 40]  # cinza escuro para nodata
    return Image.fromarray(rgb, mode="RGB")


def build_snapshot(
    bbox: tuple[float, float, float, float], lead_name: str, out_path: str | Path, start: str, end: str
) -> Path:
    """Monta o Raio-X (true-color + NDVI lado a lado) e salva em `out_path`."""
    cube = build_datacube(bbox, start, end, max_scenes=1)
    if not cube.observations:
        raise RuntimeError(f"Nenhuma cena Sentinel-2 disponível para {lead_name!r} em {start}..{end}")
    obs = cube.observations[0]

    tc_img = _true_color_image(obs)
    ndvi_img = _ndvi_colormap(obs.ndvi)

    gap, label_h = 12, 30
    w, h = tc_img.size
    canvas = Image.new("RGB", (w * 2 + gap, h + label_h), color=(245, 245, 240))
    canvas.paste(tc_img, (0, label_h))
    canvas.paste(ndvi_img, (w + gap, label_h))

    draw = ImageDraw.Draw(canvas)
    font = _load_font(14)
    draw.text((8, 6), f"{lead_name} — {obs.date.isoformat()}", fill=(20, 20, 20), font=font)
    draw.text((w + gap + 8, 6), "NDVI (vermelho=baixo, verde=alto vigor)", fill=(20, 20, 20), font=font)

    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out_path)
    logger.info("Raio-X salvo em %s (%dx%d, cena de %s)", out_path, canvas.width, canvas.height, obs.date)
    return out_path


def bbox_from_lead(sigef_uuid: str, buffer_deg: float = 0.003) -> tuple[tuple[float, float, float, float], str]:
    """Bbox (com margem) e nome de exibição de um lead específico do Geomart."""
    conn = sqlite3.connect(geomart_client.DB_PATH)
    row = conn.execute(
        "SELECT nome_area, geometry_geojson FROM parcelas WHERE sigef_uuid = ?", (sigef_uuid,)
    ).fetchone()
    conn.close()
    if row is None:
        raise ValueError(f"Lead {sigef_uuid!r} não encontrado em {geomart_client.DB_PATH}")
    nome, geom_json = row
    minx, miny, maxx, maxy = shape(json.loads(geom_json)).bounds
    return (minx - buffer_deg, miny - buffer_deg, maxx + buffer_deg, maxy + buffer_deg), (nome or sigef_uuid)


def main() -> None:
    parser = argparse.ArgumentParser(description="Raio-X da Fazenda — imagem satélite pré-call")
    parser.add_argument("--sigef-uuid", required=True, help="UUID do lead na tabela parcelas do Geomart")
    parser.add_argument("--out", default="raiox.png")
    parser.add_argument("--start", default="2026-05-01")
    parser.add_argument("--end", default="2026-07-28")
    args = parser.parse_args()

    bbox, nome = bbox_from_lead(args.sigef_uuid)
    build_snapshot(bbox, nome, args.out, args.start, args.end)


if __name__ == "__main__":
    main()
