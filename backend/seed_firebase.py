"""
Firebase Seed Script
====================
Populates Firestore with realistic demo data for the Hospitality Resource
Exchange platform. All locations are real OSM-sourced coordinates in Mumbai.

5 Vendors (Providers) — hospitality businesses with surplus inventory
5 Buyers (Seekers) — businesses that need resources temporarily
2 Drivers — transport operators with active routes across Mumbai

Run:
    cd backend
    python seed_firebase.py
"""

import os
import sys
import uuid
from datetime import datetime, timezone, timedelta

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from core.firebase import db

if db is None:
    print("[FATAL] Could not connect to Firestore. Check credentials.")
    sys.exit(1)


# ============================================================
# Deterministic IDs
# ============================================================

def uid(prefix: str, slug: str) -> str:
    return f"{prefix}_{slug}"


NOW = datetime.now(timezone.utc)
TODAY = NOW.strftime("%Y-%m-%d")
TOMORROW = (NOW + timedelta(days=1)).strftime("%Y-%m-%d")
DAY_AFTER = (NOW + timedelta(days=2)).strftime("%Y-%m-%d")
NEXT_WEEK = (NOW + timedelta(days=7)).strftime("%Y-%m-%d")


# ============================================================
# 5 VENDOR (PROVIDER) BUSINESSES — real Mumbai locations (OSM)
# ============================================================

VENDORS = [
    {
        "userId": uid("usr", "taj_lands_end"),
        "name": "Suresh Nair",
        "email": "ops@tajlandsend.demo",
        "phone": "+91 22 6668 1234",
        "businessName": "Taj Lands End",
        "location": {
            "address": "Taj Lands End, Byramji Jeejeebhoy Road, Band Stand, Bandra West, Mumbai 400050",
            "latitude": 19.0440,
            "longitude": 72.8210,
        },
        "profileImage": None,
        "rating": 4.9,
        "totalRatings": 58,
    },
    {
        "userId": uid("usr", "itc_maratha"),
        "name": "Amit Kulkarni",
        "email": "banquets@itcmaratha.demo",
        "phone": "+91 22 2830 3030",
        "businessName": "ITC Maratha Mumbai",
        "location": {
            "address": "ITC Maratha, Sahar Airport Road, Andheri East, Mumbai 400099",
            "latitude": 19.0992,
            "longitude": 72.8722,
        },
        "profileImage": None,
        "rating": 4.85,
        "totalRatings": 42,
    },
    {
        "userId": uid("usr", "trident_bkc"),
        "name": "Priya Mehta",
        "email": "events@tridentbkc.demo",
        "phone": "+91 22 6672 8888",
        "businessName": "Trident Hotel BKC",
        "location": {
            "address": "Trident Hotel, G Block, Bandra Kurla Complex, Mumbai 400098",
            "latitude": 19.0636,
            "longitude": 72.8681,
        },
        "profileImage": None,
        "rating": 4.88,
        "totalRatings": 35,
    },
    {
        "userId": uid("usr", "renaissance_powai"),
        "name": "Vikram Joshi",
        "email": "f&b@renaissancepowai.demo",
        "phone": "+91 22 6692 0000",
        "businessName": "Renaissance Mumbai Convention Centre",
        "location": {
            "address": "Renaissance Mumbai, Near Powai Lake, Andheri East, Mumbai 400087",
            "latitude": 19.1161,
            "longitude": 72.9080,
        },
        "profileImage": None,
        "rating": 4.78,
        "totalRatings": 29,
    },
    {
        "userId": uid("usr", "sahara_star"),
        "name": "Ritu Sharma",
        "email": "procurement@saharastar.demo",
        "phone": "+91 22 3989 8989",
        "businessName": "Hotel Sahara Star",
        "location": {
            "address": "Hotel Sahara Star, Domestic Airport, Vile Parle East, Mumbai 400099",
            "latitude": 19.0963,
            "longitude": 72.8528,
        },
        "profileImage": None,
        "rating": 4.72,
        "totalRatings": 31,
    },
]

# ============================================================
# 5 BUYER (SEEKER) BUSINESSES — real Mumbai locations (OSM)
# ============================================================

