"""FastAPI router for weather scraping endpoints."""

from typing import Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel

try:
    from web_scraping.weather_scraper import scrape_weather_data
except ImportError:
    from backend.web_scraping.weather_scraper import scrape_weather_data

router = APIRouter(prefix="/weather", tags=["Weather Scraping"])


class WeatherScrapeRequest(BaseModel):
    location: str
    max_posts: Optional[int] = 10
    include_reddit: Optional[bool] = True
    include_social: Optional[bool] = True
    include_telemetry: Optional[bool] = True


@router.get("/scrape")
def scrape_weather_get(
    location: str = Query(..., description="City or area name (e.g., 'Miami', 'Mumbai', 'London')"),
    max_posts: int = Query(10, ge=1, le=50, description="Max social media posts to scrape"),
    include_reddit: bool = Query(True, description="Include Reddit scraping"),
    include_social: bool = Query(True, description="Include Fediverse/Mastodon social scraping"),
    include_telemetry: bool = Query(True, description="Include live meteorological telemetry"),
):
    """
    Scrape real-time weather and social media observations for a given location.
    """
    result = scrape_weather_data(
        location=location,
        max_social_posts=max_posts,
        include_reddit=include_reddit,
        include_social=include_social,
        include_telemetry=include_telemetry,
    )
    return result


@router.post("/scrape")
def scrape_weather_post(payload: WeatherScrapeRequest):
    """
    POST endpoint to scrape real-time weather and social media observations for a given location.
    """
    result = scrape_weather_data(
        location=payload.location,
        max_social_posts=payload.max_posts or 10,
        include_reddit=payload.include_reddit if payload.include_reddit is not None else True,
        include_social=payload.include_social if payload.include_social is not None else True,
        include_telemetry=payload.include_telemetry if payload.include_telemetry is not None else True,
    )
    return result
