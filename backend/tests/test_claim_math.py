from src.claim_math import fmt_inr, shortfall_summary


def test_inr_grouping():
    assert fmt_inr(682000) == "₹ 6,82,000"
    assert fmt_inr(500000) == "₹ 5,00,000"
    assert fmt_inr(1500) == "₹ 1,500"
    assert fmt_inr(999) == "₹ 999"
    assert fmt_inr(0) == "₹ 0"
    assert fmt_inr(1234567) == "₹ 12,34,567"
    assert fmt_inr(-25000) == "-₹ 25,000"
    assert fmt_inr(None) == "[amount in ₹]"


def test_full_rejection():
    out = shortfall_summary(682000, 0, 500000)
    assert out["shortfall"] == 682000
    assert "entire claimed amount appears to have been declined" in out["note"]
    assert "exceeds the sum insured" in out["note"]


def test_partial_settlement():
    out = shortfall_summary(682000, 420000, 1000000)
    assert out["shortfall"] == 262000
    assert "₹ 2,62,000" in out["note"]
    assert "exceeds the sum insured" not in out["note"]


def test_fully_admitted():
    out = shortfall_summary(100000, 100000, 200000)
    assert out["shortfall"] == 0
    assert "covers the claimed amount in full" in out["note"]


def test_missing_numbers_are_flagged_not_guessed():
    out = shortfall_summary(None, None, None)
    assert out["shortfall"] is None
    assert "No amounts are available" in out["note"]