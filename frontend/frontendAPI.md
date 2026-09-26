FRONTEND API CONTRACT
Hospitality Resource Exchange
React + FastAPI + Firebase
==================================================

BASE URL
--------
/api/v1

AUTHENTICATION
--------------
Protected endpoints use:

Authorization: Bearer <firebase_id_token>
Content-Type: application/json

The frontend uses Firebase Authentication for login/signup.
FastAPI verifies the Firebase ID token.


1. API CLIENT
=============

Recommended structure:

src/
├── api/
│   ├── client.js
│   ├── users.js
│   ├── resources.js
│   ├── requirements.js
│   ├── matching.js
│   ├── requests.js
│   ├── bookings.js
│   ├── drivers.js
│   ├── routes.js
│   ├── deliveries.js
│   ├── escrow.js
│   ├── reviews.js
│   ├── notifications.js
│   └── dashboard.js

The central API client should:
- Attach Firebase ID token
- Send HTTP requests
- Parse JSON
- Handle HTTP errors
- Return response data to UI components


2. STANDARD RESPONSE
====================

SUCCESS:

{
  "success": true,
  "data": {}
}

ERROR:

{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found."
  }
}

Frontend should display error.message rather than hardcoding backend errors.


3. AUTHENTICATION & PROFILE
===========================

POST /users/profile

Frontend flow:

Signup
  -> Firebase Authentication
  -> Create application profile
  -> Dashboard

REQUEST:

{
  "name": "Hotel ABC",
  "email": "contact@hotelabc.com",
  "phone": "+919876543210",
  "businessName": "Hotel ABC",
  "location": {
    "address": "Vashi, Navi Mumbai",
    "latitude": 19.076,
    "longitude": 72.8777
  },
  "profileImage": "https://..."
}


GET /users/me

Use when the application starts.

Flow:

Firebase Auth
  -> GET /users/me
  -> Load user profile
  -> Initialize application


PATCH /users/me

Used by:

Profile -> Edit Profile -> Save


4. USER DASHBOARD
=================

GET /dashboard/user

Display:
- Active resources
- Active requirements
- Pending requests
- Active bookings
- Completed bookings
- Total earnings
- Pending payments

RESPONSE:

{
  "success": true,
  "data": {
    "activeResources": 12,
    "activeRequirements": 3,
    "pendingRequests": 5,
    "activeBookings": 2,
    "completedBookings": 18,
    "totalEarnings": 45000,
    "pendingPayments": 8000
  }
}


5. RESOURCE MANAGEMENT
======================

POST /resources

UI:
Add Resource

Fields:
- Resource Name
- Category
- Description
- Quantity
- Price
- Pricing Unit
- Location
- Availability
- Condition
- Images

Submit:

POST /resources


GET /resources/my

Used by:

Dashboard -> My Resources

Display:
- Resource
- Quantity
- Price
- Location
- Status

Actions:
- Edit
- Deactivate
- View


GET /resources/{resourceId}

Used by:

Search Results
  -> Resource Details

Display:
- Resource
- Provider
- Provider rating
- Price
- Availability
- Quantity
- Condition
- Location
- Images


PATCH /resources/{resourceId}

Used by:

My Resources -> Edit


DELETE /resources/{resourceId}

Used by:

My Resources -> Deactivate

Frontend should show a confirmation dialog before deactivation.


6. REQUIREMENT CREATION
=======================

POST /requirements

UI:

What do you need?

Example natural-language input:

"I need 300 chairs and 20 tables in Vashi tomorrow.
Delivery required before 3 PM."

Additional fields:
- Location
- Date
- Start Time
- End Time
- Budget
- Delivery Required

Flow:

POST /requirements
  -> Requirement Created
  -> POST /matching/search


7. REQUIREMENT MANAGEMENT
=========================

GET /requirements/my

Display:

My Requirements

Requirement #123
300 chairs
20 tables
Vashi
28 Sept
₹25,000
Active

Actions:
- View
- Edit
- Cancel
- Find Matches


GET /requirements/{requirementId}

Used for requirement details.


PATCH /requirements/{requirementId}

Used for editing an active requirement.


DELETE /requirements/{requirementId}

Used for cancelling a requirement.


8. RESOURCE SEARCH & MATCHING
=============================

POST /matching/search

REQUEST:

{
  "requirementId": "req_123"
}

Frontend displays:

MATCHING PROVIDERS

Provider:
Hotel ABC
Rating:
4.7

Resource:
Banquet Chairs

Available:
300

Price:
₹20/item/day

Distance:
5.2 km

Delivery:
Compatible

Actions:
- View
- Request

Use the following returned fields:
- rating
- price
- distance
- availability
- logisticsAvailable

The frontend does NOT calculate the matching score.


9. OPTIMIZED BUNDLE
===================

POST /matching/bundle

Used for requirements involving multiple resources.

Example UI:

Optimized Fulfillment

Provider A
180 chairs        ₹4,500

Provider B
120 chairs        ₹3,000

