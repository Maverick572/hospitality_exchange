"""Social media scraper for weather reports across Mastodon, Web, and open social platforms."""

import re
import urllib.parse
from datetime import datetime, timezone
from typing import Any, Dict, List
import requests

DEFAULT_HEADERS = {
    "User-Agent": "HospitalityExchange-WeatherScraper/1.0 (OpenSocialSearch; contact@example.com)",
    "Accept": "application/json, text/plain, */*",
}

# Public Fediverse/Mastodon instances to query for real-time posts
MASTODON_INSTANCES = [
    "https://mastodon.social",
    "https://mstdn.social",
    "https://fosstodon.org",
]


def _clean_text(html_or_text: str) -> str:
    """Remove HTML tags, links, extra spaces."""
    if not html_or_text:
        return ""
    text = re.sub(r"<[^>]+>", " ", html_or_text)
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def scrape_social_weather(
    location: str,
    max_results: int = 10,
    timeout: int = 8,
) -> List[Dict[str, Any]]:
    """
    Scrape weather observations and reports from decentralized & open social media platforms (Mastodon, Fediverse).

    Args:
        location: City, region, or area name.
        max_results: Maximum posts to collect.
        timeout: Network timeout in seconds.

    Returns:
        List of standardized post objects.
    """
    results: List[Dict[str, Any]] = []
    seen_ids = set()

    clean_loc = location.strip()
    search_queries = [
        f"weather {clean_loc}",
        f"{clean_loc} rain",
        f"{clean_loc} storm",
    ]

    for instance in MASTODON_INSTANCES:
        if len(results) >= max_results:
            break

        for query in search_queries:
            if len(results) >= max_results:
                break

            params = {
                "q": query,
                "type": "statuses",
                "limit": min(10, max_results - len(results)),
            }
            search_url = f"{instance}/api/v2/search"

            try:
                resp = requests.get(search_url, params=params, headers=DEFAULT_HEADERS, timeout=timeout)
                if resp.status_code == 200:
                    data = resp.json()
                    statuses = data.get("statuses", [])
                    for status in statuses:
                        status_id = status.get("id")
                        if not status_id or status_id in seen_ids:
                            continue

                        seen_ids.add(status_id)
                        content = _clean_text(status.get("content", ""))
                        account = status.get("account", {})
                        username = account.get("username", "anonymous")
                        display_name = account.get("display_name") or username
                        url = status.get("url") or f"{instance}/@{username}/{status_id}"
                        created_at = status.get("created_at") or datetime.now(timezone.utc).isoformat()

                        results.append({
                            "title": content[:80] + ("..." if len(content) > 80 else ""),
                            "text": content[:500],
                            "author": f"{display_name} (@{username})",
                            "source": "Mastodon/Fediverse",
                            "subreddit": None,
                            "url": url,
                            "created_at": created_at,
                        })
            except Exception:
                continue

    return results
