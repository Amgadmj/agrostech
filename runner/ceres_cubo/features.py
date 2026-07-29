"""
Ceres Cubo — Extração de Atributos por Geo-Objeto

Para cada segmento produzido por `segmentation.py`, monta um vetor de
atributos nas três famílias que o artigo original usa (Chaves et al. 2025,
Seção 2.3.2): temporais (índices espectrais ao longo da série), textura
(GLCM) e geométricos.

Diferença deliberada do artigo: o artigo usa a média de NDVI de CADA data
como uma camada de entrada separada (23 datas fixas = 23 colunas, porque o
data cube deles tinha um número fixo e conhecido de composições por safra).
Aqui o número de cenas Sentinel-2 disponíveis varia por AOI/janela de datas
— em vez de um schema de colunas por data (que quebraria entre execuções com
números de cena diferentes), usamos estatísticas-resumo da série temporal
(média/desvio/mín/máx/amplitude/tendência) por índice. Cobre a mesma
informação (comportamento fenológico ao longo da safra) de forma robusta a
séries de tamanho variável.
"""

from __future__ import annotations

import logging

import numpy as np
import pandas as pd
from scipy import ndimage
from skimage.feature import graycomatrix, graycoprops
from skimage.measure import regionprops

from ceres_cubo.datacube import DataCube

logger = logging.getLogger(__name__)

GLCM_PROPS = ("contrast", "dissimilarity", "homogeneity", "energy", "correlation", "ASM")
GLCM_LEVELS = 32  # níveis de cinza p/ quantização — GLCM cresce O(levels^2), 32 é o padrão da literatura
_TEMPORAL_INDICES = ("ndvi", "ndwi", "savi")


def _temporal_stats(cube: DataCube, labels_shifted: np.ndarray, segment_ids: np.ndarray) -> pd.DataFrame:
    """Estatísticas-resumo (média/desvio/mín/máx/amplitude/tendência) por
    geo-objeto, para cada índice espectral, agregadas com scipy.ndimage
    (vetorizado — evita laço Python sobre milhares de segmentos)."""
    n_obs = len(cube.observations)
    cols: dict[str, np.ndarray] = {}

    for idx_name in _TEMPORAL_INDICES:
        series = np.stack([getattr(o, idx_name) for o in cube.observations])  # (n_obs, h, w)
        # média por segmento em CADA data -> (n_obs, n_segments)
        per_date_means = np.full((n_obs, len(segment_ids)), np.nan)
        for t in range(n_obs):
            band = series[t]
            band_filled = np.where(np.isnan(band), 0.0, band)
            means = ndimage.mean(band_filled, labels=labels_shifted, index=segment_ids)
            per_date_means[t] = means

        cols[f"{idx_name}_mean"] = np.nanmean(per_date_means, axis=0)
        cols[f"{idx_name}_std"] = np.nanstd(per_date_means, axis=0)
        cols[f"{idx_name}_min"] = np.nanmin(per_date_means, axis=0)
        cols[f"{idx_name}_max"] = np.nanmax(per_date_means, axis=0)
        cols[f"{idx_name}_amplitude"] = cols[f"{idx_name}_max"] - cols[f"{idx_name}_min"]

        if n_obs >= 2:
            t_axis = np.arange(n_obs, dtype="float64")
            # inclinação da reta de tendência (mudança por observação) — indício
            # de dupla-safra (queda abrupta = colheita + replantio) vs. estável
            slopes = np.full(len(segment_ids), np.nan)
            valid_cols = ~np.all(np.isnan(per_date_means), axis=0)
            if valid_cols.any():
                y = per_date_means[:, valid_cols]
                y = np.where(np.isnan(y), np.nanmean(y, axis=0, keepdims=True), y)
                coeffs = np.polyfit(t_axis, y, deg=1)
                slopes[valid_cols] = coeffs[0]
            cols[f"{idx_name}_slope"] = slopes
        else:
            cols[f"{idx_name}_slope"] = np.zeros(len(segment_ids))

    return pd.DataFrame(cols, index=segment_ids)


def _geometric_and_texture(
    labels_shifted: np.ndarray, texture_band: np.ndarray, segment_ids: np.ndarray
) -> pd.DataFrame:
    """Um laço só sobre os `regionprops` (que já dá bounding box + máscara
    booleana por objeto) para atributos geométricos e GLCM — evita escanear
    o raster inteiro uma vez por segmento."""
    band_q = _quantize(texture_band, GLCM_LEVELS)
    rows: list[dict] = []

    for region in regionprops(labels_shifted):
        area = region.area
        perimeter = max(region.perimeter, 1e-6)
        shape_index = perimeter / (2 * np.sqrt(np.pi * area))  # 1.0 = círculo perfeito

        window = band_q[region.slice]
        mask = region.image
        sub = np.where(mask, window, 0)

        glcm = graycomatrix(
            sub, distances=[1], angles=[0, np.pi / 4, np.pi / 2, 3 * np.pi / 4],
            levels=GLCM_LEVELS, symmetric=True, normed=True,
        )
        texture_vals = {f"glcm_{p}": float(np.mean(graycoprops(glcm, p))) for p in GLCM_PROPS}

        rows.append({
            "segment_id": region.label,
            "area_px": area,
            "perimeter": perimeter,
            "shape_index": shape_index,
            "eccentricity": region.eccentricity,
            "solidity": region.solidity,
            "extent": region.extent,
            "major_axis_length": region.axis_major_length,
            "minor_axis_length": region.axis_minor_length,
            **texture_vals,
        })

    df = pd.DataFrame(rows).set_index("segment_id")
    return df.reindex(segment_ids)


def _quantize(band: np.ndarray, levels: int) -> np.ndarray:
    filled = np.where(np.isnan(band), 0.0, band)
    lo, hi = -1.0, 1.0
    scaled = np.clip((filled - lo) / (hi - lo), 0.0, 1.0)
    return (scaled * (levels - 1)).astype("uint8")


def extract_features(cube: DataCube, labels: np.ndarray, valid_mask: np.ndarray) -> pd.DataFrame:
    """Monta a tabela de atributos (uma linha por geo-objeto) usada por `classify.py`.

    `labels`/`valid_mask` vêm de `segmentation.segment_geo_objects()`.
    """
    if not cube.observations:
        raise ValueError("Cubo sem observações")

    # skimage.measure.regionprops trata rótulo 0 como fundo/ignorado — como
    # nossos segmentos válidos começam em 0 (saída do felzenszwalb/slic),
    # deslocamos +1 e mapeamos pixels inválidos (-1) para 0 (fundo real).
    labels_shifted = np.where(labels >= 0, labels + 1, 0).astype("int32")
    segment_ids = np.unique(labels_shifted[labels_shifted > 0])

    if segment_ids.size == 0:
        logger.warning("Nenhum geo-objeto válido para extrair atributos")
        return pd.DataFrame()

    texture_band = np.nanmedian(np.stack([o.ndvi for o in cube.observations]), axis=0)

    temporal_df = _temporal_stats(cube, labels_shifted, segment_ids)
    geom_texture_df = _geometric_and_texture(labels_shifted, texture_band, segment_ids)

    features = temporal_df.join(geom_texture_df, how="inner")
    features.index.name = "segment_id"
    logger.info("Atributos extraídos: %d geo-objetos x %d colunas", *features.shape)
    return features
