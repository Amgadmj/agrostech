# AgrosTech — 3-Year Hiring Plan (FY2027–FY2029)

*Data Room · People & Organization · Draft v2 · September 2026*

**Status of numbers:** headcount, cost, and trigger figures below are
planning assumptions, not audited actuals. Cost figures are fully-loaded
in the raise's actual currency (US$, per `04-investment-documents/SAFE_TERMS.md`),
with R$ shown for context at ≈R$5.00/US$1. **This plan is deliberately
sized against the US$600,000 confirmed in this round — not against the
headcount ambitions of a funded agtech scale-up.** Where the logic below
borrows structure from a larger company's playbook, the scale has been
rebuilt from AgrosTech's own numbers, not imported.

---

## 0. A note from the CEO

Written the way I wish someone had written it for me.

When you're three people and US$600,000, the temptation is to hire for
the company you want to be. The discipline that gets you to Series A is
the opposite: hire for the next constraint, and never before it. Every
role in this plan exists because a specific bottleneck will appear in a
specific quarter, and the person is there one quarter earlier — not
because a bigger company's org chart says the role should exist.

Three beliefs shape everything below:

1. **Hire where humans are irreplaceable, automate everywhere else.**
   A pilot on a farm at dawn, an agronomist defending a number to a
   bank's credit desk, a sales conversation that only closes because
   someone earned trust in person: these are human. Everything else
   this company already runs on an internal AI-agent operating layer
   (see `02-team/ORG_DESIGN.md`) — strategy support, marketing content,
   Deal Desk quoting, finance operations. That's not a future plan,
   it's already running with three people. It's why this plan can stay
   this lean and still function.

2. **Our thesis is a hiring thesis.** AgrosTech's own product tagline —
   *"Dado real de cada hectare: o dono decide, o agrônomo prova"* (the
   owner decides, the agronomist proves) — is not marketing copy, it's
   an organizational commitment. If the "agrônomo prova" half of that
   sentence isn't backed by credible, named agronomic authority, the
   Passaporte de Crédito Rural is just a well-designed app. Right now
   that credibility is carried by an advisor — Michelle Souza Vilela,
   PhD Agronomy, CDT/UnB (see `02-team/ADVISOR_NOTE.md`) — not a
   full-time hire. That's the correct sequencing for a US$600K seed,
   not a gap to apologize for. The first full-time agronomic hire is
   *triggered*, not scheduled — see Section 5.

3. **The hardest constraint isn't sales, it's trusted, field-verified
   data.** The M1/M2/M3 model stack (Filtro de Área Útil, Radar SAR
   Anti-Fuga, Protocolo Halo — see `09-product/TECH_STACK_OVERVIEW.md`)
   is the moat, and 40% of this raise goes into building it
   ("Dados e IA," per `04-investment-documents/USE_OF_FUNDS.md`). A
   model is only as good as its ground truth. That makes the first
   engineering hire, not the first sales hire, the highest-leverage use
   of this capital — and it's why `HIRING_PLAN.md` v1 already had this
   right before this rewrite: CTO first.

---

## 1. Where we start

| | Today (Sep 2026) |
|---|---|
| **Core team** | 3 — Amgad Salih (CEO, interim CTO), Diana Dutra (CCO), Lucas Costa (CDO) — see `02-team/TEAM_BIOS.md` |
| **Advisory bench** | 4 — Chaim Finziola (Credix), Gilberto Damasceno (Shamal Aerospace), Michelle Souza Vilela (PhD Agronomy, CDT/UnB), Leonardo Finziola (Qualcomm, IoT LATAM — technical input + warm intros to São Martinho, Speedbird) — see `02-team/ADVISOR_NOTE.md` |
| **Operating model** | Hybrid: AI-agent layer for strategy/marketing/quoting support; humans for field execution, technical sign-off, and relationship-carrying sales — see `02-team/ORG_DESIGN.md` |
| **Proof asset** | Fazenda Buritis (217.12 ha, Buritis/MG) — the benchmark property live in the `saas/` product (2D map, 3D digital twin, ScoreCard). **[CONFIRM]** whether this is the same property as the deck-confirmed "220ha, Minas Gerais, first paid project" (`01-company-snapshot/CASE_STUDY.md`) — the hectare count and state are close enough that it's worth a direct founder confirmation before presenting both as separate facts. |
| **Product** | Passaporte de Crédito Rural (US$0.80/ha/year subscription) + one-off survey services — see `08-gtm-revenue/PRICING_MODEL.md` |
| **Raise** | US$600,000 seed, YC post-money SAFE, 15% at a US$4M cap — see `04-investment-documents/SAFE_TERMS.md` |
| **Gaps** | No dedicated engineering hire (Amgad covers this on interim basis), no full-time agronomist, no ops/compliance lead, no finance lead |

