# Architecture

Notes on code architecture, tech stack, design decisions, and system structure.

| Note | Summary |
|:--|:--|
| [[five-layer-model]] | Three-column FastAPI architecture: CRUD/State (Firestore) · Matching Engine (LLM + CP-SAT) · External Services (OSRM); supersedes old five-layer model |
| [[intelligence-layer]] | Groq LLM: extraction + explanation only; scope locked, no agentic overclaiming |
| [[optimization-layer]] | CP-SAT for bundles, linear scorer for single-resource; API shape defined, internal weights TBD |
| [[tech-stack]] | React + FastAPI + Firebase (Firestore/Auth/Storage) + CP-SAT + Groq + OSRM |

```dataview
LIST FROM "projects/hospitality-resource-exchange/architecture" WHERE file.name != "_index"
```
