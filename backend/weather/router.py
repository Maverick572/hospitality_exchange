"""
backend/weather/router.py

Exposes the weather client at GET /api/v1/weather/current.
No auth dependency — weather data isn't user-scoped, and the twin page
needs it to load before/without a session (matches your dual-mode
frontend pattern: this endpoint works the same in live and demo mode).

Wire into your main FastAPI app with:
    from backend.weather.router import router as weather_router
    app.include_router(weather_router, prefix="/api/v1")
"""

from fastapi import APIRouter, HTTPException, Query

try:
    from weather.client import get_current_weather, get_hourly_forecast_temperature
except ImportError:
    from backend.weather.client import get_current_weather, get_hourly_forecast_temperature

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/current")
def current_weather(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
):
    """
    Live weather for a location. Feeds:
      - the twin page's toggle-OFF state
      - /twin/simulate's baseline comparison
    """
    try:
        return get_current_weather(lat, lng)
    except Exception as exc:  # noqa: BLE001 — surface as a clean 502, don't leak client internals
        raise HTTPException(status_code=502, detail="Weather provider unavailable") from exc


@router.get("/forecast/hourly")
def hourly_forecast(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
):
    """Optional: powers a forecast strip on the twin page, not required by the mandatory spec."""
    try:
        return {"location": {"lat": lat, "lng": lng}, "hourly": get_hourly_forecast_temperature(lat, lng)}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Weather provider unavailable") from exc
