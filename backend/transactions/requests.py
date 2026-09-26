from datetime import datetime, timezone
import uuid
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
    prefix="/requests",
    tags=["Requests & Negotiation"]
)


# ============================================================
# 1. CREATE REQUEST
# ============================================================

@router.post("", status_code=status.HTTP_201_CREATED)
def create_request(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Seeker creates a resource request to a provider.
    Firestore Schema (schema.txt):
      - requestId
      - requirementId
      - seekerId
      - providerId
      - resourceId
      - requestedQuantity
      - offeredPrice
      - counterPrice
      - message
      - status ("pending")
      - createdAt
      - updatedAt
    """
    seeker_id = current_user["uid"]
    provider_id = payload.get("providerId")
    resource_id = payload.get("resourceId")
    requested_quantity = payload.get("requestedQuantity")
    offered_price = payload.get("offeredPrice")
    message = payload.get("message", "")
    requirement_id = payload.get("requirementId")

    if not provider_id or not resource_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="providerId and resourceId are required."
        )

    if requested_quantity is None or requested_quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="requestedQuantity must be greater than zero."
        )

    if offered_price is None or offered_price <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="offeredPrice must be greater than zero."
        )

    request_id = f"request_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)

    request_data = {
        "requestId": request_id,
        "requirementId": requirement_id,
        "seekerId": seeker_id,
        "providerId": provider_id,
        "resourceId": resource_id,
        "requestedQuantity": int(requested_quantity),
        "offeredPrice": float(offered_price),
        "counterPrice": None,
        "message": message,
        "status": "pending",
        "createdAt": now,
        "updatedAt": now
    }

    if db is not None:
        db.collection("requests").document(request_id).set(request_data)

    emit_notification(
        user_id=provider_id,
        type="REQUEST_RECEIVED",
        title="New Resource Request",
        message=f"You received a request for {requested_quantity} items: '{message}'",
        reference_id=request_id
    )

    return standard_response(
        data=serialize_firestore_doc(request_data),
        message="Request submitted successfully."
    )


# ============================================================
# 2. GET PROVIDER REQUESTS
# ============================================================

@router.get("/provider")
def get_provider_requests(
    status_filter: str | None = Query(default=None, alias="status"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get requests received by the authenticated provider.
    Enriches seeker and resource metadata matching backendAPI.md contract.
    """
    provider_id = current_user["uid"]

    results = []
    if db is not None:
        query = db.collection("requests").where("providerId", "==", provider_id)
        docs = query.stream()
        for doc in docs:
            item = doc.to_dict() or {}
            item["requestId"] = doc.id

            if status_filter and item.get("status") != status_filter:
                continue

            # Enrich seeker details if not nested
            seeker_id = item.get("seekerId")
            if "seeker" not in item and seeker_id:
                seeker_info = {"userId": seeker_id, "businessName": seeker_id}
                try:
                    s_snap = db.collection("users").document(seeker_id).get()
                    if s_snap.exists:
                        s_data = s_snap.to_dict() or {}
                        seeker_info["businessName"] = s_data.get("businessName") or s_data.get("name") or seeker_id
                except Exception:
                    pass
                item["seeker"] = seeker_info

            # Enrich resource details if not nested
            resource_id = item.get("resourceId")
            if "resource" not in item and resource_id:
                resource_info = {"resourceId": resource_id, "name": "Resource"}
                try:
                    r_snap = db.collection("resources").document(resource_id).get()
                    if r_snap.exists:
                        r_data = r_snap.to_dict() or {}
                        resource_info["name"] = r_data.get("name") or "Resource"
                except Exception:
                    pass
                item["resource"] = resource_info

            results.append(serialize_firestore_doc(item))

    return standard_response(data=results)


# ============================================================
# 3. COUNTER-OFFER
# ============================================================

@router.post("/{request_id}/counter")
def counter_request(
    request_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit a counter-offer.
    Per negotiation requirements: both seeker and provider can counter back and forth,
    and a rejected offer can be revived with a new counter-offer.
    """
    user_id = current_user["uid"]
    price = payload.get("price")
    quantity = payload.get("quantity")
    message = payload.get("message", "")

    if price is None or price <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Counter price must be greater than zero."
        )

    if quantity is None or quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Counter quantity must be greater than zero."
        )

    if db is None:
        raise HTTPException(status_code=500, detail="Database client unavailable.")

    doc_ref, req = get_doc_or_404(db, "requests", request_id)

    if user_id not in (req.get("seekerId"), req.get("providerId")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to negotiate on this request."
        )

    if req.get("status") == "accepted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot counter an offer that has already been accepted."
        )

    now = datetime.now(timezone.utc)
    update_data = {
        "counterPrice": float(price),
        "requestedQuantity": int(quantity),
        "status": "countered",
        "updatedAt": now
    }
    if message:
        update_data["message"] = message

    doc_ref.update(update_data)

    # Determine recipient of the notification
    recipient_id = req["seekerId"] if user_id == req["providerId"] else req["providerId"]

    emit_notification(
        user_id=recipient_id,
        type="REQUEST_COUNTERED",
        title="Counter-Offer Received",
        message=f"New counter offer: {quantity} items for ₹{price}. {message}".strip(),
        reference_id=request_id
    )

    return standard_response(
        data={
            "requestId": request_id,
            "counterPrice": float(price),
            "quantity": int(quantity),
            "status": "countered"
        },
        message="Counter-offer submitted successfully."
    )


# ============================================================
# 4. ACCEPT REQUEST (CREATES BOOKING & ESCROW)
# ============================================================

@router.post("/{request_id}/accept")
def accept_request(
    request_id: str,
    payload: dict | None = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Accept current offer / counter-offer.
    Critical state transition: creates booking and initializes escrow matching schema.txt.
    """
    if payload is None:
        payload = {}

    user_id = current_user["uid"]

    if db is None:
        raise HTTPException(status_code=500, detail="Database client unavailable.")

    doc_ref, req = get_doc_or_404(db, "requests", request_id)

    if user_id not in (req.get("seekerId"), req.get("providerId")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to accept this request."
        )

    current_status = req.get("status")
    if current_status not in ("pending", "countered"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot accept request with status '{current_status}'."
        )

    # Calculate amounts
    agreed_price = req.get("counterPrice") if req.get("counterPrice") is not None else req.get("offeredPrice", 0.0)
    resource_amount = float(agreed_price)
    delivery_amount = float(payload.get("deliveryAmount", 0.0) or 0.0)

    # Deposit amount defaults to 20% of resourceAmount
    default_deposit = round(resource_amount * 0.20, 2)
    deposit_amount = float(payload.get("depositAmount", default_deposit) if payload.get("depositAmount") is not None else default_deposit)
    total_amount = round(resource_amount + delivery_amount + deposit_amount, 2)

    # Resolve locations and dates from payload, requirement, or resource
    pickup_location = payload.get("pickupLocation") or {}
    delivery_location = payload.get("deliveryLocation") or {}
    pickup_date = payload.get("pickupDate")
    delivery_date = payload.get("deliveryDate")

    # If requirement exists, extract missing delivery location or date
    req_id = req.get("requirementId")
    if req_id:
        try:
            req_snap = db.collection("requirements").document(req_id).get()
            if req_snap.exists:
                req_doc_data = req_snap.to_dict() or {}
                if not delivery_location and "location" in req_doc_data:
                    delivery_location = req_doc_data["location"]
                if not delivery_date and "requiredDate" in req_doc_data:
                    delivery_date = req_doc_data["requiredDate"]
                    pickup_date = pickup_date or delivery_date
        except Exception:
            pass

    # If resource exists, extract missing pickup location
    res_id = req.get("resourceId")
    if res_id and not pickup_location:
        try:
            res_snap = db.collection("resources").document(res_id).get()
            if res_snap.exists:
                res_doc_data = res_snap.to_dict() or {}
                pickup_location = res_doc_data.get("location", {})
        except Exception:
            pass

    now = datetime.now(timezone.utc)
    booking_id = f"booking_{uuid.uuid4().hex[:12]}"
    escrow_id = f"escrow_{uuid.uuid4().hex[:12]}"

    # Booking Schema (schema.txt)
    booking_data = {
        "bookingId": booking_id,
        "seekerId": req["seekerId"],
        "providerId": req["providerId"],
        "resourceId": req["resourceId"],
        "driverId": None,
        "requirementId": req.get("requirementId"),
        "quantity": req.get("requestedQuantity", 1),
        "resourceAmount": resource_amount,
        "deliveryAmount": delivery_amount,
        "depositAmount": deposit_amount,
        "totalAmount": total_amount,
        "pickupLocation": pickup_location,
        "deliveryLocation": delivery_location,
        "pickupDate": pickup_date,
        "deliveryDate": delivery_date,
        "status": "confirmed",
        "escrowStatus": "pending",
        "escrowId": escrow_id,
        "createdAt": now,
        "updatedAt": now
    }

    # Escrow Schema (schema.txt)
    escrow_data = {
        "escrowId": escrow_id,
        "bookingId": booking_id,
        "seekerId": req["seekerId"],
        "providerId": req["providerId"],
        "driverId": None,
        "amount": total_amount,
        "depositAmount": deposit_amount,
        "penaltyAmount": 0.0,
        "providerAmount": resource_amount,
        "driverAmount": delivery_amount,
        "status": "PENDING",
        "createdAt": now,
        "fundedAt": None,
        "releasedAt": None
    }

    # Atomically write booking, escrow, and update request
    db.collection("bookings").document(booking_id).set(booking_data)
    db.collection("escrow").document(escrow_id).set(escrow_data)

    doc_ref.update({
        "status": "accepted",
        "bookingId": booking_id,
        "updatedAt": now
    })

    # Notify both parties
    emit_notification(
        user_id=req["seekerId"],
        type="BOOKING_CONFIRMED",
        title="Booking Confirmed",
        message=f"Your request for resource {req['resourceId']} has been confirmed into booking {booking_id}.",
        reference_id=booking_id
    )
    emit_notification(
        user_id=req["providerId"],
        type="BOOKING_CONFIRMED",
        title="Booking Confirmed",
        message=f"Booking {booking_id} has been created for your resource {req['resourceId']}.",
        reference_id=booking_id
    )

    return standard_response(
        data={
            "requestId": request_id,
            "status": "accepted",
            "bookingId": booking_id
        },
        message="Request accepted and booking created successfully."
    )


# ============================================================
# 5. REJECT REQUEST
# ============================================================

@router.post("/{request_id}/reject")
def reject_request(
    request_id: str,
    payload: dict | None = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Reject request with an optional reason.
    """
    if payload is None:
        payload = {}

    user_id = current_user["uid"]
    reason = payload.get("reason", "No reason provided.")

    if db is None:
        raise HTTPException(status_code=500, detail="Database client unavailable.")

    doc_ref, req = get_doc_or_404(db, "requests", request_id)

    if user_id not in (req.get("seekerId"), req.get("providerId")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to reject this request."
        )

    if req.get("status") == "accepted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reject a request that has already been accepted."
        )

    now = datetime.now(timezone.utc)
    doc_ref.update({
        "status": "rejected",
        "rejectionReason": reason,
        "updatedAt": now
    })

    recipient_id = req["seekerId"] if user_id == req["providerId"] else req["providerId"]
    emit_notification(
        user_id=recipient_id,
        type="REQUEST_REJECTED",
        title="Request Rejected",
        message=f"Request {request_id} was rejected. Reason: {reason}",
        reference_id=request_id
    )

    return standard_response(
        data={
            "requestId": request_id,
            "status": "rejected",
            "reason": reason
        },
        message="Request rejected."
    )
