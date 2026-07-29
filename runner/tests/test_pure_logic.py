"""
Agrostech — Testes de lógica pura (Ceres Cubo + Marketing pré-call)

Roda em segundos, sem rede. Cobre a lógica determinística; os caminhos de
I/O (STAC/Sentinel-2, agrobr, geomart_leads.db) foram validados manualmente
contra dados reais durante o desenvolvimento — inclusive 3 bugs reais
encontrados no pacote agrobr 1.1.0 (ContractViolationError em `queimadas` e
`seguro_rural`, ambos por sentinelas -999/-100 do governo violando o schema
do agrobr), todos absorvidos por `agrobr_client._safe_call`.

Convenção do projeto: sem pytest, script direto (mesmo padrão de
test_wa.py/test_send_wa.py).

Uso:
    python tests/test_pure_logic.py
"""

from __future__ import annotations

import sys
import tempfile
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402


def _ok(msg: str) -> None:
    print(f"  OK    {msg}")


def test_geo_zonal() -> None:
    import os

    import rasterio
    from rasterio.transform import from_origin
    from shapely.geometry import box

    import geo_zonal

    data = np.zeros((10, 10), dtype="uint8")
    data[2:5, 2:5] = 20  # bloco 3x3 = 9 pixels
    transform = from_origin(0, 10, 1, 1)
    path = os.path.join(tempfile.gettempdir(), "_agrostech_test_raster.tif")
    with rasterio.open(
        path, "w", driver="GTiff", height=10, width=10, count=1,
        dtype="uint8", crs="EPSG:32722", transform=transform, nodata=0,
    ) as ds:
        ds.write(data, 1)

    stats = geo_zonal.categorical_zonal_stats(path, box(2, 5, 5, 8))
    assert stats == {20: 9}, f"esperado {{20: 9}}, veio {stats}"
    assert geo_zonal.categorical_zonal_stats(path, box(100, 100, 110, 110)) == {}

    arr = geo_zonal.masked_array(path, box(2, 5, 5, 8))
    assert arr is not None and np.nanmax(arr) == 20

    os.remove(path)
    _ok("geo_zonal.categorical_zonal_stats / masked_array")


def test_marketing_alerts() -> None:
    from marketing_alerts import evaluate_drought_risk, evaluate_fire_alert

    normal = pd.Series([100, 110, 90, 95], index=pd.date_range("2026-01-01", periods=4, freq="MS"))
    assert evaluate_drought_risk(normal) is None, "precipitação normal não deveria alertar"

    seca = pd.Series([100, 110, 90, 15], index=pd.date_range("2026-01-01", periods=4, freq="MS"))
    alert = evaluate_drought_risk(seca)
    assert alert is not None and alert["tipo"] == "estiagem"

    curto = pd.Series([100, 10], index=pd.date_range("2026-01-01", periods=2, freq="MS"))
    assert evaluate_drought_risk(curto) is None, "histórico curto demais não deveria alertar"

    assert evaluate_fire_alert(None) is None
    assert evaluate_fire_alert(pd.DataFrame()) is None
    assert evaluate_fire_alert(pd.DataFrame({"municipio": ["A", "B"]}), min_focos=3) is None
    muitos = pd.DataFrame({"municipio": ["A", "A", "A", "B", "B"]})
    fire = evaluate_fire_alert(muitos, min_focos=3)
    assert fire is not None and fire["focos_detectados"] == 5

    _ok("marketing_alerts.evaluate_drought_risk / evaluate_fire_alert")


def _synthetic_cube(seed: int = 0, h: int = 40, w: int = 40, n_obs: int = 3):
    """Cubo sintético (sem rede), com dois blocos homogêneos artificiais —
    o suficiente para segmentation/features terem estrutura real pra achar."""
    from ceres_cubo.datacube import DataCube, Observation

    rng = np.random.RandomState(seed)
    cube = DataCube(bbox_wgs84=(0, 0, 1, 1))
    for t in range(n_obs):
        base = rng.rand(h, w) * 0.6 - 0.1
        base[5:20, 5:20] = 0.7 + rng.rand(15, 15) * 0.05
        base[25:35, 10:30] = 0.1 + rng.rand(10, 20) * 0.05
        cube.observations.append(Observation(
            date=date(2026, 6, 1 + t),
            cloud_cover=0.0,
            bands={
                "red": rng.rand(h, w) * 0.1, "nir": rng.rand(h, w) * 0.3,
                "green": rng.rand(h, w) * 0.1, "blue": rng.rand(h, w) * 0.1,
            },
            ndvi=base, ndwi=rng.rand(h, w) * 0.2 - 0.1, savi=base * 0.6,
        ))
    return cube


def test_segmentation_and_features() -> None:
    from ceres_cubo.features import extract_features
    from ceres_cubo.segmentation import segment_geo_objects

    cube = _synthetic_cube()
    labels, valid = segment_geo_objects(cube, min_size=10)
    assert labels.shape == (40, 40)
    assert valid.all(), "dados sintéticos não têm NaN — máscara deveria ser toda válida"
    assert (labels >= 0).all()

    features = extract_features(cube, labels, valid)
    assert not features.empty
    assert features.isnull().values.sum() == 0, "nenhuma feature deveria ter NaN"
    expected_cols = {"ndvi_mean", "ndvi_slope", "area_px", "shape_index", "glcm_contrast"}
    assert expected_cols.issubset(features.columns), features.columns

    _ok(f"ceres_cubo.segmentation + features ({len(features)} geo-objetos sintéticos, {features.shape[1]} colunas)")


def test_classify_and_evaluate() -> None:
    from ceres_cubo.classify import CeresCuboClassifier
    from ceres_cubo.evaluate import accuracy_report, stratified_holdout

    rng = np.random.RandomState(0)
    n = 300
    X = pd.DataFrame(rng.randn(n, 10), columns=[f"f{i}" for i in range(10)])
    y_class = rng.choice(["soja", "milho", "pastagem"], size=n)
    X["f0"] += pd.Series(y_class).map({"soja": 5, "milho": -5, "pastagem": 0}).to_numpy()
    y = pd.Series(y_class)

    X_train, X_test, y_train, y_test = stratified_holdout(X, y)
    clf = CeresCuboClassifier().fit(X_train, y_train)
    report = accuracy_report(y_test, clf.predict(X_test))
    assert report["overall_accuracy"] > 0.7, f"classes bem separadas deveriam classificar bem, veio {report['overall_accuracy']}"

    conf = clf.predict_with_confidence(X_test)
    assert (conf["confianca"] <= 1.0).all() and (conf["confianca"] >= 1 / 3).all()

    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "modelo.joblib"
        clf.save(path)
        clf2 = CeresCuboClassifier.load(path)
        assert (clf2.predict(X_test) == clf.predict(X_test)).all()

    _ok(f"ceres_cubo.classify + evaluate (OA sintético={report['overall_accuracy']:.2f})")


def main() -> None:
    tests = [test_geo_zonal, test_marketing_alerts, test_segmentation_and_features, test_classify_and_evaluate]
    print(f"Rodando {len(tests)} testes de lógica pura (sem rede)...\n")
    failed = []
    for t in tests:
        try:
            t()
        except Exception as exc:
            failed.append((t.__name__, exc))
            print(f"  FALHOU {t.__name__}: {type(exc).__name__}: {exc}")
    print()
    if failed:
        print(f"{len(failed)}/{len(tests)} teste(s) falharam")
        sys.exit(1)
    print(f"Todos os {len(tests)} testes passaram.")


if __name__ == "__main__":
    main()
