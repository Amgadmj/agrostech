---
name: agrobr
description: Use when a task needs Brazilian agricultural market, production, climate, land-use, credit/insurance, or trade data — Deal Desk client research, ABM pitch enrichment for the Geomart pipeline, market-intelligence memos, sales-content generation (trend_hijacker), carbon-credit MRV context, or any BI question about prices, safras, CAR/SICAR, MapBiomas, clima, crédito rural, seguro rural, or comércio exterior. Wraps 40 official Brazilian sources (CEPEA, CONAB, IBGE, INMET, INPE, MapBiomas, SICAR, BCB/SICOR, MAPA PSR, B3, ComexStat, USDA, Embrapa, etc.) behind one Python API.
---

# agrobr — Brazilian Agricultural Data Library

`agrobr` (PyPI, MIT-licensed, Python ≥3.11) gives Agrostech one Python API over 40
official Brazilian agro data sources instead of hand-rolling a scraper/client per
source (which is exactly what `runner/agrofit_client.py`, `agrotermos_client.py`,
`smartsolos_client.py` do today for Embrapa alone). It has automatic per-source
fallback chains, a local DuckDB cache (18h TTL), Pydantic v2 validation, and both an
async-first API and a sync wrapper.

```bash
pip install agrobr          # add browser extra only if you need JS-rendered sources:
pip install "agrobr[browser]" && playwright install chromium
```

Docs: https://www.agrobr.dev/docs/ · GitHub: https://github.com/bruno-portfolio/agrobr

## ⚠️ Data licensing — read before using in anything client-facing

agrobr's *code* is MIT. The *data* is not uniformly free to use commercially:

- **CEPEA/ESALQ price data is CC BY-NC 4.0 — "commercial use requires authorization."**
  This is the source behind `preco_diario` and `futuros_agricolas`'s primary chain.
  Fine for internal market-intelligence/pricing-rationale use (informing our own
  quotes). **Do NOT redistribute, publish, or embed raw CEPEA-derived numbers in a
  paid product/report/dashboard sold to clients** without CEPEA authorization first —
  route that decision through Legal (`agents/support/legal_compliance.md`).
- Also gray-area/NC: IMEA, INCRA land registry, B3, ABIOVE, ANDA, ANEC, UNICA,
  Notícias Agrícolas — agrobr surfaces a warning on first use of each.
- Full source-by-source table: `docs/licenses.md` in the agrobr repo — check it before
  building any feature that surfaces this data outside internal use.

## API pattern

```python
# Async-first (preferred inside CrewAI @tool functions — they're already async-safe)
from agrobr import datasets
df = await datasets.preco_diario("soja")

# Per-source modules for more control
from agrobr import cepea, conab, ibge, nasa_power
df = await cepea.indicador("soja", inicio="2024-01-01")
df = await conab.safras("soja", safra="2024/25")
df = await ibge.pam("soja", ano=2023, nivel="uf")
df = await nasa_power.clima_uf("MT", ano=2025)

# Sync wrapper — use this in non-async runner scripts (deal_desk.py, trend_hijacker.py)
from agrobr.sync import cepea, nasa_power
df = cepea.indicador("soja")
```

Env vars needed for a few sources: `AGROBR_INMET_TOKEN`, `AGROBR_USDA_API_KEY`,
`AGROBR_MAPBIOMAS_ALERTA_TOKEN` (only if those specific datasets are used).

## Dataset catalog → Agrostech use case

| Dataset | Wraps | Where it plugs in |
|---|---|---|
| `preco_diario`, `futuros_agricolas` | CEPEA→Notícias Agrícolas, B3 | Deal Desk `research_client()` pricing context (internal use only — see license note) |
| `custo_producao`, `zoneamento_agricola` (ZARC) | CONAB, MAPA/Embrapa | Deal Desk ROI framing; flags crop-risk zoning per município for pitch qualification |
| `credito_rural`, `seguro_rural` (PSR) | BCB/SICOR, MAPA PSR | Finance-board market sizing; identifies which prospects already hold rural credit/insurance — prime targets for "laudo técnico para banco" upsell (already an Enterprise line item, see `UNIT_ECONOMICS.md`) |
| `estimativa_safra`, `progresso_safra`, `condicao_lavouras` | CONAB, IBGE LSPA, DERAL | Geomart pipeline ABM triggers — time pitches to real planting/harvest windows instead of guessing |
| `clima` | INMET→NASA POWER | Chief Pilot mission-window planning (rain/wind risk by UF) |
| `uso_do_solo` (MapBiomas), `cadastro_rural` (CAR/SICAR) | MapBiomas, SICAR/WFS | Cross-check/backfill for `geomart_client.py` + `mapbiomas_client.py` — national coverage vs. our per-tile manual downloads |
| `desmatamento`, `queimadas` | INPE TerraBrasilis | Carbon-credit MRV baseline context; environmental-risk flag on prospects |
| `exportacao`, `comercio_internacional`, `oferta_demanda_global` | ComexStat, UN Comtrade, USDA PSD | Marketing/`trend_hijacker.py` content ("Brazil soy exports up X% — here's why NDVI monitoring matters now") |
| `pib_agro`, `serie_historica_safra`, `producao_anual` | IBGE SIDRA, CONAB | CEO/board-level market-intelligence memos |

Full 36-dataset table: fetch `https://www.agrobr.dev/docs/` for anything not listed
above (livestock, dairy, forestry, port movement, wholesale/CEASA prices, etc.).

## Gotchas

- **Async by default.** Every runner script that calls agrobr directly (not via
  `agrobr.sync`) must run inside an event loop — `agent_router.py` already uses
  `asyncio`, so prefer the async API there; use `agrobr.sync` in flat scripts like
  `deal_desk.py`'s CLI path.
- **Cache is local DuckDB, not shared** across machines/deploys — don't assume a
  cached value on one runner instance exists on another.
- **This is a research/context layer, not a system of record.** Don't replace
  `geomart_client.py`'s parcel geometry or `deal_desk.py`'s COGS math with agrobr —
  it complements them (market context, cross-validation) but `knowledge-base/
  UNIT_ECONOMICS.md` and our own SIGEF/geo data stay the sources of truth.
