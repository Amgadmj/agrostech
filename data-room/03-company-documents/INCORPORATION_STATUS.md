# Incorporation Status

**Status: 🟡 structure decided by founder (2026-09-24) — not yet formed. This is the single biggest execution item before the SAFE can be signed.**

## Current state

| Item | Status |
|---|---|
| Delaware C-corporation (holding) | **Decided, not yet formed.** The founder confirmed the target structure: a Delaware holding company that will own and control a Brazilian LTDA. |
| Brazilian operating company | **Decided, not yet formed.** A new LTDA will be incorporated, owned 100% by the Delaware holding. This is **not** the CNPJ the founder currently holds personally — that one is a separate, pre-existing registration and will not be the fundraising entity. |

## The confirmed structure

```
        Delaware Holding Co. (C-corp)
                    │
                    │ 100% ownership
                    ▼
        AgrosTech Brasil LTDA (new entity)
```

This is the standard "Delaware flip" structure referenced in the SAFE
terms panel (`04-investment-documents/SAFE_TERMS.md`) — the SAFE issuer
will be the Delaware holding, which in turn owns the Brazilian operating
company. This resolves the open structural question flagged in the
previous version of this data room.

## What's left to execute (nothing here is done yet)

1. **Form the Delaware holding company** (C-corp).
2. **Form the new Brazilian LTDA** (distinct from the founder's existing
   personal CNPJ).
3. **Execute the share exchange / capitalization** so the Delaware
   holding owns 100% of the Brazilian LTDA.
4. **Issue founder stock** in the Delaware entity, per the cap table
   split — board consent template in `BOARD_CONSENTS.md`.
5. **Only then** can the SAFE's Issuer field be filled in and the
   instrument signed.

## Why this still needs both counsels involved

Per the SAFE terms panel: *"Have a Brazilian lawyer and a US lawyer
review the Delaware–Brazil structure, the currency flow (registro no
Banco Central), and tax."* Confirming the structure decision doesn't
remove that step — it makes it concrete and actionable. Specific open
items for counsel:
- Brazilian Central Bank registration of the foreign capital flow
  (registro de capital estrangeiro) once the Delaware holding
  capitalizes the Brazilian LTDA.
- Tax treatment on both sides of the flip.
- Whether the founder's existing personal CNPJ needs to be wound down,
  contributed, or simply left inactive alongside the new structure.

---
*AgrosTech — Incorporation Status v2.0 | Confidencial | 2026 | Not legal advice — consult Brazilian and US counsel before executing*
