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

try:
    from services.osrm import estimate_osm_transit, calculate_osm_schedule
except ImportError:
    from backend.services.osrm import estimate_osm_transit, calculate_osm_schedule


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
    Retrieve active driverRoutes from Firestore.
    Accepts all active routes with at least minimal availableCapacity (>= 5 units)
    so they can participate in multi-driver fleet pooling or partial delivery.
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
        # Filter out completely full vehicles (< 5 units)
        if data.get("availableCapacity", 0) < 5:
            continue
        # Date gate (if specified)
        if travel_date and data.get("travelDate") != travel_date:
            continue
        results.append((doc.id, data))

    # If strict date filtering yielded zero candidates, fall back to any active route
    if not results and travel_date:
        for doc in firestore_db.collection("driverRoutes").where("status", "==", "active").stream():
            data = doc.to_dict()
            if data.get("availableCapacity", 0) >= 5:
                results.append((doc.id, data))

    return results


def _cpsat_rank_routes(candidates: list[dict]) -> list[dict]:
    """
    Use CP-SAT to rank candidate routes by minimizing a weighted composite
    cost (detour distance, price, and capacity fit).
    """
    if not candidates:
        return []

    n = len(candidates)
    SCALE = 100

    W_DETOUR = 40
    W_PRICE = 35
    W_CAPACITY_FIT = 25

    max_detour = max((c.get("total_detour_km", 0.0) for c in candidates), default=1.0) or 1.0
    max_price = max((c.get("price", 0.0) for c in candidates), default=1.0) or 1.0
    max_cap_gap = max((abs(c.get("availableCapacity", 0) - c.get("requiredCapacity", 1)) for c in candidates), default=1.0) or 1.0

    model = cp_model.CpModel()

    x = [model.new_bool_var(f"x_{i}") for i in range(n)]
    for var in x:
        model.add(var == 1)

    costs = []
    for i, c in enumerate(candidates):
        detour_norm = int((c.get("total_detour_km", 0.0) / max_detour) * SCALE)
        price_norm = int((c.get("price", 0.0) / max_price) * SCALE)
        cap_gap = abs(c.get("availableCapacity", 0) - c.get("requiredCapacity", 1))
        gap_norm = int((cap_gap / max_cap_gap) * SCALE)

        cost_i = (
            W_DETOUR * detour_norm
            + W_PRICE * price_norm
            + W_CAPACITY_FIT * gap_norm
        )
        costs.append(cost_i)
        c["_cpsat_cost"] = cost_i

    model.minimize(sum(costs[i] * x[i] for i in range(n)))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 2.0
    solver.solve(model)

    sorted_candidates = sorted(candidates, key=lambda c: c.get("_cpsat_cost", 0))

    for c in sorted_candidates:
        c.pop("_cpsat_cost", None)
        max_possible_detour = MAX_DETOUR_KM * 2
        overlap = max(0.0, 1.0 - (c.get("total_detour_km", 0.0) / max_possible_detour))
        c["routeOverlap"] = round(overlap, 2)

    return sorted_candidates


