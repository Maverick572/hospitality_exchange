"""
Populate Firebase Script
=========================
1. Clears all existing Firestore collections (users, resources, requirements, requests, bookings, drivers, driverRoutes, etc.).
2. Creates/Updates Firebase Authentication accounts for 6 Businesses and 5 Drivers with password: password123.
3. Seeds Firestore with:
   - 6 Verified Business Profiles (Vendors & Seekers)
   - 10 Realistic Resource / Product Listings
   - 4 Event Requirements (Seeker Demands)
   - 5 Logistics Drivers with verified vehicle details
   - 5 Active Driver Routes across Mumbai
   - Realistic Negotiation Requests & Active Bookings

Usage:
    cd backend
    python populate_firebase.py
"""

import os
import sys
from datetime import datetime, timezone, timedelta

# Ensure backend root is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from firebase_admin import auth as fb_auth
from core.firebase import db
from clear_firebase import clear_all_collections

if db is None:
    print("[FATAL] Could not connect to Firestore. Check your service account credentials.")
    sys.exit(1)

# Dates
NOW = datetime.now(timezone.utc)
TODAY = NOW.strftime("%Y-%m-%d")
TOMORROW = (NOW + timedelta(days=1)).strftime("%Y-%m-%d")
DAY_AFTER = (NOW + timedelta(days=2)).strftime("%Y-%m-%d")
NEXT_WEEK = (NOW + timedelta(days=7)).strftime("%Y-%m-%d")

DEFAULT_PASSWORD = "password123"

# ============================================================
# 1. AUTHENTICATED BUSINESS USERS (6 Accounts)
# ============================================================

BUSINESS_USERS = [
    {
        "uid": "usr_taj_lands_end",
        "email": "taj@demo.com",
        "password": DEFAULT_PASSWORD,
        "name": "Suresh Nair",
        "phone": "+91 22 6668 1234",
        "businessName": "Taj Lands End",
        "businessType": "Hotel & Banquets",
        "location": {
            "address": "Taj Lands End, Byramji Jeejeebhoy Road, Band Stand, Bandra West, Mumbai 400050",
            "latitude": 19.0440,
            "longitude": 72.8210,
        },
        "rating": 4.9,
        "totalRatings": 58,
    },
    {
        "uid": "usr_itc_maratha",
        "email": "itc@demo.com",
        "password": DEFAULT_PASSWORD,
        "name": "Amit Kulkarni",
        "phone": "+91 22 2830 3030",
        "businessName": "ITC Maratha Mumbai",
        "businessType": "Luxury Hotel & Catering",
        "location": {
            "address": "ITC Maratha, Sahar Airport Road, Andheri East, Mumbai 400099",
            "latitude": 19.0992,
            "longitude": 72.8722,
        },
        "rating": 4.85,
        "totalRatings": 42,
    },
    {
        "uid": "usr_trident_bkc",
        "email": "trident@demo.com",
        "password": DEFAULT_PASSWORD,
        "name": "Priya Mehta",
        "phone": "+91 22 6672 8888",
        "businessName": "Trident Hotel BKC",
        "businessType": "Corporate Hotel & Events",
        "location": {
            "address": "Trident Hotel, G Block, Bandra Kurla Complex, Mumbai 400098",
            "latitude": 19.0636,
            "longitude": 72.8681,
        },
        "rating": 4.88,
        "totalRatings": 35,
    },
    {
        "uid": "usr_renaissance_powai",
        "email": "renaissance@demo.com",
        "password": DEFAULT_PASSWORD,
        "name": "Vikram Joshi",
        "phone": "+91 22 6692 0000",
        "businessName": "Renaissance Mumbai Convention Centre",
        "businessType": "Convention Centre & Hotel",
        "location": {
            "address": "Renaissance Mumbai, Near Powai Lake, Andheri East, Mumbai 400087",
            "latitude": 19.1161,
            "longitude": 72.9080,
        },
        "rating": 4.78,
        "totalRatings": 29,
    },
    {
        "uid": "usr_sahara_star",
        "email": "sahara@demo.com",
        "password": DEFAULT_PASSWORD,
        "name": "Ritu Sharma",
        "phone": "+91 22 3989 8989",
        "businessName": "Hotel Sahara Star",
        "businessType": "Hospitality & Convention",
        "location": {
            "address": "Hotel Sahara Star, Domestic Airport, Vile Parle East, Mumbai 400099",
            "latitude": 19.0963,
            "longitude": 72.8528,
        },
        "rating": 4.72,
        "totalRatings": 31,
    },
    {
        "uid": "usr_jio_convention",
        "email": "jio@demo.com",
        "password": DEFAULT_PASSWORD,
        "name": "Rahul Deshmukh",
        "phone": "+91 22 3570 0000",
        "businessName": "Jio World Convention Centre",
        "businessType": "Exhibition & Mega Events",
        "location": {
            "address": "Jio World Centre, G Block, Bandra Kurla Complex, Mumbai 400098",
            "latitude": 19.0588,
            "longitude": 72.8653,
        },
        "rating": 4.95,
        "totalRatings": 22,
    },
]

