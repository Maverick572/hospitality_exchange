import os
import random
import sys
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
import requests

load_dotenv()

# Add backend directory to path if needed
backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from core.firebase import db
from seeker.search import search_seeker_products


# ============================================================
# CONFIGURATION
# ============================================================

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Sample pools for realistic random generation
SAMPLE_LOCATIONS = [
    {"address": "Sector 17, Vashi, Navi Mumbai", "latitude": 19.0760, "longitude": 72.8777},
    {"address": "Nerul West, Navi Mumbai", "latitude": 19.0330, "longitude": 73.0297},
    {"address": "Ghodbunder Road, Thane", "latitude": 19.2183, "longitude": 72.9781},
    {"address": "CBD Belapur, Navi Mumbai", "latitude": 19.0178, "longitude": 73.0410},
    {"address": "Old Panvel, Navi Mumbai", "latitude": 18.9894, "longitude": 73.1175},
    {"address": "Andheri East, Mumbai", "latitude": 19.1136, "longitude": 72.8697},
    {"address": "Bandra West, Mumbai", "latitude": 19.0596, "longitude": 72.8295},
    {"address": "Dadar West, Mumbai", "latitude": 19.0178, "longitude": 72.8478}
]

BUSINESS_NAME_PREFIXES = [
    "Grand Horizon", "Royal Palms", "Apex", "Elegance", "Metro",
    "Sunrise", "Prestige", "Zenith", "Coastline", "Heritage"
]

BUSINESS_NAME_SUFFIXES = [
    "Banquets & Events", "Hospitality Depot", "Decor & Sound Rentals",
    "Catering Supplies", "Event Solutions", "Party Gear Pvt Ltd"
]

PRODUCT_TEMPLATES = [
    # Furniture
    {
        "name": "Banquet Chairs",
        "category": "furniture",
        "description": "Standard cushioned banquet chairs with covers for formal events.",
        "price_range": (12.0, 25.0),
        "qty_range": (150, 600),
        "pricingUnit": "per_item_per_day"
    },
    {
        "name": "Chiavari Gold Banquet Chairs",
        "category": "furniture",
        "description": "Luxury gold chiavari chairs with comfortable seat cushions.",
        "price_range": (25.0, 45.0),
        "qty_range": (100, 300),
        "pricingUnit": "per_item_per_day"
    },
    {
        "name": "Round Dining Tables",
        "category": "furniture",
        "description": "6ft round wooden banquet dining tables seating 8-10 guests.",
        "price_range": (180.0, 320.0),
        "qty_range": (15, 60),
        "pricingUnit": "per_item_per_day"
    },
    {
        "name": "Rectangular Buffet Tables",
        "category": "furniture",
        "description": "6ft folding buffet display tables with pleated skirting.",
        "price_range": (120.0, 220.0),
        "qty_range": (20, 50),
        "pricingUnit": "per_item_per_day"
    },
    # Audio Visual
    {
        "name": "Wireless Microphones",
        "category": "audio_visual",
        "description": "UHF dual-channel wireless handheld vocal microphones.",
        "price_range": (350.0, 600.0),
        "qty_range": (4, 16),
        "pricingUnit": "per_item_per_day"
    },
    {
        "name": "Stage PA Speakers",
        "category": "audio_visual",
        "description": "1000W active powered PA speakers with heavy-duty tripod stands.",
        "price_range": (800.0, 1500.0),
        "qty_range": (2, 8),
        "pricingUnit": "per_item_per_day"
    },
    # Kitchen & Catering
    {
        "name": "Commercial Induction Cookers",
        "category": "kitchen_equipment",
        "description": "Heavy-duty 3500W commercial tabletop induction stoves.",
        "price_range": (250.0, 450.0),
        "qty_range": (6, 20),
        "pricingUnit": "per_item_per_day"
    },
    {
        "name": "Stainless Steel Chafing Dishes",
        "category": "kitchen_equipment",
        "description": "Roll-top buffet food warmers with food pans and fuel holders.",
        "price_range": (100.0, 200.0),
        "qty_range": (15, 50),
        "pricingUnit": "per_item_per_day"
    }
]


# ============================================================
# 1. RANDOMLY CREATE USERS & PRODUCTS IN FIRESTORE
# ============================================================

