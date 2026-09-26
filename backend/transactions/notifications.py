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
    notif_id = f"notif_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)

    notif_data = {
        "notificationId": notif_id,
        "userId": user_id,
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
    notifications = []

    if db is not None:
        try:
            query = db.collection("notifications").where("userId", "==", user_id)
            docs = query.stream()
            for doc in docs:
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
