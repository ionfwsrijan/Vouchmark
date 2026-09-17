from __future__ import annotations

from src.models import AnalysisContext
from src.rules import (
    RULE_BOOK,
    assess_all,
    decide_verdict,
    normalize_category,
)


def ctx_none():
    return AnalysisContext()


def test_category_normalization_aliases():
    assert normalize_category("Pre-Existing Disease") == "pre_existing"
    assert normalize_category("PED") == "pre_existing"
    assert normalize_category("non-intimation") == "delayed_intimation"
    assert normalize_category("daycare") == "daycare_not_covered"
    assert normalize_category("Room Rent") == "room_rent_cap"
    assert normalize_category("some_novel_thing") == "other"


def test_rulebook_is_complete():
    for key, rec in RULE_BOOK.items():
        assert rec["label"], key
        assert rec["line"], key
        assert rec["evidence"], key
        assert rec["default"] in {"weak", "strong", "undetermined"}, key


def test_delayed_intimation_is_weak_by_default():
    a = assess_all([{"category": "delayed_intimation"}], ctx_none())
    assert a[0].grounds_strength == "weak"
    assert a[0].is_weak


def test_pre_existing_outside_waiting_window_is_weak():
    c = AnalysisContext(policy_years=6)
    a = assess_all([{"category": "pre_existing"}], c)
    assert a[0].grounds_strength == "weak"


def test_pre_existing_diagnosed_before_policy_is_strong():
    c = AnalysisContext(policy_years=3, diagnosis_age_years=5)
    a = assess_all([{"category": "pre_existing"}], c)
    assert a[0].grounds_strength == "strong"


def test_pre_existing_without_context_is_undetermined():
    a = assess_all([{"category": "pre_existing"}], ctx_none())
    assert a[0].grounds_strength == "undetermined"


def test_lapsed_policy_is_strong():
    a = assess_all([{"category": "policy_lapsed"}], ctx_none())
    assert a[0].grounds_strength == "strong"


def test_missing_documents_is_curable():
    a = assess_all([{"category": "missing_documents"}], ctx_none())
    assert a[0].grounds_strength == "undetermined"


def test_verdict_any_weak_wins():
    v = decide_verdict(
        assess_all(
            [{"category": "delayed_intimation"}, {"category": "policy_lapsed"}],
            ctx_none(),
        ),
        ctx_none(),
    )
    assert v.label == "LIKELY_INVALID"
    assert v.fight_score >= 60


def test_verdict_all_strong_is_likely_valid():
    v = decide_verdict(
        assess_all(
            [{"category": "policy_lapsed"}, {"category": "out_of_cover"}],
            ctx_none(),
        ),
        ctx_none(),
    )
    assert v.label == "LIKELY_VALID"


def test_verdict_empty_reasons_needs_input():
    v = decide_verdict([], ctx_none())
    assert v.label == "NEEDS_INPUT"


def test_fight_score_is_fightable_in_both_mixed_and_single():
    single = decide_verdict(
        assess_all([{"category": "delayed_intimation"}], ctx_none()), ctx_none()
    )
    mixed = decide_verdict(
        assess_all(
            [{"category": "delayed_intimation"}, {"category": "missing_documents"}],
            ctx_none(),
        ),
        ctx_none(),
    )
    assert single.fight_score == 78  # single strength class only
    assert mixed.fight_score == 60   # mixed weak + undetermined
    assert single.label == mixed.label == "LIKELY_INVALID"