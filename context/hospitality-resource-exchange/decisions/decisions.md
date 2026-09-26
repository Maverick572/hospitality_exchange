---
type: decision
status: draft
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
---

# Decisions

Append-only decision log for this project. See R14 for format.

## D001 — Two-backend lean architecture
- **Date:** 2026-09-15
- **Decision:** Architecture finalized as React on Vercel → Supabase (CRUD/auth/realtime), and FastAPI on Render handling only CP-SAT solving and LLM parsing. Presented as a five-layer model.
- **Alternatives considered:** A more complex, more granular multi-service architecture.
- **Rejected because:** Over-engineering risk — first draft was too complex for hackathon deployability.
- **Accepted because:** Concise and deployable beats exhaustive documentation for a demo-day deadline.
- **Status:** accepted
- **Supersedes:** —

## D002 — CP-SAT scoped to bundles only
- **Date:** 2026-09-15
- **Decision:** CP-SAT runs only for bundle/multi-item requests. A fast weighted linear scorer handles single-resource searches.
- **Alternatives considered:** Running CP-SAT for every match request.
- **Rejected because:** CP-SAT is unnecessary overhead (latency, complexity) for single-resource ranking.
- **Accepted because:** Matches solver cost to problem complexity.
- **Status:** accepted
- **Supersedes:** —

## D003 — Groq for LLM inference
- **Date:** 2026-09-15
- **Decision:** Groq (Llama 3.3 70B) chosen for LLM inference, scoped strictly to requirement extraction and result explanation — never conflated with the deterministic CP-SAT optimizer.
- **Alternatives considered:** A generic/other LLM provider reference.
- **Rejected because:** Inference speed matters on the critical parsing path; conflating LLM and optimizer roles undermines judge credibility.
- **Accepted because:** Speed requirement + clean separation of concerns.
- **Status:** accepted
- **Supersedes:** —

## D004 — Escrow as ledger state machine, not a smart contract
- **Date:** 2026-09-15
- **Decision:** Escrow framed as a ledger-based state machine backed by a licensed payment aggregator API — deliberately not a "smart contract." Deposit sizing formula: Replacement Cost × Damage Probability (by category) × Duration Factor × Condition Factor. Escrow, security deposits, and formal booking terms treated as three distinct trust mechanisms, not interchangeable.
- **Alternatives considered:** Framing escrow as a blockchain smart contract (as currently worded in the PPT, Slide 4).
- **Rejected because:** No actual smart contract exists; using the term is an overclaiming risk that fails under technical questioning (no chain, no contract language, no audit trail to point to).
- **Accepted because:** A ledger + payment aggregator is what is actually being built and is defensible under questioning.
- **Status:** accepted
- **Supersedes:** —

## D005 — BackgroundTasks over Redis/Celery for async solves
- **Date:** 2026-09-15
- **Decision:** FastAPI `BackgroundTasks` handles async CP-SAT solves. Redis/Celery deferred until solve volume justifies the overhead.
- **Alternatives considered:** Redis/Celery task queue from the start.
- **Rejected because:** Unjustified infrastructure overhead at hackathon/MVP solve volume.
- **Accepted because:** Simplicity given expected load; can be revisited if volume grows.
- **Status:** accepted
- **Supersedes:** —

## D006 — Truck-pooling cut as standalone feature
- **Date:** 2026-09-15
- **Decision:** Truck/backhaul pooling removed as a standalone feature; logistics-aware matching retained as a lighter mechanic instead.
- **Alternatives considered:** Keeping backhaul pooling as a full standalone feature (VRP-style routing).
- **Rejected because:** Conflicts with the contract/escrow system as scoped; too much algorithmic surface area for hackathon timeline.
- **Accepted because:** Logistics-aware matching still captures the core USP without the full VRP complexity.
- **Status:** accepted
- **Supersedes:** —

### Agent assessments

**Claude — 2026-09-26**
- Position: Backhaul/VRP-style pooling remains the highest-algorithmic-value feature if time permits post-MVP — worth revisiting once D002's scoring formulas and the demo's logistics data source are settled, not before.
