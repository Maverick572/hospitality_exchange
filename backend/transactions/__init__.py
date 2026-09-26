"""
================================================================================
TRANSACTION LAYER MODULE (Owned by Roh)
================================================================================

This package encapsulates the complete transactional lifecycle for the
Hospitality Resource Exchange platform:
- Requests & Negotiation: POST /requests, GET /requests/provider,
                          POST /requests/{id}/counter, POST /requests/{id}/accept,
                          POST /requests/{id}/reject
- Bookings:               GET /bookings/my, GET /bookings/{id},
                          POST /bookings/{id}/confirm-receipt
- Escrow:                 POST /escrow, POST /escrow/{id}/fund,
                          POST /escrow/{id}/release, GET /escrow/{id}
- Condition Evidence:     POST /condition-evidence
- Reviews & Ratings:      POST /reviews, GET /users/{userId}/reviews

--------------------------------------------------------------------------------
INTEGRATION INSTRUCTIONS FOR backend/main.py:
--------------------------------------------------------------------------------
To mount the transaction layer into the main application without merge conflicts,
add the following 2 steps to backend/main.py:

1. Import the router:
   from transactions import router as transactions_router

2. Register the router with prefix="/api/v1":
   app.include_router(
       transactions_router,
       prefix="/api/v1"
   )

================================================================================
"""

from fastapi import APIRouter

from transactions.requests import router as requests_router
from transactions.bookings import router as bookings_router
from transactions.escrow import router as escrow_router
from transactions.evidence import router as evidence_router
from transactions.reviews import router as reviews_router

router = APIRouter()

# Mount all domain sub-routers
router.include_router(requests_router)
router.include_router(bookings_router)
router.include_router(escrow_router)
router.include_router(evidence_router)
router.include_router(reviews_router)

__all__ = ["router"]
