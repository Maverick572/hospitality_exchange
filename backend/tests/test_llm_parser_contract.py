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
            {"category": "furniture", "name": "  Chair ", "quantity": 300},
            {"category": "furniture", "name": "TABLE", "quantity": 20},
        ]
    )

    assert result.items == [
        ParsedItem(category=ResourceCategory.FURNITURE, name="chair", quantity=300),
        ParsedItem(category=ResourceCategory.FURNITURE, name="table", quantity=20),
    ]


@pytest.mark.parametrize(
    "item",
    [
        {"category": "furniture", "name": "chair", "quantity": 0},
        {"category": "furniture", "name": "chair", "quantity": -1},
        {"category": "unknown", "name": "chair", "quantity": 1},
        {"category": "furniture", "quantity": 1},
        {"category": "furniture", "name": "", "quantity": 1},
    ],
)
def test_invalid_items_are_rejected(item):
    with pytest.raises(ValidationError):
        ParsedItem(**item)


def test_empty_item_result_is_valid():
    result = RequirementParseResult(items=[])

    assert result.items == []