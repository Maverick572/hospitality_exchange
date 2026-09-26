---
type: concept
status: disputed
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: low
---

# Logistics-Aware Matching

[stated] The platform's core USP. Instead of only matching "who has the resource," it also asks "how can we move it there most efficiently" — detecting existing transport routes and spare capacity (delivery trucks, hotel vehicles, laundry vans, staff shuttles, supplier vehicles) to reduce dedicated-trip costs.

## Details

[stated] Worked example from spec: Hotel A has 300 chairs, Hotel B needs them. A dedicated vehicle costs ₹8,000, but Hotel C already has a truck travelling A→B with spare capacity, so the platform recommends shared transport at ₹1,500 (₹6,500 saved).

[stated] Flagged in project ways-of-working as the single feature that should not be sacrificed under time pressure — it is the actual differentiator versus generic B2B marketplaces.

[inferred] Mechanism is currently undefined: it is unclear whether route/spare-capacity data is (a) manually entered by providers as recurring routes, (b) inferred from booking history patterns, or (c) simulated/seeded for the hackathon demo. This is unresolved and marked `status: disputed` until settled, since presenting (c) as if it were (a)/(b) is an overclaiming risk already flagged once for this project (see [[projects/hospitality-resource-exchange/decisions/decisions]] ways-of-working note on overclaiming).

[inferred] Whether this lives in the Optimization Layer (as a cost term inside the CP-SAT objective) or as separate rule-based plumbing before/after the solver is also undecided.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/architecture/optimization-layer]]

## Open questions

- What is the actual data source for route/spare-capacity detection in the hackathon demo?
- Is this folded into the CP-SAT objective as a cost term, or handled as separate rule-based logic?
- The numeric worked example (₹8,000 vs ₹1,500) was in the original spec but dropped from the PPT — worth restoring for pitch impact.
