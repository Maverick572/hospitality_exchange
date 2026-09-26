# HACK-CELESTIAL UI Structure & Layout Adoption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt the UI structure, page layouts, button positioning, cards, filter bars, and component patterns from `HACK-CELESTIAL` into the Next.js App Router application (`hospitality_exchange/frontend`), keeping existing themes, schema, and API contracts intact while strictly preserving `app/dashboard/page.tsx` unchanged.

**Architecture:** We use Next.js 15+ App Router client components with TypeScript and Tailwind CSS, maintaining shadcn UI primitives and Lucide icons. Navigation is reorganized into clean workflow groups (Overview, Seeker Sourcing, Provider Inventory, Shared Logistics, Transactions). New high-fidelity pages are added for Logistics Match (with 3-node route visualizer and 81% savings banner), Marketplace (with category/hub filters and live feed header), and Smart Matches (with radial scoring and 6-bar breakdown), while enhancing Resources, Requirements, Bookings, and Negotiation.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Lucide React, Framer Motion, Recharts.

**Spec:** [`docs/superpowers/specs/2026-09-27-hack-celestial-ui-adoption-design.md`](file:///c:/Users/Niranjan/Desktop/Hack-celestial/hospitality_exchange/docs/superpowers/specs/2026-09-27-hack-celestial-ui-adoption-design.md)

## Global Constraints
- `hospitality_exchange/frontend/app/dashboard/page.tsx` must remain **completely unchanged** (0 diff lines).
- Retain all backend API contracts and schemas from FastAPI (`/api/v1/...`).
- Retain 31 categories from `shared/categories.json` and SI unit rules (`kg`, `liters`, `m`, `sqm`, `units`).
- Keep color variables in `globals.css` with full light/dark theme support.
- All interactive buttons must have unique, descriptive IDs or standard accessibility labels.

## Review Focus
- **Route Navigation Integrity:** Ensure all new navigation items (`/dashboard/logistics`, `/dashboard/marketplace`, `/dashboard/smart-matches`) route correctly and highlight the active link in the sidebar.
- **Strict Dashboard Non-Regression:** Verify with `git diff` that `app/dashboard/page.tsx` was not modified in any task.
- **Logistics Visualizer SVG Scaling:** Ensure the animated dashed SVG line and responsive 3 nodes resize properly on mobile and desktop viewports without clipping.
- **31-Category Alignment:** Ensure the marketplace and resources category filters map properly against the official 31-category registry from `shared/categories.json`.
- **Build & Typecheck Cleanliness:** Ensure `npm run build` or `npx tsc --noEmit` succeeds with zero TypeScript compilation errors.

---

### Task 1: Reorganize Shell Navigation & Sidebar Business Profile Card

**Files:**
- Modify: `hospitality_exchange/frontend/components/shell/nav-config.ts`
- Modify: `hospitality_exchange/frontend/components/shell/app-sidebar.tsx`
- Modify: `hospitality_exchange/frontend/components/shell/app-topbar.tsx`

**Interfaces:**
- Consumes: `ShellConfig`, `NavItem`, `NavGroup` from `nav-config.ts`
- Produces: Updated navigation groups including `/dashboard/marketplace`, `/dashboard/smart-matches`, `/dashboard/logistics`; enhanced `AppSidebar` with live business profile footer card.

- [ ] **Step 1: Update `nav-config.ts` with workflow groups and routes**

Update `BUSINESS_SHELL` in `components/shell/nav-config.ts` to include:
```typescript
export const BUSINESS_SHELL: ShellConfig = {
  kind: "business",
  home: { href: "/dashboard", icon: LayoutDashboardIcon, label: "Overview" },
  groups: [
    {
      label: "SEEKER SOURCING",
      items: [
        { href: "/dashboard/marketplace", icon: StoreIcon, label: "Marketplace" },
        { href: "/dashboard/smart-matches", icon: SparklesIcon, label: "Smart Matches", isAi: true, badge: "AI" },
        { href: "/dashboard/requirements", icon: ClipboardListIcon, label: "Requirements" },
      ],
    },
    {
      label: "PROVIDER INVENTORY",
      items: [
        { href: "/dashboard/resources", icon: BoxesIcon, label: "My Resources" },
      ],
    },
    {
      label: "SHARED LOGISTICS",
      items: [
        { href: "/dashboard/logistics", icon: TruckIcon, label: "Logistics Match", badge: "81% OFF" },
        { href: "/driver", icon: RouteIcon, label: "Driver Fleet" },
      ],
    },
    {
      label: "TRANSACTIONS",
      items: [
        { href: "/dashboard/requests", icon: HandshakeIcon, label: "Offers & Negotiation" },
        { href: "/dashboard/bookings", icon: CalendarCheckIcon, label: "Bookings & Escrow" },
      ],
    },
  ],
  // ...
};
```

- [ ] **Step 2: Update `AppSidebar` with business profile card and navigation styles**

In `components/shell/app-sidebar.tsx`:
- Add a business card in the footer showing active business name, location, and a live pulse dot (`bg-emerald-500 animate-pulse`).
- Ensure navigation links support new Lucide icons (`StoreIcon`, `TruckIcon`, etc.).

- [ ] **Step 3: Run TypeScript typecheck to verify shell configuration**

Run in `hospitality_exchange/frontend`:
```bash
npx tsc --noEmit
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/shell/nav-config.ts components/shell/app-sidebar.tsx components/shell/app-topbar.tsx
git commit -m "feat(shell): update navigation hierarchy with workflow groups and business card"
```

---

### Task 2: Build Smart Logistics-Aware Matching Page (`/dashboard/logistics`)

**Files:**
- Create: `hospitality_exchange/frontend/components/logistics/route-visualizer.tsx`
- Create: `hospitality_exchange/frontend/components/logistics/cost-comparison.tsx`
- Create: `hospitality_exchange/frontend/app/dashboard/logistics/page.tsx`

**Interfaces:**
- Produces: Interactive 3-node route visualizer with animated connector, 81% savings banner, side-by-side cost comparison cards, and cost breakdown summary.

- [ ] **Step 1: Create `route-visualizer.tsx`**

Implement the 3-node delivery route diagram:
- Node 1: Origin (Taj Horizon Hotel, Bandra West, Pickup 3:30 PM).
- Animated dashed connector path using SVG line with `strokeDasharray="8 8"` and CSS animation.
- Node 2: Vehicle (Marriott Delivery Van, badge: "Co-Loading 42% spare capacity").
- Animated dashed connector path.
- Node 3: Destination (Convention Center, Bandra East, Delivery 4:00 PM).

- [ ] **Step 2: Create `cost-comparison.tsx`**

Implement the comparison cards:
- Dedicated Transport card: Struck-through `₹8,000`, drawbacks list.
- Shared Transport card: Highlighted border, `RECOMMENDED` badge, `₹1,500` price, benefits list.
- Cost Breakdown card: Itemized calculation and primary `Confirm Logistics & Dispatch Request` button.

- [ ] **Step 3: Create `app/dashboard/logistics/page.tsx`**

Assemble the page with:
- `SMART LOGISTICS MATCH` pill with `Truck` icon.
- Page title: "Logistics-Aware Matching" and subtitle.
- `<RouteVisualizer />`
- Vibrant savings banner: "Cost Reduction: You Save ₹6,500 — 81% Cheaper Logistics".
- `<CostComparison />`

- [ ] **Step 4: Verify route rendering and TypeScript compilation**

Run in `hospitality_exchange/frontend`:
```bash
npx tsc --noEmit
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/logistics/page.tsx components/logistics/route-visualizer.tsx components/logistics/cost-comparison.tsx
git commit -m "feat(logistics): add smart logistics matching page with 3-node route visualizer"
```

---

### Task 3: Build Resource Marketplace Page (`/dashboard/marketplace`)

**Files:**
- Create: `hospitality_exchange/frontend/components/marketplace/filter-bar.tsx`
- Create: `hospitality_exchange/frontend/components/marketplace/marketplace-card.tsx`
- Create: `hospitality_exchange/frontend/app/dashboard/marketplace/page.tsx`

**Interfaces:**
- Consumes: `mockStore.getResources()`, 31 categories from `shared/categories.json`
- Produces: Complete marketplace feed with category & location filter selects, search input, and responsive card grid.

- [ ] **Step 1: Create `filter-bar.tsx`**

Implement:
- Search input with search icon.
- Category filter dropdown using 31 categories from `shared/categories.json`.
- Location filter dropdown using 10 Mumbai hubs (Bandra West, BKC, Andheri East, Lower Parel, Powai, Juhu, etc.).
- Active filters clear button.

- [ ] **Step 2: Create `marketplace-card.tsx`**

Implement:
- Card with image thumbnail, verified hotel badge, enterprise rating (`★ 4.9`), location, price per unit/day with SI units, logistics availability pill, and `Request Booking` button.

- [ ] **Step 3: Create `app/dashboard/marketplace/page.tsx`**

Assemble:
- Header: `Live Capacity Feed` badge with sparkle icon, verified assets subtitle, and `Post Custom Need` button linking to `/dashboard/requirements`.
- `<FilterBar />`
- Responsive 3-column card grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).

