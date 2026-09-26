import sys
import os
from unittest.mock import MagicMock, patch
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from seeker.distance import haversine_distance, extract_coordinates
from seeker.search import search_seeker_products
from seeker.router import router as seeker_router
from services.llm_parser import ParsedItem, ResourceCategory


def test_distance_calculation():
    # Vashi (19.0760, 72.8777) to Thane (19.2183, 72.9781) is roughly 19 km
    dist = haversine_distance(19.0760, 72.8777, 19.2183, 72.9781)
    assert 15.0 <= dist <= 22.0

    # Same location distance is 0.0
    assert haversine_distance(19.0760, 72.8777, 19.0760, 72.8777) == 0.0

    # Missing coordinates returns 0.0
    assert haversine_distance(None, 72.8777, 19.0760, None) == 0.0

    # Coordinate extraction
    lat, lng = extract_coordinates({"latitude": 19.0760, "longitude": 72.8777})
    assert lat == 19.0760 and lng == 72.8777

    lat2, lng2 = extract_coordinates({"lat": 19.0760, "lon": 72.8777})
    assert lat2 == 19.0760 and lng2 == 72.8777


@pytest.fixture
def mock_firestore():
    mock_db = MagicMock()

    store = {
        "users": {
            "provider_near": {
                "userId": "provider_near",
                "name": "Nearby Hotel",
                "businessName": "Nearby Hotel & Banquets",
                "rating": 4.8,
                "location": {
                    "address": "Vashi, Navi Mumbai",
                    "latitude": 19.0760,
                    "longitude": 72.8777
                }
            },
            "provider_far": {
                "userId": "provider_far",
                "name": "Far Hotel",
                "businessName": "Faraway Resort",
                "rating": 4.5,
                "location": {
                    "address": "Panvel",
                    "latitude": 18.9894,
                    "longitude": 73.1175
                }
            }
        },
        "resources": {
            "res_high_avail_cheap_near": {
                "resourceId": "res_high_avail_cheap_near",
                "providerId": "provider_near",
                "name": "Banquet Chairs",
                "category": "banquet_seating",
                "description": "Premium comfortable banquet chairs",
                "quantity": 500,
                "availableQuantity": 500,
                "price": 15.0,
                "status": "active"
            },
            "res_high_avail_expensive_near": {
                "resourceId": "res_high_avail_expensive_near",
                "providerId": "provider_near",
                "name": "Banquet Chairs",
                "category": "banquet_seating",
                "description": "Luxury gold banquet chairs",
                "quantity": 500,
                "availableQuantity": 500,
                "price": 30.0,
                "status": "active"
            },
            "res_high_avail_cheap_far": {
                "resourceId": "res_high_avail_cheap_far",
                "providerId": "provider_far",
                "name": "Banquet Chairs",
                "category": "banquet_seating",
                "description": "Standard banquet chairs",
                "quantity": 500,
                "availableQuantity": 500,
                "price": 15.0,
                "status": "active"
            },
            "res_low_avail": {
                "resourceId": "res_low_avail",
                "providerId": "provider_near",
                "name": "Banquet Chairs",
                "category": "banquet_seating",
                "description": "Only a few banquet chairs",
                "quantity": 10,
                "availableQuantity": 10,
                "price": 10.0,  # Cheaper, but insufficient availability for 100 chairs
                "status": "active"
            }
        }
    }

    def collection_side_effect(name):
        col_mock = MagicMock()

        def doc_side_effect(doc_id):
            doc_mock = MagicMock()
            doc_mock.id = doc_id
            snap = MagicMock()
            if doc_id in store.get(name, {}):
                snap.exists = True
                snap.to_dict.return_value = dict(store[name][doc_id])
            else:
                snap.exists = False
                snap.to_dict.return_value = None
            doc_mock.get.return_value = snap
            return doc_mock

        col_mock.document.side_effect = doc_side_effect

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
    return mock_db


def test_seeker_search_ranking_order(mock_firestore):
    """
    Verify results are sorted by:
    1. Best availability (highest availability score)
    2. Lowest price (cheapest first)
    3. Nearest location (closest distance in km first)
    """
    mock_parsed_items = [
        ParsedItem(category=ResourceCategory.BANQUET_SEATING, name="chair", quantity=100, metric="units")
    ]

    with patch("seeker.search.parse_requirement", return_value=mock_parsed_items):
        seeker_loc = {"latitude": 19.0760, "longitude": 72.8777}  # Vashi

        res = search_seeker_products(
            description="I need 100 banquet chairs for tomorrow",
            from_timestamp="2026-09-28T10:00:00Z",
            to_timestamp="2026-09-28T22:00:00Z",
            seeker_location=seeker_loc,
            firestore_db=mock_firestore
        )

        assert res["totalMatches"] >= 4
        products = res["products"]

        # 1st item should have high availability, cheapest price, and nearest distance
        assert products[0]["resourceId"] == "res_high_avail_cheap_near"
        assert products[0]["price"] == 15.0
        assert products[0]["distanceKm"] == 0.0

        # 2nd item between res_high_avail_cheap_far (dist > 0, price 15) vs res_high_avail_expensive_near (dist 0, price 30)
        # Price is evaluated before distance when availability is equal
        assert products[1]["resourceId"] == "res_high_avail_cheap_far"
        assert products[1]["price"] == 15.0
        assert products[1]["distanceKm"] > 0.0

        assert products[2]["resourceId"] == "res_high_avail_expensive_near"
        assert products[2]["price"] == 30.0

        # Low availability item (10 chairs < 100 chairs) ranks last despite low price
        assert products[-1]["resourceId"] == "res_low_avail"
        assert products[-1]["availableQuantity"] == 10


def test_seeker_router_endpoint(mock_firestore):
    app = FastAPI()
    app.include_router(seeker_router, prefix="/api/v1")
    client = TestClient(app)

    mock_parsed_items = [
        ParsedItem(category=ResourceCategory.BANQUET_SEATING, name="chair", quantity=50, metric="units")
    ]

    with patch("seeker.search.parse_requirement", return_value=mock_parsed_items), \
         patch("seeker.search.db", mock_firestore):
        payload = {
            "description": "Need 50 chairs for conference",
            "fromTimestamp": "2026-09-28T09:00:00Z",
            "toTimestamp": "2026-09-28T18:00:00Z",
            "location": {
                "address": "Vashi",
                "latitude": 19.0760,
                "longitude": 72.8777
            }
        }

        response = client.post("/api/v1/seeker/search", json=payload)
        assert response.status_code == 200
        data = response.json()["data"]
        assert "products" in data
        assert len(data["products"]) > 0
        assert data["description"] == payload["description"]
        assert data["fromTimestamp"] == payload["fromTimestamp"]
        assert data["toTimestamp"] == payload["toTimestamp"]
        assert "parsedItems" in data
        assert data["parsedItems"][0]["name"] == "chair"