BUYERS = [
    {
        "userId": uid("usr", "jio_convention"),
        "name": "Rahul Deshmukh",
        "email": "events@jioconvention.demo",
        "phone": "+91 22 3570 0000",
        "businessName": "Jio World Convention Centre",
        "location": {
            "address": "Jio World Centre, G Block, Bandra Kurla Complex, Mumbai 400098",
            "latitude": 19.0588,
            "longitude": 72.8653,
        },
        "profileImage": None,
        "rating": 4.95,
        "totalRatings": 22,
    },
    {
        "userId": uid("usr", "bombay_gymkhana"),
        "name": "Kavita Iyer",
        "email": "secretary@bombaygymkhana.demo",
        "phone": "+91 22 2283 6555",
        "businessName": "Bombay Gymkhana Club",
        "location": {
            "address": "Bombay Gymkhana, Mahatma Gandhi Road, Fort, Mumbai 400001",
            "latitude": 18.9327,
            "longitude": 72.8316,
        },
        "profileImage": None,
        "rating": 4.80,
        "totalRatings": 18,
    },
    {
        "userId": uid("usr", "nesco_goregaon"),
        "name": "Deepak Patil",
        "email": "admin@nesco.demo",
        "phone": "+91 22 6645 0000",
        "businessName": "NESCO Exhibition Centre",
        "location": {
            "address": "Bombay Exhibition Centre (NESCO), Western Express Highway, Goregaon East, Mumbai 400063",
            "latitude": 19.1545,
            "longitude": 72.8560,
        },
        "profileImage": None,
        "rating": 4.65,
        "totalRatings": 14,
    },
    {
        "userId": uid("usr", "taj_colaba"),
        "name": "Anjali Shah",
        "email": "concierge@tajpalace.demo",
        "phone": "+91 22 6665 3366",
        "businessName": "The Taj Mahal Palace",
        "location": {
            "address": "The Taj Mahal Palace, Apollo Bunder, Colaba, Mumbai 400001",
            "latitude": 18.9217,
            "longitude": 72.8332,
        },
        "profileImage": None,
        "rating": 4.97,
        "totalRatings": 91,
    },
    {
        "userId": uid("usr", "blue_sea_worli"),
        "name": "Manish Kapoor",
        "email": "banquets@bluesea.demo",
        "phone": "+91 22 2438 8888",
        "businessName": "Blue Sea Banquets Worli",
        "location": {
            "address": "Blue Sea Banquets, Dr Annie Besant Road, Worli, Mumbai 400018",
            "latitude": 19.0144,
            "longitude": 72.8159,
        },
        "profileImage": None,
        "rating": 4.70,
        "totalRatings": 25,
    },
]


# ============================================================
# RESOURCES — Each vendor provides different categories
# ============================================================