# ============================================================
# 2. AUTHENTICATED DRIVERS (5 Accounts)
# ============================================================

DRIVERS = [
    {
        "uid": "drv_ramesh_pawar",
        "email": "driver1@demo.com",
        "password": DEFAULT_PASSWORD,
        "name": "Ramesh Pawar",
        "phone": "+91 98201 11223",
        "vehicleType": "Tata Ace Gold",
        "vehicleNumber": "MH-02-DN-4821",
        "capacity": 40,
        "licenseNumber": "MH-0220180019234",
        "verificationStatus": "verified",
        "totalTrips": 84,
        "rating": 4.9,
        "totalRatings": 48,
        "status": "active",
    },
    {
        "uid": "drv_sunil_yadav",
        "email": "driver2@demo.com",
        "password": DEFAULT_PASSWORD,
        "name": "Sunil Yadav",
        "phone": "+91 98202 22334",
        "vehicleType": "Mahindra Bolero Maxi",
        "vehicleNumber": "MH-04-AX-8922",
        "capacity": 60,
        "licenseNumber": "MH-0420160038472",
        "verificationStatus": "verified",
        "totalTrips": 112,
        "rating": 4.85,
        "totalRatings": 65,
        "status": "active",
    },
    {
        "uid": "drv_amit_deshmukh",
        "email": "driver3@demo.com",
        "password": DEFAULT_PASSWORD,
        "name": "Amit Deshmukh",
        "phone": "+91 98203 33445",
        "vehicleType": "Piaggio Ape 3W",
        "vehicleNumber": "MH-03-CB-1290",
        "capacity": 25,
        "licenseNumber": "MH-0320200051189",
        "verificationStatus": "verified",
        "totalTrips": 62,
        "rating": 4.8,
        "totalRatings": 39,
        "status": "active",
    },
    {
        "uid": "drv_ganesh_shinde",
        "email": "driver4@demo.com",
        "password": DEFAULT_PASSWORD,
        "name": "Ganesh Shinde",
        "phone": "+91 98204 44556",
        "vehicleType": "Tata 407 SFC LCV",
        "vehicleNumber": "MH-01-ET-7734",
        "capacity": 120,
        "licenseNumber": "MH-0120140082910",
        "verificationStatus": "verified",
        "totalTrips": 145,
        "rating": 4.92,
        "totalRatings": 82,
        "status": "active",
    },
    {
        "uid": "drv_sanjay_varma",
        "email": "driver5@demo.com",
        "password": DEFAULT_PASSWORD,
        "name": "Sanjay Varma",
        "phone": "+91 98205 55667",
        "vehicleType": "Tata Ace EV",
        "vehicleNumber": "MH-02-FE-5501",
        "capacity": 35,
        "licenseNumber": "MH-0220220077412",
        "verificationStatus": "verified",
        "totalTrips": 40,
        "rating": 4.75,
        "totalRatings": 28,
        "status": "active",
    },
]

# ============================================================
# 3. 10 PRODUCT / RESOURCE LISTINGS
# ============================================================

