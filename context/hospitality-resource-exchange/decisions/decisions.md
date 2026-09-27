---
type: decision
status: stable
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
---

# Decisions

Append-only decision log for this project. See R14 for format.

## D001 — Two-backend lean architecture
- **Date:** 2026-09-15
- **Decision:** Architecture finalized as React on Vercel → Supabase (CRUD/auth/realtime), and FastAPI on Render handling only CP-SAT solving and LLM parsing. Presented as a five-layer model.
- **Alternatives considered:** A more complex, more granular multi-service architecture.
- **Rejected because:** Over-engineering risk — first draft was too complex for hackathon deployability.
- **Accepted because:** Concise and deployable beats exhaustive documentation for a demo-day deadline.
- **Status:** superseded
- **Supersedes:** —
- **Superseded by:** D007

## D002 — CP-SAT scoped to bundles only
- **Date:** 2026-09-15
- **Decision:** CP-SAT runs only for bundle/multi-item requests. A fast weighted linear scorer handles single-resource searches.
- **Alternatives considered:** Running CP-SAT for every match request.
- **Rejected because:** CP-SAT is unnecessary overhead (latency, complexity) for single-resource ranking.
- **Accepted because:** Matches solver cost to problem complexity.
- **Status:** accepted
- **Supersedes:** —

## D003 — Groq for LLM inference
- **Date:** 2026-09-15
- **Decision:** Groq (Llama 3.3 70B) chosen for LLM inference, scoped strictly to requirement extraction and result explanation — never conflated with the deterministic CP-SAT optimizer.
- **Alternatives considered:** A generic/other LLM provider reference.
- **Rejected because:** Inference speed matters on the critical parsing path; conflating LLM and optimizer roles undermines judge credibility.
- **Accepted because:** Speed requirement + clean separation of concerns.
- **Status:** accepted
- **Supersedes:** —

