"""
Ceres Cubo — Data Cube Sentinel-2 (substitui o MODIS do artigo original)

Constrói uma série temporal de índices espectrais (NDVI, NDWI, SAVI) para uma
área de interesse (AOI), a mesma base que Chaves et al. (AgriEngineering 2025)
usaram — mas em Sentinel-2 10m em vez do MODIS 250m do artigo, adequado ao
tamanho real dos talhões do Geomart. O mesmo grupo de pesquisa já validou essa
troca de resolução (Chaves & Sanches, Remote Sensing Applications: Society and
Environment, 2023).

Busca via STAC público, sem chave (Element84 Earth Search / AWS) e lê só a
janela de pixels da AOI por HTTP range request — nunca baixa a cena inteira
(~700MB+ por banda). Validado neste projeto: busca + leitura de uma janela
pequena leva ~6s por cena.

As bandas red/green/blue/nir vêm nativamente a 10m; swir16 vem a 20m e é
reamostrada (bilinear) para o grid de 10m antes de entrar no cubo — sem essa
reamostragem, um mesmo par (linha, coluna) representaria pixels diferentes
em bandas diferentes.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from datetime import date

# Tuning padrão para leitura de COG via HTTP (GDAL/VSI) — evita listagens de
# diretório desnecessárias e habilita cache local de blocos já lidos. Precisa
# ser setado antes do primeiro `rasterio.open()` de um recurso remoto.
os.environ.setdefault("GDAL_DISABLE_READDIR_ON_OPEN", "EMPTY_DIR")
os.environ.setdefault("CPL_VSIL_CURL_ALLOWED_EXTENSIONS", ".tif,.TIF,.tiff")
os.environ.setdefault("VSI_CACHE", "TRUE")
os.environ.setdefault("GDAL_HTTP_MULTIPLEX", "YES")

import numpy as np  # noqa: E402
import rasterio  # noqa: E402
from pyproj import Transformer  # noqa: E402
from pystac_client import Client  # noqa: E402
from rasterio.enums import Resampling  # noqa: E402
from rasterio.windows import Window, from_bounds  # noqa: E402

logger = logging.getLogger(__name__)

STAC_URL = "https://earth-search.aws.element84.com/v1"
COLLECTION = "sentinel-2-l2a"
NATIVE_10M_BANDS = ("red", "green", "blue", "nir")
RESAMPLED_BANDS = ("swir16",)  # 20m nativo -> reamostrado para o grid de 10m
SAVI_L = 0.5  # fator de correção de solo (Huete, 1988), em unidades de reflectância [0,1]


@dataclass
class Observation:
    date: date
    cloud_cover: float
    bands: dict[str, np.ndarray]  # reflectância [0,1] float32, mesmo shape/grid (10m) p/ todas
    ndvi: np.ndarray
    ndwi: np.ndarray  # NaN onde swir indisponível
    savi: np.ndarray


@dataclass
class DataCube:
    bbox_wgs84: tuple[float, float, float, float]
    observations: list[Observation] = field(default_factory=list)

    def ndvi_stack(self) -> np.ndarray:
        """(n_obs, h, w) — ordem cronológica. Usado por features.py."""
        return np.stack([o.ndvi for o in self.observations]) if self.observations else np.empty((0, 0, 0))


def _window_for_bbox(ds: rasterio.DatasetReader, bbox_wgs84: tuple[float, float, float, float]) -> Window:
    transformer = Transformer.from_crs("EPSG:4326", ds.crs, always_xy=True)
    minx, miny = transformer.transform(bbox_wgs84[0], bbox_wgs84[1])
    maxx, maxy = transformer.transform(bbox_wgs84[2], bbox_wgs84[3])
    return from_bounds(minx, miny, maxx, maxy, ds.transform)


def _read_band(href: str, bbox_wgs84, target_shape: tuple[int, int] | None) -> np.ndarray | None:
    """Lê a janela da AOI de uma banda, reamostrando para `target_shape` se dado."""
    with rasterio.open(href) as ds:
        win = _window_for_bbox(ds, bbox_wgs84)
        if win.width <= 0 or win.height <= 0:
            return None
        out_shape = (1, *target_shape) if target_shape else None
        arr = ds.read(
            1, window=win, out_shape=out_shape,
            resampling=Resampling.bilinear if target_shape else Resampling.nearest,
        ).astype("float32")
    if arr.size == 0:
        return None
    arr[arr == 0] = np.nan  # 0 = nodata em Sentinel-2 L2A COGs (fora da faixa da cena)
    return arr / 10000.0  # DN -> reflectância [0,1] (fator de escala padrão L2A)


def _fetch_observation(item, bbox_wgs84) -> Observation | None:
    bands: dict[str, np.ndarray] = {}

    ref_href = item.assets.get("red")
    if ref_href is None:
        return None
    with rasterio.open(ref_href.href) as ref_ds:
        ref_win = _window_for_bbox(ref_ds, bbox_wgs84)
        target_shape = (max(1, round(ref_win.height)), max(1, round(ref_win.width)))

    for band_name in NATIVE_10M_BANDS:
        asset = item.assets.get(band_name)
        if asset is None:
            continue
        arr = _read_band(asset.href, bbox_wgs84, target_shape=target_shape)
        if arr is not None:
            bands[band_name] = arr

    for band_name in RESAMPLED_BANDS:
        asset = item.assets.get(band_name)
        if asset is None:
            continue
        arr = _read_band(asset.href, bbox_wgs84, target_shape=target_shape)
        if arr is not None:
            bands[band_name] = arr

    if "red" not in bands or "nir" not in bands:
        return None

    red, nir = bands["red"], bands["nir"]
    ndvi = _safe_ratio(nir - red, nir + red)
    savi = _safe_ratio((nir - red) * (1 + SAVI_L), nir + red + SAVI_L)

    if "swir16" in bands:
        swir = bands["swir16"]
        ndwi = _safe_ratio(nir - swir, nir + swir)
    else:
        ndwi = np.full_like(ndvi, np.nan)

    return Observation(
        date=item.datetime.date(),
        cloud_cover=float(item.properties.get("eo:cloud_cover", -1)),
        bands=bands,
        ndvi=ndvi,
        ndwi=ndwi,
        savi=savi,
    )


def _safe_ratio(numerator: np.ndarray, denominator: np.ndarray) -> np.ndarray:
    with np.errstate(divide="ignore", invalid="ignore"):
        return np.where(denominator != 0, numerator / denominator, np.nan)


def build_datacube(
    bbox: tuple[float, float, float, float],
    start: str,
    end: str,
    max_cloud_cover: float = 20.0,
    max_scenes: int = 12,
) -> DataCube:
    """Busca cenas Sentinel-2 L2A na AOI/período e monta o cubo de índices espectrais.

    `bbox`: (min_lon, min_lat, max_lon, max_lat) em WGS84.
    `max_scenes`: teto de cenas processadas (evita cubo gigante por engano;
    o artigo original usou 23 composições/safra — referência de ordem de grandeza).
    """
    client = Client.open(STAC_URL)
    search = client.search(
        collections=[COLLECTION],
        bbox=list(bbox),
        datetime=f"{start}/{end}",
        query={"eo:cloud_cover": {"lt": max_cloud_cover}},
    )
    items = sorted(search.items(), key=lambda it: it.datetime)
    if len(items) > max_scenes:
        logger.info(
            "AOI tem %d cenas sob %.0f%% de nuvem — usando as %d mais recentes",
            len(items), max_cloud_cover, max_scenes,
        )
        items = items[-max_scenes:]

    cube = DataCube(bbox_wgs84=bbox)
    for item in items:
        try:
            obs = _fetch_observation(item, bbox)
        except Exception as exc:
            logger.warning("Cena %s falhou (%s): %s — pulando", item.id, type(exc).__name__, exc)
            continue
        if obs is not None:
            cube.observations.append(obs)

    logger.info(
        "Cubo montado para %s: %d observações válidas de %d cenas buscadas",
        bbox, len(cube.observations), len(items),
    )
    return cube
