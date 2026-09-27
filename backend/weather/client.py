"""
backend/weather/client.py

Wraps Open-Meteo (free, no API key) for the Digital Twin weather layer.
Same role as the existing OSRM client in Column 3 (External Services):
a thin, cached fetch that hands structured data up to the API layer.

Two things this module owns that the rest of the system depends on:
  1. get_current_weather()  -> live conditions for GET /weather/current
  2. classify_condition()   -> maps raw values to the labels the
                                weather-sensitivity rule table keys off
                                ("heavy_rain", "storm", "extreme_heat", "normal")

The classifier is intentionally separate from the fetch function so the
same logic can classify *simulated* slider values in /twin/simulate
without making a network call.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional

import openmeteo_requests
import requests_cache
from retry_requests import retry

# --- Client setup -----------------------------------------------------------
# 10 min cache: long enough to avoid hammering the free tier during a demo
# with a slider bound to the live endpoint, short enough to still feel "live".
_cache_session = requests_cache.CachedSession(".cache_weather", expire_after=600)
_retry_session = retry(_cache_session, retries=5, backoff_factor=0.2)
_client = openmeteo_requests.Client(session=_retry_session)

_BASE_URL = "https://api.open-meteo.com/v1/forecast"


# --- Condition classification -----------------------------------------------
# Thresholds are deliberately simple (rule-based, not learned) — this is the
# same rule table referenced in the weather-sensitivity mapping per category.
# Tune these once against your demo scenarios; they don't need to be exact.

def classify_condition(rainfall_mm_per_hr: float, temp_c: float) -> str:
    """Map raw weather values to the condition label the impact rule table uses."""
    if rainfall_mm_per_hr >= 30:
        return "storm"
    if rainfall_mm_per_hr >= 7.5:
        return "heavy_rain"
    if rainfall_mm_per_hr >= 1:
        return "light_rain"
    if temp_c >= 40:
        return "extreme_heat"
    return "normal"


# --- Data shapes --------------------------------------------------------------

@dataclass
class CurrentConditions:
    temperature_c: float
    precipitation_mm: float
    rain_mm: float
    snowfall_cm: float
    is_day: bool
    observed_at: str  # ISO 8601, UTC

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class WeatherSnapshot:
    location: dict          # {"lat": float, "lng": float}
    current: CurrentConditions
    conditionLabel: str
    todays_rain_sum_mm: Optional[float]
    source: str              # "live" | "forecast"
    fetched_at: str

    def to_dict(self) -> dict:
        return {
            "location": self.location,
            "current": self.current.to_dict(),
            "conditionLabel": self.conditionLabel,
            "todays_rain_sum_mm": self.todays_rain_sum_mm,
            "source": self.source,
            "fetched_at": self.fetched_at,
        }


# --- Public functions ---------------------------------------------------------

def get_current_weather(lat: float, lng: float) -> dict:
    """
    Fetch live current conditions + today's rain sum for a location.
    Backs GET /api/v1/weather/current?lat=&lng=

    Returns a dict shaped for direct JSON serialization by FastAPI.
    """
    params = {
        "latitude": lat,
        "longitude": lng,
        "daily": ["rain_sum"],
        "hourly": "temperature_2m",
        "current": ["temperature_2m", "precipitation", "rain", "is_day", "snowfall"],
        "timezone": "auto",
    }

    try:
        responses = _client.weather_api(_BASE_URL, params=params)
        response = responses[0]

        current = response.Current()
        temperature_c = current.Variables(0).Value()
        precipitation_mm = current.Variables(1).Value()
        rain_mm = current.Variables(2).Value()
        is_day = bool(current.Variables(3).Value())
        snowfall_cm = current.Variables(4).Value()

        daily = response.Daily()
        daily_rain_sum = daily.Variables(0).ValuesAsNumpy()
        todays_rain_sum = float(daily_rain_sum[0]) if len(daily_rain_sum) else None

        conditions = CurrentConditions(
            temperature_c=round(float(temperature_c), 1),
            precipitation_mm=round(float(precipitation_mm), 2),
            rain_mm=round(float(rain_mm), 2),
            snowfall_cm=round(float(snowfall_cm), 2),
            is_day=is_day,
            observed_at=datetime.fromtimestamp(current.Time(), tz=timezone.utc).isoformat(),
        )

        snapshot = WeatherSnapshot(
            location={"lat": lat, "lng": lng},
            current=conditions,
            conditionLabel=classify_condition(rain_mm, temperature_c),
            todays_rain_sum_mm=todays_rain_sum,
            source="live",
            fetched_at=datetime.now(timezone.utc).isoformat(),
        )
        return snapshot.to_dict()
    except Exception as e:
        # Graceful fallback in case of rate-limiting or network issues
        conditions = CurrentConditions(
            temperature_c=28.0,
            precipitation_mm=0.0,
            rain_mm=0.0,
            snowfall_cm=0.0,
            is_day=True,
            observed_at=datetime.now(timezone.utc).isoformat(),
        )
        snapshot = WeatherSnapshot(
            location={"lat": lat, "lng": lng},
            current=conditions,
            conditionLabel=classify_condition(0.0, 28.0),
            todays_rain_sum_mm=0.0,
            source="fallback",
            fetched_at=datetime.now(timezone.utc).isoformat(),
        )
        return snapshot.to_dict()


def get_hourly_forecast_temperature(lat: float, lng: float) -> list[dict]:
    """
    Optional helper for a forecast strip on the twin page.
    Returns [{"time": iso, "temperature_c": float}, ...]
    """
    params = {
        "latitude": lat,
        "longitude": lng,
        "hourly": "temperature_2m",
        "timezone": "auto",
    }
    try:
        responses = _client.weather_api(_BASE_URL, params=params)
        response = responses[0]
        hourly = response.Hourly()
        temps = hourly.Variables(0).ValuesAsNumpy()

        import pandas as pd  # local import: only needed for this helper

        times = pd.date_range(
            start=pd.to_datetime(hourly.Time(), unit="s", utc=True),
            end=pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True),
            freq=pd.Timedelta(seconds=hourly.Interval()),
            inclusive="left",
        )

        return [
            {"time": t.isoformat(), "temperature_c": round(float(v), 1)}
            for t, v in zip(times, temps)
        ]
    except Exception:
        now = datetime.now(timezone.utc)
        return [
            {"time": now.isoformat(), "temperature_c": 28.0}
        ]
