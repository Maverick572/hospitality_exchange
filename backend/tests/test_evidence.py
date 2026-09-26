import sys
import os
from unittest.mock import MagicMock, patch
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.auth import get_current_user


@pytest.fixture
def mock_firebase():
    mock_db = MagicMock()
    store = {
        "conditionEvidence": {},
        "bookings": {
            "booking_001": {
                "bookingId": "booking_001",
                "seekerId": "seeker_123",
                "providerId": "provider_456"
            }
        }
    }

    def collection_side_effect(name):
        col_mock = MagicMock()
        
        def doc_side_effect(doc_id=None):
            d_id = doc_id or f"gen_{len(store.get(name, {})) + 1}"
            doc_mock = MagicMock()
            doc_mock.id = d_id

            def get_fn():
                snap = MagicMock()
                col_store = store.setdefault(name, {})
                if d_id in col_store:
                    snap.exists = True
                    snap.to_dict.return_value = dict(col_store[d_id])
                else:
                    snap.exists = False
                    snap.to_dict.return_value = None
                return snap

            def set_fn(data, merge=False):
                col_store = store.setdefault(name, {})
                if merge and d_id in col_store:
                    col_store[d_id].update(data)
                else:
                    col_store[d_id] = dict(data)
                return True

            doc_mock.get.side_effect = get_fn
            doc_mock.set.side_effect = set_fn
            return doc_mock

        col_mock.document.side_effect = doc_side_effect
        return col_mock

    mock_db.collection.side_effect = collection_side_effect
    return mock_db, store


def create_test_app(mock_db, current_user_payload):
    from transactions.evidence import router as evidence_router

    app = FastAPI()
    app.include_router(evidence_router, prefix="/api/v1")
    app.dependency_overrides[get_current_user] = lambda: current_user_payload
    return app


def test_record_condition_evidence(mock_firebase):
    mock_db, store = mock_firebase
    with patch("transactions.evidence.db", mock_db):
        app = create_test_app(mock_db, {"uid": "driver_789"})
        client = TestClient(app)

        payload = {
            "bookingId": "booking_001",
            "stage": "PICKUP",
            "type": "resource_condition",
            "imageUrl": "https://storage.googleapis.com/bucket/chairs_pickup.jpg",
            "description": "All 250 chairs in excellent condition."
        }

        res = client.post("/api/v1/condition-evidence", json=payload)
        assert res.status_code == 201
        data = res.json()["data"]
        evidence_id = data["evidenceId"]
        assert data["stage"] == "PICKUP"
        assert data["imageUrl"] == payload["imageUrl"]
        assert evidence_id in store["conditionEvidence"]
        assert store["conditionEvidence"][evidence_id]["uploadedBy"] == "driver_789"


def test_condition_evidence_validation(mock_firebase):
    mock_db, store = mock_firebase
    with patch("transactions.evidence.db", mock_db):
        app = create_test_app(mock_db, {"uid": "driver_789"})
        client = TestClient(app)

        # Invalid stage
        res_bad_stage = client.post("/api/v1/condition-evidence", json={
            "bookingId": "booking_001",
            "stage": "INVALID_STAGE",
            "imageUrl": "https://..."
        })
        assert res_bad_stage.status_code == 400

        # Missing imageUrl
        res_no_img = client.post("/api/v1/condition-evidence", json={
            "bookingId": "booking_001",
            "stage": "PICKUP"
        })
        assert res_no_img.status_code == 400
