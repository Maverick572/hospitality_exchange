"""
Logistics - Driver Route Registration
======================================
CRUD endpoints for driver routes following the backendAPI.md contract:
  POST   /driver-routes          - Publish a route
  GET    /driver-routes/my       - List driver's own routes
  PATCH  /driver-routes/{id}     - Update a route
  DELETE /driver-routes/{id}     - Deactivate a route

Firestore collection: driverRoutes/{routeId}
Schema fields (schema.txt):
  driverId, startLocation, destination, stops[], routeGeometry,
  travelDate, departureTime, arrivalTime, availableCapacity,
  price, status, createdAt, updatedAt
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import firestore
from pydantic import BaseModel, Field

try:
    from core.auth import get_current_user
    from core.firebase import db
except ImportError:
    from backend.core.auth import get_current_user
    from backend.core.firebase import db


router = APIRouter(
    prefix="/driver-routes",
    tags=["Driver Routes"],
)


# ============================================================
# SCHEMAS
# ============================================================

class LocationPayload(BaseModel):
    address: str = Field(..., min_length=1)
    latitude: float
    longitude: float


class RouteStopPayload(BaseModel):
    address: str = Field(..., min_length=1)
    latitude: float
    longitude: float


class CreateRouteRequest(BaseModel):
    startLocation: LocationPayload
    destination: LocationPayload
    stops: list[RouteStopPayload] = Field(default_factory=list)
    travelDate: str = Field(..., description="Travel date (YYYY-MM-DD)")
    departureTime: str = Field(..., description="Departure time (HH:MM)")
    arrivalTime: str = Field(..., description="Arrival time (HH:MM)")
    availableCapacity: int = Field(..., gt=0, description="Available capacity in units/kg")
    price: float = Field(..., ge=0, description="Route delivery price")


class UpdateRouteRequest(BaseModel):
    startLocation: Optional[LocationPayload] = None
    destination: Optional[LocationPayload] = None
    stops: Optional[list[RouteStopPayload]] = None
    travelDate: Optional[str] = None
    departureTime: Optional[str] = None
    arrivalTime: Optional[str] = None
    availableCapacity: Optional[int] = None
    price: Optional[float] = None


# ============================================================
# HELPERS
# ============================================================

def _get_db():
    """Return the Firestore client, raising 500 if unavailable."""
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Firestore client is not initialized."
        )
    return db


def _serialize(data):
    """Recursively convert datetime objects to ISO strings."""
    if data is None:
        return None
    if isinstance(data, datetime):
        if data.tzinfo is None:
            data = data.replace(tzinfo=timezone.utc)
        return data.isoformat()
    if hasattr(data, "isoformat") and callable(data.isoformat):
        return data.isoformat()
    if isinstance(data, dict):
        return {k: _serialize(v) for k, v in data.items()}
    if isinstance(data, (list, tuple, set)):
        return [_serialize(item) for item in data]
    return data


# ============================================================
# POST /driver-routes
# ============================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Publish Route Availability",
    description="Driver publishes a new route with stops, schedule, and capacity.",
)
def create_route(payload: CreateRouteRequest, current_user: dict = Depends(get_current_user)):
    """Create a new driver route in driverRoutes collection."""
    driver_id = current_user["uid"]
    firestore_db = _get_db()

    # Verify the user actually has a driver profile
    driver_doc = firestore_db.collection("drivers").document(driver_id).get()
    if not driver_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only registered drivers can create routes. Create a driver profile first."
        )

    route_id = f"route_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)

    route_data = {
        "driverId": driver_id,
        "startLocation": payload.startLocation.model_dump(),
        "destination": payload.destination.model_dump(),
        "stops": [s.model_dump() for s in payload.stops],
        "routeGeometry": None,  # Placeholder for future OSRM polyline
        "travelDate": payload.travelDate,
        "departureTime": payload.departureTime,
        "arrivalTime": payload.arrivalTime,
        "availableCapacity": payload.availableCapacity,
        "price": payload.price,
        "status": "active",
        "createdAt": now,
        "updatedAt": now,
    }

    firestore_db.collection("driverRoutes").document(route_id).set(route_data)

    return {
        "success": True,
        "data": _serialize({
            "routeId": route_id,
            **route_data,
        }),
    }


# ============================================================
# GET /driver-routes/my
# ============================================================

@router.get(
    "/my",
    summary="Get My Routes",
    description="Returns all routes published by the authenticated driver.",
)
def get_my_routes(current_user: dict = Depends(get_current_user)):
    driver_id = current_user["uid"]
    firestore_db = _get_db()

    docs = (
        firestore_db.collection("driverRoutes")
        .where("driverId", "==", driver_id)
        .stream()
    )

    routes = []
    for doc in docs:
        d = doc.to_dict()
        routes.append(_serialize({"routeId": doc.id, **d}))

    return {"success": True, "data": routes}


# ============================================================
# PATCH /driver-routes/{routeId}
# ============================================================

@router.patch(
    "/{routeId}",
    summary="Update Route",
    description="Update an existing route. Only the owning driver may update.",
)
def update_route(
    routeId: str,
    payload: UpdateRouteRequest,
    current_user: dict = Depends(get_current_user),
):
    driver_id = current_user["uid"]
    firestore_db = _get_db()

    doc_ref = firestore_db.collection("driverRoutes").document(routeId)
    doc_snap = doc_ref.get()

    if not doc_snap.exists:
        raise HTTPException(status_code=404, detail="Route not found.")

    route_data = doc_snap.to_dict()
    if route_data.get("driverId") != driver_id:
        raise HTTPException(status_code=403, detail="Not your route.")

    update_fields = {}
    for field, value in payload.model_dump(exclude_none=True).items():
        if field in ("startLocation", "destination"):
            update_fields[field] = value
        elif field == "stops":
            update_fields["stops"] = value
        else:
            update_fields[field] = value

    if update_fields:
        update_fields["updatedAt"] = datetime.now(timezone.utc)
        doc_ref.update(update_fields)

    updated = doc_ref.get().to_dict()
    return {
        "success": True,
        "data": _serialize({"routeId": routeId, **updated}),
    }


# ============================================================
# DELETE /driver-routes/{routeId}
# ============================================================

@router.delete(
    "/{routeId}",
    summary="Deactivate Route",
    description="Soft-delete a route by setting status to 'inactive'.",
)
def deactivate_route(
    routeId: str,
    current_user: dict = Depends(get_current_user),
):
    driver_id = current_user["uid"]
    firestore_db = _get_db()

    doc_ref = firestore_db.collection("driverRoutes").document(routeId)
    doc_snap = doc_ref.get()

    if not doc_snap.exists:
        raise HTTPException(status_code=404, detail="Route not found.")

    if doc_snap.to_dict().get("driverId") != driver_id:
        raise HTTPException(status_code=403, detail="Not your route.")

    doc_ref.update({
        "status": "inactive",
        "updatedAt": datetime.now(timezone.utc),
    })

    return {
        "success": True,
        "message": "Route deactivated successfully.",
    }
