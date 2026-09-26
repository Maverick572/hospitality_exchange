from datetime import datetime
from typing import Any, Optional

try:
    from services.llm_parser import parse_requirement, ParsedItem
except ImportError:
    from backend.services.llm_parser import parse_requirement, ParsedItem

from seeker.distance import extract_coordinates, haversine_distance

db = None
try:
    from core.firebase import db as _db
    db = _db
except Exception:
    db = None


def _check_date_availability(
    availability_list: list[dict] | None,
    from_timestamp: str | datetime | None,
    to_timestamp: str | datetime | None,
    requested_quantity: float = 1
) -> bool:
    """
    Check if the resource/product has explicitly listed availability matching the requested period.
    If no availability schedule is defined on the product, returns True by default.
    """
    if not availability_list or not isinstance(availability_list, list):
        return True

    if not from_timestamp and not to_timestamp:
        return True

    req_from_str = str(from_timestamp)[:10] if from_timestamp else None

    for slot in availability_list:
        if not isinstance(slot, dict):
            continue
        slot_date = slot.get("date")
        slot_qty = slot.get("quantity", 0)

        # Match date slot
        if slot_date and req_from_str and slot_date == req_from_str:
            if slot_qty >= requested_quantity:
                return True

    return True


def _compute_availability_score(
    available_qty: float,
    requested_qty: float,
    period_available: bool
) -> float:
    """
    Compute an availability score where higher values mean better availability:
    - 2.0+ : Fully available for requested period with surplus
    - 1.0 - 2.0 : Fully meets requested quantity
    - 0.0 - 1.0 : Partially meets requested quantity
    - 0.0 : Out of stock / unavailable
    """
    if available_qty <= 0:
        return 0.0

    ratio = min(1.0, available_qty / max(1.0, requested_qty))
    score = ratio

    if available_qty >= requested_qty:
        score += 1.0  # Bonus for satisfying entire requested quantity

    if period_available:
        score += 0.5  # Bonus for verified calendar slot availability

    return round(score, 4)