Provider C
20 tables         ₹4,000

Driver X
Shared-route delivery ₹1,800

Resources          ₹11,500
Delivery            ₹1,800
Deposit             ₹5,000
Total              ₹18,300

Budget             ₹25,000

Actions:
- Proceed
- Modify Requirement


10. REQUESTS & NEGOTIATION
==========================

POST /requests

Used when seeker clicks:

Request / Send Offer

REQUEST:

{
  "requirementId": "req_123",
  "providerId": "user_123",
  "resourceId": "resource_123",
  "requestedQuantity": 250,
  "offeredPrice": 5000,
  "message": "Can you provide these for the full day?"
}


GET /requests/provider

Provider dashboard:

Incoming Requests

Event XYZ
250 Chairs
Offer: ₹5,000

Actions:
- Accept
- Reject
- Counter


POST /requests/{requestId}/counter

Negotiation UI:

Provider's Offer
Quantity: 250
Price: ₹5,000

Your Counter Offer:
Price: ₹5,500
Quantity: 250
Message: ...

REQUEST:

{
  "price": 5500,
  "quantity": 250,
  "message": "We can provide 250 chairs for ₹5,500 including delivery."
}


POST /requests/{requestId}/accept

Flow:

Request Accepted
  -> Booking Created
  -> Open Booking


POST /requests/{requestId}/reject

Remove request from active requests.


11. BOOKINGS
============

GET /bookings/my

Used by:

My Bookings

Filters:
- Active
- Upcoming
- Completed

Display:
- Booking ID
- Resource
- Provider
- Driver
- Amount
- Deposit
- Status


GET /bookings/{bookingId}

Booking detail page displays:
- Booking
- Provider
- Seeker
- Resource
- Driver
- Pickup
- Delivery
- Payment
- Escrow
- Condition Evidence
- Status


POST /bookings/{bookingId}/confirm-receipt

Seeker UI:

Resources Received?

- Everything received
- Condition confirmed

REQUEST:

{
  "received": true,
  "conditionConfirmed": true
}

Flow:

Booking -> Delivered
Escrow -> Pending Release


12. DRIVER INTERFACE
====================

Driver has a separate frontend login/interface.

Flow:

Driver Login
  -> Driver Dashboard


13. DRIVER PROFILE
==================

POST /drivers/profile

Registration fields:
- Name
- Email
- Phone
- Vehicle Type
- Vehicle Number
- Vehicle Capacity


GET /drivers/me

Used to load driver profile.


14. DRIVER DASHBOARD
====================

GET /dashboard/driver

Display:
- Active Routes
- Matched Requests
- Active Deliveries
- Completed Deliveries
- Total Earnings
- Pending Payments


15. PUBLISH DRIVER ROUTE
========================

POST /driver-routes

UI:

Publish Route

From:
Thane

To:
Nerul

Stops:
Vashi

Date:
28 Sept

Departure:
10:00 AM

Arrival:
12:30 PM

Available Capacity:
300 kg

Expected Price:
₹1,500

Submit:

POST /driver-routes


16. DRIVER ROUTES
=================

GET /driver-routes/my

Display:

My Routes

Thane -> Vashi -> Nerul
28 Sept
10:00 AM -> 12:30 PM
300 kg available
₹1,500
Active

Actions:
- View Matches
- Edit
- Deactivate


PATCH /driver-routes/{routeId}

Edit route.


DELETE /driver-routes/{routeId}

Deactivate route.


17. ROUTE-MATCHED DELIVERY OPPORTUNITIES
=========================================

GET /driver-routes/{routeId}/matches

Display:

DELIVERY OPPORTUNITIES

Pickup:
Thane

Drop:
Vashi

Required Capacity:
180 kg

Route Compatibility:
High

Estimated Earnings:
₹900

Actions:
- View Details
- Accept


18. ACCEPT DELIVERY
===================

POST /delivery-requests/{deliveryRequestId}/accept

Flow:

Delivery Accepted
  -> Booking Updated
  -> Delivery appears in Active Deliveries


19. DELIVERY TRACKING
=====================

PATCH /delivery-requests/{deliveryRequestId}/status

Driver UI:

Delivery #001

Pickup Pending
    ->
Picked Up
    ->
In Transit
    ->
Delivered

REQUEST examples:

{
  "status": "picked_up"
}

{
  "status": "in_transit"
}

{
  "status": "delivered"
}

Allowed statuses:
- pickup_pending
- picked_up
- in_transit
- delivered


20. CONDITION EVIDENCE
======================

Actual images/videos should be uploaded to Firebase Storage first.

Flow:

Camera / File Picker
  -> Firebase Storage
  -> Get download URL
  -> POST /condition-evidence

REQUEST:

{
  "bookingId": "booking_001",
  "stage": "PICKUP",
  "type": "resource_condition",
  "imageUrl": "https://...",
  "description": "All resources received in good condition."
}

For delivery:

{
  "bookingId": "booking_001",
  "stage": "DELIVERY",
  "type": "resource_condition",
  "imageUrl": "https://...",
  "description": "Resources delivered."
}


21. ESCROW & PAYMENT
====================

POST /escrow

Called when seeker proceeds with a booking.

Flow:

Review Booking
  -> Create Escrow
  -> Payment


POST /escrow/{escrowId}/fund

After payment/mock payment succeeds:

REQUEST:

{
  "paymentReference": "payment_demo_123"
}

UI:

Payment Successful
₹8,200
    ->
ESCROW


GET /escrow/{escrowId}

Display:

Payment: ₹8,200
Deposit: ₹2,000
Status: Funds Secured


POST /escrow/{escrowId}/release

Should normally be triggered after fulfillment rather than exposing
an arbitrary "Release Money" button.

Flow:

Delivery completed
  +
Seeker confirms receipt
  +
Condition confirmed
  ->
Release Escrow


22. RATINGS & REVIEWS
=====================

POST /reviews

After booking completion:

Rate Provider

★★★★★

Comment:
"Resources arrived on time and were in good condition."

REQUEST:

{
  "bookingId": "booking_001",
  "providerId": "user_123",
  "rating": 5,
  "comment": "Resources arrived on time and were in good condition."
}


GET /users/{userId}/reviews

Provider profile displays:

Hotel ABC

★ 4.7
38 ratings

Reviews
--------
★★★★★
Excellent service.

★★★★☆
Good resources.

Provider rating must also appear in resource search results.


23. NOTIFICATIONS
=================

GET /notifications

Notification panel:

- New booking request
- Counter-offer received
- Driver assigned
- Payment released
- Delivery updates


PATCH /notifications/{notificationId}/read

Called when the user opens/clicks a notification.


24. FRONTEND API SERVICE MAPPING
================================

api/
|
+-- users
|   +-- getMe()
|   +-- createProfile(data)
|   +-- updateMe(data)
|
+-- resources
|   +-- create(data)
|   +-- getMine()
|   +-- getById(id)
|   +-- update(id, data)
|   +-- remove(id)
|
+-- requirements
|   +-- create(data)
|   +-- getMine()
|   +-- getById(id)
|   +-- update(id, data)
|   +-- cancel(id)
|
+-- matching
|   +-- search(requirementId)
|   +-- createBundle(requirementId)
|
+-- requests
|   +-- create(data)
|   +-- getProviderRequests()
|   +-- counter(id, data)
|   +-- accept(id)
|   +-- reject(id, data)
|
+-- bookings
|   +-- getMine()
|   +-- getById(id)
|   +-- confirmReceipt(id, data)
|
+-- drivers
|   +-- createProfile(data)
|   +-- getMe()
|
+-- routes
|   +-- create(data)
|   +-- getMine()
|   +-- update(id, data)
|   +-- remove(id)
|   +-- getMatches(id)
|
+-- deliveries
|   +-- accept(id)
|   +-- updateStatus(id, status)
|
+-- evidence
|   +-- create(data)
|
+-- escrow
|   +-- create(bookingId)
|   +-- get(id)
|   +-- fund(id, data)
|   +-- release(id, data)
|
+-- reviews
|   +-- create(data)
|   +-- getForUser(userId)
|
+-- notifications
|   +-- getAll()
|   +-- markRead(id)
|
+-- dashboard
    +-- getUserDashboard()
    +-- getDriverDashboard()


25. FRONTEND ARCHITECTURE
=========================

React
 |
 +-- Pages
 |
 +-- Components
 |
 +-- Hooks / State
 |
 +-- API Services
          |
          | HTTP + JSON
          v
       FastAPI
          |
    +-----+----------+
    |     |          |
    v     v          v
Firestore LLM       OSRM
          |
        CP-SAT

Frontend responsibilities:
- UI
- Form handling
- Firebase Authentication
- Firebase Storage uploads
- API calls
- Loading/error states
- Displaying API results
- Local UI state

Backend responsibilities:
- Authentication verification
- Business rules
- Firestore operations
- Matching
- Provider rating calculations
- Route compatibility
- CP-SAT optimization
- Escrow state transitions
- Booking state transitions

Frontend should NOT:
- Calculate provider ratings
- Calculate matching scores
- Modify Firestore business data directly
- Calculate escrow settlements
- Implement CP-SAT
- Implement route matching
- Contain LLM prompts


CORE USER FLOW
==============

User:
Login
  -> Dashboard
  -> List Resources
  -> OR Create Requirement
  -> Search Matches
  -> Select Provider(s)
  -> Negotiate
  -> Confirm Booking
  -> Pay
  -> Track Delivery
  -> Confirm Receipt
  -> Rate Provider


CORE DRIVER FLOW
================

Driver:
Login
  -> Driver Dashboard
  -> Publish Route
  -> View Route-Matched Delivery Opportunities
  -> Accept Delivery
  -> Pickup
  -> In Transit
  -> Delivered
  -> Payment
