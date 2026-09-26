# Concepts

Notes on domain knowledge and conceptual dependencies for this project.

| Note | Summary |
|:--|:--|
| [[resource-listing]] | Users list resources (name, category, quantity, availableQuantity, price, location, availability) — structured CRUD via FastAPI/Firestore |
| [[requirement-posting]] | Users post requirements — free-text parsed via LLM into structured items, then chains to matching |
| [[smart-matching]] | Single-resource ranked matching via weighted linear scorer; API returns matchScore + matchReasons |
| [[availability-calendar]] | Partial-quantity availability per time slot; quantity + availableQuantity model confirmed |
| [[negotiate-book]] | Full lifecycle: request → counter-offer → accept → booking → escrow → delivery → receipt → review |
| [[logistics-aware-matching]] | Core USP — drivers publish routes, platform matches deliveries by route overlap, capacity, timing |
| [[bundled-requests]] | Multi-resource requests solved via CP-SAT across multiple providers; `/matching/bundle` endpoint defined |
| [[business-profiles-ratings]] | User profiles with aggregate rating + reviews; provider rating feeds into matching scorer |
| [[notifications-prioritization]] | Transaction-lifecycle notifications for users and drivers; schema and API defined |
| [[utilization-analytics]] | ~~Per-provider idle-capacity dashboard~~ — dropped from scope; replaced by dashboard endpoints |
| [[quotation-requests]] | ~~Lighter-weight price-quote flow~~ — dropped from scope; covered by matching results + counter-offers |

```dataview
LIST FROM "projects/hospitality-resource-exchange/concepts" WHERE file.name != "_index"
```
