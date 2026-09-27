import sys
import os

backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, Depends, HTTPException, Query, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

try:
    from users import router as users_router
    from drivers import router as drivers_router
    from transactions import router as transactions_router
    from seeker import router as seeker_router
    from logistics import routes_router as logistics_router
    from logistics.matcher import find_best_routes
    from services.llm_parser import parse_requirement, ParserServiceError
    from services.category_registry import CATEGORIES
    from core.auth import get_current_user
    from core.firebase import db
except ImportError:
    from backend.users import router as users_router
    from backend.drivers import router as drivers_router
    from backend.transactions import router as transactions_router
    from backend.seeker import router as seeker_router
    from backend.logistics import routes_router as logistics_router
    from backend.logistics.matcher import find_best_routes
    from backend.services.llm_parser import parse_requirement, ParserServiceError
    from backend.services.category_registry import CATEGORIES
    from backend.core.auth import get_current_user
    from backend.core.firebase import db


app = FastAPI(
    title="Hospitality Resource Exchange API",
    description="Backend API for the Hospitality Resource Exchange",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ROUTES
# ============================================================

# User profile endpoints
app.include_router(
    users_router,
    prefix="/api/v1"
)

# Driver profile endpoints
app.include_router(
    drivers_router,
    prefix="/api/v1"
)

# Transaction endpoints
app.include_router(
    transactions_router,
    prefix="/api/v1"
)

# Seeker search endpoints
app.include_router(
    seeker_router,
    prefix="/api/v1"
)

# Logistics: driver routes & matching
app.include_router(
    logistics_router,
    prefix="/api/v1"
)


# ============================================================
# CATEGORY REGISTRY
# ============================================================

@app.get("/api/v1/categories", tags=["Categories"])
def list_categories():
    """Return all resource categories with evidence types, labels, and metrics."""
    return {"success": True, "data": {"categories": CATEGORIES}}


# ============================================================
# REQUIREMENTS PARSER
# ============================================================

class RequirementParseRequest(BaseModel):
    description: str


@app.post("/api/v1/requirements/parse", tags=["Requirements"])
def parse_requirement_endpoint(payload: RequirementParseRequest):
    """Parse natural language requirement into structured hospitality resources."""
    try:
        items = parse_requirement(payload.description)
        return {
            "success": True,
            "data": {
                "description": payload.description,
                "items": [item.model_dump(mode="json") for item in items]
            }
        }
    except ParserServiceError as exc:
        return {
            "success": False,
            "error": str(exc)
        }


# ============================================================
# LOGISTICS MATCH-ROUTES
# ============================================================

class LocationPayload(BaseModel):
    address: str
    latitude: float
    longitude: float


class MatchRoutesRequest(BaseModel):
    pickupLocation: LocationPayload
    deliveryLocation: LocationPayload
    requiredCapacity: int = Field(..., gt=0)
    travelDate: Optional[str] = None


@app.post("/api/v1/logistics/match-routes", tags=["Logistics Matching"])
def match_routes_endpoint(payload: MatchRoutesRequest):
    """Find and rank driver routes for a delivery using CP-SAT optimization with multi-vehicle pooling."""
    routes, pooled_solution = find_best_routes(
        pickup_location=payload.pickupLocation.model_dump(),
        delivery_location=payload.deliveryLocation.model_dump(),
        required_capacity=payload.requiredCapacity,
        travel_date=payload.travelDate,
        return_pooling=True,
    )
    # Serialize datetime objects
    from datetime import datetime, timezone
    def _ser(obj):
        if obj is None:
            return None
        if isinstance(obj, datetime):
            return obj.isoformat() if obj.tzinfo else obj.replace(tzinfo=timezone.utc).isoformat()
        if hasattr(obj, "isoformat"):
            return obj.isoformat()
        if isinstance(obj, dict):
            return {k: _ser(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [_ser(i) for i in obj]
        return obj
    return {
        "success": True,
        "data": _ser(routes),
        "pooledSolution": _ser(pooled_solution),
    }


# ============================================================
# RESOURCES CRUD
# ============================================================

@app.get("/api/v1/resources/my", tags=["Resources"])
def get_my_resources(current_user: dict = Depends(get_current_user)):
    """Return resources owned by the authenticated user."""
    user_id = current_user["uid"]
    if db is None:
        return {"success": True, "data": []}
    from datetime import datetime, timezone
    def _ser(obj):
        if obj is None:
            return None
        if isinstance(obj, datetime):
            return obj.isoformat() if obj.tzinfo else obj.replace(tzinfo=timezone.utc).isoformat()
        if hasattr(obj, "isoformat"):
            return obj.isoformat()
        if isinstance(obj, dict):
            return {k: _ser(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [_ser(i) for i in obj]
        return obj
    docs = db.collection("resources").where("providerId", "==", user_id).stream()
    results = []
    for doc in docs:
        d = doc.to_dict()
        d["resourceId"] = doc.id
        results.append(_ser(d))
    return {"success": True, "data": results}


@app.get("/api/v1/resources/all", tags=["Resources"])
def get_all_resources():
    """Return all active resources (public marketplace feed)."""
    if db is None:
        return {"success": True, "data": []}
    from datetime import datetime, timezone
    def _ser(obj):
        if obj is None:
            return None
        if isinstance(obj, datetime):
            return obj.isoformat() if obj.tzinfo else obj.replace(tzinfo=timezone.utc).isoformat()
        if hasattr(obj, "isoformat"):
            return obj.isoformat()
        if isinstance(obj, dict):
            return {k: _ser(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [_ser(i) for i in obj]
        return obj

    user_map = {}
    try:
        users_docs = db.collection("users").stream()
        for u in users_docs:
            ud = u.to_dict()
            user_map[u.id] = {
                "userId": u.id,
                "businessName": ud.get("businessName", ud.get("name", "")),
                "rating": ud.get("rating", 4.8),
                "totalRatings": ud.get("totalRatings", 10),
                "location": ud.get("location", {}),
            }
    except Exception:
        pass

    docs = db.collection("resources").where("status", "==", "active").stream()
    results = []
    for doc in docs:
        d = doc.to_dict()
        d["resourceId"] = doc.id
        pid = d.get("providerId")
        if pid and pid in user_map:
            d["provider"] = user_map[pid]
        results.append(_ser(d))
    return {"success": True, "data": results}


@app.post("/api/v1/resources", status_code=201, tags=["Resources"])
def create_resource(payload: dict, current_user: dict = Depends(get_current_user)):
    """Create a new resource listing."""
    import uuid
    from datetime import datetime, timezone
    user_id = current_user["uid"]
    resource_id = f"res_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    data = {
        **payload,
        "resourceId": resource_id,
        "providerId": user_id,
        "status": payload.get("status", "active"),
        "createdAt": now,
        "updatedAt": now,
    }
    if db is not None:
        db.collection("resources").document(resource_id).set(data)
    return {"success": True, "data": {"resourceId": resource_id}}


@app.get("/api/v1/resources/{resource_id}", tags=["Resources"])
def get_resource(resource_id: str):
    """Get a single resource by ID."""
    if db is None:
        raise HTTPException(status_code=404, detail="Resource not found.")
    doc = db.collection("resources").document(resource_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Resource not found.")
    from datetime import datetime, timezone
    def _ser(obj):
        if obj is None:
            return None
        if isinstance(obj, datetime):
            return obj.isoformat() if obj.tzinfo else obj.replace(tzinfo=timezone.utc).isoformat()
        if hasattr(obj, "isoformat"):
            return obj.isoformat()
        if isinstance(obj, dict):
            return {k: _ser(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [_ser(i) for i in obj]
        return obj
    d = doc.to_dict()
    d["resourceId"] = doc.id
    return {"success": True, "data": _ser(d)}


@app.get("/api/v1/requirements/all", tags=["Requirements"])
def get_all_requirements(
    exclude_user_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
):
    """Return all active buyer requirements, optionally excluding those created by the caller."""
    if db is None:
        return {"success": True, "data": []}
    from datetime import datetime, timezone
    def _ser(obj):
        if obj is None:
            return None
        if isinstance(obj, datetime):
            return obj.isoformat() if obj.tzinfo else obj.replace(tzinfo=timezone.utc).isoformat()
        if hasattr(obj, "isoformat"):
            return obj.isoformat()
        if isinstance(obj, dict):
            return {k: _ser(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [_ser(i) for i in obj]
        return obj

    user_map = {}
    try:
        users_docs = db.collection("users").stream()
        for u in users_docs:
            ud = u.to_dict()
            user_map[u.id] = {
                "userId": u.id,
                "businessName": ud.get("businessName", ud.get("name", "")),
                "rating": ud.get("rating", 4.8),
                "totalRatings": ud.get("totalRatings", 10),
                "location": ud.get("location", {}),
            }
    except Exception:
        pass

    exclude_uid = exclude_user_id
    if not exclude_uid and authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1]
        if token.startswith("test-"):
            sub = token[5:]
            exclude_uid = sub if (sub.startswith("usr_") or sub.startswith("user_")) else f"usr_{sub}"
        else:
            try:
                from firebase_admin import auth as fb_auth
                decoded = fb_auth.verify_id_token(token)
                exclude_uid = decoded.get("uid")
            except Exception:
                pass

    docs = db.collection("requirements").where("status", "==", "active").stream()
    results = []
    for doc in docs:
        d = doc.to_dict()
        d["requirementId"] = doc.id
        sid = d.get("seekerId")
        if exclude_uid and sid == exclude_uid:
            continue
        if sid and sid in user_map:
            d["seeker"] = user_map[sid]
        results.append(_ser(d))
    return {"success": True, "data": results}


@app.get("/api/v1/requirements/my", tags=["Requirements"])
def get_my_requirements(current_user: dict = Depends(get_current_user)):
    """Return requirements created by the authenticated user."""
    user_id = current_user["uid"]
    if db is None:
        return {"success": True, "data": []}
    from datetime import datetime, timezone
    def _ser(obj):
        if obj is None:
            return None
        if isinstance(obj, datetime):
            return obj.isoformat() if obj.tzinfo else obj.replace(tzinfo=timezone.utc).isoformat()
        if hasattr(obj, "isoformat"):
            return obj.isoformat()
        if isinstance(obj, dict):
            return {k: _ser(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [_ser(i) for i in obj]
        return obj
    docs = db.collection("requirements").where("seekerId", "==", user_id).stream()
    results = []
    for doc in docs:
        d = doc.to_dict()
        d["requirementId"] = doc.id
        results.append(_ser(d))
    return {"success": True, "data": results}


@app.post("/api/v1/requirements", status_code=201, tags=["Requirements"])
def create_requirement(payload: dict, current_user: dict = Depends(get_current_user)):
    """Create a new requirement."""
    import uuid
    from datetime import datetime, timezone
    user_id = current_user["uid"]
    req_id = f"req_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    data = {
        **payload,
        "requirementId": req_id,
        "seekerId": user_id,
        "status": payload.get("status", "active"),
        "createdAt": now,
        "updatedAt": now,
    }
    if db is not None:
        db.collection("requirements").document(req_id).set(data)
    return {"success": True, "data": {"requirementId": req_id}}


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "success": True,
        "message": "Hospitality Resource Exchange API is running"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "success": True,
        "status": "healthy"
    }