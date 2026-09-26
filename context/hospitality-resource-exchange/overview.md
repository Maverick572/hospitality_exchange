---
type: project
status: draft
project_status: active
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
---

# Hospitality Resource Exchange

## What it is

A B2B marketplace where hospitality businesses (hotels, restaurants, caterers, resorts, event companies) list underutilized resources (space, furniture, AV equipment, vehicles, kitchen capacity) and post requirements for resources they temporarily need, matched via a CP-SAT solver and Groq LLM parsing layer. Core differentiator is logistics-aware matching: detecting existing transport routes with spare capacity to cut delivery costs. Built for a hackathon (HackCelestial 3.0) with a demo day deadline.

## Current state

[stated] Idea is not yet finalized — being fixed module by module before further build work.
[stated] Feature set: 7 consolidated features (see concepts/). Architecture and tech stack are drafted (see architecture/).
[stated] Several unresolved gaps identified in a prior review: overclaiming risk ("smart contract" language, "agentic orchestrator" framing), undefined matching scoring formula, undefined logistics-data source for demo, undefined dispute arbitration, unconfirmed partial-quantity inventory modeling, and an unaddressed cold-start/GTM problem.

## Key decisions

See [[projects/hospitality-resource-exchange/decisions/decisions]] for the full log. Summary: Groq for LLM parsing (speed on critical path); CP-SAT reserved for bundle/multi-item matches only, weighted linear scorer for single-resource matches; FastAPI BackgroundTasks for async (Redis/Celery deferred); escrow as a ledger-based state machine on a licensed payment aggregator (not a smart contract); deposit sizing via a category-aware formula.

## Open conflicts

- Slide deck (PPT draft) reintroduced "Smart Contract" language for escrow, contradicting the locked decision that this is a payment-aggregator-backed ledger, not a smart contract. Needs correction in the deck, not in the decision.
- PPT backend labeling is inconsistent across slides (Python/FastAPI vs Supabase/FastAPI) — not a decision conflict, just an unresolved documentation error.

## Open questions

- What is the actual data source for logistics-aware matching in the hackathon demo (seeded/simulated vs. any real signal)? Blocks an honest pitch narrative.
- What is the CP-SAT objective function and the weighted scoring formula for single-resource matches? Blocks technical credibility with judges.
- How are deposit disputes arbitrated when dual-timestamped photos are themselves contested? Blocks the escrow feature's completeness.
- Is resource inventory tracked as partial-quantity (e.g. 100 of 300 chairs still available) or binary available/booked? This changes the DB schema and the solver's constraint formulation — needs to be locked before build.
- No cold-start/GTM strategy defined for which geography/vertical to seed first, or how to solve the two-sided marketplace bootstrap problem.
- Full problem-statement coverage check (2026-09-26) found 4 requirements/optional-features with no concept note or PPT presence: business profiles & ratings ([[projects/hospitality-resource-exchange/concepts/business-profiles-ratings]]), resource utilization analytics ([[projects/hospitality-resource-exchange/concepts/utilization-analytics]] — was in the original spec, dropped from the final 7-feature PPT list), notifications & request prioritization ([[projects/hospitality-resource-exchange/concepts/notifications-prioritization]]), and quotation requests ([[projects/hospitality-resource-exchange/concepts/quotation-requests]]). Also found: "search" as a distinct browse mode (vs. posting a requirement) is unaddressed — see open question on [[projects/hospitality-resource-exchange/concepts/requirement-posting]].
