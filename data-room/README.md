# AgrosTech — Data Room

Built for early-stage VC conversations. Structure follows the checklist in
`AgrosTech data room` (Mariya Valeva's data-room framework), grouped into
three parts plus the SAFE terms. **v2.0: reconciled against the
founder's pitch deck** (`01-company-snapshot/AgrosTech_Pitch_Narrativo.pdf`,
supplied 2026-09-24).

**Status legend used throughout:** 🟡 drafted from known facts · 🔴 needs
founder input or legal review · ✅ ready to share as-is / confirmed by
the deck.

## How this is organized

```
data-room/
├── 01-company-snapshot/    One-pager, pitch deck (PDF + reconciliation map), case study, vision
├── 02-team/                Bios, vesting/ESOP, advisor note, org design, hiring plan
├── 03-company-documents/   Incorporation status, founders' agreement, board consents
├── 04-investment-documents/ Cap table, use of funds, SAFE, prior rounds, investor update template
├── 05-legal/                IP assignment, trademarks, LGPD, NDA, drone/agro compliance, insurance
├── 06-customers/            Contracts, pipeline, testimonials, market research, competitive landscape, KPIs
├── 07-financials/           Financial model, hypotheses, unit economics, tax/compliance
├── 08-gtm-revenue/          GTM strategy, pricing, ICP, sales playbook
├── 09-product/              Demo video brief, roadmap, tech stack, security
└── 10-press-brand/          Brand assets, press kit
```

## Core numbers (confirmed by the founder and the pitch deck, 2026-09-24)

**USD is the primary currency** — the SAFE is a US-dollar instrument
and the deck itself is denominated in USD. R$ figures are shown at an
assumed ≈R$5.00/US$1 for context.

| Item | Value | Source |
|---|---|---|
| Core pricing | **US$ 0.80/ha/year** (≈ R$ 4/ha/year) subscription (Passaporte de Crédito Rural) + one-off survey services | Founder / pitch deck "O Mercado" slide |
| Raise | **US$ 600,000** (≈ R$ 3,000,000) via YC post-money SAFE, no discount | Pitch deck "O Pedido" slide |
| Valuation cap | **US$ 4,000,000** (≈ R$ 20,000,000), = 15% post-money | Pitch deck "O Pedido" slide |
| Founder vesting | 4 years, 1-year cliff | Pitch deck "O Pedido" slide |
| Entity structure | **Delaware holding company owning a new Brazilian LTDA (100%)** — decided by the founder (2026-09-24), **neither entity formed yet**. Not the founder's existing personal CNPJ. | Founder, 2026-09-24 |
| Use of funds | 40% Dados e IA · 30% Vendas institucionais · 20% Operações e reserva · 10% Integrações Bacen e segurança — goal: 1.5M ha "à vista" by 2028 | Pitch deck "O Pedido" slide |
| Team | Amgad Salih (CEO, interim CTO), Diana Dutra (CCO), Lucas Costa (CDO) | Pitch deck "O Time" slide |
| Believers/advisors | Chaim Finziola (Credix co-founder), Gilberto Damasceno (Shamal Aerospace CEO), Michelle Souza Vilela (CDT/UnB) — **equity terms out of scope** per founder instruction | Pitch deck "O Time" slide; founder, 2026-09-24 |
| First paid project | 220 ha, Minas Gerais, CAR/SICAR georeferencing survey — generated retention and a scope renegotiation. Likely = the "Fabio" engagement referenced elsewhere in this room ([CONFIRM] the link). | Pitch deck traction slide |
| Pipeline | ~35,000 ha prospected combined: a cacao consultant (Thales, ~30,000 ha, Bahia, 200+ producers) + an unnamed global trading/barter manager; plus **Coplacana** (cooperative, named separately by the founder) | Founder + pitch deck traction slide |
| Market | US$880M total · US$125M addressable (MT, GO, MG, PR, RS) · US$3M 36-month target | Pitch deck "O Mercado" slide |
| Official forecast | 2027: $0.18M/$0.38M/$0.58M (pess/base/opt) · 2028: $0.66M/$1.32M/$2.00M · 2029: $1.60M/$3.50M/$4.56M | Pitch deck scenarios slide — see `FINANCIAL_MODEL.xlsx`, "Scenarios (Deck)" tab |
| Regulatory driver | BCB **Resolução CMN nº 5.267/2025** (effective March 2026) requires rural-credit compliance proven by remote sensing; liability is non-delegable | Pitch deck slide 5, MCR 2-9 |
| Proprietary IP | **M1** Filtro de Área Útil · **M2** Radar SAR Anti-Fuga · **M3** Protocolo Halo | Pitch deck "Como Funciona" slide |
| Named competitors | Agrotools, Serasa Experian Agro, TerraMagna, Traive, Terras | Pitch deck "Concorrência" slide |

These figures **replace** the older per-hectare drone-mission pricing
used elsewhere in this repo (`knowledge-base/PRICING_MODEL.md`,
`UNIT_ECONOMICS.md`) — that pricing belonged to a services-model version
of the business, per explicit founder instruction.

## Open items (blocking full completion)

1. **Form the two entities** — the Delaware holding and the new
   Brazilian LTDA are decided but not yet formed; this blocks the SAFE's
   Issuer field. See `03-company-documents/INCORPORATION_STATUS.md`.
2. **Founder equity split and option-pool size** — still an illustrative
   placeholder in `04-investment-documents/CAP_TABLE.md`.
3. **Confirm the "Fabio" ↔ "220ha Minas Gerais" link** — very likely the
   same project, not explicitly confirmed. See
   `01-company-snapshot/CASE_STUDY.md`.
4. **Name the global trading/barter manager** in the pipeline — see
   `06-customers/SALES_PIPELINE.md`.
5. **Reconcile the deck's own two slightly different 2029 revenue
   numbers** (US$3M 36-month target vs. US$3.50M 2029 Base case) — minor,
   not a red flag, but worth a founder gut-check before the next pitch.
6. Signed customer contracts, testimonials, exact pipeline R$/US$
   values, and legal filings (trademarks, insurance, subcontractor
   agreements) — placeholders pending founder/counsel input throughout.

*Data room v2.0 | Reconciled against the founder's pitch deck 2026-09-24 | Confidencial*
