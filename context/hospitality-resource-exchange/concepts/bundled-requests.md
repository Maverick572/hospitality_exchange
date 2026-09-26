---
type: concept
status: stable
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: high
---

# Bundled Requests

[stated] Multi-resource requirements (e.g. 300 chairs + 20 tables) can be fulfilled across multiple providers with logistics coordinated. The platform produces an optimized fulfillment bundle with itemized costs.

## Details

[decided] This is the one feature that requires the CP-SAT solver, per D002 — single-resource requests use a cheaper weighted linear scorer.

[stated] API: `POST /matching/bundle` with `{ "requirementId": "req_123" }`. Response includes: bundleId, itemized resources (providerId, resourceId, name, quantity, price per provider), logistics (driverId, routeId, deliveryCost), resourceCost, deliveryCost, deposit, totalCost, and `withinBudget` flag.

[stated] Example bundle: Provider A → 180 chairs (₹4,500), Provider B → 120 chairs (₹3,000), Provider C → 20 tables (₹4,000), Driver X → shared-route delivery (₹1,800). Total ₹18,300 against ₹25,000 budget → withinBudget: true.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/architecture/optimization-layer]]
depends_on:: [[projects/hospitality-resource-exchange/concepts/availability-calendar]]

## Open questions

- What is the CP-SAT objective function for bundle selection? (API shape is defined, internal optimization logic is TBD.)
- How does bundle matching interact with logistics cost — joint term or separate step?
