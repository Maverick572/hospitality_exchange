from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from core.auth import get_current_user
from transactions.helpers import standard_response

db = None
try:
    from core.firebase import db as _db
    db = _db
except Exception:
    db = None

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/user")
def get_user_dashboard(
    current_user: dict = Depends(get_current_user)
):
    """
    Get combined dashboard data for an authenticated business user / provider / seeker.
    Aggregates active resources, requirements, requests, bookings, earnings, and pending payments.
    """
    user_id = current_user["uid"]

    active_resources = 0
    active_requirements = 0
    pending_requests = 0
    active_bookings = 0
    completed_bookings = 0
    total_earnings = 0.0
    pending_payments = 0.0

    if db is not None:
        # 1. Active resources
        try:
            r_docs = db.collection("resources").where("providerId", "==", user_id).stream()
            for doc in r_docs:
                data = doc.to_dict() or {}
                if data.get("status") == "active":
                    active_resources += 1
        except Exception:
            pass

        # 2. Active requirements
        try:
            req_docs = db.collection("requirements").where("seekerId", "==", user_id).stream()
            for doc in req_docs:
                data = doc.to_dict() or {}
                if data.get("status") == "active":
                    active_requirements += 1
        except Exception:
            pass

        # 3. Pending requests (as provider or seeker)
        try:
            req_p_docs = db.collection("requests").where("providerId", "==", user_id).stream()
            for doc in req_p_docs:
                data = doc.to_dict() or {}
                if data.get("status") in ("pending", "countered"):
                    pending_requests += 1
        except Exception:
            pass

        # 4. Bookings & Financials
        try:
            b_docs = db.collection("bookings").stream()
            for doc in b_docs:
                b = doc.to_dict() or {}
                is_seeker = b.get("seekerId") == user_id
                is_provider = b.get("providerId") == user_id

                if not (is_seeker or is_provider):
                    continue

                b_status = b.get("status", "")
                if b_status in ("confirmed", "pickup_pending", "picked_up", "in_transit", "delivered"):
                    active_bookings += 1
                elif b_status == "completed":
                    completed_bookings += 1

                # Financial aggregation for provider
                if is_provider:
                    escrow_status = (b.get("escrowStatus") or "").lower()
                    resource_amt = float(b.get("resourceAmount", 0.0) or 0.0)
                    if escrow_status == "released" or b_status == "completed":
                        total_earnings += resource_amt
                    elif escrow_status in ("pending", "funded", "in_transit", "delivered", "pending_release"):
                        pending_payments += resource_amt
        except Exception:
            pass

    return standard_response(
        data={
            "activeResources": active_resources,
            "activeRequirements": active_requirements,
            "pendingRequests": pending_requests,
            "activeBookings": active_bookings,
            "completedBookings": completed_bookings,
            "totalEarnings": round(total_earnings, 2),
            "pendingPayments": round(pending_payments, 2)
        }
    )


@router.get("/driver")
def get_driver_dashboard(
    current_user: dict = Depends(get_current_user)
):
    """
    Get driver dashboard data.
    Aggregates active routes, matched delivery requests, active/completed deliveries, and earnings.
    """
    driver_id = current_user["uid"]

    active_routes = 0
    matched_requests = 0
    active_deliveries = 0
    completed_deliveries = 0
    total_earnings = 0.0
    pending_payments = 0.0

    if db is not None:
        # 1. Driver routes
        try:
            route_docs = db.collection("driverRoutes").where("driverId", "==", driver_id).stream()
            for doc in route_docs:
                r_data = doc.to_dict() or {}
                if r_data.get("status") == "active":
                    active_routes += 1
        except Exception:
            pass

        # 2. Delivery requests
        try:
            del_docs = db.collection("deliveryRequests").where("driverId", "==", driver_id).stream()
            for doc in del_docs:
                d_data = doc.to_dict() or {}
                d_status = d_data.get("status", "")
                if d_status == "pending":
                    matched_requests += 1
                elif d_status in ("accepted", "picked_up", "in_transit"):
                    active_deliveries += 1
                elif d_status in ("delivered", "completed"):
                    completed_deliveries += 1
        except Exception:
            pass

        # 3. Bookings and Escrow payouts for driver
        try:
            b_docs = db.collection("bookings").where("driverId", "==", driver_id).stream()
            for doc in b_docs:
                b = doc.to_dict() or {}
                b_status = b.get("status", "")
                del_amount = float(b.get("deliveryAmount", 0.0) or 0.0)
                escrow_status = (b.get("escrowStatus") or "").lower()

                if escrow_status == "released" or b_status == "completed":
                    total_earnings += del_amount
                elif escrow_status in ("pending", "funded", "in_transit", "delivered", "pending_release"):
                    pending_payments += del_amount
        except Exception:
            pass

    return standard_response(
        data={
            "activeRoutes": active_routes,
            "matchedRequests": matched_requests,
            "activeDeliveries": active_deliveries,
            "completedDeliveries": completed_deliveries,
            "totalEarnings": round(total_earnings, 2),
            "pendingPayments": round(pending_payments, 2)
        }
    )
