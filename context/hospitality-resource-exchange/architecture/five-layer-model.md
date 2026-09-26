---
type: concept
status: draft
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: high
---

# Five-Layer Architecture

[decided] Architecture is a lean two-backend structure presented as five conceptual layers: Client → Access & State → Intelligence → Optimization → Transaction.

## Details

- **L1 Client Layer:** React on Vercel — rendering, form input, auth session, real-time updates.
- **L2 Access & State Layer:** Supabase — auth, Postgres + PostGIS, storage, realtime. Handles identity/sessions, system of record, geospatial indexing, listing photos/condition evidence, live updates via WebSockets.
- **L3 Intelligence Layer:** FastAPI (Groq) — parses unstructured input into structured data, explains results. See [[projects/hospitality-resource-exchange/architecture/intelligence-layer]].
- **L4 Optimization Layer:** FastAPI (CP-SAT) — tier-1 scoring, constraint-based matching, bundle optimization. See [[projects/hospitality-resource-exchange/architecture/optimization-layer]].
- **L5 Transaction Layer:** Supabase Postgres — bookings, escrow state, condition evidence.

[decided] Chosen over an earlier, more complex draft — over-engineering was identified as a real risk; concise and deployable was prioritized over exhaustive documentation. See [[projects/hospitality-resource-exchange/decisions/decisions]] D001.

## Relations

extends:: [[projects/hospitality-resource-exchange/architecture/intelligence-layer]]
extends:: [[projects/hospitality-resource-exchange/architecture/optimization-layer]]

## Open questions

- None currently — this is the most stable part of the design.
