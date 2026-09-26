# Graph Report - hospitality_exchange  (2026-09-26)

## Corpus Check
- Corpus is ~26,085 words - fits in a single context window. You may not need a graph.

## Summary
- 170 nodes · 316 edges · 13 communities
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Transaction & Notification Helpers
- Auth & Core Infrastructure
- Driver Test Mocks
- Transaction & Booking Tests
- Driver Profiles API
- App Entry & User Profiles
- Integration Test Scripts
- Request Workflow Tests
- Evidence Handling Tests
- Booking Queries

## God Nodes (most connected - your core abstractions)
1. `standard_response()` - 25 edges
2. `get_current_user()` - 16 edges
3. `serialize_firestore_doc()` - 16 edges
4. `get_doc_or_404()` - 16 edges
5. `emit_notification()` - 14 edges
6. `get_booking_detail()` - 6 edges
7. `confirm_receipt()` - 6 edges
8. `fund_escrow()` - 6 edges
9. `release_escrow()` - 6 edges
10. `get_escrow_detail()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `test_serialize_firestore_doc()` --calls--> `serialize_firestore_doc()`  [EXTRACTED]
  backend/tests/test_helpers_notifications.py → backend/transactions/helpers.py
- `test_standard_response()` --calls--> `standard_response()`  [EXTRACTED]
  backend/tests/test_helpers_notifications.py → backend/transactions/helpers.py
- `get_my_bookings()` --calls--> `serialize_firestore_doc()`  [EXTRACTED]
  backend/transactions/bookings.py → backend/transactions/helpers.py
- `get_my_bookings()` --calls--> `standard_response()`  [EXTRACTED]
  backend/transactions/bookings.py → backend/transactions/helpers.py
- `get_booking_detail()` --calls--> `get_doc_or_404()`  [EXTRACTED]
  backend/transactions/bookings.py → backend/transactions/helpers.py

## Import Cycles
- None detected.

## Communities (13 total, 0 thin omitted)

### Community 0 - "Transaction & Notification Helpers"
Cohesion: 0.09
Nodes (30): Any, test_serialize_firestore_doc(), test_standard_response(), confirm_receipt(), post, Seeker confirms successful delivery receipt. Updates booking status to…, create_escrow(), fund_escrow() (+22 more)

### Community 1 - "Auth & Core Infrastructure"
Cohesion: 0.17
Nodes (18): get_current_user(), Verify the Firebase ID token supplied by the frontend. Supports…, Recursively converts datetime objects, DatetimeWithNanoseconds, and nested…, serialize_firestore_doc(), ===============================================================================…, emit_notification(), Creates a notification document in the Firestore 'notifications' collection,…, create_request() (+10 more)

### Community 2 - "Driver Test Mocks"
Cohesion: 0.09
Nodes (8): mock_db(), MockCollection, MockDocumentReference, MockDocumentSnapshot, MockFirestoreClient, override_auth(), fixture, test_create_driver_profile_sets_firebase_custom_claim()

### Community 3 - "Transaction & Booking Tests"
Cohesion: 0.12
Nodes (21): mock_firebase_full(), fixture, test_full_transaction_lifecycle_end_to_end(), create_test_app(), mock_firebase(), fixture, test_confirm_receipt(), test_get_booking_detail_and_authorization() (+13 more)

### Community 4 - "Driver Profiles API"
Cohesion: 0.20
Nodes (15): create_driver_profile(), DriverAuthStatusData, DriverAuthStatusResponse, DriverProfileCreate, DriverProfileData, DriverProfileResponse, get_current_driver_profile(), get_db() (+7 more)

### Community 5 - "App Entry & User Profiles"
Cohesion: 0.15
Nodes (13): health_check(), get, root(), create_user_profile(), get_current_user_profile(), get_user_document(), get, post (+5 more)

### Community 6 - "Integration Test Scripts"
Cohesion: 0.38
Nodes (6): get_id_token(), Sign in the test Firebase user and obtain a Firebase ID token., Make an authenticated request to the FastAPI backend., request(), test_driver(), test_user()

### Community 7 - "Request Workflow Tests"
Cohesion: 0.43
Nodes (6): create_test_app(), mock_firebase(), fixture, test_accept_request_creates_booking_and_escrow(), test_counter_request_both_parties_and_revival(), test_create_request()

### Community 8 - "Evidence Handling Tests"
Cohesion: 0.47
Nodes (5): create_test_app(), mock_firebase(), fixture, test_condition_evidence_validation(), test_record_condition_evidence()

### Community 9 - "Booking Queries"
Cohesion: 0.40
Nodes (5): get_booking_detail(), get_my_bookings(), get, Get bookings involving the authenticated user (as seeker, provider, or driver).…, Get full booking information. Ensures caller is a participant (seeker,…

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_current_user()` connect `Auth & Core Infrastructure` to `Driver Test Mocks`, `Transaction & Booking Tests`, `Driver Profiles API`, `App Entry & User Profiles`, `Request Workflow Tests`, `Evidence Handling Tests`?**
  _High betweenness centrality (0.297) - this node is a cross-community bridge._
- **Why does `standard_response()` connect `Transaction & Notification Helpers` to `Auth & Core Infrastructure`, `Booking Queries`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `serialize_firestore_doc()` connect `Auth & Core Infrastructure` to `Transaction & Notification Helpers`, `Booking Queries`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `patch` (e.g. with `test_full_transaction_lifecycle_end_to_end()` and `test_confirm_receipt()`) actually correct?**
  _`patch` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Should `Transaction & Notification Helpers` be split into smaller, more focused modules?**
  _Cohesion score 0.08870967741935484 - nodes in this community are weakly interconnected._
- **Should `Driver Test Mocks` be split into smaller, more focused modules?**
  _Cohesion score 0.09230769230769231 - nodes in this community are weakly interconnected._
- **Should `Transaction & Booking Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.12333333333333334 - nodes in this community are weakly interconnected._