import sys
import os
import types
from unittest.mock import MagicMock, patch
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Mock core.firebase if credential file does not exist locally
service_account = os.path.join(backend_dir, "firebase-service-account.json")
if not os.path.exists(service_account):
    fake_firebase = types.ModuleType("core.firebase")
    fake_firebase.db = MagicMock()
    fake_firebase.SERVICE_ACCOUNT_FILE = service_account
    sys.modules["core.firebase"] = fake_firebase

from core.auth import get_current_user


@pytest.fixture
def mock_firebase_full():
    mock_db = MagicMock()
    store = {
        "requests": {},
        "bookings": {},
        "escrow": {},
        "conditionEvidence": {},
        "reviews": {},
        "notifications": {},
        "users": {
            "provider_999": {
                "userId": "provider_999",
                "name": "Grand Palace Hotel",
                "rating": 4.0,
                "totalRatings": 2
            },
            "seeker_111": {
                "userId": "seeker_111",
                "name": "Apex Events"
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
                    raise Exception(f"Document {d_id} not found in {name}")
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

        def stream_fn():
            results = []
            for k, v in store.get(name, {}).items():
                snap = MagicMock()
                snap.id = k
                snap.to_dict.return_value = dict(v)
                results.append(snap)
            return results

        col_mock.where.side_effect = where_fn
        col_mock.stream.side_effect = stream_fn
        return col_mock

    mock_db.collection.side_effect = collection_side_effect
    return mock_db, store


def test_full_transaction_lifecycle_end_to_end(mock_firebase_full):
    mock_db, store = mock_firebase_full

    current_auth = {"uid": "seeker_111", "email": "seeker@apex.com"}

    # Import the combined transaction router
    with patch("transactions.requests.db", mock_db), \
         patch("transactions.bookings.db", mock_db), \
         patch("transactions.escrow.db", mock_db), \
         patch("transactions.evidence.db", mock_db), \
         patch("transactions.reviews.db", mock_db), \
         patch("transactions.notifications.db", mock_db):

        from transactions import router as transactions_router

        app = FastAPI()
        app.include_router(transactions_router, prefix="/api/v1")
        app.dependency_overrides[get_current_user] = lambda: current_auth

        client = TestClient(app)

        # -----------------------------------------------------------------
        # STEP 1: Seeker posts a resource request
        # -----------------------------------------------------------------
        current_auth["uid"] = "seeker_111"
        res1 = client.post("/api/v1/requests", json={
            "providerId": "provider_999",
            "resourceId": "res_banquet_tables",
            "requestedQuantity": 20,
            "offeredPrice": 4000.0,
            "message": "Need 20 tables for wedding."
        })
        assert res1.status_code == 201, res1.text
        req_data = res1.json()["data"]
        request_id = req_data["requestId"]
        assert req_data["status"] == "pending"
        assert req_data["offeredPrice"] == 4000.0

        # -----------------------------------------------------------------
        # STEP 2: Provider checks requests & makes a counter-offer
        # -----------------------------------------------------------------
        current_auth["uid"] = "provider_999"
        res_list = client.get("/api/v1/requests/provider?status=pending")
        assert res_list.status_code == 200
        assert any(r["requestId"] == request_id for r in res_list.json()["data"])

        res_counter = client.post(f"/api/v1/requests/{request_id}/counter", json={
            "price": 4500.0,
            "quantity": 20,
            "message": "We can do 20 tables for ₹4,500."
        })
        assert res_counter.status_code == 200
        assert res_counter.json()["data"]["status"] == "countered"
        assert res_counter.json()["data"]["counterPrice"] == 4500.0

        # -----------------------------------------------------------------
        # STEP 3: Seeker accepts the offer -> creates Booking and Escrow
        # -----------------------------------------------------------------
        current_auth["uid"] = "seeker_111"
        res_accept = client.post(f"/api/v1/requests/{request_id}/accept", json={
            "deliveryAmount": 500.0,
            "pickupLocation": {"address": "Vashi"},
            "deliveryLocation": {"address": "Belapur"}
        })
        assert res_accept.status_code == 200
        accept_data = res_accept.json()["data"]
        assert accept_data["status"] == "accepted"
        booking_id = accept_data["bookingId"]

        # Verify booking amounts:
        # resource: 4500, delivery: 500, deposit: 20% of 4500 = 900. Total = 5900.
        booking = store["bookings"][booking_id]
        assert booking["resourceAmount"] == 4500.0
        assert booking["deliveryAmount"] == 500.0
        assert booking["depositAmount"] == 900.0
        assert booking["totalAmount"] == 5900.0
        assert booking["status"] == "confirmed"
        assert booking["escrowStatus"] == "pending"
        escrow_id = booking["escrowId"]

        # -----------------------------------------------------------------
        # STEP 4: Seeker views booking details
        # -----------------------------------------------------------------
        res_bdetail = client.get(f"/api/v1/bookings/{booking_id}")
        assert res_bdetail.status_code == 200
        assert res_bdetail.json()["data"]["bookingId"] == booking_id

        # -----------------------------------------------------------------
        # STEP 5: Seeker funds the escrow
        # -----------------------------------------------------------------
        res_fund = client.post(f"/api/v1/escrow/{escrow_id}/fund", json={
            "paymentReference": "pay_full_flow_123"
        })
        assert res_fund.status_code == 200
        assert res_fund.json()["data"]["status"] == "funded"
        assert store["bookings"][booking_id]["escrowStatus"] == "funded"

        # -----------------------------------------------------------------
        # STEP 6: Provider / Driver records condition evidence at pickup
        # -----------------------------------------------------------------
        current_auth["uid"] = "provider_999"
        res_ev = client.post("/api/v1/condition-evidence", json={
            "bookingId": booking_id,
            "stage": "PICKUP",
            "type": "resource_condition",
            "imageUrl": "https://storage.googleapis.com/test-bucket/tables_pickup.png",
            "description": "20 tables in flawless condition."
        })
        assert res_ev.status_code == 201
        ev_id = res_ev.json()["data"]["evidenceId"]
        assert ev_id in store["conditionEvidence"]

        # -----------------------------------------------------------------
        # STEP 7: Seeker confirms receipt of delivery
        # -----------------------------------------------------------------
        current_auth["uid"] = "seeker_111"
        res_receipt = client.post(f"/api/v1/bookings/{booking_id}/confirm-receipt", json={
            "received": True,
            "conditionConfirmed": True
        })
        assert res_receipt.status_code == 200
        assert res_receipt.json()["data"]["status"] == "delivered"
        assert store["bookings"][booking_id]["status"] == "delivered"

        # -----------------------------------------------------------------
        # STEP 8: Release escrow (Full release, 0 penalty)
        # -----------------------------------------------------------------
        res_release = client.post(f"/api/v1/escrow/{escrow_id}/release", json={
            "bookingId": booking_id,
            "conditionConfirmed": True,
            "penaltyAmount": 0.0
        })
        assert res_release.status_code == 200
        rel_data = res_release.json()["data"]
        assert rel_data["status"] == "released"
        assert rel_data["providerAmount"] == 4500.0
        assert rel_data["driverAmount"] == 500.0
        assert rel_data["depositReturned"] == 900.0
        assert store["bookings"][booking_id]["status"] == "completed"

        # -----------------------------------------------------------------
        # STEP 9: Seeker posts review for provider
        # -----------------------------------------------------------------
        # Initial: rating 4.0, totalRatings 2.
        # After 5-star review: (4.0*2 + 5)/3 = 13/3 = 4.33
        res_rev = client.post("/api/v1/reviews", json={
            "bookingId": booking_id,
            "providerId": "provider_999",
            "rating": 5,
            "comment": "Tables were clean and sturdy. Highly recommend!"
        })
        assert res_rev.status_code == 201
        provider_record = store["users"]["provider_999"]
        assert provider_record["totalRatings"] == 3
        assert provider_record["rating"] == 4.33

        # -----------------------------------------------------------------
        # STEP 10: Check provider profile reviews
        # -----------------------------------------------------------------
        res_prov_revs = client.get("/api/v1/users/provider_999/reviews")
        assert res_prov_revs.status_code == 200
        reviews_data = res_prov_revs.json()["data"]
        assert reviews_data["rating"] == 4.33
        assert reviews_data["totalRatings"] == 3
        assert len(reviews_data["reviews"]) >= 1
