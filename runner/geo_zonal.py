"""
Agrostech — Zonal Statistics sem pyogrio

`rasterstats.zonal_stats` importa `pyogrio` para I/O vetorial. Em máquinas com
Windows Application Control ativo, o binário compilado do pyogrio
(`pyogrio/_io`) é bloqueado — "An Application Control policy has blocked this
file" — quebrando qualquer import de `rasterstats`, mesmo quando a geometria
já está em memória (não vem de shapefile/GeoJSON em disco, então pyogrio nem
seria necessário). Confirmado nesta máquina: `rasterio` sozinho funciona,
`rasterstats` não (via `pyogrio`).

Este módulo reimplementa as duas operações que o projeto usa — estatística
categórica de classes e extração de valores contínuos sob um polígono — só
com `rasterio.mask`, evitando o pacote problemático por completo.
Usado por `mapbiomas_client.py` e `ceres_cubo/`.
"""

from __future__ import annotations

import numpy as np
import rasterio
from rasterio.mask import mask as rio_mask


def categorical_zonal_stats(raster_path: str, geometry, nodata: int | float | None = None) -> dict[int, int]:
    """Conta pixels por valor de classe dentro de `geometry` (mesmo CRS do raster).

    Equivalente a `rasterstats.zonal_stats([geometry], raster_path, categorical=True)[0]`.
    `geometry` aceita qualquer objeto com `__geo_interface__` (ex.: shapely) ou
    um dict GeoJSON-like já reprojetado para o CRS do raster.
    """
    with rasterio.open(raster_path) as ds:
        nd = nodata if nodata is not None else ds.nodata
        try:
            out_image, _ = rio_mask(ds, [geometry], crop=True, filled=True, nodata=nd)
        except ValueError:
            return {}  # geometria não intersecta o raster
        band = out_image[0]
    values, counts = np.unique(band, return_counts=True)
    return {int(v): int(c) for v, c in zip(values, counts) if nd is None or v != nd}


def masked_array(raster_path: str, geometry, band: int = 1) -> np.ndarray | None:
    """Retorna o array 2D (mascarado como NaN fora da geometria) de `band` sob `geometry`.

    Usado para estatística contínua (NDVI médio, recorte visual) em vez de
    contagem categórica. Retorna None se a geometria não intersecta o raster.
    """
    with rasterio.open(raster_path) as ds:
        try:
            out_image, out_transform = rio_mask(
                ds, [geometry], crop=True, filled=True, nodata=ds.nodata, indexes=band
            )
        except ValueError:
            return None
        arr = out_image.astype("float64")
        if ds.nodata is not None:
            arr[arr == ds.nodata] = np.nan
    return arr
