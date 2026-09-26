"""Tests for the category registry — verifies JSON loading, enum generation, and lookup maps."""

from backend.services.category_registry import (
    CATEGORIES,
    CATEGORY_BY_ID,
    DEFAULT_METRIC_BY_CATEGORY,
    EVIDENCE_TYPE_BY_CATEGORY,
    ResourceCategory,
    build_category_prompt_block,
    get_category_ids,
)


def test_categories_loaded_from_json():
    assert isinstance(CATEGORIES, list)
    assert len(CATEGORIES) == 31


def test_enum_has_31_members():
    members = list(ResourceCategory)
    assert len(members) == 31


def test_enum_values_match_category_ids():
    ids = get_category_ids()
    enum_values = [m.value for m in ResourceCategory]
    assert sorted(ids) == sorted(enum_values)


def test_lookup_maps_populated():
    assert len(CATEGORY_BY_ID) == 31
    assert len(EVIDENCE_TYPE_BY_CATEGORY) == 31
    assert len(DEFAULT_METRIC_BY_CATEGORY) == 31


def test_evidence_types_are_valid():
    valid_types = {"photo", "video", "photo_video"}
    for cat_id, ev_type in EVIDENCE_TYPE_BY_CATEGORY.items():
        assert ev_type in valid_types, f"{cat_id} has invalid evidenceType: {ev_type}"


def test_default_metrics_are_valid():
    valid_metrics = {"units", "kg", "sqm", "liters", "m"}
    for cat_id, metric in DEFAULT_METRIC_BY_CATEGORY.items():
        assert metric in valid_metrics, f"{cat_id} has invalid defaultMetric: {metric}"


def test_prompt_block_contains_all_category_ids():
    block = build_category_prompt_block()
    for cat_id in get_category_ids():
        assert cat_id in block, f"Category '{cat_id}' missing from prompt block"


def test_other_category_exists_as_fallback():
    assert "other" in CATEGORY_BY_ID
    assert CATEGORY_BY_ID["other"]["keywords"] == []
    assert CATEGORY_BY_ID["other"]["evidenceType"] == "photo"


def test_no_duplicate_category_ids():
    ids = get_category_ids()
    assert len(ids) == len(set(ids)), "Duplicate category IDs found"


def test_photo_evidence_categories():
    """Spot-check that physical items require photo evidence."""
    photo_cats = ["banquet_seating", "tables", "linen_textiles", "crockery_glassware"]
    for cat_id in photo_cats:
        assert EVIDENCE_TYPE_BY_CATEGORY[cat_id] == "photo"


def test_video_evidence_categories():
    """Spot-check that powered items require video evidence."""
    video_cats = ["cooking_equipment", "refrigeration", "sound_system", "pos_technology"]
    for cat_id in video_cats:
        assert EVIDENCE_TYPE_BY_CATEGORY[cat_id] == "video"


def test_photo_video_evidence_categories():
    """Spot-check that spaces/structures require both."""
    pv_cats = ["venue_space", "staging_structures", "vehicle_transport"]
    for cat_id in pv_cats:
        assert EVIDENCE_TYPE_BY_CATEGORY[cat_id] == "photo_video"
