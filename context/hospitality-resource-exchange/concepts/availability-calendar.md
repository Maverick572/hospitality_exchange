---
type: concept
status: stable
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: high
---

# Availability & Conflict Management

[decided] Resource availability is modeled as partial-quantity per time slot. Each resource has `quantity` (total) and `availableQuantity` (currently free). Availability entries specify date, startTime, endTime, and quantity per slot.

## Details

[stated] Firestore schema: the `resources/{resourceId}` document contains an `availability` array of objects, each with: date, startTime, endTime, quantity. Example: 300 chairs available on 2026-09-28 from 09:00 to 22:00.

[stated] Conflict prevention is handled by the backend (FastAPI) during booking — decrementing `availableQuantity` when a booking is confirmed and checking for overlapping time slots.

[stated] The matching engine consumes availability state as a constraint input — availability filtering is one of the matching pipeline stages.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/concepts/resource-listing]]

## Open questions

- None — partial-quantity model confirmed in schema.
