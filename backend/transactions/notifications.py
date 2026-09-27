from datetime import datetime, timezone
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from core.auth import get_current_user
from transactions.helpers import get_doc_or_404, serialize_firestore_doc, standard_response

db = None
try:
    from core.firebase import db as _db
    db = _db
except Exception:
    db = None

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


BUSINESS_NAME_TO_UID = {
    "taj lands end": "usr_taj_lands_end",
    "taj": "usr_taj_lands_end",
    "itc maratha mumbai": "usr_itc_maratha",
    "itc maratha": "usr_itc_maratha",
    "itc": "usr_itc_maratha",
    "trident hotel bkc": "usr_trident_bkc",
    "trident bkc": "usr_trident_bkc",
    "trident": "usr_trident_bkc",
    "renaissance mumbai convention centre": "usr_renaissance_powai",
    "renaissance powai": "usr_renaissance_powai",
    "renaissance": "usr_renaissance_powai",
    "hotel sahara star": "usr_sahara_star",
    "sahara star": "usr_sahara_star",
    "sahara": "usr_sahara_star",
    "jio world convention centre": "usr_jio_convention",
    "jio world centre": "usr_jio_convention",
    "jio convention": "usr_jio_convention",
    "jio": "usr_jio_convention",
    "bombay gymkhana club": "usr_bombay_gymkhana",
    "bombay gymkhana": "usr_bombay_gymkhana",
    "nesco exhibition centre": "usr_nesco_goregaon",
    "nesco": "usr_nesco_goregaon",
    "the taj mahal palace": "usr_taj_colaba",
    "taj colaba": "usr_taj_colaba",
    "taj palace": "usr_taj_colaba",
    "blue sea banquets worli": "usr_blue_sea_worli",
    "blue sea": "usr_blue_sea_worli",
}

def resolve_user_id(val: str | None) -> str:
    if not val:
        return "usr_taj_lands_end"
    if val.startswith("usr_") or val.startswith("drv_"):
        return val
    lower = val.lower().strip()
    for k, v in BUSINESS_NAME_TO_UID.items():
        if k in lower:
            return v
    return val


def emit_notification(
    user_id: str,
    type: str,
    title: str,
    message: str,
    reference_id: str | None = None
) -> str:
    """
    Creates a notification document in the Firestore 'notifications' collection,
    matching schema.txt definition:
      - userId
      - type
      - title
      - message
      - referenceId
      - read (False)
      - createdAt
    """
    canonical_id = resolve_user_id(user_id)
    notif_id = f"notif_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)

    notif_data = {
        "notificationId": notif_id,
        "userId": canonical_id,
        "type": type,
        "title": title,
        "message": message,
        "referenceId": reference_id,
        "read": False,
        "createdAt": now
    }

    if db is not None:
        try:
            notif_ref = db.collection("notifications").document(notif_id)
            notif_ref.set(notif_data)
        except Exception as e:
            # Notifications shouldn't crash transactions if offline/mocked
            print(f"[Warning] Failed to emit notification: {e}")

    return notif_id


# ============================================================
# 1. GET USER NOTIFICATIONS
# ============================================================

@router.get("")
def get_user_notifications(
    current_user: dict = Depends(get_current_user)
):
    """
    Get notifications for the authenticated user.
    """
    user_id = current_user["uid"]
    canonical_id = resolve_user_id(user_id)
    notifications = []
    seen_ids = set()

    if db is not None:
        try:
            ids_to_query = list({user_id, canonical_id})
            for q_id in ids_to_query:
                query = db.collection("notifications").where("userId", "==", q_id)
                docs = query.stream()
                for doc in docs:
                    if doc.id not in seen_ids:
                        seen_ids.add(doc.id)
                        item = doc.to_dict()
                        item["notificationId"] = doc.id
                        notifications.append(serialize_firestore_doc(item))
        except Exception as e:
            print(f"[Warning] Failed to retrieve notifications: {e}")

    # Sort in memory by createdAt descending
    try:
        notifications.sort(key=lambda x: str(x.get("createdAt", "")), reverse=True)
    except Exception:
        pass

    return standard_response(data=notifications)


# ============================================================
# 2. SEND / DISPATCH NOTIFICATION
# ============================================================

@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/send", status_code=status.HTTP_201_CREATED)
def send_notification(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Directly dispatch a notification to another user or business.
    Useful for negotiation offers, inquiries, and logistics handoffs.
    """
    recipient = payload.get("userId") or payload.get("recipientId") or payload.get("recipient")
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="userId or recipientId is required."
        )

    canonical_recipient = resolve_user_id(recipient)
    notif_type = payload.get("type", "REQUEST_RECEIVED")
    title = payload.get("title", "New Notification")
    message = payload.get("message", "")
    reference_id = payload.get("referenceId")

    notif_id = emit_notification(
        user_id=canonical_recipient,
        type=notif_type,
        title=title,
        message=message,
        reference_id=reference_id
    )

    return standard_response(
        data={
            "notificationId": notif_id,
            "userId": canonical_recipient,
            "type": notif_type,
            "title": title,
            "message": message,
            "referenceId": reference_id,
            "read": False,
            "createdAt": datetime.now(timezone.utc).isoformat()
        },
        message="Notification delivered successfully."
    )


# ============================================================
# 2. MARK NOTIFICATION AS READ
# ============================================================

@router.patch("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark a notification as read.
    """
    user_id = current_user["uid"]

    if db is None:
        raise HTTPException(status_code=500, detail="Database client unavailable.")

    doc_ref, notif = get_doc_or_404(db, "notifications", notification_id)

    # Authorization: check ownership if userId present
    if notif.get("userId") and notif.get("userId") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this notification."
        )

    doc_ref.update({"read": True})

    return standard_response(
        data={
            "notificationId": notification_id,
            "read": True
        }
    )
