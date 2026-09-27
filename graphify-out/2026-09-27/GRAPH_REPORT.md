# Graph Report - hospitality_exchange  (2026-09-27)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1174 nodes · 3021 edges · 87 communities (67 shown, 20 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6639a02b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- resource-form-sheet.tsx
- auth.tsx
- test_drivers.py
- closing.tsx
- auth.py
- cn
- search_seeker_products
- matcher.py
- compilerOptions
- main.py
- MockStore
- deliveries/page.tsx
- test_category_registry.py
- mock-store.ts
- format.ts
- components.json
- top-navbar.tsx
- resources/page.tsx
- search/page.tsx
- states.tsx
- routes.py
- ParsedItem
- smart-matches/page.tsx
- types.ts
- bookings/[id]/page.tsx
- (app)/page.tsx
- dependencies
- devDependencies
- index.ts
- drivers.py
- utils.ts
- confirm-dialog.tsx
- app-topbar.tsx
- logistics/page.tsx
- test_helpers_notifications.py
- parse_requirement
- marketplace/page.tsx
- llm_parser.py
- NotificationsPage
- test_llm_parser_client.py
- auth-pages.tsx
- perspective.tsx
- package.json
- seed_firebase.py
- test_bookings.py
- test_dashboard_notifications_endpoints.py
- SearchPageInner
- app/layout.tsx
- navbar.tsx
- get_booking_detail
- get_driver_dashboard
- record_condition_evidence
- get_current_user_profile
- ResourceFormSheet
- clear_firebase.py
- score-breakdown.tsx
- DriverRoute
- Escrow
- _load_categories
- get_escrow_detail
- get_user_notifications
- mark_notification_as_read
- get_provider_requests
- get_user_reviews
- create_user_profile
- services/__init__.py
- clsx
- cn
- date-fns
- eslint.config.mjs
- next.config.ts
- @hugeicons/react
- next-themes
- radix-ui
- react-dom
- shadcn
- sonner
- tailwind-merge
- postcss.config.mjs
- BaseModel
- get
- post
- str

## God Nodes (most connected - your core abstractions)
1. `cn()` - 168 edges
2. `Button()` - 49 edges
3. `MockStore` - 44 edges
4. `useApi()` - 28 edges
5. `inr()` - 27 edges
6. `Spinner()` - 23 edges
7. `Badge()` - 22 edges
8. `shortDate()` - 21 edges
9. `useAuth()` - 19 edges
10. `humanize()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `SheetOverlay()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/ui/sheet.tsx → frontend/lib/utils.ts
- `DropdownMenuCheckboxItem()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/ui/dropdown-menu.tsx → frontend/lib/utils.ts
- `DropdownMenuRadioItem()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/ui/dropdown-menu.tsx → frontend/lib/utils.ts
- `DropdownMenuShortcut()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/ui/dropdown-menu.tsx → frontend/lib/utils.ts
- `DropdownMenuSubContent()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/ui/dropdown-menu.tsx → frontend/lib/utils.ts

## Import Cycles
- None detected.

## Communities (87 total, 20 thin omitted)

### Community 0 - "resource-form-sheet.tsx"
Cohesion: 0.07
Nodes (62): Audience, COPY, Mode, AuthSplit(), ConfirmReceiptDialog(), ReviewDialog(), submit(), ESCROW_COPY (+54 more)

### Community 1 - "auth.tsx"
Cohesion: 0.06
Nodes (44): BusinessOnboardingPage(), DriverOnboardingPage(), AuthForm(), handleGoogle(), handleSubmit(), handleFiles(), AppShell(), AppShellProps (+36 more)

### Community 2 - "test_drivers.py"
Cohesion: 0.05
Nodes (33): mock_db(), MockCollection, MockDocumentReference, MockDocumentSnapshot, MockFirestoreClient, override_auth(), fixture, test_create_driver_profile_sets_firebase_custom_claim() (+25 more)

