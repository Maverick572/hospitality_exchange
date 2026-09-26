# Architecture

Notes on code architecture, tech stack, design decisions, and system structure.

| Note | Summary |
|:--|:--|
| [[five-layer-model]] | Client → Access & State → Intelligence → Optimization → Transaction; the stable core of the design |
| [[intelligence-layer]] | Groq LLM: extraction + explanation only; "agentic orchestrator" pitch language risks contradicting this |
| [[optimization-layer]] | CP-SAT for bundles, linear scorer for single-resource; both formulas currently undefined |
| [[tech-stack]] | Full stack list; backend labeling inconsistent across PPT slides (disputed) |

```dataview
LIST FROM "projects/hospitality-resource-exchange/architecture" WHERE file.name != "_index"
```
