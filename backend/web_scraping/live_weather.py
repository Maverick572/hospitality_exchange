"""Live meteorological data fetcher for ground-truth weather metrics."""

import urllib.parse
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import requests


def get_live_weather(location: str, timeout: int = 6) -> Optional[Dict[str, Any]]:
    """
    Fetch current live weather conditions for an area using open web weather services.

    Args:
        location: City or area name.
        timeout: Request timeout in seconds.

    Returns:
        Structured weather telemetry dictionary, or None if unavailable.
    """
    clean_loc = location.strip()
    encoded = urllib.parse.quote(clean_loc)

    # 1. Try wttr.in JSON
    try:
        url = f"https://wttr.in/{encoded}?format=j1"
        resp = requests.get(url, headers={"User-Agent": "curl/7.68.0"}, timeout=timeout)
        if resp.status_code == 200:
            data = resp.json()
            curr = data.get("current_condition", [{}])[0]
            nearest = data.get("nearest_area", [{}])[0]
            area_name = nearest.get("areaName", [{}])[0].get("value", location)
            country = nearest.get("country", [{}])[0].get("value", "")

            weather_desc = curr.get("weatherDesc", [{}])[0].get("value", "Unknown")
            temp_c = curr.get("temp_C", "N/A")
            temp_f = curr.get("temp_F", "N/A")
            humidity = curr.get("humidity", "N/A")
            wind_speed_kmph = curr.get("windspeedKmph", "N/A")
            precip_mm = curr.get("precipMM", "0.0")
            visibility_km = curr.get("visibility", "N/A")
            feels_like_c = curr.get("FeelsLikeC", temp_c)

            return {
                "source": "wttr.in",
                "resolved_location": f"{area_name}, {country}".strip(", "),
                "condition": weather_desc,
                "temp_c": f"{temp_c}°C",
                "temp_f": f"{temp_f}°F",
                "feels_like_c": f"{feels_like_c}°C",
                "humidity": f"{humidity}%",
                "wind_speed": f"{wind_speed_kmph} km/h",
                "precipitation_mm": f"{precip_mm} mm",
                "visibility_km": f"{visibility_km} km",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
    except Exception:
        pass

    # 2. Fallback to Open-Meteo Geocoding + Weather API
    try:
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded}&count=1&language=en&format=json"
        geo_resp = requests.get(geo_url, timeout=timeout)
        if geo_resp.status_code == 200:
            geo_data = geo_resp.json()
            results = geo_data.get("results", [])
            if results:
                lat = results[0]["latitude"]
                lon = results[0]["longitude"]
                name = results[0].get("name", location)
                country = results[0].get("country", "")

                forecast_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m"
                w_resp = requests.get(forecast_url, timeout=timeout)
                if w_resp.status_code == 200:
                    w_data = w_resp.json().get("current", {})
                    temp_c = w_data.get("temperature_2m", "N/A")
                    humidity = w_data.get("relative_humidity_2m", "N/A")
                    wind_speed = w_data.get("wind_speed_10m", "N/A")
                    precip = w_data.get("precipitation", 0.0)

                    return {
                        "source": "Open-Meteo",
                        "resolved_location": f"{name}, {country}".strip(", "),
                        "condition": "Clear/Cloudy" if precip == 0 else "Rainy/Wet",
                        "temp_c": f"{temp_c}°C",
                        "temp_f": f"{(float(temp_c) * 9/5 + 32):.1f}°F" if isinstance(temp_c, (int, float)) else "N/A",
                        "feels_like_c": f"{w_data.get('apparent_temperature', temp_c)}°C",
                        "humidity": f"{humidity}%",
                        "wind_speed": f"{wind_speed} km/h",
                        "precipitation_mm": f"{precip} mm",
                        "visibility_km": "N/A",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
    except Exception:
        pass

    return None
