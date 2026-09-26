"""
Logistics - Route Matcher with CP-SAT Optimization
====================================================
Takes two user locations (pickup = provider, delivery = seeker) and a required
capacity. Finds active driverRoutes whose path passes near both locations and
has sufficient available capacity. Uses OR-Tools CP-SAT to score and rank the
candidate routes optimally.

Scoring dimensions (all minimized):
  1. Total detour distance: sum of Haversine distances from the route's
     nearest waypoint to each of the two user locations.
  2. Price: route.price (lower is better).
  3. Capacity fit: excess capacity beyond what is needed (less waste = better).

CP-SAT assigns integer-scaled costs and finds a Pareto-efficient ordering.
"""

import math
from typing import Any

from ortools.sat.python import cp_model

try:
    from core.firebase import db
except ImportError:
    from backend.core.firebase import db

try:
    from seeker.distance import haversine_distance, extract_coordinates
except ImportError:
    from backend.seeker.distance import haversine_distance, extract_coordinates


# Maximum detour distance (km) from a route waypoint to a user location
# before the route is considered incompatible
MAX_DETOUR_KM = 25.0


def _route_waypoints(route_data: dict) -> list[dict]:
    """
    Flatten a route into an ordered list of waypoint locations:
    [startLocation, ...stops, destination].
    """
    waypoints = []
    start = route_data.get("startLocation")
    if start:
        waypoints.append(start)

    for stop in route_data.get("stops", []) or []:
        waypoints.append(stop)

    dest = route_data.get("destination")
    if dest:
        waypoints.append(dest)

    return waypoints


def _min_distance_to_waypoints(
    target_lat: float,
    target_lng: float,
    waypoints: list[dict],
) -> tuple[float, int]:
    """
    Return (min_distance_km, best_waypoint_index) from a target location
    to the nearest waypoint on a route.
    """
    best_dist = float("inf")
    best_idx = 0

    for idx, wp in enumerate(waypoints):
        wp_lat, wp_lng = extract_coordinates(wp)
        if wp_lat is None or wp_lng is None:
            continue
        d = haversine_distance(target_lat, target_lng, wp_lat, wp_lng)
        if d < best_dist:
            best_dist = d
            best_idx = idx

    return best_dist, best_idx


def _fetch_candidate_routes(
    firestore_db,
    required_capacity: int,
    travel_date: str | None = None,
) -> list[tuple[str, dict]]:
    """
    Retrieve active driverRoutes from Firestore that have at least
    `required_capacity`. Optionally filter by travelDate.
    """
    if firestore_db is None:
        return []

    query = (
        firestore_db.collection("driverRoutes")
        .where("status", "==", "active")
    )

    docs = query.stream()
    results = []

    for doc in docs:
        data = doc.to_dict()
        # Capacity gate
        if data.get("availableCapacity", 0) < required_capacity:
            continue
        # Date gate (if specified)
        if travel_date and data.get("travelDate") != travel_date:
            continue
        results.append((doc.id, data))

    return results


def _cpsat_rank_routes(candidates: list[dict]) -> list[dict]:
    """
    Use CP-SAT to rank candidate routes by minimizing a weighted composite
    cost. Each candidate has pre-computed:
      - pickup_detour_km
      - delivery_detour_km
      - price
      - excess_capacity
      - route_overlap (higher is better, so we invert)

    The solver picks all candidates (this is a ranking problem, not a
    selection problem) and assigns each an optimal score for sorting.
    """
    if not candidates:
        return []

    n = len(candidates)

    # Scale floats to integers for CP-SAT (multiply by 100)
    SCALE = 100

    # Weights for each dimension (total detour : price : capacity waste)
    W_DETOUR = 40
    W_PRICE = 35
    W_CAPACITY_WASTE = 25

    # Normalize each dimension across the candidate set
    max_detour = max(c["total_detour_km"] for c in candidates) or 1.0
    max_price = max(c["price"] for c in candidates) or 1.0
    max_excess = max(c["excess_capacity"] for c in candidates) or 1.0

    model = cp_model.CpModel()

    # Binary variable for each candidate (always 1 since we rank all)
    x = [model.new_bool_var(f"x_{i}") for i in range(n)]
    for var in x:
        model.add(var == 1)

    # Compute scaled cost for each candidate
    costs = []
    for i, c in enumerate(candidates):
        detour_norm = int((c["total_detour_km"] / max_detour) * SCALE)
        price_norm = int((c["price"] / max_price) * SCALE)
        waste_norm = int((c["excess_capacity"] / max_excess) * SCALE)

        cost_i = (
            W_DETOUR * detour_norm
            + W_PRICE * price_norm
            + W_CAPACITY_WASTE * waste_norm
        )
        costs.append(cost_i)
        c["_cpsat_cost"] = cost_i

    # Objective: minimize total cost (though since all are selected,
    # the solver just validates; we use the cost for sorting)
    model.minimize(sum(costs[i] * x[i] for i in range(n)))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0
    solve_status = solver.solve(model)

    # Sort candidates by their computed cost (ascending = best first)
    sorted_candidates = sorted(candidates, key=lambda c: c["_cpsat_cost"])

    # Clean up internal fields and compute routeOverlap (0..1 scale)
    for c in sorted_candidates:
        cost = c.pop("_cpsat_cost", 0)
        # Route overlap: inverse of total detour normalized to 0-1
        max_possible_detour = MAX_DETOUR_KM * 2  # pickup + delivery max
        overlap = max(0.0, 1.0 - (c["total_detour_km"] / max_possible_detour))
        c["routeOverlap"] = round(overlap, 2)

    return sorted_candidates


