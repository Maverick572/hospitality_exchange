---
type: index
status: stable
tags: [brain]
updated: 2026-09-27
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

- 2026-09-27 — **OR-Tools CP-SAT Logistics Matcher Implementation:** Implemented shared-route logistics engine (`backend/logistics/matcher.py`, `backend/logistics/routes.py`) with waypoint detour distance calculations, multi-objective Pareto optimization via Google OR-Tools CP-SAT solver, route publishing endpoints, and end-to-end integration tests (`test_logistics.py`). Logged D013.
- 2026-09-27 — **LLM Natural Language Seeker Search Implementation:** Implemented real-time natural language query parsing via Groq/Gemini parser, calendar date/time availability matching (`fromTimestamp`, `toTimestamp`), Haversine distance proximity sorting, and multi-factor ranking (availability score descending -> price ascending -> distance ascending) under `backend/seeker/` and `backend/services/llm_parser.py`. Logged D012.
- 2026-09-27 — **Category Registry & SI Unit Normalization:** Replaced 7 hardcoded categories with 31 B2B marketplace categories (`shared/categories.json`), auto-generating backend enum and LLM system prompt. Coupled categories to photo/video evidence types with media validation on condition evidence. Enforced SI units (`kg`, `liters`, `m`, `sqm`, `units`), agricultural conversions (quintal = 100 kg, ton = 1000 kg, typo tolerance), and exposed `GET /api/v1/categories`. Created [[projects/hospitality-resource-exchange/concepts/category-registry-and-evidence-rules]] and logged D011.
- 2026-09-26 — **Transaction Layer Implementation (Roh):** Built the complete modular Transaction Layer subsystem (15 endpoints across requests & negotiation, bookings, escrow & split payouts, condition evidence, reviews & atomic rating updates, and event notifications) under `backend/transactions/` with zero edits to existing backend files to avoid merge conflicts. Added comprehensive automated test suite (17 passed). Logged D009.
- 2026-09-26 — **Driver Profile & Auth Implementation (Ash):** Implemented FastAPI endpoints for Driver Profile creation (with Pydantic validation), Google Sign-In status check (`GET /drivers/auth/status`), Firebase custom role claims (`role="driver"`), and future-proofed DigiLocker verification fields (D010). Created concept note [[projects/hospitality-resource-exchange/concepts/driver-profiles-verification]].
- 2026-09-26 — **Context merge:** Merged 4 new spec files (features.txt, schema.txt, backendAPI.md, frontendAPI.md) into the existing Brain context. 8 breaking conflicts resolved in favor of the new architecture: Supabase → Firebase Firestore (D007), five-layer → three-column FastAPI model, three roles → unified User + Driver (D008), partial-quantity inventory confirmed, matching API shape defined (matchScore + matchReasons), escrow flow concretized, notifications and ratings promoted to first-class features. 8 old open questions closed. 2 concept notes (utilization-analytics, quotation-requests) marked as dropped.
- 2026-09-26 — Created hospitality-resource-exchange project: 7 features mapped as concept notes, five-layer architecture + intelligence/optimization/tech-stack notes, and a 6-entry decision log (D001-D006) ported from prior planning. Flagged open gaps (undefined scoring formulas, disputed logistics-matching mechanism, PPT overclaiming risks) as open questions.
- 2026-09-26 — Mapped entity-resolution project into reconciled Brain schema: created 16 knowledge notes across concepts, architecture, decisions (D001–D006), research, and sources with R13 provenance tags and typed edges.
