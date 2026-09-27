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

[stated] **Requests & Negotiation:** `POST /requests` (seeker sends offer), `GET /requests/{id}` (fetch request negotiation thread), `POST /requests/{id}/messages` (post message or revised rate/window), `GET /requests/provider` (provider views incoming), `POST /requests/{id}/counter` (counter-offer with price/quantity/schedule), `POST /requests/{id}/accept` (creates booking & initializes escrow), `POST /requests/{id}/reject`. Negotiation supports counter-offers back and forth, transit departure/arrival locking, and direct buyer-seller messaging (D009, D018).

[stated] Firestore collection: `requests/{requestId}` with fields: requirementId, seekerId, providerId, resourceId, requestedQuantity, offeredPrice, counterPrice, message, status, departureTime, arrivalTime, messages[], createdAt, updatedAt.

[stated] **Bookings:** `GET /bookings/my`, `GET /bookings/{id}`, `POST /bookings/{id}/confirm-receipt` (seeker confirms delivery, readying escrow release).

[stated] Firestore collection: `bookings/{bookingId}` with fields: seekerId, providerId, resourceId, driverId, requirementId, quantity, resourceAmount, deliveryAmount, depositAmount, totalAmount, pickupLocation, deliveryLocation, pickupDate, deliveryDate, departureTime, arrivalTime, status, escrowStatus, createdAt, updatedAt.

[stated] Escrow is layered on top of booking confirmation: `POST /escrow`, `POST /escrow/{id}/fund`, `POST /escrow/{id}/release`, `GET /escrow/{id}`. States: PENDING → FUNDED → IN_TRANSIT → DELIVERED → RELEASED. Release splits payment between provider and driver while returning deposit minus any clamped penalty. See D004, D009.

[verified] **Two-Phase Category-Coupled Condition Evidence Handover (D018):**
- **Sender Pre-Transit Handover (Export/Dispatch):** Once terms are accepted, the sender must upload condition evidence strictly conforming to the resource category rule in `shared/categories.json` (photo for 17 static physical goods, video for 10 powered/mechanical assets, photo+video for 3 structural/transport assets). Fleet convoy dispatch is locked until valid pre-transit evidence is logged.
- **Receiver Mandatory Return Handover (Return/Check-In):** When the rental period concludes and items are returned, the receiver must mandatorily upload return condition evidence (photo or video as required by category). The side-by-side inspector compares departure vs return condition to verify zero unauthorized damage before the ₹2,000 escrow damage deposit is released back to the renter.

[verified] Implementation completed under `backend/transactions/` (evidence retrieval via `GET /condition-evidence/{bookingId}` and thread history via `GET /requests/{id}`) and frontend chat interface in `frontend/app/dashboard/negotiation/page.tsx`.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/concepts/smart-matching]]
depends_on:: [[projects/hospitality-resource-exchange/concepts/bundled-requests]]
depends_on:: [[projects/hospitality-resource-exchange/concepts/category-registry-and-evidence-rules]]

## Open questions

- Dispute arbitration rule when condition evidence photos conflict is resolved via side-by-side visual timestamp comparison between Sender Pickup and Receiver Return records.