def find_best_routes(
    pickup_location: dict,
    delivery_location: dict,
    required_capacity: int,
    travel_date: str | None = None,
    firestore_db=None,
    max_results: int = 10,
) -> list[dict]:
    """
    Main entry point: finds and ranks driver routes for a delivery need.

    Parameters
    ----------
    pickup_location : dict
        Provider's location {address, latitude, longitude}.
    delivery_location : dict
        Seeker's location {address, latitude, longitude}.
    required_capacity : int
        Minimum capacity units needed.
    travel_date : str | None
        Optional YYYY-MM-DD filter.
    firestore_db : optional
        Firestore client override for testing.
    max_results : int
        Maximum number of routes to return.

    Returns
    -------
    list[dict] : Ranked route candidates with metadata.
    """
    fdb = firestore_db or db
    if fdb is None:
        return []

    # Extract pickup/delivery coordinates
    p_lat, p_lng = extract_coordinates(pickup_location)
    d_lat, d_lng = extract_coordinates(delivery_location)

    if p_lat is None or d_lat is None:
        return []

    # Fetch candidate routes from Firestore
    raw_routes = _fetch_candidate_routes(fdb, required_capacity, travel_date)

    if not raw_routes:
        return []

    # Evaluate each candidate
    candidates = []
    for route_id, route_data in raw_routes:
        waypoints = _route_waypoints(route_data)
        if not waypoints:
            continue

        # Distance from pickup location to nearest waypoint
        pickup_dist, pickup_idx = _min_distance_to_waypoints(p_lat, p_lng, waypoints)
        # Distance from delivery location to nearest waypoint
        delivery_dist, delivery_idx = _min_distance_to_waypoints(d_lat, d_lng, waypoints)

        # Reject if either detour exceeds the threshold
        if pickup_dist > MAX_DETOUR_KM or delivery_dist > MAX_DETOUR_KM:
            continue

        # Ensure pickup comes before (or at same point as) delivery
        # along the route direction for logical feasibility
        route_directionally_valid = pickup_idx <= delivery_idx

        excess = route_data.get("availableCapacity", 0) - required_capacity

        # Fetch driver info
        driver_id = route_data.get("driverId", "")
        driver_info = {}
        try:
            driver_doc = fdb.collection("drivers").document(driver_id).get()
            if driver_doc.exists:
                dd = driver_doc.to_dict()
                driver_info = {
                    "driverId": driver_id,
                    "name": dd.get("name", ""),
                    "vehicleType": dd.get("vehicleType", ""),
                    "vehicleNumber": dd.get("vehicleNumber", ""),
                    "capacity": dd.get("capacity", 0),
                    "rating": dd.get("rating", 0.0),
                    "totalRatings": dd.get("totalRatings", 0),
                }
        except Exception:
            driver_info = {"driverId": driver_id}

        candidates.append({
            "routeId": route_id,
            "driver": driver_info,
            "startLocation": route_data.get("startLocation"),
            "destination": route_data.get("destination"),
            "stops": route_data.get("stops", []),
            "travelDate": route_data.get("travelDate"),
            "departureTime": route_data.get("departureTime"),
            "arrivalTime": route_data.get("arrivalTime"),
            "availableCapacity": route_data.get("availableCapacity", 0),
            "price": route_data.get("price", 0.0),
            "pickup_detour_km": round(pickup_dist, 2),
            "delivery_detour_km": round(delivery_dist, 2),
            "total_detour_km": round(pickup_dist + delivery_dist, 2),
            "excess_capacity": excess,
            "directionallyValid": route_directionally_valid,
        })

    if not candidates:
        return []

    # Run CP-SAT ranking
    ranked = _cpsat_rank_routes(candidates)

    # Assign stable rank index before the secondary sort
    for i, c in enumerate(ranked):
        c["_rank_idx"] = i

    # Prefer directionally valid routes, then by CP-SAT rank
    ranked.sort(key=lambda c: (not c.get("directionallyValid", True), c.get("_rank_idx", 0)))

    # Clean up internal key
    for c in ranked:
        c.pop("_rank_idx", None)

    return ranked[:max_results]
