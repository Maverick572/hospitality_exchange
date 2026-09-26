---
type: concept
status: superseded
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: ["[[projects/hospitality-resource-exchange/sources/problem-statement]]"]
confidence: low
---

# Quotation Requests

[stated] Problem statement lists "quotation requests" as a distinct optional feature, separate from "negotiation."

[stated] Not represented in the new API contract, schema, or feature set. The negotiation flow (`POST /requests`, `POST /requests/{id}/counter`) covers the quote/pricing conversation directly within the request lifecycle.

[historical] Was envisioned as a lighter-weight precursor to the full request/negotiate/book lifecycle — a "what would this cost me" flow. In practice, the matching endpoint (`POST /matching/search`) already returns price information per match result, serving a similar purpose.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/concepts/smart-matching]]
depends_on:: [[projects/hospitality-resource-exchange/concepts/negotiate-book]]

## Open questions

- Deliberately dropped from scope. The matching results and counter-offer flow together cover the pricing-discovery use case.
