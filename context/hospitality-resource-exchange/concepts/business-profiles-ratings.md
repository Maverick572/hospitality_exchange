---
type: concept
status: stable
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: high
---

# Business Profiles, Ratings & Reviews

[stated] Now a first-class feature. Each user has a profile with rating and totalRatings. Reviews are submitted after completed bookings and aggregate into provider ratings that feed into the matching scorer.

## Details

[stated] Firestore collections: `users/{userId}` includes rating and totalRatings. `reviews/{reviewId}` with fields: bookingId, reviewerId, providerId, rating, comment, createdAt, updatedAt.

[stated] API: `POST /reviews` (rate provider after booking), `GET /users/{userId}/reviews` (get provider rating + review list). Backend computes and updates the aggregate rating — frontend should NOT calculate or directly modify provider ratings.

[decided] Provider rating is confirmed as a matching/search metric — it appears in match results and influences matchScore.

[stated] Profile API: `POST /users/profile` (create after Firebase signup), `GET /users/me`, `PATCH /users/me`. Profile includes: name, email, phone, businessName, location, profileImage, rating, totalRatings.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/concepts/negotiate-book]]

## Open questions

- Cold-start problem for new businesses with zero rating history remains unaddressed — how does matching handle a provider with no ratings?