RESOURCES = [
    # --- Vendor 1: Taj Lands End (Bandra) → Seating & Linen ---
    {
        "resourceId": uid("res", "taj_chairs"),
        "providerId": uid("usr", "taj_lands_end"),
        "name": "Gold Chiavari Banquet Chairs",
        "category": "banquet_seating",
        "description": "Premium beechwood Chiavari chairs with ivory cushions. Stackable, stain-resistant. Ideal for weddings, galas and VIP corporate events.",
        "quantity": 400,
        "availableQuantity": 300,
        "price": 120,
        "pricingUnit": "per_item_per_day",
        "location": {
            "address": "Taj Lands End, Band Stand, Bandra West, Mumbai 400050",
            "latitude": 19.0440,
            "longitude": 72.8210,
        },
        "availability": [
            {"date": TODAY, "quantity": 300},
            {"date": TOMORROW, "quantity": 300},
            {"date": DAY_AFTER, "quantity": 250},
        ],
        "images": ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80"],
        "condition": "excellent",
        "status": "active",
    },
    {
        "resourceId": uid("res", "taj_linen"),
        "providerId": uid("usr", "taj_lands_end"),
        "name": "Damask Table Linen Sets (10-seater rounds)",
        "category": "linen_textiles",
        "description": "Premium white damask tablecloths with matching napkins for 10-seater round tables. Professionally laundered after each rental.",
        "quantity": 80,
        "availableQuantity": 60,
        "price": 250,
        "pricingUnit": "per_item_per_day",
        "location": {
            "address": "Taj Lands End, Band Stand, Bandra West, Mumbai 400050",
            "latitude": 19.0440,
            "longitude": 72.8210,
        },
        "availability": [
            {"date": TODAY, "quantity": 60},
            {"date": TOMORROW, "quantity": 55},
        ],
        "images": ["https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80"],
        "condition": "excellent",
        "status": "active",
    },

    # --- Vendor 2: ITC Maratha (Andheri) → Kitchen & Cooking ---
    {
        "resourceId": uid("res", "itc_chafing"),
        "providerId": uid("usr", "itc_maratha"),
        "name": "Stainless Steel Roll-Top Chafing Dishes (9L)",
        "category": "buffet_serving",
        "description": "Mirror-polished food-grade stainless steel chafing dishes with hydraulic soft-closing lids. Induction compatible. Seats 300 covers.",
        "quantity": 60,
        "availableQuantity": 45,
        "price": 350,
        "pricingUnit": "per_item_per_day",
        "location": {
            "address": "ITC Maratha, Sahar Airport Road, Andheri East, Mumbai 400099",
            "latitude": 19.0992,
            "longitude": 72.8722,
        },
        "availability": [
            {"date": TODAY, "quantity": 45},
            {"date": TOMORROW, "quantity": 40},
        ],
        "images": ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"],
        "condition": "excellent",
        "status": "active",
    },
    {
        "resourceId": uid("res", "itc_tandoor"),
        "providerId": uid("usr", "itc_maratha"),
        "name": "Commercial Tandoor Oven (Gas-fired, Clay-lined)",
        "category": "cooking_equipment",
        "description": "Professional-grade gas tandoor with thermostat control. 350°C max. Suitable for naan, kebabs and tandoori preparations. Includes chimney hood.",
        "quantity": 4,
        "availableQuantity": 2,
        "price": 5500,
        "pricingUnit": "per_item_per_day",
        "location": {
            "address": "ITC Maratha, Sahar Airport Road, Andheri East, Mumbai 400099",
            "latitude": 19.0992,
            "longitude": 72.8722,
        },
        "availability": [
            {"date": TODAY, "quantity": 2},
            {"date": TOMORROW, "quantity": 2},
        ],
        "images": ["https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80"],
        "condition": "good",
        "status": "active",
    },

    # --- Vendor 3: Trident BKC → AV & Display ---
    {
        "resourceId": uid("res", "trident_led_wall"),
        "providerId": uid("usr", "trident_bkc"),
        "name": "4K LED Video Wall (16×9, 12ft × 6.75ft)",
        "category": "visual_display",
        "description": "Seamless 4K LED video wall with P2.5 pixel pitch. Includes HDMI splitter, controller box, rigging truss, and on-site technician for setup.",
        "quantity": 2,
        "availableQuantity": 1,
        "price": 28000,
        "pricingUnit": "per_item_per_day",
        "location": {
            "address": "Trident Hotel, G Block, BKC, Mumbai 400098",
            "latitude": 19.0636,
            "longitude": 72.8681,
        },
        "availability": [
            {"date": TOMORROW, "quantity": 1},
            {"date": DAY_AFTER, "quantity": 2},
        ],
        "images": ["https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80"],
        "condition": "excellent",
        "status": "active",
    },
    {
        "resourceId": uid("res", "trident_pa_system"),
        "providerId": uid("usr", "trident_bkc"),
        "name": "JBL VTX Line Array PA System (8-stack + Subs)",
        "category": "sound_system",
        "description": "Professional concert-grade line array. 8 × VTX V20 tops + 4 × S28 subs. Includes Crown amplifiers, mixing console, and wireless mics.",
        "quantity": 2,
        "availableQuantity": 1,
        "price": 18000,
        "pricingUnit": "per_item_per_day",
        "location": {
            "address": "Trident Hotel, G Block, BKC, Mumbai 400098",
            "latitude": 19.0636,
            "longitude": 72.8681,
        },
        "availability": [
            {"date": TOMORROW, "quantity": 1},
            {"date": DAY_AFTER, "quantity": 2},
        ],
        "images": ["https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80"],
        "condition": "excellent",
        "status": "active",
    },

    # --- Vendor 4: Renaissance Powai → Tables & Staging ---
    {
        "resourceId": uid("res", "renaissance_tables"),
        "providerId": uid("usr", "renaissance_powai"),
        "name": "6ft Round Banquet Tables (seats 10, folding)",
        "category": "tables",
        "description": "Solid plywood top with steel folding legs. Includes fitted tablecloth. Can seat 10 comfortably for formal banquet settings.",
        "quantity": 50,
        "availableQuantity": 35,
        "price": 650,
        "pricingUnit": "per_item_per_day",
        "location": {
            "address": "Renaissance Mumbai, Powai, Andheri East, Mumbai 400087",
            "latitude": 19.1161,
            "longitude": 72.9080,
        },
        "availability": [
            {"date": TODAY, "quantity": 35},
            {"date": TOMORROW, "quantity": 30},
        ],
        "images": ["https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"],
        "condition": "good",
        "status": "active",
    },
    {
        "resourceId": uid("res", "renaissance_stage"),
        "providerId": uid("usr", "renaissance_powai"),
        "name": "Modular Stage Platform (4ft × 8ft sections)",
        "category": "staging_structures",
        "description": "Aluminium-frame modular stage. Each section is 4×8ft, adjustable height 12-48 inches. Non-slip carpet top. Includes skirting.",
        "quantity": 12,
        "availableQuantity": 8,
        "price": 3500,
        "pricingUnit": "per_item_per_day",
        "location": {
            "address": "Renaissance Mumbai, Powai, Andheri East, Mumbai 400087",
            "latitude": 19.1161,
            "longitude": 72.9080,
        },
        "availability": [
            {"date": TOMORROW, "quantity": 8},
            {"date": DAY_AFTER, "quantity": 10},
        ],
        "images": ["https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80"],
        "condition": "good",
        "status": "active",
    },

    # --- Vendor 5: Hotel Sahara Star → Refrigeration & Crockery ---
    {
        "resourceId": uid("res", "sahara_freezer"),
        "providerId": uid("usr", "sahara_star"),
        "name": "Mobile Walk-In Cold Room Trailer (-2°C to +8°C)",
        "category": "refrigeration",
        "description": "12ft towable refrigerated storage trailer. Built-in backup generator. Suitable for seafood, dairy, pastry cold-chain. 3-phase plug.",
        "quantity": 3,
        "availableQuantity": 2,
        "price": 8500,
        "pricingUnit": "per_item_per_day",
        "location": {
            "address": "Hotel Sahara Star, Domestic Airport, Vile Parle East, Mumbai 400099",
            "latitude": 19.0963,
            "longitude": 72.8528,
        },
        "availability": [
            {"date": TODAY, "quantity": 2},
            {"date": TOMORROW, "quantity": 2},
        ],
        "images": ["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80"],
        "condition": "good",
        "status": "active",
    },
    {
        "resourceId": uid("res", "sahara_crockery"),
        "providerId": uid("usr", "sahara_star"),
        "name": "Fine Bone China Dinner Sets (12-piece, gold rim)",
        "category": "crockery_glassware",
        "description": "Complete 12-piece dinner set: dinner plate, side plate, soup bowl, dessert bowl, cup, saucer. Gold-rim bone china, dishwasher safe.",
        "quantity": 200,
        "availableQuantity": 150,
        "price": 80,
        "pricingUnit": "per_item_per_day",
        "location": {
            "address": "Hotel Sahara Star, Domestic Airport, Vile Parle East, Mumbai 400099",
            "latitude": 19.0963,
            "longitude": 72.8528,
        },
        "availability": [
            {"date": TODAY, "quantity": 150},
            {"date": TOMORROW, "quantity": 120},
        ],
        "images": ["https://images.unsplash.com/photo-1551887196-72e32bfc7bf3?auto=format&fit=crop&w=800&q=80"],
        "condition": "excellent",
        "status": "active",
    },
]


