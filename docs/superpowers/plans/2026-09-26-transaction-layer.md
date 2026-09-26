# Transaction Layer Implementation Plan (Roh)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Transaction Layer subsystem for the Hospitality Resource Exchange (15 FastAPI endpoints across Requests, Bookings, Escrow, Condition Evidence, Reviews, and Notifications) in `backend/transactions/` with zero edits to existing files in `backend/`.

**Architecture:** A modular package `backend/transactions/` containing isolated routers for each domain, shared serialization/notification helpers, atomic Firestore transactions for multi-document consistency, and a unified root router in `__init__.py` with clear integration instructions for `backend/main.py`.

**Tech Stack:** FastAPI, Google Cloud Firestore / Firebase Admin SDK, Python 3.10+, Pytest / Starlette TestClient.

**Spec:** `docs/superpowers/specs/2026-09-26-transaction-layer-design.md`

## Global Constraints

- Never modify existing files in `backend/` (`main.py`, `users.py`, `drivers.py`, `test.py`, `core/auth.py`, `core/firebase.py`, `backendAPI.md`).
- Document all integration instructions for `backend/main.py` in the top docstring of `backend/transactions/__init__.py`.
- Base path for all endpoints mounted via the transaction router must match `/api/v1` routes specified in `backendAPI.md`.
- All timestamps stored in Firestore must be timezone-aware UTC (`datetime.now(timezone.utc)`).
- Document data returned to API clients must be serialized cleanly to JSON (ISO-formatted timestamps, no unhandled Firestore datetime objects).
- All response envelopes must follow the `{ "success": True, "data": ... }` pattern.

## Review Focus

1. **Concurrent Request Acceptance**: Two callers accepting the same request concurrently must be prevented via Firestore transactional / status checks.
2. **Escrow Double Release**: Calling `POST /escrow/{id}/release` more than once must be rejected with HTTP 400.
3. **Escrow Penalty Overflow**: Penalty amounts higher than `depositAmount` must be clamped to `depositAmount` and not produce negative returns.
4. **Duplicate Review Submission**: Multiple reviews for the same booking by the same seeker must be rejected with HTTP 409 Conflict.
5. **Unauthorized Access to Booking**: Users attempting to view or confirm receipt on bookings they do not participate in must receive HTTP 403 Forbidden.

---

### Task 1: Helpers & Notifications Emitter

**Files:**
- Create: `backend/transactions/helpers.py`
- Create: `backend/transactions/notifications.py`
- Create: `backend/tests/test_helpers_notifications.py`

**Interfaces:**
- Produces:
  - `serialize_firestore_doc(data: dict | Any) -> dict | Any`: Recursively converts `datetime` to ISO 8601 strings.
  - `standard_response(data: Any = None, message: str | None = None, status_code: int = 200) -> dict`: Standard API envelope.
  - `emit_notification(user_id: str, type: str, title: str, message: str, reference_id: str | None = None) -> str`: Writes notification to `notifications/` collection and returns notificationId.

- [ ] **Step 1: Write the failing tests in `backend/tests/test_helpers_notifications.py`**

```python
from datetime import datetime, timezone
from transactions.helpers import serialize_firestore_doc, standard_response

def test_serialize_firestore_doc():
    dt = datetime(2026, 9, 26, 12, 0, 0, tzinfo=timezone.utc)
    raw = {
        "id": "123",
        "createdAt": dt,
        "nested": {"updatedAt": dt, "count": 5},
        "items": [dt, "text"]
    }
    serialized = serialize_firestore_doc(raw)
    assert serialized["createdAt"] == "2026-09-26T12:00:00+00:00"
    assert serialized["nested"]["updatedAt"] == "2026-09-26T12:00:00+00:00"
    assert serialized["items"][0] == "2026-09-26T12:00:00+00:00"

def test_standard_response():
    resp = standard_response(data={"key": "val"}, message="Success")
    assert resp["success"] is True
    assert resp["data"] == {"key": "val"}
    assert resp["message"] == "Success"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_helpers_notifications.py -v`
