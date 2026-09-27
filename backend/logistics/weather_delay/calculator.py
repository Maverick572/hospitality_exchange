"""
Weather Delay Calculator
========================
Core delay computation engine that combines live weather API telemetry
(wttr.in / Open-Meteo) with web-scraped social media intelligence to
produce a time-based ETA delay factor.

Delay Formula
-------------
The total weather delay is computed as:

    delay_minutes = base_transit_minutes × combined_delay_factor

Where `combined_delay_factor` is the weighted sum of:

    combined_delay_factor =
        W_PRECIP  × precipitation_factor     (40%)
      + W_WIND    × wind_factor              (20%)
      + W_VISIBILITY × visibility_factor     (15%)
      + W_SOCIAL  × social_severity_factor   (25%)

Each sub-factor is normalized to [0, 1] and scaled by the weight.

Sub-factor formulas:
    precipitation_factor = min(1.0, precip_mm / PRECIP_SEVERE_MM)
    wind_factor          = min(1.0, wind_kmph / WIND_SEVERE_KMPH)
    visibility_factor    = max(0, 1 - visibility_km / VIS_CLEAR_KM)
    social_severity      = {"Normal": 0, "Moderate": 0.3, "Severe": 0.65, "Critical": 1.0}

The result is clamped to a maximum delay factor (MAX_DELAY_FACTOR) to prevent
unrealistically large delays.
"""

import logging
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger(__name__)

# ── Tuning Constants ──────────────────────────────────────────

# Weight distribution for combined delay factor
W_PRECIP = 0.40       # Precipitation (rain/snow intensity)
W_WIND = 0.20         # Wind speed
W_VISIBILITY = 0.15   # Low visibility (fog, smog, heavy rain)
W_SOCIAL = 0.25       # Social media disruption intelligence

# Thresholds for normalization
PRECIP_SEVERE_MM = 15.0    # ≥15mm/hr → maximum rain penalty
WIND_SEVERE_KMPH = 60.0    # ≥60 km/h → maximum wind penalty
VIS_CLEAR_KM = 10.0        # 10km = perfect visibility (0 penalty)

# Maximum combined delay factor (caps unrealistic values)
MAX_DELAY_FACTOR = 0.85    # e.g. a 30-min trip gets max +25.5 min delay

# Social severity mapping
SOCIAL_SEVERITY_MAP = {
    "Normal": 0.0,
    "Moderate": 0.30,
    "Severe": 0.65,
    "Critical": 1.0,
}

# Weather condition keywords → base delay hints (for descriptive conditions)
CONDITION_DELAY_HINTS = {
    "heavy rain": 0.45,
    "torrential": 0.65,
    "thunderstorm": 0.55,
    "rain": 0.25,
    "drizzle": 0.10,
    "light rain": 0.10,
    "fog": 0.30,
    "mist": 0.15,
    "haze": 0.10,
    "snow": 0.50,
    "blizzard": 0.80,
    "storm": 0.55,
    "hail": 0.60,
    "cloudy": 0.0,
    "overcast": 0.0,
    "clear": 0.0,
    "sunny": 0.0,
    "partly cloudy": 0.0,
}


def _safe_float(value: Any, default: float = 0.0) -> float:
    """Extract a numeric float from potentially string values like '4.2 mm'."""
    if value is None:
        return default
    if isinstance(value, (int, float)):
        return float(value)
    try:
        cleaned = str(value).strip().split()[0]  # "4.2 mm" → "4.2"
        cleaned = cleaned.replace("°C", "").replace("°F", "").replace("%", "").replace("km/h", "").replace("km", "").replace("mm", "")
        return float(cleaned)
    except (ValueError, IndexError):
        return default


def _precipitation_factor(precip_mm: float) -> float:
    """
    Normalize precipitation to [0, 1].
    0 mm → 0.0 (no delay), ≥15 mm → 1.0 (maximum rain delay).
    """
    if precip_mm <= 0:
        return 0.0
    return min(1.0, precip_mm / PRECIP_SEVERE_MM)


