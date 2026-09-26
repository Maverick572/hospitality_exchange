"""Parse natural-language hospitality requirements into validated items."""

import json
import os
from typing import Union

from dotenv import load_dotenv
from groq import Groq
from pydantic import BaseModel, Field, ValidationError, field_validator

from services.category_registry import (
    ResourceCategory,
    build_category_prompt_block,
    get_category_ids,
)

load_dotenv()


class ParsedItem(BaseModel):
    """One hospitality resource extracted from a requirement."""

    category: ResourceCategory
    name: str = Field(min_length=1)
    quantity: Union[int, float] = Field(gt=0)
    metric: str = Field(default="units", min_length=1)

    @field_validator("category", mode="before")
    @classmethod
    def normalize_category(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower()
        return value

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        return " ".join(value.split()).lower()

    @field_validator("quantity", mode="before")
    @classmethod
    def normalize_quantity(cls, value: object) -> object:
        if isinstance(value, (int, float)):
            if value <= 0:
                raise ValueError("Quantity must be greater than 0")
            if float(value).is_integer():
                return int(value)
            return round(float(value), 3)
        return value

    @field_validator("metric", mode="before")
    @classmethod
    def normalize_metric(cls, value: object) -> object:
        if not isinstance(value, str) or not value.strip():
            return "units"
        val = value.strip().lower()
        if val in ("kilogram", "kilograms", "kgs", "kilo", "kilos"):
            return "kg"
        if val in ("liter", "litre", "liters", "litres", "ltr", "ltrs", "l"):
            return "liters"
        if val in ("meter", "meters", "metre", "metres"):
            return "m"
        if val in ("sq meter", "sq meters", "sqm", "sq_m", "square meter", "square meters"):
            return "sqm"
        if val in ("unit", "units", "pieces", "piece", "pcs", "nos"):
            return "units"
        return val


class RequirementParseResult(BaseModel):
    """Root object returned by the Groq JSON response."""

    items: list[ParsedItem]


class ParserServiceError(Exception):
    """Raised when a requirement cannot be safely parsed."""


DEFAULT_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# ---------------------------------------------------------------------------
# System prompt — category list is auto-generated from categories.json
# ---------------------------------------------------------------------------

_CATEGORY_BLOCK = build_category_prompt_block()

SYSTEM_PROMPT = f"""You are a strict data extraction pipeline for a B2B hospitality resource marketplace.
Extract only requested hospitality resources, supplies, equipment, and ingredients from the user's text.

Rules:
1. Ignore location, dates, times, budgets, delivery, and transportation details.
2. Normalize each item name to a lowercase singular noun.
3. Convert written quantities to positive numbers. If a requested resource has no quantity, default to 1.
4. Use ONLY standard SI / metric units for the "metric" field:
   - "kg" for mass, weight, produce, solid raw ingredients, and bulk commodities (e.g. onions, tomatoes, potatoes, rice, vegetables, spices, flour, sugar, pulses).
     * Robustly recognize bulk/agricultural units and common typos/phonetic spellings:
       - 1 quintal (including typos: quitntal, quitnal, quental, quintle, qtl) = 100 kg (e.g. "100 quitntal onion" -> quantity: 10000, metric: "kg"; "20000 quitnal tomato" -> quantity: 2000000, metric: "kg").
       - 1 ton / metric tonne (or tons, tonnes, mt) = 1000 kg.
       - Grams (g), mg, lbs, pounds, ounces -> convert to kg (e.g. 500g -> 0.5 kg).
   - "liters" for volume and liquids (e.g. cooking oil, milk, water, juice, syrups; convert gallons, ml, etc. to liters).
   - "m" for length or distance.
   - "sqm" for area and space (convert sq ft, sq yards, acres, etc. to sqm).
   - "units" for countable discrete items (e.g. chairs, tables, microphones, devices, appliances, cookware, utensils).
   Never output non-SI or informal packaging metrics like "boxes", "plates", "packets", "bundles", "lbs", or "gallons"; convert them to standard SI units.
   Items in "raw_ingredients" must use "kg" for solids/produce and "liters" for liquids; NEVER use "units" for bulk produce or raw ingredients. Default to "units" only for countable equipment, furniture, and physical articles.
5. Exclude items with zero or negative intent, or items that are not hospitality equipment, resources, or supplies.
6. Use only these categories:
{_CATEGORY_BLOCK}
7. Return an empty items list when no hospitality resource or supply is requested.

Return only valid JSON with this root object shape:
{{"items": [{{"category": "banquet_seating", "name": "chair", "quantity": 1, "metric": "units"}}]}}
"""


def _get_client() -> Groq:
    """Create the Groq client lazily so importing this module has no side effects."""

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ParserServiceError("The requirement parser is not configured.")

    try:
        timeout = float(os.getenv("GROQ_TIMEOUT_SECONDS", "15"))
        return Groq(api_key=api_key, timeout=timeout)
    except Exception:
        raise ParserServiceError("The requirement parser is not configured.") from None


def _request_completion(description: str) -> str:
    """Request a strict JSON extraction from Groq and return its content."""

    try:
        response = _get_client().chat.completions.create(
            model=DEFAULT_MODEL,
            temperature=0.0,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": description},
            ],
        )
        content = response.choices[0].message.content
        if not content or not content.strip():
            raise ValueError("empty response")
        return content
    except ParserServiceError:
        raise
    except Exception:
        raise ParserServiceError("The requirement parser service is unavailable.") from None


def parse_requirement(description: str) -> list[ParsedItem]:
    """Extract and validate hospitality resources from a search description."""

    if not description or not description.strip():
        return []

    content = _request_completion(description.strip())

    try:
        payload = json.loads(content)
        result = RequirementParseResult.model_validate(payload)
    except (json.JSONDecodeError, TypeError, ValidationError):
        raise ParserServiceError("The requirement parser returned invalid data.") from None

    return result.items