RESOURCES = [
    # 1. Taj Lands End: Chiavari Chairs
    {
        "resourceId": "res_taj_chairs",
        "providerId": "usr_taj_lands_end",
        "name": "Gold Chiavari Banquet Chairs",
        "category": "banquet_seating",
        "description": "Premium beechwood Chiavari chairs with ivory cushions. Stackable, stain-resistant. Ideal for weddings, galas, and VIP corporate events.",
        "quantity": 400,
        "availableQuantity": 300,
        "price": 120,
        "pricingUnit": "per_item_per_day",
        "location": {
            "address": "Taj Lands End, Byramji Jeejeebhoy Road, Band Stand, Bandra West, Mumbai 400050",
            "latitude": 19.0440,
            "longitude": 72.8210,
        },
        "availability": [
            {"date": TODAY, "quantity": 300},
            {"date": TOMORROW, "quantity": 300},
            {"date": DAY_AFTER, "quantity": 250},
            {"date": NEXT_WEEK, "quantity": 400},
        ],
        "images": ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80"],
        "condition": "excellent",
        "status": "active",
    },
    # 2. Taj Lands End: Damask Table Linen
    {
        "resourceId": "res_taj_linen",
        "providerId": "usr_taj_lands_end",
        "name": "Damask Table Linen Sets (10-seater rounds)",
        "category": "table_linen",
        "description": "Pure cotton woven jacquard damask round tablecloths (120-inch diameter) with 10 matching cloth napkins per set. Freshly dry-cleaned and pressed in protective garment covers.",
        "quantity": 80,
        "availableQuantity": 65,
        "price": 350,
        "pricingUnit": "per_set_per_day",
        "location": {
            "address": "Taj Lands End, Byramji Jeejeebhoy Road, Band Stand, Bandra West, Mumbai 400050",
            "latitude": 19.0440,
            "longitude": 72.8210,
        },
        "availability": [
            {"date": TODAY, "quantity": 65},
            {"date": TOMORROW, "quantity": 65},
            {"date": DAY_AFTER, "quantity": 50},
        ],
        "images": ["https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80"],
        "condition": "excellent",
        "status": "active",
    },
    # 3. ITC Maratha: Chafing Dishes
    {
        "resourceId": "res_itc_chafing",
        "providerId": "usr_itc_maratha",
        "name": "Induction Buffet Chafing Dishes (Roll-Top)",
        "category": "buffet_equipment",
        "description": "Heavy-gauge 18/10 stainless steel chafing dishes with hydraulic soft-close glass viewing lids. Compatible with electric induction counters and gel fuel burners. 9-liter capacity each.",
        "quantity": 30,
        "availableQuantity": 20,
        "price": 500,
        "pricingUnit": "per_item_per_day",
        "location": {
            "address": "ITC Maratha, Sahar Airport Road, Andheri East, Mumbai 400099",
            "latitude": 19.0992,
            "longitude": 72.8722,
        },
        "availability": [
            {"date": TODAY, "quantity": 20},
            {"date": TOMORROW, "quantity": 20},
            {"date": DAY_AFTER, "quantity": 18},
        ],
        "images": ["https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80"],
        "condition": "like_new",
        "status": "active",
    },
    # 4. ITC Maratha: Fine Porcelain Dinnerware
    {
        "resourceId": "res_itc_crockery",
        "providerId": "usr_itc_maratha",
        "name": "Fine Porcelain Dinnerware & Silverware Sets (100 covers)",
        "category": "cutlery_crockery",
        "description": "Bone china rimmed dinner plates, side plates, dessert bowls, with heavy 18/10 forged silver cutlery sets (dinner fork, soup spoon, dessert spoon, butter knife). Packed in flight transit crates.",
        "quantity": 10,
        "availableQuantity": 8,
        "price": 4500,
        "pricingUnit": "per_set_per_day",
        "location": {
            "address": "ITC Maratha, Sahar Airport Road, Andheri East, Mumbai 400099",
            "latitude": 19.0992,
            "longitude": 72.8722,
        },
        "availability": [
            {"date": TODAY, "quantity": 8},
            {"date": TOMORROW, "quantity": 8},
            {"date": DAY_AFTER, "quantity": 6},
        ],
        "images": ["https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=800&q=80"],
        "condition": "excellent",
        "status": "active",
    },
    # 5. Trident BKC: Commercial Ice Machine
    {
        "resourceId": "res_trident_ice_machine",
        "providerId": "usr_trident_bkc",
        "name": "High-Output Commercial Ice Cube Machine (150kg/day)",
        "category": "kitchen_appliances",
        "description": "Manitowoc air-cooled commercial ice machine producing crystal-clear gourmet dice ice cubes. Includes built-in 80kg storage bin and food-grade water filtration unit.",
        "quantity": 3,
        "availableQuantity": 2,
        "price": 3200,
        "pricingUnit": "per_item_per_day",
        "location": {
            "address": "Trident Hotel, G Block, Bandra Kurla Complex, Mumbai 400098",
            "latitude": 19.0636,
            "longitude": 72.8681,
        },
        "availability": [
            {"date": TODAY, "quantity": 2},
            {"date": TOMORROW, "quantity": 2},
            {"date": DAY_AFTER, "quantity": 2},
        ],
        "images": ["https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80"],
        "condition": "like_new",
        "status": "active",
    },
    # 6. Trident BKC: AV PA Sound System
    {
        "resourceId": "res_trident_pa_system",
        "providerId": "usr_trident_bkc",
        "name": "Professional Sound & Wireless Mic PA System",
        "category": "av_equipment",
        "description": "JBL EON active powered PA speakers (1000W RMS pair) with stands, 12-channel Yamaha mixer, and 4 Shure UHF handheld wireless microphones. Flight-cased for easy transport.",
        "quantity": 5,
        "availableQuantity": 4,
        "price": 4000,
        "pricingUnit": "per_set_per_day",
        "location": {
            "address": "Trident Hotel, G Block, Bandra Kurla Complex, Mumbai 400098",
            "latitude": 19.0636,
            "longitude": 72.8681,
        },
        "availability": [
            {"date": TODAY, "quantity": 4},
            {"date": TOMORROW, "quantity": 4},
            {"date": DAY_AFTER, "quantity": 3},
        ],
        "images": ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80"],
        "condition": "excellent",
        "status": "active",
    },
    # 7. Renaissance Powai: Cold Room Modular Chiller
    {
        "resourceId": "res_renaissance_chiller",
        "providerId": "usr_renaissance_powai",
        "name": "Walk-In Modular Mobile Chiller (2C to 8C, 10x8ft)",
        "category": "refrigeration",
        "description": "Quick-assemble PUF panel walk-in cold room with digital Copeland refrigeration unit. Temperature holds +2C to +8C. Ideal for banquet prep and perishables during high-volume events.",
        "quantity": 2,
        "availableQuantity": 1,
        "price": 8500,
        "pricingUnit": "per_item_per_day",
        "location": {
            "address": "Renaissance Mumbai, Near Powai Lake, Andheri East, Mumbai 400087",
            "latitude": 19.1161,
            "longitude": 72.9080,
        },
        "availability": [
            {"date": TODAY, "quantity": 1},
            {"date": TOMORROW, "quantity": 1},
            {"date": DAY_AFTER, "quantity": 1},
        ],
        "images": ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"],
        "condition": "excellent",
        "status": "active",
    },
    # 8. Renaissance Powai: Combi Oven
    {
        "resourceId": "res_renaissance_combi_oven",
        "providerId": "usr_renaissance_powai",
        "name": "Rational iCombi Pro 10-Grid Combi Steamer",
        "category": "kitchen_appliances",
        "description": "Electric 10xGN 1/1 capacity commercial combi oven. Intelligent steaming, convection, and combined cooking modes. Includes mobile stand on heavy duty castors.",
        "quantity": 2,
        "availableQuantity": 2,
        "price": 6000,
        "pricingUnit": "per_item_per_day",
        "location": {
            "address": "Renaissance Mumbai, Near Powai Lake, Andheri East, Mumbai 400087",
            "latitude": 19.1161,
            "longitude": 72.9080,
        },
        "availability": [
            {"date": TODAY, "quantity": 2},
            {"date": TOMORROW, "quantity": 2},
            {"date": DAY_AFTER, "quantity": 2},
        ],
        "images": ["https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80"],
        "condition": "like_new",
        "status": "active",
    },
    # 9. Sahara Star: Commercial Espresso Machine
    {
        "resourceId": "res_sahara_espresso",
        "providerId": "usr_sahara_star",
        "name": "La Marzocco 2-Group Commercial Espresso Machine",
        "category": "bar_equipment",
        "description": "Dual-boiler espresso machine with PID temperature control, dual cool-touch steam wands, and Mazzer Super Jolly automatic burr grinder. Ideal for VIP lounges and summit hospitality.",
        "quantity": 3,
        "availableQuantity": 2,
        "price": 4500,
        "pricingUnit": "per_item_per_day",
        "location": {
            "address": "Hotel Sahara Star, Domestic Airport, Vile Parle East, Mumbai 400099",
            "latitude": 19.0963,
            "longitude": 72.8528,
        },
        "availability": [
            {"date": TODAY, "quantity": 2},
            {"date": TOMORROW, "quantity": 2},
            {"date": DAY_AFTER, "quantity": 1},
        ],
        "images": ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"],
        "condition": "excellent",
        "status": "active",
    },
    # 10. Sahara Star: Stage Trussing & Platforms
    {
        "resourceId": "res_sahara_staging",
        "providerId": "usr_sahara_star",
        "name": "Modular Aluminium Stage Platform & LED Trussing (24x16ft)",
        "category": "staging_lighting",
        "description": "Interlocking heavy-duty aluminium stage decks with adjustable risers (2ft to 4ft height), carpeted anti-slip finish, safety guard rails, and 12-meter quad-truss lighting goalpost.",
        "quantity": 2,
        "availableQuantity": 1,
        "price": 12000,
        "pricingUnit": "per_set_per_day",
        "location": {
            "address": "Hotel Sahara Star, Domestic Airport, Vile Parle East, Mumbai 400099",
            "latitude": 19.0963,
            "longitude": 72.8528,
        },
        "availability": [
            {"date": TODAY, "quantity": 1},
            {"date": TOMORROW, "quantity": 1},
            {"date": DAY_AFTER, "quantity": 1},
        ],
        "images": ["https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80"],
        "condition": "good",
        "status": "active",
    },
]