def generate_random_users_and_products(num_users: int = 5, products_per_user: int = 3):
    """
    Randomly generates business users/providers and attaches realistic product listings.
    Saves everything directly into Firestore.
    """
    if db is None:
        print("[Error] Firestore client is not connected.")
        return [], []

    print("\n" + "=" * 70)
    print(f"GENERATING {num_users} RANDOM USERS & {num_users * products_per_user} PRODUCTS IN FIRESTORE")
    print("=" * 70)

    now = datetime.now(timezone.utc)
    created_users = []
    created_products = []

    for i in range(num_users):
        u_id = f"user_{uuid.uuid4().hex[:8]}"
        b_prefix = random.choice(BUSINESS_NAME_PREFIXES)
        b_suffix = random.choice(BUSINESS_NAME_SUFFIXES)
        biz_name = f"{b_prefix} {b_suffix}"
        loc = random.choice(SAMPLE_LOCATIONS)
        rating = round(random.uniform(4.0, 5.0), 1)
        total_ratings = random.randint(10, 80)

        user_data = {
            "name": f"{b_prefix} Manager",
            "email": f"contact_{u_id}@hospitality.test",
            "phone": f"+9198{random.randint(10000000, 99999999)}",
            "businessName": biz_name,
            "location": loc,
            "rating": rating,
            "totalRatings": total_ratings,
            "createdAt": now,
            "updatedAt": now
        }

        # Save to Firestore users collection
        db.collection("users").document(u_id).set(user_data)
        created_users.append({"id": u_id, **user_data})
        print(f"\n[+] User: {biz_name} ({u_id})")
        print(f"    Location: {loc['address']} (Lat: {loc['latitude']}, Lng: {loc['longitude']}) | Rating: {rating}*")

        # Pick random distinct product templates for this user
        selected_templates = random.sample(PRODUCT_TEMPLATES, k=min(products_per_user, len(PRODUCT_TEMPLATES)))

        for tmpl in selected_templates:
            p_id = f"prod_{uuid.uuid4().hex[:8]}"
            price = round(random.uniform(tmpl["price_range"][0], tmpl["price_range"][1]), 1)
            total_qty = random.randint(tmpl["qty_range"][0], tmpl["qty_range"][1])
            # Available quantity is between 50% and 100% of total
            avail_qty = random.randint(int(total_qty * 0.5), total_qty)

            prod_data = {
                "providerId": u_id,
                "name": tmpl["name"],
                "category": tmpl["category"],
                "description": tmpl["description"],
                "quantity": total_qty,
                "availableQuantity": avail_qty,
                "price": price,
                "pricingUnit": tmpl["pricingUnit"],
                "location": loc,
                "condition": random.choice(["good", "excellent", "like new"]),
                "status": "active",
                "createdAt": now,
                "updatedAt": now
            }

            # Save to Firestore resources collection
            db.collection("resources").document(p_id).set(prod_data)
            created_products.append({"id": p_id, **prod_data})
            print(f"    - Product: {tmpl['name']:<28} | Rs.{price:.1f}/day | Avail: {avail_qty}/{total_qty}")

    print("\n" + "-" * 70)
    print(f"[SUCCESS] Total Generated: {len(created_users)} Users & {len(created_products)} Products in Firestore.")
    print("=" * 70)

    return created_users, created_products


# ============================================================
# 2. TEST SEEKER MODULE & PRINT RANKED OUTPUTS
# ============================================================

