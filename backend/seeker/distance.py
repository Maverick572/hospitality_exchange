import math
from typing import Any


def extract_coordinates(location: Any) -> tuple[float | None, float | None]:
    """
    Extract (latitude, longitude) floats from a location dict or object.
    Supports keys: latitude/lat, longitude/lng/lon.
    """
    if not isinstance(location, dict):
        return None, None

    lat = location.get("latitude") if location.get("latitude") is not None else location.get("lat")
    lng = (
        location.get("longitude")
        if location.get("longitude") is not None
        else (location.get("lng") if location.get("lng") is not None else location.get("lon"))
    )

    try:
        if lat is not None and lng is not None:
            return float(lat), float(lng)
    except (ValueError, TypeError):
        pass

    return None, None


def haversine_distance(
    lat1: float | None,
    lon1: float | None,
    lat2: float | None,
    lon2: float | None
) -> float:
    """
    Calculate great-circle distance in kilometers between two coordinates.
    Returns 0.0 if any coordinate is missing or invalid.
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 0.0

    # Earth radius in kilometers
    r = 6371.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))

    return round(r * c, 2)
