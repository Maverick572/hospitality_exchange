---
type: concept
status: stable
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: high
---

# Smart Matching & LLM Seeker Search

[stated] Ranks potential matches for hospitality requirements. Discovery operates via two paradigms:
1. Real-time Natural Language Search (`POST /api/v1/seeker/search` & `POST /api/v1/requirements/parse`): Instant marketplace search from the search bar with `fromTimestamp` / `toTimestamp` and seeker geolocation.
2. Formal Requirement Matching (`POST /api/v1/matching/search`): Finding matches for a stored requirement document.

## Details

[decided] Per D011, the primary seeker search parses unstructured prompts via LLM (Groq Llama 3.3 70B / Gemini) and matches against Firestore products using a deterministic 3-tier ranking:
1. Best Availability: Evaluates calendar availability slots (`[{ date, quantity }]`), computing `availabilityScore` (bonus for full requested quantity and verified date slot).
2. Lowest Price: Ascending unit price.
3. Nearest Location: Proximity to seeker location using product coordinates (with fallback to provider business location from `users/{providerId}`).

[stated] API: `POST /api/v1/seeker/search` with `{ description, fromTimestamp, toTimestamp, location }`.
Returns: `{ query, parsedItems, totalFound, results }` with distance in km, availability scores, and full provider information.

[stated] Provider rating is a first-class metric included in matching and search results.

[stated] The frontend displays results and parsed query preview tags, but does NOT calculate matching scores — all scoring and ranking is executed server-side.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/architecture/intelligence-layer]]
depends_on:: [[projects/hospitality-resource-exchange/architecture/optimization-layer]]

## Open questions

- Dynamic distance decay exponent for high-density urban vs. suburban delivery zones.
