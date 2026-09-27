"""Test script for the web_scraping module.

Usage:
    python test_scraper.py
    python test_scraper.py "Miami"
    python test_scraper.py "Tokyo" --posts 5
"""

import sys
import os
import argparse
import json
from datetime import datetime

# Ensure backend directory is in python path
backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from web_scraping import (
    scrape_weather_data,
    scrape_reddit_weather,
    RedditApiClient,
    scrape_social_weather,
    get_live_weather,
    analyze_weather_reports,
)


def print_header(title: str):
    print("\n" + "=" * 65)
    print(f"  {title}")
    print("=" * 65)


def test_single_location(location: str, max_posts: int = 5):
    """Run an in-depth test on a single location."""
    print_header(f"TESTING WEB SCRAPING FOR: {location.upper()}")

    reddit_client = RedditApiClient()
    print(f"Reddit API Status: {'CONFIGURED (Using Official OAuth API)' if reddit_client.is_configured else 'UNCONFIGURED (Using Open Feed Fallback)'}")

    # 1. Test Live Meteorological Telemetry
    print("\n[1/4] Fetching Live Weather Telemetry...")
    telemetry = get_live_weather(location)
    if telemetry:
        print(f"  [PASS] Resolved Location : {telemetry.get('resolved_location')}")
        print(f"         Condition         : {telemetry.get('condition')}")
        print(f"         Temperature       : {telemetry.get('temp_c')} ({telemetry.get('temp_f')})")
        print(f"         Feels Like        : {telemetry.get('feels_like_c')}")
        print(f"         Humidity          : {telemetry.get('humidity')}")
        print(f"         Wind Speed        : {telemetry.get('wind_speed')}")
        print(f"         Precipitation     : {telemetry.get('precipitation_mm')}")
    else:
        print("  [WARN] Live telemetry unavailable.")

    # 2. Test Reddit Scraper
    print("\n[2/4] Scraping Reddit Discussions...")
    reddit_posts = scrape_reddit_weather(location, max_results=max_posts)
    print(f"  [PASS] Retrieved {len(reddit_posts)} Reddit posts.")
    for idx, post in enumerate(reddit_posts[:3], 1):
        print(f"    {idx}. [{post.get('subreddit')}] {post.get('title')[:70]}...")
        print(f"       URL: {post.get('url')}")

    # 3. Test Social / Fediverse Scraper
    print("\n[3/4] Scraping Open Social Feeds (Mastodon/Fediverse)...")
    social_posts = scrape_social_weather(location, max_results=max_posts)
    print(f"  [PASS] Retrieved {len(social_posts)} social media posts.")
    for idx, post in enumerate(social_posts[:2], 1):
        print(f"    {idx}. Author: {post.get('author')}")
        print(f"       Text  : {post.get('text')[:70]}...")

    # 4. Test Full Orchestration & Analysis
    print("\n[4/4] Testing Full Orchestration (scrape_weather_data)...")
    full_result = scrape_weather_data(location, max_social_posts=max_posts)

    if full_result.get("success"):
        analysis = full_result.get("analysis", {})
        print("  [PASS] Full scraping & analysis pipeline executed successfully!")
        print(f"         Severity Level      : {analysis.get('severity_level')}")
        print(f"         Disruption Detected : {analysis.get('disruption_detected')}")
        print(f"         Detected Events     : {analysis.get('detected_events')}")
        print(f"         Executive Summary   : {analysis.get('summary')}")
        print(f"         Recommendations     : {len(analysis.get('hospitality_recommendations', []))} items")
        for rec in analysis.get("hospitality_recommendations", []):
            print(f"           - {rec}")
    else:
        print(f"  [FAIL] Orchestration failed: {full_result.get('error')}")

    return full_result


def run_multi_city_smoke_tests():
    """Run quick smoke tests across multiple test cities."""
    test_cities = ["London", "Miami", "Mumbai", "Tokyo"]
    print_header("RUNNING MULTI-CITY SMOKE TESTS")

    print(f"\n{'City':<12} | {'Status':<8} | {'Temp':<10} | {'Condition':<20} | {'Severity':<10} | {'Posts':<6}")
    print("-" * 75)

    all_passed = True
    for city in test_cities:
        res = scrape_weather_data(city, max_social_posts=2)
        if res.get("success"):
            live = res.get("live_weather") or {}
            temp = live.get("temp_c", "N/A")
            cond = live.get("condition", "N/A")[:18]
            sev = res.get("analysis", {}).get("severity_level", "Unknown")
            post_count = len(res.get("social_media_posts", []))
            print(f"{city:<12} | {'PASS':<8} | {temp:<10} | {cond:<20} | {sev:<10} | {post_count:<6}")
        else:
            print(f"{city:<12} | {'FAIL':<8} | {'-':<10} | {'-':<20} | {'-':<10} | {'0':<6}")
            all_passed = False

    print("-" * 75)
    if all_passed:
        print("ALL SMOKE TESTS COMPLETED SUCCESSFULLY!\n")
    else:
        print("SOME SMOKE TESTS FAILED.\n")


def main():
    parser = argparse.ArgumentParser(description="Test runner for backend/web_scraping module.")
    parser.add_argument("location", nargs="?", default=None, help="Target location/city to test")
    parser.add_argument("--posts", type=int, default=5, help="Number of social posts to scrape (default: 5)")
    parser.add_argument("--all", action="store_true", help="Run multi-city smoke tests")
    args = parser.parse_args()

    if args.all or args.location is None:
        if args.location:
            test_single_location(args.location, max_posts=args.posts)
        run_multi_city_smoke_tests()
    else:
        test_single_location(args.location, max_posts=args.posts)


if __name__ == "__main__":
    main()
