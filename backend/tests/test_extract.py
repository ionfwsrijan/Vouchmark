from __future__ import annotations

from src.extract import _extract_json, extraction_from_dict


def test_extract_json_strips_code_fence():
    raw = '```json\n{"a": 1}\n```'
    assert _extract_json(raw) == {"a": 1}


def test_extract_json_handles_trailing_blurb():
    raw = 'Here you go:\n{"documentType": "claim_rejection"}\nHope that helps!'
    out = _extract_json(raw)
    assert out["documentType"] == "claim_rejection"


def test_extraction_maps_unknown_category_to_other():
    data = {
        "documentType": "claim_rejection",
        "amountClaimed": "Rs. 6,82,000",
        "reasons": [
            {"text": "mystery reason", "category": "totally-novel", "confidence": 0.5}
        ],
    }
    e = extraction_from_dict(data)
    assert e.reasons[0]["category"] == "other"
    assert e.amount_claimed == 682000.0


def test_extraction_normalizes_pre_existing_category():
    data = {
        "documentType": "claim_rejection",
        "reasons": [{"text": "PED", "category": "PED"}],
    }
    e = extraction_from_dict(data)
    assert e.reasons[0]["category"] == "pre_existing"


def test_extraction_caps_context_notes():
    data = {"contextNotes": "x" * 5000}
    e = extraction_from_dict(data)
    assert len(e.context_notes) <= 600


def test_extraction_drops_empty_reasons():
    data = {
        "documentType": "claim_rejection",
        "reasons": [{"text": "   ", "category": "other"}, None],
    }
    e = extraction_from_dict(data)
    assert e.reasons == []