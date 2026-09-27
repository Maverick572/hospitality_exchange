# Design Specification: Adopting HACK-CELESTIAL UI Structure & Layouts

**Date:** 2026-09-27  
**Status:** Approved  
**Target:** `hospitality_exchange/frontend`  
**Reference Source:** `C:\Users\Niranjan\Downloads\HACK-CELESTIAL`  

---

## 1. Executive Summary & Non-Regression Constraints

This design specifies the adoption of the page layouts, button positioning, cards, filter bars, and component structures from `HACK-CELESTIAL` into the existing Next.js 15+ App Router application (`hospitality_exchange/frontend`).

### Inviolable Constraints
1. **Dashboard Preservation**: [`hospitality_exchange/frontend/app/dashboard/page.tsx`](file:///c:/Users/Niranjan/Desktop/Hack-celestial/hospitality_exchange/frontend/app/dashboard/page.tsx) **must remain strictly unchanged**.
2. **Schema & Backend Preservation**: All existing FastAPI backend endpoints, Pydantic models, Firebase driver auth claims, 31-category registry ([`shared/categories.json`](file:///c:/Users/Niranjan/Desktop/Hack-celestial/hospitality_exchange/shared/categories.json)), SI unit conversions (`kg`, `liters`, `m`, `sqm`, `units`), and live/demo mode state in [`mockStore`](file:///c:/Users/Niranjan/Desktop/Hack-celestial/hospitality_exchange/frontend/lib/mock-store.ts) must be retained.
3. **Theme & Styling**: Retain the existing color system and CSS variable tokens in [`globals.css`](file:///c:/Users/Niranjan/Desktop/Hack-celestial/hospitality_exchange/frontend/app/globals.css), ensuring full dark mode and light mode compatibility.

---

## 2. Shell & Navigation Architecture

### 2.1 Navigation Hierarchy & Workflow Sections
In [`components/shell/nav-config.ts`](file:///c:/Users/Niranjan/Desktop/Hack-celestial/hospitality_exchange/frontend/components/shell/nav-config.ts), reorganize the navigation into distinct, workflow-oriented groups rather than a flat list:

- **OVERVIEW**:
  - `Dashboard` (`/dashboard`) — *Current overview, unchanged*
- **SEEKER SOURCING**:
  - `Marketplace` (`/dashboard/marketplace`) — *Browse live capacity feed with category & hub filters*
  - `Smart Matches` (`/dashboard/smart-matches`) — *Algorithmic match scores, radial breakdown, route pairings*
  - `Requirements` (`/dashboard/requirements`) — *Post custom event sourcing needs*
- **PROVIDER INVENTORY**:
  - `My Resources` (`/dashboard/resources`) — *Manage lots, track asset utilization, add/edit inventory*
- **SHARED LOGISTICS**:
  - `Logistics Match` (`/dashboard/logistics`) — *3-node co-loading route diagram & 81% savings breakdown*
  - `Driver Fleet` (`/driver`) — *Dedicated driver routes, waypoint detours, delivery dispatches*
- **TRANSACTIONS**:
  - `Offers & Negotiations` (`/dashboard/requests`) — *Interactive bargaining, counter-offers, accept/decline*
  - `Bookings & Escrow` (`/dashboard/bookings`) — *Status tabs, milestone progress, escrow confirmation*

### 2.2 Sidebar Component ([`app-sidebar.tsx`](file:///c:/Users/Niranjan/Desktop/Hack-celestial/hospitality_exchange/frontend/components/shell/app-sidebar.tsx))
- **Brand Header**: HospitalityX logo with `B2B Marketplace` / `Logistics Fleet` uppercase badge.
- **Workflow Navigation Items**: Lucide icons, active state pill styling (`bg-primary text-primary-foreground`), hover transitions, and tooltips when collapsed.
- **Business Profile Footer Card**:
  - Displays current hotel/enterprise name (e.g. "Taj Horizon Hotel").
  - Location badge with pulsating green status indicator ("Bandra West • Live").
  - Clicking navigates directly to `/dashboard/profile`.

### 2.3 Topbar Component ([`app-topbar.tsx`](file:///c:/Users/Niranjan/Desktop/Hack-celestial/hospitality_exchange/frontend/components/shell/app-topbar.tsx))
- **Left**: Mobile drawer toggle button + breadcrumb trail (`Workspace > [Active Page]`).
- **Center**: Quick search button triggering `⌘K` command dialog.
- **Right**:
  - **Live Backend / Demo Mode Popover**: Retains toggle between live FastAPI connection and offline Mumbai demo data.
  - **Notifications Bell**: Lucide `Bell` icon with unread count badge linking to notifications dropdown.
  - **Theme Switcher**: Instant toggle between Light and Dark mode.

---

## 3. Page Layouts & Component Specifications

### 3.1 Smart Logistics-Aware Matching (`/dashboard/logistics/page.tsx`)
Adopted from `HACK-CELESTIAL/src/pages/LogisticsMatch.jsx`:

1. **Header Section**:
   - Badge: `SMART LOGISTICS MATCH` with `Truck` icon in emerald/sky tint.
   - Title: "Logistics-Aware Matching"
   - Subtitle: "We found an existing vehicle route that can transport your resources without requiring a dedicated trip."
2. **3-Node Route Visualizer Card**:
   - **Node 1 (Origin)**: Taj Horizon Hotel (Bandra West), Pickup timestamp: `3:30 PM`.
   - **Connector**: Animated dashed path (`stroke-dasharray` SVG line).
   - **Node 2 (Transport)**: Marriott Delivery Van, status pill: `Co-Loading: 42% spare capacity`.
   - **Connector**: Animated dashed path.
   - **Node 3 (Destination)**: Convention Center (Bandra East), Delivery timestamp: `4:00 PM`.
3. **Cost Reduction Callout Banner**:
   - Full-width emerald banner: "Cost Reduction: You Save ₹6,500 — 81% Cheaper Logistics".
   - Trending down icon with bold typography.
4. **Side-by-Side Cost Comparison**:
   - **Dedicated Transport Card**:
     - Struck-through `₹8,000`.
     - Bullet points: Separate vehicle hire, full trip cost borne by you, added carbon footprint.
   - **Shared Transport Card (Recommended)**:
     - Prominent highlighted border, "RECOMMENDED" badge.
     - Price: `₹1,500` (Pay only marginal cost).
     - Benefits: Existing route hotel $\rightarrow$ venue, spare capacity utilization, 81% savings.
5. **Cost Breakdown & Total Card**:
   - Itemized lines: Resource Rental (`₹7,200`), Shared Logistics (`₹1,500`), Platform & Insurance (`₹0`).
   - Total calculation: `₹8,700`.
   - Primary Action Button: "Confirm Logistics & Dispatch Request".

### 3.2 Resource Marketplace (`/dashboard/marketplace/page.tsx`)
Adopted from `HACK-CELESTIAL/src/pages/Marketplace.jsx`:

1. **Header Section**:
   - `Live Capacity Feed` pill with `Sparkles` icon and subtitle "Verified Mumbai Hospitality Assets".
   - Title: "Resource Marketplace".
   - Top-Right Action Button: "Post Custom Need" (links to `/dashboard/requirements`).
2. **Filter & Search Bar**:
   - Search bar: "Search resources by item name, hotel venue, or Mumbai locality...".
   - Category dropdown: Populated from `shared/categories.json` (31 standard B2B categories).
   - Location dropdown: 10 Mumbai hospitality hubs (Bandra West, BKC, Andheri East, Lower Parel, Powai, Juhu, etc.).
3. **Card Grid**:
   - 3-column responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
   - Each card contains:
     - Venue thumbnail with hover scale effect.
     - Verified hotel badge & enterprise rating (`★ 4.9`).
     - Locality tag and map pin.
     - Pricing tag (`₹50/chair` or `₹32,000/day`) with unit normalization.
     - Logistics badge: "Pickup & Delivery Available" or "Co-loading Eligible".
     - Primary button: "Request Booking".

### 3.3 My Resources Management (`/dashboard/resources/page.tsx`)
Adopted from `HACK-CELESTIAL/src/pages/MyResources.jsx`:

1. **Header Section**:
   - Title: "My Listed Resources".
   - Subtitle: "Manage surplus inventory, adjust pricing, and review rental utilization."
   - Top-Right Action Button: "Add New Resource" (opens creation modal).
2. **Category Filter Tabs**:
   - Horizontal pill bar: `All`, `Banquet Chairs`, `Tables`, `AV Equipment`, `Kitchen Capacity`, `Logistics Fleet`.
3. **Resource Inventory Cards**:
   - Active lot status badge (`Available`, `Partially Booked`, `In Transit`).
   - Asset utilization progress bar (e.g. `38% Utilization` with color-coded bar: green for optimal, amber for underutilized).
   - Rate per day / unit with SI unit badge (`units`, `kg`, `sqm`).
   - Action buttons: "Edit Lot", "Adjust Schedule", "Delete".
4. **Add / Edit Resource Modal**:
   - Form fields: Resource Name, Category selector (31 categories), Quantity, SI Unit, Rate per Day, Locality Hub, Logistics Capability toggle.

### 3.4 Requirements Sourcing (`/dashboard/requirements/page.tsx`)
Adopted from `HACK-CELESTIAL/src/pages/Requirements.jsx`:

1. **Header Section**:
   - Title: "Requirements & Event Needs".
   - Subtitle: "Post resource requirements and get matched with surplus 5-star venue inventory."
   - Top-Right Action Button: "Post Requirement".
2. **Status Filter Tabs**:
   - `All`, `Open`, `Matching`, `Matched`, `Fulfilled`.
3. **Requirement Cards**:
   - Urgency pill: `Critical` (red), `High` (amber), `Medium` (sky), `Low` (slate).
   - Event Date & Time window (`16:00 - 22:00`).
   - Location & Destination venue.
   - Budget allocation (`₹8,000`).
   - Matching status callout (e.g. "3 Matches Found").
   - Action Button: "View Matches" (navigates to `/dashboard/smart-matches`).

### 3.5 Algorithmic Smart Matches (`/dashboard/smart-matches/page.tsx`)
Adopted from `HACK-CELESTIAL/src/pages/SmartMatches.jsx`:

1. **Scenario Selector Bar**:
   - Active requirement tabs: `Gala Wedding Seating`, `Tech Summit AV Rigging`, `Marquee Dining Tables`.
2. **Featured Top Match Card**:
   - Left: Resource image, Taj Horizon Hotel, rating, verified badge.
   - Center:
     - **Radial Compatibility Score**: Circular SVG ring displaying `94%`.
     - **Multi-Factor Score Breakdown Bars**:
       - Resource Fit: `98%`
       - Availability: `100%`
       - Price Fit: `91%`
       - Logistics Fit: `96%`
       - Proximity / Distance: `87%`
       - Provider Reliability: `94%`
   - Right: Price summary (`₹7,200`), `Shared Route #402 Available (-₹6,500)` callout, action buttons:
     - Primary: "Send Booking Request"
     - Secondary: "Inspect Co-Loading Route" (links to `/dashboard/logistics`).
3. **Alternative Matches List**:
   - Secondary candidate cards ranked by match score with quick-request buttons.

### 3.6 Bookings & Escrow (`/dashboard/bookings/page.tsx`)
Adopted from `HACK-CELESTIAL/src/pages/Bookings.jsx`:

1. **Status Filter Tabs with Counts**:
   - `All (4)`, `Upcoming (2)`, `Completed (1)`, `Cancelled (1)`.
2. **Expandable Booking Cards**:
   - Summary row: Resource name, Provider/Seeker venue, Status badge, Total price, Transport type badge, Expand/collapse chevron.
   - Expanded details:
     - Milestone timeline: `Requested` $\rightarrow$ `Negotiated` $\rightarrow$ `Confirmed & Escrow Funded` $\rightarrow$ `In Transit` $\rightarrow$ `Delivered` $\rightarrow$ `Completed`.
     - Transport details (Route ID, Driver name, vehicle type).
     - Action buttons: "Release Escrow", "Upload Condition Evidence", "Leave Review".

### 3.7 Offers & Negotiation (`/dashboard/requests/page.tsx`)
Adopted from `HACK-CELESTIAL/src/pages/Negotiation.jsx`:

1. **Header**: Active negotiation title, resource name, counterparty venue name.
2. **Interactive Message / Negotiation Thread**:
   - Timestamped timeline of offers, counter-offers, and notes.
   - Offer status card: Current offered amount (`₹8,700`), proposed delivery window, transport inclusion.
3. **Action Bar**:
   - "Accept Offer" (triggers booking confirmation).
   - "Counter Offer" (opens inline numeric input with formatted currency).
   - "Decline Negotiation".

---

## 4. Implementation Steps & File Map

| Phase | Files Touched / Created | Purpose |
| :--- | :--- | :--- |
| **Phase 1** | `components/shell/nav-config.ts`<br>`components/shell/app-sidebar.tsx`<br>`components/shell/app-topbar.tsx` | Reorganize navigation groups, add profile footer card, notifications count, and `⌘K` search dialog. |
| **Phase 2** | `app/dashboard/logistics/page.tsx`<br>`components/logistics/route-visualizer.tsx`<br>`components/logistics/cost-comparison.tsx` | Create 3-node route visualizer, 81% savings banner, and cost comparison cards. |
| **Phase 3** | `app/dashboard/marketplace/page.tsx`<br>`components/marketplace/filter-bar.tsx`<br>`components/marketplace/resource-card.tsx` | Build live capacity feed, category/hub filters, and rich resource card grid. |
| **Phase 4** | `app/dashboard/resources/page.tsx`<br>`components/resources/resource-modal.tsx` | Build category filter tabs, utilization bars, and add/edit modal. |
| **Phase 5** | `app/dashboard/smart-matches/page.tsx`<br>`components/matching/radial-score.tsx`<br>`components/matching/score-breakdown.tsx` | Implement radial score widget, 6 score breakdown bars, and scenario selector. |
| **Phase 6** | `app/dashboard/requirements/page.tsx`<br>`app/dashboard/bookings/page.tsx`<br>`app/dashboard/requests/page.tsx` | Update requirements list, expandable booking timeline cards, and negotiation counter-offer panel. |

---

## 5. Verification & Testing Plan

1. **Strict Dashboard Non-Regression**:
   - Run `git diff app/dashboard/page.tsx` to verify zero lines were modified.
2. **TypeScript Compilation & Next.js Lint**:
   - Execute `npm run build` or `npx tsc --noEmit` from `hospitality_exchange/frontend` to ensure 100% type safety.
3. **Visual Verification**:
   - Verify all routes (`/dashboard`, `/dashboard/logistics`, `/dashboard/marketplace`, `/dashboard/resources`, `/dashboard/requirements`, `/dashboard/smart-matches`, `/dashboard/bookings`, `/dashboard/requests`) render smoothly with both light and dark themes.
   - Verify that all button placements and layouts mirror the approved mockups.