def test_seeker_module():
    """
    Tests the seeker module with realistic natural language queries and prints
    detailed ranked outputs starting with:
      1. Best availability
      2. Lowest price
      3. Nearest location (using product location)
    """
    print("\n" + "=" * 70)
    print("TESTING SEEKER MODULE (LLM PARSER + MULTI-CRITERIA SEARCH)")
    print("=" * 70)

    test_scenarios = [
        {
            "title": "Scenario 1: Banquet Chairs & Dining Tables for Wedding",
            "description": "I need 120 banquet chairs and 12 round dining tables for a wedding event tomorrow.",
            "fromTimestamp": "2026-09-28T10:00:00Z",
            "toTimestamp": "2026-09-28T22:00:00Z",
            "location": {
                "address": "Vashi, Navi Mumbai",
                "latitude": 19.0760,
                "longitude": 72.8777
            }
        },
        {
            "title": "Scenario 2: Sound & Microphone Setup for Conference",
            "description": "Looking for 4 wireless microphones and 2 stage PA speakers for a corporate conference.",
            "fromTimestamp": "2026-09-28T08:00:00Z",
            "toTimestamp": "2026-09-28T18:00:00Z",
            "location": {
                "address": "Nerul, Navi Mumbai",
                "latitude": 19.0330,
                "longitude": 73.0297
            }
        },
        {
            "title": "Scenario 3: Outdoor Catering & Cooking Equipment",
            "description": "Need 6 commercial induction cookers and 15 chafing dishes for a buffet dinner.",
            "fromTimestamp": "2026-09-28T14:00:00Z",
            "toTimestamp": "2026-09-28T23:00:00Z",
            "location": {
                "address": "Thane, Mumbai",
                "latitude": 19.2183,
                "longitude": 72.9781
            }
        }
    ]

    for idx, scenario in enumerate(test_scenarios, 1):
        print("\n" + "#" * 80)
        print(f"[{idx}/{len(test_scenarios)}] {scenario['title'].upper()}")
        print("#" * 80)
        print(f"Seeker Query:      \"{scenario['description']}\"")
        print(f"Period:            {scenario['fromTimestamp']}  -->  {scenario['toTimestamp']}")
        print(f"Seeker Location:   {scenario['location']['address']} (Lat: {scenario['location']['latitude']}, Lng: {scenario['location']['longitude']})")

        # Execute Search via HTTP API (or fallback to seeker module)
        response_data = None
        try:
            res = requests.post(
                f"{BASE_URL}/seeker/search",
                json={
                    "description": scenario["description"],
                    "fromTimestamp": scenario["fromTimestamp"],
                    "toTimestamp": scenario["toTimestamp"],
                    "location": scenario["location"]
                },
                timeout=15
            )
            if res.status_code == 200:
                response_data = res.json().get("data")
        except Exception:
            pass

        # Fallback to direct Python invocation if server is not reachable
        if not response_data:
            response_data = search_seeker_products(
                description=scenario["description"],
                from_timestamp=scenario["fromTimestamp"],
                to_timestamp=scenario["toTimestamp"],
                seeker_location=scenario["location"],
                firestore_db=db
            )

        # 1. Print LLM Parsed Requirements
        print("\n--- [A] LLM PARSED REQUIREMENTS ---")
        parsed_items = response_data.get("parsedItems", [])
        if parsed_items:
            for p_item in parsed_items:
                print(f"  * Item: {p_item.get('name'):<18} | Quantity: {p_item.get('quantity')} {p_item.get('metric')} | Category: {p_item.get('category')}")
        else:
            print("  (No discrete items parsed)")

        # 2. Print Ranked Products
        products = response_data.get("products", [])
        total_matches = response_data.get("totalMatches", len(products))
        print(f"\n--- [B] MATCHED & RANKED PRODUCTS ({total_matches} Found) ---")
        print("Rank | Product Name                 | Price       | Avail / Total | Distance  | Provider Business Name (Location)")
        print("-" * 105)

        if not products:
            print("  No matching products found in Firestore.")
        else:
            for rank, prod in enumerate(products, 1):
                p_name = prod.get("name", "N/A")[:28]
                price_str = f"Rs.{prod.get('price', 0):.1f}/{prod.get('pricingUnit', 'day')[:3]}"
                avail_str = f"{prod.get('availableQuantity')}/{prod.get('quantity')}"
                dist_str = f"{prod.get('distanceKm', 0.0):.1f} km"
                prov_name = prod.get("provider", {}).get("businessName", "N/A")[:24]
                p_loc = prod.get("location", {}).get("address", "")[:25]

                print(f" {rank:<3} | {p_name:<28} | {price_str:<11} | {avail_str:<13} | {dist_str:<9} | {prov_name} ({p_loc})")

        print("=" * 105)


# ============================================================
# MAIN EXECUTION
# ============================================================

if __name__ == "__main__":
    print("=" * 70)
    print("HOSPITALITY RESOURCE EXCHANGE - DYNAMIC SEEKER TEST")
    print("=" * 70)

    # 1. Randomly create Users & Products in Firestore
    generate_random_users_and_products(num_users=5, products_per_user=4)

    # 2. Test Seeker Module & Display Ranked Output
    test_seeker_module()

    print("\n" + "=" * 70)
    print("SEEKER DEMONSTRATION COMPLETED SUCCESSFULLY")
    print("=" * 70)