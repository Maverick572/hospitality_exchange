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
        "reviews": {},
        "bookings": {
            "booking_001": {
                "bookingId": "booking_001",
                "seekerId": "seeker_123",
                "providerId": "provider_456",
                "status": "completed"
            }
        },
        "users": {
            "provider_456": {
                "userId": "provider_456",
                "name": "Hotel ABC",
                "rating": 4.0,
                "totalRatings": 1
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
    from transactions.reviews import router as reviews_router

    app = FastAPI()
    app.include_router(reviews_router, prefix="/api/v1")
    app.dependency_overrides[get_current_user] = lambda: current_user_payload
    return app


def test_submit_review_and_update_aggregate_rating(mock_firebase):
    mock_db, store = mock_firebase
    with patch("transactions.reviews.db", mock_db), patch("transactions.notifications.db", mock_db):
        app = create_test_app(mock_db, {"uid": "seeker_123"})
        client = TestClient(app)

        payload = {
            "bookingId": "booking_001",
            "providerId": "provider_456",
            "rating": 5,
            "comment": "Outstanding service and resources!"
        }

        res = client.post("/api/v1/reviews", json=payload)
        assert res.status_code == 201
        data = res.json()["data"]
        assert data["rating"] == 5
        assert data["providerId"] == "provider_456"

        # Check atomic update to provider rating:
        # Initial: rating 4.0, totalRatings 1.
        # After new rating of 5: totalRatings = 2, rating = (4.0*1 + 5)/2 = 4.5
        provider = store["users"]["provider_456"]
        assert provider["totalRatings"] == 2
        assert provider["rating"] == 4.5


def test_duplicate_review_prevention(mock_firebase):
    mock_db, store = mock_firebase
    with patch("transactions.reviews.db", mock_db), patch("transactions.notifications.db", mock_db):
        app = create_test_app(mock_db, {"uid": "seeker_123"})
        client = TestClient(app)

        payload = {
            "bookingId": "booking_001",
            "providerId": "provider_456",
            "rating": 5,
            "comment": "First review"
        }

        res1 = client.post("/api/v1/reviews", json=payload)
        assert res1.status_code == 201

        # Second review for same booking by same seeker must fail with 409 Conflict (Review Focus #4)
        res2 = client.post("/api/v1/reviews", json=payload)
        assert res2.status_code == 409


def test_get_provider_reviews(mock_firebase):
    mock_db, store = mock_firebase
    with patch("transactions.reviews.db", mock_db):
        store["reviews"]["rev_1"] = {
            "reviewId": "rev_1",
            "providerId": "provider_456",
            "rating": 5,
            "comment": "Great chairs",
            "reviewerName": "Seeker XYZ",
            "createdAt": "2026-09-26T12:00:00Z"
        }

        app = create_test_app(mock_db, {"uid": "any_user"})
        client = TestClient(app)

        res = client.get("/api/v1/users/provider_456/reviews")
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["rating"] == 4.0
        assert data["totalRatings"] == 1
        assert len(data["reviews"]) == 1
        assert data["reviews"][0]["comment"] == "Great chairs"