# ============================================================
# REQUIREMENTS — What each buyer needs
# ============================================================

REQUIREMENTS = [
    {
        "requirementId": uid("req", "jio_gala"),
        "seekerId": uid("usr", "jio_convention"),
        "description": "I need 250 banquet chairs, 25 round tables, and a 4K LED video wall for a 3-day tech summit gala dinner in BKC",
        "items": [
            {"category": "banquet_seating", "name": "Banquet Chairs", "quantity": 250, "unit": "units"},
            {"category": "tables", "name": "Round Tables", "quantity": 25, "unit": "units"},
            {"category": "visual_display", "name": "4K LED Video Wall", "quantity": 1, "unit": "units"},
        ],
        "location": {
            "address": "Jio World Centre, G Block, BKC, Mumbai 400098",
            "latitude": 19.0588,
            "longitude": 72.8653,
        },
        "requiredDate": TOMORROW,
        "startTime": "10:00",
        "endTime": "22:00",
        "budget": 125000,
        "deliveryRequired": True,
        "status": "active",
    },
    {
        "requirementId": uid("req", "gymkhana_dinner"),
        "seekerId": uid("usr", "bombay_gymkhana"),
        "description": "We need 30 chafing dishes, 150 fine china dinner sets, and table linen for 150 guests at our annual awards dinner",
        "items": [
            {"category": "buffet_serving", "name": "Chafing Dishes", "quantity": 30, "unit": "units"},
            {"category": "crockery_glassware", "name": "Fine China Dinner Sets", "quantity": 150, "unit": "units"},
            {"category": "linen_textiles", "name": "Table Linen Sets", "quantity": 15, "unit": "units"},
        ],
        "location": {
            "address": "Bombay Gymkhana, MG Road, Fort, Mumbai 400001",
            "latitude": 18.9327,
            "longitude": 72.8316,
        },
        "requiredDate": TOMORROW,
        "startTime": "17:00",
        "endTime": "23:00",
        "budget": 45000,
        "deliveryRequired": True,
        "status": "active",
    },
    {
        "requirementId": uid("req", "nesco_expo"),
        "seekerId": uid("usr", "nesco_goregaon"),
        "description": "Need 8 modular stage sections, PA system with line array, and 2 commercial tandoor ovens for food fest expo stalls",
        "items": [
            {"category": "staging_structures", "name": "Modular Stage Sections", "quantity": 8, "unit": "units"},
            {"category": "sound_system", "name": "PA System Line Array", "quantity": 1, "unit": "units"},
            {"category": "cooking_equipment", "name": "Commercial Tandoor Oven", "quantity": 2, "unit": "units"},
        ],
        "location": {
            "address": "NESCO Exhibition Centre, Goregaon East, Mumbai 400063",
            "latitude": 19.1545,
            "longitude": 72.8560,
        },
        "requiredDate": DAY_AFTER,
        "startTime": "08:00",
        "endTime": "21:00",
        "budget": 85000,
        "deliveryRequired": True,
        "status": "active",
    },
    {
        "requirementId": uid("req", "taj_colaba_event"),
        "seekerId": uid("usr", "taj_colaba"),
        "description": "Require 2 walk-in cold room trailers and 200 banquet chairs for a seafood festival at Gateway of India lawns",
        "items": [
            {"category": "refrigeration", "name": "Mobile Cold Room Trailer", "quantity": 2, "unit": "units"},
            {"category": "banquet_seating", "name": "Banquet Chairs", "quantity": 200, "unit": "units"},
        ],
        "location": {
            "address": "The Taj Mahal Palace, Apollo Bunder, Colaba, Mumbai 400001",
            "latitude": 18.9217,
            "longitude": 72.8332,
        },
        "requiredDate": TOMORROW,
        "startTime": "12:00",
        "endTime": "23:00",
        "budget": 60000,
        "deliveryRequired": True,
        "status": "active",
    },
    {
        "requirementId": uid("req", "worli_cocktail"),
        "seekerId": uid("usr", "blue_sea_worli"),
        "description": "Need 100 banquet chairs, 10 round tables, and 80 fine china sets for a rooftop cocktail reception",
        "items": [
            {"category": "banquet_seating", "name": "Banquet Chairs", "quantity": 100, "unit": "units"},
            {"category": "tables", "name": "Round Tables", "quantity": 10, "unit": "units"},
            {"category": "crockery_glassware", "name": "Fine China Sets", "quantity": 80, "unit": "units"},
        ],
        "location": {
            "address": "Blue Sea Banquets, Dr Annie Besant Road, Worli, Mumbai 400018",
            "latitude": 19.0144,
            "longitude": 72.8159,
        },
        "requiredDate": TOMORROW,
        "startTime": "18:00",
        "endTime": "23:30",
        "budget": 40000,
        "deliveryRequired": True,
        "status": "active",
    },
]


