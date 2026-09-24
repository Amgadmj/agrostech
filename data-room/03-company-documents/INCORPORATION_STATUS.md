# Incorporation Status

**Status: 🔴 this is the single most important gap to close before a SAFE
can be signed — the SAFE's Issuer field requires a specific entity, see
below.**

## Current state (as of 2026-09-24, confirmed by founder)

| Item | Status |
|---|---|
| Delaware C-corporation | **Does not exist.** No US holding entity has been formed. |
| Brazilian CNPJ | **Exists**, but is currently registered under the founder's (Amgad's) personal name/CPF rather than a dedicated company structure. The founder expects to use a **different, dedicated CNPJ** for AgrosTech going forward rather than this one. |

## Why this matters for the SAFE

The SAFE terms panel (`04-investment-documents/SAFE_TERMS.md`) specifies:

> **Issuer:** AgrosTech's Delaware C-corporation. It must be incorporated,
> and it must own the Brazilian operating company, before anyone signs.

Neither half of that is true yet. This is not a documentation gap — it's
a structural one. **Two decisions are needed before this data room's SAFE
section can be executed, not just drafted:**

1. **Does AgrosTech actually need a Delaware flip for this round?**
   A YC-style post-money SAFE is conventionally a Delaware instrument
   because that's the standard US venture paper and what most funds have
   template diligence for. If the target investors are Brazil-based or
   comfortable with a Brazilian instrument, a **direct Brazilian
   equivalent** (e.g., a mútuo conversível under Brazilian law, or a
   SAFE adapted with Brazilian counsel) may avoid the cost and delay of
   a US flip entirely. **This is a call for the founder + both lawyers
   (Brazilian and US), not something to default into.**
2. **If a Delaware flip is the right call:** the sequence is (a) form
   the Delaware C-corp, (b) have it acquire 100% of a newly formed,
   dedicated Brazilian operating company (not the founder's personal
   CNPJ) via a share exchange, (c) issue founder stock in the Delaware
   entity with the board consent template in `BOARD_CONSENTS.md`, (d)
   only then can the SAFE issuer field be filled in and the instrument
   signed.

## What this data room does in the meantime

Every other section proceeds as if this were resolved, with the
structural dependency flagged wherever it appears (see
`04-investment-documents/SAFE_TERMS.md` and `04-investment-documents/CAP_TABLE.md`).
This file is the single source of truth for "is the entity real yet" —
update it the moment either the Delaware entity or the new Brazilian
CNPJ is formed.

---
*AgrosTech — Incorporation Status v1.0 | Confidencial | 2026 | Not legal advice — consult Brazilian and US counsel before acting on the structure question above*
