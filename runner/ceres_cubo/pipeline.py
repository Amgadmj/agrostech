"""
Ceres Cubo — Pipeline (CLI)

Orquestra o motor ponta a ponta: resolve a AOI (união dos leads reais do
Geomart num município, ou uma bbox direta) -> monta o data cube Sentinel-2
-> segmenta em geo-objetos -> extrai atributos -> classifica (se houver
amostras rotuladas) ou agrupa exploratoriamente (se não houver — nosso
caso hoje, para a maioria das regiões).

Uso:
    # AOI a partir de leads reais do Geomart (compara com o baseline atual)
    python -m ceres_cubo.pipeline --municipio Uberaba --uf MG

    # AOI direta, sem depender do banco de leads
    python -m ceres_cubo.pipeline --bbox -47.98 -19.80 -47.88 -19.70

    # Com amostras de campo rotuladas (treina + avalia, mesmo desenho do artigo)
    python -m ceres_cubo.pipeline --municipio Uberaba --uf MG --labels-csv amostras.csv --save-model modelo.joblib

Formato de --labels-csv: colunas `segment_id,classe` (segment_id = índice da
tabela de atributos impressa em --dry-run; na prática, amostras de campo
raramente vêm com segment_id pronto — o fluxo real é desenhar/apontar a
amostra no mapa e casar com o geo-objeto que a contém; isso é trabalho de
campo da Fase 1, não deste CLI).
"""

from __future__ import annotations

import argparse
import json
import logging
import sqlite3

import pandas as pd
from shapely.geometry import shape
from shapely.ops import unary_union
from sklearn.cluster import KMeans

import geomart_client
from ceres_cubo.classify import CeresCuboClassifier
from ceres_cubo.datacube import build_datacube
from ceres_cubo.evaluate import accuracy_report, stratified_holdout
from ceres_cubo.features import extract_features
from ceres_cubo.segmentation import segment_geo_objects

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Uma cena Sentinel-2 cobre ~110km de lado (uma zona UTM). Uma AOI maior que
# isso cruza tiles/zonas diferentes; `datacube.py` trata cada cena STAC como
# UMA observação completa da AOI, sem mosaico entre tiles — numa AOI maior,
# datas parcialmente cobertas por tile entrariam no cubo com shape/recorte
# errado. Município inteiro (ex.: Uberaba, ~110km x 255km de leads) estoura
# esse limite; por isso o modo --municipio soma todos os leads sem checar
# isso seria silenciosamente incorreto. Mosaico entre tiles é Fase 2.
MAX_AOI_DEG = 0.9  # ~90-100km no equador; margem de segurança abaixo de uma cena


def bbox_from_municipio(municipio: str, uf: str, buffer_deg: float = 0.01) -> tuple[float, float, float, float]:
    """União das geometrias dos leads do Geomart no município -> bbox WGS84 com margem."""
    conn = sqlite3.connect(geomart_client.DB_PATH)
    rows = conn.execute(
        "SELECT geometry_geojson FROM parcelas WHERE municipio = ? AND UPPER(uf) = UPPER(?)",
        (municipio, uf),
    ).fetchall()
    conn.close()
    if not rows:
        raise ValueError(f"Nenhum lead do Geomart encontrado para {municipio}/{uf} em {geomart_client.DB_PATH}")

    geoms = [shape(json.loads(r[0])) for r in rows]
    minx, miny, maxx, maxy = unary_union(geoms).bounds
    logger.info("AOI de %s/%s: %d leads Geomart, bbox=(%.4f, %.4f, %.4f, %.4f)",
                municipio, uf, len(rows), minx, miny, maxx, maxy)
    return (minx - buffer_deg, miny - buffer_deg, maxx + buffer_deg, maxy + buffer_deg)


def baseline_gap(municipio: str, uf: str) -> dict:
    """Quantifica o problema atual (proposta original): quantos leads do
    município seguem 'Indefinido' na predição de cultura de hoje (mapbiomas_client.py)."""
    conn = sqlite3.connect(geomart_client.DB_PATH)
    total, indefinido = conn.execute(
        "SELECT COUNT(*), SUM(CASE WHEN cultura_provavel IS NULL OR cultura_provavel = 'Indefinido' THEN 1 ELSE 0 END) "
        "FROM parcelas WHERE municipio = ? AND UPPER(uf) = UPPER(?)",
        (municipio, uf),
    ).fetchone()
    conn.close()
    return {"total_leads": total or 0, "indefinido_hoje": indefinido or 0}


