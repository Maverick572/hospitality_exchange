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
        "bookings": {
            "booking_001": {
                "bookingId": "booking_001",
                "seekerId": "seeker_123",
                "providerId": "provider_456",
                "driverId": "driver_789",
                "resourceId": "res_123",
                "quantity": 100,
                "resourceAmount": 2000.0,
                "deliveryAmount": 500.0,
                "depositAmount": 400.0,
                "totalAmount": 2900.0,
                "status": "in_transit",
                "escrowStatus": "in_transit"
            },
            "booking_002": {
                "bookingId": "booking_002",
                "seekerId": "other_seeker",
                "providerId": "other_provider",
                "driverId": None,
                "status": "confirmed",
                "escrowStatus": "pending"
            }
        },
        "escrow": {
            "escrow_001": {
                "escrowId": "escrow_001",
                "bookingId": "booking_001",
                "status": "IN_TRANSIT"
            }
        },
        "notifications": {}
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

            def update_fn(data):
                col_store = store.setdefault(name, {})
                if d_id not in col_store:
                    raise Exception("Not found")
                col_store[d_id].update(data)
                return True

            doc_mock.get.side_effect = get_fn
            doc_mock.update.side_effect = update_fn
            return doc_mock

        col_mock.document.side_effect = doc_side_effect

        def where_fn(*args, **kwargs):
            query_mock = MagicMock()
            query_mock.where.return_value = query_mock
            def stream_fn():
                results = []
                for k, v in store.get(name, {}).items():
                    snap = MagicMock()
                    snap.id = k
                    snap.to_dict.return_value = dict(v)
                    results.append(snap)
                return results
            query_mock.stream.side_effect = stream_fn
            return query_mock

        col_mock.where.side_effect = where_fn

        def stream_fn():
            results = []
            for k, v in store.get(name, {}).items():
                snap = MagicMock()
                snap.id = k
                snap.to_dict.return_value = dict(v)
                results.append(snap)
            return results

        col_mock.stream.side_effect = stream_fn
        return col_mock

    mock_db.collection.side_effect = collection_side_effect
    return mock_db, store


def create_test_app(mock_db, current_user_payload):
    from transactions.bookings import router as bookings_router

    app = FastAPI()
    app.include_router(bookings_router, prefix="/api/v1")
    app.dependency_overrides[get_current_user] = lambda: current_user_payload
    return app


def test_get_my_bookings(mock_firebase):
    mock_db, store = mock_firebase
    with patch("transactions.bookings.db", mock_db):
        app = create_test_app(mock_db, {"uid": "seeker_123"})
        client = TestClient(app)

        res = client.get("/api/v1/bookings/my")
        assert res.status_code == 200
        items = res.json()["data"]
        # seeker_123 should see booking_001
        assert any(b["bookingId"] == "booking_001" for b in items)
        # seeker_123 should not see booking_002
        assert not any(b["bookingId"] == "booking_002" for b in items)


def test_get_booking_detail_and_authorization(mock_firebase):
    mock_db, store = mock_firebase
    with patch("transactions.bookings.db", mock_db):
        # Participant can view
        app_seeker = create_test_app(mock_db, {"uid": "seeker_123"})
        client_seeker = TestClient(app_seeker)
        res_ok = client_seeker.get("/api/v1/bookings/booking_001")
        assert res_ok.status_code == 200
        assert res_ok.json()["data"]["bookingId"] == "booking_001"

        # Non-participant receives 403 Forbidden (Review Focus #5)
        app_stranger = create_test_app(mock_db, {"uid": "random_stranger"})
        client_stranger = TestClient(app_stranger)
        res_forbidden = client_stranger.get("/api/v1/bookings/booking_001")
        assert res_forbidden.status_code == 403


def test_confirm_receipt(mock_firebase):
    mock_db, store = mock_firebase
    with patch("transactions.bookings.db", mock_db), patch("transactions.notifications.db", mock_db):
        # Only seeker can confirm receipt
        app_prov = create_test_app(mock_db, {"uid": "provider_456"})
        client_prov = TestClient(app_prov)
        res_fail = client_prov.post("/api/v1/bookings/booking_001/confirm-receipt", json={"received": True, "conditionConfirmed": True})
        assert res_fail.status_code == 403

        # Seeker confirms receipt
        app_seeker = create_test_app(mock_db, {"uid": "seeker_123"})
        client_seeker = TestClient(app_seeker)
        res_ok = client_seeker.post("/api/v1/bookings/booking_001/confirm-receipt", json={"received": True, "conditionConfirmed": True})
        assert res_ok.status_code == 200
        data = res_ok.json()["data"]
        assert data["status"] == "delivered"
        assert data["escrowStatus"] == "pending_release"
        assert store["bookings"]["booking_001"]["status"] == "delivered"
