"""
Ceres Cubo — Segmentação Geo-Objeto (substituto open-source do GEOBIA/eCognition)

O artigo original usa o algoritmo de Segmentação Multirresolução (MRS) do
eCognition Developer (software proprietário, licença paga) para agrupar
pixels espectralmente homogêneos em "geo-objetos". Este módulo reproduz o
mesmo papel — pixels vizinhos e parecidos viram uma unidade — com
`skimage.segmentation.felzenszwalb`, um algoritmo de segmentação por grafo
bem estabelecido em sensoriamento remoto como alternativa aberta ao MRS.
Zero custo de licença.

Upgrade path documentado (não implementado aqui para não arriscar mais uma
dependência binária pesada num piloto): `pyshepseg` (algoritmo de Shepherd)
reproduz mais de perto o comportamento do MRS e vale avaliar se a Fase 1
mostrar que a granularidade do Felzenszwalb não é suficiente.
"""

from __future__ import annotations

import logging

import numpy as np
from skimage.segmentation import felzenszwalb, slic

from ceres_cubo.datacube import DataCube

logger = logging.getLogger(__name__)


def _composite(cube: DataCube) -> tuple[np.ndarray, np.ndarray]:
    """Empilha a mediana temporal de NDVI/NDWI/SAVI em uma imagem 3-canais
    normalizada [0,1], mais a máscara de pixels válidos (não-nodata) em
    TODAS as observações — segmentar sobre nodata gera geo-objetos falsos."""
    if not cube.observations:
        raise ValueError("Cubo sem observações — rode build_datacube() primeiro")

    ndvi = np.nanmedian(np.stack([o.ndvi for o in cube.observations]), axis=0)
    ndwi = np.nanmedian(np.stack([o.ndwi for o in cube.observations]), axis=0)
    savi = np.nanmedian(np.stack([o.savi for o in cube.observations]), axis=0)

    valid_mask = ~(np.isnan(ndvi) | np.isnan(savi))  # ndwi pode faltar sem invalidar o pixel

    def _norm(band: np.ndarray) -> np.ndarray:
        filled = np.where(np.isnan(band), 0.0, band)
        lo, hi = -1.0, 1.0  # faixa teórica dos índices normalizados
        return np.clip((filled - lo) / (hi - lo), 0.0, 1.0)

    composite = np.dstack([_norm(ndvi), _norm(np.nan_to_num(ndwi)), _norm(savi)]).astype("float64")
    return composite, valid_mask


def segment_geo_objects(
    cube: DataCube,
    method: str = "felzenszwalb",
    scale: float = 150.0,
    sigma: float = 0.6,
    min_size: int = 40,
    n_segments: int = 400,
) -> tuple[np.ndarray, np.ndarray]:
    """Segmenta o cubo em geo-objetos a partir da composição mediana NDVI/NDWI/SAVI.

    Retorna `(labels, valid_mask)`: `labels` é um array 2D de inteiros (um
    geo-objeto por rótulo, mesmo shape do cubo); `valid_mask` marca pixels
    com dado real em todas as observações (nodata fora da faixa da cena,
    nuvem já filtrada na busca STAC). `min_size` em pixels — a 10m/pixel,
    40px ~= 0,4ha, evita geo-objetos-ruído menores que qualquer talhão real.
    """
    composite, valid_mask = _composite(cube)

    if method == "felzenszwalb":
        labels = felzenszwalb(composite, scale=scale, sigma=sigma, min_size=min_size)
    elif method == "slic":
        labels = slic(composite, n_segments=n_segments, compactness=8.0, sigma=sigma, start_label=1)
    else:
        raise ValueError(f"method desconhecido: {method!r} (use 'felzenszwalb' ou 'slic')")

    labels = labels.astype("int32")
    labels[~valid_mask] = -1  # -1 = fora da área válida, features.py descarta

    n_objects = len(np.unique(labels[labels >= 0]))
    logger.info(
        "Segmentação (%s): %d geo-objetos sobre %d/%d pixels válidos",
        method, n_objects, int(valid_mask.sum()), valid_mask.size,
    )
    return labels, valid_mask
