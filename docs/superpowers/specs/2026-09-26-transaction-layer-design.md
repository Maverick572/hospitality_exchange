# Transaction Layer Design Spec (Roh)

**Date:** 2026-09-26  
**Status:** Approved  
**Author:** Roh (Transaction Layer)  
**Target Subsystem:** Backend API — Transaction Layer (`backend/transactions/`)

---

## 1. Context & Scope

In the Hospitality Resource Exchange platform, Roh owns the **Transaction Layer** spanning the full lifecycle:
- Resource request creation & counter-negotiation (5 endpoints)
- Booking creation and fulfillment tracking (3 endpoints)
- Escrow funding, release, and payout split calculations (4 endpoints)
- Condition evidence upload metadata (1 endpoint)
- Ratings, reviews, and provider rating aggregation (2 endpoints)
- Event-driven notifications dispatched to Firestore `notifications` collection

### Critical Constraints
- **Zero modification to existing files** in `backend/` (`main.py`, `users.py`, `drivers.py`, `test.py`, `backendAPI.md`, `core/auth.py`, `core/firebase.py`) to avoid git merge conflicts.
- Clear integration documentation provided in the top docstring of `backend/transactions/__init__.py` detailing how `main.py` should import and mount the new `transactions_router`.

---

## 2. Architecture & File Layout

All new code is housed under `backend/transactions/`:

```text
backend/transactions/
├── __init__.py           # Combines sub-routers into transaction_router; contains main.py integration snippet
├── helpers.py            # Firestore datetime serialization, document fetchers, standard error formatting
├── notifications.py      # emit_notification() utility writing to notifications/ collection
├── requests.py           # Requests & negotiation router (/requests)
├── bookings.py           # Bookings management router (/bookings)
├── escrow.py             # Escrow management & payout split router (/escrow)
├── evidence.py           # Condition evidence router (/condition-evidence)
└── reviews.py            # Reviews & rating aggregation router (/reviews and /users/{id}/reviews)
```

---

## 3. Data Models & Firestore Collections

### 3.1 `requests/{requestId}`
- `requirementId` (string | null): Linked requirement
- `seekerId` (string): Authenticated seeker who placed the request
- `providerId` (string): Resource owner
- `resourceId` (string): Target resource
- `requestedQuantity` (int): Number of items requested
- `offeredPrice` (float): Seeker's total offered price
- `counterPrice` (float | null): Provider's counter-offer price
- `message` (string): Context message
- `status` (string): `"pending"` | `"countered"` | `"accepted"` | `"rejected"`
- `bookingId` (string | null): Set upon acceptance
- `rejectionReason` (string | null): Set upon rejection
- `createdAt` (datetime UTC), `updatedAt` (datetime UTC)

### 3.2 `bookings/{bookingId}`
- `seekerId` (string): Seeker UID
- `providerId` (string): Provider UID
- `resourceId` (string): Resource ID
- `requirementId` (string | null): Associated requirement ID
- `driverId` (string | null): Assigned driver ID (updated by logistics or booking)
- `quantity` (int): Final agreed item count
- `resourceAmount` (float): Agreed resource cost
- `deliveryAmount` (float): Delivery fee (default: 0.0)
- `depositAmount` (float): Security deposit (default: 20% of `resourceAmount`)
- `totalAmount` (float): Sum of `resourceAmount + deliveryAmount + depositAmount`
- `pickupLocation` (dict), `deliveryLocation` (dict)
- `pickupDate` (string/date), `deliveryDate` (string/date)
- `status` (string): `"confirmed"` -> `"pickup_pending"` -> `"picked_up"` -> `"in_transit"` -> `"delivered"` -> `"completed"`
- `escrowStatus` (string): `"pending"` -> `"funded"` -> `"in_transit"` -> `"delivered"` -> `"released"`
- `createdAt` (datetime UTC), `updatedAt` (datetime UTC)

### 3.3 `escrow/{escrowId}`
- `bookingId` (string): Linked booking
- `seekerId` (string), `providerId` (string), `driverId` (string | null)
- `amount` (float): Total escrow amount held
- `depositAmount` (float): Deposit held
- `penaltyAmount` (float): Deductions for damages/violations (default: 0.0)
- `providerAmount` (float): Calculated release to provider
- `driverAmount` (float): Calculated release to driver
- `paymentReference` (string | null): Mock payment transaction reference
- `status` (string): `"PENDING"` -> `"FUNDED"` -> `"IN_TRANSIT"` -> `"DELIVERED"` -> `"RELEASED"`
- `createdAt` (datetime UTC), `fundedAt` (datetime UTC | null), `releasedAt` (datetime UTC | null)

### 3.4 `conditionEvidence/{evidenceId}`
- `bookingId` (string): Linked booking
- `uploadedBy` (string): Uploader user ID
- `type` (string): `"resource_condition"`, `"damage_report"`, etc.
- `stage` (string): `"PICKUP"` | `"DELIVERY"`
- `imageUrl` (string): Firebase Storage download URL
- `description` (string): Descriptive notes
- `timestamp` (datetime UTC)

