---
type: concept
status: draft
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: med
---

# Resource Listing

[stated] Providers list resources they have available, capturing: resource type, quantity, capacity, location, availability dates/times, price, minimum rental period, conditions/restrictions, and photos.

## Details

[stated] Example from spec: "300 Banquet Chairs, Available Sept 10-12, Location: Andheri, Price: ₹6,000/day, Minimum rental: 1 day."

[inferred] This feature is pure CRUD against Supabase (Postgres + PostGIS for location) — it does not touch the LLM parsing layer or the CP-SAT solver, since it's structured form input, not free text.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/concepts/availability-calendar]]

## Open questions

- Is listing entry always structured-form, or can providers also free-text describe a resource (which would route through the LLM parser)?
- Partial-quantity tracking (e.g. 300 chairs, 100 still free after a partial booking) is not yet confirmed as part of the schema — see project overview open questions.