- [ ] **Step 4: Verify typecheck and component exports**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/marketplace/page.tsx components/marketplace/filter-bar.tsx components/marketplace/marketplace-card.tsx
git commit -m "feat(marketplace): add resource marketplace with category filters and rich cards"
```

---

### Task 4: Build Algorithmic Smart Matches Page (`/dashboard/smart-matches`)

**Files:**
- Create: `hospitality_exchange/frontend/components/matching/radial-score.tsx`
- Create: `hospitality_exchange/frontend/components/matching/score-breakdown.tsx`
- Create: `hospitality_exchange/frontend/app/dashboard/smart-matches/page.tsx`

**Interfaces:**
- Produces: Circular radial score gauge, 6 multi-factor progress bars, active scenario selector, top match feature card, and alternative matches list.

- [ ] **Step 1: Create `radial-score.tsx`**

Implement circular SVG gauge:
- Diameter 120px, stroke width 8px, circular progress stroke with primary color.
- Centered bold percentage text (e.g. `94%`) with subtitle `Overall Match Score`.

- [ ] **Step 2: Create `score-breakdown.tsx`**

Implement 6 progress bars:
- Resource Fit (98%), Availability (100%), Price Fit (91%), Logistics Fit (96%), Distance (87%), Provider Reliability (94%).

- [ ] **Step 3: Create `app/dashboard/smart-matches/page.tsx`**

Assemble:
- Header: "Smart Matches" with subtitle.
- Scenario tabs: `Gala Wedding Seating`, `Tech Summit AV Rigging`, `Marquee Dining Tables`.
- Top Match card: Resource photo, Taj Horizon Hotel info, `<RadialScore score={94} />`, `<ScoreBreakdown />`, price `₹7,200`, shared route callout, and action buttons (`Send Booking Request` & `Inspect Co-Loading Route`).
- Alternative Matches list.

- [ ] **Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/smart-matches/page.tsx components/matching/radial-score.tsx components/matching/score-breakdown.tsx
git commit -m "feat(matching): add smart matches page with radial score and multi-factor breakdown"
```

