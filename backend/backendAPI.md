BACKEND API CONTRACT
Hospitality Resource Exchange
FastAPI + Firebase Firestore
==================================================

BASE URL
--------
/api/v1

AUTHENTICATION
--------------
Protected endpoints use:

Authorization: Bearer <firebase_id_token>
Content-Type: application/json

Backend verifies the Firebase ID token and obtains the authenticated userId.


1. USER PROFILE
===============

POST /users/profile
Create application profile after Firebase signup.

REQUEST:
{
  "name": "Hotel ABC",
  "email": "contact@hotelabc.com",
  "phone": "+919876543210",
  "businessName": "Hotel ABC",
  "location": {
    "address": "Vashi, Navi Mumbai",
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "profileImage": "https://..."
}

RESPONSE 201:
{
  "success": true,
  "data": {
    "userId": "user_123",
    "name": "Hotel ABC",
    "email": "contact@hotelabc.com",
    "phone": "+919876543210",
    "businessName": "Hotel ABC",
    "location": {
      "address": "Vashi, Navi Mumbai",
      "latitude": 19.0760,
      "longitude": 72.8777
    },
    "profileImage": "https://...",
    "rating": 0,
    "totalRatings": 0,
    "createdAt": "2026-09-26T10:00:00Z"
  }
}


GET /users/me
Get authenticated user's profile.

RESPONSE:
{
  "success": true,
  "data": {
    "userId": "user_123",
    "name": "Hotel ABC",
    "email": "contact@hotelabc.com",
    "phone": "+919876543210",
    "businessName": "Hotel ABC",
    "location": {
      "address": "Vashi, Navi Mumbai",
      "latitude": 19.0760,
      "longitude": 72.8777
    },
    "rating": 4.7,
    "totalRatings": 38
  }
}


PATCH /users/me
Update profile.

REQUEST:
{
  "name": "Hotel ABC",
  "phone": "+919876543210",
  "businessName": "Hotel ABC Events",
  "location": {
    "address": "Vashi, Navi Mumbai",
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "profileImage": "https://..."
}


2. RESOURCES
============

POST /resources
Create a resource listing.

REQUEST:
{
  "name": "Banquet Chairs",
  "category": "furniture",
  "description": "Comfortable banquet chairs suitable for weddings and events.",
  "quantity": 300,
  "availableQuantity": 300,
  "price": 20,
  "pricingUnit": "per_item_per_day",
  "location": {
    "address": "Vashi, Navi Mumbai",
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "availability": [
    {
      "date": "2026-09-28",
      "startTime": "09:00",
      "endTime": "22:00",
      "quantity": 300
    }
  ],
  "images": [
    "https://storage.googleapis.com/..."
  ],
  "condition": "good"
}

RESPONSE 201:
{
  "success": true,
  "data": {
    "resourceId": "resource_123",
    "providerId": "user_123",
    "name": "Banquet Chairs",
    "category": "furniture",
    "description": "Comfortable banquet chairs suitable for weddings and events.",
    "quantity": 300,
    "availableQuantity": 300,
    "price": 20,
    "pricingUnit": "per_item_per_day",
    "location": {
      "address": "Vashi, Navi Mumbai",
      "latitude": 19.0760,
      "longitude": 72.8777
    },
    "condition": "good",
    "status": "active",
    "createdAt": "2026-09-26T10:00:00Z"
  }
}


GET /resources/my
Get resources owned by authenticated user.

QUERY:
?status=active
?category=furniture

RESPONSE:
{
  "success": true,
  "data": [
    {
      "resourceId": "resource_123",
      "name": "Banquet Chairs",
      "category": "furniture",
      "quantity": 300,
      "availableQuantity": 300,
      "price": 20,
      "pricingUnit": "per_item_per_day",
      "status": "active"
    }
  ]
}


GET /resources/{resourceId}
Get resource details.

RESPONSE:
{
  "success": true,
  "data": {
    "resourceId": "resource_123",
    "provider": {
      "userId": "user_123",
      "businessName": "Hotel ABC",
      "rating": 4.7,
      "totalRatings": 38
    },
    "name": "Banquet Chairs",
    "category": "furniture",
    "description": "Comfortable banquet chairs.",
    "quantity": 300,
    "availableQuantity": 250,
    "price": 20,
    "pricingUnit": "per_item_per_day",
    "location": {
      "address": "Vashi, Navi Mumbai",
      "latitude": 19.0760,
      "longitude": 72.8777
    },
    "condition": "good",
    "images": [
      "https://..."
    ]
  }
}


PATCH /resources/{resourceId}
Update a resource.

REQUEST:
{
  "name": "Premium Banquet Chairs",
  "price": 25,
  "quantity": 350,
  "availableQuantity": 350,
  "condition": "excellent"
}


DELETE /resources/{resourceId}
Deactivate a resource.

RESPONSE:
{
  "success": true,
  "message": "Resource removed successfully."
}

Recommended implementation: soft-delete by setting status to "inactive".


3. REQUIREMENTS
===============

POST /requirements
Create a seeker requirement.

REQUEST:
{
  "description": "I need 300 chairs and 20 tables in Vashi tomorrow for an event. Delivery required before 3 PM.",
  "location": {
    "address": "Vashi, Navi Mumbai",
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "requiredDate": "2026-09-28",
  "startTime": "10:00",
  "endTime": "22:00",
  "budget": 25000,
  "deliveryRequired": true
}

RESPONSE:
{
  "success": true,
  "data": {
    "requirementId": "req_123",
    "description": "I need 300 chairs and 20 tables in Vashi tomorrow for an event.",
    "items": [
      {
        "category": "furniture",
        "name": "chairs",
        "quantity": 300
      },
      {
        "category": "furniture",
        "name": "tables",
        "quantity": 20
      }
    ],
    "location": {
      "address": "Vashi, Navi Mumbai",
      "latitude": 19.0760,
      "longitude": 72.8777
    },
    "requiredDate": "2026-09-28",
    "startTime": "10:00",
    "endTime": "22:00",
    "budget": 25000,
    "deliveryRequired": true,
    "status": "active"
  }
}


GET /requirements/my
Get authenticated user's requirements.

RESPONSE:
{
  "success": true,
  "data": [
    {
      "requirementId": "req_123",
      "description": "I need 300 chairs and 20 tables...",
      "budget": 25000,
      "requiredDate": "2026-09-28",
      "status": "active"
    }
  ]
}


GET /requirements/{requirementId}
Get complete requirement details.


PATCH /requirements/{requirementId}
Update an active requirement.

REQUEST:
{
  "budget": 28000,
  "endTime": "23:00"
}


DELETE /requirements/{requirementId}
Cancel/deactivate requirement.


4. SEEKER SEARCH & MATCHING
===========================

POST /requirements/parse
Parse natural language requirement text into structured hospitality items using LLM.

REQUEST:
{
  "description": "Need 50 banquet chairs and 5 round tables in Bandra tomorrow for dinner service"
}

RESPONSE 200:
{
  "success": true,
  "data": {
    "description": "Need 50 banquet chairs and 5 round tables in Bandra tomorrow for dinner service",
    "items": [
      {
        "category": "furniture",
        "name": "banquet chairs",
        "quantity": 50
      },
      {
        "category": "furniture",
        "name": "round tables",
        "quantity": 5
      }
    ]
  }
}


POST /seeker/search
Search available products / resources in Firestore using natural language text, date/time window, and optional seeker location.

REQUEST:
{
  "description": "Need 50 banquet chairs and 5 round tables in Bandra tomorrow evening",
  "fromTimestamp": "2026-09-28T18:00:00Z",
  "toTimestamp": "2026-09-28T23:00:00Z",
  "location": {
    "address": "Bandra West, Mumbai",
    "latitude": 19.0596,
    "longitude": 72.8295
  }
}

BACKEND SEARCH & RANKING FLOW:
1. Natural language query is passed to LLM parser (Groq / Gemini) to extract structured items and quantities.
2. Active products/resources are retrieved from Firestore.
3. Candidate products are checked against the requested date/time window and quantity:
   - Evaluates product calendar availability slots: [{ date: "YYYY-MM-DD", quantity: N }].
   - Calculates availability score (bonus for full quantity and verified date slot).
4. Distance calculation:
   - Uses product location coordinates if present.
   - Falls back to provider business location from `users/{providerId}`.
   - Computes Haversine distance in km from seeker location.
5. Multi-Criteria Ranking:
   - 1st priority: Best availability (descending availabilityScore)
   - 2nd priority: Lowest price (ascending price)
   - 3rd priority: Nearest location (ascending distanceKm)

RESPONSE 200:
{
  "success": true,
  "data": {
    "query": {
      "description": "Need 50 banquet chairs and 5 round tables in Bandra tomorrow evening",
      "fromTimestamp": "2026-09-28T18:00:00Z",
      "toTimestamp": "2026-09-28T23:00:00Z",
      "location": {
        "address": "Bandra West, Mumbai",
        "latitude": 19.0596,
        "longitude": 72.8295
      }
    },
    "parsedItems": [
      {
        "category": "furniture",
        "name": "banquet chairs",
        "quantity": 50
      },
      {
        "category": "furniture",
        "name": "round tables",
        "quantity": 5
      }
    ],
    "totalFound": 2,
    "results": [
      {
        "resourceId": "res_001",
        "providerId": "user_123",
        "name": "Banquet Chairs - Premium Red",
        "category": "furniture",
        "description": "Stackable banquet chairs in pristine condition",
        "quantity": 100,
        "availableQuantity": 80,
        "price": 25.0,
        "pricingUnit": "per_item_per_day",
        "location": {
          "address": "Bandra West, Mumbai",
          "latitude": 19.0596,
          "longitude": 72.8295
        },
        "provider": {
          "userId": "user_123",
          "businessName": "Grand Imperial Banquets",
          "rating": 4.8,
          "totalRatings": 42,
          "location": {
            "address": "Bandra West, Mumbai",
            "latitude": 19.0596,
            "longitude": 72.8295
          }
        },
        "distanceKm": 0.8,
        "availabilityScore": 2.5,
        "status": "active"
      },
      {
        "resourceId": "res_002",
        "providerId": "user_456",
        "name": "Round Dining Tables (6-seater)",
        "category": "furniture",
        "description": "Sturdy 6-seater wooden round tables",
        "quantity": 15,
        "availableQuantity": 10,
        "price": 250.0,
        "pricingUnit": "per_item_per_day",
        "location": {
          "address": "Khar West, Mumbai",
          "latitude": 19.0700,
          "longitude": 72.8330
        },
        "provider": {
          "userId": "user_456",
          "businessName": "Ocean View Events",
          "rating": 4.6,
          "totalRatings": 19,
          "location": {
            "address": "Khar West, Mumbai",
            "latitude": 19.0700,
            "longitude": 72.8330
          }
        },
        "distanceKm": 1.4,
        "availabilityScore": 2.5,
        "status": "active"
      }
    ]
  }
}


POST /matching/search
Find suitable resources/providers for a stored requirement.

REQUEST:
{
  "requirementId": "req_123"
}

BACKEND FLOW:
Requirement
  -> Firestore candidate retrieval
  -> Availability filtering
  -> Distance calculation
  -> Price calculation
  -> Provider rating
  -> Logistics availability
  -> Optimization
  -> Ranked results

RESPONSE:
{
  "success": true,
  "data": {
    "requirementId": "req_123",
    "matches": [
      {
        "matchId": "match_001",
        "provider": {
          "userId": "user_123",
          "businessName": "Hotel ABC",
          "rating": 4.7,
          "totalRatings": 38
        },
        "resource": {
          "resourceId": "resource_123",
          "name": "Banquet Chairs",
          "availableQuantity": 300,
          "price": 20,
          "pricingUnit": "per_item_per_day"
        },
        "distanceKm": 5.2,
        "resourceCost": 6000,
        "logisticsAvailable": true,
        "matchScore": 0.91,
        "matchReasons": [
          "Sufficient quantity",
          "Available on requested date",
          "Within requested location",
          "Highly rated provider",
          "Compatible delivery route"
        ]
      }
    ]
  }
}

Provider rating must be one of the matching/search metrics.


POST /matching/bundle
Generate an optimized multi-provider fulfillment bundle.

REQUEST:
{
  "requirementId": "req_123"
}

RESPONSE:
{
  "success": true,
  "data": {
    "requirementId": "req_123",
    "bundleId": "bundle_001",
    "resources": [
      {
        "providerId": "provider_001",
        "resourceId": "resource_001",
        "resourceName": "Banquet Chairs",
        "quantity": 180,
        "price": 4500
      },
      {
        "providerId": "provider_002",
        "resourceId": "resource_002",
        "resourceName": "Banquet Chairs",
        "quantity": 120,
        "price": 3000
      },
      {
        "providerId": "provider_003",
        "resourceId": "resource_003",
        "resourceName": "Tables",
        "quantity": 20,
        "price": 4000
      }
    ],
    "logistics": {
      "driverId": "driver_001",
      "routeId": "route_001",
      "deliveryCost": 1800
    },
    "resourceCost": 11500,
    "deliveryCost": 1800,
    "deposit": 5000,
    "totalCost": 18300,
    "withinBudget": true
  }
}

CP-SAT optimization belongs behind this endpoint.


5. REQUESTS & NEGOTIATION
=========================

GET /requests/provider
Get requests received by authenticated user.

QUERY:
?status=pending

RESPONSE:
{
  "success": true,
  "data": [
    {
      "requestId": "request_001",
      "requirementId": "req_123",
      "seeker": {
        "userId": "user_456",
        "businessName": "Event XYZ"
      },
      "resource": {
        "resourceId": "resource_123",
        "name": "Banquet Chairs"
      },
      "requestedQuantity": 250,
      "offeredPrice": 5000,
      "status": "pending",
      "createdAt": "2026-09-26T10:00:00Z"
    }
  ]
}


POST /requests
Create a resource request to a provider.

REQUEST:
{
  "requirementId": "req_123",
  "providerId": "user_123",
  "resourceId": "resource_123",
  "requestedQuantity": 250,
  "offeredPrice": 5000,
  "message": "Can you provide these for the full day?"
}


POST /requests/{requestId}/counter
Make a counter-offer.

REQUEST:
{
  "price": 5500,
  "quantity": 250,
  "message": "We can provide 250 chairs for ₹5,500 including delivery."
}

RESPONSE:
{
  "success": true,
  "data": {
    "requestId": "request_001",
    "counterPrice": 5500,
    "quantity": 250,
    "status": "countered"
  }
}


POST /requests/{requestId}/accept
Accept current offer.

RESPONSE:
{
  "success": true,
  "data": {
    "requestId": "request_001",
    "status": "accepted",
    "bookingId": "booking_001"
  }
}


POST /requests/{requestId}/reject
Reject request.

REQUEST:
{
  "reason": "Resource unavailable for the requested date."
}


6. BOOKINGS
===========

GET /bookings/my
Get bookings involving authenticated user.

QUERY:
?status=active

RESPONSE:
{
  "success": true,
  "data": [
    {
      "bookingId": "booking_001",
      "seekerId": "user_456",
      "providerId": "user_123",
      "driverId": "driver_001",
      "resourceId": "resource_123",
      "quantity": 250,
      "resourceAmount": 5000,
      "deliveryAmount": 1200,
      "depositAmount": 2000,
      "totalAmount": 8200,
      "status": "confirmed",
      "escrowStatus": "funded"
    }
  ]
}


GET /bookings/{bookingId}
Get complete booking information.


POST /bookings/{bookingId}/confirm-receipt
Seeker confirms successful delivery.

REQUEST:
{
  "received": true,
  "conditionConfirmed": true
}

RESPONSE:
{
  "success": true,
  "data": {
    "bookingId": "booking_001",
    "status": "delivered",
    "escrowStatus": "pending_release"
  }
}


7. DRIVER PROFILE
=================

POST /drivers/profile
Create driver profile.

REQUEST:
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "phone": "+919876543210",
  "vehicleType": "Tata Ace",
  "vehicleNumber": "MH04AB1234",
  "capacity": 750
}

RESPONSE:
{
  "success": true,
  "data": {
    "driverId": "driver_001",
    "name": "Rahul Sharma",
    "vehicleType": "Tata Ace",
    "vehicleNumber": "MH04AB1234",
    "capacity": 750,
    "rating": 0,
    "totalRatings": 0
  }
}


GET /drivers/me
Get driver profile.


8. DRIVER ROUTES
================

POST /driver-routes
Publish route availability.

REQUEST:
{
  "startLocation": {
    "address": "Thane",
    "latitude": 19.2183,
    "longitude": 72.9781
  },
  "destination": {
    "address": "Nerul, Navi Mumbai",
    "latitude": 19.0330,
    "longitude": 73.0297
  },
  "stops": [
    {
      "address": "Vashi",
      "latitude": 19.0760,
      "longitude": 72.8777
    }
  ],
  "travelDate": "2026-09-28",
  "departureTime": "10:00",
  "arrivalTime": "12:30",
  "availableCapacity": 300,
  "price": 1500
}

RESPONSE:
{
  "success": true,
  "data": {
    "routeId": "route_001",
    "driverId": "driver_001",
    "startLocation": {
      "address": "Thane",
      "latitude": 19.2183,
      "longitude": 72.9781
    },
    "destination": {
      "address": "Nerul, Navi Mumbai",
      "latitude": 19.0330,
      "longitude": 73.0297
    },
    "availableCapacity": 300,
    "status": "active"
  }
}


GET /driver-routes/my
Get driver's published routes.


PATCH /driver-routes/{routeId}
Update route.

REQUEST:
{
  "availableCapacity": 200,
  "departureTime": "10:30"
}


DELETE /driver-routes/{routeId}
Deactivate route.


9. DRIVER ROUTE MATCHING & LOGISTICS
===================================

POST /logistics/match-routes
Find and rank driver routes between two organizations (pickup = provider, delivery = seeker) using OR-Tools CP-SAT solver.

REQUEST:
{
  "pickupLocation": {
    "address": "Bandra West, Mumbai",
    "latitude": 19.0596,
    "longitude": 72.8295
  },
  "deliveryLocation": {
    "address": "Vashi, Navi Mumbai",
    "latitude": 19.0760,
    "longitude": 72.9930
  },
  "requiredCapacity": 100,
  "travelDate": "2026-09-28"
}

OPTIMIZATION SOLVER DETAILS:
- Waypoint Detour Calculation: Computes Haversine distance from pickup & delivery locations to each stop on the route.
- Constraints:
  * Maximum allowable detour: <= 25.0 km
  * Route capacity: >= requiredCapacity
  * Active route status and travelDate compatibility
- CP-SAT Objective (Multi-Objective Pareto Minimization):
  * Total detour distance = pickupDetour + deliveryDetour (primary weight)
  * Delivery price (secondary weight)
  * Capacity wastage / excess capacity fit
  * Directional order preference (pickup occurs before delivery along the route path)

RESPONSE 200:
{
  "success": true,
  "data": [
    {
      "routeId": "route_101",
      "driverId": "driver_001",
      "driver": {
        "driverId": "driver_001",
        "name": "Amit Deshmukh",
        "vehicleType": "3-Wheeler Tempo",
        "vehicleNumber": "MH02GH3456",
        "rating": 4.9
      },
      "startLocation": {
        "address": "Bandra West, Mumbai",
        "latitude": 19.0596,
        "longitude": 72.8295
      },
      "destination": {
        "address": "Panvel, Navi Mumbai",
        "latitude": 18.9894,
        "longitude": 73.1175
      },
      "stops": [
        {
          "address": "Kurla, Mumbai",
          "latitude": 19.0726,
          "longitude": 72.8793
        }
      ],
      "travelDate": "2026-09-28",
      "departureTime": "08:00",
      "arrivalTime": "11:00",
      "availableCapacity": 190,
      "price": 1200.0,
      "pickup_detour_km": 0.0,
      "delivery_detour_km": 8.6,
      "total_detour_km": 8.6,
      "routeOverlap": 0.83,
      "directionallyValid": true,
      "matchScore": 0.94,
      "status": "active"
    }
  ]
}


GET /driver-routes/{routeId}/matches
Find delivery opportunities compatible with a driver's route.

RESPONSE:
{
  "success": true,
  "data": [
    {
      "deliveryRequestId": "delivery_001",
      "bookingId": "booking_001",
      "pickupLocation": {
        "address": "Thane"
      },
      "deliveryLocation": {
        "address": "Vashi"
      },
      "requiredCapacity": 180,
      "routeOverlap": 0.82,
      "estimatedEarnings": 900,
      "timeCompatible": true
    }
  ]
}


POST /delivery-requests/{deliveryRequestId}/accept
Driver accepts a matched delivery.

RESPONSE:
{
  "success": true,
  "data": {
    "deliveryRequestId": "delivery_001",
    "driverId": "driver_001",
    "status": "accepted",
    "bookingId": "booking_001"
  }
}


10. DELIVERY STATUS
===================

PATCH /delivery-requests/{deliveryRequestId}/status
Update delivery status.

REQUEST:
{
  "status": "picked_up"
}

Allowed statuses:
- pickup_pending
- picked_up
- in_transit
- delivered

RESPONSE:
{
  "success": true,
  "data": {
    "deliveryRequestId": "delivery_001",
    "status": "picked_up",
    "updatedAt": "2026-09-28T10:45:00Z"
  }
}


11. CONDITION EVIDENCE
======================

POST /condition-evidence
Record pickup/delivery condition evidence.

REQUEST:
{
  "bookingId": "booking_001",
  "stage": "PICKUP",
  "type": "resource_condition",
  "imageUrl": "https://storage.googleapis.com/...",
  "description": "All 250 chairs received in good condition."
}

RESPONSE:
{
  "success": true,
  "data": {
    "evidenceId": "evidence_001",
    "bookingId": "booking_001",
    "stage": "PICKUP",
    "imageUrl": "https://storage.googleapis.com/...",
    "timestamp": "2026-09-28T10:30:00Z"
  }
}

Store actual images/videos in Firebase Storage.
Store metadata and URLs in Firestore.


12. ESCROW
===========

POST /escrow
Create escrow for a booking.

REQUEST:
{
  "bookingId": "booking_001"
}

RESPONSE:
{
  "success": true,
  "data": {
    "escrowId": "escrow_001",
    "bookingId": "booking_001",
    "amount": 8200,
    "depositAmount": 2000,
    "status": "pending"
  }
}


POST /escrow/{escrowId}/fund
Fund escrow.

REQUEST:
{
  "paymentReference": "payment_demo_123"
}

RESPONSE:
{
  "success": true,
  "data": {
    "escrowId": "escrow_001",
    "status": "funded",
    "fundedAt": "2026-09-28T09:30:00Z"
  }
}


POST /escrow/{escrowId}/release
Release escrow after successful fulfillment.

REQUEST:
{
  "bookingId": "booking_001",
  "conditionConfirmed": true
}

RESPONSE:
{
  "success": true,
  "data": {
    "escrowId": "escrow_001",
    "status": "released",
    "providerAmount": 5000,
    "driverAmount": 1200,
    "depositReturned": 2000
  }
}


GET /escrow/{escrowId}
Get escrow status.

RESPONSE:
{
  "success": true,
  "data": {
    "escrowId": "escrow_001",
    "bookingId": "booking_001",
    "amount": 8200,
    "depositAmount": 2000,
    "penaltyAmount": 0,
    "providerAmount": 5000,
    "driverAmount": 1200,
    "status": "funded"
  }
}


13. REVIEWS & RATINGS
=====================

POST /reviews
Rate provider after completed booking.

REQUEST:
{
  "bookingId": "booking_001",
  "providerId": "user_123",
  "rating": 5,
  "comment": "Resources were delivered on time and in excellent condition."
}

RESPONSE:
{
  "success": true,
  "data": {
    "reviewId": "review_001",
    "bookingId": "booking_001",
    "providerId": "user_123",
    "rating": 5,
    "comment": "Resources were delivered on time and in excellent condition."
  }
}

Backend should update the provider's aggregate:
users/{providerId}.rating
users/{providerId}.totalRatings

Frontend should not calculate or directly modify provider ratings.


GET /users/{userId}/reviews
Get provider rating and reviews.

RESPONSE:
{
  "success": true,
  "data": {
    "rating": 4.7,
    "totalRatings": 38,
    "reviews": [
      {
        "reviewId": "review_001",
        "rating": 5,
        "comment": "Excellent service.",
        "reviewerName": "Event XYZ",
        "createdAt": "2026-09-25T12:00:00Z"
      }
    ]
  }
}


14. NOTIFICATIONS
=================

GET /notifications
Get notifications for current user.

RESPONSE:
{
  "success": true,
  "data": [
    {
      "notificationId": "notification_001",
      "type": "BOOKING_CONFIRMED",
      "title": "Booking Confirmed",
      "message": "Your booking for 250 chairs has been confirmed.",
      "referenceId": "booking_001",
      "read": false,
      "createdAt": "2026-09-26T10:30:00Z"
    }
  ]
}


PATCH /notifications/{notificationId}/read
Mark notification as read.

RESPONSE:
{
  "success": true,
  "data": {
    "notificationId": "notification_001",
    "read": true
  }
}


15. DASHBOARD
=============

GET /dashboard/user
Get combined user dashboard data.

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


GET /dashboard/driver
Get driver dashboard data.

RESPONSE:
{
  "success": true,
  "data": {
    "activeRoutes": 2,
    "matchedRequests": 6,
    "activeDeliveries": 1,
    "completedDeliveries": 23,
    "totalEarnings": 18500,
    "pendingPayments": 2500
  }
}


RECOMMENDED FASTAPI STRUCTURE
=============================

/api/v1
|
+-- /users
|   +-- GET    /me
|   +-- POST   /profile
|   +-- PATCH  /me
|
+-- /resources
|   +-- POST   /
|   +-- GET    /my
|   +-- GET    /{id}
|   +-- PATCH  /{id}
|   +-- DELETE /{id}
|
+-- /requirements
|   +-- POST   /
|   +-- GET    /my
|   +-- GET    /{id}
|   +-- PATCH  /{id}
|   +-- DELETE /{id}
|
+-- /matching
|   +-- POST   /search
|   +-- POST   /bundle
|
+-- /requests
|   +-- POST   /
|   +-- GET    /provider
|   +-- POST   /{id}/counter
|   +-- POST   /{id}/accept
|   +-- POST   /{id}/reject
|
+-- /bookings
|   +-- GET    /my
|   +-- GET    /{id}
|   +-- POST   /{id}/confirm-receipt
|
+-- /drivers
|   +-- POST   /profile
|   +-- GET    /me
|
+-- /driver-routes
|   +-- POST   /
|   +-- GET    /my
|   +-- PATCH  /{id}
|   +-- DELETE /{id}
|   +-- GET    /{id}/matches
|
+-- /delivery-requests
|   +-- POST   /{id}/accept
|   +-- PATCH  /{id}/status
|
+-- /condition-evidence
|   +-- POST   /
|
+-- /escrow
|   +-- POST   /
|   +-- GET    /{id}
|   +-- POST   /{id}/fund
|   +-- POST   /{id}/release
|
+-- /reviews
|   +-- POST   /
|
+-- /users/{id}/reviews
|   +-- GET    /
|
+-- /notifications
|   +-- GET    /
|   +-- PATCH  /{id}/read
|
+-- /dashboard
    +-- GET    /user
    +-- GET    /driver


ARCHITECTURE
============

                    FASTAPI
                       |
        +--------------+--------------+
        |              |              |
        v              v              v
   CRUD / State     Matching       External
    Operations       Engine        Services
        |              |              |
    Firestore      LLM + CP-SAT     OSRM
        |
    Firebase
     Storage

CRUD/state:
resources, requirements, requests, bookings, routes,
reviews, escrow, notifications.

Matching:
candidate retrieval + availability + price + distance +
provider rating + logistics compatibility + CP-SAT.

External services:
LLM, OSRM, Firebase Storage, and eventually a payment provider.

The frontend should interact with FastAPI and should not need to know
Firestore, CP-SAT, LLM prompts, or routing implementation details.
