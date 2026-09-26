---
type: concept
status: stable
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: high
---

# Resource Listing

[stated] Users acting as Providers list resources they have available, capturing: name, category, description, quantity, available quantity, price, pricing unit, location (address + lat/lng), availability (date/time slots with quantity), images, and condition.

## Details

[stated] Firestore collection: `resources/{resourceId}` with fields: providerId, name, category, description, quantity, availableQuantity, price, pricingUnit, location, availability, images[], condition, status, createdAt, updatedAt.

[decided] Partial-quantity tracking confirmed: `quantity` (total) and `availableQuantity` (currently free) are separate fields. This supports partial bookings (e.g. 100 of 300 chairs still available).

[stated] API endpoints: `POST /resources`, `GET /resources/my`, `GET /resources/{id}`, `PATCH /resources/{id}`, `DELETE /resources/{id}` (soft-delete via status → "inactive").

[stated] This feature is structured-form CRUD against Firestore via FastAPI — it does not touch the LLM parsing layer or the CP-SAT solver.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/concepts/availability-calendar]]

## Open questions

- None — schema and API are defined.
