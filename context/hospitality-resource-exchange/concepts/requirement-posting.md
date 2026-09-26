---
type: concept
status: stable
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: high
---

# Requirement Posting

[stated] Users acting as Seekers describe requirements, optionally using natural language. The backend parses free-text descriptions via LLM into structured items (category, name, quantity).

## Details

[stated] Firestore collection: `requirements/{requirementId}` with fields: seekerId, description, category, quantity, location, requiredDate, startTime, endTime, budget, deliveryRequired, status, createdAt, updatedAt.

[stated] API: `POST /requirements` accepts a free-text `description` plus structured fields (location, date, times, budget, deliveryRequired). The response includes parsed `items[]` extracted by the LLM from the description.

[stated] Example: description "I need 300 chairs and 20 tables in Vashi tomorrow" → parsed items: [{category: "furniture", name: "chairs", quantity: 300}, {category: "furniture", name: "tables", quantity: 20}].

[stated] The flow immediately chains: `POST /requirements` → requirement created → `POST /matching/search` → view matches.

[stated] Additional API endpoints: `GET /requirements/my`, `GET /requirements/{id}`, `PATCH /requirements/{id}`, `DELETE /requirements/{id}` (cancel/deactivate).

## Relations

depends_on:: [[projects/hospitality-resource-exchange/architecture/intelligence-layer]]

## Open questions

- None — API contract and LLM parsing flow are defined.