# ============================================================
# 4. 5 DRIVER ROUTES
# ============================================================

DRIVER_ROUTES = [
    # Route 1: Ramesh Pawar (Tata Ace Gold) - Bandra to Colaba via BKC
    {
        "routeId": "route_bandra_to_colaba_ace",
        "driverId": "drv_ramesh_pawar",
        "startLocation": {
            "address": "Taj Lands End, Band Stand, Bandra West, Mumbai 400050",
            "latitude": 19.0440,
            "longitude": 72.8210,
        },
        "destination": {
            "address": "The Taj Mahal Palace, Apollo Bunder, Colaba, Mumbai 400001",
            "latitude": 18.9217,
            "longitude": 72.8332,
        },
        "stops": [
            {"address": "Jio World Centre, BKC, Mumbai 400098", "latitude": 19.0588, "longitude": 72.8653},
            {"address": "Worli Naka, Dr Annie Besant Road, Mumbai 400018", "latitude": 19.0144, "longitude": 72.8159},
            {"address": "Bombay Gymkhana, Fort, Mumbai 400001", "latitude": 18.9327, "longitude": 72.8316},
        ],
        "travelDate": TOMORROW,
        "departureTime": "08:30",
        "arrivalTime": "11:00",
        "availableCapacity": 35,
        "capacity": 40,
        "price": 850,
        "status": "active",
    },
    # Route 2: Sunil Yadav (Bolero Maxi) - Andheri to BKC
    {
        "routeId": "route_andheri_to_bkc_bolero",
        "driverId": "drv_sunil_yadav",
        "startLocation": {
            "address": "ITC Maratha, Sahar Airport Road, Andheri East, Mumbai 400099",
            "latitude": 19.0992,
            "longitude": 72.8722,
        },
        "destination": {
            "address": "Trident Hotel, G Block, BKC, Mumbai 400098",
            "latitude": 19.0636,
            "longitude": 72.8681,
        },
        "stops": [
            {"address": "Sahara Star, Domestic Airport, Vile Parle East, Mumbai 400099", "latitude": 19.0963, "longitude": 72.8528},
            {"address": "Santacruz East Highway, Mumbai 400055", "latitude": 19.0800, "longitude": 72.8550},
        ],
        "travelDate": TOMORROW,
        "departureTime": "09:00",
        "arrivalTime": "10:30",
        "availableCapacity": 50,
        "capacity": 60,
        "price": 650,
        "status": "active",
    },
    # Route 3: Amit Deshmukh (Piaggio Ape 3W) - Bandra Kurla Panvel
    {
        "routeId": "route_bkc_to_panvel_ape",
        "driverId": "drv_amit_deshmukh",
        "startLocation": {
            "address": "Jio World Centre, BKC, Mumbai 400098",
            "latitude": 19.0588,
            "longitude": 72.8653,
        },
        "destination": {
            "address": "Vashi Toll Plaza, Navi Mumbai 400703",
            "latitude": 19.0650,
            "longitude": 72.9900,
        },
        "stops": [
            {"address": "Chembur Naka, Mumbai 400071", "latitude": 19.0522, "longitude": 72.9005},
            {"address": "Mankhurd Station, Mumbai 400088", "latitude": 19.0490, "longitude": 72.9320},
        ],
        "travelDate": TOMORROW,
        "departureTime": "14:00",
        "arrivalTime": "16:00",
        "availableCapacity": 20,
        "capacity": 25,
        "price": 500,
        "status": "active",
    },
    # Route 4: Ganesh Shinde (Tata 407 LCV) - Goregaon to Fort
    {
        "routeId": "route_goregaon_to_fort_407",
        "driverId": "drv_ganesh_shinde",
        "startLocation": {
            "address": "Bombay Exhibition Centre (NESCO), Goregaon East, Mumbai 400063",
            "latitude": 19.1545,
            "longitude": 72.8560,
        },
        "destination": {
            "address": "Bombay Gymkhana, MG Road, Fort, Mumbai 400001",
            "latitude": 18.9327,
            "longitude": 72.8316,
        },
        "stops": [
            {"address": "Andheri WEH Flyover, Mumbai 400069", "latitude": 19.1197, "longitude": 72.8564},
            {"address": "Bandra Kalanagar Junction, Mumbai 400051", "latitude": 19.0596, "longitude": 72.8495},
            {"address": "Lower Parel Palladium, Mumbai 400013", "latitude": 18.9950, "longitude": 72.8240},
        ],
        "travelDate": DAY_AFTER,
        "departureTime": "07:30",
        "arrivalTime": "10:30",
        "availableCapacity": 100,
        "capacity": 120,
        "price": 1600,
        "status": "active",
    },
    # Route 5: Sanjay Varma (Tata Ace EV) - Dadar to Colaba
    {
        "routeId": "route_dadar_to_colaba_ace_ev",
        "driverId": "drv_sanjay_varma",
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
        "travelDate": TOMORROW,
        "departureTime": "11:00",
        "arrivalTime": "12:30",
        "availableCapacity": 30,
        "capacity": 35,
        "price": 750,
        "status": "active",
    },
]

