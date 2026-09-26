import sys
import os
from unittest.mock import MagicMock, patch
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Ensure backend directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.auth import get_current_user


@pytest.fixture
def mock_firebase():
    mock_db = MagicMock()
    # Mock collections dictionary to store in-memory documents
    store = {
        "requests": {},
        "bookings": {},
        "escrow": {},
        "notifications": {},
        "resources": {
            "res_123": {
                "resourceId": "res_123",
                "name": "Banquet Chairs",
                "providerId": "provider_456",
                "availableQuantity": 300,
                "price": 20
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

            def update_fn(data):
                col_store = store.setdefault(name, {})
                if d_id not in col_store:
                    raise Exception("Not found")
                col_store[d_id].update(data)
                return True

            doc_mock.get.side_effect = get_fn
            doc_mock.set.side_effect = set_fn
            doc_mock.update.side_effect = update_fn
            return doc_mock

        col_mock.document.side_effect = doc_side_effect

        def where_fn(*args, **kwargs):
            query_mock = MagicMock()
            query_mock.where.return_value = query_mock
            query_mock.order_by.return_value = query_mock
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
        return col_mock

    mock_db.collection.side_effect = collection_side_effect
    return mock_db, store


def create_test_app(mock_db, current_user_payload):
    from transactions.requests import router as requests_router

    app = FastAPI()
    app.include_router(requests_router, prefix="/api/v1")

    app.dependency_overrides[get_current_user] = lambda: current_user_payload
    return app


def test_create_request(mock_firebase):
    mock_db, store = mock_firebase
    with patch("transactions.requests.db", mock_db), patch("transactions.notifications.db", mock_db):
        app = create_test_app(mock_db, {"uid": "seeker_123", "email": "seeker@test.com"})
        client = TestClient(app)

        payload = {
            "requirementId": "req_001",
            "providerId": "provider_456",
            "resourceId": "res_123",
            "requestedQuantity": 50,
            "offeredPrice": 1000.0,
            "message": "Need chairs for conference"
        }

        res = client.post("/api/v1/requests", json=payload)
        assert res.status_code == 201, res.text
        data = res.json()["data"]
        assert data["seekerId"] == "seeker_123"
        assert data["providerId"] == "provider_456"
        assert data["status"] == "pending"
        assert data["offeredPrice"] == 1000.0


def test_counter_request_both_parties_and_revival(mock_firebase):
    mock_db, store = mock_firebase
    with patch("transactions.requests.db", mock_db), patch("transactions.notifications.db", mock_db):
        store["requests"]["req_demo"] = {
            "requestId": "req_demo",
            "seekerId": "seeker_123",
            "providerId": "provider_456",
            "resourceId": "res_123",
            "requestedQuantity": 50,
            "offeredPrice": 1000.0,
            "counterPrice": None,
            "status": "pending"
        }

        # Provider counters
        app_prov = create_test_app(mock_db, {"uid": "provider_456"})
        client_prov = TestClient(app_prov)

        res = client_prov.post("/api/v1/requests/req_demo/counter", json={
            "price": 1200.0,
            "quantity": 50,
            "message": "Best price is 1200"
        })
        assert res.status_code == 200
        assert res.json()["data"]["status"] == "countered"
        assert res.json()["data"]["counterPrice"] == 1200.0

        # Seeker rejects provider counter
        app_seek = create_test_app(mock_db, {"uid": "seeker_123"})
        client_seek = TestClient(app_seek)
        res_rej = client_seek.post("/api/v1/requests/req_demo/reject", json={"reason": "Too high"})
        assert res_rej.status_code == 200
        assert store["requests"]["req_demo"]["status"] == "rejected"

        # Provider revives with another counter offer (Ruling requirement!)
        res_revive = client_prov.post("/api/v1/requests/req_demo/counter", json={
            "price": 1100.0,
            "quantity": 50,
            "message": "How about 1100?"
        })
        assert res_revive.status_code == 200
        assert res_revive.json()["data"]["status"] == "countered"
        assert res_revive.json()["data"]["counterPrice"] == 1100.0


def test_accept_request_creates_booking_and_escrow(mock_firebase):
    mock_db, store = mock_firebase
    with patch("transactions.requests.db", mock_db), patch("transactions.notifications.db", mock_db):
        store["requests"]["req_to_accept"] = {
            "requestId": "req_to_accept",
            "seekerId": "seeker_123",
            "providerId": "provider_456",
            "resourceId": "res_123",
            "requestedQuantity": 50,
            "offeredPrice": 1000.0,
            "counterPrice": 1100.0,
            "status": "countered"
        }

        app_seek = create_test_app(mock_db, {"uid": "seeker_123"})
        client_seek = TestClient(app_seek)

        res = client_seek.post("/api/v1/requests/req_to_accept/accept", json={
            "deliveryAmount": 200.0
        })
        assert res.status_code == 200
        resp_data = res.json()["data"]
        assert resp_data["status"] == "accepted"
        booking_id = resp_data["bookingId"]
        assert booking_id in store["bookings"]

        booking = store["bookings"][booking_id]
        assert booking["quantity"] == 50
        assert booking["resourceAmount"] == 1100.0
        assert booking["deliveryAmount"] == 200.0
        # 20% of 1100 is 220
        assert booking["depositAmount"] == 220.0
        assert booking["totalAmount"] == 1520.0
        assert booking["status"] == "confirmed"

        # Check escrow created
        escrow_items = list(store["escrow"].values())
        assert len(escrow_items) >= 1
        escrow = [e for e in escrow_items if e.get("bookingId") == booking_id][0]
        assert escrow["amount"] == 1520.0
        assert escrow["status"] == "PENDING"
