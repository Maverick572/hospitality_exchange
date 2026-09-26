# Graph Report - hospitality_exchange  (2026-09-27)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 350 nodes · 609 edges · 19 communities (17 shown, 2 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e2d39277`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- standard_response
- search_seeker_products
- llm_parser.py
- patch
- test_category_registry.py
- test_drivers.py
- routes.py
- ParsedItem
- drivers.py
- users.py
- test_bookings.py
- test_dashboard_notifications_endpoints.py
- record_condition_evidence
- clear_firebase.py
- services/__init__.py
- str

## God Nodes (most connected - your core abstractions)
1. `standard_response()` - 24 edges
2. `ParsedItem` - 17 edges
3. `search_seeker_products()` - 17 edges
4. `parse_requirement()` - 15 edges
5. `emit_notification()` - 14 edges
6. `get_doc_or_404()` - 13 edges
7. `serialize_firestore_doc()` - 12 edges
8. `extract_coordinates()` - 11 edges
9. `find_best_routes()` - 10 edges
10. `haversine_distance()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `record_condition_evidence()` --calls--> `standard_response()`  [INFERRED]
  backend/transactions/evidence.py → backend/transactions/helpers.py
- `parse_requirement_endpoint()` --uses--> `ParserServiceError`  [INFERRED]
  backend/main.py → backend/services/llm_parser.py
- `search_seeker_products()` --calls--> `ParsedItem`  [EXTRACTED]
  backend/seeker/search.py → backend/services/llm_parser.py
- `test_invalid_items_are_rejected()` --uses--> `ParsedItem`  [INFERRED]
  backend/tests/test_llm_parser_contract.py → backend/services/llm_parser.py
- `test_metric_normalization_and_default()` --calls--> `ParsedItem`  [EXTRACTED]
  backend/tests/test_llm_parser_contract.py → backend/services/llm_parser.py

## Import Cycles
- None detected.

## Communities (19 total, 2 thin omitted)

### Community 0 - "standard_response"
Cohesion: 0.06
Nodes (59): Any, test_serialize_firestore_doc(), test_standard_response(), confirm_receipt(), get_booking_detail(), get_my_bookings(), get, post (+51 more)

### Community 1 - "search_seeker_products"
Cohesion: 0.06
Nodes (51): Logistics Module Driver route registration, route matching with CP-SAT…, _cpsat_rank_routes(), _fetch_candidate_routes(), find_best_routes(), _min_distance_to_waypoints(), Logistics - Route Matcher with CP-SAT Optimization…, Use CP-SAT to rank candidate routes by minimizing a weighted composite cost.…, Main entry point: finds and ranks driver routes for a delivery need. Parameters… (+43 more)

### Community 2 - "llm_parser.py"
Cohesion: 0.08
Nodes (32): health_check(), list_categories(), parse_requirement_endpoint(), BaseModel, get, post, Parse natural language requirement into structured hospitality resources., Return all resource categories with evidence types, labels, and metrics. (+24 more)

### Community 3 - "patch"
Cohesion: 0.12
Nodes (25): get_current_user(), Verify the Firebase ID token supplied by the frontend. Supports…, create_test_app(), mock_firebase(), fixture, test_create_and_fund_escrow(), test_release_escrow_split_and_penalty_overflow(), create_test_app() (+17 more)

### Community 4 - "test_category_registry.py"
Cohesion: 0.09
Nodes (19): build_category_prompt_block(), get_category_ids(), _load_categories(), Any, Category registry — single source of truth for all resource categories. Loads…, Load and cache the category registry from the shared JSON file., Return all valid category ID strings., Build the category section of the LLM system prompt dynamically. Each line maps… (+11 more)

### Community 5 - "test_drivers.py"
Cohesion: 0.09
Nodes (8): mock_db(), MockCollection, MockDocumentReference, MockDocumentSnapshot, MockFirestoreClient, override_auth(), fixture, test_create_driver_profile_sets_firebase_custom_claim()

### Community 6 - "routes.py"
Cohesion: 0.16
Nodes (19): create_route(), CreateRouteRequest, deactivate_route(), _get_db(), get_my_routes(), LocationPayload, BaseModel, get (+11 more)

### Community 7 - "ParsedItem"
Cohesion: 0.16
Nodes (14): ParsedItem, BaseModel, One hospitality resource extracted from a requirement., Root object returned by the Groq JSON response., RequirementParseResult, parametrize, Verify the auto-generated enum has exactly 31 members., test_all_31_categories_exist_in_enum() (+6 more)

### Community 8 - "drivers.py"
Cohesion: 0.20
Nodes (15): create_driver_profile(), DriverAuthStatusData, DriverAuthStatusResponse, DriverProfileCreate, DriverProfileData, DriverProfileResponse, get_current_driver_profile(), get_db() (+7 more)

### Community 9 - "users.py"
Cohesion: 0.20
Nodes (10): create_user_profile(), get_current_user_profile(), get_user_document(), get, post, Return the application profile of the authenticated user., Update the authenticated user's application profile., Get a user document from Firestore. (+2 more)

### Community 10 - "test_bookings.py"
Cohesion: 0.43
Nodes (6): create_test_app(), mock_firebase(), fixture, test_confirm_receipt(), test_get_booking_detail_and_authorization(), test_get_my_bookings()

### Community 11 - "test_dashboard_notifications_endpoints.py"
Cohesion: 0.43
Nodes (6): create_test_app(), mock_firebase(), fixture, test_dashboard_driver_endpoint(), test_dashboard_user_endpoint(), test_notifications_endpoints()

### Community 12 - "record_condition_evidence"
Cohesion: 0.40
Nodes (5): post, Validate that the uploaded media type matches the category's requirement.…, Record condition evidence metadata (image/video URL from Firebase Storage +…, record_condition_evidence(), _validate_media_type()

### Community 13 - "clear_firebase.py"
Cohesion: 0.67
Nodes (3): delete_collection(), main(), Deletes all documents in a Firestore collection.

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ParsedItem` connect `ParsedItem` to `search_seeker_products`, `llm_parser.py`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `parse_requirement()` connect `llm_parser.py` to `search_seeker_products`, `ParsedItem`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `search_seeker_products()` connect `search_seeker_products` to `llm_parser.py`, `ParsedItem`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `standard_response()` (e.g. with `confirm_receipt()` and `get_booking_detail()`) actually correct?**
  _`standard_response()` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Should `standard_response` be split into smaller, more focused modules?**
  _Cohesion score 0.06025039123630673 - nodes in this community are weakly interconnected._
- **Should `search_seeker_products` be split into smaller, more focused modules?**
  _Cohesion score 0.05649717514124294 - nodes in this community are weakly interconnected._
- **Should `llm_parser.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07682926829268293 - nodes in this community are weakly interconnected._