# ============================================================
# 5. SAMPLE BUYER REQUIREMENTS
# ============================================================

REQUIREMENTS = [
    {
        "requirementId": "req_jio_annual_summit",
        "seekerId": "usr_jio_convention",
        "description": "Require 200 premium banquet chairs and 20 buffet chafing dishes for India Fintech Summit 2026 gala dinner at BKC.",
        "items": [
            {"category": "banquet_seating", "name": "Chiavari or Banquet Chairs", "quantity": 200, "metric": "units"},
            {"category": "buffet_equipment", "name": "Induction Chafing Dishes", "quantity": 20, "metric": "units"},
        ],
        "location": {
            "address": "Jio World Centre, G Block, Bandra Kurla Complex, Mumbai 400098",
            "latitude": 19.0588,
            "longitude": 72.8653,
        },
        "requiredDate": TOMORROW,
        "startTime": "16:00",
        "endTime": "23:00",
        "budget": 35000,
        "deliveryRequired": True,
        "status": "active",
    },
    {
        "requirementId": "req_trident_overflow_banquet",
        "seekerId": "usr_trident_bkc",
        "description": "Urgent need for 50 round damask table linen sets and 4 sets of fine porcelain dinnerware for wedding reception overflow.",
        "items": [
            {"category": "table_linen", "name": "Damask Table Linen Sets", "quantity": 50, "metric": "sets"},
            {"category": "cutlery_crockery", "name": "Dinnerware 100-cover sets", "quantity": 4, "metric": "sets"},
        ],
        "location": {
            "address": "Trident Hotel, G Block, Bandra Kurla Complex, Mumbai 400098",
            "latitude": 19.0636,
            "longitude": 72.8681,
        },
        "requiredDate": DAY_AFTER,
        "startTime": "10:00",
        "endTime": "22:00",
        "budget": 30000,
        "deliveryRequired": True,
        "status": "active",
    },
]

