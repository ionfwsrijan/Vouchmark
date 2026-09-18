from src.completeness import preparation
from src.demo import demo_analysis
from src.models import Extraction
from src.rules import assess_all
from src.models import AnalysisContext


def test_assessments_carry_the_source_quote():
    assessments = assess_all(
        [{"text": "Intimation was not provided in 24 hours.", "category": "delayed_intimation"}],
        AnalysisContext(),
    )
    assert assessments[0].source_quote == "Intimation was not provided in 24 hours."
    assert assessments[0].source_quote[:180] == assessments[0].source_quote


def test_source_quote_defaults_empty():
    assessments = assess_all([{"text": "  ", "category": "other"}], AnalysisContext())
    assert assessments[0].source_quote == ""


def test_preparation_full_extraction():
    raw = demo_analysis()["analysis"]["extraction"]
    assert raw["policy_number"] and raw["claim_number"]
    out = preparation(Extraction(
        policy_number=raw["policy_number"],
        claim_number=raw["claim_number"],
        policy_holder_name=raw["policy_holder_name"],
        rejection_date=raw["rejection_date"],
        diagnosis=raw["diagnosis"],
        hospital=raw["hospital"],
        amount_claimed=raw["amount_claimed"],
    ))
    assert out["critical"] == []
    assert "sum insured" in out["note"]


def test_preparation_flags_missing_critical_fields():
    out = preparation(Extraction())
    assert set(out["critical"]) == {
        "policy_number", "claim_number", "policy_holder_name", "rejection_date",
    }
    assert "policy holder's name" in out["note"]


def test_payload_includes_numbers_and_preparation():
    payload = demo_analysis()["analysis"]
    assert payload["numbers"]["claimed"] == 682000
    assert payload["numbers"]["admitted"] == 0
    assert payload["numbers"]["shortfall"] == 682000
    assert payload["numbers"]["note"]
    assert "critical" in payload["preparation"]
    assert "note" in payload["preparation"]


def test_source_quote_reaches_the_public_payload():
    payload = demo_analysis()["analysis"]
    assessment = payload["assessments"][0]
    assert assessment["source_quote"].startswith("The ailment treated")