# AgrosTech — Institutional Agricultural Credit & Radar Risk Intelligence SaaS

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black.svg?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-blue.svg?style=flat&logo=react)](https://react.dev/)
[![CesiumJS](https://img.shields.io/badge/CesiumJS-1.127-orange.svg?style=flat)](https://cesium.com/)
[![Deck.gl](https://img.shields.io/badge/Deck.gl-9.1.4-green.svg?style=flat)](https://deck.gl/)
[![BCB CMN 5.267/2025](https://img.shields.io/badge/BACEN-Resolução%20CMN%205.267%2F2025-00e676.svg?style=flat)](https://www.bcb.gov.br/)
[![ICP-Brasil](https://img.shields.io/badge/ICP--Brasil-PAdES--LTV%20DOC--ICP--15-00e5ff.svg?style=flat)](https://www.gov.br/iti/)

---

## Executive Overview

**AgrosTech** is an institutional-grade SaaS platform purpose-built for agricultural credit underwriting, barter risk management, and continuous orbital asset monitoring under Central Bank regulations (**Banco Central do Brasil Resolução CMN nº 5.267/2025** and **Manual de Crédito Rural — MCR 2-9**).

The platform bridges real Brazilian regulatory cadastres (**Registro Rural / SICAR**), all-weather dual-track synthetic aperture radar (**INPE Sentinel-1 RTC L2 ARD + Sub-Meter Commercial Tasking**), and agricultural credit litigation defense (**Shield-RJ Forensic Engine**) to serve institutional ag lenders, barter desks, FIAGRO investment funds, and grain trading companies.

---

## Core Capabilities

### 1. Live Registro Rural CAR API & Model M1 Net Plantable Area
- **Production Integration:** Authenticated gateway querying official SICAR demonstrativos (`GET /v2/car/demonstrativo/{car}`) with asynchronous polling engine (`PENDING` $\to$ `COMPLETE`).
- **R2C Compliance Checks:** Live verification of CAR active status (`/v2/r2c/situacao`) and overlapping IBAMA embargoes, indigenous lands, and conservation units (`/v2/r2c/restricoes`).
- **Model M1 (*Área Útil Líquida*):** Algorithmic deduction engine under Código Florestal (Law 12.651/2012 Art. 15):
  $$A_{\text{líquida}} = \max\left(0, A_{\text{bruta}} - (A_{\text{APP}} + A_{\text{RL}} - A_{\text{RL em APP}} + A_{\text{servidão}} + A_{\text{restrito}} + A_{\text{embargo}})\right)$$
- Eliminates double-counting of Reserva Legal computed inside APP, providing exact plantable ratios (*Net Arable Ratio*) and credit eligibility thresholds ($\ge 15\%$).

### 2. Dual-Track SAR Orbital Telemetry & M2 Anti-Fuga Harvest Engine
- **Baseline Portfolio Track:** Direct client for INPE Brazil Data Cube (BDC) STAC API (`https://data.inpe.br/bdc/stac/v1/collections/sentinel-1-rtc-1`), extracting 10m Sentinel-1 Radiometrically Terrain-Corrected (RTC) L2 Analysis-Ready Data.
- **Temporal Curves:** Continuous $\gamma^0_{VV}$ and $\gamma^0_{VH}$ temporal backscatter monitoring ($\gamma^0_{\text{dB}} = 10 \cdot \log_{10}(\gamma^0_{\text{linear}})$).
- **All-Weather Harvest Engine (Model M2 Anti-Fuga):** Detects mechanical crop harvesting through dense tropical cloud cover during the rainy season via calibrated drop thresholds:
  $$\Delta \gamma^0_{VH} \le -4.5 \text{ dB} \quad \text{reaching bare soil floor} \quad \gamma^0_{VH} \le -20.0 \text{ dB}$$
- **Climate Refutation Filter ($S_{\text{clima}}$):** Cross-references meteorological precipitation data to mathematically disprove rain/moisture artifacts.
- **Commercial High-Resolution Track:** Modular tasking adapter with strict Zod validation for sub-meter commercial X-band SAR:
  - **Umbra Space (Canopy API):** 0.25m to 1.0m Spotlight mode.
  - **Airbus TerraSAR-X:** Staring Spotlight (0.25m), High Resolution Spotlight (1.0m), and Stripmap (3.0m).

### 3. Bank & Barter Enterprise Risk Console & Passaporte de Crédito Rural
- **Real-Time ScoreCard:** Renders ESG ratings (0–100), rural credit risk categories (`BAIXO`, `MÉDIO`, `ALTO`, `CRÍTICO`), and Net Plantable Area ratios.
- **BCB Resolução CMN nº 5.267/2025 Enforcement:** Displays mandatory continuous SAR orbital monitoring badge for any financed operation exceeding **300 ha**.
- **Passaporte de Crédito Rural AgrosTech:** Automatic credit qualification badge verifying valid SICAR, zero IBAMA embargos, zero indigenous overlaps, and verified plantable ratio.

### 4. Interactive Geospatial Visualizers (2D & Native 3D Cesium)
- **2D Tactical Radar (MapLibre GL v4 + Deck.gl v9):** High-resolution Esri World Imagery, 9-theme MapBiomas Coleção 9.0 WMS rasters, vector boundaries (Gleba, APP hídrica, Reserva Legal), and SAR backscatter heatmaps.
- **Native 3D Digital Twin (CesiumJS v1.127):** High-precision 3D globe with `WorldTerrain` (water masks and vertex normals enabled), 80m–150m extruded boundary prisms with glowing neon styling, and multi-angle camera flight presets (`drone` 35°, `nadir` 90°, and `orbit` 360°).

### 5. Shield-RJ Anti-Fraud War Room & CPC 300/301 Cautelar Strike Action
Protects credit portfolios against pre-planned judicial recovery fraud (*golpe da recuperação judicial*):
1. **Vector 1: Área Inflada:** Detects over-pledged credit when gross area exceeds M1 plantable area by $> 35\%$.
2. **Vector 2: Safra Fantasma:** Flags financing granted on phantom crops where SAR proves continuous bare soil (peak $\gamma^0_{VH} < -16.0 \text{ dB}$).
3. **Vector 3: Fuga de Safra:** Real-time alarm when SAR confirms harvest but zero debtor shipping manifests (NF-e/MDF-e) are issued.
4. **Vector 4: Blindagem Pré-RJ:** Straw person scoring ($S_{\text{straw}} \ge 0.85$) detecting sham leases, new state tax registrations (IE) opened $< 30$ days before harvest, lack of machinery, and CENPROT protest spikes.
- **STJ REsp 1.758.746/GO Precedent:** Grains are fungible consumer goods excluded from the bankruptcy stay period under Lei nº 11.101/2005 Art. 49 §3º.
- **Automated Cautelar Drafting:** One-click generation of urgent search and seizure petitions (*Tutela Cautelar Antecedente de Busca e Apreensão*) under CPC Arts. 300 and 301 before grain commingling in third-party silos.

### 6. Audit-Grade MCR 2-9 Compliance Dossier Generator (ICP-Brasil PAdES-LTV)
- **Central Bank Regulatory Compliance:** BCB Resolução CMN nº 5.267/2025 and MCR 2-9 audit compliance reports.
- **Cryptographic Security:** SHA-256 document integrity hash calculated across cadastral, geometric, and SAR telemetry records.
- **PAdES-LTV Architecture:** Compliant with ICP-Brasil DOC-ICP-15 (OID `2.16.76.1.7.1`) and ETSI EN 319 142.
- **RFC 3161 Timestamping:** Integrated Time-Stamp Authority (ACT SERPRO / AC CAIXA-JUS) Base64 DER tokens.
- **Export Options:** Downloadable structured JSON and signed PDF audit dossier summaries.

---

## Configuration & Environment Variables

Create `.env.local` based on `.env.example`:

```bash
cp .env.example .env.local
```

### Key Environment Variables

| Variable | Required | Description | Example / Default |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase PostGIS endpoint | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public anonymous key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase administrative service role key | `eyJhbGciOi...` |
| `REGISTRO_RURAL_API_KEY` | Yes | Official Registro Rural CAR API key | `rr_live_...` |
| `REGISTRO_RURAL_API_URL` | Optional | Custom Registro Rural gateway URL | `https://api-gateway-v2.registrorural.com.br` |
| `BDC_STAC_URL` | Yes | Brazil Data Cube STAC root endpoint | `https://data.inpe.br/bdc/stac/v1` |
| `BDC_ACCESS_TOKEN` | Optional | Personal access token for INPE BDC | `bdc_token_...` |
| `UMBRA_API_KEY` | Optional | Umbra Space Canopy SAR tasking key | `umbra_live_...` |
| `TERRASARX_API_KEY` | Optional | Airbus TerraSAR-X tasking credential | `tsx_api_...` |
| `NEXT_PUBLIC_CESIUM_ION_TOKEN`| Optional | Cesium Ion access token for 3D world terrain | `eyJhbGci...` |
| `INTEGRITY_MODE` | No | `"production"` (strict live) or `"demo"` (certified fixtures) | `demo` |
| `ALLOW_MOCK_FALLBACK` | No | Fallback to certified reference data on API timeout | `true` |

---

## Getting Started

### Prerequisites
- Node.js 18+ (Node.js 20 or 22 LTS recommended)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/agrostech/saas.git
cd saas

# Install dependencies
npm install
```

### Running Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Production Build & Typecheck
```bash
# Validate TypeScript with zero errors
npx tsc --noEmit

# Compile Next.js 15 production bundle
npm run build
```

### Running Automated E2E Test Suite
The repository includes a 4-Tier requirement-driven opaque-box E2E test suite:
```bash
# Run all E2E test suites (Tiers 1 through 4)
npm run test:e2e
```

---

## Regulatory & Legal References
- **BCB Resolução CMN nº 5.267/2025:** Manual de Crédito Rural (MCR) Seção 2-9 (Socioenvironmental & Climate Impediments) & Mandatory Remote Sensing for operations $> 300\text{ ha}$.
- **Lei nº 12.651/2012 (Código Florestal):** Art. 15 (Reserva Legal computed inside APP).
- **Lei nº 8.929/1994:** Cédula de Produto Rural (CPR) and agricultural collateral.
- **Lei nº 11.101/2005 Art. 49 §3º:** Exclusion of fiduciary agricultural pledges from bankruptcy stay period.
- **STJ REsp 1.758.746/GO:** Binding precedent affirming agricultural grain as fungible commodity subject to immediate precautionary seizure.
- **ICP-Brasil DOC-ICP-15:** Standard for PAdES digital signatures and RFC 3161 timestamps in the Brazilian judiciary.

---

## License
Proprietary & Confidential — AgrosTech Inteligência Territorial e Perícias Digitais Ltda. All rights reserved.
