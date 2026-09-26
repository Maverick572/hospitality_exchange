from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from core.auth import get_current_user
from core.firebase import db

router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"]
)


# ============================================================
# CREATE DRIVER PROFILE
# ============================================================

@router.post("/profile")
def create_driver_profile(
    profile: dict,
    current_user=Depends(get_current_user)
):
    """
    Create a driver profile for an authenticated Firebase user.

    Authentication is handled by Firebase Authentication.
    Driver-specific information is stored in:
        drivers/{firebase_uid}
    """

    user_id = current_user["uid"]

    driver_ref = db.collection("drivers").document(user_id)

    # Prevent duplicate driver profiles
    if driver_ref.get().exists:
        raise HTTPException(
            status_code=409,
            detail="Driver profile already exists."
        )

    now = datetime.now(timezone.utc)

    driver_data = {
        "name": profile.get("name"),
        "email": current_user.get("email"),
        "phone": profile.get("phone"),

        "vehicleType": profile.get("vehicleType"),
        "vehicleNumber": profile.get("vehicleNumber"),
        "capacity": profile.get("capacity"),

        # New drivers start with no ratings
        "rating": 0,
        "totalRatings": 0,

        "status": "active",

        "createdAt": now,
        "updatedAt": now
    }

    driver_ref.set(driver_data)

    return {
        "success": True,
        "data": {
            "driverId": user_id,
            **driver_data
        }
    }


# ============================================================
# GET CURRENT DRIVER
# ============================================================

@router.get("/me")
def get_current_driver_profile(
    current_user=Depends(get_current_user)
):
    """
    Return the driver profile belonging to the authenticated user.
    """

    user_id = current_user["uid"]

    driver_ref = db.collection("drivers").document(user_id)

    driver_doc = driver_ref.get()

    if not driver_doc.exists:
        raise HTTPException(
            status_code=404,
            detail="Driver profile not found."
        )

    driver_data = driver_doc.to_dict()

    return {
        "success": True,
        "data": {
            "driverId": user_id,
            **driver_data
        }
    }