# ============================================================
# 6. SAMPLE NEGOTIATION REQUEST & BOOKING
# ============================================================

REQUESTS = [
    {
        "requestId": "req_taj_to_jio_chairs",
        "requirementId": "req_jio_annual_summit",
        "seekerId": "usr_jio_convention",
        "providerId": "usr_taj_lands_end",
        "resourceId": "res_taj_chairs",
        "requestedQuantity": 150,
        "offeredPrice": 110,
        "finalPrice": 115,
        "notes": "Delivery requested to Jio World Hall 2 by 3:00 PM tomorrow.",
        "status": "accepted",
        "bookingId": "bk_chairs_jio_summit",
        "departureTime": "14:00",
        "arrivalTime": "15:00",
        "messages": [
            {
                "senderId": "usr_jio_convention",
                "senderName": "Rahul Deshmukh (Jio World)",
                "message": "Hi, we need 150 Chiavari chairs for tomorrow gala. Can you offer INR 110/chair with delivery?",
                "timestamp": NOW.isoformat(),
            },
            {
                "senderId": "usr_taj_lands_end",
                "senderName": "Suresh Nair (Taj Lands End)",
                "message": "We can do INR 115/chair including pre-cleaning and protective covers. Accepted!",
                "timestamp": NOW.isoformat(),
            },
        ],
    }
]

