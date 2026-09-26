---
type: concept
status: stable
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: high
---

# Tech Stack

[decided] Frontend: React. Backend: Python, FastAPI. Database/auth: Firebase (Firestore + Authentication + Storage). Optimization: CP-SAT (OR-Tools). LLM inference: Groq (Llama 3.3 70B). Maps/routing: OpenStreetMap, OSRM. See D007 for the migration from Supabase to Firebase.

## Details

[decided] Firebase Firestore (NoSQL) replaces Supabase (Postgres + PostGIS). Geospatial indexing is handled via latitude/longitude fields with distance calculated in FastAPI rather than PostGIS. This was a deliberate shift to simplify the data layer for the hackathon.

[stated] FastAPI is the sole backend — the frontend interacts only with FastAPI endpoints at `/api/v1`. Firebase Authentication handles signup/login; FastAPI verifies Firebase ID tokens on protected endpoints.

[stated] Firebase Storage handles file uploads (resource photos, condition evidence images/videos). Metadata and download URLs are stored in Firestore.

[stated] OSRM handles route geometry and distance calculations for the matching engine. Deployment mode (self-hosted vs. public instance) should be confirmed before demo day.

[stated] Cost profile: development on free-tier services, deployment ₹0-3,000/month at MVP scale, operations usage-based for AI/API costs.

## Relations

extends:: [[projects/hospitality-resource-exchange/architecture/five-layer-model]]

## Open questions

- Confirm OSRM hosting mode (self-hosted vs. public) before demo day.
