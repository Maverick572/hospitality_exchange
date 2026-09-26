"""
Logistics Module - Integration Test Script
============================================
This script:
  1. Registers a few driver profiles in Firestore (using drivers collection).
  2. Creates driverRoutes for each driver with realistic stops, schedules,
     and capacities across Mumbai/Navi Mumbai.
  3. Picks two random users from the existing 'users' collection to serve as
     pickup (provider) and delivery (seeker) locations.
  4. Runs the CP-SAT route matcher to find best routes between those two users.
  5. Prints the ranked results in a formatted table.

Usage:
    cd backend
    python -m logistics.test_logistics
"""

import os
import sys
import uuid
import random
from datetime import datetime, timezone

from dotenv import load_dotenv

load_dotenv()

# Add backend directory to path
backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
__test__ = False  # Tell pytest this is an interactive integration test script

from core.firebase import db
from logistics.matcher import find_best_routes


# ============================================================
# SAMPLE DATA POOLS
# ============================================================

DRIVER_TEMPLATES = [
    {
        "name": "Rahul Sharma",
        "phone": "+919876543201",
        "vehicleType": "Tata Ace",
        "vehicleNumber": "MH04AB1234",
        "capacity": 750,
    },
    {
        "name": "Vikram Patil",
        "phone": "+919876543202",
        "vehicleType": "Mahindra Bolero Pickup",
        "vehicleNumber": "MH01CD5678",
        "capacity": 1200,
    },
    {
        "name": "Suresh Yadav",
        "phone": "+919876543203",
        "vehicleType": "Eicher 14ft",
        "vehicleNumber": "MH43EF9012",
        "capacity": 3000,
    },
    {
        "name": "Amit Deshmukh",
        "phone": "+919876543204",
        "vehicleType": "3-Wheeler Tempo",
        "vehicleNumber": "MH02GH3456",
        "capacity": 400,
    },
    {
        "name": "Prasad Kulkarni",
        "phone": "+919876543205",
        "vehicleType": "Tata 407",
        "vehicleNumber": "MH12IJ7890",
        "capacity": 2000,
    },
]

# Realistic route corridors across Mumbai/Navi Mumbai
ROUTE_CORRIDORS = [
    {
        "start": {"address": "Thane Station", "latitude": 19.1860, "longitude": 72.9757},
        "stops": [
            {"address": "Mulund Check Naka", "latitude": 19.1726, "longitude": 72.9569},
            {"address": "Airoli Bridge", "latitude": 19.1554, "longitude": 72.9989},
        ],
        "dest": {"address": "Vashi, Navi Mumbai", "latitude": 19.0760, "longitude": 72.9930},
    },
    {
        "start": {"address": "Andheri East, Mumbai", "latitude": 19.1136, "longitude": 72.8697},
        "stops": [
            {"address": "Powai, Mumbai", "latitude": 19.1176, "longitude": 72.9060},
            {"address": "Kanjurmarg, Mumbai", "latitude": 19.1303, "longitude": 72.9341},
        ],
        "dest": {"address": "Nerul, Navi Mumbai", "latitude": 19.0330, "longitude": 73.0297},
    },
    {
        "start": {"address": "Dadar West, Mumbai", "latitude": 19.0178, "longitude": 72.8478},
        "stops": [
            {"address": "Chembur, Mumbai", "latitude": 19.0522, "longitude": 72.8968},
            {"address": "Mankhurd, Mumbai", "latitude": 19.0426, "longitude": 72.9359},
            {"address": "Vashi, Navi Mumbai", "latitude": 19.0760, "longitude": 72.9930},
        ],
        "dest": {"address": "CBD Belapur, Navi Mumbai", "latitude": 19.0178, "longitude": 73.0410},
    },
    {
        "start": {"address": "Bandra West, Mumbai", "latitude": 19.0596, "longitude": 72.8295},
        "stops": [
            {"address": "Kurla, Mumbai", "latitude": 19.0726, "longitude": 72.8793},
        ],
        "dest": {"address": "Panvel, Navi Mumbai", "latitude": 18.9894, "longitude": 73.1175},
    },
    {
        "start": {"address": "Borivali, Mumbai", "latitude": 19.2307, "longitude": 72.8567},
        "stops": [
            {"address": "Goregaon, Mumbai", "latitude": 19.1663, "longitude": 72.8491},
            {"address": "Andheri West, Mumbai", "latitude": 19.1361, "longitude": 72.8296},
            {"address": "Bandra East, Mumbai", "latitude": 19.0596, "longitude": 72.8495},
        ],
        "dest": {"address": "Colaba, Mumbai", "latitude": 18.9067, "longitude": 72.8147},
    },
    {
        "start": {"address": "Kalyan, Thane", "latitude": 19.2437, "longitude": 73.1355},
        "stops": [
            {"address": "Dombivli, Thane", "latitude": 19.2183, "longitude": 73.0867},
            {"address": "Thane West", "latitude": 19.1860, "longitude": 72.9757},
        ],
        "dest": {"address": "Vashi, Navi Mumbai", "latitude": 19.0760, "longitude": 72.9930},
    },
]

