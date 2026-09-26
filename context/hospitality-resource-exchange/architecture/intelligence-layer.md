---
type: concept
status: stable
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: high
---

# Intelligence Layer (LLM)

[decided] Groq (Llama 3.3 70B) handles natural-language-to-structured-requirement extraction and result explanation only. It is never conflated with the deterministic bundle optimizer (CP-SAT) — this separation was explicitly flagged as important for judge credibility.

## Details

[decided] Groq chosen over a generic LLM reference specifically for inference speed on the critical parsing path. See [[projects/hospitality-resource-exchange/decisions/decisions]] D003.

[stated] The new API contract confirms this separation: `POST /requirements` accepts a free-text `description` field; the backend (FastAPI) parses this via LLM into structured `items[]` (category, name, quantity) before matching runs. The frontend never sees the LLM prompt or parsing logic.

[stated] No "agentic orchestrator" language appears in the current API contract — the overclaiming risk flagged earlier has been resolved in the implementation specs.

## Relations

extends:: [[projects/hospitality-resource-exchange/architecture/five-layer-model]]

## Open questions

- None — the LLM's scope is locked to extraction and explanation.
