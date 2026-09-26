---
type: concept
status: stable
tags: [category, taxonomy, evidence, si-units, llm]
updated: 2026-09-27
confidence: high
depends_on: ["[[resource-listing]]", "[[requirement-posting]]", "[[negotiate-book]]"]
---

# Category Registry and Evidence Rules

Defines the single source of truth for hospitality resource categorization, evidence capture requirements, and unit standardization across frontend and backend.

## Why a Centralized Registry

[decided] The platform replaces arbitrary or overlapping category enums with a canonical 31-category taxonomy sourced from commercial B2B marketplaces (Amazon Business, Udaan, IndiaMART, WebstaurantStore, Moglix) stored in `shared/categories.json`. See D011.

- **Single source of truth**: Consumed by Python backend (`backend/services/category_registry.py`) and future React frontend (`frontend/src/types/categories.ts`).
- **Dynamic prompt generation**: Category IDs and keyword lists are injected directly into the Groq LLM parser system prompt.
- **REST endpoint**: `GET /api/v1/categories` exposes full metadata to client applications.

## Evidence-Type Coupling

[decided] Categories are explicitly classified by physical verification requirement:
- **`photo` (17 categories)**: Static physical items where condition is visible in a still photograph (banquet chairs, tables, linens, crockery, cutlery, cookware, decor).
- **`video` (10 categories)**: Powered, mechanical, or electrical items where operational state must be proven (cooking ranges, fryers, refrigeration, dishwashers, sound/PA systems, LED displays, POS systems).
- **`photo_video` (3 categories)**: Spatial, structural, or transport assets requiring both wide-angle still documentation and walkthrough video (venues, modular staging/tents, transport vehicles).
- **`other` (1 fallback)**: Defaults to photo.

The condition evidence submission endpoint (`POST /bookings/{id}/evidence`) validates that uploaded `mediaType` satisfies the resource's category evidence requirement, preventing fraudulent claims and streamlining dispute arbitration.

## Standard SI Unit Normalization

[decided] Resource quantities are normalized strictly to SI units:
- **`kg`**: Mass/weight for produce, solids, bulk commodities (raw ingredients default).
- **`liters`**: Liquids (cooking oil, milk, syrups, beverage bulk).
- **`m` / `sqm`**: Dimensions and spatial capacity (venues default to sqm).
- **`units`**: Countable physical equipment and discrete articles.

Wholesale units are deterministically converted during extraction (1 quintal = 100 kg, 1 metric ton = 1000 kg), tolerating phonetic spellings and common typos (e.g., `quitntal`, `quitnal`).
