---
type: concept
status: stable
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: high
---

# Notifications

[stated] Now a first-class feature with a defined schema and API. Notifications cover the full transaction lifecycle for both Users and Drivers.

## Details

[stated] Firestore collection: `notifications/{notificationId}` with fields: userId, type, title, message, referenceId, read, createdAt.

[stated] API: `GET /notifications` (get all for current user), `PATCH /notifications/{id}/read` (mark as read).

[stated] User notification types: new matches, resource/booking requests, negotiation updates, booking confirmation, driver assignment, delivery updates, payment/escrow updates.

[stated] Driver notification types: route-matched delivery opportunities, accepted delivery requests, pickup reminders, delivery updates, payment updates.

[stated] Request prioritization (urgency-based queue ordering) is not explicitly modeled in the current API — urgency affects matching results but not notification ordering.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/concepts/requirement-posting]]
depends_on:: [[projects/hospitality-resource-exchange/concepts/negotiate-book]]

## Open questions

- None — schema and API are defined. Urgency-based prioritization is deferred.