---

### Task 5: Enhance My Resources Management Page (`/dashboard/resources`)

**Files:**
- Modify: `hospitality_exchange/frontend/app/dashboard/resources/page.tsx`
- Create / Modify: `hospitality_exchange/frontend/components/resources/resource-modal.tsx`

**Interfaces:**
- Consumes: `mockStore.getResources()`, `mockStore.addResource()`, `mockStore.updateResource()`
- Produces: Horizontal category filter tabs, utilization progress bars, and add/edit resource modal.

- [ ] **Step 1: Update `app/dashboard/resources/page.tsx` layout**

Adopt HACK-CELESTIAL layout:
- Header with title, subtitle, and top-right `Add New Resource` button.
- Category filter tabs (`All`, `Banquet Chairs`, `Tables`, `AV Equipment`, `Kitchen Capacity`, `Logistics Fleet`).
- Resource cards with utilization progress bar (e.g. `38% Utilization` with color-coded bar: green for optimal, amber for underutilized), status badges, rate per day, and action buttons (`Edit Lot`, `Adjust Schedule`, `Delete`).

- [ ] **Step 2: Implement Add/Edit Resource Modal**

In `resource-modal.tsx`:
- Input fields: Resource Name, Category (from `shared/categories.json`), Quantity, SI Unit, Rate per Day, Locality Hub, Logistics Capability toggle.
- Submit button that saves via `mockStore` or backend API.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/resources/page.tsx components/resources/resource-modal.tsx
git commit -m "feat(resources): adopt HACK-CELESTIAL layout for my resources with utilization bars"
```

---

### Task 6: Enhance Requirements, Bookings, and Negotiation Layouts

**Files:**
- Modify: `hospitality_exchange/frontend/app/dashboard/requirements/page.tsx`
- Modify: `hospitality_exchange/frontend/app/dashboard/bookings/page.tsx`
- Modify: `hospitality_exchange/frontend/app/dashboard/requests/page.tsx`

**Interfaces:**
- Consumes: Requirements, Bookings, Negotiations from `mockStore` / API client
- Produces: Status filter tabs with count badges, urgency badges, expandable timeline booking cards, and counter-offer negotiation panel.

- [ ] **Step 1: Update Requirements page layout**

In `app/dashboard/requirements/page.tsx`:
- Header with `Post Requirement` button.
- Status tabs (`All`, `Open`, `Matching`, `Matched`, `Fulfilled`).
- Cards with urgency badges (`Critical`, `High`, `Medium`, `Low`), required dates, budget (`₹8,000`), matches count, and `View Matches` button.

- [ ] **Step 2: Update Bookings page layout**

In `app/dashboard/bookings/page.tsx`:
- Status filter buttons with count badges (`All`, `Upcoming`, `Completed`, `Cancelled`).
- Expandable booking cards with milestone icons, transport details, and escrow action buttons.

- [ ] **Step 3: Update Requests & Negotiation page layout**

In `app/dashboard/requests/page.tsx`:
- Threaded counter-offer discussion panel with accept, counter, and decline buttons.

- [ ] **Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/requirements/page.tsx app/dashboard/bookings/page.tsx app/dashboard/requests/page.tsx
git commit -m "feat(transactions): adopt HACK-CELESTIAL layouts for requirements, bookings, and negotiation"
```