BOOKINGS = [
    {
        "bookingId": "bk_chairs_jio_summit",
        "requestId": "req_taj_to_jio_chairs",
        "requirementId": "req_jio_annual_summit",
        "seekerId": "usr_jio_convention",
        "providerId": "usr_taj_lands_end",
        "resourceId": "res_taj_chairs",
        "driverId": "drv_ramesh_pawar",
        "quantity": 150,
        "resourceAmount": 17250,
        "deliveryAmount": 850,
        "depositAmount": 3000,
        "totalAmount": 21100,
        "totalPrice": 21100,
        "pickupLocation": {
            "address": "Taj Lands End, Band Stand, Bandra West, Mumbai 400050",
            "latitude": 19.0440,
            "longitude": 72.8210,
        },
        "deliveryLocation": {
            "address": "Jio World Centre, G Block, Bandra Kurla Complex, Mumbai 400098",
            "latitude": 19.0588,
            "longitude": 72.8653,
        },
        "pickupDate": TOMORROW,
        "deliveryDate": TOMORROW,
        "departureTime": "14:00",
        "arrivalTime": "15:00",
        "status": "confirmed",
        "escrowStatus": "HELD",
    }
]

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def create_or_update_auth_account(uid: str, email: str, password: str, display_name: str):
    """Create or update Firebase Auth user."""
    try:
        fb_auth.get_user(uid)
        fb_auth.update_user(uid, email=email, password=password, display_name=display_name)
        print(f"  [AUTH UPDATED] {uid} -> {email}")
    except fb_auth.UserNotFoundError:
        try:
            fb_auth.create_user(uid=uid, email=email, password=password, display_name=display_name)
            print(f"  [AUTH CREATED] {uid} -> {email}")
        except Exception as e:
            print(f"  [AUTH ERROR] Creating {uid}: {e}")
    except Exception as e:
        print(f"  [AUTH ERROR] Updating {uid}: {e}")


def write_documents(collection: str, docs: list[dict], id_field: str):
    """Write list of documents to Firestore collection."""
    for doc in docs:
        doc_id = doc[id_field]
        data = {**doc}
        data["createdAt"] = NOW
        data["updatedAt"] = NOW
        db.collection(collection).document(doc_id).set(data)
        print(f"  [FIRESTORE OK] {collection}/{doc_id}")


