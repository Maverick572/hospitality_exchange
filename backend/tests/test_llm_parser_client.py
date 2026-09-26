from types import SimpleNamespace

import pytest

import backend.services.llm_parser as parser


class FakeCompletions:
    def __init__(self, content):
        self.content = content
        self.arguments = None

    def create(self, **kwargs):
        self.arguments = kwargs
        return SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content=self.content)
                )
            ]
        )


class FakeClient:
    def __init__(self, content):
        self.chat = SimpleNamespace(
            completions=FakeCompletions(content)
        )


def test_groq_call_uses_strict_json_mode_and_deterministic_temperature(monkeypatch):
    client = FakeClient('{"items": []}')
    monkeypatch.setattr(parser, "_get_client", lambda: client)

    content = parser._request_completion("I need chairs in Vashi tomorrow.")

    arguments = client.chat.completions.arguments
    assert content == '{"items": []}'
    assert arguments["temperature"] == 0.0
    assert arguments["response_format"] == {"type": "json_object"}
    assert arguments["model"] == parser.DEFAULT_MODEL
    assert arguments["messages"][0]["role"] == "system"
    assert arguments["messages"][1] == {
        "role": "user",
        "content": "I need chairs in Vashi tomorrow.",
    }


def test_system_prompt_contains_extraction_guardrails():
    prompt = parser.SYSTEM_PROMPT

    assert '"furniture"' in prompt
    assert '"audio_visual"' in prompt
    assert '"kitchen_equipment"' in prompt
    assert '"event_equipment"' in prompt
    assert '"space"' in prompt
    assert '"other"' in prompt
    assert "location" in prompt.lower()
    assert "delivery" in prompt.lower()
    assert '"items"' in prompt
    assert "default" in prompt.lower()
    assert "zero" in prompt.lower()


def test_client_failure_is_wrapped_without_exposing_credentials(monkeypatch):
    class FailingClient:
        chat = SimpleNamespace(
            completions=SimpleNamespace(
                create=lambda **kwargs: (_ for _ in ()).throw(
                    RuntimeError("api-key=secret-value")
                )
            )
        )

    monkeypatch.setattr(parser, "_get_client", lambda: FailingClient())

    with pytest.raises(parser.ParserServiceError) as error:
        parser._request_completion("I need a chair.")

    assert "secret-value" not in str(error.value)