# ============================================================
# DRIVERS & ROUTES
# ============================================================

# ============================================================
# DRIVERS & ROUTES (REALISTIC VEHICLE CAPACITIES & MUMBAI CORRIDORS)
# ============================================================
# Units are defined as standard event units (1 unit = 1 banquet chair
# or equivalent crate ~5-7kg, ~1.5 cu ft). Realistic payload and cargo limits:
# - Piaggio Ape (3-Wheeler Tempo): 25 total units (~350 kg safe load), 20 spare
# - Tata Ace ("Chhota Hathi"): 50 total units (~700 kg payload), 35-45 spare
# - Mahindra Bolero Maxi / Pickup: 80 total units (~1.2 ton payload), 55-60 spare
# - Ashok Leyland Bada Dost: 100 total units (~1.6 ton payload), 70 spare
# - Tata 407 SFC (Medium LCV): 150 total units (~2.5 ton payload), 100 spare
# - Eicher Pro 2049 (14-ft Truck): 220 total units (~3.5 ton payload), 140 spare

DRIVERS = [
    {
        "driverId": uid("drv", "amit_deshmukh"),
        "name": "Amit Deshmukh",
        "email": "amit.tempo@demo.com",
        "phone": "+91 98201 11223",
        "vehicleType": "Piaggio Ape 3-Wheeler Tempo",
        "vehicleNumber": "MH-02-GH-3456",
        "capacity": 25,
        "rating": 4.82,
        "totalRatings": 89,
        "status": "active",
    },
    {
        "driverId": uid("drv", "sunil_yadav"),
        "name": "Sunil Yadav",
        "email": "sunil.transport@demo.com",
        "phone": "+91 98203 55667",
        "vehicleType": "Mahindra Bolero Maxi Truck",
        "vehicleNumber": "MH-04-EK-7732",
        "capacity": 80,
        "rating": 4.75,
        "totalRatings": 67,
        "status": "active",
    },
    {
        "driverId": uid("drv", "ramesh_pawar"),
        "name": "Ramesh Pawar",
        "email": "ramesh.logistics@demo.com",
        "phone": "+91 97690 12345",
        "vehicleType": "Tata Ace Gold",
        "vehicleNumber": "MH-02-DN-4821",
        "capacity": 50,
        "rating": 4.88,
        "totalRatings": 112,
        "status": "active",
    },
    {
        "driverId": uid("drv", "ganesh_shinde"),
        "name": "Ganesh Shinde",
        "email": "ganesh.shinde@demo.com",
        "phone": "+91 98190 23456",
        "vehicleType": "Tata 407 SFC LCV",
        "vehicleNumber": "MH-03-CB-9140",
        "capacity": 150,
        "rating": 4.91,
        "totalRatings": 145,
        "status": "active",
    },
    {
        "driverId": uid("drv", "mohammad_rafiq"),
        "name": "Mohammad Rafiq",
        "email": "rafiq.logistics@demo.com",
        "phone": "+91 98330 34567",
        "vehicleType": "Mahindra Bolero City Pickup",
        "vehicleNumber": "MH-01-AZ-6218",
        "capacity": 80,
        "rating": 4.79,
        "totalRatings": 78,
        "status": "active",
    },
    {
        "driverId": uid("drv", "sanjay_varma"),
        "name": "Sanjay Varma",
        "email": "sanjay.varma@demo.com",
        "phone": "+91 98670 45678",
        "vehicleType": "Tata Ace EV Eco-Carrier",
        "vehicleNumber": "MH-47-AB-5190",
        "capacity": 50,
        "rating": 4.85,
        "totalRatings": 94,
        "status": "active",
    },
    {
        "driverId": uid("drv", "pradeep_patil"),
        "name": "Pradeep Patil",
        "email": "pradeep.transport@demo.com",
        "phone": "+91 98920 56789",
        "vehicleType": "Ashok Leyland Bada Dost",
        "vehicleNumber": "MH-43-BP-8812",
        "capacity": 100,
        "rating": 4.83,
        "totalRatings": 103,
        "status": "active",
    },
    {
        "driverId": uid("drv", "vikram_salvi"),
        "name": "Vikram Salvi",
        "email": "vikram.salvi@demo.com",
        "phone": "+91 98210 67890",
        "vehicleType": "Eicher Pro 2049 Light Truck",
        "vehicleNumber": "MH-04-GZ-2309",
        "capacity": 220,
        "rating": 4.93,
        "totalRatings": 168,
        "status": "active",
    },
]