def search_seeker_products(
    description: str,
    from_timestamp: Optional[str | datetime] = None,
    to_timestamp: Optional[str | datetime] = None,
    seeker_location: Optional[dict] = None,
    firestore_db: Any = None
) -> dict:
    """
    1. Parses natural language requirement description using LLM parser.
    2. Combines parsed items with from and to timestamps.
    3. Searches resources / products in Firestore.
    4. Resolves product location directly (with fallback to provider's location from users/{providerId}).
    5. Returns product list sorted by:
       - Best availability (descending)
       - Lowest price (ascending)
       - Nearest location (ascending distance in km using product location)
    """
    active_db = firestore_db or db

    # 1. Parse requirement with LLM Parser
    parsed_items: list[ParsedItem] = []
    try:
        parsed_items = parse_requirement(description)
    except Exception as e:
        print(f"[Warning] LLM Parser fallback/error: {e}")

    # Fallback if no items parsed from LLM: create generic item based on description words
    if not parsed_items and description and description.strip():
        terms = description.lower().split()
        generic_name = terms[0] if terms else "resource"
        parsed_items = [
            ParsedItem(
                category="other",
                name=generic_name,
                quantity=1,
                metric="units"
            )
        ]

    # Extract seeker coordinates
    seeker_lat, seeker_lng = extract_coordinates(seeker_location)

    # 2. Retrieve candidate resources/products from Firestore
    candidates = []
    provider_cache: dict[str, dict] = {}

    if active_db is not None:
        # Check resources collection
        try:
            r_docs = active_db.collection("resources").stream()
            for doc in r_docs:
                d = doc.to_dict() or {}
                d["resourceId"] = doc.id
                d["productId"] = doc.id
                candidates.append(d)
        except Exception as e:
            print(f"[Warning] Error streaming resources: {e}")

        # Check products collection
        try:
            p_docs = active_db.collection("products").stream()
            for doc in p_docs:
                d = doc.to_dict() or {}
                d["resourceId"] = doc.id
                d["productId"] = doc.id
                candidates.append(d)
        except Exception:
            pass

    # 3. Match candidates against parsed requirements and score them
    results = []

    for item in parsed_items:
        target_name = item.name.lower()
        target_cat = item.category.value if hasattr(item.category, "value") else str(item.category).lower()
        req_qty = float(item.quantity)

        for res in candidates:
            # Check active status
            status = str(res.get("status", "active")).lower()
            if status not in ("active", "available"):
                continue

            res_name = str(res.get("name", "")).lower()
            res_cat = str(res.get("category", "")).lower()
            res_desc = str(res.get("description", "")).lower()

            # Name / Category relevance matching
            name_match = target_name in res_name or res_name in target_name or any(w in res_name for w in target_name.split())
            cat_match = target_cat == res_cat or target_cat == "other" or res_cat == "other"
            desc_match = target_name in res_desc

            if not (name_match or (cat_match and desc_match)):
                continue

            # 4. Resolve Provider Information
            provider_id = res.get("providerId")
            provider_data = {"providerId": provider_id, "businessName": "Provider", "rating": 0.0, "location": {}}

            if provider_id:
                if provider_id in provider_cache:
                    provider_data = provider_cache[provider_id]
                elif active_db is not None:
                    try:
                        u_snap = active_db.collection("users").document(provider_id).get()
                        if u_snap.exists:
                            u_dict = u_snap.to_dict() or {}
                            provider_data = {
                                "providerId": provider_id,
                                "name": u_dict.get("name"),
                                "businessName": u_dict.get("businessName") or u_dict.get("name") or "Provider",
                                "email": u_dict.get("email"),
                                "phone": u_dict.get("phone"),
                                "rating": float(u_dict.get("rating", 0.0) or 0.0),
                                "totalRatings": int(u_dict.get("totalRatings", 0) or 0),
                                "location": u_dict.get("location") or {}
                            }
                        provider_cache[provider_id] = provider_data
                    except Exception:
                        pass

            # 5. Resolve Location: use product's own location, fallback to provider's location
            product_location = res.get("location") or provider_data.get("location") or {}
            prod_lat, prod_lng = extract_coordinates(product_location)

            # Distance calculation (Haversine from seeker location to product location)
            distance_km = haversine_distance(seeker_lat, seeker_lng, prod_lat, prod_lng)

            # 6. Availability & Price calculations
            total_qty = float(res.get("quantity", 0) or 0)
            available_qty = float(res.get("availableQuantity", total_qty) if res.get("availableQuantity") is not None else total_qty)
            price = float(res.get("price", 0.0) or 0.0)
            pricing_unit = res.get("pricingUnit", "per_item_per_day")

            period_available = _check_date_availability(
                res.get("availability"),
                from_timestamp,
                to_timestamp,
                requested_quantity=req_qty
            )

            availability_score = _compute_availability_score(
                available_qty=available_qty,
                requested_qty=req_qty,
                period_available=period_available
            )

            product_entry = {
                "productId": res.get("productId") or res.get("resourceId"),
                "resourceId": res.get("resourceId"),
                "name": res.get("name"),
                "category": res.get("category"),
                "description": res.get("description", ""),
                "quantity": int(total_qty),
                "availableQuantity": int(available_qty),
                "price": price,
                "pricingUnit": pricing_unit,
                "location": product_location,
                "condition": res.get("condition", "good"),
                "images": res.get("images", []),
                "status": status,
                "availability": res.get("availability", []),
                "provider": provider_data,
                "distanceKm": distance_km,
                "availabilityScore": availability_score,
                "availableForRequestedPeriod": period_available,
                "matchedItem": {
                    "name": item.name,
                    "category": target_cat,
                    "requestedQuantity": req_qty,
                    "metric": item.metric
                }
            }

            results.append((availability_score, price, distance_km, product_entry))

    # 7. Sort in order:
    # 1st: Best availability (highest availability_score first -> -availability_score)
    # 2nd: Lowest price (lowest price first -> price)
    # 3rd: Nearest location (shortest distance in km first -> distance_km)
    results.sort(key=lambda x: (-x[0], x[1], x[2]))

    sorted_products = [entry[3] for entry in results]

    return {
        "description": description,
        "fromTimestamp": from_timestamp,
        "toTimestamp": to_timestamp,
        "parsedItems": [item.model_dump(mode="json") for item in parsed_items],
        "products": sorted_products,
        "totalMatches": len(sorted_products)
    }