**The honest starting constraint:** this raise is roughly an order of
magnitude smaller than what a company running the headcount curve of a
funded agtech scale-up would have in the bank. That's not a weakness to
paper over — it's the entire reason this plan exists as *trigger-based*
rather than calendar-based hiring. Every hire below has to earn its own
keep against a fixed US$600K before a Series A changes the math.

---

## 2. Two scenarios, not one trajectory

The reference logic this plan is built from assumes a company already
past seed, hiring against R$2–15M/year of payroll capacity. AgrosTech
is not there yet. Rather than present a single headcount table that
implicitly assumes a Series A that hasn't happened, this plan separates
what US$600K actually funds from what a successful Series A would
unlock — the same discipline the financial model applies with
Bull/Base/Bear (`07-financials/FINANCIAL_MODEL.xlsx`).

### Scenario A — Seed-funded (what this US$600K actually buys)

| Function | Today | +18mo (end of seed runway) |
|---|---|---|
| Product, Engineering & Data Science | 1 (Amgad, interim) | 3 (dedicated CTO + geospatial/data engineer, Amgad returns to CEO-only) |
| Sales / Institutional BD | 1 (Diana) | 2 (Diana + 1 institutional sales hire) |
| Agronomy & Technical | 0 FTE (1 advisor) | 0–1 FTE — **triggered**, not scheduled (Section 5) |
| Field / Survey Operations | 1 (Lucas) | 1–2 — contractor/freelance capacity for survey volume, per the founder's existing per-service model |
| G&A (Finance, Legal, Compliance) | 0 | 0 FTE — covered by the 10% "Integrações Bacen e segurança" allocation as specialist/contractor engagements, not headcount |
| **Total core team** | **3** | **6–7** |

This maps directly to `04-investment-documents/USE_OF_FUNDS.md`'s
confirmed split: 40% Dados e IA funds the two engineering hires above;
30% Vendas institucionais funds the institutional sales hire and its
travel/BD costs; 20% Operações e reserva funds survey delivery capacity
and the runway buffer; 10% Integrações Bacen e segurança funds the
compliance/Bacen-integration specialist work as a contracted engagement
rather than a headcount line. The bottom-up monthly build in the
financial model's "Budget (Base)" tab already assumes this exact hiring
sequence (CTO from M2, data engineer from M4, sales from M5).

**Exit criteria for Scenario A:** the two things a Series A investor
will actually check — (1) the interim-CTO gap closed with a dedicated
hire, and (2) at least one of the named pipeline accounts (Coplacana,
Thales' ~30,000 ha, or an advisor-sourced intro such as São Martinho —
see `06-customers/SALES_PIPELINE.md`) converted to a paying subscription,
proving the sales motion doesn't depend entirely on founder relationships.

### Scenario B — Series-A-gated (the shape of a real scale-up, contingent)

If Series A capital lands on the timeline implied by the deck's own
Base-case revenue curve (US$0.38M → US$1.32M → US$3.50M, 2027–2029 —
see the "Scenarios (Deck)" tab in `FINANCIAL_MODEL.xlsx`), the
headcount curve below is the directionally right shape — regional field
density, an in-house agronomy bench, an insourced data-processing
function, a proper leadership layer. **This is explicitly contingent
and should never be presented to an investor as funded by the current
US$600K raise** — doing so would be the kind of internal inconsistency
a diligence process catches in minutes (a use-of-funds table that sums
to US$600K sitting next to a payroll table that implies millions).

| Function | End FY2027 (post-Series A) | End FY2028 | End FY2029 |
|---|---|---|---|
| Field Operations (pilots, crew, regional ops) | 4 | 12 | 25 |
| Data Processing & QA | 1 | 4 | 8 |
| Agronomy & Technical | 1 | 3 | 6 |
| Sales (AE, SDR, RevOps) | 4 | 8 | 15 |
| Customer Success | 1 | 3 | 5 |
| Product, Engineering & Data Science | 4 | 8 | 14 |
| Marketing & Brand | 1 | 2 | 3 |
| G&A (Finance, Legal, People, Exec) | 1 | 3 | 6 |
| **Total** | **~17** | **~43** | **~82** |

This is roughly a third smaller at every stage than a fully-funded
agtech scale-up's headcount curve would be — deliberately, because
AgrosTech's AI-agent operating layer genuinely displaces headcount that
a traditional services company would need in marketing ops, quoting, and
finance reporting. That's the real capital-efficiency story to tell
investors, not a rounding error.

