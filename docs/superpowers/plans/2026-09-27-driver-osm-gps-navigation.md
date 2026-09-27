# Driver OSM Maps GPS Tracking & Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete OpenStreetMap (OSM) and OSRM turn-by-turn GPS tracking & navigation subsystem for the driver section, featuring real-time device geolocation, interactive demo simulation mode (1x/2x/5x), Google Maps-style navigation HUD, dual-mode full-screen cockpit & persistent floating mini-HUD widget, and backend location syncing.

**Architecture:** A global `DriverNavigationProvider` manages geolocation watching and route simulation. Leaflet renders OSM tiles and dynamic vector paths client-side. The OSRM routing engine calculates driving paths and step maneuvers, driving a full-screen cockpit (`/driver/navigation`) and a persistent floating mini-HUD that follows the driver across all driver pages.

**Tech Stack:** Next.js 16 (App Router), React 19, Leaflet, OpenStreetMap, OSRM Public Routing API, Tailwind CSS, Lucide icons, FastAPI (Backend).

**Spec:** [docs/superpowers/specs/2026-09-27-driver-osm-gps-navigation-design.md](file:///c:/Users/Niranjan/Desktop/Hack-celestial/hospitality_exchange/docs/superpowers/specs/2026-09-27-driver-osm-gps-navigation-design.md)

## Global Constraints

- Must be SSR-safe: Leaflet and browser APIs (`navigator.geolocation`) must be loaded dynamically on client side without window errors.
- Real-time fallback: If public OSRM network times out or fails, fallback to local road-interpolated waypoints so navigation never breaks.
- Demo mode: Must support mock simulation mode with 1x, 2x, 5x speeds for instant demonstrations without moving.
- Multitasking: Floating mini-HUD must persist across driver pages (`/driver`, `/driver/routes`, `/driver/deliveries`) until explicitly closed.

## Review Focus

1. **Leaflet SSR Hydration**: Leaflet accessing `window` or DOM during SSR. (Covered by dynamic import with `ssr: false`).
2. **Missing Geolocation Permission**: Driver denies GPS access on device. (Covered by graceful switch to Simulation / Demo Mode).
3. **OSRM Public API Rate Limit / Failure**: Network error while fetching route. (Covered by offline Haversine urban-tortuosity route generator).
4. **Step Advancement Lag**: Vehicle passes a turn without step index advancing. (Covered by 30-meter proximity radius check on each GPS update).
5. **State Reset on Route Change**: Driver navigates to `/driver/deliveries` while GPS is running. (Covered by provider mounted at `DriverLayout` level).

---

### Task 1: OSRM Routing Client & Fallback Engine

**Files:**
- Create: `hospitality_exchange/frontend/lib/services/osrm-routing.ts`
- Test: `hospitality_exchange/frontend/lib/services/osrm-routing.test.ts`

**Interfaces:**
- Consumes: Coordinates array `[lat, lng][]`
- Produces: `fetchDrivingRoute(coordinates: [number, number][]): Promise<RouteResult>`
  - `RouteResult`: `{ coordinates: [number, number][], distanceMeters: number, durationSeconds: number, steps: NavigationStep[] }`
  - `NavigationStep`: `{ id: string, instruction: string, maneuver: string, modifier?: string, distanceMeters: number, durationSeconds: number, location: [number, number] }`

- [ ] **Step 1: Write tests for OSRM response parsing and fallback routing**
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement `osrm-routing.ts` with OSRM API query, step parsing, and Haversine fallback**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 2: Driver Navigation State & Context Provider

**Files:**
- Create: `hospitality_exchange/frontend/contexts/driver-navigation-context.tsx`
- Modify: `hospitality_exchange/frontend/components/shell/layouts.tsx`

**Interfaces:**
- Consumes: `osrm-routing.ts`, `navigator.geolocation`
- Produces: `useDriverNavigation()` hook with:
  - `isNavigating`, `isMinimized`, `activeTarget`, `currentPosition`, `routeGeometry`, `turnSteps`, `currentStepIndex`, `remainingDistanceMeters`, `remainingDurationSeconds`, `simulationSpeed`, `isSimulationPaused`
  - `startNavigation(target)`, `stopNavigation()`, `toggleMinimize()`, `setTrackingMode()`, `setSimulationSpeed()`, `setSimulationPaused()`, `advanceDeliveryStatus()`

- [ ] **Step 1: Implement `driver-navigation-context.tsx` with Geolocation watching and simulation timer loop**
- [ ] **Step 2: Add step auto-advancement when distance to current step < 30 meters**
- [ ] **Step 3: Wrap `DriverLayout` in `components/shell/layouts.tsx` with `DriverNavigationProvider`**
- [ ] **Step 4: Commit**

---

### Task 3: Leaflet OpenStreetMap Interactive Map Component

**Files:**
- Create: `hospitality_exchange/frontend/components/driver/navigation/osm-map-view.tsx`
- Create: `hospitality_exchange/frontend/components/driver/navigation/osm-map.tsx`
- Modify: `hospitality_exchange/frontend/app/globals.css` (add Leaflet CSS import if needed or leaflet stylesheet link)

**Interfaces:**
- Consumes: `DriverNavigationContext` (`currentPosition`, `routeGeometry`, `turnSteps`, `activeTarget`)
- Produces: `<OsmMap />` component that renders:
  - OpenStreetMap base layer
  - Dynamic route polyline
  - Custom vehicle puck with compass heading rotation and pulsing beacon
  - Pickup and Drop-off waypoint markers
  - Recenter / follow driver button

- [ ] **Step 1: Implement `osm-map-view.tsx` using Leaflet DOM API, markers, polyline, and tile layer**
- [ ] **Step 2: Implement dynamic wrapper `osm-map.tsx` with `next/dynamic` (`ssr: false`) and loading skeleton**
- [ ] **Step 3: Ensure Leaflet styles and custom vehicle marker CSS are loaded properly**
- [ ] **Step 4: Commit**

---

### Task 4: Full-Screen Turn-by-Turn GPS Navigation Cockpit

**Files:**
- Create: `hospitality_exchange/frontend/components/driver/navigation/gps-cockpit.tsx`
- Create: `hospitality_exchange/frontend/components/driver/navigation/turn-icon.tsx`

**Interfaces:**
- Consumes: `useDriverNavigation()`, `<OsmMap />`, `deliveriesApi`
- Produces: `<GpsNavigationCockpit />`
  - Top HUD banner with turn maneuver arrow, distance to turn, street name, and next step preview
  - Central map canvas
  - Bottom action deck with remaining distance, ETA, current speed gauge
  - Simulation toolbar (play/pause, 1x/2x/5x speed pills)
  - Quick delivery status advancement ("Mark Picked Up", "Start Transit", "Mark Delivered")
  - Expandable turn directions sheet

- [ ] **Step 1: Implement `turn-icon.tsx` with Lucide/SVG direction arrows matching turn modifiers (left, sharp left, roundabout, straight, arrive, etc.)**
- [ ] **Step 2: Implement `gps-cockpit.tsx` with top turn banner, map container, and bottom control deck**
- [ ] **Step 3: Wire simulation controls and delivery status actions**
- [ ] **Step 4: Commit**

---

### Task 5: Persistent Floating Mini-HUD Widget & Global Integration

**Files:**
- Create: `hospitality_exchange/frontend/components/driver/navigation/floating-gps-bar.tsx`
- Modify: `hospitality_exchange/frontend/components/shell/layouts.tsx`
- Modify: `hospitality_exchange/frontend/components/shell/nav-config.ts`

**Interfaces:**
- Consumes: `useDriverNavigation()`
- Produces: `<FloatingGpsBar />`
  - Renders when `isNavigating && isMinimized` at bottom of viewport
  - Displays turn maneuver icon, distance, ETA, "Resume GPS" button, and "End" button

- [ ] **Step 1: Implement `floating-gps-bar.tsx` with clean glassmorphic styling and resume/end actions**
- [ ] **Step 2: Mount `<FloatingGpsBar />` inside `DriverLayout`**
- [ ] **Step 3: Add "Live GPS Navigation" (`/driver/navigation`) to `DRIVER_SHELL` in `nav-config.ts`**
- [ ] **Step 4: Commit**

---

### Task 6: Quick Launch Buttons on Deliveries & Routes & Dedicated Navigation Page

**Files:**
- Create: `hospitality_exchange/frontend/app/driver/(app)/navigation/page.tsx`
- Modify: `hospitality_exchange/frontend/app/driver/(app)/deliveries/page.tsx`
- Modify: `hospitality_exchange/frontend/app/driver/(app)/routes/page.tsx`
- Modify: `hospitality_exchange/frontend/app/driver/(app)/page.tsx`

**Interfaces:**
- Consumes: `useDriverNavigation()`, `bookingsApi`, `routesApi`
- Produces:
  - `/driver/navigation`: Dedicated navigation page with target selector (Active deliveries, Routes, or Sample Demo Routes) and embedded cockpit.
  - Deliveries page: "Start GPS Navigation" button on each active delivery.
  - Routes page: "Navigate Route" button on published trips.
  - Dashboard: GPS quick action for active deliveries.

- [ ] **Step 1: Implement `/driver/navigation/page.tsx` with demo route selector and full cockpit**
- [ ] **Step 2: Add "Start GPS Navigation" button in `deliveries/page.tsx`**
- [ ] **Step 3: Add "Navigate Route" button in `routes/page.tsx`**
- [ ] **Step 4: Add GPS shortcut in driver home `page.tsx`**
- [ ] **Step 5: Commit**

---

### Task 7: Backend Driver Location Update Endpoint

**Files:**
- Modify: `hospitality_exchange/backend/drivers.py`
- Modify: `hospitality_exchange/frontend/lib/api/index.ts`

**Interfaces:**
- Backend: `POST /api/v1/drivers/location`
  - Payload: `{ latitude: float, longitude: float, heading: Optional[float], speed: Optional[float], bookingId: Optional[str] }`
  - Updates driver's Firestore doc (`lastLocation`, `updatedAt`) and active booking doc (`currentLocation`)
- Frontend: `driversApi.updateLocation(payload)` in `lib/api/index.ts`

- [ ] **Step 1: Add `/drivers/location` endpoint in `backend/drivers.py`**
- [ ] **Step 2: Add `updateLocation` method in frontend `lib/api/index.ts`**
- [ ] **Step 3: Wire throttled background sync in `driver-navigation-context.tsx`**
- [ ] **Step 4: Commit**

---

### Task 8: End-to-End Verification & Quality Polish

**Files:**
- Test all driver routes and navigation flows

- [ ] **Step 1: Run frontend build / typecheck (`npm run build` or `npx tsc --noEmit`)**
- [ ] **Step 2: Verify in browser: launch GPS navigation, run 1x/2x/5x simulation, test minimize to floating HUD, test resume, test status update**
- [ ] **Step 3: Commit and document final results**