def _wind_factor(wind_kmph: float) -> float:
    """
    Normalize wind speed to [0, 1].
    0 km/h → 0.0, ≥60 km/h → 1.0.
    """
    if wind_kmph <= 10.0:  # Under 10 km/h has no meaningful impact
        return 0.0
    return min(1.0, (wind_kmph - 10.0) / (WIND_SEVERE_KMPH - 10.0))


def _visibility_factor(visibility_km: float) -> float:
    """
    Normalize visibility inversely to [0, 1].
    ≥10 km → 0.0 (clear), 0 km → 1.0 (zero visibility).
    """
    if visibility_km >= VIS_CLEAR_KM:
        return 0.0
    if visibility_km <= 0:
        return 1.0
    return max(0.0, 1.0 - (visibility_km / VIS_CLEAR_KM))


def _condition_hint_factor(condition: str) -> float:
    """
    Extract a delay hint from the weather condition description.
    Uses keyword matching against known weather conditions.
    """
    cond_lower = condition.lower().strip()
    for keyword, factor in sorted(CONDITION_DELAY_HINTS.items(), key=lambda x: -len(x[0])):
        if keyword in cond_lower:
            return factor
    return 0.0


def _classify_weather_condition(
    precip_mm: float,
    wind_kmph: float,
    condition: str,
) -> str:
    """
    Classify the weather into a human-readable category for display.
    Returns one of: 'Clear', 'Light Rain', 'Moderate Rain', 'Heavy Rain',
    'Storm', 'Fog/Low Visibility', 'Severe Weather'.
    """
    cond_lower = condition.lower()

    if any(k in cond_lower for k in ("thunderstorm", "storm", "hail", "blizzard")):
        return "Storm"
    if any(k in cond_lower for k in ("fog", "mist", "haze", "smog")):
        return "Fog/Low Visibility"
    if precip_mm >= 10.0 or "heavy rain" in cond_lower or "torrential" in cond_lower:
        return "Heavy Rain"
    if precip_mm >= 3.0 or "rain" in cond_lower:
        return "Moderate Rain"
    if precip_mm > 0 or "drizzle" in cond_lower or "light rain" in cond_lower or "shower" in cond_lower:
        return "Light Rain"
    if "snow" in cond_lower:
        return "Snow"

    return "Clear"


