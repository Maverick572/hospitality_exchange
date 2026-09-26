"""Category registry — single source of truth for all resource categories.

Loads categories from ``shared/categories.json`` and exposes:
- ``ResourceCategory`` – an auto-generated ``str`` enum
- Lookup maps for evidence types, default metrics, and full metadata
- ``build_category_prompt_block()`` – injects categories into the LLM prompt
"""

import json
from enum import Enum
from pathlib import Path
from typing import Any

_CATEGORIES_PATH = (
    Path(__file__).resolve().parent.parent.parent / "shared" / "categories.json"
)


def _load_categories() -> list[dict[str, Any]]:
    """Load and cache the category registry from the shared JSON file."""
    with open(_CATEGORIES_PATH, encoding="utf-8") as f:
        data = json.load(f)
    return data["categories"]


CATEGORIES: list[dict[str, Any]] = _load_categories()

# ---------------------------------------------------------------------------
# Auto-generated enum
# ---------------------------------------------------------------------------

ResourceCategory = Enum(  # type: ignore[misc]
    "ResourceCategory",
    {cat["id"].upper(): cat["id"] for cat in CATEGORIES},
    type=str,
)

# ---------------------------------------------------------------------------
# Lookup maps
# ---------------------------------------------------------------------------

CATEGORY_BY_ID: dict[str, dict[str, Any]] = {cat["id"]: cat for cat in CATEGORIES}

EVIDENCE_TYPE_BY_CATEGORY: dict[str, str] = {
    cat["id"]: cat["evidenceType"] for cat in CATEGORIES
}

DEFAULT_METRIC_BY_CATEGORY: dict[str, str] = {
    cat["id"]: cat["defaultMetric"] for cat in CATEGORIES
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def get_category_ids() -> list[str]:
    """Return all valid category ID strings."""
    return [cat["id"] for cat in CATEGORIES]


def build_category_prompt_block() -> str:
    """Build the category section of the LLM system prompt dynamically.

    Each line maps an ID to its label and example keywords so the LLM
    can reliably assign items to the correct category.
    """
    lines: list[str] = []
    for cat in CATEGORIES:
        if cat["keywords"]:
            keywords = ", ".join(cat["keywords"])
            lines.append(
                f'  - "{cat["id"]}" \u2192 {cat["label"]} (e.g. {keywords})'
            )
        else:
            # Fallback entry (e.g. "other")
            lines.append(
                f'  - "{cat["id"]}" \u2192 {cat["label"]} (anything not matching above)'
            )
    return "\n".join(lines)
