---
type: concept
status: draft
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: med
---

# Request → Negotiate → Book

[stated] Full transaction lifecycle: requirement posted → matches found → compare options → send request → provider reviews → accept/reject/negotiate → booking confirmed → logistics coordinated → resource delivered/used → transaction completed → rating and review.

## Details

[inferred] This is transaction/state-machine logic — belongs to the Transaction Layer (Supabase Postgres: bookings, escrow state, condition evidence), not the Brain (LLM/solver). The Brain's job ends once a ranked match is produced; negotiation and booking are workflow, not intelligence.

[stated] Escrow is layered on top of booking confirmation: a ledger-based state machine backed by a licensed payment aggregator, with dual-timestamped photo/video condition evidence from both parties. See [[projects/hospitality-resource-exchange/decisions/decisions]] D004.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/concepts/smart-matching]]
depends_on:: [[projects/hospitality-resource-exchange/concepts/bundled-requests]]

## Open questions

- Dispute arbitration rule when both parties' timestamped condition photos conflict is undefined — who/what resolves it, and at what threshold does it escalate vs. auto-resolve?
