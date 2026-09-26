---
type: index
status: stable
tags: [brain]
updated: 2026-09-26
---

# Brain

| Project | Status | Overview |
|:--|:--|:--|
| entity-resolution | active | [[projects/entity-resolution/overview]] |
| hospitality-resource-exchange | active | [[projects/hospitality-resource-exchange/overview]] |

## Archived

| Project | Outcome | Overview |
|:--|:--|:--|
| knowledge-cartographer | dropped (existing solutions cover it) | [[projects/_archive/knowledge-cartographer/overview]] |

## Recent updates (last 5, newest first)

- 2026-09-26 — Created hospitality-resource-exchange project: 7 features mapped as concept notes, five-layer architecture + intelligence/optimization/tech-stack notes, and a 6-entry decision log (D001-D006) ported from prior planning. Flagged open gaps (undefined scoring formulas, disputed logistics-matching mechanism, PPT overclaiming risks) as open questions.
- 2026-09-26 — Verified zero-injection blocking recall benchmark (100% FAISS retrieval of in-pool candidates); logged D007 (decoupled recall testing) and D008 (field-specific normalization); documented CPU-to-GPU compute scaling constraints.
- 2026-09-26 — Mapped entity-resolution project into reconciled Brain schema: created 16 knowledge notes across concepts, architecture, decisions (D001–D006), research, and sources with R13 provenance tags and typed edges.
- 2026-09-25 — Schema reconciliation: merged context-graph innovations into vault. Added R13 (provenance tags), R14 (decision log format), R15 (project status separation). Added `depends_on` edge type, `project_status` field, `decisions/` template folder, `tools/` directory to vault structure.
- 2026-09-25 — Created entity-resolution project. ML Challenge 2026: 6-stage pipeline (normalize → block → features → LightGBM → threshold → output). Data profiled, plan written.
