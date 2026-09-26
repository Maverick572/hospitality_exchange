---
type: concept
status: superseded
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: ["[[projects/hospitality-resource-exchange/sources/problem-statement]]"]
confidence: low
---

# Resource Utilization Analytics

[stated] Problem statement lists resource utilization analytics and dashboards among optional platform features.

[stated] Was present as Feature 7 in the original 12-feature prioritized spec but was dropped from the final feature set. Not present in the new API contract or schema.

[historical] Original design: a per-provider dashboard showing utilization percentage per resource type, idle-capacity insights, and estimated recoverable revenue.

[stated] The new architecture includes user and driver dashboards (`GET /dashboard/user`, `GET /dashboard/driver`) with aggregate stats (active resources, completed bookings, total earnings), but not per-resource utilization analytics. This is the closest replacement.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/concepts/negotiate-book]]

## Open questions

- Deliberately dropped from scope. Could be re-added later as a reporting layer over booking history in Firestore.
