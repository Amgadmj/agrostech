"""
Ceres Cubo — Avaliação de Acurácia

Reproduz a metodologia do artigo original (Seção 2.3.5): amostragem
aleatória estratificada (20% para validação), matriz de erro, e as três
métricas-padrão de sensoriamento remoto — acurácia do usuário (UA),
acurácia do produtor (PA) e acurácia geral (OA), seguindo Olofsson et al.
(2014), a mesma referência citada no artigo.

Pronto para uso assim que houver amostras de campo/referência reais — hoje
o projeto ainda não tem esse dataset para nossas regiões (GO/MG/PR/RS); ver
`pipeline.py` e a nota de risco na proposta original ("Fase 1 é para
levantar amostras próprias antes de prometer acurácia igual à do artigo").
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix
from sklearn.model_selection import train_test_split


def stratified_holdout(X: pd.DataFrame, y: pd.Series, test_size: float = 0.2, random_state: int = 42):
    """Split estratificado por classe — mesmo desenho do artigo original (80/20)."""
    return train_test_split(X, y, test_size=test_size, stratify=y, random_state=random_state)


def accuracy_report(y_true, y_pred) -> dict:
    """Matriz de erro + UA/PA por classe + OA — mesmo formato das Tabelas 1 e 2 do artigo."""
    labels = sorted(set(y_true) | set(y_pred))
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    cm_df = pd.DataFrame(cm, index=labels, columns=labels)

    diag = np.diag(cm)
    row_sums = cm.sum(axis=1)  # total de referência por classe -> PA
    col_sums = cm.sum(axis=0)  # total classificado por classe -> UA

    with np.errstate(divide="ignore", invalid="ignore"):
        pa = np.where(row_sums > 0, diag / row_sums, np.nan)
        ua = np.where(col_sums > 0, diag / col_sums, np.nan)

    per_class = pd.DataFrame({"classe": labels, "PA": pa, "UA": ua}).set_index("classe")
    overall_accuracy = float(diag.sum() / cm.sum()) if cm.sum() > 0 else float("nan")

    return {"confusion_matrix": cm_df, "per_class": per_class, "overall_accuracy": overall_accuracy}
