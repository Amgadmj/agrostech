"""
Agrostech — Geomart Client (Agent 1: Extractor + Agent 2: Geo Resolver)

Baixa e decodifica os tiles vetoriais (MVT/protobuf) do plano Geomart para as
UFs alvo (SP, MG), calcula a geometria e a área geodésica real de cada
parcela certificada SIGEF, filtra por área mínima e faz upsert em
geomart_leads.db.

Validado contra o site real (Fase 0):
  - TileJSON de metadados:  https://tiles.geomart.com.br/geo_{uf}?d=<token>
  - Tile binário (pbf):     https://tiles.geomart.com.br/geo_{uf}/{z}/{x}/{y}?d=<token>
  - Layer de município:     https://tiles.geomart.com.br/municipios/{z}/{x}/{y}?d=<token>
  - Campos reais da camada SIGEF: art, codigo_imo (CIR), data_aprov, data_submi,
    municipio_ (código IBGE), nome_area, parcela_co (UUID de certificação
    SIGEF — usado no link público sigef.incra.gov.br/geo/parcela/detalhe/{uuid}),
    registro_d, registro_m, rt, situacao_i, status, uf_id.
    NÃO existe campo "matricula" cru no tile — não confiar nesse rótulo.
  - Zoom 9 evita o problema de reconstrução de geometria cortada em múltiplos
    tiles: nesse zoom, um tile cobre ~70km — qualquer fazenda real (mesmo de
    milhares de ha) cabe inteira em um único tile. Por isso a geometria e a
    área (calculada geodesicamente com pyproj) vêm direto do tile — não é
    necessário o endpoint "Baixar KML" por parcela.

Uso:
    python geomart_client.py --uf mg
    python geomart_client.py --uf sp
    python geomart_client.py --uf all
"""

from __future__ import annotations

import argparse
import logging
import math
import os
import sqlite3
from pathlib import Path

os.environ.setdefault("PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION", "python")

import shapely.ops  # noqa: E402

if not hasattr(shapely.ops, "cascaded_union"):
    shapely.ops.cascaded_union = shapely.ops.unary_union

import mapbox_vector_tile  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402
from pyproj import Geod  # noqa: E402
from shapely.geometry import mapping, shape  # noqa: E402

from geomart_auth import get_authenticated_context  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

RUNNER_DIR = Path(__file__).parent.resolve()
DB_PATH = RUNNER_DIR / "geomart_leads.db"

MAP_URL = "https://geomart.com.br/imoveis-certificados/"
TILES_BASE = "https://tiles.geomart.com.br"

ZOOM = 9                 # ver docstring: tile grande o bastante p/ nunca cortar uma fazenda real
MIN_AREA_HA = 500.0
TARGET_UFS = ["sp", "mg"]

_GEOD = Geod(ellps="WGS84")


# ── Banco (staging) ───────────────────────────────────────────────────────────

def init_db() -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS parcelas (
            sigef_uuid TEXT PRIMARY KEY,
            cir TEXT NOT NULL,
            nome_area TEXT,
            municipio TEXT,
            municipio_ibge INTEGER,
            uf TEXT NOT NULL,
            area_ha REAL NOT NULL,
            status TEXT,
            sigef_link TEXT,
            geometry_geojson TEXT,
            first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            pitched_at TIMESTAMP,
            cultura_provavel TEXT,
            cultura_area_pct REAL,
            cultura_atualizado_em TIMESTAMP
        )
    """)
    # Retrofit para bancos criados antes da predição de cultura (MapBiomas) existir —
    # CREATE TABLE IF NOT EXISTS não adiciona colunas a uma tabela já existente.
    existing_cols = {r[1] for r in conn.execute("PRAGMA table_info(parcelas)").fetchall()}
    for col, col_type in (
        ("cultura_provavel", "TEXT"),
        ("cultura_area_pct", "REAL"),
        ("cultura_atualizado_em", "TIMESTAMP"),
    ):
        if col not in existing_cols:
            conn.execute(f"ALTER TABLE parcelas ADD COLUMN {col} {col_type}")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_parcelas_cir ON parcelas(cir)")
    conn.commit()
    conn.close()


def upsert_parcela(row: dict) -> None:
    # sigef_uuid (a certificação, não o CIR) é a chave real: um mesmo CIR/imóvel
    # pode ter várias partes/glebas certificadas separadamente (ex.: "Fazenda X
    # - Parte 1/2/3"), cada uma com seu próprio UUID SIGEF. Usar CIR como chave
    # perderia esses registros por sobrescrita silenciosa.
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        INSERT INTO parcelas (sigef_uuid, cir, nome_area, municipio, municipio_ibge, uf, area_ha,
                               status, sigef_link, geometry_geojson, last_seen)
        VALUES (:sigef_uuid, :cir, :nome_area, :municipio, :municipio_ibge, :uf, :area_ha,
                :status, :sigef_link, :geometry_geojson, CURRENT_TIMESTAMP)
        ON CONFLICT(sigef_uuid) DO UPDATE SET
            cir=excluded.cir,
            nome_area=excluded.nome_area,
            municipio=excluded.municipio,
            municipio_ibge=excluded.municipio_ibge,
            area_ha=excluded.area_ha,
            status=excluded.status,
            sigef_link=excluded.sigef_link,
            geometry_geojson=excluded.geometry_geojson,
            last_seen=CURRENT_TIMESTAMP
    """, row)
    conn.commit()
    conn.close()


