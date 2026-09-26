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
        "notifications": {
            "notif_001": {
                "notificationId": "notif_001",
                "userId": "user_123",
                "type": "BOOKING_CONFIRMED",
                "title": "Booking Confirmed",
                "message": "Your booking for 250 chairs has been confirmed.",
                "referenceId": "booking_001",
                "read": False,
                "createdAt": "2026-09-26T10:30:00Z"
            }
        },
        "resources": {
            "res_001": {
                "resourceId": "res_001",
                "providerId": "user_123",
                "status": "active"
            }
        },
        "requirements": {
            "req_001": {
                "requirementId": "req_001",
                "seekerId": "user_123",
                "status": "active"
            }
        },
        "requests": {
            "r_001": {
                "requestId": "r_001",
                "providerId": "user_123",
                "status": "pending"
            }
        },
        "bookings": {
            "b_001": {
                "bookingId": "b_001",
                "providerId": "user_123",
                "seekerId": "user_999",
                "driverId": "driver_123",
                "status": "confirmed",
                "resourceAmount": 5000.0,
                "deliveryAmount": 1000.0,
                "escrowStatus": "funded"
            },
            "b_002": {
                "bookingId": "b_002",
                "providerId": "user_123",
                "seekerId": "user_999",
                "driverId": "driver_123",
                "status": "completed",
                "resourceAmount": 10000.0,
                "deliveryAmount": 2000.0,
                "escrowStatus": "released"
            }
        },
        "driverRoutes": {
            "route_001": {
                "routeId": "route_001",
                "driverId": "driver_123",
                "status": "active"
            }
        },
        "deliveryRequests": {
            "del_001": {
                "deliveryRequestId": "del_001",
                "driverId": "driver_123",
                "status": "pending"
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

        def where_fn(field, op, val):
            query_mock = MagicMock()
            def stream_fn():
                results = []
                for k, v in store.get(name, {}).items():
                    if op == "==" and v.get(field) == val:
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
    from transactions import router as transactions_router

    app = FastAPI()
    app.include_router(transactions_router, prefix="/api/v1")
    app.dependency_overrides[get_current_user] = lambda: current_user_payload
    return app


def test_notifications_endpoints(mock_firebase):
    mock_db, store = mock_firebase
    with patch("transactions.notifications.db", mock_db):
        app = create_test_app(mock_db, {"uid": "user_123"})
        client = TestClient(app)

        # GET /notifications
        res = client.get("/api/v1/notifications")
        assert res.status_code == 200
        items = res.json()["data"]
        assert len(items) == 1
        assert items[0]["notificationId"] == "notif_001"
        assert items[0]["read"] is False

        # PATCH /notifications/{id}/read
        res_read = client.patch("/api/v1/notifications/notif_001/read")
        assert res_read.status_code == 200
        assert res_read.json()["data"]["read"] is True
        assert store["notifications"]["notif_001"]["read"] is True


def test_dashboard_user_endpoint(mock_firebase):
    mock_db, store = mock_firebase
    with patch("transactions.dashboard.db", mock_db):
        app = create_test_app(mock_db, {"uid": "user_123"})
        client = TestClient(app)

        res = client.get("/api/v1/dashboard/user")
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["activeResources"] == 1
        assert data["activeRequirements"] == 1
        assert data["pendingRequests"] == 1
        assert data["activeBookings"] == 1
        assert data["completedBookings"] == 1
        assert data["totalEarnings"] == 10000.0
        assert data["pendingPayments"] == 5000.0


def test_dashboard_driver_endpoint(mock_firebase):
    mock_db, store = mock_firebase
    with patch("transactions.dashboard.db", mock_db):
        app = create_test_app(mock_db, {"uid": "driver_123"})
        client = TestClient(app)

        res = client.get("/api/v1/dashboard/driver")
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["activeRoutes"] == 1
        assert data["matchedRequests"] == 1
        assert data["totalEarnings"] == 2000.0
        assert data["pendingPayments"] == 1000.0
