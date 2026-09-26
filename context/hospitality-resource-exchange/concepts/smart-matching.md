---
type: concept
status: stable
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: high
---

# Smart Matching (single-resource)

[stated] Ranks potential matches for a single-resource requirement. The API returns ranked results with `matchScore` (0.0–1.0), `matchReasons[]`, and concrete metrics per match.

## Details

[decided] Per D002, single-resource matches use a fast weighted linear scorer, not CP-SAT — CP-SAT is reserved for bundle/multi-item requests only.

[stated] API: `POST /matching/search` with `{ "requirementId": "req_123" }`. Backend flow: candidate retrieval from Firestore → availability filtering → distance calculation → price calculation → provider rating → logistics availability → optimization → ranked results.

[stated] Each match result includes: provider info (userId, businessName, rating, totalRatings), resource info (resourceId, name, availableQuantity, price, pricingUnit), distanceKm, resourceCost, logisticsAvailable, matchScore, and matchReasons.

[stated] Provider rating is confirmed as one of the matching/search metrics — feeds directly into matchScore.

[stated] The frontend displays results but does NOT calculate the matching score — all scoring is server-side.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/architecture/optimization-layer]]

## Open questions

- What are the actual weights for the internal linear scorer formula? The API shape is set but internal weighting needs tuning.