TRAVEL_DATE = "2026-09-28"


# ============================================================
# 1. REGISTER DRIVERS IN FIRESTORE
# ============================================================

def register_test_drivers():
    """Create test driver profiles directly in Firestore drivers collection."""
    if db is None:
        print("[Error] Firestore not connected.")
        return []

    print("\n" + "=" * 70)
    print("STEP 1: REGISTERING TEST DRIVERS IN FIRESTORE")
    print("=" * 70)

    now = datetime.now(timezone.utc)
    created_drivers = []

    for tmpl in DRIVER_TEMPLATES:
        driver_id = f"driver_{uuid.uuid4().hex[:8]}"

        driver_data = {
            "name": tmpl["name"],
            "email": f"{tmpl['name'].lower().replace(' ', '.')}@logistics.test",
            "phone": tmpl["phone"],
            "vehicleType": tmpl["vehicleType"],
            "vehicleNumber": tmpl["vehicleNumber"],
            "capacity": tmpl["capacity"],
            "licenseNumber": None,
            "verificationStatus": "unverified",
            "rating": round(random.uniform(3.8, 5.0), 1),
            "totalRatings": random.randint(5, 60),
            "status": "active",
            "createdAt": now,
            "updatedAt": now,
        }

        db.collection("drivers").document(driver_id).set(driver_data)
        created_drivers.append({"driverId": driver_id, **driver_data})

        print(
            f"  [+] Driver: {tmpl['name']:<22} | Vehicle: {tmpl['vehicleType']:<24} "
            f"| Plate: {tmpl['vehicleNumber']:<12} | Capacity: {tmpl['capacity']} units"
        )

    print(f"\n  Total Drivers Created: {len(created_drivers)}")
    return created_drivers


# ============================================================
# 2. CREATE DRIVER ROUTES IN FIRESTORE
# ============================================================

