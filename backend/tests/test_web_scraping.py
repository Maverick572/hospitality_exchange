"""Tests for weather web scraping module and endpoints."""

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from main import app
from web_scraping import (
    scrape_weather_data,
    scrape_reddit_weather,
    RedditApiClient,
    scrape_social_weather,
    get_live_weather,
    analyze_weather_reports,
)

client = TestClient(app)


def test_reddit_api_client_unconfigured():
    """Verify RedditApiClient behavior when credentials are not configured."""
    api = RedditApiClient(client_id="", client_secret="")
    assert api.is_configured is False
    assert api._get_access_token() is None
    assert api.search_weather("Miami") == []


def test_reddit_api_client_mock_oauth():
    """Verify RedditApiClient OAuth flow and authenticated search mapping."""
    api = RedditApiClient(
        client_id="dummy_id",
        client_secret="dummy_secret",
        user_agent="TestApp/1.0",
    )
    assert api.is_configured is True

    mock_auth_resp = MagicMock()
    mock_auth_resp.status_code = 200
    mock_auth_resp.json.return_value = {"access_token": "mock_token_123", "expires_in": 3600}

    mock_search_resp = MagicMock()
    mock_search_resp.status_code = 200
    mock_search_resp.json.return_value = {
        "data": {
            "children": [
                {
                    "data": {
                        "title": "Heavy rain and flood alerts in downtown",
                        "selftext": "Water levels rising quickly.",
                        "author": "weather_reporter",
                        "score": 42,
                        "num_comments": 15,
                        "subreddit_name_prefixed": "r/weather",
                        "permalink": "/r/weather/comments/123/flood_alert/",
                        "created_utc": 1700000000,
                    }
                }
            ]
        }
    }

    with patch("requests.post", return_value=mock_auth_resp), patch("requests.get", return_value=mock_search_resp):
        posts = api.search_weather("Miami", max_results=5)
        assert len(posts) == 1
        assert posts[0]["title"] == "Heavy rain and flood alerts in downtown"
        assert posts[0]["author"] == "weather_reporter"
        assert posts[0]["score"] == 42
        assert posts[0]["num_comments"] == 15
        assert posts[0]["source"] == "Reddit (Official API)"
        assert "https://www.reddit.com/r/weather/comments/123/flood_alert/" in posts[0]["url"]


def test_scrape_weather_data_function():
    """Test the scrape_weather_data function call for a specified area."""
    result = scrape_weather_data("London", max_social_posts=3)
    assert result["success"] is True
    assert result["location"] == "London"
    assert "timestamp" in result
    assert "social_media_posts" in result
    assert "analysis" in result
    assert "severity_level" in result["analysis"]
    assert "summary" in result["analysis"]


def test_scrape_weather_data_empty_location():
    """Test validation when an empty location is provided."""
    result = scrape_weather_data("")
    assert result["success"] is False
    assert "error" in result


def test_analyzer_severity_classification():
    """Test rule-based severity and disaster categorization."""
    mock_posts = [
        {
            "title": "Severe flash flood warning issued for the downtown area",
            "text": "Streets are submerged and roads blocked.",
            "source": "Reddit",
        }
    ]
    analysis = analyze_weather_reports("TestCity", mock_posts)
    assert analysis["severity_level"] == "Critical"
    assert analysis["disruption_detected"] is True
    assert any("Flood" in ev for ev in analysis["detected_events"])
    assert len(analysis["hospitality_recommendations"]) > 0


def test_weather_scrape_api_get():
    """Test GET /api/v1/weather/scrape endpoint."""
    response = client.get("/api/v1/weather/scrape?location=Seattle&max_posts=2")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["location"] == "Seattle"
    assert "social_media_posts" in data
    assert "analysis" in data


def test_weather_scrape_api_post():
    """Test POST /api/v1/weather/scrape endpoint."""
    response = client.post("/api/v1/weather/scrape", json={"location": "Tokyo", "max_posts": 2})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["location"] == "Tokyo"
