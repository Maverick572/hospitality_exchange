---
type: concept
status: draft
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: med
---

# Optimization Layer (Solver)

[decided] CP-SAT (OR-Tools) runs only for bundle/multi-item requests. A fast weighted linear scorer handles single-resource searches instead of invoking the full solver. See [[projects/hospitality-resource-exchange/decisions/decisions]] D002.

## Details

[stated] A prior project (CausalCut) used CP-SAT for matching, which informed this stack choice.

[inferred] Neither the linear scorer's weights nor the CP-SAT objective function are defined yet. This is the top open technical gap: judges are likely to probe "how exactly are matches ranked," and there is currently no defensible formula to give.

[decided] FastAPI `BackgroundTasks` handles async solves; Redis/Celery deferred until solve volume justifies the overhead. See [[projects/hospitality-resource-exchange/decisions/decisions]] D005.

## Relations

extends:: [[projects/hospitality-resource-exchange/architecture/five-layer-model]]

## Open questions

- Define the weighted linear scorer formula for single-resource matching (used by [[projects/hospitality-resource-exchange/concepts/smart-matching]]).
- Define the CP-SAT objective function for bundle matching (used by [[projects/hospitality-resource-exchange/concepts/bundled-requests]]).
- Decide whether logistics cost is a joint term in the CP-SAT objective or handled separately (used by [[projects/hospitality-resource-exchange/concepts/logistics-aware-matching]]).
