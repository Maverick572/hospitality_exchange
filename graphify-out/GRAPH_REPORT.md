# Graph Report - hospitality_exchange  (2026-09-27)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1189 nodes · 3085 edges · 90 communities (69 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `37b67eeb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- button.tsx
- test_drivers.py
- closing.tsx
- cn
- search_seeker_products
- matcher.py
- standard_response
- search/page.tsx
- auth.py
- resources/page.tsx
- compilerOptions
- main.py
- routes/page.tsx
- MockStore
- deliveries/page.tsx
- test_category_registry.py
- index.ts
- mock-store.ts
- components.json
- app-sidebar.tsx
- top-navbar.tsx
- routes.py
- ParsedItem
- layouts.tsx
- bookings/[id]/page.tsx
- dependencies
- devDependencies
- drivers.py
- smart-matches/page.tsx
- confirm-dialog.tsx
- marketplace/page.tsx
- utils.ts
- logistics/page.tsx
- providers/[id]/page.tsx
- app-topbar.tsx
- parse_requirement
- providers.tsx
- client.ts
- llm_parser.py
- NotificationsPage
- session-gate.tsx
- auth.tsx
- test_llm_parser_client.py
- auth-pages.tsx
- package.json
- seed_firebase.py
- firebase.ts
- test_bookings.py
- test_dashboard_notifications_endpoints.py
- fund_escrow
- SearchPageInner
- navbar.tsx
- get_booking_detail
- get_driver_dashboard
- record_condition_evidence
- get_current_user_profile
- ResourceFormSheet
- ResourceRequest
- perspective.tsx
- clear_firebase.py
- AuthForm
- score-breakdown.tsx
- DriverRoute
- _load_categories
- confirm_receipt
- create_review
- create_user_profile
- radial-score.tsx
- services/__init__.py
- clsx
- cn
- date-fns
- eslint.config.mjs
- next.config.ts
- @hugeicons/react
- next-themes
- radix-ui
- class-variance-authority
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
2. `Button()` - 50 edges
3. `MockStore` - 44 edges
4. `inr()` - 30 edges
5. `useApi()` - 29 edges
6. `Spinner()` - 24 edges
7. `Badge()` - 23 edges
8. `shortDate()` - 21 edges
9. `useAuth()` - 19 edges
10. `humanize()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `RoleCard()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/landing/closing.tsx → frontend/lib/utils.ts
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

## Communities (90 total, 21 thin omitted)

### Community 0 - "button.tsx"
Cohesion: 0.08
Nodes (60): CATEGORY_RULES, ChatMessage, EvidenceItem, EvidenceRule, NegotiationContent(), Audience, COPY, Mode (+52 more)

### Community 1 - "test_drivers.py"
Cohesion: 0.05
Nodes (33): mock_db(), MockCollection, MockDocumentReference, MockDocumentSnapshot, MockFirestoreClient, override_auth(), fixture, test_create_driver_profile_sets_firebase_custom_claim() (+25 more)

### Community 2 - "closing.tsx"
Cohesion: 0.07
Nodes (32): satoshi, CallToAction(), Examples(), firstRow, Footer(), FOOTER_LINKS, Perks(), RoleCard() (+24 more)

### Community 3 - "cn"
Cohesion: 0.07
Nodes (37): Stars(), StarPicker(), RailButton(), AlertAction(), AlertTitle(), Avatar(), AvatarBadge(), AvatarFallback() (+29 more)

### Community 4 - "search_seeker_products"
Cohesion: 0.10
Nodes (29): _min_distance_to_waypoints(), Return (min_distance_km, best_waypoint_index) from a target location to the…, extract_coordinates(), haversine_distance(), Any, Calculate great-circle distance in kilometers between two coordinates. Returns…, Extract (latitude, longitude) floats from a location dict or object. Supports…, Seeker Module Encapsulates requirement parsing via LLM Parser and multi-… (+21 more)

