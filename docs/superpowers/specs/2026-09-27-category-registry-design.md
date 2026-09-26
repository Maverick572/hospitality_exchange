# Category Registry — Design Specification

**Date:** 2026-09-27
**Status:** Draft
**Scope:** Backend (Python) + shared JSON file for future frontend (React) consumption

---

## 1. Problem

The current system hardcodes 7 overlapping categories in a Python `str, Enum` inside `llm_parser.py`. This causes:

1. **Overlap:** Items like projectors can be classified as `audio_visual` or `electronics`; chafing dishes as `kitchen_equipment` or `event_equipment`.
2. **Frontend drift:** No shared source of truth — frontend must duplicate the enum.
3. **Missing verification rules:** The `conditionEvidence` endpoint accepts any `imageUrl` with no awareness of whether a category requires photo vs. video evidence.
4. **Rigid LLM prompt:** Adding/removing a category requires editing the Python enum, the system prompt string, and any frontend code separately.

## 2. Solution

A single **`shared/categories.json`** file at the project root (`hospitality_exchange/shared/categories.json`) that both backend and frontend import. The backend auto-generates its `ResourceCategory` enum and LLM system prompt from this file at import time.

## 3. Architecture

```
shared/categories.json          ← Single source of truth
        │
        ├──→ backend/services/llm_parser.py
        │       - Auto-generates ResourceCategory enum
        │       - Auto-generates SYSTEM_PROMPT category list
        │       - Pydantic ParsedItem.category validates against enum
        │
        ├──→ backend/transactions/evidence.py
        │       - Looks up category → evidenceType
        │       - Validates uploaded media matches requirement
        │
        └──→ frontend/src/ (future)
                - Import JSON for dropdown population
                - Branch upload UX by evidenceType
```

## 4. `categories.json` Schema

```json
{
  "categories": [
    {
      "id": "banquet_seating",
      "label": "Banquet Seating",
      "evidenceType": "photo",
      "defaultMetric": "units",
      "keywords": ["chair", "banquet chair", "chiavari chair", "stool", "sofa"]
    }
  ]
}
```

Each entry:

| Field | Type | Description |
|:--|:--|:--|
| `id` | `string` | Slug used as the enum value, Firestore field, and frontend key. Lowercase, underscores. |
| `label` | `string` | Human-readable display name for dropdowns and UI. |
| `evidenceType` | `"photo" \| "video" \| "photo_video"` | What media type is required for condition evidence uploads. |
| `defaultMetric` | `string` | Default SI metric for this category (`units`, `kg`, `sqm`, `liters`, `m`). |
| `keywords` | `string[]` | Hint list injected into the LLM system prompt for accurate item-to-category mapping. |

The file contains 31 entries (30 real categories + 1 `other` fallback). Full list defined in the approved category research document.

## 5. Backend Changes

### 5.1 New file: `shared/categories.json`

The full JSON file with all 31 categories.

### 5.2 New file: `backend/services/category_registry.py`

A thin loader module that:

```python
import json
from pathlib import Path
from enum import Enum
from typing import Any

_CATEGORIES_PATH = Path(__file__).resolve().parent.parent.parent / "shared" / "categories.json"

def _load_categories() -> list[dict[str, Any]]:
    """Load and cache the category registry from the shared JSON file."""
    with open(_CATEGORIES_PATH) as f:
        data = json.load(f)
    return data["categories"]

CATEGORIES: list[dict[str, Any]] = _load_categories()

# Auto-generate the enum from JSON ids
ResourceCategory = Enum(
    "ResourceCategory",
    {cat["id"].upper(): cat["id"] for cat in CATEGORIES},
    type=str,
)

# Lookup maps
CATEGORY_BY_ID: dict[str, dict[str, Any]] = {cat["id"]: cat for cat in CATEGORIES}
EVIDENCE_TYPE_BY_CATEGORY: dict[str, str] = {cat["id"]: cat["evidenceType"] for cat in CATEGORIES}
DEFAULT_METRIC_BY_CATEGORY: dict[str, str] = {cat["id"]: cat["defaultMetric"] for cat in CATEGORIES}

def get_category_ids() -> list[str]:
    """Return all valid category ID strings."""
    return [cat["id"] for cat in CATEGORIES]

def build_category_prompt_block() -> str:
    """Build the category section of the LLM system prompt dynamically."""
    lines = []
    for cat in CATEGORIES:
        keywords = ", ".join(cat["keywords"])
        lines.append(f'  - "{cat["id"]}" → {cat["label"]} (e.g. {keywords})')
    return "\n".join(lines)
```

