---
type: concept
status: stable
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: high
---

# Three-Column FastAPI Architecture

[decided] Architecture is a single-backend design where **FastAPI is the sole API gateway**. The frontend communicates exclusively with FastAPI over HTTP/JSON. Three logical columns sit behind it:

## Details

- **Column 1 — CRUD / State Operations:** Firestore read/write for all business state: resources, requirements, requests, bookings, driver routes, reviews, escrow, notifications. Firebase Storage for images/videos. Firebase Authentication for identity.
- **Column 2 — Matching Engine:** LLM-based requirement extraction + CP-SAT bundle optimization + weighted scoring for single-resource matches. Consumes candidate data from Firestore, returns ranked results to the API layer.
- **Column 3 — External Services:** OSRM for route geometry and distance calculation; eventually a payment provider for real escrow.

[decided] Supersedes the earlier five-layer model (D001) which split responsibilities between Supabase and FastAPI. The new model unifies everything behind FastAPI, with Firestore as the data layer. See D007.

[stated] The frontend should NOT: calculate provider ratings, calculate matching scores, modify Firestore business data directly, calculate escrow settlements, implement CP-SAT, implement route matching, or contain LLM prompts.

```
                FASTAPI
                   |
    +--------------+--------------+
    |              |              |
    v              v              v
CRUD / State    Matching       External
 Operations      Engine        Services
    |              |              |
 Firestore     LLM + CP-SAT     OSRM
    |
 Firebase
  Storage
```

## Relations

extends:: [[projects/hospitality-resource-exchange/architecture/intelligence-layer]]
extends:: [[projects/hospitality-resource-exchange/architecture/optimization-layer]]

## Open questions

- None — this is the locked architecture for implementation.
