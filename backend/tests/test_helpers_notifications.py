import sys
import os
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

# Ensure backend directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from transactions.helpers import serialize_firestore_doc, standard_response


def test_serialize_firestore_doc():
    dt = datetime(2026, 9, 26, 12, 0, 0, tzinfo=timezone.utc)
    raw = {
        "id": "123",
        "createdAt": dt,
        "nested": {"updatedAt": dt, "count": 5},
        "items": [dt, "text"]
    }
    serialized = serialize_firestore_doc(raw)
    assert serialized["createdAt"] == "2026-09-26T12:00:00+00:00"
    assert serialized["nested"]["updatedAt"] == "2026-09-26T12:00:00+00:00"
    assert serialized["items"][0] == "2026-09-26T12:00:00+00:00"


def test_standard_response():
    resp = standard_response(data={"key": "val"}, message="Success")
    assert resp["success"] is True
    assert resp["data"] == {"key": "val"}
    assert resp["message"] == "Success"


def test_emit_notification():
    import transactions.notifications as notif_module
    mock_db = MagicMock()
    mock_doc_ref = MagicMock()
    mock_doc_ref.id = "notif_mock_123"
    mock_db.collection.return_value.document.return_value = mock_doc_ref

    with patch.object(notif_module, "db", mock_db):
        notif_id = notif_module.emit_notification(
            user_id="user_123",
            type="booking_confirmed",
            title="Booking Confirmed",
            message="Your booking has been confirmed.",
            reference_id="booking_001"
        )

        assert notif_id.startswith("notif_")
        mock_db.collection.assert_called_with("notifications")
        mock_doc_ref.set.assert_called_once()
        saved_data = mock_doc_ref.set.call_args[0][0]
        assert saved_data["userId"] == "user_123"
        assert saved_data["type"] == "booking_confirmed"
        assert saved_data["title"] == "Booking Confirmed"
        assert saved_data["read"] is False
        assert saved_data["referenceId"] == "booking_001"
