"""Reddit scraper and official API client for weather discussions and local posts."""

import os
import re
import time
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import requests
from dotenv import load_dotenv

load_dotenv()

DEFAULT_USER_AGENT = os.getenv(
    "REDDIT_USER_AGENT",
    "python:HospitalityExchangeWeather:v1.0 (by /u/hospitality_app)"
)


class RedditApiClient:
    """Official Reddit OAuth API client for querying posts and subreddits."""

    def __init__(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        user_agent: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
    ):
        self.client_id = client_id or os.getenv("REDDIT_CLIENT_ID")
        self.client_secret = client_secret or os.getenv("REDDIT_CLIENT_SECRET")
        self.user_agent = user_agent or DEFAULT_USER_AGENT
        self.username = username or os.getenv("REDDIT_USERNAME")
        self.password = password or os.getenv("REDDIT_PASSWORD")

        self._access_token: Optional[str] = None
        self._token_expiry: float = 0.0

    @property
    def is_configured(self) -> bool:
        """Check if Reddit API credentials are configured."""
        return bool(self.client_id and self.client_secret and self.client_id != "your_reddit_client_id")

    def _get_access_token(self, timeout: int = 8) -> Optional[str]:
        """Obtain or refresh an OAuth access token from Reddit."""
        if self._access_token and time.time() < (self._token_expiry - 60):
            return self._access_token

        if not self.is_configured:
            return None

        auth = requests.auth.HTTPBasicAuth(self.client_id, self.client_secret)
        headers = {"User-Agent": self.user_agent}

        if self.username and self.password:
            data = {
                "grant_type": "password",
                "username": self.username,
                "password": self.password,
            }
        else:
            data = {"grant_type": "client_credentials"}

        try:
            resp = requests.post(
                "https://www.reddit.com/api/v1/access_token",
                auth=auth,
                data=data,
                headers=headers,
                timeout=timeout,
            )
            if resp.status_code == 200:
                payload = resp.json()
                self._access_token = payload.get("access_token")
                expires_in = payload.get("expires_in", 3600)
                self._token_expiry = time.time() + float(expires_in)
                return self._access_token
        except Exception:
            pass

        return None

    def search_weather(
        self,
        location: str,
        max_results: int = 10,
        timeout: int = 8,
    ) -> List[Dict[str, Any]]:
        """Search weather discussions using authenticated Reddit OAuth API."""
        token = self._get_access_token(timeout=timeout)
        if not token:
            return []

        headers = {
            "Authorization": f"bearer {token}",
            "User-Agent": self.user_agent,
        }

        results: List[Dict[str, Any]] = []
        seen_urls = set()
        clean_loc = location.strip()

        search_queries = [
            f"{clean_loc} weather",
            f"{clean_loc} rain OR flood OR storm",
        ]

        for query in search_queries:
            if len(results) >= max_results:
                break

            params = {
                "q": query,
                "sort": "new",
                "limit": min(25, max_results - len(results)),
                "type": "link",
            }

            try:
                resp = requests.get(
                    "https://oauth.reddit.com/search",
                    headers=headers,
                    params=params,
                    timeout=timeout,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    children = data.get("data", {}).get("children", [])
                    for child in children:
                        post_data = child.get("data", {})
                        permalink = post_data.get("permalink", "")
                        url = f"https://www.reddit.com{permalink}" if permalink else post_data.get("url", "")
                        if not url or url in seen_urls:
                            continue

                        seen_urls.add(url)
                        created_utc = post_data.get("created_utc", 0)
                        created_iso = (
                            datetime.fromtimestamp(created_utc, tz=timezone.utc).isoformat()
                            if created_utc
                            else datetime.now(timezone.utc).isoformat()
                        )

                        results.append({
                            "title": post_data.get("title", ""),
                            "text": (post_data.get("selftext", "") or "")[:500],
                            "author": post_data.get("author", "anonymous"),
                            "score": post_data.get("score", 0),
                            "num_comments": post_data.get("num_comments", 0),
                            "source": "Reddit (Official API)",
                            "subreddit": post_data.get("subreddit_name_prefixed", f"r/{post_data.get('subreddit', 'weather')}"),
                            "url": url,
                            "created_at": created_iso,
                        })
            except Exception:
                continue

        return results


def _clean_html(raw_html: str) -> str:
    """Strip HTML tags and unescape entities."""
    if not raw_html:
        return ""
    clean = re.sub(r"<[^>]+>", " ", raw_html)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


def _scrape_reddit_rss_fallback(
    location: str,
    max_results: int = 10,
    timeout: int = 8,
) -> List[Dict[str, Any]]:
    """Fallback scraper using Reddit RSS & Open Feeds when API keys are not supplied."""
    results: List[Dict[str, Any]] = []
    seen_urls = set()

    clean_loc = location.strip()
    queries = [
        f"weather {clean_loc}",
        f"{clean_loc} rain OR flood OR storm OR heat OR temperature",
    ]

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    for query in queries:
        if len(results) >= max_results:
            break

        encoded_q = urllib.parse.quote_plus(query)
        rss_url = f"https://www.reddit.com/search.rss?q={encoded_q}&sort=new"

        try:
            resp = requests.get(rss_url, headers=headers, timeout=timeout)
            if resp.status_code == 200 and resp.content:
                try:
                    root = ET.fromstring(resp.content)
                    ns = {"atom": "http://www.w3.org/2005/Atom"}
                    entries = root.findall("atom:entry", ns)

                    for entry in entries:
                        if len(results) >= max_results:
                            break

                        title_elem = entry.find("atom:title", ns)
                        link_elem = entry.find("atom:link", ns)
                        content_elem = entry.find("atom:content", ns)
                        author_elem = entry.find("atom:author/atom:name", ns)
                        updated_elem = entry.find("atom:updated", ns)
                        if updated_elem is None:
                            updated_elem = entry.find("atom:published", ns)
                        category_elem = entry.find("atom:category", ns)

                        title = title_elem.text if title_elem is not None and title_elem.text else ""
                        link = link_elem.attrib.get("href", "") if link_elem is not None else ""
                        content_raw = content_elem.text if content_elem is not None and content_elem.text else ""
                        author = author_elem.text if author_elem is not None and author_elem.text else "anonymous"
                        updated = updated_elem.text if updated_elem is not None and updated_elem.text else datetime.now(timezone.utc).isoformat()
                        subreddit = category_elem.attrib.get("label", "reddit") if category_elem is not None else "reddit"

                        if not link or link in seen_urls:
                            continue

                        if "/comments/" not in link and not link.rstrip("/").split("/")[-1].isalnum():
                            continue

                        clean_content = _clean_html(content_raw)
                        if "submitted by" in clean_content:
                            clean_content = clean_content.split("submitted by")[0].strip()

                        seen_urls.add(link)
                        results.append({
                            "title": title,
                            "text": clean_content[:500],
                            "author": author,
                            "score": 0,
                            "num_comments": 0,
                            "source": "Reddit",
                            "subreddit": subreddit if subreddit.startswith("r/") else f"r/{subreddit}",
                            "url": link,
                            "created_at": updated,
                        })
                except ET.ParseError:
                    pass
        except Exception:
            pass

    return results


# Global API client instance
_reddit_api_client = RedditApiClient()


def scrape_reddit_weather(
    location: str,
    max_results: int = 10,
    timeout: int = 8,
) -> List[Dict[str, Any]]:
    """
    Fetch weather-related posts and discussions from Reddit.
    Uses official Reddit OAuth API if configured in .env (REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET),
    and falls back automatically to public feeds if unconfigured.

    Args:
        location: City, region, or area name.
        max_results: Maximum posts to return.
        timeout: Request timeout in seconds.

    Returns:
        List of post dictionaries.
    """
    # 1. Try Official Reddit OAuth API if credentials are configured
    if _reddit_api_client.is_configured:
        api_results = _reddit_api_client.search_weather(
            location=location,
            max_results=max_results,
            timeout=timeout,
        )
        if api_results:
            return api_results

    # 2. Fallback to open Reddit search feeds
    return _scrape_reddit_rss_fallback(
        location=location,
        max_results=max_results,
        timeout=timeout,
    )
