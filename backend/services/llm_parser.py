"""Parse natural-language hospitality requirements into validated items."""

from enum import Enum

from pydantic import BaseModel, Field, field_validator


class ResourceCategory(str, Enum):
    """Categories supported by the matching pipeline."""

    FURNITURE = "furniture"
    AUDIO_VISUAL = "audio_visual"
    KITCHEN_EQUIPMENT = "kitchen_equipment"
    EVENT_EQUIPMENT = "event_equipment"
    SPACE = "space"
    OTHER = "other"


class ParsedItem(BaseModel):
    """One hospitality resource extracted from a requirement."""

    category: ResourceCategory
    name: str = Field(min_length=1)
    quantity: int = Field(ge=1)

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


class RequirementParseResult(BaseModel):
    """Root object returned by the Groq JSON response."""

    items: list[ParsedItem]


class ParserServiceError(Exception):
    """Raised when a requirement cannot be safely parsed."""
