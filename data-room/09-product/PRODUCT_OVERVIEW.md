# Product Overview

**Status: ✅ grounded directly in the working codebase (`saas/`) — this is
the one section of the data room backed by shipped code, not just plans.**

## What exists today

A Next.js 15 application (`saas/`) implementing the onboarding and
scoring flow described in the checklist ("a CAR number goes in, NDVI
maps and credit evidence come out"):

1. **Land onboarding wizard** (`saas/src/app/dashboard/onboard/page.tsx`)
   — KML upload/parsing (`KmlUploader.tsx`), a "radar scanner" enrichment
   UX (`RadarScanner.tsx`), and a resulting **ScoreCard**.
2. **Enrichment pipeline** (`saas/src/app/api/land/enrich/route.ts`) —
   fuses multiple public/registry data sources against the submitted
   property boundary: **SICAR** (Cadastro Ambiental Rural), **SIGEF/
   INCRA** (certified land georeferencing), and **IBGE/CPRM**
   (biome/hydrology context). Returns an environmental-compliance and
   ESG scorecard.
3. **ScoreCard** (`saas/src/components/wizard/ScoreCard.tsx`) — the
   credit-passport output itself: an ESG score, a rural-credit risk
   level, embargo status, and explicit **"Elegível para Passaporte de
   Crédito Rural AgrosTech"** eligibility flag.
4. **2D/3D visualization** — MapLibre GL + Deck.gl for 2D (`MapView2D.tsx`,
   `MiniMap.tsx`) and Cesium for a full 3D digital-twin terrain view
   (`CesiumViewer.tsx`, `dashboard/land/[id]/3d/page.tsx`).
5. **Multi-tenant data model** (`saas/supabase/schema.sql`) — PostGIS-
   backed, with organizations (bank / agribusiness / investment fund /
   cooperative / trader), role-scoped users (b2c / b2b_admin /
   b2b_viewer), and a `land_parcels` table carrying CAR code, geometry,
   and a `metrics_json` blob (total/APP/legal-reserve/consolidated area,
   average slope).

## What this proves to an investor

The Passaporte de Crédito Rural isn't a slide — it's a running
enrichment pipeline against real Brazilian land-registry data sources
(SICAR, SIGEF/INCRA), with a data model already designed for the B2B
buyer types who'd actually rely on it (banks, agribusiness, investment
funds, cooperatives, traders).

## What's not yet real (be direct about this in the room)

- The enrichment route currently **simulates** the concurrent data
  fusion (fixed-latency `setTimeout` calls standing in for live API/RPC
  calls) — it's a working demo architecture, not yet wired to live
  SICAR/SIGEF endpoints in production. [CONFIRM current integration
  status with the founder before stating this differently to investors.]
- Supabase auth/middleware and the schema exist; [CONFIRM] whether this
  is deployed and in use by real customers yet, or still pre-launch.

---
*AgrosTech — Product Overview v1.0 | Confidencial | 2026*