### 3.5 `reviews/{reviewId}`
- `bookingId` (string): Linked booking
- `reviewerId` (string): Seeker user ID
- `providerId` (string): Provider user ID
- `rating` (int): Rating from 1 to 5
- `comment` (string): Review commentary
- `createdAt` (datetime UTC), `updatedAt` (datetime UTC)

### 3.6 `notifications/{notificationId}`
- `userId` (string): Recipient UID
- `type` (string): Notification event type
- `title` (string): Short descriptive title
- `message` (string): Body text
- `referenceId` (string): Associated entity ID (requestId, bookingId, escrowId, reviewId)
- `read` (bool): Default `False`
- `createdAt` (datetime UTC)

---

## 4. Detailed Endpoints Contract & Business Logic

### Domain 1: Requests & Negotiation
- **`POST /requests`**: Validates resource availability and creates a request document (`status="pending"`). Dispatches `"request_received"` notification to provider.
- **`GET /requests/provider`**: Retrieves incoming requests where `providerId == current_user["uid"]` with optional status filtering.
- **`POST /requests/{id}/counter`**: Counter-offers price/quantity on an existing request (`status="countered"`). Dispatches `"request_countered"` notification.
- **`POST /requests/{id}/accept`**:
  - Atomically marks request `accepted`.
  - Computes `resourceAmount` (counterPrice or offeredPrice), `deliveryAmount`, `depositAmount` (20% default), and `totalAmount`.
  - Atomically creates `bookings/{bookingId}` (`status="confirmed"`, `escrowStatus="pending"`).
  - Automatically creates initial `escrow/{escrowId}` linked to the booking.
  - Dispatches `"request_accepted"` and `"booking_confirmed"` notifications.
- **`POST /requests/{id}/reject`**: Marks request `rejected` with `rejectionReason`. Dispatches `"request_rejected"` notification.

### Domain 2: Bookings
- **`GET /bookings/my`**: Lists bookings for the authenticated user as seeker, provider, or driver, with status filter support.
- **`GET /bookings/{id}`**: Returns full booking details including enriched resource and user summary snippets. Checks access authorization.
- **`POST /bookings/{id}/confirm-receipt`**: Seeker confirms delivery receipt. Updates booking `status="delivered"` and `escrowStatus="delivered"`. Dispatches `"delivery_confirmed"` notification.

### Domain 3: Escrow & Payments
- **`POST /escrow`**: Explicitly initializes escrow for a booking (idempotent if already created upon request acceptance).
- **`POST /escrow/{id}/fund`**: Mock payment funding. Updates status to `FUNDED`, records `fundedAt`. Updates booking `escrowStatus="funded"`. Dispatches `"escrow_funded"` notification.
- **`POST /escrow/{id}/release`**:
  - Verifies escrow is `FUNDED` or `DELIVERED`.
  - Payout split calculation:
    - `penalty = min(penaltyAmount, depositAmount)`
    - `depositReturned = depositAmount - penalty`
    - `providerAmount = resourceAmount + penalty`
    - `driverAmount = deliveryAmount`
  - Updates escrow status to `RELEASED`, records `releasedAt`.
  - Updates booking status to `completed`, `escrowStatus="released"`.
  - Dispatches `"escrow_released"` notifications.
- **`GET /escrow/{id}`**: Returns status and full monetary breakdown.

### Domain 4: Condition Evidence
- **`POST /condition-evidence`**: Saves metadata and Firebase Storage image URL for pickup or delivery condition verification. Links to booking.

### Domain 5: Reviews & Ratings
- **`POST /reviews`**:
  - Validates booking was completed/delivered.
  - Creates `reviews/{reviewId}`.
  - Runs atomic Firestore transaction on `users/{providerId}`:
    - Increments `totalRatings` by 1.
    - Recalculates `rating = round(((old_rating * old_total) + new_rating) / (old_total + 1), 2)`.
  - Dispatches `"review_received"` notification.
- **`GET /users/{userId}/reviews`**: Returns overall rating, totalRatings count, and list of reviews for the provider.

---

## 5. Main.py Integration Guide

`backend/transactions/__init__.py` will contain this exact docstring:

```python
"""
================================================================================
TRANSACTION LAYER MODULE (Roh)
================================================================================

To mount all transaction layer routes in FastAPI when merging, add the
following to backend/main.py:

from transactions import router as transactions_router

app.include_router(
    transactions_router,
    prefix="/api/v1"
)
================================================================================
"""
```

---

## 6. Verification Plan

1. Standalone test suite in `backend/test_transactions.py` verifying:
   - Request creation, countering, rejection, and acceptance
   - Booking creation upon acceptance
   - Escrow creation, funding, and split calculation on release
   - Condition evidence registration
   - Review creation and atomic provider rating updates
   - Serialization helper for Firestore timestamps
2. Run automated validation commands via Powershell to verify clean syntax and behavior without touching existing files.
