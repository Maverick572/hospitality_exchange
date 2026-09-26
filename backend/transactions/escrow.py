from datetime import datetime, timezone
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

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
    prefix="/escrow",
    tags=["Escrow & Payments"]
)


# ============================================================
# 1. CREATE ESCROW
# ============================================================

@router.post("", status_code=status.HTTP_201_CREATED)
def create_escrow(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Create escrow for a booking (or retrieve existing if already created).
    """
    booking_id = payload.get("bookingId")
    if not booking_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="bookingId is required."
        )

    if db is None:
        raise HTTPException(status_code=500, detail="Database client unavailable.")

    # 1. Check if escrow already exists for this booking (idempotency)
    try:
        existing_docs = db.collection("escrow").where("bookingId", "==", booking_id).stream()
        for doc in existing_docs:
            esc = doc.to_dict()
            esc["escrowId"] = doc.id
            return standard_response(
                data={
                    "escrowId": doc.id,
                    "bookingId": booking_id,
                    "amount": esc.get("amount"),
                    "depositAmount": esc.get("depositAmount"),
                    "status": esc.get("status", "").lower()
                },
                message="Escrow already exists for this booking."
            )
    except Exception:
        pass

    # 2. Retrieve booking to derive amounts
    doc_ref, booking = get_doc_or_404(db, "bookings", booking_id)

    escrow_id = f"escrow_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)

    total_amount = float(booking.get("totalAmount", 0.0))
    deposit_amount = float(booking.get("depositAmount", 0.0))
    provider_amount = float(booking.get("resourceAmount", 0.0))
    driver_amount = float(booking.get("deliveryAmount", 0.0))

    escrow_data = {
        "escrowId": escrow_id,
        "bookingId": booking_id,
        "seekerId": booking.get("seekerId"),
        "providerId": booking.get("providerId"),
        "driverId": booking.get("driverId"),
        "amount": total_amount,
        "depositAmount": deposit_amount,
        "penaltyAmount": 0.0,
        "providerAmount": provider_amount,
        "driverAmount": driver_amount,
        "paymentReference": None,
        "status": "PENDING",
        "createdAt": now,
        "fundedAt": None,
        "releasedAt": None
    }

    db.collection("escrow").document(escrow_id).set(escrow_data)
    doc_ref.update({"escrowId": escrow_id, "updatedAt": now})

    return standard_response(
        data={
            "escrowId": escrow_id,
            "bookingId": booking_id,
            "amount": total_amount,
            "depositAmount": deposit_amount,
            "status": "pending"
        },
        message="Escrow created successfully."
    )


# ============================================================
# 2. FUND ESCROW (MOCK PAYMENT)
# ============================================================

@router.post("/{escrow_id}/fund")
def fund_escrow(
    escrow_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Fund escrow (mock payment confirmation).
    Transitions escrow status PENDING -> FUNDED.
    """
    payment_reference = payload.get("paymentReference", f"pay_mock_{uuid.uuid4().hex[:8]}")

    if db is None:
        raise HTTPException(status_code=500, detail="Database client unavailable.")

    doc_ref, escrow = get_doc_or_404(db, "escrow", escrow_id)

    if escrow.get("status") != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot fund escrow with status '{escrow.get('status')}'. Escrow must be PENDING."
        )

    now = datetime.now(timezone.utc)
    doc_ref.update({
        "status": "FUNDED",
        "paymentReference": payment_reference,
        "fundedAt": now,
        "updatedAt": now
    })

    # Update corresponding booking escrowStatus
    booking_id = escrow.get("bookingId")
    if booking_id:
        try:
            db.collection("bookings").document(booking_id).update({
                "escrowStatus": "funded",
                "updatedAt": now
            })
        except Exception:
            pass

    # Notify provider
    if escrow.get("providerId"):
        emit_notification(
            user_id=escrow["providerId"],
            type="escrow_funded",
            title="Escrow Funded",
            message=f"Escrow {escrow_id} for booking {booking_id} has been funded (₹{escrow.get('amount')}).",
            reference_id=escrow_id
        )

    return standard_response(
        data={
            "escrowId": escrow_id,
            "status": "funded",
            "fundedAt": now.isoformat()
        },
        message="Escrow funded successfully."
    )


# ============================================================
# 3. RELEASE ESCROW (SPLIT CALCULATION & RETURN DEPOSIT)
# ============================================================

@router.post("/{escrow_id}/release")
def release_escrow(
    escrow_id: str,
    payload: dict | None = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Release escrow after successful fulfillment.
    Splits payout to provider and driver, returning deposit minus any penalties.
    """
    if payload is None:
        payload = {}

    raw_penalty = float(payload.get("penaltyAmount", 0.0) or 0.0)

    if db is None:
        raise HTTPException(status_code=500, detail="Database client unavailable.")

    doc_ref, escrow = get_doc_or_404(db, "escrow", escrow_id)

    current_status = escrow.get("status")

    # Double release guard
    if current_status == "RELEASED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Escrow has already been released."
        )

    if current_status not in ("FUNDED", "DELIVERED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot release escrow with status '{current_status}'. Escrow must be FUNDED or DELIVERED."
        )

    deposit = float(escrow.get("depositAmount", 0.0))
    # Penalty overflow guard: penalty cannot exceed depositAmount
    penalty = min(max(0.0, raw_penalty), deposit)
    deposit_returned = round(deposit - penalty, 2)

    base_provider = float(escrow.get("providerAmount", 0.0))
    provider_amount = round(base_provider + penalty, 2)
    driver_amount = round(float(escrow.get("driverAmount", 0.0)), 2)

    now = datetime.now(timezone.utc)
    doc_ref.update({
        "status": "RELEASED",
        "penaltyAmount": penalty,
        "depositReturned": deposit_returned,
        "providerAmount": provider_amount,
        "driverAmount": driver_amount,
        "releasedAt": now,
        "updatedAt": now
    })

    # Update booking to completed
    booking_id = escrow.get("bookingId")
    if booking_id:
        try:
            db.collection("bookings").document(booking_id).update({
                "status": "completed",
                "escrowStatus": "released",
                "updatedAt": now
            })
        except Exception:
            pass

    # Notify provider
    if escrow.get("providerId"):
        emit_notification(
            user_id=escrow["providerId"],
            type="escrow_released",
            title="Payment Released",
            message=f"₹{provider_amount} has been released to your account for booking {booking_id}.",
            reference_id=escrow_id
        )

    # Notify driver if amount > 0
    if escrow.get("driverId") and driver_amount > 0:
        emit_notification(
            user_id=escrow["driverId"],
            type="escrow_released",
            title="Delivery Payout Released",
            message=f"₹{driver_amount} has been released for delivery of booking {booking_id}.",
            reference_id=escrow_id
        )

    return standard_response(
        data={
            "escrowId": escrow_id,
            "status": "released",
            "providerAmount": provider_amount,
            "driverAmount": driver_amount,
            "depositReturned": deposit_returned
        },
        message="Escrow released successfully."
    )


# ============================================================
# 4. GET ESCROW STATUS
# ============================================================

@router.get("/{escrow_id}")
def get_escrow_detail(
    escrow_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get escrow status and financial breakdown.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database client unavailable.")

    doc_ref, escrow = get_doc_or_404(db, "escrow", escrow_id)
    escrow["escrowId"] = escrow_id

    return standard_response(data=serialize_firestore_doc(escrow))
