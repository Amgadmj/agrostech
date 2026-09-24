# Tech Stack Overview

**Status: ✅ pulled directly from `saas/package.json` and `saas/supabase/schema.sql` — this is what's actually in the repo, not aspirational.**

## Application

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS
- **Mapping/geospatial:** MapLibre GL, Deck.gl (2D), Cesium (3D digital
  twin), `@tmcw/togeojson` (KML parsing)
- **Backend/data:** Supabase (Postgres + PostGIS), with `@supabase/ssr`
  for auth

## Data sources (per `saas/src/app/api/land/enrich/route.ts`)

| Source | What it provides | Status |
|---|---|---|
| SICAR (Cadastro Ambiental Rural) | Land boundary, APP/Reserva Legal demarcation | [CONFIRM — live integration or simulated? See `PRODUCT_OVERVIEW.md`] |
| SIGEF / INCRA | Certified georeferencing, public-land overlap check | [CONFIRM] |
| IBGE / CPRM | Biome and hydrology context | [CONFIRM] |
| Drone-captured imagery/NDVI | Centimeter-accurate boundary, vegetation index | Confirmed in use — see case studies in `06-customers/` |

## Where AI does real work

[CONFIRM — the checklist explicitly asks for this. Candidates based on
the codebase and this repo's broader `runner/` tooling: NDVI-based
stress/anomaly detection, the ESG/credit-risk scoring logic behind
`ScoreCard.tsx`, and (per this repo's `runner/ceres_cubo/` module) a
Sentinel-2-based crop classification pipeline — confirm which of these
are live in the current product vs. internal R&D before presenting to
investors.]

## Data model (multi-tenant, B2B-ready)

`saas/supabase/schema.sql` already models the actual buyer types for the
Passaporte de Crédito Rural: `organizations` (bank, agribusiness,
investment_fund, cooperative, trader) and role-scoped users (`b2c`,
`b2b_admin`, `b2b_viewer`), with `land_parcels` carrying CAR code,
PostGIS geometry, and compliance/metrics JSON.

---
*AgrosTech — Tech Stack Overview v1.0 | Confidencial | 2026*
