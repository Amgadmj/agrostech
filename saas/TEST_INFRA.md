# E2E Test Infra: Agrostech SaaS MVP Platform

## Test Philosophy
- **Opaque-box & Requirement-driven**: Derived directly from `ORIGINAL_REQUEST.md` and user-facing specifications without dependence on implementation internals.
- **Methodology**: 4-Tier verification incorporating Category-Partition, Boundary Value Analysis (BVA), Pairwise Combinatorial Testing, and Real-World Workload Scenarios.
- **Deterministic & Automated**: Executable via automated test runner with clean exit codes (0 = all passed).

## Feature Inventory Under Test
| # | Feature | Requirement Source | Tier 1 | Tier 2 | Tier 3 |
|---|---------|-------------------|:------:|:------:|:------:|
| 1 | Registro Rural API Key Authentication | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | SICAR Demonstrativo Polling Lifecycle | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | SICAR Boundary Extraction & Validation | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 4 | R2C Status & Restrições Verification | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 5 | Model M1 Net Plantable Area (*Área Útil Líquida*) Calculation | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 6 | INPE BDC STAC Client Querying Sentinel-1 RTC L2 ARD | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 7 | Temporal Backscatter Curves ($\gamma^0_{VV}$, $\gamma^0_{VH}$, ratio in dB) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 8 | All-Weather Harvest Engine (M2 Anti-Fuga $\Delta\gamma^0_{VH} \le -4.5 \text{ dB}$) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 9 | Commercial High-Res SAR Tasking Adapter (Umbra & TerraSAR-X schemas) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 10 | Onboarding Wizard (CAR code input, stages, geometry render) | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 11 | ScoreCard ESG, Net Area Ratio & CMN 5.267 (>300 ha) Flag | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 12 | 2D MapLibre/Deck.gl Layers & 3D Native Cesium Viewer Mount | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 13 | Shield-RJ Credit Fraud Vectors & CPC 300/301 Cautelar Petition | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 14 | Audit-grade MCR 2-9 Dossier & ICP-Brasil PAdES-LTV Signature Metadata | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 15 | Configuration, Tailwind Neon Tokens & Diagnostic Error Integrity | Codebase & Env | 5 | 5 | ✓ |

## Test Architecture
- **Location**: `tests/e2e/`
- **Runner**: Node.js / TypeScript test runner `tests/e2e/run-all.ts` (executable via `npx tsx tests/e2e/run-all.ts` or `npm run test:e2e`).
- **Format**: Structured test suites divided into `tier1-features/`, `tier2-boundaries/`, `tier3-combinations/`, `tier4-scenarios/`.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Expected Outcome |
|---|----------|--------------------|------------------|
| S1 | Fazenda Buritis/MG Standard Underwriting (217 ha) | F1, F2, F3, F4, F5, F10, F11, F14 | Clean approval, 147.6 ha Net Plantable Area, MCR 2-9 compliant |
| S2 | Large Mato Grosso Grain Operation (> 1,200 ha) | F1, F5, F6, F7, F8, F11, F14 | Mandates continuous orbital SAR monitoring under CMN 5.267, passes M2 harvest check |
| S3 | Illegal Deforestation & IBAMA Embargo Rejection | F1, F4, F5, F11, F14 | Immediate credit halt, red-flagged ScoreCard, MCR 2-9 non-compliance |
| S4 | Rainy Season Anti-Fuga Harvest Diversion Alert | F6, F7, F8, F9, F13 | Persistent clouds penetrated by SAR, $\gamma^0_{VH}$ drop triggers unverified harvest strike |
| S5 | High-Value Debt Restructuring Commercial SAR Forensic Audit | F9, F12, F13, F14 | Sub-meter Umbra spotlight tasking order scheduled, CPC 300/301 petition produced |
| S6 | Complex Topology with Overlapping Reserva Legal and APP | F3, F5, F11 | Prevents double-deduction of overlapping conservation geometry |
| S7 | Invalid / Missing Credentials Diagnostic Halt | F1, F15 | Halts with `CONFIG_MISSING_API_KEY` or `AUTH_UNAUTHORIZED`, no silent fake bypass |
| S8 | Full End-to-End Onboarding to Signed PDF Dossier | F1-F15 | Full pipeline execution from CAR input to ICP-Brasil PAdES-LTV dossier |

## Coverage Thresholds
- Tier 1: $\ge 75$ test cases (5 per feature across 15 features)
- Tier 2: $\ge 75$ boundary and corner test cases (5 per feature)
- Tier 3: $\ge 15$ pairwise cross-feature interaction test cases
- Tier 4: $\ge 8$ real-world end-to-end application scenarios
- **Total Minimum**: $\ge 173$ test cases
