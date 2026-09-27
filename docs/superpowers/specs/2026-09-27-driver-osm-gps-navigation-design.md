# Driver OSM Maps GPS Tracking & Navigation Specification

**Date:** 2026-09-27  
**Author:** Pair Programming Assistant  
**Status:** Approved by User  
**Target:** Driver Section (Frontend & Backend integration)

---

## 1. Executive Summary

This feature introduces an OpenStreetMap (OSM) and OSRM (Open Source Routing Machine) powered GPS navigation and tracking system for the driver portal in the Hospitality Resource Exchange platform. 

It provides:
1. **Live GPS Tracking**: Real-time vehicle location via device geolocation (`navigator.geolocation.watchPosition`), with dynamic bearing/heading, speed, and accuracy circle.
2. **Demo / Mock Simulation Engine**: Interactive simulation mode with play/pause and 1x, 2x, 5x speed controls, allowing route progression and turn-by-turn testing directly on any device without moving.
3. **Turn-by-Turn Guidance HUD**: Google Maps-style navigation interface with directional turn maneuvers, remaining distance, ETA countdown, current road names, and next-step previews.
4. **Dual-Mode UI**: Full-screen cockpit view (`/driver/navigation` and full-screen modal) plus a persistent floating mini-HUD widget that docks at the bottom of the screen while browsing other driver tabs (`/driver`, `/driver/routes`, `/driver/deliveries`).
5. **Quick Launch Buttons**: One-click "Start GPS Navigation" on active delivery cards, "Navigate Route" on driver routes, and "Live GPS Navigation" in the driver sidebar.
6. **Backend Location Syncing**: Resilient background updates reporting driver coordinates to the backend for real-time dispatch and seeker tracking.

*(Note: Audio/voice guidance deferred for future phase per user request).*

---

## 2. Architecture & State Management

### 2.1 Driver Navigation Context (`frontend/contexts/driver-navigation-context.tsx`)
A global React context wrapped at the driver layout level (`DriverLayout` in `frontend/components/shell/layouts.tsx`):

* **State**:
  * `activeTarget`: `{ type: 'booking' | 'route' | 'sample', id: string, title: string, waypoints: GeoLocation[] } | null`
  * `currentPosition`: `{ lat: number, lng: number, heading: number, speed: number, accuracy: number } | null`
  * `trackingMode`: `'live' | 'simulation'`
  * `isNavigating`: `boolean`
  * `isMinimized`: `boolean`
  * `routeGeometry`: `[number, number][]` (decoded latitude and longitude coordinates)
  * `turnSteps`: `NavigationStep[]` (detailed turn maneuvers)
  * `currentStepIndex`: `number`
  * `remainingDistanceMeters`: `number`
  * `remainingDurationSeconds`: `number`
  * `simulationSpeed`: `1 | 2 | 5`
  * `isSimulationPaused`: `boolean`

* **Methods**:
  * `startNavigation(target: NavigationTarget)`: Requests route from OSRM, begins GPS watch or simulation, opens cockpit.
  * `stopNavigation()`: Halts session, cleans up geolocation watcher, clears interval timers.
  * `toggleMinimize()`: Toggles full-screen cockpit vs. persistent floating mini-HUD bar.
  * `setTrackingMode(mode: 'live' | 'simulation')`: Switches between device GPS and route animation.
  * `setSimulationSpeed(speed: 1 | 2 | 5)`: Multiplies animated driving speed.
  * `setSimulationPaused(paused: boolean)`: Pauses or resumes simulation.
  * `recenter()`: Dispatches trigger to center map camera on driver vehicle.

---

## 3. OSRM & Routing Services

### 3.1 Routing Client (`frontend/lib/services/osrm-routing.ts`)
* Calls public OSRM Driving endpoint:
  ```
  https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson&steps=true
  ```
* Parses GeoJSON coordinates and steps:
  * Maneuver types: `turn`, `new name`, `depart`, `arrive`, `merge`, `on ramp`, `off ramp`, `fork`, `roundabout`, `continue`.
  * Maneuver modifiers: `left`, `right`, `slight left`, `slight right`, `sharp left`, `sharp right`, `straight`, `uturn`.
  * Street name, distance (meters), and duration (seconds).
