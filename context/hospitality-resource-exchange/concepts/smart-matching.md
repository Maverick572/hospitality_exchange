---
type: concept
status: draft
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: med
---

# Smart Matching (single-resource)

[stated] Ranks potential matches for a single-resource requirement using price, distance, availability, quantity, suitability, urgency, and business preferences — rather than returning plain search results.

## Details

[stated] Seeker sees a ranked output like: "94% Match, ₹7,200, 3.4 km away, available for required time, logistics optimized."

[decided] Per project decision log, single-resource matches use a fast weighted linear scorer, not CP-SAT — CP-SAT is reserved for bundle/multi-item requests only. See [[projects/hospitality-resource-exchange/decisions/decisions]] D002.

[inferred] The scoring formula (weights for price/distance/suitability/etc.) is currently undefined — this is the top technical-credibility risk flagged in the project review, since judges are likely to ask for it directly.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/architecture/optimization-layer]]

## Open questions

- What are the actual weights/formula for the linear scorer? No formula defined yet.
- What does "suitability" mean quantitatively?
