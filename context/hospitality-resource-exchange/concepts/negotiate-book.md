---
type: concept
status: stable
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: high
---

# Request → Negotiate → Book

[stated] Full transaction lifecycle with concrete API endpoints: requirement posted → matches found → send request → provider reviews → accept/reject/counter-offer → booking confirmed → logistics coordinated → delivery tracked → receipt confirmed → escrow released → review.

## Details

[stated] **Requests & Negotiation:** `POST /requests` (seeker sends offer), `GET /requests/provider` (provider views incoming), `POST /requests/{id}/counter` (counter-offer with price/quantity/message), `POST /requests/{id}/accept` (creates booking), `POST /requests/{id}/reject`.

[stated] Firestore collection: `requests/{requestId}` with fields: requirementId, seekerId, providerId, resourceId, requestedQuantity, offeredPrice, counterPrice, message, status, createdAt, updatedAt.

[stated] **Bookings:** `GET /bookings/my`, `GET /bookings/{id}`, `POST /bookings/{id}/confirm-receipt` (seeker confirms delivery).

[stated] Firestore collection: `bookings/{bookingId}` with fields: seekerId, providerId, resourceId, driverId, requirementId, quantity, resourceAmount, deliveryAmount, depositAmount, totalAmount, pickupLocation, deliveryLocation, pickupDate, deliveryDate, status, escrowStatus, createdAt, updatedAt.

[stated] Escrow is layered on top of booking confirmation: `POST /escrow`, `POST /escrow/{id}/fund`, `POST /escrow/{id}/release`, `GET /escrow/{id}`. States: PENDING → FUNDED → IN_TRANSIT → DELIVERED → RELEASED. See D004.

[stated] Condition evidence supports the escrow release: `POST /condition-evidence` with stage (PICKUP/DELIVERY), imageUrl, description. Images uploaded to Firebase Storage first.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/concepts/smart-matching]]
depends_on:: [[projects/hospitality-resource-exchange/concepts/bundled-requests]]

## Open questions

- Dispute arbitration rule when condition evidence photos conflict is still undefined — who/what resolves it.
