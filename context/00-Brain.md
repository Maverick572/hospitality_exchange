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

- 2026-09-27 — **Two-Phase Category-Coupled Handover & Mandatory Return Evidence Protocol:** Built buyer-seller chat negotiation and condition evidence protocol (`frontend/app/dashboard/negotiation/page.tsx`, `backend/transactions/evidence.py`, `backend/transactions/requests.py`). Allows locking negotiated rates, departure/arrival schedules, and enforces category-coupled visual evidence (`shared/categories.json`): sender must log photo/video evidence before convoy dispatch; receiver must mandatorily log return photo/video evidence with side-by-side inspection before escrow deposit release. Logged D018.
- 2026-09-27 — **OR-Tools CP-SAT Multi-Driver Fleet Pooling Engine:** Engineered multi-driver fleet packing via Google OR-Tools CP-SAT solver (`backend/logistics/matcher.py`). Large demands (e.g. 200–300 chairs) are automatically consolidated across 2–5 coordinated carriers along active transport corridors with bounded knapsack unit assignment, calculating coordinated OSM transit schedules, dedicated vs pooled savings (₹5,250 saved), and CO2 emission cuts. Added dedicated fleet dispatch visualizer to Next.js dashboard. Logged D017.
- 2026-09-27 — **Real-World Mumbai Ecosystem Seeding & Operational Role Isolation:** Re-seeded Firestore with 10 real Mumbai businesses and 8 verified commercial carriers with real OpenStreetMap coordinates. Established physically authentic vehicle payload capacities (Tata Ace 50, Bolero Maxi 80, Bada Dost 100, Tata 407 150, Eicher Pro 220, Ape 25), integrated live OSRM driving transit calculations (`backend/services/osrm.py`), and enforced strict seeker vs provider operational role segregation. Logged D016.
- 2026-09-27 — **End-to-End Firebase Auth & Onboarding Integration:** Wired live Firebase Web App configuration (`hospitality-exchange-370a7`) in Next.js, eliminated token resolution race conditions with `authStateReady()`, corrected API client 404 handling for `/users/me` and `/drivers/me` to enable seamless onboarding redirection, and verified complete browser authentication flow. Logged D015.
- 2026-09-27 — **Next.js Frontend Integration & Dual-Mode Architecture:** Merged 26-route Next.js 16 frontend from `krish-da-goat` into `main`, unified shadcn/Radix UI shell, wired marketplace and dashboard to live FastAPI backend with automatic `mockStore` fallback. Logged D014.
- 2026-09-26 — **Driver Profile & Auth Implementation (Ash):** Implemented FastAPI endpoints for Driver Profile creation (with Pydantic validation), Google Sign-In status check (`GET /drivers/auth/status`), Firebase custom role claims (`role="driver"`), and future-proofed DigiLocker verification fields (D010). Created concept note [[projects/hospitality-resource-exchange/concepts/driver-profiles-verification]].
- 2026-09-26 — **Context merge:** Merged 4 new spec files (features.txt, schema.txt, backendAPI.md, frontendAPI.md) into the existing Brain context. 8 breaking conflicts resolved in favor of the new architecture: Supabase → Firebase Firestore (D007), five-layer → three-column FastAPI model, three roles → unified User + Driver (D008), partial-quantity inventory confirmed, matching API shape defined (matchScore + matchReasons), escrow flow concretized, notifications and ratings promoted to first-class features. 8 old open questions closed. 2 concept notes (utilization-analytics, quotation-requests) marked as dropped.
- 2026-09-26 — Created hospitality-resource-exchange project: 7 features mapped as concept notes, five-layer architecture + intelligence/optimization/tech-stack notes, and a 6-entry decision log (D001-D006) ported from prior planning. Flagged open gaps (undefined scoring formulas, disputed logistics-matching mechanism, PPT overclaiming risks) as open questions.
- 2026-09-26 — Mapped entity-resolution project into reconciled Brain schema: created 16 knowledge notes across concepts, architecture, decisions (D001–D006), research, and sources with R13 provenance tags and typed edges.
