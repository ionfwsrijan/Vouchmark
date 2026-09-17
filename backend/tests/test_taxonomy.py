from __future__ import annotations

import pytest

from src.models import AnalysisContext
from src.rules import RULE_BOOK, assess_all, normalize_category

STRENGTHS = {"weak", "strong", "undetermined"}


@pytest.mark.parametrize("category", sorted(RULE_BOOK))
def test_every_rule_is_fully_written(category):
    rule = RULE_BOOK[category]
    assert rule["label"]
    assert rule["line"]
    assert rule["evidence"]
    assert rule["default"] in STRENGTHS
    assert len(rule["line"]) > 40


@pytest.mark.parametrize("category", sorted(RULE_BOOK))
def test_every_category_assesses_to_its_declared_default(category):
    a = assess_all([{"category": category}], AnalysisContext())[0]
    assert a.category == category
    assert a.grounds_strength == RULE_BOOK[category]["default"]


def test_more_fuzzy_aliases_resolve():
    cases = {
        "pre-existing disease": "pre_existing",
        "pre existing condition": "pre_existing",
        "late intimation": "delayed_intimation",
        "no intimation": "delayed_intimation",
        "missing documents": "missing_documents",
        "room rent": "room_rent_cap",
        "specified ailment": "specific_ailment_exclusion",
        "first year": "first_year_restriction",
        "cashless": "cashless_refusal",
        "maternity": "maternity_wait",
        "late submission": "late_submission",
        "daycare": "daycare_not_covered",
        "unreasonable charges": "unreasonable_charges",
        "not covered": "out_of_cover",
        "lapsed": "policy_lapsed",
        "partial": "amount_capped",
    }
    for raw, expected in cases.items():
        assert normalize_category(raw) == expected, raw


def test_rules_engine_is_text_agnostic():
    # Extraction filters blank reasons; the rules layer should tolerate them
    # either way and still classify the category.
    a = assess_all([{"category": "other", "text": "  "}], AnalysisContext())
    assert a[0].category == "other"