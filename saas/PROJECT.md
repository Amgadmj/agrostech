# Project: Agrostech SaaS MVP Platform

## Architecture
Agrostech is an institutional-grade SaaS platform for agricultural credit underwriting, barter risk management, and continuous orbital asset monitoring under Central Bank regulations (BCB Resolução CMN nº 5.267/2025 and MCR 2-9).
- **Frontend**: Next.js 15 App Router, React 19, Tailwind CSS, Lucide icons.
- **Geospatial & 3D Visualization**: MapLibre GL v4, Deck.gl v9 (GeoJsonLayer, TileLayer, MapBiomas WMS), CesiumJS v1.127 (3D terrain elevation, extruded parcels, GLB/3D tiles).
- **Backend & APIs**: Next.js Server Components and Route Handlers (`/api/land/*`, `/api/sar/*`, `/api/dossier/*`).
- **Regulatory Data Integration**:
  - Live Registro Rural CAR API gateway (`https://api-gateway-v2.registrorural.com.br`) for official SICAR demonstrativos and R2C compliance checks.
  - Model M1 Net Plantable Area (*Área Útil Líquida*) calculation engine.
- **Orbital SAR Radar Telemetry**:
  - Baseline Track: INPE Brazil Data Cube STAC API (`https://data.inpe.br/bdc/stac/v1/collections/sentinel-1-rtc-1`) ingesting Sentinel-1 RTC L2 ARD ($\gamma^0_{VV}$ and $\gamma^0_{VH}$ backscatter at 10m).
  - All-Weather Harvest Engine (Model M2 Anti-Fuga) detecting biomass loss during persistent cloud cover.
  - Commercial Track: Sub-meter commercial SAR tasking adapter (TerraSAR-X / Umbra) with Zod validation.
- **Enterprise Risk Console & Forensic Dossier**:
  - Shield-RJ Anti-Fraud War Room (straw person graph, grain diversion alerts, CPC 300/301 cautelar petition).
  - Audit-grade MCR 2-9 compliance report generator with ICP-Brasil digital signature structure (PAdES-LTV, RFC 3161 timestamp, SHA-256 integrity hash).

