---
type: concept
status: draft
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: med
---

# Availability & Conflict Management

[stated] The platform maintains resource calendars with states Available → Reserved → Booked, and prevents overlapping bookings.

## Details

[stated] Example: 300 chairs, Sept 10 available, Sept 11-12 booked, Sept 13 available. If only 200 of 300 units are booked, the remaining 100 can still be offered.

[inferred] This is pure Supabase/Postgres logic (date-range conflict checks, quantity decrement) — it does not touch the LLM or CP-SAT layers directly, though the solver consumes availability state as a constraint input when matching.

[stated] Partial-quantity availability (100 of 300 still free) implies inventory must be modeled as a decrementing quantity per time-slot, not a binary status enum per resource. This is currently unconfirmed in the actual schema — flagged as an open question at the project level.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/concepts/resource-listing]]

## Open questions

- Confirm partial-quantity inventory modeling is implemented as quantity-per-slot, not boolean available/booked — this changes how CP-SAT constraints are formulated for bundle matching.
