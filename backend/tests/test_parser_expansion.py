from __future__ import annotations

from src.extract import _extract_json, extraction_from_dict


def test_extract_json_recovers_object_from_blurry_prefix():
    raw = 'Sure! Here is the result: {"reasons": [{"text": "x"}]} and that is all.'
    assert _extract_json(raw)["reasons"][0]["text"] == "x"


def test_extract_json_uses_outermost_braces():
    raw = 'prefix { "a": { "b": 1 } } suffix'
    out = _extract_json(raw)
    assert out["a"]["b"] == 1


def test_amounts_from_indian_rupee_formatting():
    e = extraction_from_dict(
        {
            "documentType": "claim_rejection",
            "amountClaimed": "₹ 6,82,000",
            "amountRejected": "682000",
        }
    )
    assert e.amount_claimed == 682000.0
    assert e.amount_rejected == 682000.0


def test_non_numeric_amounts_become_none():
    e = extraction_from_dict(
        {"documentType": "claim_rejection", "amountClaimed": "not-a-number"}
    )
    assert e.amount_claimed is None
    assert e.amount_rejected is None


def test_confidence_is_coerced_to_float():
    e = extraction_from_dict(
        {
            "documentType": "claim_rejection",
            "reasons": [{"text": "r", "category": "other", "confidence": "0.88"}],
        }
    )
    assert e.reasons[0]["confidence"] == 0.88


def test_document_type_defaults_to_unknown():
    e = extraction_from_dict({})
    assert e.document_type == "unknown"