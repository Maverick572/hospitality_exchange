# Concepts

Notes on domain knowledge and conceptual dependencies for this project.

| Note | Summary |
|:--|:--|
| [[resource-listing]] | Providers list resources (type, quantity, location, price, availability) — pure CRUD, no Brain involvement |
| [[requirement-posting]] | Seekers post requirements — routes through LLM parsing if free-text, else pure CRUD |
| [[smart-matching]] | Single-resource ranked matching via weighted linear scorer (not CP-SAT); scoring formula undefined |
| [[availability-calendar]] | Resource calendars, conflict prevention, partial-quantity availability (schema unconfirmed) |
| [[negotiate-book]] | Full transaction lifecycle: request → negotiate → book → escrow → fulfilment → review |
| [[logistics-aware-matching]] | Core USP — matches transport routes with spare capacity; mechanism and demo data source undecided (disputed) |
| [[bundled-requests]] | Multi-resource requests solved via CP-SAT across multiple providers; objective function undefined |
| [[business-profiles-ratings]] | Business identity + trust/rating data; cold-start problem for new marketplace unaddressed |
| [[utilization-analytics]] | Per-provider idle-capacity dashboard; was in original spec, dropped from final PPT feature list |
| [[notifications-prioritization]] | Urgency-driven prioritization + event notifications; zero design work done, low complexity |
| [[quotation-requests]] | Lighter-weight price-quote flow, distinct from full negotiate/book lifecycle; scope unclear |

```dataview
LIST FROM "projects/hospitality-resource-exchange/concepts" WHERE file.name != "_index"
```
