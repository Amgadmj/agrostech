# Tech Stack Overview

**Status: ✅ application layer pulled directly from `saas/package.json` and
`saas/supabase/schema.sql`; the three proprietary models (M1/M2/M3) are
confirmed by the pitch deck's "Como Funciona" slide.**

## The three proprietary models (per the deck)

This is the actual moat, per the deck's own framing — the 40% of the
raise going to "Dados e IA" (see `04-investment-documents/USE_OF_FUNDS.md`)
is building these three:

| Model | Tagline | What it does |
|---|---|---|
| **M1 — Filtro de Área Útil** | "Mede o que dá para plantar." | Strips Reserva Legal, APP, and slopes out of the credit limit calculation — the "área útil líquida" that actually backs a loan, not the gross registered area. |
| **M2 — Radar SAR Anti-Fuga** | "Enxerga através das nuvens." | Orbital SAR (Synthetic Aperture Radar) microwave sensing tracks the crop in any weather, flagging before grain physically disappears from the property ("fuga de grãos" — one of the four fraud vectors in `06-customers/MARKET_RESEARCH.md`). |
| **M3 — Protocolo Halo** | "Percebe a carga que não bate." | A 5km ring cross-references the property's biology/production capacity against outbound cargo movements, catching the mismatch that indicates ESG laundering (deforested land passed off as "clean" via CAR). |

**Why this matters for IP protection:** these three named, proprietary
methods are the company's core technical asset. See
`05-legal/IP_ASSIGNMENT.md` — they should be the first priority for
formal IP assignment documentation, not an afterthought.

## Application layer (from `saas/package.json` and `saas/supabase/schema.sql`)

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS
- **Mapping/geospatial:** MapLibre GL, Deck.gl (2D), Cesium (3D digital
  twin), `@tmcw/togeojson` (KML parsing)
- **Backend/data:** Supabase (Postgres + PostGIS), with `@supabase/ssr`
  for auth

## Data sources (per `saas/src/app/api/land/enrich/route.ts`, cross-referenced against M1–M3)

| Source | What it provides | Maps to |
|---|---|---|
| SICAR (Cadastro Ambiental Rural) | Land boundary, APP/Reserva Legal demarcation | M1 (Filtro de Área Útil) |
| SIGEF / INCRA | Certified georeferencing, public-land overlap check | M1 |
| IBGE / CPRM | Biome and hydrology context | Supporting context for all three |
| Orbital SAR | All-weather crop tracking | M2 (Radar SAR Anti-Fuga) |
| Cargo/logistics cross-reference | Production-vs-outbound mismatch detection | M3 (Protocolo Halo) |
| Drone-captured imagery/NDVI | Centimeter-accurate boundary, vegetation index, anomaly-triggered flights | Ground-truth layer under all three; "drone só quando há anomalia" |

[CONFIRM — which of M1/M2/M3 are live in the production `saas/` app
today versus still in development; the current `enrich/route.ts`
implementation simulates its pipeline with fixed-latency calls rather
than live API/RPC integration, so the gap between "model exists as
methodology" and "model runs in production" needs a straight answer
before investor diligence.]

## Output format

Every stage of the Passaporte de Crédito Rural produces an **MCR 2-9
dossier, digitally signed with ICP-Brasil**, audit-ready — this is what
makes the output usable as compliance evidence for Resolução CMN nº
5.267/2025 (see `06-customers/MARKET_RESEARCH.md`), not just an internal
analytics report.

## Data model (multi-tenant, B2B-ready)

`saas/supabase/schema.sql` already models the actual buyer types for the
Passaporte de Crédito Rural: `organizations` (bank, agribusiness,
investment_fund, cooperative, trader) and role-scoped users (`b2c`,
`b2b_admin`, `b2b_viewer`), with `land_parcels` carrying CAR code,
PostGIS geometry, and compliance/metrics JSON.

---
*AgrosTech — Tech Stack Overview v2.0 | Confidencial | 2026 | Reconciled against the founder's pitch deck (2026-09-24)*
