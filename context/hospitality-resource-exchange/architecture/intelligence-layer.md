---
type: concept
status: draft
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: med
---

# Intelligence Layer (LLM)

[decided] Groq (Llama 3.3 70B) handles natural-language-to-structured-requirement extraction and result explanation only. It is never conflated with the deterministic bundle optimizer (CP-SAT) — this separation was explicitly flagged as important for judge credibility.

## Details

[decided] Groq chosen over a generic LLM reference specifically for inference speed on the critical parsing path. See [[projects/hospitality-resource-exchange/decisions/decisions]] D003.

[stated] The PPT (Slide 4) currently describes an "Agentic Multi-Provider Bundle Orchestrator" that "simultaneously queries multiple vendor domains" — this framing risks implying autonomous multi-step agentic decision-making, which contradicts the LLM-extracts/CP-SAT-decides separation. Flagged as the single biggest overclaiming risk in the current deck.

## Relations

extends:: [[projects/hospitality-resource-exchange/architecture/five-layer-model]]

## Open questions

- Rewrite the "agentic orchestrator" pitch language to explicitly state: LLM extracts/explains, CP-SAT decides.