---

### Task 7: Strict Non-Regression Verification & End-to-End Build

**Files:**
- Verify: `hospitality_exchange/frontend/app/dashboard/page.tsx` (must be completely unchanged)
- Verify: Build outputs and routing integrity

- [ ] **Step 1: Verify `app/dashboard/page.tsx` has 0 changes**

Run in `hospitality_exchange`:
```bash
git diff HEAD origin/main -- frontend/app/dashboard/page.tsx
# or simply:
git diff HEAD~5 -- frontend/app/dashboard/page.tsx
```
Expected: 0 diff lines (file untouched).

- [ ] **Step 2: Run Next.js production build**

Run in `hospitality_exchange/frontend`:
```bash
npm run build
```
Expected: `✓ Compiled successfully` with all routes generated.

- [ ] **Step 3: Verify visual rendering in browser**

Test routes:
- `/dashboard` (original dashboard preserved)
- `/dashboard/logistics` (3-node route visualizer, savings banner, cost comparison)
- `/dashboard/marketplace` (live feed, filter bar, cards)
- `/dashboard/smart-matches` (radial score, score bars)
- `/dashboard/resources` (utilization bars, category tabs)
- `/dashboard/bookings` (status tabs, expandable timeline)
- `/dashboard/requests` (negotiation thread)

- [ ] **Step 4: Final commit & tag**

```bash
git commit --allow-empty -m "chore: complete HACK-CELESTIAL UI adoption verification"
```
