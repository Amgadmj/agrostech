"""
Agrostech — agrobr Sync Wrapper (Fase 0 da iniciativa "Duas Alavancas de Dados")

Camada fina sobre `agrobr.sync.datasets` para os datasets que os módulos de
Marketing (`marketing_alerts.py`, `credit_insurance_context.py`) e o BI usam.
Duas responsabilidades além do simples repasse:

1. **Resiliência.** Fontes públicas (INPE, INMET, DERAL...) falham de formas
   variadas — HTTP 404 para "sem dados no dia", timeout, e (confirmado em
   teste real nesta integração) um bug de contrato no próprio agrobr 1.1.0:
   o dataset `queimadas` valida `risco_fogo`/`numero_dias_sem_chuva` com
   mínimo 0, mas o INPE usa -999 como sentinela de "sem dado" — toda consulta
   real dispara `ContractViolationError`. Reportar isso upstream é um
   próximo passo; aqui, cada função devolve um DataFrame vazio em vez de
   propagar a exceção, para que um scan de várias fazendas não pare na
   primeira que falhar.
2. **Aviso de licença.** CEPEA (preço) e outras fontes do agrobr são CC
   BY-NC — uso comercial exige autorização (ver `.claude/skills/agrobr/
   SKILL.md`). Cada função checa a coluna `fonte` do resultado (quando
   existe) e loga um aviso se uma fonte restrita foi usada — sinal para o
   dev, não um bloqueio (uso interno é permitido).

Uso:
    from agrobr_client import clima_uf, queimadas_recentes, condicao_lavouras
    df = clima_uf("MT", ano=2026)
"""

from __future__ import annotations

import logging

import pandas as pd
from agrobr import AgrobrError
from agrobr.sync import datasets

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Fontes com licença restritiva a dados (ver docs/licenses.md do agrobr) —
# uso interno OK, uso client-facing exige aval do Jurídico primeiro.
RESTRICTED_SOURCES = {
    "cepea", "imea", "incra", "b3", "abiove", "anda", "anec", "unica", "noticias_agricolas",
}


def _safe_call(dataset_name: str, fn, /, **kwargs) -> pd.DataFrame:
    """Chama uma função de `datasets`, absorvendo falhas de fonte/contrato."""
    try:
        result = fn(**kwargs)
    except AgrobrError as exc:
        logger.warning("agrobr.%s falhou (%s): %s", dataset_name, type(exc).__name__, exc)
        return pd.DataFrame()
    except Exception as exc:  # rede, parsing etc. — nunca deve derrubar o caller
        logger.warning("agrobr.%s falhou com erro inesperado (%s): %s", dataset_name, type(exc).__name__, exc)
        return pd.DataFrame()

    df = result[0] if isinstance(result, tuple) else result
    if isinstance(df, pd.DataFrame) and "fonte" in df.columns:
        used = {str(f).lower() for f in df["fonte"].dropna().unique()}
        restricted = used & RESTRICTED_SOURCES
        if restricted:
            logger.warning(
                "agrobr.%s usou fonte(s) de licença restrita %s — uso interno OK, "
                "checar Jurídico antes de expor a cliente (.claude/skills/agrobr/SKILL.md)",
                dataset_name, sorted(restricted),
            )
    return df if isinstance(df, pd.DataFrame) else pd.DataFrame()


def clima_uf(uf: str, ano: int | None = None, agregacao: str = "mensal") -> pd.DataFrame:
    """Clima por UF (INMET -> NASA POWER). `agregacao`: 'diario' ou 'mensal'."""
    return _safe_call("clima", datasets.clima, uf=uf, ano=ano, agregacao=agregacao)


def condicao_lavouras(produto: str | None = None) -> pd.DataFrame:
    """Condição semanal da lavoura (DERAL — hoje só cobre Paraná)."""
    return _safe_call("condicao_lavouras", datasets.condicao_lavouras, produto=produto)


def progresso_safra(produto: str, estado: str | None = None) -> pd.DataFrame:
    """Progresso de plantio/colheita (CONAB)."""
    return _safe_call("progresso_safra", datasets.progresso_safra, produto=produto, estado=estado)


def queimadas_recentes(ano: int, mes: int, dia: int, uf: str | None = None, bioma: str | None = None) -> pd.DataFrame:
    """Focos de incêndio (INPE) num único dia.

    NOTA: no agrobr 1.1.0, este dataset falha com ContractViolationError na
    maioria das chamadas reais (o INPE usa -999 como "sem dado" em
    risco_fogo/numero_dias_sem_chuva, e o schema do agrobr rejeita valores
    negativos) — bug a reportar upstream. Até lá, retorna DataFrame vazio
    nesses casos; não é sinal confiável de "sem incêndio".
    """
    return _safe_call("queimadas", datasets.queimadas, ano=ano, mes=mes, dia=dia, uf=uf, bioma=bioma)


def credito_rural_municipio(produto: str, uf: str | None = None, safra: str | None = None) -> pd.DataFrame:
    """Crédito rural agregado por município (BCB/SICOR)."""
    return _safe_call(
        "credito_rural", datasets.credito_rural, produto=produto, safra=safra, uf=uf, agregacao="municipio"
    )


def seguro_rural_uf(uf: str | None = None, produto: str | None = None, ano: int | None = None) -> pd.DataFrame:
    """Apólices de seguro rural / PSR agregadas por UF (MAPA)."""
    return _safe_call("seguro_rural", datasets.seguro_rural, produto=produto, uf=uf, ano=ano)


def uso_do_solo_estado(estado: str, ano: int | None = None) -> pd.DataFrame:
    """Cobertura de uso do solo agregada por estado (MapBiomas) — nível macro,
    não por parcela. Para classificação por parcela, ver `ceres_cubo/`."""
    return _safe_call("uso_do_solo", datasets.uso_do_solo, estado=estado, ano=ano, nivel="estado")
