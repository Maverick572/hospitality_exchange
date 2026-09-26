---
type: concept
status: draft
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: ["[[projects/hospitality-resource-exchange/sources/problem-statement]]"]
confidence: low
---

# Resource Utilization Analytics

[stated] Problem statement lists resource utilization analytics and dashboards among optional platform features.

## Details

[stated] The original spec (message.txt, section 7) defines this concretely: a per-provider dashboard showing utilization percentage per resource type (e.g. "Banquet Chairs 38%, AV Equipment 24%"), with the platform highlighting idle-capacity insights (e.g. "Your AV equipment is idle 76% of the time") and estimated recoverable revenue (e.g. "₹42,000/month").

[inferred] This was present as Feature 7 in the original 12-feature prioritized spec ("Strong additions" tier — priority 8, above surge pricing and ratings) but was dropped entirely from the final PPT's 7-feature list. Not clear whether this was a deliberate scope cut or an oversight during consolidation.

[inferred] Purely a reporting layer over booking/transaction history already in Supabase (L5 Transaction Layer) — does not require the LLM or CP-SAT solver, just aggregation queries. Low implementation cost relative to its narrative value (turns idle assets into a visible number, which is a strong pitch point per the original spec's framing).

## Relations

depends_on:: [[projects/hospitality-resource-exchange/concepts/negotiate-book]]

## Open questions

- Was this feature deliberately cut from the PPT's 7-feature list, or dropped by omission during consolidation? If the latter, it's cheap to re-add and strengthens the pitch.
