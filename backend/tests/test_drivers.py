import pytest
from unittest.mock import MagicMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
from datetime import datetime, timezone

from unittest.mock import MagicMock, patch

# Prevent firestore.client() from failing during import if Firebase is uninitialized
with patch("firebase_admin.firestore.client", return_value=MagicMock()):
    from drivers import router
from core.auth import get_current_user

app = FastAPI()
app.include_router(router)

client = TestClient(app)

# Test user fixtures
TEST_USER = {
    "uid": "driver_test_123",
    "email": "driver@example.com"
}

@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user] = lambda: TEST_USER
    yield
    app.dependency_overrides.clear()

class MockDocumentSnapshot:
    def __init__(self, exists: bool, data: dict = None):
        self._exists = exists
        self._data = data or {}

    @property
    def exists(self):
        return self._exists

    def to_dict(self):
        return self._data

class MockDocumentReference:
    def __init__(self, storage: dict, doc_id: str):
        self.storage = storage
        self.doc_id = doc_id

    def get(self):
        if self.doc_id in self.storage:
            return MockDocumentSnapshot(True, self.storage[self.doc_id])
        return MockDocumentSnapshot(False)

    def set(self, data: dict):
        self.storage[self.doc_id] = data

class MockCollection:
    def __init__(self, storage: dict):
        self.storage = storage

    def document(self, doc_id: str):
        return MockDocumentReference(self.storage, doc_id)

class MockFirestoreClient:
    def __init__(self):
        self.collections = {}

    def collection(self, name: str):
        if name not in self.collections:
            self.collections[name] = {}
        return MockCollection(self.collections[name])

@pytest.fixture
def mock_db():
    fake_client = MockFirestoreClient()
    with patch("drivers.db", fake_client):
        yield fake_client

def test_create_driver_profile_success(mock_db):
    payload = {
        "name": "Rahul Sharma",
        "phone": "+919876543210",
        "vehicleType": "Tata Ace",
        "vehicleNumber": "MH04AB1234",
        "capacity": 750,
        "licenseNumber": "MH0420210012345"
    }

    response = client.post("/drivers/profile", json=payload)

    # Must return 201 Created
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["success"] is True

    profile = res_data["data"]
    assert profile["driverId"] == "driver_test_123"
    assert profile["name"] == "Rahul Sharma"
    assert profile["phone"] == "+919876543210"
    assert profile["vehicleType"] == "Tata Ace"
    assert profile["vehicleNumber"] == "MH04AB1234"
    assert profile["capacity"] == 750
    assert profile["licenseNumber"] == "MH0420210012345"
    # Future-proof verification status
    assert profile["verificationStatus"] == "unverified"
    assert profile["rating"] == 0
    assert profile["totalRatings"] == 0
    assert profile["status"] == "active"

def test_create_driver_profile_validation_rejects_invalid_data(mock_db):
    # Invalid capacity <= 0 and missing required fields
    invalid_payload = {
        "name": "",
        "capacity": -10
    }

    response = client.post("/drivers/profile", json=invalid_payload)
    # Must return 422 Unprocessable Entity for schema validation failure
    assert response.status_code == 422

def test_create_driver_profile_duplicate_conflict(mock_db):
    # Seed existing profile
    mock_db.collection("drivers").document("driver_test_123").set({
        "name": "Existing Driver",
        "status": "active"
    })

    payload = {
        "name": "Rahul Sharma",
        "phone": "+919876543210",
        "vehicleType": "Tata Ace",
        "vehicleNumber": "MH04AB1234",
        "capacity": 750
    }

    response = client.post("/drivers/profile", json=payload)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()

def test_get_current_driver_profile_success(mock_db):
    now_iso = datetime.now(timezone.utc).isoformat()
    mock_db.collection("drivers").document("driver_test_123").set({
        "name": "Rahul Sharma",
        "email": "driver@example.com",
        "phone": "+919876543210",
        "vehicleType": "Tata Ace",
        "vehicleNumber": "MH04AB1234",
        "capacity": 750,
        "licenseNumber": "MH0420210012345",
        "verificationStatus": "unverified",
        "rating": 0,
        "totalRatings": 0,
        "status": "active",
        "createdAt": now_iso,
        "updatedAt": now_iso
    })

    response = client.get("/drivers/me")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["data"]["driverId"] == "driver_test_123"
    assert res_data["data"]["verificationStatus"] == "unverified"
    assert res_data["data"]["licenseNumber"] == "MH0420210012345"

def test_get_current_driver_profile_not_found(mock_db):
    response = client.get("/drivers/me")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_get_driver_auth_status_new_user(mock_db):
    response = client.get("/drivers/auth/status")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["data"]["uid"] == "driver_test_123"
    assert res_data["data"]["hasDriverProfile"] is False
    assert res_data["data"]["verificationStatus"] is None

def test_get_driver_auth_status_existing_driver(mock_db):
    mock_db.collection("drivers").document("driver_test_123").set({
        "name": "Rahul Sharma",
        "verificationStatus": "unverified",
        "status": "active"
    })

    response = client.get("/drivers/auth/status")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["data"]["uid"] == "driver_test_123"
    assert res_data["data"]["hasDriverProfile"] is True
    assert res_data["data"]["verificationStatus"] == "unverified"

def test_create_driver_profile_sets_firebase_custom_claim(mock_db):
    payload = {
        "name": "Rahul Sharma",
        "phone": "+919876543210",
        "vehicleType": "Tata Ace",
        "vehicleNumber": "MH04AB1234",
        "capacity": 750
    }

    with patch("firebase_admin.auth.set_custom_user_claims") as mock_set_claims:
        response = client.post("/drivers/profile", json=payload)
        assert response.status_code == 201
        mock_set_claims.assert_called_once_with("driver_test_123", {"role": "driver"})