### Community 5 - "matcher.py"
Cohesion: 0.08
Nodes (30): Logistics Module Driver route registration, route matching with CP-SAT…, _cpsat_pool_drivers(), _cpsat_rank_routes(), _fetch_candidate_routes(), find_best_routes(), Logistics - Route Matcher with CP-SAT Optimization…, Use CP-SAT to rank candidate routes by minimizing a weighted composite cost…, CP-SAT Multi-Vehicle Fleet Pooling Solver. Finds the optimal combination of… (+22 more)

### Community 6 - "standard_response"
Cohesion: 0.11
Nodes (30): Any, test_serialize_firestore_doc(), test_standard_response(), get_condition_evidence(), get, Retrieve all condition evidence uploaded for a given booking (both PICKUP and…, get_doc_or_404(), Constructs a uniform API response envelope matching backend conventions: {… (+22 more)

### Community 7 - "search/page.tsx"
Cohesion: 0.12
Nodes (21): searchHref(), ResourcesPageInner(), EXAMPLES, SortKey, ConfirmDialog(), RequirementFormSheet(), ProductCard(), Props (+13 more)

### Community 8 - "auth.py"
Cohesion: 0.13
Nodes (16): get_current_user(), Verify the Firebase ID token supplied by the frontend. Supports…, get_escrow_detail(), get, Get escrow status and financial breakdown., ===============================================================================…, get_user_notifications(), mark_notification_as_read() (+8 more)

### Community 9 - "resources/page.tsx"
Cohesion: 0.16
Nodes (19): Filter, Role, UPCOMING, QUICK_ACTIONS, STATUS_TONE, StatusBadge(), Tone, TONES (+11 more)

### Community 10 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 11 - "main.py"
Cohesion: 0.10
Nodes (27): create_requirement(), create_resource(), get_all_requirements(), get_all_resources(), get_my_requirements(), get_my_resources(), get_resource(), health_check() (+19 more)

### Community 12 - "routes/page.tsx"
Cohesion: 0.12
Nodes (16): DriverDashboard(), Filter, RouteMeta(), RoutePath(), RouteFormSheet(), RouteMatchesSheet(), PanelLink(), ChartCard() (+8 more)

### Community 13 - "MockStore"
Cohesion: 0.11
Nodes (7): MockStore, AppNotification, Booking, DriverProfile, Escrow, Requirement, UserProfile

### Community 14 - "deliveries/page.tsx"
Cohesion: 0.14
Nodes (17): Filter, OPEN, RequestsPage(), toTarget(), DeliveriesPage(), deliveryStep(), NEXT, CounterDialog() (+9 more)

### Community 15 - "test_category_registry.py"
Cohesion: 0.11
Nodes (16): build_category_prompt_block(), get_category_ids(), Category registry — single source of truth for all resource categories. Loads…, Return all valid category ID strings., Build the category section of the LLM system prompt dynamically. Each line maps…, Tests for the category registry — verifies JSON loading, enum generation, and…, Spot-check that physical items require photo evidence., Spot-check that powered items require video evidence. (+8 more)

### Community 16 - "index.ts"
Cohesion: 0.13
Nodes (20): categoriesApi, escrowApi, reviewsApi, AvailabilitySlot, BookingStatus, CounterInput, DeliveryStatus, DriverProfileInput (+12 more)

### Community 17 - "mock-store.ts"
Cohesion: 0.16
Nodes (18): MOCK_BOOKINGS, MOCK_CATEGORIES, MOCK_DRIVER, MOCK_DRIVER_DASHBOARD, MOCK_DRIVER_ROUTES, MOCK_ESCROW, MOCK_NOTIFICATIONS, MOCK_REQUESTS (+10 more)

### Community 18 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 19 - "app-sidebar.tsx"
Cohesion: 0.20
Nodes (16): AppShellProps, AppSidebar(), AppSidebarProps, AppTopbar(), IconRail(), MobileNav(), isActive(), NavGroup (+8 more)

### Community 20 - "top-navbar.tsx"
Cohesion: 0.15
Nodes (15): notificationHref(), NotificationsMenu(), open(), TopNavbarProps, DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem() (+7 more)

### Community 21 - "routes.py"
Cohesion: 0.16
Nodes (19): create_route(), CreateRouteRequest, deactivate_route(), _get_db(), get_my_routes(), LocationPayload, BaseModel, get (+11 more)

### Community 22 - "ParsedItem"
Cohesion: 0.16
Nodes (14): ParsedItem, BaseModel, One hospitality resource extracted from a requirement., Root object returned by the Groq JSON response., RequirementParseResult, parametrize, Verify the auto-generated enum has exactly 31 members., test_all_31_categories_exist_in_enum() (+6 more)

### Community 23 - "layouts.tsx"
Cohesion: 0.13
Nodes (12): BusinessOnboardingPage(), DriverOnboardingPage(), AppShell(), BusinessFrame(), BusinessLayout(), DriverFrame(), DriverLayout(), BUSINESS_SHELL (+4 more)

### Community 24 - "bookings/[id]/page.tsx"
Cohesion: 0.19
Nodes (14): BookingDetailPage(), MarketplacePage(), RequirementsPageInner(), StatusTimeline(), Step, EscrowCard(), pay(), EvidenceGallery() (+6 more)

### Community 25 - "dependencies"
Cohesion: 0.12
Nodes (17): @base-ui/react, firebase, dependencies, @base-ui/react, firebase, @hugeicons/core-free-icons, lucide-react, next (+9 more)

### Community 26 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 27 - "drivers.py"
Cohesion: 0.20
Nodes (15): create_driver_profile(), DriverAuthStatusData, DriverAuthStatusResponse, DriverProfileCreate, DriverProfileData, DriverProfileResponse, get_current_driver_profile(), get_db() (+7 more)

### Community 28 - "smart-matches/page.tsx"
Cohesion: 0.17
Nodes (12): computeScore(), computeScoreBreakdown(), DemandMatch, getImage(), haversineKm(), MatchResult, PLACEHOLDER_IMAGES, shortLocation() (+4 more)

### Community 29 - "confirm-dialog.tsx"
Cohesion: 0.21
Nodes (11): Props, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader() (+3 more)

### Community 30 - "marketplace/page.tsx"
Cohesion: 0.19
Nodes (8): FilterBar(), FilterBarProps, MUMBAI_HUBS, MarketplaceCard(), MarketplaceCardProps, resourcesApi, Resource, ResourceInput

### Community 31 - "utils.ts"
Cohesion: 0.21
Nodes (9): Card(), CardAction(), CardContent(), CardFooter(), CardHeader(), ChartCardProps, Checkbox(), StatFrameCard() (+1 more)

### Community 32 - "logistics/page.tsx"
Cohesion: 0.19
Nodes (9): getVehicleImage(), LogisticsContent(), PooledDriver, PooledSolution, RouteMatch, shortAddr(), CostComparison(), CostComparisonProps (+1 more)

### Community 33 - "providers/[id]/page.tsx"
Cohesion: 0.33
Nodes (7): ProfilePage(), ProviderPage(), DriverProfilePage(), Page(), PageHeader(), initials(), shortDate()

### Community 34 - "app-topbar.tsx"
Cohesion: 0.23
Nodes (8): AppTopbarProps, Popover(), PopoverContent(), PopoverDescription(), PopoverHeader(), PopoverTitle(), PopoverTrigger(), Switch()

### Community 35 - "parse_requirement"
Cohesion: 0.25
Nodes (9): parse_requirement(), Extract and validate hospitality resources from a search description., test_parser_output_is_firestore_compatible(), parametrize, test_empty_description_returns_without_calling_groq(), test_parse_requirement_rejects_invalid_model_output(), test_parse_requirement_returns_empty_list_for_no_resources(), test_parse_requirement_returns_validated_items() (+1 more)

### Community 36 - "providers.tsx"
Cohesion: 0.22
Nodes (7): geistMono, geistSans, inter, metadata, Providers(), ThemeProvider(), TooltipProvider()

### Community 37 - "client.ts"
Cohesion: 0.24
Nodes (9): api, API_BASE_URL, ApiError, errorMessage(), Json, request(), RequestOptions, resolveMockFallback() (+1 more)

### Community 38 - "llm_parser.py"
Cohesion: 0.29
Nodes (9): _get_client(), ParserServiceError, Parse natural-language hospitality requirements into validated items., Create the Groq client lazily so importing this module has no side effects., Request a strict JSON extraction from Groq and return its content., Raised when a requirement cannot be safely parsed., _request_completion(), Exception (+1 more)

### Community 39 - "NotificationsPage"
Cohesion: 0.27
Nodes (5): NotificationsPage(), acceptCounter(), markAllRead(), markLocal(), open()

### Community 40 - "session-gate.tsx"
Cohesion: 0.24
Nodes (9): BusinessGate(), DriverGate(), Kind, ROUTES, useProfileGate(), LoadingState(), driversApi, BusinessSessionContext (+1 more)

### Community 41 - "auth.tsx"
Cohesion: 0.29
Nodes (9): AuthContext, AuthContextValue, AuthProvider(), AuthStatus, AuthUser, demoToken(), demoUserFromToken(), readStorage() (+1 more)

### Community 42 - "test_llm_parser_client.py"
Cohesion: 0.28
Nodes (4): FakeClient, FakeCompletions, test_client_failure_is_wrapped_without_exposing_credentials(), test_groq_call_uses_strict_json_mode_and_deterministic_temperature()

### Community 43 - "auth-pages.tsx"
Cohesion: 0.33
Nodes (4): BusinessLoginPage(), BusinessSignupPage(), DriverLoginPage(), DriverSignupPage()

### Community 44 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 45 - "seed_firebase.py"
Cohesion: 0.32
Nodes (6): clear_stale_logistics(), main(), Firebase Seed Script ==================== Populates Firestore with realistic…, Write a list of documents to a Firestore collection., Clear old unrealistic driver and driverRoute documents., seed_collection()

### Community 46 - "firebase.ts"
Cohesion: 0.32
Nodes (7): handleFiles(), config, firebaseApp(), firebaseAuth(), firebaseEnabled, storageEnabled, uploadFile()

### Community 47 - "test_bookings.py"
Cohesion: 0.43
Nodes (6): create_test_app(), mock_firebase(), fixture, test_confirm_receipt(), test_get_booking_detail_and_authorization(), test_get_my_bookings()

### Community 48 - "test_dashboard_notifications_endpoints.py"
Cohesion: 0.43
Nodes (6): create_test_app(), mock_firebase(), fixture, test_dashboard_driver_endpoint(), test_dashboard_user_endpoint(), test_notifications_endpoints()

### Community 49 - "fund_escrow"
Cohesion: 0.29
Nodes (7): create_escrow(), fund_escrow(), post, Fund escrow (mock payment confirmation). Transitions escrow status PENDING ->…, Release escrow after successful fulfillment. Splits payout to provider and…, Create escrow for a booking (or retrieve existing if already created).…, release_escrow()

### Community 50 - "SearchPageInner"
Cohesion: 0.33
Nodes (5): defaultWindow(), SearchPageInner(), bundleQty(), sendBundle(), sortProducts()

### Community 51 - "navbar.tsx"
Cohesion: 0.48
Nodes (4): Step, BRAND_NAME, BrandLogo(), Navbar()

### Community 52 - "get_booking_detail"
Cohesion: 0.40
Nodes (5): get_booking_detail(), get_my_bookings(), get, Get full booking information. Ensures caller is a participant (seeker,…, Get bookings involving the authenticated user (as seeker, provider, or driver).…

### Community 53 - "get_driver_dashboard"
Cohesion: 0.40
Nodes (5): get_driver_dashboard(), get_user_dashboard(), get, Get driver dashboard data. Aggregates active routes, matched delivery requests,…, Get combined dashboard data for an authenticated business user / provider /…

### Community 54 - "record_condition_evidence"
Cohesion: 0.40
Nodes (5): post, Validate that the uploaded media type matches the category's requirement.…, Record condition evidence metadata (image/video URL from Firebase Storage +…, record_condition_evidence(), _validate_media_type()

### Community 55 - "get_current_user_profile"
Cohesion: 0.40
Nodes (5): get_current_user_profile(), get_user_document(), get, Return the application profile of the authenticated user., Get a user document from Firestore.

### Community 56 - "ResourceFormSheet"
Cohesion: 0.60
Nodes (5): ResourceFormSheet(), save(), update(), updateSlot(), toDraft()

### Community 58 - "perspective.tsx"
Cohesion: 0.40
Nodes (4): Perspective, PerspectiveContext, PerspectiveContextType, PerspectiveProvider()

### Community 59 - "clear_firebase.py"
Cohesion: 0.67
Nodes (3): delete_collection(), main(), Deletes all documents in a Firestore collection.

### Community 60 - "AuthForm"
Cohesion: 0.67
Nodes (4): AuthForm(), handleGoogle(), handleSubmit(), authErrorMessage()

### Community 61 - "score-breakdown.tsx"
Cohesion: 0.50
Nodes (3): ScoreBreakdown(), ScoreBreakdownProps, ScoreItem

### Community 63 - "_load_categories"
Cohesion: 0.67
Nodes (3): _load_categories(), Any, Load and cache the category registry from the shared JSON file.

### Community 64 - "confirm_receipt"
Cohesion: 0.67
Nodes (3): confirm_receipt(), post, Seeker confirms successful delivery receipt. Updates booking status to…

### Community 65 - "create_review"
Cohesion: 0.67
Nodes (3): create_review(), post, Submit a review and rating for a completed booking. Atomically updates provider…

### Community 66 - "create_user_profile"
Cohesion: 0.67
Nodes (3): create_user_profile(), post, Create the application profile for an authenticated Firebase user. Firebase…

## Knowledge Gaps
- **161 isolated node(s):** `Audience`, `Mode`, `Props`, `Props`, `Props` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `button.tsx`, `providers/[id]/page.tsx`, `closing.tsx`, `app-topbar.tsx`, `NotificationsPage`, `search/page.tsx`, `session-gate.tsx`, `resources/page.tsx`, `routes/page.tsx`, `deliveries/page.tsx`, `navbar.tsx`, `app-sidebar.tsx`, `top-navbar.tsx`, `bookings/[id]/page.tsx`, `confirm-dialog.tsx`, `utils.ts`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `Button()` connect `button.tsx` to `logistics/page.tsx`, `closing.tsx`, `app-topbar.tsx`, `cn`, `search/page.tsx`, `session-gate.tsx`, `resources/page.tsx`, `routes/page.tsx`, `deliveries/page.tsx`, `navbar.tsx`, `app-sidebar.tsx`, `top-navbar.tsx`, `bookings/[id]/page.tsx`, `smart-matches/page.tsx`, `confirm-dialog.tsx`, `marketplace/page.tsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `MockStore` connect `MockStore` to `app-topbar.tsx`, `client.ts`, `index.ts`, `mock-store.ts`, `marketplace/page.tsx`, `ResourceRequest`, `DriverRoute`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `Audience`, `Mode`, `Props` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `button.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07503607503607504 - nodes in this community are weakly interconnected._
- **Should `test_drivers.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05117845117845118 - nodes in this community are weakly interconnected._
- **Should `closing.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06901960784313725 - nodes in this community are weakly interconnected._