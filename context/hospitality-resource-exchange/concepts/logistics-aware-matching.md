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

[verified] Realistic Vehicle Payload Capacities: Replaced unrealistic mock capacities with real Mumbai commercial transport specifications:
- Piaggio Ape 3-Wheeler Tempo: 25 total units (~350 kg safe payload), 15-20 spare units
- Tata Ace Gold ("Chhota Hathi"): 50 total units (~700 kg payload), 35-45 spare units
- Mahindra Bolero Maxi / Pickup: 80 total units (~1.2 ton payload), 55-60 spare units
- Ashok Leyland Bada Dost: 100 total units (~1.6 ton payload), 70 spare units
- Tata 407 SFC LCV: 150 total units (~2.5 ton payload), 100 spare units
- Eicher Pro 2049 Light Truck: 220 total units (~3.5 ton payload), 140 spare units

[verified] Multi-Driver Fleet Pooling Engine (CP-SAT): When a buyer's demand (e.g. 300 chairs) exceeds individual vehicle capacity, CP-SAT formulates a bounded knapsack / fleet packing problem across active compatible corridor routes:
- Minimizes vehicle count (penalty weight 150), aggregate delivery price, detour km, and penalizes directional invalidity.
- Solves integer decision variables $u_i \in [1, C_i]$ per selected carrier to guarantee exact demand fulfillment.
- Calculates dedicated vs pooled trip cost savings (e.g. ₹4,250 vs ₹9,500 dedicated, saving ₹5,250) and CO2 emission reductions.
- Live transit calculation via OpenStreetMap (OSRM) driving route API determines dynamic departure and arrival timelines.

[stated] Route matching returns: routeId, driver info, pickup_detour_km, delivery_detour_km, total_detour_km, routeOverlap, directionallyValid, matchScore, and the embedded `pooledSolution` (poolId, vehicleCount, totalAllocated, savings, per-driver unit and price allocations).

[stated] Delivery status progression: pickup_pending → picked_up → in_transit → delivered.

## Relations

depends_on:: [[projects/hospitality-resource-exchange/architecture/optimization-layer]]

## Open questions

- Dynamic driver rerouting if real-time traffic significantly impacts arrival times.