def create_test_routes(drivers: list[dict]):
    """Create driverRoute documents for the registered test drivers."""
    if db is None:
        print("[Error] Firestore not connected.")
        return []

    print("\n" + "=" * 70)
    print("STEP 2: CREATING DRIVER ROUTES IN FIRESTORE")
    print("=" * 70)

    now = datetime.now(timezone.utc)
    created_routes = []

    # Assign corridors to drivers (some drivers may get multiple routes)
    for idx, corridor in enumerate(ROUTE_CORRIDORS):
        driver = drivers[idx % len(drivers)]
        route_id = f"route_{uuid.uuid4().hex[:12]}"

        # Randomize schedule slightly
        dep_hour = random.randint(7, 11)
        arr_hour = dep_hour + random.randint(2, 4)
        capacity = random.randint(
            int(driver["capacity"] * 0.3),
            int(driver["capacity"] * 0.8)
        )
        price = round(random.uniform(800, 3000), 0)

        route_data = {
            "driverId": driver["driverId"],
            "startLocation": corridor["start"],
            "destination": corridor["dest"],
            "stops": corridor["stops"],
            "routeGeometry": None,
            "travelDate": TRAVEL_DATE,
            "departureTime": f"{dep_hour:02d}:00",
            "arrivalTime": f"{arr_hour:02d}:00",
            "availableCapacity": capacity,
            "price": price,
            "status": "active",
            "createdAt": now,
            "updatedAt": now,
        }

        db.collection("driverRoutes").document(route_id).set(route_data)
        created_routes.append({"routeId": route_id, **route_data})

        print(
            f"  [+] Route: {corridor['start']['address']:<22} --> "
            f"{corridor['dest']['address']:<26} | "
            f"Stops: {len(corridor['stops'])} | "
            f"Cap: {capacity} | Rs.{price:.0f} | "
            f"Driver: {driver['name']}"
        )

    print(f"\n  Total Routes Created: {len(created_routes)}")
    return created_routes


# ============================================================
# 3. FETCH TWO USERS FROM FIRESTORE
# ============================================================

def get_two_random_users():
    """Pick two random users from Firestore to act as provider & seeker."""
    if db is None:
        print("[Error] Firestore not connected.")
        return None, None

    print("\n" + "=" * 70)
    print("STEP 3: SELECTING TWO USERS (PROVIDER & SEEKER) FROM FIRESTORE")
    print("=" * 70)

    users_ref = db.collection("users").limit(20).stream()
    users = []
    for doc in users_ref:
        u_data = doc.to_dict()
        u_data["userId"] = doc.id
        users.append(u_data)

    if len(users) < 2:
        print("  [Warning] Less than 2 users found. Creating dummy users...")
        # Create two dummy users if needed
        now = datetime.now(timezone.utc)
        for i in range(2 - len(users)):
            uid = f"user_test_{uuid.uuid4().hex[:6]}"
            loc = random.choice([
                {"address": "Vashi, Navi Mumbai", "latitude": 19.0760, "longitude": 72.9930},
                {"address": "Andheri, Mumbai", "latitude": 19.1136, "longitude": 72.8697},
            ])
            u = {
                "userId": uid,
                "name": f"Test User {i+1}",
                "businessName": f"Test Business {i+1}",
                "location": loc,
                "rating": 4.0,
                "totalRatings": 5,
                "createdAt": now,
                "updatedAt": now,
            }
            db.collection("users").document(uid).set(u)
            users.append(u)

    # Pick two distinct users
    provider = random.choice(users)
    seeker = random.choice([u for u in users if u["userId"] != provider["userId"]] or users)

    p_loc = provider.get("location", {})
    s_loc = seeker.get("location", {})

    print(f"  Provider (Pickup):  {provider.get('businessName', 'N/A')}")
    print(f"    Location:         {p_loc.get('address', 'N/A')} "
          f"(Lat: {p_loc.get('latitude')}, Lng: {p_loc.get('longitude')})")
    print(f"  Seeker (Delivery):  {seeker.get('businessName', 'N/A')}")
    print(f"    Location:         {s_loc.get('address', 'N/A')} "
          f"(Lat: {s_loc.get('latitude')}, Lng: {s_loc.get('longitude')})")

    return provider, seeker


# ============================================================
# 4. TEST THE CP-SAT ROUTE MATCHER
# ============================================================

