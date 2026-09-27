from datetime import datetime, timezone
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from core.auth import get_current_user
from transactions.helpers import serialize_firestore_doc, standard_response

db = None
try:
    from core.firebase import db as _db
    db = _db
except Exception:
    db = None

try:
    from services.category_registry import EVIDENCE_TYPE_BY_CATEGORY
except ImportError:
    EVIDENCE_TYPE_BY_CATEGORY = {}

router = APIRouter(
    prefix="/condition-evidence",
    tags=["Condition Evidence"]
)


# Evidence type compatibility map
_EVIDENCE_COMPAT = {
    "photo": {"photo"},
    "video": {"video"},
    "photo_video": {"photo", "video"},
}


def _validate_media_type(category: str, media_type: str) -> None:
    """Validate that the uploaded media type matches the category's requirement.

    Raises HTTPException if the media type is incompatible.
    """
    required = EVIDENCE_TYPE_BY_CATEGORY.get(category)
    if not required:
        return  # Unknown category — skip validation

    allowed = _EVIDENCE_COMPAT.get(required, {"photo", "video"})
    if media_type not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Category '{category}' requires {required} evidence, "
                f"but received '{media_type}'."
            ),
        )


# ============================================================
# RECORD CONDITION EVIDENCE
# ============================================================

@router.post("", status_code=status.HTTP_201_CREATED)
def record_condition_evidence(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Record condition evidence metadata (image/video URL from Firebase Storage + description).
    Stages allowed: 'PICKUP', 'DELIVERY'.
    Optional 'mediaType' field: 'photo' or 'video' — validated against the resource category.
    """
    user_id = current_user["uid"]
    booking_id = payload.get("bookingId")
    stage = payload.get("stage", "").upper()
    image_url = payload.get("imageUrl")
    evidence_type = payload.get("type", "resource_condition")
    description = payload.get("description", "")
    media_type = payload.get("mediaType")  # Optional: "photo" or "video"

    if not booking_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="bookingId is required."
        )

    if not image_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="imageUrl is required."
        )

    if stage not in ("PICKUP", "DELIVERY"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stage must be either 'PICKUP' or 'DELIVERY'."
        )

    # If mediaType is provided, validate against the resource's category
    if media_type and db is not None:
        booking_doc = db.collection("bookings").document(booking_id).get()
        if booking_doc.exists:
            resource_id = booking_doc.to_dict().get("resourceId")
            if resource_id:
                resource_doc = db.collection("resources").document(resource_id).get()
                if resource_doc.exists:
                    category = resource_doc.to_dict().get("category", "")
                    _validate_media_type(category, media_type)

    evidence_id = f"evidence_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)

    evidence_data = {
        "evidenceId": evidence_id,
        "bookingId": booking_id,
        "uploadedBy": user_id,
        "stage": stage,
        "type": evidence_type,
        "imageUrl": image_url,
        "description": description,
        "timestamp": now
    }

    if media_type:
        evidence_data["mediaType"] = media_type

    if db is not None:
        db.collection("conditionEvidence").document(evidence_id).set(evidence_data)

    return standard_response(
        data={
            "evidenceId": evidence_id,
            "bookingId": booking_id,
            "stage": stage,
            "imageUrl": image_url,
            "timestamp": now.isoformat()
        },
        message="Condition evidence recorded successfully."
    )


# ============================================================
# GET CONDITION EVIDENCE FOR BOOKING
# ============================================================

@router.get("/{booking_id}", summary="Get condition evidence for booking")
def get_condition_evidence(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve all condition evidence uploaded for a given booking (both PICKUP and DELIVERY stages)."""
    results = []
    if db is not None:
        docs = db.collection("conditionEvidence").where("bookingId", "==", booking_id).stream()
        for doc in docs:
            item = doc.to_dict() or {}
            item["evidenceId"] = doc.id
            results.append(serialize_firestore_doc(item))
    # Sort by timestamp ascending
    results.sort(key=lambda x: x.get("timestamp", ""))
    return standard_response(data=results)

