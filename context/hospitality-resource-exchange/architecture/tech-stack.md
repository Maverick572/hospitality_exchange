---
type: concept
status: disputed
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: med
---

# Tech Stack

[stated] Frontend: React on Vercel. Database/auth/realtime: Supabase (Postgres + PostGIS). Optimization: CP-SAT (OR-Tools). LLM inference: Groq (Llama 3.3 70B). Payments: licensed payment aggregator API (escrow layer). Maps/routing: OpenStreetMap, OSRM.

## Details

[stated] Backend hosting is inconsistently labeled across the current PPT: Slide 5 says "Python, FastAPI"; Slide 6 says "Supabase, FastAPI." Marked `status: disputed` until reconciled — the actual decision (per project decisions) is FastAPI on Render for Intelligence/Optimization layers, with Supabase as the separate Access & State layer, not "Supabase" as a backend framework label.

[inferred] OSRM's deployment mode (self-hosted vs. public instance) is undecided — public OSRM instances are rate-limited and unreliable for a live demo, so this needs to be pinned down before demo day.

[stated] Cost profile: development on free-tier services, deployment ₹0-3,000/month at MVP scale, operations usage-based for AI/API costs.

## Relations

extends:: [[projects/hospitality-resource-exchange/architecture/five-layer-model]]

## Open questions

- Reconcile the Slide 5 vs Slide 6 backend labeling inconsistency.
- Confirm OSRM hosting mode (self-hosted vs. public) before demo day.