Expected: FAIL with ModuleNotFoundError: No module named 'transactions'

- [ ] **Step 3: Implement `helpers.py` and `notifications.py` in `backend/transactions/`**

Implement `serialize_firestore_doc`, `standard_response`, and `emit_notification(user_id, type, title, message, reference_id)` that creates a document in `db.collection("notifications")` with fields matching `schema.txt`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_helpers_notifications.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/transactions/helpers.py backend/transactions/notifications.py backend/tests/test_helpers_notifications.py
git commit -m "feat(transactions): add serialization helpers and notifications emitter"
```

---

### Task 2: Requests & Negotiation Router

**Files:**
- Create: `backend/transactions/requests.py`
- Create: `backend/tests/test_requests.py`

**Interfaces:**
- Consumes:
  - `core.auth.get_current_user`
  - `core.firebase.db`
  - `transactions.helpers.serialize_firestore_doc`
  - `transactions.notifications.emit_notification`
- Produces:
  - `router`: FastAPI APIRouter with prefix `/requests`
    - `POST /`: Seeker sends resource request
    - `GET /provider`: Provider views incoming requests
    - `POST /{id}/counter`: Counter-offer price/quantity
    - `POST /{id}/accept`: Atomically accept request, create booking & escrow
    - `POST /{id}/reject`: Reject request with reason

- [ ] **Step 1: Write the failing tests in `backend/tests/test_requests.py`**

Test request validation, counter-offers, rejection, and acceptance state transitions (verifying booking creation and amounts calculation: resourceAmount, depositAmount, deliveryAmount, totalAmount).

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_requests.py -v`
Expected: FAIL

- [ ] **Step 3: Implement `backend/transactions/requests.py`**

Implement all 5 request endpoints with full validation, Firestore atomic transactions for `accept`, and event notifications.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_requests.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/transactions/requests.py backend/tests/test_requests.py
git commit -m "feat(transactions): implement requests and negotiation router"
```

---

### Task 3: Bookings Lifecycle Router

**Files:**
- Create: `backend/transactions/bookings.py`
- Create: `backend/tests/test_bookings.py`

**Interfaces:**
- Consumes:
  - `core.auth.get_current_user`
  - `core.firebase.db`
  - `transactions.helpers.serialize_firestore_doc`
  - `transactions.notifications.emit_notification`
- Produces:
  - `router`: FastAPI APIRouter with prefix `/bookings`
    - `GET /my`: List bookings for current user (filterable by status)
    - `GET /{id}`: Full booking detail with authorization check
    - `POST /{id}/confirm-receipt`: Seeker confirms delivery, triggers escrow ready

- [ ] **Step 1: Write the failing tests in `backend/tests/test_bookings.py`**

Test listing bookings with status filtering, detail endpoint authorization (403 for non-participants), and receipt confirmation status transition.

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_bookings.py -v`
Expected: FAIL

- [ ] **Step 3: Implement `backend/transactions/bookings.py`**

Implement `/bookings/my`, `/bookings/{id}`, and `/bookings/{id}/confirm-receipt`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_bookings.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/transactions/bookings.py backend/tests/test_bookings.py
git commit -m "feat(transactions): implement bookings lifecycle router"
```

---

### Task 4: Escrow & Payout Split Router

**Files:**
- Create: `backend/transactions/escrow.py`
- Create: `backend/tests/test_escrow.py`

**Interfaces:**
- Consumes:
  - `core.auth.get_current_user`
  - `core.firebase.db`
  - `transactions.helpers.serialize_firestore_doc`
  - `transactions.notifications.emit_notification`
- Produces:
  - `router`: FastAPI APIRouter with prefix `/escrow`
    - `POST /`: Create escrow for booking
    - `POST /{id}/fund`: Fund escrow (mock payment)
    - `POST /{id}/release`: Release escrow with split calculation
    - `GET /{id}`: Get escrow status and breakdown

- [ ] **Step 1: Write the failing tests in `backend/tests/test_escrow.py`**

Test escrow creation, funding, double-release guard, and split math:
- `penalty = min(penaltyAmount, depositAmount)`
- `depositReturned = depositAmount - penalty`
- `providerAmount = resourceAmount + penalty`
- `driverAmount = deliveryAmount`

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_escrow.py -v`
Expected: FAIL

