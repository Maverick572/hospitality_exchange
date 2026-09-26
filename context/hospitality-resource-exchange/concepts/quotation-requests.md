---
type: concept
status: draft
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: ["[[projects/hospitality-resource-exchange/sources/problem-statement]]"]
confidence: low
---

# Quotation Requests

[stated] Problem statement lists "quotation requests" as a distinct optional feature, separate from "negotiation" in the same list.

## Details

[inferred] Likely intended as a lighter-weight precursor to the full request/negotiate/book lifecycle: a seeker asks "what would this cost me" for a specific resource/date/quantity combination and gets a price estimate back without committing to a formal request. This is distinct from [[projects/hospitality-resource-exchange/concepts/negotiate-book]], which assumes a request has already been sent and a provider is actively reviewing it.

[inferred] Not represented anywhere in the current PPT or concept set. If in scope, it likely reuses the same scoring/pricing logic as [[projects/hospitality-resource-exchange/concepts/smart-matching]] (which already surfaces a price in its ranked output, e.g. "₹7,200") — meaning a quote could just be a read-only exposure of the matcher's price output, with no new backend logic required. Needs confirmation this is the intended scope, since a quote could also mean provider-issued custom pricing (a genuinely separate flow).

## Relations

depends_on:: [[projects/hospitality-resource-exchange/concepts/smart-matching]]
depends_on:: [[projects/hospitality-resource-exchange/concepts/negotiate-book]]

## Open questions

- Is a "quote" just a read-only view of the matcher's computed price, or does it require provider-issued custom pricing (a separate flow with its own state)?
- Is this in scope for the hackathon MVP, or deferred?
