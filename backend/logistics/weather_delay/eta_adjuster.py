"""
ETA Adjuster
=============
High-level function that integrates the weather delay calculator with the
existing web scraping and live weather modules to adjust logistics ETA.

Fetches live weather data and social media scraping analysis, then computes
the delay and adjusts arrival times accordingly.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

try:
    from web_scraping.live_weather import get_live_weather
    from web_scraping.weather_scraper import scrape_weather_data
except ImportError:
    try:
        from backend.web_scraping.live_weather import get_live_weather
        from backend.web_scraping.weather_scraper import scrape_weather_data
    except ImportError:
        get_live_weather = None
        scrape_weather_data = None

try:
    from logistics.weather_delay.calculator import compute_weather_delay
except ImportError:
    from backend.logistics.weather_delay.calculator import compute_weather_delay


def _adjust_time_string(time_str: str, additional_minutes: int) -> str:
    """
    Shift a 'HH:MM' time string forward by additional_minutes.
    Returns the adjusted 'HH:MM' string.
    """
    try:
        parts = time_str.strip().split(":")
        h = int(parts[0])
        m = int(parts[1]) if len(parts) > 1 else 0
    except (ValueError, IndexError):
        return time_str

    total = h * 60 + m + additional_minutes
    new_h = (total // 60) % 24
    new_m = total % 60
    return f"{new_h:02d}:{new_m:02d}"


def adjust_eta_for_weather(
    base_transit_minutes: int,
    location: str,
    original_arrival_time: str = "09:30",
    include_scraping: bool = True,
    timeout: int = 6,
) -> Dict[str, Any]:
    """
    End-to-end ETA adjustment that:
    1. Fetches live weather data via API (wttr.in / Open-Meteo)
    2. Optionally scrapes social media for weather disruption intelligence
    3. Computes the weather delay using the weighted formula
    4. Adjusts the arrival time string

    Parameters
    ----------
    base_transit_minutes : int
        Original OSRM transit duration in minutes.
    location : str
        Location name (e.g. 'Mumbai', 'Andheri').
    original_arrival_time : str
        The original ETA as 'HH:MM' string.
    include_scraping : bool
        If True, also scrape social media for weather reports (slower but richer).
    timeout : int
        Network timeout for weather API calls.

    Returns
    -------
    dict
        Complete weather delay result including:
        - original_arrival_time: str
        - adjusted_arrival_time: str
        - All fields from compute_weather_delay()
    """
    live_weather = None
    scrape_analysis = None

    # 1. Fetch live weather telemetry (API-based: wttr.in → Open-Meteo fallback)
    if get_live_weather is not None:
        try:
            live_weather = get_live_weather(location=location, timeout=timeout)
            logger.info(f"Live weather for '{location}': {live_weather.get('condition') if live_weather else 'unavailable'}")
        except Exception as e:
            logger.warning(f"Failed to fetch live weather for '{location}': {e}")

    # 2. Web scrape social media for weather intelligence
    if include_scraping and scrape_weather_data is not None:
        try:
            scrape_result = scrape_weather_data(
                location=location,
                max_social_posts=5,
                include_reddit=True,
                include_social=True,
                include_telemetry=False,  # Already have telemetry from step 1
                timeout=timeout,
            )
            if scrape_result.get("success"):
                scrape_analysis = scrape_result.get("analysis")
                logger.info(
                    f"Scrape analysis for '{location}': severity={scrape_analysis.get('severity_level') if scrape_analysis else 'N/A'}"
                )
        except Exception as e:
            logger.warning(f"Failed to scrape weather for '{location}': {e}")

    # 3. Compute the weather delay
    delay_result = compute_weather_delay(
        base_transit_minutes=base_transit_minutes,
        live_weather=live_weather,
        scrape_analysis=scrape_analysis,
        location=location,
    )

    # 4. Adjust arrival time
    delay_mins = delay_result["delay_minutes"]
    adjusted_arrival = _adjust_time_string(original_arrival_time, delay_mins)

    delay_result["original_arrival_time"] = original_arrival_time
    delay_result["adjusted_arrival_time"] = adjusted_arrival
    delay_result["location"] = location

    return delay_result


def apply_weather_delay_to_routes(
    routes: List[Dict[str, Any]],
    pickup_location: str,
    delivery_location: str,
    timeout: int = 6,
) -> Tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:
    """
    Apply weather delay adjustment to a list of matched routes.
    Fetches weather data once and applies the delay to all routes.

    Parameters
    ----------
    routes : list[dict]
        List of route candidates from find_best_routes().
    pickup_location : str
        Pickup area name (used for weather lookup).
    delivery_location : str
        Delivery area name.
    timeout : int
        Network timeout for weather calls.

    Returns
    -------
    tuple[list[dict], dict | None]
        (Modified routes with weatherDelay attached, shared weather delay info)
    """
    if not routes:
        return routes, None

    # Use delivery location for weather (that's where delay impacts arrival)
    # Fall back to pickup location if delivery is empty
    weather_location = delivery_location or pickup_location or "Mumbai"

    # Get a representative base transit time from the first route
    base_transit = routes[0].get("osmDurationMinutes", 30)

    # Compute weather delay once (shared across all routes)
    weather_delay = adjust_eta_for_weather(
        base_transit_minutes=base_transit,
        location=weather_location,
        original_arrival_time=routes[0].get("arrivalTime", "09:30"),
        include_scraping=True,
        timeout=timeout,
    )

    # Apply to each route
    for route in routes:
        route_transit = route.get("osmDurationMinutes", base_transit)
        delay_mins = weather_delay["delay_minutes"]

        # Scale delay proportionally if this route has different transit time
        if route_transit != base_transit and base_transit > 0:
            scale = route_transit / base_transit
            route_delay_mins = round(delay_mins * scale)
        else:
            route_delay_mins = delay_mins

        original_arr = route.get("arrivalTime", "09:30")
        adjusted_arr = _adjust_time_string(original_arr, route_delay_mins)

        route["weatherDelay"] = {
            "has_delay": route_delay_mins > 0,
            "delay_minutes": route_delay_mins,
            "original_arrival_time": original_arr,
            "adjusted_arrival_time": adjusted_arr,
            "weather_condition": weather_delay.get("weather_condition", "Clear"),
            "condition_raw": weather_delay.get("condition_raw", "Clear"),
            "temperature": weather_delay.get("temperature", "N/A"),
            "precipitation_mm": weather_delay.get("precipitation_mm", 0),
            "wind_kmph": weather_delay.get("wind_kmph", 0),
            "severity_level": weather_delay.get("severity_level", "Normal"),
            "disruption_detected": weather_delay.get("disruption_detected", False),
            "detected_events": weather_delay.get("detected_events", []),
            "advisory": weather_delay.get("advisory", ""),
            "delay_factor": weather_delay.get("delay_factor", 0),
            "data_sources": weather_delay.get("data_sources", []),
        }

        # Also apply to pooledSolution drivers if present
        pooled = route.get("pooledSolution")
        if pooled and isinstance(pooled.get("drivers"), list):
            for drv in pooled["drivers"]:
                drv_arr = drv.get("arrivalTime", "09:30")
                drv["originalArrivalTime"] = drv_arr
                drv["adjustedArrivalTime"] = _adjust_time_string(drv_arr, route_delay_mins)
                drv["weatherDelayMinutes"] = route_delay_mins

            # Attach a summary to the pooled solution itself
            pooled["weatherDelay"] = {
                "has_delay": route_delay_mins > 0,
                "delay_minutes": route_delay_mins,
                "weather_condition": weather_delay.get("weather_condition", "Clear"),
                "advisory": weather_delay.get("advisory", ""),
                "severity_level": weather_delay.get("severity_level", "Normal"),
            }

    return routes, weather_delay
