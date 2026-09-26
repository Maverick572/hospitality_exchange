---
type: project
status: stable
project_status: active
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
---

# Hospitality Resource Exchange

## What it is

A B2B marketplace where hospitality businesses (hotels, restaurants, caterers, resorts, event companies) list underutilized resources (space, furniture, AV equipment, vehicles, kitchen capacity) and post requirements for resources they temporarily need. Matched via a CP-SAT solver and LLM parsing layer. Core differentiator is logistics-aware matching: drivers publish existing transport routes with spare capacity, and the platform matches deliveries with compatible routes to cut delivery costs. Built for a hackathon (HackCelestial 3.0) with a demo day deadline.

## Current state

[stated] Architecture and feature set are finalized. Full API contract (backend and frontend), Firestore schema, and feature specification are defined.

[stated] Two user types: **User** (can act as both Provider and Seeker depending on the transaction) and **Driver** (separate interface). See D008.

[stated] Architecture: React frontend → FastAPI (sole backend) → Firestore/Firebase. Three logical columns: CRUD/State, Matching Engine (LLM + CP-SAT), External Services (OSRM). See D007.

[stated] 9 feature groups defined with concrete API endpoints: resource management, requirement posting, matching/search, bundled requests, requests & negotiation, booking & logistics, escrow & payments, ratings & reviews, notifications. Plus dashboards for users and drivers.

[stated] Full Firestore schema defined: users, resources, requirements, requests, bookings, reviews, notifications, drivers, driverRoutes, deliveryRequests, escrow, conditionEvidence.

[verified] Driver profile creation and Google login auth status endpoints implemented in FastAPI with Pydantic validation, Firebase custom claims (role="driver"), and automated test coverage. See D010.

[verified] Modular Transaction Layer (15 endpoints across requests, bookings, escrow, evidence, reviews, notifications) implemented under `backend/transactions/` with comprehensive automated tests. See D009.

[verified] Seeker Natural Language Search Module implemented (`backend/seeker/`) using LLM parser (Groq/Gemini), `fromTimestamp` / `toTimestamp` calendar availability scoring, product/provider geo-location resolution, and 3-tier ranking (availability -> price -> distance). See D011.

[verified] Shared-Route Logistics Engine implemented (`backend/logistics/`) using Google OR-Tools CP-SAT solver, multi-stop waypoint detour calculation, and Pareto route ranking. Tested with realistic Mumbai transport corridors and Firestore users. See D012.

## Key decisions

See [[projects/hospitality-resource-exchange/decisions/decisions]] for the full log. Summary:
- D001 (superseded by D007): Original two-backend Supabase + FastAPI architecture.
- D002: CP-SAT for bundle/multi-item matches only; weighted linear scorer for single-resource.
- D003: Groq (Llama 3.3 70B) & Gemini for LLM inference — extraction and explanation only.
- D004: Escrow as ledger state machine on a payment aggregator, not a smart contract.
- D005: FastAPI BackgroundTasks for async (Redis/Celery deferred).
- D006: Truck-pooling cut as standalone; logistics-aware matching via driver-published routes retained.
- D007: Supabase → Firebase migration; single-backend FastAPI architecture.
- D008: Unified User model (Provider + Seeker as one account); Drivers separate.
- D009: Modular transaction layer architecture (15 endpoints under `backend/transactions/`); negotiation revival; escrow damage penalty capping.
- D010: Driver profile verification via DigiLocker readiness, Google Sign-In status endpoint, and Firebase custom claims (role="driver").
- D011: LLM-based Natural Language Seeker Search with Date/Time Window & Multi-Factor Ranking (Availability > Price > Distance).
- D012: OR-Tools CP-SAT Shared-Route Logistics Optimizer with Waypoint Detour Scoring.

## Open conflicts

- None currently. The PPT "Smart Contract" language and backend labeling inconsistencies should be resolved since the API contract now clearly defines the architecture.

## Open questions

- What are the actual weights for the linear scorer formula? (API shape defined; internal tuning TBD.)
- What is the CP-SAT objective function for bundle matching? (API shape defined; solver internals TBD.)
- Whether logistics cost is a joint term in the CP-SAT objective or handled separately.
- Dispute arbitration rule when condition evidence photos conflict — who/what resolves it.
- Cold-start problem: how does matching handle a new provider with zero rating history?
- OSRM deployment mode (self-hosted vs. public instance) for demo day.

## Specification files

| File | Contents |
|:--|:--|
| `features.txt` | Combined feature set for User (Provider/Seeker) and Driver |
| `schema.txt` | Firebase Firestore schema — all collections and fields |
| `backend/backendAPI.md` | FastAPI backend API contract — all endpoints, request/response shapes |
| `frontend/frontendAPI.md` | React frontend API contract — UI flows, API service mapping, architecture |
| `PS.txt` | Original problem statement and project idea |
