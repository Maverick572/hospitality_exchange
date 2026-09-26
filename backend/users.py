from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from core.auth import get_current_user
from core.firebase import db


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# ============================================================
# Helper
# ============================================================

def get_user_document(user_id: str):
    """
    Get a user document from Firestore.
    """
    doc = db.collection("users").document(user_id).get()

    if not doc.exists:
        return None

    return doc.to_dict()


# ============================================================
# CREATE USER PROFILE
# ============================================================

@router.post("/profile")
def create_user_profile(
    profile: dict,
    current_user=Depends(get_current_user)
):
    """
    Create the application profile for an authenticated
    Firebase user.

    Firebase Authentication handles:
        - Email/password
        - Google login
        - etc.

    Firestore handles:
        - Business profile
        - Location
        - Rating
        - Application-specific information
    """

    user_id = current_user["uid"]

    user_ref = db.collection("users").document(user_id)

    # Prevent accidental overwriting of an existing profile
    if user_ref.get().exists:
        raise HTTPException(
            status_code=409,
            detail="User profile already exists."
        )

    now = datetime.now(timezone.utc)

    user_data = {
        "name": profile.get("name"),
        "email": current_user.get("email"),
        "phone": profile.get("phone"),
        "businessName": profile.get("businessName"),
        "location": profile.get("location"),
        "profileImage": profile.get("profileImage"),

        # New users start with no ratings
        "rating": 0,
        "totalRatings": 0,

        "createdAt": now,
        "updatedAt": now
    }

    user_ref.set(user_data)

    return {
        "success": True,
        "data": {
            "userId": user_id,
            **user_data
        }
    }


# ============================================================
# GET CURRENT USER
# ============================================================

@router.get("/me")
def get_current_user_profile(
    current_user=Depends(get_current_user)
):
    """
    Return the application profile of the authenticated user.
    """

    user_id = current_user["uid"]

    user_data = get_user_document(user_id)

    if user_data is None:
        raise HTTPException(
            status_code=404,
            detail="User profile not found."
        )

    return {
        "success": True,
        "data": {
            "userId": user_id,
            **user_data
        }
    }


# ============================================================
# UPDATE CURRENT USER
# ============================================================

@router.patch("/me")
def update_current_user_profile(
    profile: dict,
    current_user=Depends(get_current_user)
):
    """
    Update the authenticated user's application profile.
    """

    user_id = current_user["uid"]

    user_ref = db.collection("users").document(user_id)

    if not user_ref.get().exists:
        raise HTTPException(
            status_code=404,
            detail="User profile not found."
        )

    allowed_fields = {
        "name",
        "phone",
        "businessName",
        "location",
        "profileImage"
    }

    update_data = {
        key: value
        for key, value in profile.items()
        if key in allowed_fields
    }

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No valid fields provided for update."
        )

    update_data["updatedAt"] = datetime.now(timezone.utc)

    user_ref.update(update_data)

    updated_user = user_ref.get().to_dict()

    return {
        "success": True,
        "data": {
            "userId": user_id,
            **updated_user
        }
    }