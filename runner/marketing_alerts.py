"""
Agrostech — Alertas Pré-Call de Marketing ("Alerta de Safra" / "Alerta de Incêndio")

Gera avisos proativos e genuinamente úteis para um lead — não é copy de
venda, é um sinal real ("sua região está X% abaixo da chuva esperada") que
o time manda antes de qualquer ligação comercial, seguindo a doutrina da
proposta "Duas Alavancas de Dados": entregar valor antes de pedir algo.

A lógica de decisão (o que conta como "estiagem"/"incêndio relevante") é
pura — recebe Series/DataFrames já buscados, sem I/O — para ser testável
sem rede. As funções `scan_*` fazem a parte de I/O (agrobr + geomart_leads.db).

Limitações reais encontradas construindo isto (documentadas para não
surpreender quem for debugar depois):
  - `agrobr.sync.datasets.clima(agregacao="diario")` devolve dados MENSAIS
    quando cai no fallback NASA POWER (sem AGROBR_INMET_TOKEN, que é o caso
    hoje) — não há granularidade diária sem token INMET. Por isso o alerta
    de estiagem usa queda de precipitação mês-a-mês, não "dias sem chuva".
  - `agrobr.sync.datasets.queimadas()` falha com ContractViolationError na
    maioria das chamadas reais (INPE usa -999 como sentinela de "sem dado"
    em risco_fogo/numero_dias_sem_chuva; o schema do agrobr rejeita valores
    negativos — bug do agrobr 1.1.0, a reportar upstream). `scan_fire_alerts`
    já trata isso via `agrobr_client`, mas hoje não produz alertas reais até
    o bug ser corrigido ou contornado.
"""

from __future__ import annotations

import logging
import sqlite3

import pandas as pd

import agrobr_client
import geomart_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


# ── Lógica pura (testável sem rede) ───────────────────────────────────────

def evaluate_drought_risk(
    precip_by_month: pd.Series, min_months_history: int = 3, low_ratio_threshold: float = 0.4
) -> dict | None:
    """`precip_by_month`: Series indexada por data (um valor por mês) de
    precipitação acumulada em mm. Alerta quando o mês mais recente está bem
    abaixo da média dos meses anteriores — sinal de estiagem fora do padrão
    para a estação, mesmo sem granularidade diária."""
    s = precip_by_month.dropna().sort_index()
    if len(s) < min_months_history + 1:
        return None
    recent = float(s.iloc[-1])
    baseline = float(s.iloc[-(min_months_history + 1):-1].mean())
    if baseline <= 0:
        return None
    ratio = recent / baseline
    if ratio >= low_ratio_threshold:
        return None
    return {
        "tipo": "estiagem",
        "precip_mes_atual_mm": round(recent, 1),
        "media_meses_anteriores_mm": round(baseline, 1),
        "queda_pct": round((1 - ratio) * 100, 1),
        "mensagem": (
            f"Precipitação de {recent:.0f}mm este mês, {(1 - ratio) * 100:.0f}% abaixo da "
            f"média dos {min_months_history} meses anteriores ({baseline:.0f}mm) — sinal de estiagem "
            "fora do padrão para a região."
        ),
    }


def evaluate_fire_alert(focos_df: pd.DataFrame | None, min_focos: int = 3) -> dict | None:
    """`focos_df`: saída de `agrobr_client.queimadas_recentes` para um dia/UF.
    Alerta quando o número de focos supera `min_focos`."""
    if focos_df is None or focos_df.empty:
        return None
    n = len(focos_df)
    if n < min_focos:
        return None
    municipios = (
        focos_df["municipio"].value_counts().head(3).to_dict() if "municipio" in focos_df.columns else {}
    )
    return {
        "tipo": "incendio",
        "focos_detectados": n,
        "municipios_afetados": municipios,
        "mensagem": f"{n} focos de incêndio identificados na sua região — atenção a risco de propagação.",
    }


# ── I/O: varre os leads do Geomart e busca os dados reais ────────────────

def _municipios_ufs(municipio: str | None, uf: str | None) -> list[tuple[str, str]]:
    conn = sqlite3.connect(geomart_client.DB_PATH)
    query = "SELECT DISTINCT municipio, uf FROM parcelas WHERE municipio IS NOT NULL"
    params: list[str] = []
    if municipio:
        query += " AND municipio = ?"
        params.append(municipio)
    if uf:
        query += " AND UPPER(uf) = UPPER(?)"
        params.append(uf)
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [(m, u) for m, u in rows if m and u]


def scan_drought_alerts(municipio: str | None = None, uf: str | None = None) -> list[dict]:
    """Um alerta por UF distinta entre os leads filtrados (clima é por UF, não por município)."""
    ufs = sorted({u for _, u in _municipios_ufs(municipio, uf)})
    alerts = []
    for uf_name in ufs:
        clima_df = agrobr_client.clima_uf(uf_name, agregacao="mensal")
        if clima_df.empty or "precip_acum_mm" not in clima_df.columns:
            continue
        date_col = "mes" if "mes" in clima_df.columns else "data"
        series = clima_df.set_index(date_col)["precip_acum_mm"]
        alert = evaluate_drought_risk(series)
        if alert:
            alert["uf"] = uf_name
            alerts.append(alert)
    logger.info("scan_drought_alerts: %d UF(s) verificadas, %d alerta(s)", len(ufs), len(alerts))
    return alerts


def scan_fire_alerts(municipio: str | None, uf: str | None, ano: int, mes: int, dia: int) -> list[dict]:
    """Ver limitação no docstring do módulo — hoje tende a não retornar
    alertas devido a um bug de contrato no agrobr 1.1.0 (queimadas)."""
    ufs = sorted({u for _, u in _municipios_ufs(municipio, uf)})
    alerts = []
    for uf_name in ufs:
        focos_df = agrobr_client.queimadas_recentes(ano=ano, mes=mes, dia=dia, uf=uf_name)
        alert = evaluate_fire_alert(focos_df)
        if alert:
            alert["uf"] = uf_name
            alerts.append(alert)
    logger.info("scan_fire_alerts: %d UF(s) verificadas, %d alerta(s)", len(ufs), len(alerts))
    return alerts