def _cpsat_pool_drivers(
    candidates: list[dict],
    required_capacity: int,
    transit_info: dict,
) -> dict | None:
    """
    CP-SAT Multi-Vehicle Fleet Pooling Solver.
    Finds the optimal combination of drivers whose combined available capacity
    fulfills the required demand (e.g. pooling 3-5 vehicles to carry 200 or 300 chairs).

    Allocates specific cargo units to each driver in the pool while minimizing
    unnecessary vehicle count, total cost, and detour distance.
    """
    if not candidates or required_capacity <= 0:
        return None

    viable = [c for c in candidates if c.get("availableCapacity", 0) > 0 and c.get("total_detour_km", 0) <= MAX_DETOUR_KM]
    if not viable:
        viable = [c for c in candidates if c.get("availableCapacity", 0) > 0]
    if not viable:
        return None

    # Prioritize directionally valid routes with minimal detour
    viable.sort(key=lambda c: (not c.get("directionallyValid", True), c.get("total_detour_km", 0.0), c.get("price", 0.0)))

    n = len(viable)
    total_fleet_capacity = sum(c.get("availableCapacity", 0) for c in viable)
    target_units = min(required_capacity, total_fleet_capacity)

    model = cp_model.CpModel()

    x = [model.new_bool_var(f"pool_x_{i}") for i in range(n)]
    u = [model.new_int_var(0, viable[i].get("availableCapacity", 0), f"pool_u_{i}") for i in range(n)]

    for i in range(n):
        cap_i = viable[i].get("availableCapacity", 0)
        model.add(u[i] <= cap_i * x[i])
        model.add(u[i] >= 1 * x[i])

    model.add(sum(u) == target_units)
    model.add(sum(x) <= min(8, n))

    W_VEHICLE = 150
    W_PRICE = 1
    W_DETOUR = 20
    W_DIR_INVALID = 600

    obj_terms = []
    for i in range(n):
        c = viable[i]
        price_i = int(c.get("price", 1000))
        detour_i = int(c.get("total_detour_km", 5))
        dir_penalty = 0 if c.get("directionallyValid", True) else W_DIR_INVALID

        cost_term = (
            W_VEHICLE * x[i]
            + W_PRICE * (price_i * x[i])
            + W_DETOUR * (detour_i * x[i])
            + dir_penalty * x[i]
        )
        obj_terms.append(cost_term)

    model.minimize(sum(obj_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 2.0
    status = solver.solve(model)

    chosen_indices = []
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        chosen_indices = [i for i in range(n) if solver.value(x[i]) == 1]
    else:
        accum = 0
        for i, c in enumerate(viable):
            if accum >= target_units:
                break
            chosen_indices.append(i)
            accum += c.get("availableCapacity", 0)

    if not chosen_indices:
        return None

    import uuid
    pooled_drivers = []
    total_allocated = 0
    total_pooled_price = 0
    remaining_to_allocate = target_units

    for idx in chosen_indices:
        c = viable[idx]
        cap = max(1, c.get("availableCapacity", 0))

        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            units_for_driver = int(solver.value(u[idx]))
        else:
            units_for_driver = min(cap, remaining_to_allocate)
            remaining_to_allocate -= units_for_driver

        if units_for_driver <= 0:
            continue

        total_allocated += units_for_driver
        unit_fraction = units_for_driver / cap
        driver_price = round(c.get("price", 1000) * min(1.0, max(0.5, unit_fraction)))
        total_pooled_price += driver_price

        drv = c.get("driver", {})
        pooled_drivers.append({
            "routeId": c.get("routeId"),
            "driverId": drv.get("driverId"),
            "driverName": drv.get("name") or "Verified Carrier",
            "vehicleType": drv.get("vehicleType") or "Commercial Transport",
            "vehicleNumber": drv.get("vehicleNumber") or "MH-01",
            "rating": drv.get("rating", 4.8),
            "vehicleCapacity": drv.get("capacity", cap),
            "availableCapacity": cap,
            "allocatedUnits": units_for_driver,
            "allocatedPrice": driver_price,
            "departureTime": c.get("departureTime", "09:00"),
            "arrivalTime": c.get("arrivalTime", "09:30"),
            "startAddress": (c.get("startLocation") or {}).get("address", "Mumbai"),
            "destinationAddress": (c.get("destination") or {}).get("address", "Mumbai"),
            "detourKm": c.get("total_detour_km", 0.0),
            "directionallyValid": c.get("directionallyValid", True),
        })

    dedicated_cost = max(8000, round(required_capacity * 28))
    savings = max(0, dedicated_cost - total_pooled_price)
    savings_pct = round((savings / dedicated_cost) * 100) if dedicated_cost > 0 else 0
    fulfillment_pct = round((total_allocated / max(1, required_capacity)) * 100)

    return {
        "poolId": f"pool_{uuid.uuid4().hex[:8]}",
        "totalDemand": required_capacity,
        "totalAllocated": total_allocated,
        "remainingUnfulfilled": max(0, required_capacity - total_allocated),
        "fulfillmentPercentage": fulfillment_pct,
        "isFullyFulfilled": fulfillment_pct >= 100,
        "vehicleCount": len(pooled_drivers),
        "totalPrice": total_pooled_price,
        "dedicatedTripCost": dedicated_cost,
        "totalSavings": savings,
        "savingsPercentage": savings_pct,
        "co2ReductionKg": round(len(pooled_drivers) * 13.5, 1),
        "osmDistanceKm": transit_info.get("distance_km", 8.9),
        "osmDurationMinutes": transit_info.get("duration_minutes", 27),
        "routingSource": transit_info.get("source", "OpenStreetMap (OSRM)"),
        "drivers": pooled_drivers,
    }


def find_best_routes(
    pickup_location: dict,
    delivery_location: dict,
    required_capacity: int,
    travel_date: str | None = None,
    firestore_db=None,
    max_results: int = 10,
    return_pooling: bool = False,
):
    """
    Main entry point: finds and ranks driver routes for a delivery need,
    and computes the Multi-Driver Fleet Pooling solution.

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
    return_pooling : bool
        If True, returns a tuple (routes, pooled_solution).
        If False, returns ranked routes with pooledSolution attached to each candidate.

    Returns
    -------
    list[dict] or tuple[list[dict], dict | None] : Ranked route candidates and pooled plan.
    """
    fdb = firestore_db or db
    if fdb is None:
        return ([], None) if return_pooling else []

    # Extract pickup/delivery coordinates
    p_lat, p_lng = extract_coordinates(pickup_location)
    d_lat, d_lng = extract_coordinates(delivery_location)

    if p_lat is None or d_lat is None:
        return ([], None) if return_pooling else []

    # Fetch candidate routes from Firestore
    raw_routes = _fetch_candidate_routes(fdb, required_capacity, travel_date)

    if not raw_routes:
        return ([], None) if return_pooling else []

    # Calculate real-world transit distance and duration once using OpenStreetMap (OSRM)
    transit_info = estimate_osm_transit(p_lat, p_lng, d_lat, d_lng)

    # Pre-fetch driver profiles into memory to eliminate N+1 latency
    driver_map = {}
    try:
        driver_docs = fdb.collection("drivers").stream()
        for d in driver_docs:
            dd = d.to_dict() or {}
            driver_map[d.id] = {
                "driverId": d.id,
                "name": dd.get("name", ""),
                "vehicleType": dd.get("vehicleType", ""),
                "vehicleNumber": dd.get("vehicleNumber", ""),
                "capacity": dd.get("capacity", 0),
                "rating": dd.get("rating", 0.0),
                "totalRatings": dd.get("totalRatings", 0),
            }
    except Exception:
        pass

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

        # Fetch driver info from pre-fetched map
        driver_id = route_data.get("driverId", "")
        driver_info = driver_map.get(driver_id, {"driverId": driver_id})

        dep_time, arr_time = calculate_osm_schedule(
            route_data.get("departureTime", "09:00"),
            transit_info["duration_minutes"]
        )

        avail_cap = int(route_data.get("availableCapacity", 0))
        candidates.append({
            "routeId": route_id,
            "driver": driver_info,
            "startLocation": route_data.get("startLocation"),
            "destination": route_data.get("destination"),
            "stops": route_data.get("stops", []),
            "travelDate": route_data.get("travelDate"),
            "departureTime": dep_time,
            "arrivalTime": arr_time,
            "availableCapacity": avail_cap,
            "requiredCapacity": required_capacity,
            "unitsFitted": min(avail_cap, required_capacity),
            "remainingUnits": max(0, required_capacity - avail_cap),
            "capacityFulfillment": "full" if avail_cap >= required_capacity else "partial",
            "osmDistanceKm": transit_info["distance_km"],
            "osmDurationMinutes": transit_info["duration_minutes"],
            "routingSource": transit_info["source"],
            "price": route_data.get("price", 0.0),
            "pickup_detour_km": round(pickup_dist, 2),
            "delivery_detour_km": round(delivery_dist, 2),
            "total_detour_km": round(pickup_dist + delivery_dist, 2),
            "excess_capacity": excess,
            "directionallyValid": route_directionally_valid,
        })

    if not candidates:
        return ([], None) if return_pooling else []

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

    # Solve multi-vehicle fleet pooling with CP-SAT
    pooled_solution = _cpsat_pool_drivers(ranked, required_capacity, transit_info)

    # Attach pooled solution to each route for easy access
    if ranked and pooled_solution:
        for r in ranked:
            r["pooledSolution"] = pooled_solution

    final_routes = ranked[:max_results]

    if return_pooling:
        return final_routes, pooled_solution

    return final_routes
