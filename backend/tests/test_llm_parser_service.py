import pytest

import backend.services.llm_parser as parser


def test_parse_requirement_returns_validated_items(monkeypatch):
    monkeypatch.setattr(
        parser,
        "_request_completion",
        lambda description: (
            '{"items": ['
            '{"category": "furniture", "name": "chair", "quantity": 300},'
            '{"category": "furniture", "name": "table", "quantity": 20}'
            ']}'
        ),
    )

    result = parser.parse_requirement(
        "I need 300 chairs and 20 tables in Vashi tomorrow."
    )

    assert [item.model_dump() for item in result] == [
        {"category": "furniture", "name": "chair", "quantity": 300},
        {"category": "furniture", "name": "table", "quantity": 20},
    ]


def test_parse_requirement_returns_empty_list_for_no_resources(monkeypatch):
    monkeypatch.setattr(
        parser,
        "_request_completion",
        lambda description: '{"items": []}',
    )

    assert parser.parse_requirement("Can someone transport my equipment?") == []


@pytest.mark.parametrize(
    "content",
    [
        "not json",
        "[{\"category\": \"furniture\", \"name\": \"chair\", \"quantity\": 1}]",
        "{\"result\": []}",
        "{\"items\": [{\"category\": \"invalid\", \"name\": \"chair\", \"quantity\": 1}]}",
        "{\"items\": [{\"category\": \"furniture\", \"name\": \"chair\", \"quantity\": 0}]}",
    ],
)
def test_parse_requirement_rejects_invalid_model_output(monkeypatch, content):
    monkeypatch.setattr(
        parser,
        "_request_completion",
        lambda description: content,
    )

    with pytest.raises(parser.ParserServiceError):
        parser.parse_requirement("I need a chair.")


def test_empty_description_returns_without_calling_groq(monkeypatch):
    def fail_if_called(description):
        raise AssertionError("Groq should not be called for empty input")

    monkeypatch.setattr(parser, "_request_completion", fail_if_called)

    assert parser.parse_requirement("  \n\t") == []


def test_parser_service_failure_is_preserved(monkeypatch):
    def fail_request(description):
        raise parser.ParserServiceError("service unavailable")

    monkeypatch.setattr(parser, "_request_completion", fail_request)

    with pytest.raises(parser.ParserServiceError, match="service unavailable"):
        parser.parse_requirement("I need a chair.")