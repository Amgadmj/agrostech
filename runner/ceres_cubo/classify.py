"""
Ceres Cubo — Classificador SVM

Reproduz a escolha de algoritmo do artigo original: SVM superou Random
Forest e LDA na mesma paisagem-alvo (Mato Grosso — ver Discussão do artigo,
citando Picoli et al. 2018). Opera sobre os atributos de `features.py`.

StandardScaler é obrigatório antes do SVM: sem padronização, colunas de
escalas muito diferentes (`area_px` na casa das centenas/milhares vs.
índices espectrais em [-1,1]) dominam a distância do kernel RBF e degradam
a classificação — um erro comum e silencioso o suficiente para não aparecer
como bug óbvio, só como acurácia ruim.
"""

from __future__ import annotations

import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

logger = logging.getLogger(__name__)


class CeresCuboClassifier:
    """Pipeline StandardScaler + SVM (kernel RBF), com probabilidade
    habilitada para reportar confiança por predição."""

    def __init__(self, C: float = 10.0, gamma: str | float = "scale", random_state: int = 42):
        # SVC(probability=True) foi descontinuado no sklearn 1.9 em favor de
        # CalibratedClassifierCV — mesma ideia (calibração de Platt), API atual.
        svm = SVC(kernel="rbf", C=C, gamma=gamma, random_state=random_state)
        self.pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("svm", CalibratedClassifierCV(svm, ensemble=False)),
        ])

    @property
    def classes_(self) -> np.ndarray:
        return self.pipeline.named_steps["svm"].classes_

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "CeresCuboClassifier":
        if len(X) != len(y):
            raise ValueError(f"X tem {len(X)} linhas, y tem {len(y)} — não batem")
        if y.nunique() < 2:
            raise ValueError("Precisa de pelo menos 2 classes distintas em y para treinar")
        self.pipeline.fit(X, y)
        logger.info("SVM treinado: %d amostras, classes=%s", len(X), sorted(self.classes_))
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return self.pipeline.predict(X)

    def predict_with_confidence(self, X: pd.DataFrame) -> pd.DataFrame:
        """Classe predita + confiança (probabilidade máxima), uma linha por geo-objeto."""
        proba = self.pipeline.predict_proba(X)
        pred_idx = proba.argmax(axis=1)
        return pd.DataFrame(
            {"classe_predita": self.classes_[pred_idx], "confianca": proba.max(axis=1)},
            index=X.index,
        )

    def save(self, path: str | Path) -> None:
        joblib.dump(self.pipeline, path)
        logger.info("Modelo salvo em %s", path)

    @classmethod
    def load(cls, path: str | Path) -> "CeresCuboClassifier":
        obj = cls()
        obj.pipeline = joblib.load(path)
        return obj