def test_route_matcher(provider: dict, seeker: dict):
    """Run the matcher with different capacity requirements and display results."""
    if provider is None or seeker is None:
        print("[Error] Cannot test without provider and seeker.")
        return

    print("\n" + "=" * 70)
    print("STEP 4: RUNNING CP-SAT ROUTE MATCHER")
    print("=" * 70)

    pickup_loc = provider.get("location", {})
    delivery_loc = seeker.get("location", {})

    test_cases = [
        {"capacity": 100, "label": "Small load (100 units)"},
        {"capacity": 300, "label": "Medium load (300 units)"},
        {"capacity": 500, "label": "Large load (500 units)"},
    ]

    for tc in test_cases:
        print("\n" + "#" * 80)
        print(f"  TEST: {tc['label']}")
        print(f"  Pickup:   {pickup_loc.get('address', 'N/A')}")
        print(f"  Delivery: {delivery_loc.get('address', 'N/A')}")
        print(f"  Required Capacity: {tc['capacity']} units")
        print(f"  Travel Date: {TRAVEL_DATE}")
        print("#" * 80)

        results = find_best_routes(
            pickup_location=pickup_loc,
            delivery_location=delivery_loc,
            required_capacity=tc["capacity"],
            travel_date=TRAVEL_DATE,
            firestore_db=db,
            max_results=10,
        )

        if not results:
            print("\n  No matching routes found for this scenario.")
            continue

        # Print results table
        print(f"\n  Found {len(results)} matching route(s):\n")
        print(
            "  Rank | Driver Name            | Vehicle              | "
            "Route                                  | Cap   | Rs.Price | "
            "Pickup Det. | Delivery Det. | Overlap | Dir.Valid"
        )
        print("  " + "-" * 155)

        for rank, r in enumerate(results, 1):
            driver = r.get("driver", {})
            d_name = driver.get("name", "N/A")[:22]
            d_vehicle = driver.get("vehicleType", "N/A")[:20]
            start_addr = (r.get("startLocation") or {}).get("address", "?")[:16]
            dest_addr = (r.get("destination") or {}).get("address", "?")[:16]
            route_str = f"{start_addr} -> {dest_addr}"
            cap = r.get("availableCapacity", 0)
            price = r.get("price", 0)
            p_det = r.get("pickup_detour_km", 0)
            d_det = r.get("delivery_detour_km", 0)
            overlap = r.get("routeOverlap", 0)
            dir_valid = "Yes" if r.get("directionallyValid", False) else "No"

            print(
                f"  {rank:<4} | {d_name:<22} | {d_vehicle:<20} | "
                f"{route_str:<38} | {cap:<5} | Rs.{price:<5.0f} | "
                f"{p_det:<5.1f} km    | {d_det:<5.1f} km      | "
                f"{overlap:<7.2f} | {dir_valid}"
            )

        print("  " + "=" * 155)


# ============================================================
# 5. CLEANUP HELPER (Optional)
# ============================================================

def cleanup_test_data(drivers: list[dict], routes: list[dict]):
    """Remove test driver and route documents from Firestore."""
    if db is None:
        return

    print("\n" + "-" * 70)
    print("CLEANUP: Removing test drivers and routes...")

    for d in drivers:
        try:
            db.collection("drivers").document(d["driverId"]).delete()
        except Exception:
            pass

    for r in routes:
        try:
            db.collection("driverRoutes").document(r["routeId"]).delete()
        except Exception:
            pass

    print(f"  Removed {len(drivers)} drivers and {len(routes)} routes.")


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    print("=" * 70)
    print("HOSPITALITY EXCHANGE - LOGISTICS MODULE TEST")
    print("=" * 70)

    # 1. Register drivers
    drivers = register_test_drivers()

    # 2. Create routes
    routes = create_test_routes(drivers)

    # 3. Pick two users
    provider, seeker = get_two_random_users()

    # 4. Run CP-SAT matcher
    test_route_matcher(provider, seeker)

    # 5. Optional cleanup (comment out to keep test data)
    # cleanup_test_data(drivers, routes)

    print("\n" + "=" * 70)
    print("LOGISTICS TEST COMPLETED SUCCESSFULLY")
    print("=" * 70)
