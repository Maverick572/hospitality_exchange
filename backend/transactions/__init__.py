"""
================================================================================
TRANSACTION & APPLICATION LAYER MODULE
================================================================================

This package encapsulates the complete transactional lifecycle for the
Hospitality Resource Exchange platform according to schema.txt & backendAPI.md:
- Requests & Negotiation: POST /requests, GET /requests/provider,
                          POST /requests/{id}/counter, POST /requests/{id}/accept,
                          POST /requests/{id}/reject
- Bookings:               GET /bookings/my, GET /bookings/{id},
                          POST /bookings/{id}/confirm-receipt
- Escrow:                 POST /escrow, POST /escrow/{id}/fund,
                          POST /escrow/{id}/release, GET /escrow/{id}
- Condition Evidence:     POST /condition-evidence
- Reviews & Ratings:      POST /reviews, GET /users/{userId}/reviews
- Notifications:          GET /notifications, PATCH /notifications/{id}/read
- Dashboard:              GET /dashboard/user, GET /dashboard/driver

================================================================================
"""

from fastapi import APIRouter

from transactions.requests import router as requests_router
from transactions.bookings import router as bookings_router
from transactions.escrow import router as escrow_router
from transactions.evidence import router as evidence_router
from transactions.reviews import router as reviews_router
from transactions.notifications import router as notifications_router
from transactions.dashboard import router as dashboard_router

router = APIRouter()

# Mount all domain sub-routers
router.include_router(requests_router)
router.include_router(bookings_router)
router.include_router(escrow_router)
router.include_router(evidence_router)
router.include_router(reviews_router)
router.include_router(notifications_router)
router.include_router(dashboard_router)

__all__ = ["router"]
