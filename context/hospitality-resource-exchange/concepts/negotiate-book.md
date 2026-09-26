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

[stated] **Requests & Negotiation:** `POST /requests` (seeker sends offer), `GET /requests/provider` (provider views incoming), `POST /requests/{id}/counter` (counter-offer with price/quantity/message), `POST /requests/{id}/accept` (creates booking & initializes escrow), `POST /requests/{id}/reject`. Negotiation supports counter-offers back and forth and reviving rejected offers until accepted (D009).

[stated] Firestore collection: `requests/{requestId}` with fields: requirementId, seekerId, providerId, resourceId, requestedQuantity, offeredPrice, counterPrice, message, status, createdAt, updatedAt.

[stated] **Bookings:** `GET /bookings/my`, `GET /bookings/{id}`, `POST /bookings/{id}/confirm-receipt` (seeker confirms delivery, readying escrow release).

[stated] Firestore collection: `bookings/{bookingId}` with fields: seekerId, providerId, resourceId, driverId, requirementId, quantity, resourceAmount, deliveryAmount, depositAmount, totalAmount, pickupLocation, deliveryLocation, pickupDate, deliveryDate, status, escrowStatus, createdAt, updatedAt.

[stated] Escrow is layered on top of booking confirmation: `POST /escrow`, `POST /escrow/{id}/fund`, `POST /escrow/{id}/release`, `GET /escrow/{id}`. States: PENDING → FUNDED → IN_TRANSIT → DELIVERED → RELEASED. Release splits payment between provider and driver while returning deposit minus any clamped penalty. See D004, D009.

[stated] Condition evidence supports the escrow release: `POST /condition-evidence` with stage (PICKUP/DELIVERY), imageUrl, description. Images uploaded to Firebase Storage first.

[verified] Implementation completed by Roh in `backend/transactions/` with zero edits to existing files in `backend/`. 17 tests verify the full lifecycle.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/concepts/smart-matching]]
depends_on:: [[projects/hospitality-resource-exchange/concepts/bundled-requests]]

## Open questions

- Dispute arbitration rule when condition evidence photos conflict is still undefined — who/what resolves it.
