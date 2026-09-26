---
type: concept
status: draft
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: med
---

# Bundled Requests

[stated] Businesses can request multiple resources as one requirement (e.g. 500 chairs + 50 tables + AV equipment + kitchen space + parking for 100 vehicles), matched across multiple providers with logistics coordinated to minimize trips, rather than each provider making an independent trip.

## Details

[decided] This is the one feature that actually requires the CP-SAT solver, per project decision log — single-resource requests use a cheaper weighted linear scorer instead. See [[projects/hospitality-resource-exchange/decisions/decisions]] D002.

[inferred] The CP-SAT objective function for bundle selection (cost minimization subject to coverage constraints, vs. a weighted multi-objective) is not yet defined — same open gap as the single-resource scorer, but here it also needs a formal constraint model (bin-packing-style over provider capacity, not boolean assignment) once partial-quantity inventory is confirmed.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/architecture/optimization-layer]]
depends_on:: [[projects/hospitality-resource-exchange/concepts/availability-calendar]]

## Open questions

- What is the CP-SAT objective function for bundle selection?
- How does bundle matching interact with logistics-aware matching — is transport cost a joint term in the same solve, or a separate post-processing step?