def run_pipeline(bbox: tuple[float, float, float, float], start: str, end: str,
                  labels_csv: str | None, save_model: str | None, n_clusters: int) -> pd.DataFrame:
    width, height = bbox[2] - bbox[0], bbox[3] - bbox[1]
    if width > MAX_AOI_DEG or height > MAX_AOI_DEG:
        raise ValueError(
            f"AOI de {width:.2f}x{height:.2f} graus excede {MAX_AOI_DEG} graus (~uma cena Sentinel-2). "
            "Provavelmente cruza múltiplos tiles/zonas UTM, o que este pipeline ainda não mosaica "
            "(Fase 2). Rode por cluster de leads próximos ou passe um --bbox menor."
        )
    cube = build_datacube(bbox, start, end)
    if not cube.observations:
        raise RuntimeError("Nenhuma cena Sentinel-2 utilizável na AOI/período — tente ampliar a janela de datas")

    labels_arr, valid_mask = segment_geo_objects(cube)
    features = extract_features(cube, labels_arr, valid_mask)
    if features.empty:
        raise RuntimeError("Nenhum geo-objeto válido extraído")

    if labels_csv:
        samples = pd.read_csv(labels_csv).set_index("segment_id")
        joined = features.join(samples[["classe"]], how="inner")
        if joined.empty:
            raise ValueError("Nenhum segment_id de --labels-csv bate com os geo-objetos desta AOI")
        X, y = joined.drop(columns=["classe"]), joined["classe"]
        X_train, X_test, y_train, y_test = stratified_holdout(X, y)
        clf = CeresCuboClassifier().fit(X_train, y_train)
        report = accuracy_report(y_test, clf.predict(X_test))
        logger.info("Acurácia geral (OA) no hold-out: %.3f", report["overall_accuracy"])
        print(report["per_class"].round(3).to_string())
        if save_model:
            clf.save(save_model)
        result = clf.predict_with_confidence(features)
    else:
        logger.warning(
            "MODO EXPLORATÓRIO — sem --labels-csv, não há classe real para treinar. "
            "Agrupando geo-objetos por similaridade (KMeans, k=%d) só para checar se o "
            "cubo+segmentação captura estrutura real — isto NÃO é classificação de cultura.",
            n_clusters,
        )
        km = KMeans(n_clusters=min(n_clusters, len(features)), random_state=42, n_init=10)
        cluster_id = km.fit_predict(features)
        result = pd.DataFrame({"cluster_exploratorio": cluster_id}, index=features.index)
        cluster_ndvi = features["ndvi_mean"].groupby(cluster_id).mean().round(3)
        logger.info("NDVI médio por cluster exploratório:\n%s", cluster_ndvi.to_string())

    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Ceres Cubo — pipeline data cube + GEOBIA + SVM")
    aoi = parser.add_mutually_exclusive_group(required=True)
    aoi.add_argument("--bbox", nargs=4, type=float, metavar=("MIN_LON", "MIN_LAT", "MAX_LON", "MAX_LAT"))
    aoi.add_argument("--municipio", type=str)
    parser.add_argument("--uf", type=str, help="Obrigatório com --municipio")
    parser.add_argument("--start", default="2026-05-01")
    parser.add_argument("--end", default="2026-07-28")
    parser.add_argument("--labels-csv", default=None, help="CSV com colunas segment_id,classe")
    parser.add_argument("--save-model", default=None, help="Caminho para salvar o modelo treinado (.joblib)")
    parser.add_argument("--n-clusters", type=int, default=6, help="Modo exploratório: nº de clusters KMeans")
    args = parser.parse_args()

    if args.municipio:
        if not args.uf:
            parser.error("--municipio exige --uf")
        gap = baseline_gap(args.municipio, args.uf)
        logger.info(
            "Baseline atual (mapbiomas_client.py): %d/%d leads em %s/%s ainda 'Indefinido'",
            gap["indefinido_hoje"], gap["total_leads"], args.municipio, args.uf,
        )
        bbox = bbox_from_municipio(args.municipio, args.uf)
    else:
        bbox = tuple(args.bbox)

    result = run_pipeline(bbox, args.start, args.end, args.labels_csv, args.save_model, args.n_clusters)
    print(result.head(20).to_string())


if __name__ == "__main__":
    main()
