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
                "resourceAmount": 5000.0,
                "deliveryAmount": 1200.0,
                "depositAmount": 2000.0,
                "totalAmount": 8200.0,
                "status": "confirmed",
                "escrowStatus": "pending"
            }
        },
        "escrow": {},
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
        return col_mock

    mock_db.collection.side_effect = collection_side_effect
    return mock_db, store


def create_test_app(mock_db, current_user_payload):
    from transactions.escrow import router as escrow_router

    app = FastAPI()
    app.include_router(escrow_router, prefix="/api/v1")
    app.dependency_overrides[get_current_user] = lambda: current_user_payload
    return app


def test_create_and_fund_escrow(mock_firebase):
    mock_db, store = mock_firebase
    with patch("transactions.escrow.db", mock_db), patch("transactions.notifications.db", mock_db):
        app = create_test_app(mock_db, {"uid": "seeker_123"})
        client = TestClient(app)

        # 1. Create escrow
        res_create = client.post("/api/v1/escrow", json={"bookingId": "booking_001"})
        assert res_create.status_code == 201 or res_create.status_code == 200
        data = res_create.json()["data"]
        escrow_id = data["escrowId"]
        assert data["amount"] == 8200.0
        assert data["status"] == "pending"

        # 2. Fund escrow
        res_fund = client.post(f"/api/v1/escrow/{escrow_id}/fund", json={"paymentReference": "pay_test_999"})
        assert res_fund.status_code == 200
        fund_data = res_fund.json()["data"]
        assert fund_data["status"] == "funded"
        assert store["escrow"][escrow_id]["status"] == "FUNDED"
        assert store["bookings"]["booking_001"]["escrowStatus"] == "funded"


def test_release_escrow_split_and_penalty_overflow(mock_firebase):
    mock_db, store = mock_firebase
    with patch("transactions.escrow.db", mock_db), patch("transactions.notifications.db", mock_db):
        store["escrow"]["escrow_001"] = {
            "escrowId": "escrow_001",
            "bookingId": "booking_001",
            "seekerId": "seeker_123",
            "providerId": "provider_456",
            "driverId": "driver_789",
            "amount": 8200.0,
            "depositAmount": 2000.0,
            "penaltyAmount": 0.0,
            "providerAmount": 5000.0,
            "driverAmount": 1200.0,
            "status": "DELIVERED"
        }

        app = create_test_app(mock_db, {"uid": "seeker_123"})
        client = TestClient(app)

        # Penalty with overflow: penalty claimed is 2500, but deposit is only 2000! (Review Focus #3)
        res_rel = client.post("/api/v1/escrow/escrow_001/release", json={
            "bookingId": "booking_001",
            "conditionConfirmed": True,
            "penaltyAmount": 2500.0
        })
        assert res_rel.status_code == 200
        rel_data = res_rel.json()["data"]
        assert rel_data["status"] == "released"
        # Penalty clamped to 2000:
        # providerAmount = 5000 + 2000 = 7000
        assert rel_data["providerAmount"] == 7000.0
        assert rel_data["driverAmount"] == 1200.0
        # depositReturned = 2000 - 2000 = 0.0 (no negative)
        assert rel_data["depositReturned"] == 0.0

        # Booking status updated to completed
        assert store["bookings"]["booking_001"]["status"] == "completed"

        # Double-release guard: second call must fail (Review Focus #2)
        res_double = client.post("/api/v1/escrow/escrow_001/release", json={})
        assert res_double.status_code == 400
