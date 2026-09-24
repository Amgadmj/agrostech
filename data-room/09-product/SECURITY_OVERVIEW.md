# Security Overview

**Status: 🔴 [CONFIRM] — this is "can wait" per the checklist, but worth having a straight answer ready if asked.**

| Question | Answer |
|---|---|
| Where is client data stored? | Supabase (Postgres + PostGIS) — [CONFIRM hosting region; matters for LGPD] |
| Who has access? | [CONFIRM — access control is modeled in `saas/supabase/schema.sql` via role-scoped users (`b2c`/`b2b_admin`/`b2b_viewer`) and org-level Row-Level Security policies, but confirm actual production access practices] |
| Backups? | [CONFIRM] |
| Encryption at rest / in transit? | [CONFIRM — Supabase provides this by default; confirm no custom exceptions] |

Cross-reference: `05-legal/LGPD_AND_DATA_POLICIES.md` for the legal
(rather than technical) side of data handling.

---
*AgrosTech — Security Overview v1.0 | Confidencial | 2026*