* **Fallback Generator**: In case of network errors or OSRM rate limits, uses Haversine interpolation with road tortuosity factor to generate a valid drivable polyline and step markers between the waypoints.

---

## 4. UI Components

### 4.1 Leaflet OpenStreetMap Container (`frontend/components/driver/navigation/osm-map.tsx`)
* Dynamic client-side import (`next/dynamic` with `ssr: false`).
* OpenStreetMap cartography tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
* Custom Vehicle Puck:
  * CSS-styled directional indicator with rotating arrowhead oriented to `heading`.
  * Animated pulsing radar beacon ring.
* Route Polyline: High-contrast vivid blue/cyan polyline with border casing.
* Waypoints:
  * Start / Pickup Marker (amber package icon).
  * Destination / Drop-off Marker (emerald checkered flag icon).
  * Intermediate stops (numbered badges).
* Interactive Controls: Recenter button, zoom controls, fit-route button.

### 4.2 Full-Screen GPS Navigation Cockpit (`frontend/components/driver/navigation/gps-cockpit.tsx`)
* **Top Guidance HUD**:
  * Large directional turn icon (left, right, slight turn, u-turn, roundabout).
  * Distance to next turn (e.g. "In 250 m").
  * Next street name / action (e.g. "Turn right onto Eastern Express Hwy").
  * Next-next maneuver preview.
  * Header controls: Minimize button, Close button.
* **Map Canvas**: Full screen interactive Leaflet OSM map.
* **Bottom Action Deck**:
  * Metrics: Remaining distance (km), remaining time (min), calculated ETA, current speed (km/h).
  * Quick status transition buttons for delivery: "Mark Picked Up", "Start Transit", "Mark Delivered".
  * Simulation toolbar: Toggle simulation, play/pause button, 1x/2x/5x speed pills.
  * Maneuver list toggle: Expandable drawer listing all turns from start to destination.

### 4.3 Persistent Floating Mini-HUD (`frontend/components/driver/navigation/floating-gps-bar.tsx`)
* Docked at the bottom center of the driver application.
* Shows next turn icon, maneuver text, remaining distance & ETA.
* "Resume GPS" button to re-open full-screen cockpit.
* "End" button to terminate navigation.

### 4.4 Driver Page Integrations
* **`/driver/navigation` Page**: Standalone full-page navigation route supporting query params `?bookingId=...` or `?routeId=...`, plus a selection of sample demo routes.
* **`/driver/deliveries`**: Adds "Start GPS Navigation" button on active delivery cards.
* **`/driver/routes`**: Adds "Navigate Route" button on published route cards.
* **Sidebar (`nav-config.ts`)**: Adds "Live GPS Navigation" under *Shared Logistics*.

---

## 5. Backend Location Sync

### 5.1 Endpoint: `POST /api/v1/drivers/location`
* Receives `{ latitude, longitude, heading, speed, bookingId? }`.
* Authenticated driver endpoint; updates driver's active location in Firestore and updates `currentLocation` on the active booking if `bookingId` is provided.
* Resilient client sync: Failures do not affect navigation or alert errors to the driver.

---

## 6. Testing & Validation Plan

1. **Unit / Component Tests**:
   * Verify OSRM response parsing and step maneuver generation.
   * Verify fallback route generator when OSRM fails.
   * Verify navigation context transitions (start, minimize, stop).
2. **Simulation & Real Geolocation**:
   * Verify simulation plays smoothly at 1x, 2x, 5x, advances steps when vehicle reaches within 30m of waypoint, and finishes at destination.
   * Verify real device geolocation watcher handles coordinates and compass headings.
3. **UI Integration**:
   * Launch navigation from `/driver/deliveries` active delivery.
   * Launch navigation from `/driver/routes`.
   * Minimize cockpit to floating mini-HUD and navigate between driver tabs; verify floating bar remains persistent and can be resumed.