# ============================================================
# MAIN ORCHESTRATION
# ============================================================

def main():
    print("=" * 75)
    print("  HOSPITALITY RESOURCE EXCHANGE — POPULATE & SEED FIREBASE")
    print("=" * 75)

    # 1. Clear existing collections
    print("\n[STEP 1/6] Clearing old Firestore collections...")
    clear_all_collections(skip_prompt=True)

    # 2. Register / Update Auth for Businesses
    print("\n[STEP 2/6] Provisioning 6 Business Firebase Auth Accounts...")
    for u in BUSINESS_USERS:
        create_or_update_auth_account(
            uid=u["uid"],
            email=u["email"],
            password=u["password"],
            display_name=u["businessName"],
        )

    # 3. Register / Update Auth for Drivers
    print("\n[STEP 3/6] Provisioning 5 Driver Firebase Auth Accounts...")
    for d in DRIVERS:
        create_or_update_auth_account(
            uid=d["uid"],
            email=d["email"],
            password=d["password"],
            display_name=d["name"],
        )

    # 4. Populate Firestore Users and Drivers
    print("\n[STEP 4/6] Seeding Firestore 'users' and 'drivers' collections...")
    user_firestore_records = []
    for u in BUSINESS_USERS:
        user_firestore_records.append({
            "userId": u["uid"],
            "name": u["name"],
            "email": u["email"],
            "phone": u["phone"],
            "businessName": u["businessName"],
            "businessType": u["businessType"],
            "location": u["location"],
            "rating": u["rating"],
            "totalRatings": u["totalRatings"],
            "profileImage": None,
        })
    write_documents("users", user_firestore_records, "userId")

    driver_firestore_records = []
    for d in DRIVERS:
        driver_firestore_records.append({
            "driverId": d["uid"],
            "name": d["name"],
            "email": d["email"],
            "phone": d["phone"],
            "vehicleType": d["vehicleType"],
            "vehicleNumber": d["vehicleNumber"],
            "capacity": d["capacity"],
            "licenseNumber": d["licenseNumber"],
            "verificationStatus": d["verificationStatus"],
            "totalTrips": d["totalTrips"],
            "rating": d["rating"],
            "totalRatings": d["totalRatings"],
            "status": d["status"],
        })
    write_documents("drivers", driver_firestore_records, "driverId")

    # 5. Populate Resources and Driver Routes
    print("\n[STEP 5/6] Seeding 10 Resources & 5 Driver Routes...")
    write_documents("resources", RESOURCES, "resourceId")
    write_documents("driverRoutes", DRIVER_ROUTES, "routeId")

    # 6. Populate Requirements, Requests & Bookings
    print("\n[STEP 6/6] Seeding Requirements, Requests & Bookings...")
    write_documents("requirements", REQUIREMENTS, "requirementId")
    write_documents("requests", REQUESTS, "requestId")
    write_documents("bookings", BOOKINGS, "bookingId")

    # Summary
    print("\n" + "=" * 75)
    print("  FIREBASE POPULATION COMPLETED SUCCESSFULLY!")
    print("=" * 75)
    print("\nDEMO CREDENTIALS FOR JUDGES / TESTING (All passwords: password123)\n")
    print(f"{'Role':<12} | {'Business / Name':<35} | {'Email':<22} | {'Password'}")
    print("-" * 85)
    for u in BUSINESS_USERS:
        print(f"{'Business':<12} | {u['businessName']:<35} | {u['email']:<22} | {u['password']}")
    print("-" * 85)
    for d in DRIVERS:
        print(f"{'Driver':<12} | {d['name']:<35} | {d['email']:<22} | {d['password']}")
    print("-" * 85)
    print(f"\nStats:")
    print(f"  - Businesses Seeded: {len(BUSINESS_USERS)}")
    print(f"  - Drivers Seeded:    {len(DRIVERS)}")
    print(f"  - Resources Listed:  {len(RESOURCES)}")
    print(f"  - Driver Routes:     {len(DRIVER_ROUTES)}")
    print(f"  - Requirements:      {len(REQUIREMENTS)}")
    print(f"  - Bookings/Requests: {len(BOOKINGS)} / {len(REQUESTS)}\n")


if __name__ == "__main__":
    main()
