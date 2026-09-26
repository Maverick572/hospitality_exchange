---
type: index
status: stable
tags: [brain]
updated: 2026-09-26
---

# Brain

| Project | Status | Overview |
|:--|:--|:--|
| entity-resolution | active | [[projects/entity-resolution/overview]] |
| hospitality-resource-exchange | active | [[projects/hospitality-resource-exchange/overview]] |

## Archived

| Project | Outcome | Overview |
|:--|:--|:--|
| knowledge-cartographer | dropped (existing solutions cover it) | [[projects/_archive/knowledge-cartographer/overview]] |

## Recent updates (last 5, newest first)

- 2026-09-26 — **Driver Profile & Auth Implementation:** Implemented FastAPI endpoints for Driver Profile creation (with Pydantic validation), Google Sign-In status check (`GET /drivers/auth/status`), Firebase custom role claims (`role="driver"`), and future-proofed DigiLocker verification fields (D009). Created concept note [[projects/hospitality-resource-exchange/concepts/driver-profiles-verification]].
- 2026-09-26 — **Context merge:** Merged 4 new spec files (features.txt, schema.txt, backendAPI.md, frontendAPI.md) into the existing Brain context. 8 breaking conflicts resolved in favor of the new architecture: Supabase → Firebase Firestore (D007), five-layer → three-column FastAPI model, three roles → unified User + Driver (D008), partial-quantity inventory confirmed, matching API shape defined (matchScore + matchReasons), escrow flow concretized, notifications and ratings promoted to first-class features. 8 old open questions closed. 2 concept notes (utilization-analytics, quotation-requests) marked as dropped.
- 2026-09-26 — Created hospitality-resource-exchange project: 7 features mapped as concept notes, five-layer architecture + intelligence/optimization/tech-stack notes, and a 6-entry decision log (D001-D006) ported from prior planning. Flagged open gaps (undefined scoring formulas, disputed logistics-matching mechanism, PPT overclaiming risks) as open questions.
- 2026-09-26 — Verified zero-injection blocking recall benchmark (100% FAISS retrieval of in-pool candidates); logged D007 (decoupled recall testing) and D008 (field-specific normalization); documented CPU-to-GPU compute scaling constraints.
- 2026-09-26 — Mapped entity-resolution project into reconciled Brain schema: created 16 knowledge notes across concepts, architecture, decisions (D001–D006), research, and sources with R13 provenance tags and typed edges.
