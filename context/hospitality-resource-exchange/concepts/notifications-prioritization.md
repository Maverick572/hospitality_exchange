---
type: concept
status: draft
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: ["[[projects/hospitality-resource-exchange/sources/problem-statement]]"]
confidence: low
---

# Notifications & Request Prioritization

[stated] Problem statement separately lists "request prioritization" as a practical challenge the solution should address, and "notifications" as an optional feature the platform may incorporate.

## Details

[inferred] Grouped into one note since neither has been designed at all — no concept note, no PPT mention, no architecture placement exists for either.

[inferred] Request prioritization likely interacts with the "urgency" field already captured in [[projects/hospitality-resource-exchange/concepts/requirement-posting]] (e.g. "Urgency: High" in the original spec example) — but there is no defined mechanism for how urgency affects queue order, provider notification timing, or whether high-urgency requests get preferential solver treatment in [[projects/hospitality-resource-exchange/architecture/optimization-layer]].

[inferred] Notifications are plumbing (Supabase realtime/webhooks or a push service) — low algorithmic complexity, but zero design work has been done, including which events trigger a notification (new match, booking accepted, dispute raised, deposit released).

## Relations

depends_on:: [[projects/hospitality-resource-exchange/concepts/requirement-posting]]
depends_on:: [[projects/hospitality-resource-exchange/concepts/negotiate-book]]

## Open questions

- How does "urgency" translate into actual prioritization behavior — queue order, notification timing, solver weighting, or all three?
- Which events trigger notifications, and via what channel (in-app, email, SMS)?
- Is this in scope for the hackathon MVP at all, or explicitly deferred?