- [ ] **Step 3: Implement `backend/transactions/escrow.py`**

Implement escrow endpoints with state validations and atomic release transaction.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_escrow.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/transactions/escrow.py backend/tests/test_escrow.py
git commit -m "feat(transactions): implement escrow funding and payout split router"
```

---

### Task 5: Condition Evidence Router

**Files:**
- Create: `backend/transactions/evidence.py`
- Create: `backend/tests/test_evidence.py`

**Interfaces:**
- Consumes:
  - `core.auth.get_current_user`
  - `core.firebase.db`
  - `transactions.helpers.serialize_firestore_doc`
- Produces:
  - `router`: FastAPI APIRouter with prefix `/condition-evidence`
    - `POST /`: Record pickup or delivery condition evidence metadata

- [ ] **Step 1: Write the failing tests in `backend/tests/test_evidence.py`**

Test condition evidence upload metadata validation, checking stage (`PICKUP` or `DELIVERY`), and storing in `conditionEvidence` collection.

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_evidence.py -v`
Expected: FAIL

- [ ] **Step 3: Implement `backend/transactions/evidence.py`**

Implement `POST /condition-evidence` with required validation.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_evidence.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/transactions/evidence.py backend/tests/test_evidence.py
git commit -m "feat(transactions): implement condition evidence router"
```

---

### Task 6: Reviews & Rating Aggregation Router

**Files:**
- Create: `backend/transactions/reviews.py`
- Create: `backend/tests/test_reviews.py`

**Interfaces:**
- Consumes:
  - `core.auth.get_current_user`
  - `core.firebase.db`
  - `transactions.helpers.serialize_firestore_doc`
  - `transactions.notifications.emit_notification`
- Produces:
  - `router`: FastAPI APIRouter
    - `POST /reviews`: Submit review with atomic update to `users/{providerId}` rating
    - `GET /users/{userId}/reviews`: Get provider rating & review list

- [ ] **Step 1: Write the failing tests in `backend/tests/test_reviews.py`**

Test submitting a review, verifying duplicate review prevention (409 Conflict), and verifying atomic update of provider's `rating` and `totalRatings`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_reviews.py -v`
Expected: FAIL

- [ ] **Step 3: Implement `backend/transactions/reviews.py`**

Implement review submission with Firestore transaction recalculating `rating = round(((old_rating * old_total) + new_rating) / (old_total + 1), 2)` and incrementing `totalRatings`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_reviews.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/transactions/reviews.py backend/tests/test_reviews.py
git commit -m "feat(transactions): implement reviews and atomic rating aggregation"
```

---

### Task 7: Root Transaction Router & Main Integration Guide

**Files:**
- Create: `backend/transactions/__init__.py`
- Create: `backend/test_transactions.py` (End-to-End integration test)

**Interfaces:**
- Produces:
  - `router`: Consolidated APIRouter mounting all transaction sub-routers.
  - Header docstring with copy-paste snippet for `backend/main.py`.

- [ ] **Step 1: Write `backend/transactions/__init__.py`**

Assemble all sub-routers (`requests`, `bookings`, `escrow`, `evidence`, `reviews`) into a single top-level `router`. Include full integration instructions in the header docstring.

- [ ] **Step 2: Write end-to-end integration test in `backend/test_transactions.py`**

Simulate the complete lifecycle:
1. Seeker posts request
2. Provider counters request
3. Seeker accepts request -> Booking & Escrow auto-created
4. Seeker funds escrow
5. Condition evidence recorded
6. Seeker confirms receipt -> Escrow ready
7. Escrow released -> Split computed & booking completed
8. Seeker posts review -> Provider rating updated

- [ ] **Step 3: Run end-to-end integration test**

Run: `pytest backend/test_transactions.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add backend/transactions/__init__.py backend/test_transactions.py
git commit -m "feat(transactions): assemble root router and add full transaction lifecycle test"
```
