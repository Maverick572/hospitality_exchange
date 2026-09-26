from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from core.auth import get_current_user
from transactions.helpers import get_doc_or_404, serialize_firestore_doc, standard_response
from transactions.notifications import emit_notification

db = None
try:
    from core.firebase import db as _db
    db = _db
except Exception:
    db = None

router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


# ============================================================
# 1. LIST MY BOOKINGS
# ============================================================

@router.get("/my")
def get_my_bookings(
    status_filter: str | None = Query(default=None, alias="status"),
    role: str | None = Query(default=None),
    current_user: dict = Depends(get_current_user)
):
    """
    Get bookings involving the authenticated user (as seeker, provider, or driver).
    Optional filter by status (?status=active, confirmed, delivered, etc.).
    """
    user_id = current_user["uid"]
    bookings = []

    if db is not None:
        col_ref = db.collection("bookings")
        docs = col_ref.stream()

        for doc in docs:
            b = doc.to_dict()
            b["bookingId"] = doc.id

            is_seeker = b.get("seekerId") == user_id
            is_provider = b.get("providerId") == user_id
            is_driver = b.get("driverId") == user_id

            if role == "seeker" and not is_seeker:
                continue
            elif role == "provider" and not is_provider:
                continue
            elif role == "driver" and not is_driver:
                continue
            elif not role and not (is_seeker or is_provider or is_driver):
                continue

            if status_filter:
                if status_filter == "active" and b.get("status") in ("completed", "cancelled"):
                    continue
                elif status_filter != "active" and b.get("status") != status_filter:
                    continue

            bookings.append(serialize_firestore_doc(b))

    return standard_response(data=bookings)


# ============================================================
# 2. GET BOOKING DETAIL
# ============================================================

@router.get("/{booking_id}")
def get_booking_detail(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get full booking information.
    Ensures caller is a participant (seeker, provider, or driver).
    """
    user_id = current_user["uid"]

    if db is None:
        raise HTTPException(status_code=500, detail="Database client unavailable.")

    doc_ref, booking = get_doc_or_404(db, "bookings", booking_id)

    participants = {booking.get("seekerId"), booking.get("providerId"), booking.get("driverId")}
    if user_id not in participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this booking."
        )

    booking["bookingId"] = booking_id

    # Optional enrichment with condition evidence
    evidence_list = []
    try:
        ev_docs = db.collection("conditionEvidence").where("bookingId", "==", booking_id).stream()
        for ev in ev_docs:
            evidence_list.append(serialize_firestore_doc(ev.to_dict()))
    except Exception:
        pass
    if evidence_list:
        booking["evidence"] = evidence_list

    return standard_response(data=serialize_firestore_doc(booking))


# ============================================================
# 3. CONFIRM RECEIPT
# ============================================================

@router.post("/{booking_id}/confirm-receipt")
def confirm_receipt(
    booking_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Seeker confirms successful delivery receipt.
    Updates booking status to 'delivered' and escrowStatus to 'delivered'.
    """
    user_id = current_user["uid"]
    received = payload.get("received", True)
    condition_confirmed = payload.get("conditionConfirmed", True)
    notes = payload.get("notes")

    if db is None:
        raise HTTPException(status_code=500, detail="Database client unavailable.")

    doc_ref, booking = get_doc_or_404(db, "bookings", booking_id)

    if booking.get("seekerId") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the seeker can confirm receipt for this booking."
        )

    now = datetime.now(timezone.utc)
    update_data = {
        "status": "delivered",
        "escrowStatus": "delivered",
        "receivedConfirmed": received,
        "conditionConfirmed": condition_confirmed,
        "deliveryNotes": notes,
        "deliveredAt": now,
        "updatedAt": now
    }
    doc_ref.update(update_data)

    # Sync with linked escrow document if exists
    escrow_id = booking.get("escrowId")
    if escrow_id:
        try:
            escrow_ref = db.collection("escrow").document(escrow_id)
            if escrow_ref.get().exists:
                escrow_ref.update({"status": "DELIVERED", "updatedAt": now})
        except Exception:
            pass

    # Notify provider
    emit_notification(
        user_id=booking["providerId"],
        type="delivery_confirmed",
        title="Delivery Receipt Confirmed",
        message=f"The seeker has confirmed receipt of resources for booking {booking_id}.",
        reference_id=booking_id
    )

    # Notify driver if assigned
    if booking.get("driverId"):
        emit_notification(
            user_id=booking["driverId"],
            type="delivery_confirmed",
            title="Delivery Receipt Confirmed",
            message=f"Delivery confirmed for booking {booking_id}. Payout ready for release.",
            reference_id=booking_id
        )

    return standard_response(
        data={
            "bookingId": booking_id,
            "status": "delivered",
            "escrowStatus": "delivered"
        },
        message="Receipt confirmed successfully."
    )