---

## 3. FY2027 in detail — "Close the gap, prove the channel"

This is the only year funded by the current raise; everything past it
is Scenario B and conditional.

| Quarter | Role | Why now | Funded by |
|---|---|---|---|
| Q1 '27 | **CTO / Head of Engineering** | Closes the interim-CTO gap. Highest-leverage hire in the company — owns the M1/M2/M3 model stack, moves the enrichment pipeline from simulated to live SICAR/SIGEF integration (see `09-product/PRODUCT_OVERVIEW.md`) | Dados e IA (40%) |
| Q2 '27 | **Geospatial / Data Engineer** | Second engineering hire, not first — a CTO alone can't both build and ship. Owns the SAR-radar and anomaly-detection pipeline (M2, M3) | Dados e IA (40%) |
| Q2 '27 | **Institutional Sales / BD hire** | Converts the named pipeline (Coplacana, Thales, advisor-sourced São Martinho/Speedbird intros) without founder time as the sole bottleneck. Targets banks, cooperatives, and credit desks — the buyer the Resolução CMN 5.267/2025 regulatory driver actually creates urgency for (see `08-gtm-revenue/GTM_STRATEGY.md`) | Vendas institucionais (30%) |
| Ongoing | **Survey delivery capacity** (contractor/freelance, per existing model) | Scales one-off survey revenue alongside the subscription without a fixed headcount commitment before volume justifies one | Operações e reserva (20%) |
| Ongoing | **Bacen integration / compliance specialist** (contracted, not FTE) | Builds the MCR 2-9 / ICP-Brasil-signed dossier infrastructure — the actual product of the "Integrações Bacen e segurança" line | Integrações Bacen e segurança (10%) |

**What's deliberately NOT in FY2027:** a full-time agronomist, a
dedicated ops/compliance hire, a marketing hire, a CFO. Each of these
is real and each is triggered in Section 5 — they're withheld here
because US$600K doesn't cover them without starving the two hires that
actually protect the technical moat and prove the institutional-sales
motion. A Fortune-500 board would ask "what did you cut, and why" —
this is the honest answer.

**Exit criteria for FY2027:** interim-CTO gap closed; the enrichment
pipeline live against at least one real registry source, not simulated;
at least one named pipeline account converted; institutional-sales
motion proven repeatable by a hire other than the founders.

---

## 4. Leadership hiring order (Series-A-gated, Scenario B)

Once a Series A unlocks Scenario B's larger build, this is the order —
each role unlocks the next constraint, same logic as the reference this
plan draws from:

1. **CTO / Head of Engineering** *(already hired in Scenario A — carries forward)*
2. **Geospatial / Data Engineer** *(already hired in Scenario A — carries forward)*
3. **Institutional Sales / BD lead** *(already hired in Scenario A — carries forward)*
4. **First full-time Agronomist** — converts the advisor-carried agronomic
   credibility (Michelle Souza Vilela) into a named, deliverable-signing
   employee once deliverable volume justifies it (trigger in Section 5)
5. **Customer Success lead** — first retention owner, once subscriptions
   exist to retain
6. **Finance / Controller (→ CFO)** — audit-ready books ahead of Series A
   diligence, unit-economics ownership
7. **Head of Operations** — ANAC/DECEA compliance, survey delivery
   quality, once insourced-versus-contractor volume crosses the trigger
8. **Regional Operations Manager #1** — first geographic expansion node
9. **Head of People** — once headcount crosses ~15–20 and ad hoc hiring
   stops scaling
10. **Compliance / Legal counsel (in-house)** — data licensing, LGPD,
    aviation regulation, once outside counsel cost exceeds a loaded hire

---

## 5. Hiring triggers (how AgrosTech avoids over- and under-hiring)

Every hire past the FY2027 core three is released by a trigger, not a
calendar date — the same discipline the reference plan uses, rescaled
to AgrosTech's actual metrics:

| Trigger (leading indicator) | Releases |
|---|---|
| Hectares under subscription > 70% of current survey-delivery capacity | +1 survey-delivery contractor/crew |
| Deliverables awaiting agronomic sign-off exceed a 2-week queue | First full-time agronomist hire (converts the advisor role, doesn't abandon it) |
| Named pipeline conversion rate proves repeatable across ≥2 accounts without founder-led closing | +1 additional institutional sales hire |
| Subscription accounts per relationship-owner exceed an agreed ceiling | First Customer Success hire |
| Cash balance (per `FINANCIAL_MODEL.xlsx`, Budget tab, "Cash balance" row) falls below a 6-month-runway threshold | **Freeze all non-critical hiring immediately** — this is the single most important trigger in this table for a US$600K raise |
| Series A closes | Scenario B activates; leadership-order hires in Section 4 begin releasing against the new capital base |

---

## 6. Compensation, equity & retention

- **Cash:** at or near market for the two engineering hires — Brazil's
  remote-sensing/geospatial talent pool is scarce and competitive;
  underpaying the CTO-adjacent hire is the single most expensive mistake
  available to a company whose entire moat is the model stack that hire
  builds. Sales stays variable-heavy, tied to the same margin discipline
  already built into the Deal Desk logic elsewhere in this repo — no
  commission structure that rewards volume over the deal quality the
  subscription model depends on.
- **Equity:** vesting is already confirmed — 4 years, 1-year cliff,
  applying to all three founders (see `02-team/VESTING_AND_ESOP.md`).
  Option pool size for early hires is still **[CONFIRM]** — that
  decision has to be made before the SAFE closes (see
  `04-investment-documents/CAP_TABLE.md`), not deferred to when the
  first hire's offer letter is drafted.
- **Retention:** for the two engineering hires specifically — technical
  authorship on the M1/M2/M3 model documentation, and a clear path to
  "Head of Engineering" title recognition once Scenario B's leadership
  layer forms, rather than losing them to a bigger company's title
  inflation.

---

## 7. Sourcing engine

- **Geospatial / remote sensing / data engineering:** Brazilian
  remote-first talent pool, with agtech hubs (Piracicaba/ESALQ-USP,
  Ribeirão Preto, Viçosa/UFV) as recruiting nodes; Embrapa alumni
  network given the overlap with the Ceres Cubo classification work
  already in `runner/ceres_cubo/`.
- **Agronomy (when Section 5's trigger fires):** ESALQ/USP, UFV, UFLA,
  UFU, UFG, UNESP — and directly through the existing CDT/UnB
  relationship (Michelle Souza Vilela), which is both an advisory
  channel and, credibly, a sourcing channel for the first full-time
  agronomic hire.
- **Institutional sales:** networks adjacent to the confirmed advisor
  bench — Chaim Finziola's fintech/credit-infrastructure network
  (Credix) and Leonardo Finziola's active introductions (São Martinho,
  Speedbird) are a warmer sourcing channel for this specific hire than
  a generic sales-recruiting search.

---

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Hiring ahead of revenue on a US$600K raise | Trigger-based releases (Section 5); the cash-balance-below-6-months trigger is a hard stop, not a guideline |
| Series A doesn't materialize on the deck's implied timeline | Scenario A is designed to function as a standalone, sustainable state — it is not a "burn and hope" plan; Scenario B never gets presented as committed |
| Key-person dependency on the three founders | The two Scenario-A engineering hires exist specifically to close the interim-CTO single-point-of-failure; institutional sales hire exists to prove the motion survives without founder-led closing |
| Agronomic credibility gap before the first full-time hire | Explicitly carried by an advisor (Michelle Souza Vilela) with real credentials, not silently absent — see Section 0, belief 2 |
| Talent competition for scarce geospatial/remote-sensing engineers | Near-market cash plus real technical ownership (M1/M2/M3 authorship) rather than competing purely on salary against better-funded companies |

---

## 9. What this plan tells an investor

- **Capital-discipline, not headcount ambition, is the story at this
  stage.** US$600,000 funds two engineering hires and one institutional
  sales hire — nothing more — and this plan says so plainly rather than
  presenting an org chart the raise can't actually pay for.
- **The AI-agent operating layer is real leverage, not a slide.** Three
  people are already running strategy support, marketing, and quoting
  functions a traditional company would staff separately — that's why
  Scenario A's core-team-of-six-to-seven is a credible operating unit,
  not an understaffed one.
- **The technical moat has a people plan, and it's funded first.** 40%
  of the raise goes to the two hires that build M1/M2/M3 — that's not a
  rounding choice, it's the plan's central bet.
- **Every hire past the funded three is tied to a trigger and an exit
  criterion**, not a calendar date — the same discipline a much larger,
  better-funded agtech company would run, applied honestly to a much
  smaller balance sheet.

---
*AgrosTech — 3-Year Hiring Plan v2.0 | Confidencial | 2026 | Rebuilt from a larger-scale-up reference plan supplied by the founder (2026-09-24) — structure and trigger logic retained, all headcount/cost figures rescaled to the confirmed US$600,000 raise*
