# Graph Report - hospitality_exchange  (2026-09-27)

## Corpus Check
- 89 files · ~104,947 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1117 nodes · 2908 edges · 86 communities (65 shown, 21 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- User & Driver Onboarding UI
- Landing Page & Auth Split Shell
- Driver Mock Tests Suite
- Radix & UI Atoms Library
- Dashboard Views & Page Inners
- Haversine Distance & Proximity Engine
- Firebase Auth Middleware & Core Config
- Provider & Driver Dashboards
- TypeScript Configuration
- Driver Profiles & Custom Claims
- OR-Tools CP-SAT Logistics Matcher
- Resource Requests & Negotiation
- Category Registry & Prompt Generator
- Booking & Order Lifecycle UI
- Navbar & Notifications Menus
- Module 15: mock-data.ts / MOCK_BOOKINGS
- Module 16: components.json / aliases
- Module 17: MockStore / .acceptRequest()
- Module 18: requirements/page.tsx / RequirementsPage()
- Module 19: search/page.tsx / defaultWindow()
- Module 20: app-shell.tsx / AppShellProps
- Module 21: routes.py / create_route()
- Module 22: ParsedItem / .normalize_category()
- Module 23: bookings/[id]/page.tsx / BookingDetailPage()
- Module 24: @base-ui/react / date-fns
- Module 25: eslint / eslint-config-next
- Module 26: BusinessOnboardingPage() / handleSubmit()
- Module 27: client.ts / api
- Module 28: .matchRoutes() / .search()
- Module 29: confirm-dialog.tsx / Props
- Module 30: app-topbar.tsx / AppTopbar()
- Module 31: Any / test_helpers_notifications.py
- Module 32: parse_requirement() / Extract and validate hospitality resources from a search description.
- Module 33: auth.tsx / AuthContext
- Module 34: llm_parser.py / _get_client()
- Module 35: dashboard/notifications/page.tsx / Page()
- Module 36: session-gate.tsx / BusinessGate()
- Module 37: .createRequest() / .createResource()
- Module 38: test_llm_parser_client.py / FakeClient
- Module 39: app/(auth)/login/page.tsx / app/(auth)/signup/page.tsx
- Module 40: marketplace/page.tsx / filter-bar.tsx
- Module 41: package.json / name
- Module 42: handleFiles() / firebase.ts
- Module 43: test_bookings.py / create_test_app()
- Module 44: test_dashboard_notifications_endpoints.py / create_test_app()
- Module 45: create_escrow() / fund_escrow()
- Module 46: get_booking_detail() / get_my_bookings()
- Module 47: get_driver_dashboard() / get_user_dashboard()
- Module 48: post / Validate that the uploaded media type matches the category's requirement.…
- Module 49: get_current_user_profile() / get_user_document()
- Module 50: ResourceFormSheet() / save()
- Module 51: clear_firebase.py / delete_collection()
- Module 52: AuthForm() / handleGoogle()
- Module 53: ConfirmReceiptDialog() / submit()
- Module 54: .createDriverRoute() / .getDriverRoutes()
- Module 55: _load_categories() / Any
- Module 56: get_escrow_detail() / get
- Module 57: get_user_notifications() / get
- Module 58: mark_notification_as_read() / patch
- Module 59: get_provider_requests() / get
- Module 60: create_review() / post
- Module 61: get_user_reviews() / get
- Module 62: create_user_profile() / post
- Module 63: TopNavbar() / handleSearch()
- Module 64: services/__init__.py / Backend service modules.
- Module 65: class-variance-authority / class-variance-authority
- Module 66: clsx / clsx
- Module 67: cn / cn
- Module 68: eslint.config.mjs / eslintConfig
- Module 69: .getDriverDashboard() / DriverDashboard
- Module 70: next.config.ts / nextConfig
- Module 71: @hugeicons/react / @hugeicons/react
- Module 72: next-themes / next-themes
- Module 73: radix-ui / radix-ui
- Module 74: react-dom / react-dom
- Module 75: shadcn / shadcn
- Module 76: sonner / sonner
- Module 77: tailwind-merge / tailwind-merge
- Module 78: postcss.config.mjs / config
- Module 80: BaseModel
- Module 81: get
- Module 82: post
- Module 85: str

## God Nodes (most connected - your core abstractions)
1. `cn()` - 167 edges
2. `Button()` - 49 edges
3. `MockStore` - 43 edges
4. `inr()` - 25 edges
5. `useApi()` - 25 edges
6. `Spinner()` - 23 edges
7. `Badge()` - 22 edges
8. `shortDate()` - 20 edges
9. `useAuth()` - 19 edges
10. `ParsedItem` - 17 edges

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

## Communities (86 total, 21 thin omitted)

### Community 0 - "User & Driver Onboarding UI"
Cohesion: 0.07
Nodes (66): Audience, COPY, Mode, AuthSplit(), ESCROW_COPY, EvidenceDialog(), Props, RouteFormSheet() (+58 more)

### Community 1 - "Landing Page & Auth Split Shell"
Cohesion: 0.07
Nodes (35): satoshi, Step, BRAND_NAME, BrandLogo(), CallToAction(), Examples(), firstRow, Footer() (+27 more)

### Community 2 - "Driver Mock Tests Suite"
Cohesion: 0.05
Nodes (33): mock_db(), MockCollection, MockDocumentReference, MockDocumentSnapshot, MockFirestoreClient, override_auth(), fixture, test_create_driver_profile_sets_firebase_custom_claim() (+25 more)

### Community 3 - "Radix & UI Atoms Library"
Cohesion: 0.07
Nodes (35): Stars(), StarPicker(), AlertAction(), AlertTitle(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup() (+27 more)

### Community 4 - "Dashboard Views & Page Inners"
Cohesion: 0.07
Nodes (26): LogisticsPage(), MarketplacePage(), RequirementsPageInner(), ResourcesPageInner(), SCENARIOS, SmartMatchesPage(), geistMono, geistSans (+18 more)

### Community 5 - "Haversine Distance & Proximity Engine"
Cohesion: 0.11
Nodes (27): extract_coordinates(), haversine_distance(), Any, Calculate great-circle distance in kilometers between two coordinates. Returns…, Extract (latitude, longitude) floats from a location dict or object. Supports…, Seeker Module Encapsulates requirement parsing via LLM Parser and multi-…, BaseModel, post (+19 more)

### Community 6 - "Firebase Auth Middleware & Core Config"
Cohesion: 0.17
Nodes (18): get_current_user(), Verify the Firebase ID token supplied by the frontend. Supports…, confirm_receipt(), post, Seeker confirms successful delivery receipt. Updates booking status to…, ===============================================================================…, emit_notification(), Creates a notification document in the Firestore 'notifications' collection,… (+10 more)

### Community 7 - "Provider & Driver Dashboards"
Cohesion: 0.15
Nodes (17): ProviderPage(), DriverDashboard(), DriverProfilePage(), Filter, RouteMeta(), RoutePath(), Page(), PageHeader() (+9 more)

### Community 8 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 9 - "Driver Profiles & Custom Claims"
Cohesion: 0.12
Nodes (24): create_driver_profile(), DriverAuthStatusData, DriverAuthStatusResponse, DriverProfileCreate, DriverProfileData, DriverProfileResponse, get_current_driver_profile(), get_db() (+16 more)

### Community 10 - "OR-Tools CP-SAT Logistics Matcher"
Cohesion: 0.10
Nodes (23): Logistics Module Driver route registration, route matching with CP-SAT…, _cpsat_rank_routes(), _fetch_candidate_routes(), find_best_routes(), _min_distance_to_waypoints(), Logistics - Route Matcher with CP-SAT Optimization…, Use CP-SAT to rank candidate routes by minimizing a weighted composite cost.…, Main entry point: finds and ranks driver routes for a delivery need. Parameters… (+15 more)

### Community 11 - "Resource Requests & Negotiation"
Cohesion: 0.17
Nodes (17): Filter, OPEN, RequestsPage(), toTarget(), NEXT, CounterDialog(), NegotiationTarget, RejectDialog() (+9 more)

### Community 12 - "Category Registry & Prompt Generator"
Cohesion: 0.11
Nodes (16): build_category_prompt_block(), get_category_ids(), Category registry — single source of truth for all resource categories. Loads…, Return all valid category ID strings., Build the category section of the LLM system prompt dynamically. Each line maps…, Tests for the category registry — verifies JSON loading, enum generation, and…, Spot-check that physical items require photo evidence., Spot-check that powered items require video evidence. (+8 more)

### Community 13 - "Booking & Order Lifecycle UI"
Cohesion: 0.16
Nodes (15): Filter, Role, UPCOMING, QUICK_ACTIONS, ProfilePage(), Skeleton(), Table(), TableBody() (+7 more)

### Community 14 - "Navbar & Notifications Menus"
Cohesion: 0.13
Nodes (17): notificationHref(), NotificationsMenu(), open(), TopNavbarProps, DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem() (+9 more)

### Community 15 - "Module 15: mock-data.ts / MOCK_BOOKINGS"
Cohesion: 0.15
Nodes (19): MOCK_BOOKINGS, MOCK_CATEGORIES, MOCK_DRIVER, MOCK_DRIVER_DASHBOARD, MOCK_DRIVER_ROUTES, MOCK_ESCROW, MOCK_NOTIFICATIONS, MOCK_REQUESTS (+11 more)

### Community 16 - "Module 16: components.json / aliases"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 17 - "Module 17: MockStore / .acceptRequest()"
Cohesion: 0.14
Nodes (6): MockStore, AppNotification, Booking, DriverProfile, Escrow, UserProfile

### Community 18 - "Module 18: requirements/page.tsx / RequirementsPage()"
Cohesion: 0.16
Nodes (13): ConfirmDialog(), Props, ProductSheet(), STATUS_TONE, Tone, TONES, Badge(), badgeVariants (+5 more)

### Community 19 - "Module 19: search/page.tsx / defaultWindow()"
Cohesion: 0.13
Nodes (16): defaultWindow(), EXAMPLES, SearchPageInner(), bundleQty(), sendBundle(), SortKey, sortProducts(), ProductCard() (+8 more)

### Community 20 - "Module 20: app-shell.tsx / AppShellProps"
Cohesion: 0.21
Nodes (14): AppShellProps, AppSidebar(), AppSidebarProps, IconRail(), MobileNav(), RailButton(), isActive(), NavGroup (+6 more)

### Community 21 - "Module 21: routes.py / create_route()"
Cohesion: 0.16
Nodes (19): create_route(), CreateRouteRequest, deactivate_route(), _get_db(), get_my_routes(), LocationPayload, BaseModel, get (+11 more)

### Community 22 - "Module 22: ParsedItem / .normalize_category()"
Cohesion: 0.16
Nodes (14): ParsedItem, BaseModel, One hospitality resource extracted from a requirement., Root object returned by the Groq JSON response., RequirementParseResult, parametrize, Verify the auto-generated enum has exactly 31 members., test_all_31_categories_exist_in_enum() (+6 more)

### Community 23 - "Module 23: bookings/[id]/page.tsx / BookingDetailPage()"
Cohesion: 0.20
Nodes (13): BookingDetailPage(), DeliveriesPage(), deliveryStep(), StatusTimeline(), Step, EscrowCard(), pay(), EvidenceGallery() (+5 more)

### Community 24 - "Module 24: @base-ui/react / date-fns"
Cohesion: 0.12
Nodes (17): @base-ui/react, date-fns, firebase, dependencies, @base-ui/react, date-fns, firebase, @hugeicons/core-free-icons (+9 more)

### Community 25 - "Module 25: eslint / eslint-config-next"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 26 - "Module 26: BusinessOnboardingPage() / handleSubmit()"
Cohesion: 0.15
Nodes (12): BusinessOnboardingPage(), DriverOnboardingPage(), Navbar(), AppShell(), BusinessFrame(), BusinessLayout(), DriverFrame(), DriverLayout() (+4 more)

### Community 27 - "Module 27: client.ts / api"
Cohesion: 0.15
Nodes (13): api, API_BASE_URL, ApiError, errorMessage(), Json, request(), RequestOptions, resolveMockFallback() (+5 more)

### Community 28 - "Module 28: .matchRoutes() / .search()"
Cohesion: 0.12
Nodes (14): AvailabilitySlot, BookingStatus, DeliveryStatus, DriverProfileInput, EvidenceInput, ParsedItem, ProviderSummary, RequestStatus (+6 more)

### Community 29 - "Module 29: confirm-dialog.tsx / Props"
Cohesion: 0.21
Nodes (11): Props, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader() (+3 more)

### Community 30 - "Module 30: app-topbar.tsx / AppTopbar()"
Cohesion: 0.20
Nodes (10): AppTopbar(), AppTopbarProps, pageMeta(), Popover(), PopoverContent(), PopoverDescription(), PopoverHeader(), PopoverTitle() (+2 more)

### Community 31 - "Module 31: Any / test_helpers_notifications.py"
Cohesion: 0.24
Nodes (9): Any, test_serialize_firestore_doc(), test_standard_response(), get_doc_or_404(), Constructs a uniform API response envelope matching backend conventions: {…, Fetches a document from Firestore or raises a 404 HTTPException. Returns…, Recursively converts datetime objects, DatetimeWithNanoseconds, and nested…, serialize_firestore_doc() (+1 more)

### Community 32 - "Module 32: parse_requirement() / Extract and validate hospitality resources from a search description."
Cohesion: 0.25
Nodes (9): parse_requirement(), Extract and validate hospitality resources from a search description., test_parser_output_is_firestore_compatible(), parametrize, test_empty_description_returns_without_calling_groq(), test_parse_requirement_rejects_invalid_model_output(), test_parse_requirement_returns_empty_list_for_no_resources(), test_parse_requirement_returns_validated_items() (+1 more)

### Community 33 - "Module 33: auth.tsx / AuthContext"
Cohesion: 0.27
Nodes (10): AuthContext, AuthContextValue, AuthProvider(), AuthStatus, AuthUser, demoToken(), demoUserFromToken(), getIdToken() (+2 more)

### Community 34 - "Module 34: llm_parser.py / _get_client()"
Cohesion: 0.29
Nodes (9): _get_client(), ParserServiceError, Parse natural-language hospitality requirements into validated items., Create the Groq client lazily so importing this module has no side effects., Request a strict JSON extraction from Groq and return its content., Raised when a requirement cannot be safely parsed., _request_completion(), Exception (+1 more)

### Community 35 - "Module 35: dashboard/notifications/page.tsx / Page()"
Cohesion: 0.27
Nodes (5): NotificationsPage(), acceptCounter(), markAllRead(), markLocal(), open()

### Community 36 - "Module 36: session-gate.tsx / BusinessGate()"
Cohesion: 0.24
Nodes (9): BusinessGate(), DriverGate(), Kind, ROUTES, useProfileGate(), LoadingState(), driversApi, BusinessSessionContext (+1 more)

### Community 37 - "Module 37: .createRequest() / .createResource()"
Cohesion: 0.22
Nodes (4): CreateRequestInput, Resource, ResourceInput, ResourceRequest

### Community 38 - "Module 38: test_llm_parser_client.py / FakeClient"
Cohesion: 0.28
Nodes (4): FakeClient, FakeCompletions, test_client_failure_is_wrapped_without_exposing_credentials(), test_groq_call_uses_strict_json_mode_and_deterministic_temperature()

### Community 39 - "Module 39: app/(auth)/login/page.tsx / app/(auth)/signup/page.tsx"
Cohesion: 0.33
Nodes (4): BusinessLoginPage(), BusinessSignupPage(), DriverLoginPage(), DriverSignupPage()

### Community 40 - "Module 40: marketplace/page.tsx / filter-bar.tsx"
Cohesion: 0.28
Nodes (6): FilterBar(), FilterBarProps, MUMBAI_HUBS, MarketplaceCard(), MarketplaceCardProps, resourcesApi

### Community 41 - "Module 41: package.json / name"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 42 - "Module 42: handleFiles() / firebase.ts"
Cohesion: 0.32
Nodes (7): handleFiles(), config, firebaseApp(), firebaseAuth(), firebaseEnabled, storageEnabled, uploadFile()

### Community 43 - "Module 43: test_bookings.py / create_test_app()"
Cohesion: 0.43
Nodes (6): create_test_app(), mock_firebase(), fixture, test_confirm_receipt(), test_get_booking_detail_and_authorization(), test_get_my_bookings()

### Community 44 - "Module 44: test_dashboard_notifications_endpoints.py / create_test_app()"
Cohesion: 0.43
Nodes (6): create_test_app(), mock_firebase(), fixture, test_dashboard_driver_endpoint(), test_dashboard_user_endpoint(), test_notifications_endpoints()

### Community 45 - "Module 45: create_escrow() / fund_escrow()"
Cohesion: 0.29
Nodes (7): create_escrow(), fund_escrow(), post, Fund escrow (mock payment confirmation). Transitions escrow status PENDING ->…, Release escrow after successful fulfillment. Splits payout to provider and…, Create escrow for a booking (or retrieve existing if already created).…, release_escrow()

### Community 46 - "Module 46: get_booking_detail() / get_my_bookings()"
Cohesion: 0.40
Nodes (5): get_booking_detail(), get_my_bookings(), get, Get full booking information. Ensures caller is a participant (seeker,…, Get bookings involving the authenticated user (as seeker, provider, or driver).…

### Community 47 - "Module 47: get_driver_dashboard() / get_user_dashboard()"
Cohesion: 0.40
Nodes (5): get_driver_dashboard(), get_user_dashboard(), get, Get driver dashboard data. Aggregates active routes, matched delivery requests,…, Get combined dashboard data for an authenticated business user / provider /…

### Community 48 - "Module 48: post / Validate that the uploaded media type matches the category's requirement.…"
Cohesion: 0.40
Nodes (5): post, Validate that the uploaded media type matches the category's requirement.…, Record condition evidence metadata (image/video URL from Firebase Storage +…, record_condition_evidence(), _validate_media_type()

### Community 49 - "Module 49: get_current_user_profile() / get_user_document()"
Cohesion: 0.40
Nodes (5): get_current_user_profile(), get_user_document(), get, Return the application profile of the authenticated user., Get a user document from Firestore.

### Community 50 - "Module 50: ResourceFormSheet() / save()"
Cohesion: 0.60
Nodes (5): ResourceFormSheet(), save(), update(), updateSlot(), toDraft()

### Community 51 - "Module 51: clear_firebase.py / delete_collection()"
Cohesion: 0.67
Nodes (3): delete_collection(), main(), Deletes all documents in a Firestore collection.

### Community 52 - "Module 52: AuthForm() / handleGoogle()"
Cohesion: 0.67
Nodes (4): AuthForm(), handleGoogle(), handleSubmit(), authErrorMessage()

### Community 53 - "Module 53: ConfirmReceiptDialog() / submit()"
Cohesion: 0.50
Nodes (3): ConfirmReceiptDialog(), ReviewDialog(), submit()

### Community 55 - "Module 55: _load_categories() / Any"
Cohesion: 0.67
Nodes (3): _load_categories(), Any, Load and cache the category registry from the shared JSON file.

### Community 56 - "Module 56: get_escrow_detail() / get"
Cohesion: 0.67
Nodes (3): get_escrow_detail(), get, Get escrow status and financial breakdown.

### Community 57 - "Module 57: get_user_notifications() / get"
Cohesion: 0.67
Nodes (3): get_user_notifications(), get, Get notifications for the authenticated user.

### Community 58 - "Module 58: mark_notification_as_read() / patch"
Cohesion: 0.67
Nodes (3): mark_notification_as_read(), patch, Mark a notification as read.

### Community 59 - "Module 59: get_provider_requests() / get"
Cohesion: 0.67
Nodes (3): get_provider_requests(), get, Get requests received by the authenticated provider. Enriches seeker and…

### Community 60 - "Module 60: create_review() / post"
Cohesion: 0.67
Nodes (3): create_review(), post, Submit a review and rating for a completed booking. Atomically updates provider…

### Community 61 - "Module 61: get_user_reviews() / get"
Cohesion: 0.67
Nodes (3): get_user_reviews(), get, Get provider overall rating, totalRatings count, and list of reviews.

### Community 62 - "Module 62: create_user_profile() / post"
Cohesion: 0.67
Nodes (3): create_user_profile(), post, Create the application profile for an authenticated Firebase user. Firebase…

## Knowledge Gaps
- **151 isolated node(s):** `Audience`, `Mode`, `Props`, `Step`, `Particle` (+146 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Radix & UI Atoms Library` to `User & Driver Onboarding UI`, `Landing Page & Auth Split Shell`, `Module 35: dashboard/notifications/page.tsx / Page()`, `Module 36: session-gate.tsx / BusinessGate()`, `Provider & Driver Dashboards`, `Resource Requests & Negotiation`, `Booking & Order Lifecycle UI`, `Navbar & Notifications Menus`, `Module 18: requirements/page.tsx / RequirementsPage()`, `Module 20: app-shell.tsx / AppShellProps`, `Module 23: bookings/[id]/page.tsx / BookingDetailPage()`, `Module 26: BusinessOnboardingPage() / handleSubmit()`, `Module 29: confirm-dialog.tsx / Props`, `Module 30: app-topbar.tsx / AppTopbar()`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `Button()` connect `User & Driver Onboarding UI` to `Landing Page & Auth Split Shell`, `Radix & UI Atoms Library`, `Dashboard Views & Page Inners`, `Module 36: session-gate.tsx / BusinessGate()`, `Provider & Driver Dashboards`, `Module 40: marketplace/page.tsx / filter-bar.tsx`, `Resource Requests & Negotiation`, `Booking & Order Lifecycle UI`, `Navbar & Notifications Menus`, `Module 18: requirements/page.tsx / RequirementsPage()`, `Module 19: search/page.tsx / defaultWindow()`, `Module 20: app-shell.tsx / AppShellProps`, `Module 23: bookings/[id]/page.tsx / BookingDetailPage()`, `Module 29: confirm-dialog.tsx / Props`, `Module 30: app-topbar.tsx / AppTopbar()`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `MockStore` connect `Module 17: MockStore / .acceptRequest()` to `Module 37: .createRequest() / .createResource()`, `Module 69: .getDriverDashboard() / DriverDashboard`, `Module 15: mock-data.ts / MOCK_BOOKINGS`, `Module 54: .createDriverRoute() / .getDriverRoutes()`, `Module 27: client.ts / api`, `Module 28: .matchRoutes() / .search()`, `Module 30: app-topbar.tsx / AppTopbar()`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `Audience`, `Mode`, `Props` to the rest of the system?**
  _151 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `User & Driver Onboarding UI` be split into smaller, more focused modules?**
  _Cohesion score 0.06568386568386568 - nodes in this community are weakly interconnected._
- **Should `Landing Page & Auth Split Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.06578947368421052 - nodes in this community are weakly interconnected._
- **Should `Driver Mock Tests Suite` be split into smaller, more focused modules?**
  _Cohesion score 0.05117845117845118 - nodes in this community are weakly interconnected._