### 5.3 Edit: `backend/services/llm_parser.py`

**Before:**
- Hardcoded `ResourceCategory(str, Enum)` with 7 values
- Hardcoded category list in `SYSTEM_PROMPT`

**After:**
- Import `ResourceCategory` and `build_category_prompt_block` from `category_registry`
- Delete the old enum class
- `SYSTEM_PROMPT` uses `build_category_prompt_block()` to dynamically inject the category list
- `ParsedItem.category` field type changes to the auto-generated `ResourceCategory`
- The `normalize_category` validator stays the same (strip + lowercase)

Key change in the system prompt:

```python
SYSTEM_PROMPT = f"""You are a strict data extraction pipeline ...

6. Use only these categories:
{build_category_prompt_block()}
   Use "other" for anything not matching the above.

..."""
```

### 5.4 Edit: `backend/transactions/evidence.py`

**Before:**
- Accepts any `imageUrl` regardless of category
- No concept of photo vs. video validation

**After:**
- Import `EVIDENCE_TYPE_BY_CATEGORY` from `category_registry`
- When recording evidence, look up the booked resource's category from the booking → resource chain
- Add a new optional field `mediaType` to the evidence payload (`"photo"` or `"video"`)
- If `mediaType` is provided, validate it against the category's `evidenceType`:
  - Category requires `photo` → reject `mediaType: "video"`
  - Category requires `video` → reject `mediaType: "photo"`
  - Category requires `photo_video` → accept either
  - If `mediaType` is omitted, accept without validation (backward compat)

This is a **soft validation** — it guides the frontend UX but doesn't break existing callers that don't send `mediaType`.

### 5.5 No changes to: `backend/main.py`

The existing `/api/v1/requirements/parse` endpoint works unchanged. The `ParsedItem` schema automatically uses the new enum values.

### 5.6 New endpoint: `GET /api/v1/categories`

A simple read-only endpoint that returns the full category list for frontend consumption:

```python
@app.get("/api/v1/categories")
def list_categories():
    return {"categories": CATEGORIES}
```

This eliminates the need for the frontend to bundle or import the JSON file directly — it can fetch categories on app init.

## 6. Frontend Consumption (Future)

When the React frontend is built:

1. On app init, call `GET /api/v1/categories` → cache the list
2. **Resource upload form:** Populate the "Category" dropdown from the cached list using `label` for display and `id` for the value
3. **Evidence upload UX:** When uploading condition evidence for a booking, look up the booked resource's category → check `evidenceType`:
   - `photo` → show camera/photo picker only
   - `video` → show video recorder/picker only
   - `photo_video` → show both options
4. **Requirement display:** Show `label` in the UI wherever categories appear

## 7. Migration

### Data migration: None required

Firestore `resources/` and `requirements/` documents store `category` as a free-text string field. Existing documents with old category values (`furniture`, `audio_visual`, etc.) will simply not match any of the new category IDs. Since this is a hackathon project with no production data, no migration script is needed.

### Code migration checklist

| File | Action |
|:--|:--|
| `shared/categories.json` | Create |
| `backend/services/category_registry.py` | Create |
| `backend/services/llm_parser.py` | Remove old enum, import from registry, regenerate prompt |
| `backend/transactions/evidence.py` | Add mediaType validation |
| `backend/main.py` | Add `GET /api/v1/categories` endpoint |
| `backend/tests/test_llm_parser_*.py` | Update to use new category IDs |

## 8. Testing

- **Unit test `category_registry.py`:** Verify JSON loads, enum has 31 members, lookup maps are populated, prompt block contains all category IDs.
- **Unit test `llm_parser.py`:** Existing tests updated with new category values (e.g., `banquet_seating` instead of `furniture`).
- **Unit test `evidence.py`:** Test mediaType validation against each evidence type.
- **Integration test:** Hit `/api/v1/categories` → verify 31 categories returned with correct schema.

## 9. Risks & Mitigations

| Risk | Mitigation |
|:--|:--|
| LLM assigns wrong category from 31 options | Keywords in prompt guide mapping; `other` fallback catches edge cases |
| JSON file path breaks in deployment | `Path(__file__).resolve()` makes it relative to the Python file, not cwd |
| Frontend/backend category drift | Single JSON file + API endpoint = one source of truth |
| Too many categories slow the LLM | 31 categories add ~50 tokens to the prompt — negligible impact |