def compute_weather_delay(
    base_transit_minutes: int,
    live_weather: Optional[Dict[str, Any]] = None,
    scrape_analysis: Optional[Dict[str, Any]] = None,
    location: str = "",
) -> Dict[str, Any]:
    """
    Compute the weather-based ETA delay for a logistics route.

    Parameters
    ----------
    base_transit_minutes : int
        Original transit duration in minutes (from OSRM / route matching).
    live_weather : dict | None
        Live weather telemetry from get_live_weather() — contains
        condition, precipitation_mm, wind_speed, visibility_km, temp_c, etc.
    scrape_analysis : dict | None
        Analysis result from analyze_weather_reports() — contains
        severity_level, disruption_detected, detected_events, etc.
    location : str
        Location name for context.

    Returns
    -------
    dict
        Structured delay information:
        - has_delay: bool — whether any weather delay is applied
        - delay_minutes: int — additional delay in minutes
        - adjusted_transit_minutes: int — base + delay
        - delay_factor: float — the combined delay factor [0, MAX_DELAY_FACTOR]
        - weather_condition: str — classified weather (e.g. "Heavy Rain")
        - weather_details: dict — breakdown of each sub-factor
        - severity_level: str — from social scraping analysis
        - advisory: str — human-readable advisory text
        - data_sources: list[str] — which data sources contributed
    """
    data_sources = []
    precip_mm = 0.0
    wind_kmph = 0.0
    visibility_km = VIS_CLEAR_KM
    condition = "Clear"
    temp_c = "N/A"
    social_severity = "Normal"
    detected_events = []
    disruption_detected = False
    condition_hint = 0.0

    # ── Extract from live weather API telemetry ──
    if live_weather:
        data_sources.append(f"Live Weather API ({live_weather.get('source', 'API')})")
        condition = live_weather.get("condition", "Clear")
        precip_mm = _safe_float(live_weather.get("precipitation_mm"))
        wind_kmph = _safe_float(live_weather.get("wind_speed"))
        visibility_km = _safe_float(live_weather.get("visibility_km"), VIS_CLEAR_KM)
        temp_c = live_weather.get("temp_c", "N/A")
        condition_hint = _condition_hint_factor(condition)

    # ── Extract from web scraping analysis ──
    if scrape_analysis:
        data_sources.append("Web Scraping (Social Media & Reddit)")
        social_severity = scrape_analysis.get("severity_level", "Normal")
        detected_events = scrape_analysis.get("detected_events", [])
        disruption_detected = scrape_analysis.get("disruption_detected", False)

    # ── Compute individual sub-factors ──
    f_precip = _precipitation_factor(precip_mm)
    f_wind = _wind_factor(wind_kmph)
    f_vis = _visibility_factor(visibility_km)
    f_social = SOCIAL_SEVERITY_MAP.get(social_severity, 0.0)

    # If the condition description hints at worse weather than precipitation
    # data alone suggests (e.g. "Heavy Rain" but precip_mm is 0 due to API lag),
    # boost the precipitation factor
    if condition_hint > f_precip:
        f_precip = (f_precip + condition_hint) / 2

    # ── Combined delay factor (weighted sum) ──
    combined_factor = (
        W_PRECIP * f_precip
        + W_WIND * f_wind
        + W_VISIBILITY * f_vis
        + W_SOCIAL * f_social
    )
    combined_factor = min(combined_factor, MAX_DELAY_FACTOR)

    # ── Compute delay minutes ──
    delay_minutes = round(base_transit_minutes * combined_factor)
    adjusted_transit = base_transit_minutes + delay_minutes
    has_delay = delay_minutes > 0

    # ── Classify weather for display ──
    weather_condition = _classify_weather_condition(precip_mm, wind_kmph, condition)

    # ── Generate advisory ──
    advisory = _generate_advisory(
        weather_condition, delay_minutes, social_severity,
        detected_events, location, disruption_detected,
    )

    return {
        "has_delay": has_delay,
        "delay_minutes": delay_minutes,
        "adjusted_transit_minutes": adjusted_transit,
        "delay_factor": round(combined_factor, 4),
        "weather_condition": weather_condition,
        "condition_raw": condition,
        "temperature": temp_c,
        "precipitation_mm": round(precip_mm, 1),
        "wind_kmph": round(wind_kmph, 1),
        "visibility_km": round(visibility_km, 1),
        "severity_level": social_severity,
        "disruption_detected": disruption_detected,
        "detected_events": detected_events,
        "advisory": advisory,
        "data_sources": data_sources,
        "weather_details": {
            "precipitation_factor": round(f_precip, 3),
            "wind_factor": round(f_wind, 3),
            "visibility_factor": round(f_vis, 3),
            "social_severity_factor": round(f_social, 3),
            "condition_hint_factor": round(condition_hint, 3),
            "weights": {
                "precipitation": W_PRECIP,
                "wind": W_WIND,
                "visibility": W_VISIBILITY,
                "social": W_SOCIAL,
            },
        },
    }


def _generate_advisory(
    weather_condition: str,
    delay_minutes: int,
    severity: str,
    events: list,
    location: str,
    disruption: bool,
) -> str:
    """Generate a human-readable advisory string for display."""
    loc_str = f" in {location}" if location else ""

    if delay_minutes == 0:
        return f"Weather conditions{loc_str} are clear. No transit delays expected."

    base = f"Weather{loc_str}: {weather_condition}."

    if delay_minutes <= 5:
        base += f" Minor delay of ~{delay_minutes} min expected due to light weather."
    elif delay_minutes <= 15:
        base += f" Moderate delay of ~{delay_minutes} min anticipated. Drivers advised to exercise caution."
    elif delay_minutes <= 30:
        base += f" Significant delay of ~{delay_minutes} min expected. Recommend route monitoring."
    else:
        base += f" Major delay of ~{delay_minutes} min expected. Consider rescheduling if possible."

    if disruption and events:
        base += f" Social reports mention: {', '.join(events[:3])}."

    if severity in ("Severe", "Critical"):
        base += f" ⚠️ {severity} alert active — delivery drivers should proceed with extreme caution."

    return base