# ── Matemática de tiles (slippy map / MVT local -> lon/lat) ──────────────────

def deg2num(lon: float, lat: float, zoom: int) -> tuple[int, int]:
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return x, y


def _mvt_local_to_lonlat(px: float, py: float, extent: int, z: int, tx: int, ty: int) -> tuple[float, float]:
    n = 2.0 ** z
    frac_x = tx + px / extent
    frac_y = ty + py / extent
    lon = frac_x / n * 360.0 - 180.0
    lat_rad = math.atan(math.sinh(math.pi * (1 - 2 * frac_y / n)))
    return lon, math.degrees(lat_rad)


def _reproject_geometry(geom: dict, extent: int, z: int, tx: int, ty: int) -> dict | None:
    def conv_ring(ring):
        return [_mvt_local_to_lonlat(px, py, extent, z, tx, ty) for px, py in ring]

    gtype = geom.get("type")
    if gtype == "Polygon":
        coords = [conv_ring(r) for r in geom["coordinates"]]
    elif gtype == "MultiPolygon":
        coords = [[conv_ring(r) for r in poly] for poly in geom["coordinates"]]
    else:
        return None
    return {"type": gtype, "coordinates": coords}


def _tile_range_for_bounds(bounds: list[float], z: int) -> tuple[int, int, int, int]:
    lon_min, lat_min, lon_max, lat_max = bounds
    x0, y0 = deg2num(lon_min, lat_max, z)  # canto superior-esquerdo (lat max)
    x1, y1 = deg2num(lon_max, lat_min, z)  # canto inferior-direito (lat min)
    return min(x0, x1), max(x0, x1), min(y0, y1), max(y0, y1)


# ── Sessão / requests ──────────────────────────────────────────────────────────

def _capture_d_token(context) -> str:
    """Carrega o mapa uma vez e captura o token `d=` reaproveitado por toda a sessão."""
    page = context.new_page()
    captured = []
    page.on("request", lambda r: captured.append(r.url) if "tiles.geomart.com.br" in r.url and "d=" in r.url else None)
    page.goto(MAP_URL, wait_until="networkidle", timeout=60000)
    if "/login" in page.url:
        page.close()
        raise RuntimeError("Sessão Geomart não autenticou ao carregar o mapa (redirecionado para /login).")
    page.wait_for_timeout(2000)
    page.close()
    if not captured:
        raise RuntimeError("Nenhum request de tile capturado — verifique se o mapa carregou corretamente.")
    return captured[0].split("d=")[-1]


def _fetch_tilejson(context, layer: str, d_token: str) -> dict:
    resp = context.request.get(f"{TILES_BASE}/{layer}?d={d_token}")
    if resp.status != 200:
        raise RuntimeError(f"TileJSON de '{layer}' falhou (status {resp.status})")
    return resp.json()


def _fetch_and_decode_tile(context, layer: str, z: int, x: int, y: int, d_token: str) -> dict | None:
    resp = context.request.get(f"{TILES_BASE}/{layer}/{z}/{x}/{y}?d={d_token}")
    if resp.status != 200:
        return None
    body = resp.body()
    if not body:
        return None
    return mapbox_vector_tile.decode(body)


# ── Pipeline por UF ────────────────────────────────────────────────────────────