## Code Layout
- `src/lib/registrorural/`: Registro Rural API client, authentication, diagnostic error classes, polling engine.
- `src/lib/m1/`: Model M1 Net Plantable Area (*Área Útil Líquida*) calculation engine and boundary intersection logic.
- `src/lib/sar/`: INPE BDC STAC client, Sentinel-1 RTC asset parser, dB conversion, temporal backscatter curve generator, M2 Anti-Fuga harvest detection algorithm.
- `src/lib/sar/commercial/`: Sub-meter commercial SAR tasking adapters (Umbra Space Canopy API, Airbus TerraSAR-X) with validation schemas.
- `src/lib/dossier/`: MCR 2-9 compliance dossier generator, ICP-Brasil PAdES-LTV digital signature structures, and RFC 3161 timestamp metadata.
- `src/components/dashboard/`: Risk console UI components (`ScoreCard.tsx`, land metrics, Passaporte de Crédito Rural indicators).
- `src/components/map/`: 2D MapLibre/Deck.gl (`MapView2D.tsx`) and 3D Cesium (`CesiumViewer.tsx`).
- `src/components/shield-rj/`: Shield-RJ timeline, straw person visualizer, and cautelar strike petition modal.
- `src/app/api/`: Next.js API route handlers for land onboarding, SAR telemetry, and dossier generation.
- `tests/e2e/`: Requirement-driven opaque-box E2E test suite (Tiers 1-4) and test runner.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Registro Rural Authentication | Strict `REGISTRO_RURAL_API_KEY` verification with explicit diagnostic errors (`CONFIG_MISSING_API_KEY`, `AUTH_UNAUTHORIZED`) | M1 | ORIGINAL_REQUEST §R1 |
| 2 | SICAR Demonstrativo Query | Query `GET /v2/car/demonstrativo/{car}` with polling on asynchronous `PENDING` to `COMPLETE` states | M1 | ORIGINAL_REQUEST §R1 |
| 3 | SICAR Boundary Parsing | Parse property perimeter, APP (Área de Preservação Permanente), and Reserva Legal geometries | M1 | ORIGINAL_REQUEST §R1 |
| 4 | R2C Regulatory Compliance Checks | Execute `/v2/r2c/situacao` (CAR status active/pending) and `/v2/r2c/restricoes` (embargoes & infractions) | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Model M1 Net Plantable Area (*Área Útil Líquida*) | Compute net arable area deducting APP, RL, overlapping reserves, non-arable geometries, and embargoes | M1 | ORIGINAL_REQUEST §R1 |
| 6 | INPE BDC STAC Client | Query `https://data.inpe.br/bdc/stac/v1/collections/sentinel-1-rtc-1` for Sentinel-1 RTC L2 ARD assets by bbox/datetime | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Temporal Backscatter Curves ($\gamma^0_{VV}$, $\gamma^0_{VH}$) | Extract 10m resolution backscatter assets, convert linear to decibels, compute zonal statistics | M2 | ORIGINAL_REQUEST §R2 |
| 8 | All-Weather Harvest Engine (M2 Anti-Fuga) | Detect crop phenology & harvest events through cloud cover via calibrated cross-pol $\gamma^0_{VH}$ drop ($\le -4.5 \text{ dB}$) | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Commercial High-Res SAR Tasking Adapter | Modular adapter for sub-meter SAR (TerraSAR-X / Umbra) with parameter validation schemas (bbox, resolution, polarization) | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Onboarding Wizard Enrichment Stages | Wizard displaying real enrichment progress stages, geometry rendering, and CAR code query | M3 | ORIGINAL_REQUEST §R3 |
| 11 | ScoreCard Net Plantable Area & CMN 5.267 Badge | Display ESG ratings, Net Plantable Area ratio, active embargoes, and continuous remote sensing eligibility (>300 ha) | M3 | ORIGINAL_REQUEST §R3 |
| 12 | Native 3D Cesium Elevation Visualizer | Mount native `CesiumViewer.tsx` in `/dashboard/land/[id]/3d` with terrain elevation and extruded polygons | M3 | ORIGINAL_REQUEST §R3 |
| 13 | Shield-RJ Credit Fraud Timeline & Visualizer | Timeline and graph of fraud vectors (inflated area, unverified harvest, grain diversion alerts, legal restructuring flags) | M3 | ORIGINAL_REQUEST §R3 |
| 14 | Audit-Grade MCR 2-9 Compliance Report Generator | Dossier generator under BCB Resolução CMN nº 5.267/2025 with ICP-Brasil digital signature structure (PAdES-LTV) | M3 | ORIGINAL_REQUEST §R3 |
| 15 | Tailwind Design Token Fix & Env Config | Register missing `neon` tokens in `tailwind.config.ts` and document all API keys in `.env.example` and `README.md` | M3 | Codebase Exploration |
| 16 | Opaque-Box E2E Test Suite & Test Runner | 4-Tier requirement-driven E2E test suite covering all features with automated execution script | E2E Track | ORIGINAL_REQUEST §Acceptance Criteria |
| 17 | E2E Test Suite 100% Pass (Tiers 1-4) | Full system verification ensuring all E2E test cases pass with exit code 0 | M4 (Final) | Project Pattern |
| 18 | Adversarial Coverage Hardening (Tier 5) | White-box stress testing and edge-case validation by independent Challengers | M4 (Final) | Project Pattern |
| 19 | Production Build & TypeScript Verification | Next.js 15 production build (`npm run build`) and TypeScript check (`tsc --noEmit`) with zero errors | M4 (Final) | ORIGINAL_REQUEST §Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Regulatory CAR Engine & Model M1 Net Plantable Area | Feature 1, 2, 3, 4, 5 (Registro Rural client, polling engine, diagnostic errors, Model M1 engine, `/api/land/enrich` route) | None | IN_PROGRESS |
| M2 | Dual-Track SAR Ingestion & M2 Anti-Fuga Engine | Feature 6, 7, 8, 9 (BDC STAC client, Sentinel-1 RTC L2 ARD, $\gamma^0$ backscatter curves, M2 harvest detection, Umbra/TSX tasking adapters) | None | IN_PROGRESS |
| M3 | Risk Console, Cesium 3D & MCR 2-9 Dossier Generator | Feature 10, 11, 12, 13, 14, 15 (Native Cesium 3D mount, ScoreCard Net Area ratio, Shield-RJ vectors, MCR 2-9 ICP-Brasil dossier, Tailwind tokens, `.env.example`) | M1, M2 interfaces | PLANNED |
| E2E | Opaque-Box E2E Testing Suite Track | Feature 16 (Test infrastructure, test runner, Tiers 1-4 test cases covering Features 1-15, publishes `TEST_READY.md`) | None (Opaque-box) | IN_PROGRESS |
| M4 | Final Milestone: E2E Verification & Adversarial Hardening | Feature 17, 18, 19 (Pass 100% E2E tests, Tier 5 adversarial hardening, Next.js 15 `npm run build`, `tsc --noEmit`, forensic audit) | M1, M2, M3, E2E | PLANNED |