DRIVER_ROUTES = [
    # Route 1: Amit Deshmukh (Piaggio Ape) - Bandra to Panvel via Kurla
    {
        "routeId": uid("route", "bandra_to_panvel_ape"),
        "driverId": uid("drv", "amit_deshmukh"),
        "startLocation": {
            "address": "Bandra West, Mumbai 400050",
            "latitude": 19.0596,
            "longitude": 72.8295,
        },
        "destination": {
            "address": "Panvel, Navi Mumbai 410206",
            "latitude": 18.9894,
            "longitude": 73.1175,
        },
        "stops": [
            {"address": "Kurla West, Mumbai 400070", "latitude": 19.0726, "longitude": 72.8793},
            {"address": "Ghatkopar West, Mumbai 400086", "latitude": 19.0860, "longitude": 72.9080},
        ],
        "routeGeometry": None,
        "travelDate": TOMORROW,
        "departureTime": "08:30",
        "arrivalTime": "11:30",
        "availableCapacity": 20,
        "price": 650,
        "status": "active",
    },
    # Route 2: Sunil Yadav (Mahindra Bolero) - Andheri to BKC via Bandra
    {
        "routeId": uid("route", "andheri_to_bkc_bolero"),
        "driverId": uid("drv", "sunil_yadav"),
        "startLocation": {
            "address": "ITC Maratha Loading Bay, Sahar Road, Andheri East, Mumbai 400099",
            "latitude": 19.0992,
            "longitude": 72.8722,
        },
        "destination": {
            "address": "Jio World Centre, G Block, BKC, Mumbai 400098",
            "latitude": 19.0588,
            "longitude": 72.8653,
        },
        "stops": [
            {"address": "Hotel Sahara Star, Vile Parle East, Mumbai 400099", "latitude": 19.0963, "longitude": 72.8528},
            {"address": "Taj Lands End, Band Stand, Bandra West, Mumbai 400050", "latitude": 19.0440, "longitude": 72.8210},
        ],
        "routeGeometry": None,
        "travelDate": TOMORROW,
        "departureTime": "09:30",
        "arrivalTime": "12:00",
        "availableCapacity": 60,
        "price": 950,
        "status": "active",
    },
    # Route 3: Ramesh Pawar (Tata Ace) - BKC to Colaba via Lower Parel & Worli
    {
        "routeId": uid("route", "bkc_to_colaba_ace"),
        "driverId": uid("drv", "ramesh_pawar"),
        "startLocation": {
            "address": "BKC Transport Hub, Bandra East, Mumbai 400098",
            "latitude": 19.0650,
            "longitude": 72.8620,
        },
        "destination": {
            "address": "Colaba Bus Depot, Shahid Bhagat Singh Road, Colaba, Mumbai 400005",
            "latitude": 18.9167,
            "longitude": 72.8280,
        },
        "stops": [
            {"address": "Lower Parel, Dr E Moses Road, Mumbai 400013", "latitude": 18.9928, "longitude": 72.8307},
            {"address": "Worli Sea Face, Mumbai 400018", "latitude": 19.0144, "longitude": 72.8159},
        ],
        "routeGeometry": None,
        "travelDate": TOMORROW,
        "departureTime": "10:00",
        "arrivalTime": "12:45",
        "availableCapacity": 45,
        "price": 850,
        "status": "active",
    },
    # Route 4: Ganesh Shinde (Tata 407 LCV) - Goregaon to Fort via Bandra & Dadar
    {
        "routeId": uid("route", "goregaon_to_fort_407"),
        "driverId": uid("drv", "ganesh_shinde"),
        "startLocation": {
            "address": "NESCO Exhibition Centre, Western Express Highway, Goregaon East, Mumbai 400063",
            "latitude": 19.1545,
            "longitude": 72.8560,
        },
        "destination": {
            "address": "Bombay Gymkhana, MG Road, Fort, Mumbai 400001",
            "latitude": 18.9327,
            "longitude": 72.8316,
        },
        "stops": [
            {"address": "Andheri East Junction, Mumbai 400069", "latitude": 19.1136, "longitude": 72.8697},
            {"address": "Taj Lands End, Band Stand, Bandra West, Mumbai 400050", "latitude": 19.0440, "longitude": 72.8210},
            {"address": "Dadar West, Plaza Cinema, Mumbai 400028", "latitude": 19.0178, "longitude": 72.8478},
        ],
        "routeGeometry": None,
        "travelDate": TOMORROW,
        "departureTime": "09:00",
        "arrivalTime": "12:15",
        "availableCapacity": 100,
        "price": 1450,
        "status": "active",
    },
    # Route 5: Mohammad Rafiq (Mahindra Bolero) - Powai to Worli via BKC
    {
        "routeId": uid("route", "powai_to_worli_bolero"),
        "driverId": uid("drv", "mohammad_rafiq"),
        "startLocation": {
            "address": "Renaissance Mumbai, Near Powai Lake, Mumbai 400087",
            "latitude": 19.1161,
            "longitude": 72.9080,
        },
        "destination": {
            "address": "Blue Sea Banquets, Dr Annie Besant Road, Worli, Mumbai 400018",
            "latitude": 19.0144,
            "longitude": 72.8159,
        },
        "stops": [
            {"address": "JVLR Junction, Andheri East, Mumbai 400093", "latitude": 19.1185, "longitude": 72.8770},
            {"address": "Jio World Centre, BKC, Mumbai 400098", "latitude": 19.0588, "longitude": 72.8653},
        ],
        "routeGeometry": None,
        "travelDate": TOMORROW,
        "departureTime": "10:30",
        "arrivalTime": "12:50",
        "availableCapacity": 55,
        "price": 900,
        "status": "active",
    },
    # Route 6: Sanjay Varma (Tata Ace EV) - Dadar West to Colaba
    {
        "routeId": uid("route", "dadar_to_colaba_ace_ev"),
        "driverId": uid("drv", "sanjay_varma"),
        "startLocation": {
            "address": "Dadar West Flower Market, Mumbai 400028",
            "latitude": 19.0178,
            "longitude": 72.8478,
        },
        "destination": {
            "address": "The Taj Mahal Palace, Apollo Bunder, Colaba, Mumbai 400001",
            "latitude": 18.9217,
            "longitude": 72.8332,
        },
        "stops": [
            {"address": "Mahalaxmi Station, Dr E Moses Road, Mumbai 400011", "latitude": 18.9822, "longitude": 72.8242},
            {"address": "Churchgate Station, Veer Nariman Road, Mumbai 400020", "latitude": 18.9350, "longitude": 72.8272},
        ],
        "routeGeometry": None,
        "travelDate": TOMORROW,
        "departureTime": "11:00",
        "arrivalTime": "12:30",
        "availableCapacity": 35,
        "price": 750,
        "status": "active",
    },
    # Route 7: Pradeep Patil (Ashok Leyland Bada Dost) - Thane to BKC
    {
        "routeId": uid("route", "thane_to_bkc_dost"),
        "driverId": uid("drv", "pradeep_patil"),
        "startLocation": {
            "address": "Thane Station West, Thane 400601",
            "latitude": 19.1860,
            "longitude": 72.9757,
        },
        "destination": {
            "address": "Jio World Centre, G Block, BKC, Mumbai 400098",
            "latitude": 19.0588,
            "longitude": 72.8653,
        },
        "stops": [
            {"address": "Mulund Check Naka, Mumbai 400080", "latitude": 19.1726, "longitude": 72.9569},
            {"address": "Ghatkopar East, Mumbai 400077", "latitude": 19.0860, "longitude": 72.9080},
            {"address": "Kurla CST Road, Mumbai 400070", "latitude": 19.0726, "longitude": 72.8793},
        ],
        "routeGeometry": None,
        "travelDate": TOMORROW,
        "departureTime": "08:00",
        "arrivalTime": "10:45",
        "availableCapacity": 70,
        "price": 1100,
        "status": "active",
    },
    # Route 8: Vikram Salvi (Eicher Pro 2049) - Borivali to Bandra West
    {
        "routeId": uid("route", "borivali_to_bandra_eicher"),
        "driverId": uid("drv", "vikram_salvi"),
        "startLocation": {
            "address": "Borivali West Station, Mumbai 400092",
            "latitude": 19.2307,
            "longitude": 72.8567,
        },
        "destination": {
            "address": "Taj Lands End, Band Stand, Bandra West, Mumbai 400050",
            "latitude": 19.0440,
            "longitude": 72.8210,
        },
        "stops": [
            {"address": "Goregaon East, Mumbai 400063", "latitude": 19.1663, "longitude": 72.8491},
            {"address": "Andheri West Link Road, Mumbai 400053", "latitude": 19.1361, "longitude": 72.8296},
            {"address": "Bandra East, Mumbai 400051", "latitude": 19.0596, "longitude": 72.8495},
        ],
        "routeGeometry": None,
        "travelDate": TOMORROW,
        "departureTime": "08:15",
        "arrivalTime": "11:00",
        "availableCapacity": 140,
        "price": 1850,
        "status": "active",
    },
]