### Community 3 - "closing.tsx"
Cohesion: 0.07
Nodes (32): satoshi, CallToAction(), Examples(), firstRow, Footer(), FOOTER_LINKS, Perks(), RoleCard() (+24 more)

### Community 4 - "auth.py"
Cohesion: 0.10
Nodes (28): get_current_user(), Verify the Firebase ID token supplied by the frontend. Supports…, confirm_receipt(), post, Seeker confirms successful delivery receipt. Updates booking status to…, create_escrow(), fund_escrow(), post (+20 more)

### Community 5 - "cn"
Cohesion: 0.07
Nodes (35): Stars(), StarPicker(), AlertAction(), AlertTitle(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup() (+27 more)

### Community 6 - "search_seeker_products"
Cohesion: 0.10
Nodes (29): _min_distance_to_waypoints(), Return (min_distance_km, best_waypoint_index) from a target location to the…, extract_coordinates(), haversine_distance(), Any, Calculate great-circle distance in kilometers between two coordinates. Returns…, Extract (latitude, longitude) floats from a location dict or object. Supports…, Seeker Module Encapsulates requirement parsing via LLM Parser and multi-… (+21 more)

### Community 7 - "matcher.py"
Cohesion: 0.08
Nodes (30): Logistics Module Driver route registration, route matching with CP-SAT…, _cpsat_pool_drivers(), _cpsat_rank_routes(), _fetch_candidate_routes(), find_best_routes(), Logistics - Route Matcher with CP-SAT Optimization…, Use CP-SAT to rank candidate routes by minimizing a weighted composite cost…, CP-SAT Multi-Vehicle Fleet Pooling Solver. Finds the optimal combination of… (+22 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 9 - "main.py"
Cohesion: 0.10
Nodes (27): create_requirement(), create_resource(), get_all_requirements(), get_all_resources(), get_my_requirements(), get_my_resources(), get_resource(), health_check() (+19 more)

### Community 10 - "MockStore"
Cohesion: 0.11
Nodes (9): MockStore, AppNotification, Booking, CreateRequestInput, DriverProfile, Resource, ResourceInput, ResourceRequest (+1 more)

### Community 11 - "deliveries/page.tsx"
Cohesion: 0.14
Nodes (17): Filter, OPEN, RequestsPage(), toTarget(), DeliveriesPage(), deliveryStep(), NEXT, CounterDialog() (+9 more)

### Community 12 - "test_category_registry.py"
Cohesion: 0.11
Nodes (16): build_category_prompt_block(), get_category_ids(), Category registry — single source of truth for all resource categories. Loads…, Return all valid category ID strings., Build the category section of the LLM system prompt dynamically. Each line maps…, Tests for the category registry — verifies JSON loading, enum generation, and…, Spot-check that physical items require photo evidence., Spot-check that powered items require video evidence. (+8 more)

### Community 13 - "mock-store.ts"
Cohesion: 0.15
Nodes (18): MOCK_BOOKINGS, MOCK_CATEGORIES, MOCK_DRIVER, MOCK_DRIVER_DASHBOARD, MOCK_DRIVER_ROUTES, MOCK_ESCROW, MOCK_NOTIFICATIONS, MOCK_REQUESTS (+10 more)

### Community 14 - "format.ts"
Cohesion: 0.18
Nodes (15): ProviderPage(), searchHref(), DriverDashboard(), DriverProfilePage(), Page(), PageHeader(), ChartCard(), firstName() (+7 more)

### Community 15 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 16 - "top-navbar.tsx"
Cohesion: 0.15
Nodes (15): notificationHref(), NotificationsMenu(), open(), TopNavbarProps, DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem() (+7 more)

### Community 17 - "resources/page.tsx"
Cohesion: 0.20
Nodes (12): Filter, Role, UPCOMING, QUICK_ACTIONS, Table(), TableBody(), TableCell(), TableHead() (+4 more)

### Community 18 - "search/page.tsx"
Cohesion: 0.15
Nodes (16): ResourcesPageInner(), EXAMPLES, SortKey, DeliveryQuery, ProductCard(), Props, ProductSheet(), RequestDialog() (+8 more)

### Community 19 - "states.tsx"
Cohesion: 0.14
Nodes (11): Filter, ConfirmDialog(), RouteFormSheet(), RouteMatchesSheet(), RequirementFormSheet(), ErrorState(), ListSkeleton(), Skeleton() (+3 more)

### Community 20 - "routes.py"
Cohesion: 0.16
Nodes (19): create_route(), CreateRouteRequest, deactivate_route(), _get_db(), get_my_routes(), LocationPayload, BaseModel, get (+11 more)

### Community 21 - "ParsedItem"
Cohesion: 0.16
Nodes (14): ParsedItem, BaseModel, One hospitality resource extracted from a requirement., Root object returned by the Groq JSON response., RequirementParseResult, parametrize, Verify the auto-generated enum has exactly 31 members., test_all_31_categories_exist_in_enum() (+6 more)

### Community 22 - "smart-matches/page.tsx"
Cohesion: 0.14
Nodes (14): computeScore(), computeScoreBreakdown(), DemandMatch, getImage(), haversineKm(), MatchResult, PLACEHOLDER_IMAGES, shortLocation() (+6 more)

### Community 23 - "types.ts"
Cohesion: 0.11
Nodes (16): AvailabilitySlot, BookingStatus, DeliveryStatus, DriverProfileInput, EvidenceInput, ParsedItem, ProviderSummary, RequestStatus (+8 more)

### Community 24 - "bookings/[id]/page.tsx"
Cohesion: 0.21
Nodes (13): BookingDetailPage(), ProfilePage(), RequirementsPageInner(), StatusTimeline(), Step, EscrowCard(), pay(), EvidenceGallery() (+5 more)

### Community 25 - "(app)/page.tsx"
Cohesion: 0.18
Nodes (12): RouteMeta(), RoutePath(), PanelLink(), STATUS_TONE, StatusBadge(), Tone, TONES, Badge() (+4 more)

### Community 26 - "dependencies"
Cohesion: 0.12
Nodes (17): @base-ui/react, class-variance-authority, firebase, dependencies, @base-ui/react, class-variance-authority, firebase, @hugeicons/core-free-icons (+9 more)

### Community 27 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 28 - "index.ts"
Cohesion: 0.15
Nodes (13): api, API_BASE_URL, ApiError, errorMessage(), Json, request(), RequestOptions, resolveMockFallback() (+5 more)

### Community 29 - "drivers.py"
Cohesion: 0.20
Nodes (15): create_driver_profile(), DriverAuthStatusData, DriverAuthStatusResponse, DriverProfileCreate, DriverProfileData, DriverProfileResponse, get_current_driver_profile(), get_db() (+7 more)

### Community 30 - "utils.ts"
Cohesion: 0.25
Nodes (11): AppSidebar(), AppSidebarProps, IconRail(), MobileNav(), RailButton(), isActive(), NavItem, Separator() (+3 more)

### Community 31 - "confirm-dialog.tsx"
Cohesion: 0.21
Nodes (11): Props, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader() (+3 more)

### Community 32 - "app-topbar.tsx"
Cohesion: 0.18
Nodes (10): AppTopbar(), AppTopbarProps, pageMeta(), Popover(), PopoverContent(), PopoverDescription(), PopoverHeader(), PopoverTitle() (+2 more)

### Community 33 - "logistics/page.tsx"
Cohesion: 0.19
Nodes (9): getVehicleImage(), LogisticsContent(), PooledDriver, PooledSolution, RouteMatch, shortAddr(), CostComparison(), CostComparisonProps (+1 more)

### Community 34 - "test_helpers_notifications.py"
Cohesion: 0.24
Nodes (9): Any, test_serialize_firestore_doc(), test_standard_response(), get_doc_or_404(), Constructs a uniform API response envelope matching backend conventions: {…, Fetches a document from Firestore or raises a 404 HTTPException. Returns…, Recursively converts datetime objects, DatetimeWithNanoseconds, and nested…, serialize_firestore_doc() (+1 more)

### Community 35 - "parse_requirement"
Cohesion: 0.25
Nodes (9): parse_requirement(), Extract and validate hospitality resources from a search description., test_parser_output_is_firestore_compatible(), parametrize, test_empty_description_returns_without_calling_groq(), test_parse_requirement_rejects_invalid_model_output(), test_parse_requirement_returns_empty_list_for_no_resources(), test_parse_requirement_returns_validated_items() (+1 more)

### Community 36 - "marketplace/page.tsx"
Cohesion: 0.24
Nodes (8): MarketplacePage(), FilterBar(), FilterBarProps, MUMBAI_HUBS, MarketplaceCard(), MarketplaceCardProps, resourcesApi, usePerspective()

### Community 37 - "llm_parser.py"
Cohesion: 0.29
Nodes (9): _get_client(), ParserServiceError, Parse natural-language hospitality requirements into validated items., Create the Groq client lazily so importing this module has no side effects., Request a strict JSON extraction from Groq and return its content., Raised when a requirement cannot be safely parsed., _request_completion(), Exception (+1 more)

### Community 38 - "NotificationsPage"
Cohesion: 0.27
Nodes (5): NotificationsPage(), acceptCounter(), markAllRead(), markLocal(), open()

### Community 39 - "test_llm_parser_client.py"
Cohesion: 0.28
Nodes (4): FakeClient, FakeCompletions, test_client_failure_is_wrapped_without_exposing_credentials(), test_groq_call_uses_strict_json_mode_and_deterministic_temperature()

### Community 40 - "auth-pages.tsx"
Cohesion: 0.33
Nodes (4): BusinessLoginPage(), BusinessSignupPage(), DriverLoginPage(), DriverSignupPage()

### Community 41 - "perspective.tsx"
Cohesion: 0.28
Nodes (6): ThemeProvider(), TooltipProvider(), Perspective, PerspectiveContext, PerspectiveContextType, PerspectiveProvider()

### Community 42 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 43 - "seed_firebase.py"
Cohesion: 0.32
Nodes (6): clear_stale_logistics(), main(), Firebase Seed Script ==================== Populates Firestore with realistic…, Write a list of documents to a Firestore collection., Clear old unrealistic driver and driverRoute documents., seed_collection()

### Community 44 - "test_bookings.py"
Cohesion: 0.43
Nodes (6): create_test_app(), mock_firebase(), fixture, test_confirm_receipt(), test_get_booking_detail_and_authorization(), test_get_my_bookings()

### Community 45 - "test_dashboard_notifications_endpoints.py"
Cohesion: 0.43
Nodes (6): create_test_app(), mock_firebase(), fixture, test_dashboard_driver_endpoint(), test_dashboard_user_endpoint(), test_notifications_endpoints()

### Community 46 - "SearchPageInner"
Cohesion: 0.33
Nodes (5): defaultWindow(), SearchPageInner(), bundleQty(), sendBundle(), sortProducts()

### Community 47 - "app/layout.tsx"
Cohesion: 0.29
Nodes (5): geistMono, geistSans, inter, metadata, Providers()

### Community 48 - "navbar.tsx"
Cohesion: 0.48
Nodes (4): Step, BRAND_NAME, BrandLogo(), Navbar()

### Community 49 - "get_booking_detail"
Cohesion: 0.40
Nodes (5): get_booking_detail(), get_my_bookings(), get, Get full booking information. Ensures caller is a participant (seeker,…, Get bookings involving the authenticated user (as seeker, provider, or driver).…

### Community 50 - "get_driver_dashboard"
Cohesion: 0.40
Nodes (5): get_driver_dashboard(), get_user_dashboard(), get, Get driver dashboard data. Aggregates active routes, matched delivery requests,…, Get combined dashboard data for an authenticated business user / provider /…

### Community 51 - "record_condition_evidence"
Cohesion: 0.40
Nodes (5): post, Validate that the uploaded media type matches the category's requirement.…, Record condition evidence metadata (image/video URL from Firebase Storage +…, record_condition_evidence(), _validate_media_type()

### Community 52 - "get_current_user_profile"
Cohesion: 0.40
Nodes (5): get_current_user_profile(), get_user_document(), get, Return the application profile of the authenticated user., Get a user document from Firestore.

### Community 53 - "ResourceFormSheet"
Cohesion: 0.60
Nodes (5): ResourceFormSheet(), save(), update(), updateSlot(), toDraft()

### Community 54 - "clear_firebase.py"
Cohesion: 0.67
Nodes (3): delete_collection(), main(), Deletes all documents in a Firestore collection.

### Community 55 - "score-breakdown.tsx"
Cohesion: 0.50
Nodes (3): ScoreBreakdown(), ScoreBreakdownProps, ScoreItem

### Community 58 - "_load_categories"
Cohesion: 0.67
Nodes (3): _load_categories(), Any, Load and cache the category registry from the shared JSON file.

### Community 59 - "get_escrow_detail"
Cohesion: 0.67
Nodes (3): get_escrow_detail(), get, Get escrow status and financial breakdown.

### Community 60 - "get_user_notifications"
Cohesion: 0.67
Nodes (3): get_user_notifications(), get, Get notifications for the authenticated user.

### Community 61 - "mark_notification_as_read"
Cohesion: 0.67
Nodes (3): mark_notification_as_read(), patch, Mark a notification as read.

### Community 62 - "get_provider_requests"
Cohesion: 0.67
Nodes (3): get_provider_requests(), get, Get requests received by the authenticated provider. Enriches seeker and…

### Community 63 - "get_user_reviews"
Cohesion: 0.67
Nodes (3): get_user_reviews(), get, Get provider overall rating, totalRatings count, and list of reviews.

### Community 64 - "create_user_profile"
Cohesion: 0.67
Nodes (3): create_user_profile(), post, Create the application profile for an authenticated Firebase user. Firebase…

## Knowledge Gaps
- **156 isolated node(s):** `Audience`, `Mode`, `Props`, `Props`, `Props` (+151 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `resource-form-sheet.tsx`, `auth.tsx`, `app-topbar.tsx`, `closing.tsx`, `NotificationsPage`, `deliveries/page.tsx`, `format.ts`, `navbar.tsx`, `top-navbar.tsx`, `search/page.tsx`, `states.tsx`, `resources/page.tsx`, `bookings/[id]/page.tsx`, `(app)/page.tsx`, `utils.ts`, `confirm-dialog.tsx`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `Button()` connect `resource-form-sheet.tsx` to `app-topbar.tsx`, `logistics/page.tsx`, `auth.tsx`, `closing.tsx`, `marketplace/page.tsx`, `cn`, `deliveries/page.tsx`, `format.ts`, `navbar.tsx`, `resources/page.tsx`, `search/page.tsx`, `states.tsx`, `top-navbar.tsx`, `smart-matches/page.tsx`, `bookings/[id]/page.tsx`, `(app)/page.tsx`, `utils.ts`, `confirm-dialog.tsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `MockStore` connect `MockStore` to `app-topbar.tsx`, `mock-store.ts`, `types.ts`, `DriverRoute`, `Escrow`, `index.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `Audience`, `Mode`, `Props` to the rest of the system?**
  _156 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `resource-form-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0735779460298971 - nodes in this community are weakly interconnected._
- **Should `auth.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05649350649350649 - nodes in this community are weakly interconnected._
- **Should `test_drivers.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05117845117845118 - nodes in this community are weakly interconnected._