## Interface Contracts

### M1 ↔ Risk Console / API Consumers
- `RegistroRuralClient.consultarDemonstrativo(carCode: string, options?: { maxAge?: number, timeoutMs?: number }): Promise<CarDemonstrativoResult>`
  - Returns `{ status: 'COMPLETE', data: CarDemonstrativoData }` or throws `RegistroRuralError` with diagnostic codes: `CONFIG_MISSING_API_KEY`, `AUTH_UNAUTHORIZED`, `POLLING_TIMEOUT`, `CAR_NOT_FOUND`.
- `calculateNetPlantableArea(input: ModelM1Input): ModelM1Output`
  - Input: `{ grossAreaHa: number, appAreaHa: number, legalReserveAreaHa: number, rlInAppAreaHa?: number, easementsHa?: number, restrictedUseHa?: number, disputedAreaHa?: number, publicOverlapsHa?: number, embargoesHa?: number, consolidatedUseHa?: number }`
  - Output: `{ netPlantableAreaHa: number, preservationRatio: number, netArableRatio: number, deductionsBreakdown: Record<string, number>, isEligibleForCredit: boolean }`
- Route: `POST /api/land/enrich`
  - Request body: `{ car_code?: string, kml_content?: string, coordinates?: [number, number][] }`
  - Response: `{ success: boolean, data: EnrichedLandData, errors?: string[] }`

### M2 ↔ Risk Console / Map Visualizers
- `BdcStacClient.searchSentinel1Rtc(bbox: [number, number, number, number], dateRange: { start: string, end: string }): Promise<StacItem[]>`
- `SarTemporalEngine.generateBackscatterCurve(parcelPolygon: GeoJSON.Polygon, stacItems: StacItem[]): Promise<TemporalBackscatterPoint[]>`
  - `TemporalBackscatterPoint`: `{ date: string, gamma0_vv_db: number, gamma0_vh_db: number, vh_vv_ratio_db: number, pixelCount: number }`
- `HarvestDetectionEngine.detectHarvestEvents(temporalPoints: TemporalBackscatterPoint[], thresholdDb?: number): HarvestDetectionResult`
  - Output: `{ harvestDetected: boolean, harvestDate?: string, dropMagnitudeDb: number, confidence: number, bareSoilReached: boolean }`
- `CommercialSarTaskingAdapter.validateAndScheduleTasking(params: CommercialTaskingParams): CommercialTaskingOrder`
  - Zod validation for provider (`umbra` | `terrasar_x`), bbox, resolutionMode, polarization, acquisitionWindow.
- Route: `POST /api/sar/temporal` and `POST /api/sar/commercial/task`

### M3 ↔ MCR 2-9 Dossier & ICP-Brasil Signature
- `Mcr29DossierGenerator.generateDossier(data: DossierInputData): Promise<Mcr29DossierReport>`
  - Output structure complies with BCB Resolução CMN nº 5.267/2025 and MCR 2-9.
  - Generates cryptographic payload: `{ reportId: string, timestamp: string, sha256Checksum: string, padesSignatureMetadata: PadesLtvMetadata, rfc3161TimestampToken: string, eligibilityStatus: 'ELIGIBLE' | 'IMPEDED', continuousMonitoringMandatory: boolean }`
- Route: `POST /api/dossier/generate`
