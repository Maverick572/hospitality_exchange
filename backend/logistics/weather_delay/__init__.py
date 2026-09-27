"""
Weather Delay Module for Logistics ETA Adjustment
===================================================
Combines live weather API telemetry (wttr.in / Open-Meteo) and web-scraped
social media reports to compute an ETA delay factor for logistics routes.
"""

from logistics.weather_delay.calculator import compute_weather_delay
from logistics.weather_delay.eta_adjuster import adjust_eta_for_weather

__all__ = [
    "compute_weather_delay",
    "adjust_eta_for_weather",
]
