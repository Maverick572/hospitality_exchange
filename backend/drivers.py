from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import auth as fb_auth, firestore
from pydantic import BaseModel, Field

from core.auth import get_current_user

router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"]
)

# Safe Firestore client initialization
try:
    db = firestore.client()
except Exception:
    db = None


def get_db():
    global db
    if db is None:
        try:
            db = firestore.client()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Firestore client is not initialized: {str(e)}"
            )
    return db


# ============================================================
# SCHEMAS (Pydantic Models)
# ============================================================

class DriverProfileCreate(BaseModel):
    name: str = Field(..., min_length=2, description="Driver full name")
    phone: str = Field(..., min_length=10, max_length=15, description="Contact phone number")
    vehicleType: str = Field(..., min_length=2, description="Type of vehicle e.g. Tata Ace, 3-Wheeler")
    vehicleNumber: str = Field(..., min_length=4, max_length=20, description="Vehicle registration plate number")
    capacity: int = Field(..., gt=0, description="Vehicle payload capacity in kg/units")
    licenseNumber: Optional[str] = Field(None, description="Driver License number for future DigiLocker verification")


class DriverProfileData(BaseModel):
    driverId: str
    name: str
    email: Optional[str] = None
    phone: str
    vehicleType: str
    vehicleNumber: str
    capacity: int
    licenseNumber: Optional[str] = None
    verificationStatus: Literal["unverified", "pending", "verified", "rejected"] = "unverified"
    rating: float = 0.0
    totalRatings: int = 0
    status: Literal["active", "inactive"] = "active"
    createdAt: datetime
    updatedAt: datetime


class DriverProfileResponse(BaseModel):
    success: bool = True
    data: DriverProfileData


class DriverAuthStatusData(BaseModel):
    uid: str
    email: Optional[str] = None
    hasDriverProfile: bool
    verificationStatus: Optional[str] = None
    role: Optional[str] = None


class DriverAuthStatusResponse(BaseModel):
    success: bool = True
    data: DriverAuthStatusData


# ============================================================
# DRIVER AUTH STATUS (Google Sign-In Callback/Check)
# ============================================================

@router.get(
    "/auth/status",
    response_model=DriverAuthStatusResponse,
    summary="Check Driver Auth Status",
    description="Inspects whether an authenticated Firebase user has completed driver profile setup."
)
def get_driver_auth_status(
    current_user: dict = Depends(get_current_user)
):
    """
    Called after Google Sign-In to determine whether the driver has registered
    their vehicle details or needs to be directed to the onboarding screen.
    """
    user_id = current_user["uid"]
    firestore_db = get_db()
    driver_ref = firestore_db.collection("drivers").document(user_id)
    driver_doc = driver_ref.get()

    if driver_doc.exists:
        driver_data = driver_doc.to_dict()
        return {
            "success": True,
            "data": {
                "uid": user_id,
                "email": current_user.get("email") or driver_data.get("email"),
                "hasDriverProfile": True,
                "verificationStatus": driver_data.get("verificationStatus", "unverified"),
                "role": current_user.get("role") or "driver"
            }
        }

    return {
        "success": True,
        "data": {
            "uid": user_id,
            "email": current_user.get("email"),
            "hasDriverProfile": False,
            "verificationStatus": None,
            "role": current_user.get("role")
        }
    }


# ============================================================
# CREATE DRIVER PROFILE
# ============================================================

@router.post(
    "/profile",
    status_code=status.HTTP_201_CREATED,
    response_model=DriverProfileResponse,
    summary="Create Driver Profile",
    description="Registers a driver profile for an authenticated Firebase user with vehicle specs and DigiLocker identity fields."
)
def create_driver_profile(
    profile: DriverProfileCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a driver profile for an authenticated Firebase user.
    Driver-specific information is stored in Firestore: drivers/{firebase_uid}
    Sets custom claim role='driver' on Firebase Auth user.
    """
    user_id = current_user["uid"]
    firestore_db = get_db()
    driver_ref = firestore_db.collection("drivers").document(user_id)

    # Prevent duplicate driver profiles
    if driver_ref.get().exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Driver profile already exists."
        )

    now = datetime.now(timezone.utc)

    driver_data = {
        "name": profile.name,
        "email": current_user.get("email"),
        "phone": profile.phone,
        "vehicleType": profile.vehicleType,
        "vehicleNumber": profile.vehicleNumber,
        "capacity": profile.capacity,
        "licenseNumber": profile.licenseNumber,

        # Identity & verification state (future-proofed for DigiLocker)
        "verificationStatus": "unverified",

        # New drivers start with no ratings
        "rating": 0.0,
        "totalRatings": 0,

        "status": "active",
        "createdAt": now,
        "updatedAt": now
    }

    driver_ref.set(driver_data)

    # Assign Firebase custom claim for Driver role
    try:
        fb_auth.set_custom_user_claims(user_id, {"role": "driver"})
    except Exception:
        # Pass gracefully in mock or offline testing environments
        pass

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

@router.get(
    "/me",
    response_model=DriverProfileResponse,
    summary="Get Current Driver Profile",
    description="Returns the driver profile belonging to the authenticated user."
)
def get_current_driver_profile(
    current_user: dict = Depends(get_current_user)
):
    """
    Return the driver profile belonging to the authenticated user.
    """
    user_id = current_user["uid"]
    firestore_db = get_db()
    driver_ref = firestore_db.collection("drivers").document(user_id)
    driver_doc = driver_ref.get()

    if not driver_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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