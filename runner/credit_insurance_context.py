"""
Agrostech — Pré-laudo de Crédito/Seguro (Marketing pré-call)

Contexto de seguro rural (PSR) por município/UF/cultura, para municiar o
pitch pré-call com um argumento financeiro concreto: "N apólices de seguro
para [cultura] em [município]" em vez de um genérico "drone ajuda a
conseguir crédito". Dado real, agregado por município/UF (agrobr NÃO
identifica produtor individual — correção de uma suposição de granularidade
mais fina discutida antes de checar a API real).

`credito_rural` (BCB/SICOR) segue o mesmo padrão de dataset agregado, mas na
prática a fonte BCB caiu com erro 500 durante o desenvolvimento deste módulo
— tratado pelo fallback de `agrobr_client` (retorna vazio, não quebra).
"""

from __future__ import annotations

import logging

import agrobr_client

logger = logging.getLogger(__name__)


def seguro_rural_contexto(
    uf: str, municipio: str | None = None, cultura: str | None = None, ano: int | None = None
) -> dict | None:
    """Resumo de apólices PSR para município/cultura. None se não houver dado."""
    df = agrobr_client.seguro_rural_uf(uf=uf, ano=ano)
    if df.empty:
        return None

    if municipio and "municipio" in df.columns:
        df = df[df["municipio"].str.upper() == municipio.upper()]
    if cultura and "cultura" in df.columns:
        df = df[df["cultura"].str.upper().str.contains(cultura.upper(), na=False)]
    if df.empty:
        return None

    n_apolices = len(df)
    area_total = float(df["area_total"].sum()) if "area_total" in df.columns else None
    return {
        "uf": uf,
        "municipio": municipio,
        "cultura": cultura,
        "n_apolices": n_apolices,
        "area_segurada_ha": round(area_total, 1) if area_total is not None else None,
        "mensagem": _build_message(n_apolices, area_total, municipio, cultura),
    }


def _build_message(n_apolices: int, area_total: float | None, municipio: str | None, cultura: str | None) -> str:
    local = municipio or "sua região"
    crop_txt = f" de {cultura}" if cultura else ""
    area_txt = f", somando {area_total:,.0f} ha segurados".replace(",", ".") if area_total else ""
    return (
        f"{n_apolices} apólice(s) de seguro rural{crop_txt} registrada(s) em {local}{area_txt} — "
        "um laudo técnico por satélite fortalece o dossiê para renovação ou nova apólice."
    )
