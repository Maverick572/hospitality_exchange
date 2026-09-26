import pytest
from pydantic import ValidationError

from backend.services.llm_parser import (
    ParsedItem,
    RequirementParseResult,
    ResourceCategory,
)


def test_valid_requirement_items_are_typed_and_normalized():
    result = RequirementParseResult(
        items=[
            {"category": "banquet_seating", "name": "  Chair ", "quantity": 300},
            {"category": "tables", "name": "TABLE", "quantity": 20},
        ]
    )

    assert result.items == [
        ParsedItem(category=ResourceCategory.BANQUET_SEATING, name="chair", quantity=300),
        ParsedItem(category=ResourceCategory.TABLES, name="table", quantity=20),
    ]


@pytest.mark.parametrize(
    "item",
    [
        {"category": "banquet_seating", "name": "chair", "quantity": 0},
        {"category": "banquet_seating", "name": "chair", "quantity": -1},
        {"category": "unknown", "name": "chair", "quantity": 1},
        {"category": "banquet_seating", "quantity": 1},
        {"category": "banquet_seating", "name": "", "quantity": 1},
    ],
)
def test_invalid_items_are_rejected(item):
    with pytest.raises(ValidationError):
        ParsedItem(**item)


def test_empty_item_result_is_valid():
    result = RequirementParseResult(items=[])

    assert result.items == []


def test_metric_normalization_and_default():
    item1 = ParsedItem(category=ResourceCategory.RAW_INGREDIENTS, name="rice", quantity=30, metric="  KG ")
    assert item1.metric == "kg"

    item2 = ParsedItem(category=ResourceCategory.BANQUET_SEATING, name="chair", quantity=20)
    assert item2.metric == "units"


def test_all_31_categories_exist_in_enum():
    """Verify the auto-generated enum has exactly 31 members."""
    members = list(ResourceCategory)
    assert len(members) == 31
    # Spot-check a few
    assert ResourceCategory.BANQUET_SEATING.value == "banquet_seating"
    assert ResourceCategory.COOKING_EQUIPMENT.value == "cooking_equipment"
    assert ResourceCategory.VENUE_SPACE.value == "venue_space"
    assert ResourceCategory.OTHER.value == "other"