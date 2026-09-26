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

router = APIRouter(
    prefix="/condition-evidence",
    tags=["Condition Evidence"]
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
    Record condition evidence metadata (image URL from Firebase Storage + description).
    Stages allowed: 'PICKUP', 'DELIVERY'.
    """
    user_id = current_user["uid"]
    booking_id = payload.get("bookingId")
    stage = payload.get("stage", "").upper()
    image_url = payload.get("imageUrl")
    evidence_type = payload.get("type", "resource_condition")
    description = payload.get("description", "")

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
