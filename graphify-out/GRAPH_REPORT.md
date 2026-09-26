# Graph Report - hospitality_exchange  (2026-09-27)

## Corpus Check
- 190 files · ~78,477 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1029 nodes · 2688 edges · 74 communities (59 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Auth & Firebase Integration
- Auth & Firebase Integration
- Driver & Escrow Backend Tests
- Bookings & Evidence UI
- Category Registry & LLM Prompts
- Bookings & Evidence UI
- Geolocation & Distance Router
- Notifications & Shell Bar
- Auth & Firebase Integration
- TypeScript Compiler Config
- Logistics CP-SAT Matcher
- Resource Requests Management UI
- Category Registry & LLM Prompts
- UI Component Config
- Driver Route Endpoints
- Category Registry & LLM Prompts
- Auth & Firebase Integration
- Bookings & Evidence UI
- Package Dependencies & Scripts
- Package Dependencies & Scripts
- Drivers Module
- Frontend API Client & SDK
- UI Design System Components
- UI Design System Components
- Search & Onboarding Workspaces
- Frontend API Client & SDK
- Auth & Firebase Integration
- Notifications & Shell Bar
- Main Module
- Test Llm Parser Client Module
- Test Llm Parser Service Module
- Auth & Firebase Integration
- UI Design System Components
- Frontend API Client & SDK
- UI Design System Components
- Page Module
- Package Dependencies & Scripts
- Test Llm Parser Client Module
- Test Bookings Module
- Notifications & Shell Bar
- Escrow Module
- Bookings Module
- Dashboard Module
- Category Registry & LLM Prompts
- Users Module
- Modal Dialogs & Sheets
- Auth & Firebase Integration
- Modal Dialogs & Sheets
- Category Registry & LLM Prompts
- Escrow Module
- Notifications & Shell Bar
- Notifications & Shell Bar
- Requests Module
- Reviews Module
- Reviews Module
- Users Module
-   Init   Module
- Package Dependencies & Scripts
- Package Dependencies & Scripts
- Package Dependencies & Scripts
- Eslint.Config Module
- Next.Config Module
- Package Dependencies & Scripts
- Package Dependencies & Scripts
- Package Dependencies & Scripts
- Package Dependencies & Scripts
- Package Dependencies & Scripts
- Package Dependencies & Scripts
- Package Dependencies & Scripts
- Postcss.Config Module
- str Context

## God Nodes (most connected - your core abstractions)
1. `cn()` - 170 edges
2. `Button()` - 41 edges
3. `inr()` - 34 edges
4. `useApi()` - 31 edges
5. `shortDate()` - 24 edges
6. `Spinner()` - 23 edges
7. `humanize()` - 22 edges
8. `search_seeker_products()` - 17 edges
9. `ParsedItem` - 17 edges
10. `useAuth()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `parse_requirement_endpoint()` --uses--> `ParserServiceError`  [INFERRED]
  backend/main.py → backend/services/llm_parser.py
- `RoleCard()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/landing/closing.tsx → frontend/lib/utils.ts
- `RailButton()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/shell/icon-rail.tsx → frontend/lib/utils.ts
- `AlertDialogOverlay()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/ui/alert-dialog.tsx → frontend/lib/utils.ts
- `AlertDialogMedia()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/ui/alert-dialog.tsx → frontend/lib/utils.ts

## Import Cycles
- None detected.

## Communities (74 total, 15 thin omitted)

### Community 0 - "Auth & Firebase Integration"
Cohesion: 0.06
Nodes (70): EXAMPLES, SortKey, Audience, COPY, Mode, AuthSplit(), ESCROW_COPY, EvidenceDialog() (+62 more)

### Community 1 - "Auth & Firebase Integration"
Cohesion: 0.07
Nodes (35): satoshi, Step, BRAND_NAME, BrandLogo(), CallToAction(), Examples(), firstRow, Footer() (+27 more)

### Community 2 - "Driver & Escrow Backend Tests"
Cohesion: 0.05
Nodes (33): mock_db(), MockCollection, MockDocumentReference, MockDocumentSnapshot, MockFirestoreClient, override_auth(), fixture, test_create_driver_profile_sets_firebase_custom_claim() (+25 more)

### Community 3 - "Bookings & Evidence UI"
Cohesion: 0.07
Nodes (38): Stars(), StarPicker(), StatusTimeline(), Step, AlertAction(), AlertTitle(), AvatarBadge(), AvatarGroup() (+30 more)

### Community 4 - "Category Registry & LLM Prompts"
Cohesion: 0.07
Nodes (46): api, API_BASE_URL, ApiError, errorMessage(), Json, request(), RequestOptions, categoriesApi (+38 more)

### Community 5 - "Bookings & Evidence UI"
Cohesion: 0.15
Nodes (26): BookingDetailPage(), BookingsPage(), DashboardHome(), RequirementsPageInner(), ResourcesPageInner(), DeliveriesPage(), deliveryStep(), DriverDashboard() (+18 more)

### Community 6 - "Geolocation & Distance Router"
Cohesion: 0.11
Nodes (27): extract_coordinates(), haversine_distance(), Any, Calculate great-circle distance in kilometers between two coordinates. Returns…, Extract (latitude, longitude) floats from a location dict or object. Supports…, Seeker Module Encapsulates requirement parsing via LLM Parser and multi-…, BaseModel, post (+19 more)

### Community 7 - "Notifications & Shell Bar"
Cohesion: 0.09
Nodes (20): NotificationsPage(), acceptCounter(), markAllRead(), markLocal(), open(), notificationHref(), NotificationsMenu(), open() (+12 more)

### Community 8 - "Auth & Firebase Integration"
Cohesion: 0.17
Nodes (18): get_current_user(), Verify the Firebase ID token supplied by the frontend. Supports…, confirm_receipt(), post, Seeker confirms successful delivery receipt. Updates booking status to…, ===============================================================================…, emit_notification(), Creates a notification document in the Firestore 'notifications' collection,… (+10 more)

### Community 9 - "TypeScript Compiler Config"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 10 - "Logistics CP-SAT Matcher"
Cohesion: 0.10
Nodes (23): Logistics Module Driver route registration, route matching with CP-SAT…, _cpsat_rank_routes(), _fetch_candidate_routes(), find_best_routes(), _min_distance_to_waypoints(), Logistics - Route Matcher with CP-SAT Optimization…, Use CP-SAT to rank candidate routes by minimizing a weighted composite cost.…, Main entry point: finds and ranks driver routes for a delivery need. Parameters… (+15 more)

### Community 11 - "Resource Requests Management UI"
Cohesion: 0.14
Nodes (17): Filter, OPEN, RequestsPage(), toTarget(), NEXT, CounterDialog(), NegotiationTarget, RejectDialog() (+9 more)

### Community 12 - "Category Registry & LLM Prompts"
Cohesion: 0.11
Nodes (16): build_category_prompt_block(), get_category_ids(), Category registry — single source of truth for all resource categories. Loads…, Return all valid category ID strings., Build the category section of the LLM system prompt dynamically. Each line maps…, Tests for the category registry — verifies JSON loading, enum generation, and…, Spot-check that physical items require photo evidence., Spot-check that powered items require video evidence. (+8 more)

### Community 13 - "UI Component Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 14 - "Driver Route Endpoints"
Cohesion: 0.16
Nodes (19): create_route(), CreateRouteRequest, deactivate_route(), _get_db(), get_my_routes(), LocationPayload, BaseModel, get (+11 more)

### Community 15 - "Category Registry & LLM Prompts"
Cohesion: 0.16
Nodes (14): ParsedItem, BaseModel, One hospitality resource extracted from a requirement., Root object returned by the Groq JSON response., RequirementParseResult, parametrize, Verify the auto-generated enum has exactly 31 members., test_all_31_categories_exist_in_enum() (+6 more)

### Community 16 - "Auth & Firebase Integration"
Cohesion: 0.17
Nodes (17): handleFiles(), AuthContext, AuthContextValue, AuthProvider(), AuthStatus, AuthUser, demoToken(), demoUserFromToken() (+9 more)

### Community 17 - "Bookings & Evidence UI"
Cohesion: 0.26
Nodes (13): Filter, Role, UPCOMING, QUICK_ACTIONS, ErrorState(), ListSkeleton(), Table(), TableBody() (+5 more)

### Community 18 - "Package Dependencies & Scripts"
Cohesion: 0.12
Nodes (17): @base-ui/react, class-variance-authority, firebase, dependencies, @base-ui/react, class-variance-authority, firebase, @hugeicons/core-free-icons (+9 more)

### Community 19 - "Package Dependencies & Scripts"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 20 - "Drivers Module"
Cohesion: 0.20
Nodes (15): create_driver_profile(), DriverAuthStatusData, DriverAuthStatusResponse, DriverProfileCreate, DriverProfileData, DriverProfileResponse, get_current_driver_profile(), get_db() (+7 more)

### Community 21 - "Frontend API Client & SDK"
Cohesion: 0.20
Nodes (10): Filter, RouteMeta(), RoutePath(), PanelLink(), STATUS_TONE, StatusBadge(), Tone, TONES (+2 more)

### Community 22 - "UI Design System Components"
Cohesion: 0.19
Nodes (12): ConfirmDialog(), Props, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter() (+4 more)

### Community 23 - "UI Design System Components"
Cohesion: 0.25
Nodes (12): AppShell(), AppShellProps, IconRail(), MobileNav(), RailButton(), isActive(), NavItem, pageMeta() (+4 more)

### Community 24 - "Search & Onboarding Workspaces"
Cohesion: 0.19
Nodes (12): searchHref(), defaultWindow(), SearchPageInner(), bundleQty(), sendBundle(), sortProducts(), estimateCost(), localInputToIso() (+4 more)

### Community 25 - "Frontend API Client & SDK"
Cohesion: 0.24
Nodes (9): ProfilePage(), ProviderPage(), DriverProfilePage(), Page(), PageHeader(), Avatar(), AvatarFallback(), reviewsApi (+1 more)

### Community 26 - "Auth & Firebase Integration"
Cohesion: 0.22
Nodes (8): AuthForm(), handleGoogle(), handleSubmit(), BusinessLoginPage(), BusinessSignupPage(), DriverLoginPage(), DriverSignupPage(), authErrorMessage()

### Community 27 - "Notifications & Shell Bar"
Cohesion: 0.24
Nodes (9): Any, test_serialize_firestore_doc(), test_standard_response(), get_doc_or_404(), Constructs a uniform API response envelope matching backend conventions: {…, Fetches a document from Firestore or raises a 404 HTTPException. Returns…, Recursively converts datetime objects, DatetimeWithNanoseconds, and nested…, serialize_firestore_doc() (+1 more)

### Community 28 - "Main Module"
Cohesion: 0.24
Nodes (10): health_check(), list_categories(), parse_requirement_endpoint(), BaseModel, get, post, Parse natural language requirement into structured hospitality resources., Return all resource categories with evidence types, labels, and metrics. (+2 more)

### Community 29 - "Test Llm Parser Client Module"
Cohesion: 0.25
Nodes (10): _get_client(), ParserServiceError, Parse natural-language hospitality requirements into validated items., Create the Groq client lazily so importing this module has no side effects., Request a strict JSON extraction from Groq and return its content., Raised when a requirement cannot be safely parsed., _request_completion(), test_client_failure_is_wrapped_without_exposing_credentials() (+2 more)

### Community 30 - "Test Llm Parser Service Module"
Cohesion: 0.25
Nodes (9): parse_requirement(), Extract and validate hospitality resources from a search description., test_parser_output_is_firestore_compatible(), parametrize, test_empty_description_returns_without_calling_groq(), test_parse_requirement_rejects_invalid_model_output(), test_parse_requirement_returns_empty_list_for_no_resources(), test_parse_requirement_returns_validated_items() (+1 more)

### Community 31 - "Auth & Firebase Integration"
Cohesion: 0.18
Nodes (7): BusinessOnboardingPage(), DriverOnboardingPage(), Navbar(), BusinessFrame(), GateError(), TopNavbar(), useAuth()

### Community 32 - "UI Design System Components"
Cohesion: 0.22
Nodes (7): geistMono, geistSans, inter, metadata, Providers(), ThemeProvider(), TooltipProvider()

### Community 33 - "Frontend API Client & SDK"
Cohesion: 0.25
Nodes (9): BusinessGate(), DriverGate(), Kind, ROUTES, useProfileGate(), driversApi, BusinessSessionContext, DriverSessionContext (+1 more)

### Community 34 - "UI Design System Components"
Cohesion: 0.33
Nodes (8): Empty(), EmptyContent(), EmptyDescription(), EmptyHeader(), EmptyMedia(), emptyMediaVariants, EmptyTitle(), Skeleton()

### Community 35 - "Page Module"
Cohesion: 0.27
Nodes (7): RoutesPageInner(), BusinessLayout(), DriverFrame(), DriverLayout(), BUSINESS_SHELL, DRIVER_SHELL, useDriverSession()

### Community 36 - "Package Dependencies & Scripts"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 37 - "Test Llm Parser Client Module"
Cohesion: 0.32
Nodes (3): FakeClient, FakeCompletions, test_groq_call_uses_strict_json_mode_and_deterministic_temperature()

### Community 38 - "Test Bookings Module"
Cohesion: 0.43
Nodes (6): create_test_app(), mock_firebase(), fixture, test_confirm_receipt(), test_get_booking_detail_and_authorization(), test_get_my_bookings()

### Community 39 - "Notifications & Shell Bar"
Cohesion: 0.43
Nodes (6): create_test_app(), mock_firebase(), fixture, test_dashboard_driver_endpoint(), test_dashboard_user_endpoint(), test_notifications_endpoints()

### Community 40 - "Escrow Module"
Cohesion: 0.29
Nodes (7): create_escrow(), fund_escrow(), post, Fund escrow (mock payment confirmation). Transitions escrow status PENDING ->…, Release escrow after successful fulfillment. Splits payout to provider and…, Create escrow for a booking (or retrieve existing if already created).…, release_escrow()

### Community 41 - "Bookings Module"
Cohesion: 0.40
Nodes (5): get_booking_detail(), get_my_bookings(), get, Get full booking information. Ensures caller is a participant (seeker,…, Get bookings involving the authenticated user (as seeker, provider, or driver).…

### Community 42 - "Dashboard Module"
Cohesion: 0.40
Nodes (5): get_driver_dashboard(), get_user_dashboard(), get, Get driver dashboard data. Aggregates active routes, matched delivery requests,…, Get combined dashboard data for an authenticated business user / provider /…

### Community 43 - "Category Registry & LLM Prompts"
Cohesion: 0.40
Nodes (5): post, Validate that the uploaded media type matches the category's requirement.…, Record condition evidence metadata (image/video URL from Firebase Storage +…, record_condition_evidence(), _validate_media_type()

### Community 44 - "Users Module"
Cohesion: 0.40
Nodes (5): get_current_user_profile(), get_user_document(), get, Return the application profile of the authenticated user., Get a user document from Firestore.

### Community 45 - "Modal Dialogs & Sheets"
Cohesion: 0.60
Nodes (5): ResourceFormSheet(), save(), update(), updateSlot(), toDraft()

### Community 46 - "Auth & Firebase Integration"
Cohesion: 0.67
Nodes (3): delete_collection(), main(), Deletes all documents in a Firestore collection.

### Community 47 - "Modal Dialogs & Sheets"
Cohesion: 0.50
Nodes (3): ConfirmReceiptDialog(), ReviewDialog(), submit()

### Community 48 - "Category Registry & LLM Prompts"
Cohesion: 0.67
Nodes (3): _load_categories(), Any, Load and cache the category registry from the shared JSON file.

### Community 49 - "Escrow Module"
Cohesion: 0.67
Nodes (3): get_escrow_detail(), get, Get escrow status and financial breakdown.

### Community 50 - "Notifications & Shell Bar"
Cohesion: 0.67
Nodes (3): get_user_notifications(), get, Get notifications for the authenticated user.

### Community 51 - "Notifications & Shell Bar"
Cohesion: 0.67
Nodes (3): mark_notification_as_read(), patch, Mark a notification as read.

### Community 52 - "Requests Module"
Cohesion: 0.67
Nodes (3): get_provider_requests(), get, Get requests received by the authenticated provider. Enriches seeker and…

### Community 53 - "Reviews Module"
Cohesion: 0.67
Nodes (3): create_review(), post, Submit a review and rating for a completed booking. Atomically updates provider…

### Community 54 - "Reviews Module"
Cohesion: 0.67
Nodes (3): get_user_reviews(), get, Get provider overall rating, totalRatings count, and list of reviews.

### Community 55 - "Users Module"
Cohesion: 0.67
Nodes (3): create_user_profile(), post, Create the application profile for an authenticated Firebase user. Firebase…

## Knowledge Gaps
- **138 isolated node(s):** `Filter`, `Role`, `UPCOMING`, `QUICK_ACTIONS`, `Filter` (+133 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Bookings & Evidence UI` to `Auth & Firebase Integration`, `Auth & Firebase Integration`, `UI Design System Components`, `Bookings & Evidence UI`, `Notifications & Shell Bar`, `Resource Requests Management UI`, `Bookings & Evidence UI`, `Frontend API Client & SDK`, `UI Design System Components`, `UI Design System Components`, `Frontend API Client & SDK`, `Auth & Firebase Integration`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `Button()` connect `Auth & Firebase Integration` to `Auth & Firebase Integration`, `Frontend API Client & SDK`, `UI Design System Components`, `Bookings & Evidence UI`, `Bookings & Evidence UI`, `Notifications & Shell Bar`, `Resource Requests Management UI`, `Bookings & Evidence UI`, `Frontend API Client & SDK`, `UI Design System Components`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `parse_requirement()` connect `Test Llm Parser Service Module` to `Main Module`, `Test Llm Parser Client Module`, `Geolocation & Distance Router`, `Category Registry & LLM Prompts`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `Filter`, `Role`, `UPCOMING` to the rest of the system?**
  _138 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth & Firebase Integration` be split into smaller, more focused modules?**
  _Cohesion score 0.0649867374005305 - nodes in this community are weakly interconnected._
- **Should `Auth & Firebase Integration` be split into smaller, more focused modules?**
  _Cohesion score 0.06578947368421052 - nodes in this community are weakly interconnected._
- **Should `Driver & Escrow Backend Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.05117845117845118 - nodes in this community are weakly interconnected._