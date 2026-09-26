import backend.services.llm_parser as parser


def test_parser_output_is_firestore_compatible(monkeypatch):
    monkeypatch.setattr(
        parser,
        "_request_completion",
        lambda description: (
            '{"items": [{"category": "banquet_seating", '
            '"name": "chair", "quantity": 300}]}'
        ),
    )

    items = parser.parse_requirement("I need 300 chairs.")
    serialized = [item.model_dump(mode="json") for item in items]

    assert serialized == [
        {"category": "banquet_seating", "name": "chair", "quantity": 300, "metric": "units"}
    ]
    assert set(serialized[0]) == {"category", "name", "quantity", "metric"}