# ============================================================
# SEED FUNCTION
# ============================================================

def seed_collection(collection: str, docs: list[dict], id_field: str):
    """Write a list of documents to a Firestore collection."""
    for doc in docs:
        doc_id = doc[id_field]
        # Add timestamps
        doc_copy = {**doc}
        doc_copy["createdAt"] = NOW
        doc_copy["updatedAt"] = NOW
        db.collection(collection).document(doc_id).set(doc_copy)
        print(f"  [OK] {collection}/{doc_id}")


def clear_stale_logistics():
    """Clear old unrealistic driver and driverRoute documents."""
    print("\n-- CLEARING STALE LOGISTICS RECORDS --")
    for col_name in ["driverRoutes", "drivers"]:
        docs = list(db.collection(col_name).stream())
        for d in docs:
            d.reference.delete()
        print(f"  [CLEARED] {len(docs)} stale documents from {col_name}")


def main():
    print("=" * 70)
    print("SEEDING FIREBASE - Hospitality Resource Exchange")
    print("=" * 70)

    project_id = getattr(db, "project", "unknown")
    print(f"\nFirebase Project: {project_id}")
    print(f"Timestamp: {NOW.isoformat()}")
    print(f"Today: {TODAY}, Tomorrow: {TOMORROW}, Day After: {DAY_AFTER}\n")

    # Clear old unrealistic driver routes first
    clear_stale_logistics()

    # 1. Seed users (vendors + buyers)
    print("\n-- USERS (5 Vendors + 5 Buyers) --")
    all_users = VENDORS + BUYERS
    seed_collection("users", all_users, "userId")

    # 2. Seed resources
    print("\n-- RESOURCES (10 items across 5 vendors) --")
    seed_collection("resources", RESOURCES, "resourceId")

    # 3. Seed requirements
    print("\n-- REQUIREMENTS (5 buyer needs) --")
    seed_collection("requirements", REQUIREMENTS, "requirementId")

    # 4. Seed drivers
    print(f"\n-- DRIVERS ({len(DRIVERS)} realistic transport operators) --")
    seed_collection("drivers", DRIVERS, "driverId")

    # 5. Seed driver routes
    print(f"\n-- DRIVER ROUTES ({len(DRIVER_ROUTES)} realistic active routes) --")
    seed_collection("driverRoutes", DRIVER_ROUTES, "routeId")

    # Summary
    print("\n" + "=" * 70)
    print("SEED COMPLETED SUCCESSFULLY")
    print("=" * 70)
    print(f"\n  Users:        {len(all_users)} ({len(VENDORS)} vendors, {len(BUYERS)} buyers)")
    print(f"  Resources:    {len(RESOURCES)}")
    print(f"  Requirements: {len(REQUIREMENTS)}")
    print(f"  Drivers:      {len(DRIVERS)}")
    print(f"  Routes:       {len(DRIVER_ROUTES)}")
    print()


if __name__ == "__main__":
    main()

