---
type: concept
status: stable
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: high
---

# Optimization Layer (Solver)

[decided] CP-SAT (OR-Tools) runs only for bundle/multi-item requests via `POST /matching/bundle`. A fast weighted linear scorer handles single-resource searches via `POST /matching/search`. See [[projects/hospitality-resource-exchange/decisions/decisions]] D002.

## Details

[stated] The matching API returns a `matchScore` (0.0–1.0) and `matchReasons[]` for each result. Matching factors are: availability filtering, distance calculation, price calculation, provider rating, and logistics compatibility.

[stated] The bundle endpoint (`POST /matching/bundle`) produces an optimized multi-provider fulfillment plan with itemized resource costs, logistics cost, deposit, and total — with a `withinBudget` flag. CP-SAT optimization sits behind this endpoint.

[decided] FastAPI `BackgroundTasks` handles async solves; Redis/Celery deferred until solve volume justifies the overhead. See [[projects/hospitality-resource-exchange/decisions/decisions]] D005.

## Relations

extends:: [[projects/hospitality-resource-exchange/architecture/five-layer-model]]

## Open questions

- Define the exact weights for the linear scorer formula (the API shape is set, but internal weights need tuning).
- Define the CP-SAT objective function for bundle matching (cost minimization subject to coverage constraints).
- Decide whether logistics cost is a joint term in the CP-SAT objective or handled separately.
