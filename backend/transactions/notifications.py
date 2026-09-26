from datetime import datetime, timezone
import uuid

db = None
try:
    from core.firebase import db as _db
    db = _db
except Exception:
    db = None


def emit_notification(
    user_id: str,
    type: str,
    title: str,
    message: str,
    reference_id: str | None = None
) -> str:
    """
    Creates a notification document in the Firestore 'notifications' collection,
    matching Ash's schema.txt definition:
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
