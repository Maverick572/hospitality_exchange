---
type: concept
status: draft
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: med
---

# Requirement Posting

[stated] Seekers post what they need, capturing: resource type, quantity, required capacity, location, date/time, budget, urgency, and additional requirements.

## Details

[stated] Example from spec: "Need 250 chairs, Bandra, Sept 11 4PM-10PM, Budget ₹8,000, Urgency: High."

[inferred] If posting is done via free-text natural language, this feature routes through the Groq LLM parsing step (NL → structured constraints) before matching runs. If posting is a structured form, it bypasses the LLM entirely and goes straight to Supabase, same as [[projects/hospitality-resource-exchange/concepts/resource-listing]].

## Relations

depends_on:: [[projects/hospitality-resource-exchange/architecture/intelligence-layer]]

## Open questions

- Confirm whether requirement posting is form-based, free-text, or both — this determines whether the LLM is in the critical path for every seeker request or only some.
- The problem statement specifies seekers should be able to "search **or** post requirements" — implying a direct browse/filter mode over existing listings, separate from posting a requirement and waiting for the matcher. Only the posting mode is currently modeled; a search/browse UI is unaddressed.