def process_uf(context, uf: str, d_token: str) -> int:
    uf = uf.lower()
    layer = f"geo_{uf}"
    logger.info(f"[{uf.upper()}] Buscando TileJSON de metadados...")
    tilejson = _fetch_tilejson(context, layer, d_token)
    bounds = tilejson["bounds"]
    vector_layer_id = tilejson["vector_layers"][0]["id"]

    xmin, xmax, ymin, ymax = _tile_range_for_bounds(bounds, ZOOM)
    total_tiles = (xmax - xmin + 1) * (ymax - ymin + 1)
    logger.info(f"[{uf.upper()}] Grade de tiles z={ZOOM}: {total_tiles} tiles a varrer.")

    municipio_cache: dict[int, dict] = {}
    saved = 0
    scanned = 0

    for x in range(xmin, xmax + 1):
        for y in range(ymin, ymax + 1):
            scanned += 1
            decoded = _fetch_and_decode_tile(context, layer, ZOOM, x, y, d_token)
            if not decoded:
                continue

            sigef_layer = decoded.get(vector_layer_id)
            if not sigef_layer:
                continue

            muni_decoded = _fetch_and_decode_tile(context, "municipios", ZOOM, x, y, d_token)
            if muni_decoded:
                muni_layer = muni_decoded.get("municipios")
                if muni_layer:
                    for mfeat in muni_layer.get("features", []):
                        mprops = mfeat["properties"]
                        cd_mun = mprops.get("CD_MUN")
                        if cd_mun is None:
                            continue
                        try:
                            cd_mun_int = int(cd_mun)
                        except (TypeError, ValueError):
                            continue
                        municipio_cache.setdefault(cd_mun_int, {
                            "nome": mprops.get("NM_MUN") or "",
                            "uf_sigla": mprops.get("SIGLA_UF") or "",
                        })

            extent = sigef_layer.get("extent", 4096)
            for feat in sigef_layer.get("features", []):
                props = feat["properties"]
                cir = str(props.get("codigo_imo") or "").strip()
                if not cir:
                    continue

                geom = _reproject_geometry(feat["geometry"], extent, ZOOM, x, y)
                if geom is None:
                    continue

                shp = shape(geom)
                area_m2, _ = _GEOD.geometry_area_perimeter(shp)
                area_ha = abs(area_m2) / 10000.0

                if area_ha < MIN_AREA_HA:
                    continue

                sigef_uuid = str(props.get("parcela_co") or "").strip()
                if not sigef_uuid:
                    # Sem UUID de certificação não há chave confiável — descarta.
                    continue

                municipio_ibge = props.get("municipio_")

                row = {
                    "cir": cir,
                    "nome_area": props.get("nome_area") or "",
                    "municipio": municipio_cache.get(municipio_ibge, {}).get("nome", ""),
                    "municipio_ibge": municipio_ibge,
                    "uf": uf.upper(),
                    "area_ha": round(area_ha, 2),
                    "status": props.get("status") or props.get("situacao_i") or "",
                    "sigef_uuid": sigef_uuid,
                    "sigef_link": f"https://sigef.incra.gov.br/geo/parcela/detalhe/{sigef_uuid}" if sigef_uuid else "",
                    "geometry_geojson": __import__("json").dumps(mapping(shp), ensure_ascii=False),
                }
                upsert_parcela(row)
                saved += 1
                logger.info(f"[{uf.upper()}] +LEAD {row['nome_area']!r} — {row['area_ha']} ha (CIR {cir})")

            if scanned % 25 == 0:
                logger.info(f"[{uf.upper()}] Progresso: {scanned}/{total_tiles} tiles, {saved} leads >= {MIN_AREA_HA:.0f}ha até agora.")

    logger.info(f"[{uf.upper()}] Concluído. {saved} leads >= {MIN_AREA_HA:.0f}ha salvos/atualizados em {DB_PATH.name}.")
    return saved


def run_sync(ufs: list[str]) -> None:
    init_db()
    with sync_playwright() as p:
        context = get_authenticated_context(p)
        d_token = _capture_d_token(context)
        logger.info(f"Token de sessão capturado (d=...{d_token[-6:]}).")
        for uf in ufs:
            process_uf(context, uf, d_token)
        context.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Geomart Client — Extractor + Geo Resolver (Agent 1+2)")
    parser.add_argument("--uf", default="all", help="mg | sp | all")
    args = parser.parse_args()

    ufs = TARGET_UFS if args.uf.lower() == "all" else [args.uf.lower()]
    run_sync(ufs)