## D004 — Escrow as ledger state machine, not a smart contract
- **Date:** 2026-09-15
- **Decision:** Escrow framed as a ledger-based state machine backed by a licensed payment aggregator API — deliberately not a "smart contract." Escrow, security deposits, and formal booking terms treated as three distinct trust mechanisms, not interchangeable.
- **Alternatives considered:** Framing escrow as a blockchain smart contract (as currently worded in the PPT, Slide 4).
- **Rejected because:** No actual smart contract exists; using the term is an overclaiming risk that fails under technical questioning (no chain, no contract language, no audit trail to point to).
- **Accepted because:** A ledger + payment aggregator is what is actually being built and is defensible under questioning.
- **Status:** accepted (deposit formula detail superseded by D007's schema)
- **Supersedes:** —

## D005 — BackgroundTasks over Redis/Celery for async solves
- **Date:** 2026-09-15
- **Decision:** FastAPI `BackgroundTasks` handles async CP-SAT solves. Redis/Celery deferred until solve volume justifies the overhead.
- **Alternatives considered:** Redis/Celery task queue from the start.
- **Rejected because:** Unjustified infrastructure overhead at hackathon/MVP solve volume.
- **Accepted because:** Simplicity given expected load; can be revisited if volume grows.
- **Status:** accepted
- **Supersedes:** —

## D006 — Truck-pooling cut as standalone feature
- **Date:** 2026-09-15
- **Decision:** Truck/backhaul pooling removed as a standalone feature; logistics-aware matching retained as a lighter mechanic instead. Drivers publish routes; platform matches deliveries with compatible driver routes based on route overlap, capacity, and timing.
- **Alternatives considered:** Keeping backhaul pooling as a full standalone feature (VRP-style routing).
- **Rejected because:** Conflicts with the contract/escrow system as scoped; too much algorithmic surface area for hackathon timeline.
- **Accepted because:** Logistics-aware matching still captures the core USP without the full VRP complexity.
- **Status:** accepted
- **Supersedes:** —

## D007 — Supabase → Firebase + single-backend FastAPI
- **Date:** 2026-09-26
- **Decision:** Database/auth/storage migrated from Supabase (Postgres + PostGIS) to Firebase (Firestore + Authentication + Storage). Architecture consolidated from a two-backend model (Supabase + FastAPI) to a single backend (FastAPI) with Firestore as the data layer. Frontend talks exclusively to FastAPI; no direct Firestore access for business data. Schema defined as Firestore collections: users, resources, requirements, requests, bookings, reviews, notifications, drivers, driverRoutes, deliveryRequests, escrow, conditionEvidence.
- **Alternatives considered:** Keeping Supabase (Postgres + PostGIS) as per D001.
- **Rejected because:** Firebase offers simpler setup, built-in auth, and better alignment with the team's implementation plan for the hackathon timeline.
- **Accepted because:** Reduces infrastructure complexity to one backend; Firestore's document model aligns well with the app's data access patterns; Firebase Auth is simpler to integrate with both frontend and backend.
- **Status:** accepted
- **Supersedes:** D001

## D008 — Unified User model (Provider + Seeker)
- **Date:** 2026-09-26
- **Decision:** Provider and Seeker are not separate user types — a single User can act as either role depending on the transaction. A user who lists resources is acting as a Provider; a user who posts requirements is acting as a Seeker. Drivers remain a separate user type with their own registration and interface.
- **Alternatives considered:** Three distinct user types (Provider, Seeker, Driver) with separate accounts.
- **Rejected because:** Hospitality businesses commonly both have surplus resources AND need other resources — forcing separate accounts adds friction.
- **Accepted because:** Simplifies the user model; a hotel can list surplus chairs (Provider) and request AV equipment (Seeker) from the same account.
- **Status:** accepted
- **Supersedes:** —

## D009 — Modular Transaction Layer Architecture & Negotiation Revival
- **Date:** 2026-09-26
- **Decision:** The Transaction Layer (owned by Roh) is structured as a modular package (`backend/transactions/`) with sub-routers for requests, bookings, escrow, condition evidence, and reviews without editing existing backend files. Negotiation supports bi-directional counter-offers even after rejection (reviving rejected offers until accepted). Escrow releases enforce safety by clamping damage penalties to `min(penaltyAmount, depositAmount)` and guarding against double-release. Reviews atomically update provider average ratings in `users/{providerId}` via running average. Integration with `backend/main.py` is documented in `backend/transactions/__init__.py`.
- **Alternatives considered:** Single monolithic router file (`backend/transactions.py`) or locking rejected offers permanently.
- **Rejected because:** Monolithic file creates tight coupling and high merge-conflict risk; locking rejected offers permanently restricts real-world negotiation.
- **Accepted because:** High isolation, zero merge conflicts with teammates, realistic multi-round negotiation flow, robust financial and rating integrity.
- **Status:** implemented
- **Supersedes:** —

### Agent assessments

**Claude — 2026-09-26**
- Position: Backhaul/VRP-style pooling remains the highest-algorithmic-value feature if time permits post-MVP — worth revisiting once D002's scoring formulas and the demo's logistics data source are settled, not before.

**Antigravity — 2026-09-26**
- Position: D007 and D008 resolve 6 of the 8 original open questions. The remaining technical gaps are internal implementation details (scorer weights, CP-SAT objective function) rather than architectural questions.
- Position (D009): Transaction Layer is fully implemented and tested (17 unit and E2E tests passing). Ready for main.py mounting by Ash upon integration.

## D010 — Driver Identity Verification via DigiLocker and Custom Claims
- **Date:** 2026-09-26
- **Decision:** Driver profiles include future-proof verification fields (`licenseNumber`, `verificationStatus: "unverified" | "pending" | "verified" | "rejected"`) stored in Firestore `drivers/{uid}`. Firebase Admin SDK stamps `{"role": "driver"}` custom user claims upon profile creation. An authenticated `GET /drivers/auth/status` endpoint enables Google Sign-In onboarding detection. Full DigiLocker verification integration is planned for later phase.
- **Alternatives considered:** Implementing live DigiLocker integration upfront, or keeping driver schema minimal without verification fields.
- **Rejected because:** Upfront DigiLocker integration introduces external API credential and mock hurdles during core logistics development; omitting fields would necessitate future Firestore data migrations.
- **Accepted because:** Stamping custom claims and future-proofing the schema permits immediate, seamless Google Sign-In and role enforcement while leaving a clear integration path for DigiLocker.
- **Status:** implemented
- **Supersedes:** —

## D011 — Unified Category Registry with Evidence-Type UX and SI Unit Standardization
- **Date:** 2026-09-27
- **Decision:** Replace legacy 7 hardcoded categories with a 31-category registry sourced from real B2B marketplaces (Amazon Business, Udaan, IndiaMART, WebstaurantStore, Moglix) in `shared/categories.json`. Serves as single source of truth for backend and frontend. Categories are mapped to `evidenceType` (`photo` for 17 physical goods, `video` for 10 powered/mechanical assets, `photo_video` for 3 spaces/transport, and `other`), defining frontend media capture rules during resource check-in/checkout. Media type validation is enforced on condition evidence endpoints. The Python `ResourceCategory` enum and LLM system prompt are auto-generated from JSON. The parser enforces SI units (`kg`, `liters`, `m`, `sqm`, `units`), agricultural conversions (1 quintal = 100 kg, 1 metric ton = 1000 kg, with typo tolerance), and defaults `raw_ingredients` to `kg`/`liters`. A `GET /api/v1/categories` endpoint exposes category definitions.
- **Alternatives considered:** Duplicate hardcoded enums in frontend and backend, or open-ended user-defined tags.
- **Rejected because:** Duplicate enums drift out of sync; open-ended tags break algorithmic matching (CP-SAT/scorer) and prevent standardized evidence workflows.
- **Accepted because:** Single source of truth eliminates drift, evidence-type coupling prevents disputes on mechanical/space assets, and SI normalization ensures consistent solver input.
- **Status:** implemented
- **Supersedes:** —

## D012 — Natural Language Seeker Search with Date/Time Availability & Multi-Factor Ranking
- **Date:** 2026-09-27
- **Decision:** The primary discovery interface for Seekers uses open-ended natural language queries combined with `fromTimestamp` / `toTimestamp` date filters and optional seeker geo-coordinates via `POST /api/v1/seeker/search`. LLM parser (Groq / Gemini) extracts structured resource names, categories, and quantities. Candidate products from Firestore are evaluated for date-specific slot availability (`[{ date, quantity }]`), geographic Haversine distance (using product location or provider business location fallback), and sorted using a deterministic 3-tier hierarchy:
  1. Best Availability (descending `availabilityScore`: bonus for full quantity + verified calendar slot match)
  2. Lowest Price (ascending unit price)
  3. Nearest Location (ascending Haversine distance in km)
- **Alternatives considered:** Traditional keyword/category dropdown filters only, or pure vector embedding similarity search without availability/distance ranking.
- **Rejected because:** Dropdowns are rigid and fail to handle unstructured real-world hospitality requests; pure vector search ignores strict stock levels, calendar availability windows, and physical travel distance.
- **Accepted because:** Combines the UX flexibility of LLM natural language understanding with deterministic, business-critical marketplace constraints (stock availability, pricing, geographic proximity).
- **Status:** implemented
- **Supersedes:** —

## D013 — OR-Tools CP-SAT Shared-Route Logistics Matching
- **Date:** 2026-09-27
- **Decision:** Shared-route logistics matching (`POST /api/v1/logistics/match-routes`) uses Google OR-Tools CP-SAT constraint optimization solver. For two organization locations (pickup = provider, delivery = seeker) and required capacity, the system evaluates active driver routes. Computes Haversine detour distances to each route waypoint, filters routes exceeding maximum allowable detour (25 km) or lacking capacity, and uses CP-SAT integer-scaled multi-objective optimization (minimizing total detour distance, delivery price, excess capacity waste, and enforcing directional pickup-before-delivery order).
- **Alternatives considered:** Naive bounding-box filtering, simple distance sorting without capacity optimization, or full dynamic vehicle routing (VRP) rescheduling.
- **Rejected because:** Simple sorting fails multi-stop detour and capacity trade-offs; dynamic VRP rescheduling introduces real-time driver rerouting complexity unfeasible for the current scope.
- **Accepted because:** CP-SAT provides mathematically rigorous Pareto-optimal route ranking while respecting driver-published schedules and vehicle capacities.
- **Status:** implemented
- **Supersedes:** —

## D014 — Next.js Frontend Integration & Dual-Mode API Client
- **Date:** 2026-09-27
- **Decision:** Integrated full Next.js 16 (App Router, Turbopack, TailwindCSS, Radix/shadcn UI) frontend into `main` branch. Integrated 26 routes spanning Business and Driver app shells, marketplace, smart matches, logistics, escrow, notifications, and analytics. Built unified API client in `frontend/lib/api/client.ts` communicating with FastAPI at `http://127.0.0.1:8000/api/v1` with automatic Bearer token injection and graceful demo/mock fallback (`mockStore`) on connection failures.
- **Alternatives considered:** Keeping frontend on a separate branch, using static HTML/JS prototypes, or hard-failing without mock fallback.
- **Rejected because:** Branch divergence creates integration friction; hard-failing prevents demo and testing without local backend running.
- **Accepted because:** Ensures single-branch codebase with seamless live/demo switching and full feature parity across all backend subsystems.
- **Status:** implemented
- **Supersedes:** —

## D015 — End-to-End Firebase Authentication & Onboarding Gate Flow
- **Date:** 2026-09-27
- **Decision:** Wired live Firebase Web App configuration for project `hospitality-exchange-370a7` in `frontend/.env.local`. Added `auth.authStateReady()` in `getIdToken()` to prevent token resolution race conditions during page hydration. Refactored `frontend/lib/api/client.ts` to exempt `/users/me` and `/drivers/me` from 404 mock-fallback suppression, allowing `ApiError(404)` to propagate to `session-gate.tsx` so newly authenticated users without a Firestore document are seamlessly routed to `/onboarding` (or `/driver/onboarding`) to create their business/driver profile before accessing the workspace.
- **Alternatives considered:** Auto-creating placeholder user profiles on login, or falling back to mock user when profile is 404.
- **Rejected because:** Falling back to mock user locks newly registered Firebase users into fake demo data; auto-creating blank profiles skips vital business location/category details needed for search and matching.
- **Accepted because:** Preserves real identity lifecycle from Firebase Auth -> Onboarding Profile -> Firestore -> Live Dashboard.
- **Status:** implemented
- **Supersedes:** —

## D016 — Real-World Mumbai Ecosystem Seeding, Strict Operational Roles, and OSM Transit Engine
- **Date:** 2026-09-27
- **Decision:** Re-seeded Firestore with genuine Mumbai business profiles (5 vendors, 5 buyers) and 8 verified commercial carriers with real physical coordinates and active corridors across BKC, Bandra, Colaba, Lower Parel, Dadar, Thane, Vashi, and Borivali via OpenStreetMap Nominatim and OSRM. Replaced unrealistic mock payload capacities with physically verified Mumbai vehicle capabilities (Tata Ace 50 max, Bolero Maxi 80 max, Bada Dost 100 max, Tata 407 150 max, Eicher Pro 220 max, Piaggio Ape 25 max). Enforced strict operational role segregation in frontend UI: seeker mode strictly restricts actions to seeker queries and booking, and demand matching filters out the user's own business listings. Added dynamic OSRM transit calculation (`backend/services/osrm.py`) replacing hardcoded trip times.
- **Alternatives considered:** Keeping random dummy numbers for vehicles and hardcoded departure times.
- **Rejected because:** Unrealistic payloads (e.g. 500 chairs in a Bolero or 131 in a 3-wheeler) undermine demo credibility and break physical logistics modeling.
- **Accepted because:** Grounds the platform in actual Mumbai geography, real vehicle specifications, and accurate OSRM transit timelines.
- **Status:** implemented
- **Supersedes:** —

## D017 — OR-Tools CP-SAT Multi-Driver Fleet Pooling
- **Date:** 2026-09-27
- **Decision:** Implemented Multi-Driver Fleet Pooling in `backend/logistics/matcher.py`. When a demand request exceeds any single available vehicle's payload (e.g. 300 chairs), instead of failing or suggesting an impossibly large single vehicle, Google OR-Tools CP-SAT solver pools multiple coordinated carriers along the transport corridor. Solves a bounded knapsack / fleet assignment model:
  - Minimizes vehicle count (penalty weight 150) + total delivery price + total detour distance + directional invalidity penalty.
  - Binds integer cargo units $u_i \in [1, C_i]$ per selected vehicle such that $\sum u_i = \text{targetDemand}$.
  - Computes coordinated convoy schedules, per-driver cargo and price allocations, dedicated vs pooled cost savings (e.g. saving ₹5,250 on a 300-chair transport), and CO2 emission reduction metrics.
  - Integrated into `frontend/app/dashboard/logistics/page.tsx` with a Coordinated Multi-Driver Fleet Dispatch UI card and convoy visualizer.
- **Alternatives considered:** Rejecting large delivery orders that exceed single vehicle capacity or requiring seekers to manually book 3 separate drivers.
- **Rejected because:** Manual multi-booking is tedious and seekers lack routing knowledge to coordinate multiple drivers along shared corridors.
- **Accepted because:** Completely automates multi-carrier consolidation with mathematical optimality and transparent cost savings.
- **Status:** implemented
- **Supersedes:** —

## D018 — Two-Phase Category-Coupled Handover & Mandatory Return Evidence Verification Protocol
- **Date:** 2026-09-27
- **Decision:** Implemented an end-to-end B2B chat negotiation and two-phase visual condition verification system (`frontend/app/dashboard/negotiation/page.tsx`, `backend/transactions/evidence.py`, `backend/transactions/requests.py`). After confirming a booking/logistics match, the buyer and seller enter an active negotiation channel to lock rate, quantity, and scheduled transit window (departure & arrival times computed from OSRM). Upon offer acceptance, the workflow enforces a strict two-phase condition evidence lifecycle:
  1. **Sender Pre-Transit Handover (Export/Dispatch Phase):** The seller must log visual evidence conforming to the resource category rule in `shared/categories.json` (photo for physical goods, video for powered equipment, photo+video for spatial/structural assets). Convoy dispatch is locked until valid pre-transit evidence is saved.
  2. **Receiver Mandatory Return Handover (Return/Check-In Phase):** When the rental period concludes, the receiver is mandatorily required to submit return condition media (photo or video as dictated by category) and confirm undamaged return. The side-by-side verification inspector compares departure vs return state, and return sign-off atomically triggers the release of the escrow damage deposit (₹2,000).
- **Alternatives considered:** Relying on informal off-platform chat without structured offer locking, or allowing unverified returns without mandatory condition media.
- **Rejected because:** Unstructured negotiation causes transit timing misalignment, and absence of mandatory return evidence makes damage disputes unarbitrable.
- **Accepted because:** Enforces cryptographic/media accountability at both export and return, couples evidence formats to physical asset requirements, and establishes a seamless bridge from fleet pooling to escrow release.
- **Status:** implemented
- **Supersedes:** —




