---
type: concept
status: draft
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: ["[[projects/hospitality-resource-exchange/sources/problem-statement]]"]
confidence: low
---

# Business Profiles, Ratings & Reviews

[stated] Problem statement lists business profiles and ratings/reviews as features the platform "may also incorporate" — optional, not a core "should be able to" requirement.

## Details

[stated] Original spec workflow (message.txt) includes "Receive Rating / Revenue" and "Rate Provider" as the final steps of both provider and seeker workflows — implying ratings were intended as part of the core transaction lifecycle, not purely optional, despite the PS framing them as exploratory.

[inferred] Not currently represented as its own concept note or PPT feature — it exists only as the last step of [[projects/hospitality-resource-exchange/concepts/negotiate-book]]'s lifecycle diagram, with no defined data model (what a business profile contains, how rating scores aggregate, whether ratings feed into the matching scorer's "suitability" or "trust" factors).

[inferred] This connects directly to the cold-start/trust problem flagged at the project level: a new marketplace has no rating history for its first transactions, so the matching layer's "trust score" (mentioned in the PPT architecture slide) has nothing to compute from initially.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/concepts/negotiate-book]]

## Open questions

- Is a business profile just identity/contact info, or does it carry a trust/rating score consumed by the matching layer?
- How is the cold-start problem handled when a new business has zero rating history?
- Does the "Trust Score, Risk Assessment" mentioned in the PPT's Intelligence Layer (Slide 3) reduce to this rating average, or is it a separate undefined model? (See [[projects/hospitality-resource-exchange/architecture/intelligence-layer]].)
