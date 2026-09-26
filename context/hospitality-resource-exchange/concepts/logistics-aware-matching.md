---
type: concept
status: stable
tags: [project/hospitality-resource-exchange]
updated: 2026-09-26
sources: []
confidence: high
---

# Logistics-Aware Matching

[stated] The platform's core USP. Drivers publish upcoming routes with spare capacity; the platform automatically matches delivery requirements with compatible driver routes based on pickup/delivery location, route overlap, date/time, available capacity, and delivery requirements.

## Details

[decided] The data source question is resolved: drivers manually publish routes via the API. This is mechanism (a) from the old context — manual entry, not inferred or simulated.

[stated] Firestore collections: `drivers/{driverId}` (profile, vehicle details), `driverRoutes/{routeId}` (start, destination, stops, routeGeometry, travel date, times, capacity, price, status), `deliveryRequests/{deliveryRequestId}` (route-matched delivery jobs).

[stated] Driver API: `POST /drivers/profile`, `GET /drivers/me`, `POST /driver-routes`, `GET /driver-routes/my`, `PATCH /driver-routes/{id}`, `DELETE /driver-routes/{id}`, `GET /driver-routes/{id}/matches` (find delivery opportunities), `POST /delivery-requests/{id}/accept`, `PATCH /delivery-requests/{id}/status`.

[verified] Organization-to-Organization Shared-Route Matching (`POST /api/v1/logistics/match-routes`): Given provider (pickup) and seeker (delivery) coordinates and required capacity, uses Google OR-Tools CP-SAT constraint optimization solver to find the best driver routes. Evaluates waypoint detour distances via Haversine, enforces max detour constraints (<= 25 km), and optimizes detour minimization, price, capacity utilization, and waypoint directional ordering.

[stated] Route matching returns: routeId, driver info, pickup_detour_km, delivery_detour_km, total_detour_km, routeOverlap, directionallyValid, matchScore.

[stated] Delivery status progression: pickup_pending → picked_up → in_transit → delivered.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/architecture/optimization-layer]]

## Open questions

- Dynamic driver rerouting if real-time traffic significantly impacts arrival times.
