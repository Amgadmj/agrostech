# Demo Video — Brief

**Status: 🔴 not yet recorded — this is a production brief, not the video itself.**

Per the checklist: two minutes, "a CAR number goes in, NDVI maps and
credit evidence come out."

## Suggested shot list (maps to what the code actually does)

1. **0:00–0:15** — Open the onboarding wizard, type/paste a real CAR
   number. (`saas/src/app/dashboard/onboard/page.tsx`)
2. **0:15–0:45** — Show the enrichment pipeline running: SICAR → SIGEF/
   INCRA → IBGE/CPRM steps resolving live on screen (`RadarScanner.tsx`).
3. **0:45–1:15** — Land on the ScoreCard: ESG score, credit-risk level,
   embargo status, and the "Elegível para Passaporte de Crédito Rural"
   flag lighting up green. (`ScoreCard.tsx`)
4. **1:15–1:45** — Switch to the map view (2D NDVI/boundary overlay,
   then the 3D digital-twin terrain view).
5. **1:45–2:00** — Close on the one-line pitch: "CAR number in, bankable
   evidence out."

## Before recording

Use a **real property with the owner's permission** (e.g., Fabio's — the
CAR/SICAR georeferencing survey client) rather than synthetic data, so
the demo doubles as proof, not just a UI walkthrough. [CONFIRM
availability/permission with the founder.]

---
*AgrosTech — Demo Video Brief v1.0 | Confidencial | 2026*
