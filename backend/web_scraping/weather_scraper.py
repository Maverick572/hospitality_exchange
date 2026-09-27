"""Main entrypoint and orchestrator for scraping weather data from social media and the web."""

import argparse
import json
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Optional

try:
    from web_scraping.reddit_scraper import scrape_reddit_weather
    from web_scraping.social_scraper import scrape_social_weather
    from web_scraping.live_weather import get_live_weather
    from web_scraping.analyzer import analyze_weather_reports
except ImportError:
    # Direct execution or package relative import support
    from reddit_scraper import scrape_reddit_weather
    from social_scraper import scrape_social_weather
    from live_weather import get_live_weather
    from analyzer import analyze_weather_reports


def scrape_weather_data(
    location: str,
    max_social_posts: int = 10,
    include_reddit: bool = True,
    include_social: bool = True,
    include_telemetry: bool = True,
    timeout: int = 8,
) -> Dict[str, Any]:
    """
    Scrape real-time weather and environmental disruption data for a given area
    from social media (Reddit, Fediverse/Mastodon, public feeds) and meteorological sources.

    Args:
        location: City, neighborhood, or geographic area (e.g. 'Mumbai', 'New York', 'London').
        max_social_posts: Maximum number of social media posts to scrape.
        include_reddit: Whether to scrape Reddit.
        include_social: Whether to scrape Mastodon/decentralized social feeds.
        include_telemetry: Whether to fetch live meteorological telemetry (wttr.in/Open-Meteo).
        timeout: Network request timeout in seconds.

    Returns:
        Structured dictionary containing:
        - success: Boolean status
        - location: Target query location
        - timestamp: UTC timestamp of the scrape
        - live_weather: Meteorological telemetry (temp, humidity, condition, precipitation)
        - social_posts_count: Number of social posts scraped
        - social_media_posts: List of scraped posts with source, title, content, url, author
        - analysis: Disaster/severity evaluation, detected events, executive summary, recommendations
    """
    if not location or not location.strip():
        return {
            "success": False,
            "error": "Location parameter is required and cannot be empty.",
        }

    clean_location = location.strip()
    social_posts = []

    # 1. Scrape Reddit
    if include_reddit:
        reddit_posts = scrape_reddit_weather(
            location=clean_location,
            max_results=max_social_posts,
            timeout=timeout,
        )
        social_posts.extend(reddit_posts)

    # 2. Scrape Other Social Feeds (Mastodon / Fediverse)
    if include_social and len(social_posts) < max_social_posts:
        remaining = max_social_posts - len(social_posts)
        fediverse_posts = scrape_social_weather(
            location=clean_location,
            max_results=remaining,
            timeout=timeout,
        )
        social_posts.extend(fediverse_posts)

    # 3. Fetch Live Ground Truth Telemetry
    telemetry = None
    if include_telemetry:
        telemetry = get_live_weather(location=clean_location, timeout=timeout)

    # 4. Perform Intelligence & Disruption Analysis
    analysis = analyze_weather_reports(
        location=clean_location,
        social_posts=social_posts,
        telemetry=telemetry,
    )

    return {
        "success": True,
        "location": clean_location,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "live_weather": telemetry,
        "social_posts_count": len(social_posts),
        "social_media_posts": social_posts,
        "analysis": analysis,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Scrape real-time weather & social media reports for a specified area."
    )
    parser.add_argument(
        "location",
        nargs="?",
        default="Mumbai",
        help="City or location name to scrape weather for (default: 'Mumbai')",
    )
    parser.add_argument(
        "--max-posts",
        type=int,
        default=5,
        help="Maximum social media posts to scrape (default: 5)",
    )
    args = parser.parse_args()

    print(f"Scraping weather data for: {args.location}...")
    result = scrape_weather_data(location=args.location, max_social_posts=args.max_posts)
    print(json.dumps(result, indent=2))
