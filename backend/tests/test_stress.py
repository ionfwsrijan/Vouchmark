"""Stress tests: the pipeline must survive ugly, messy, ambiguous input.

Motivation: the demo samples are clean. Real rejection letters are faxed,
smudged, full of typos, and sometimes ambiguous. These tests prove the
rules engine and the HTTP handler keep producing a usable result when the
input is a mess — not just when the fixture is tidy.
"""
from __future__ import annotations

import json
import os

from src import analyze
from src.demo import demo_analysis
from src.extract import extraction_from_dict
from src.rules import assess_all, decide_verdict


MESSY_LETTER = """FAX TRANSMISSION 09:12 AM TO ADDRESS OF THE INSURED FROM CLAIMS DEPT
---- EASTCOAST GERNERAL INSURANCE CO LTD ---- (Cla ims Divn, Chennai)
POLICY NO: ECI/HLT/2019/88452  CLAIM NO: 88452/CLM/0926/55318
mr. s. venkateshwaran, GOVT APOLLO ANYTIME HOSPITAL, chnnai, 14-08-2026 to 19-08-2026
"CORONARY ANGIOGRAM + PCGI w stnt inplantation, hypertnsion".
CLaimed Rs 384000/- only (three lakh eighty four thousand). Paid 0.
REJECT the cliam on the following grouds:
 1 the ailment treatd is PRE-EXISTING DISEASes and the same has NOT been
   disclosed AT THE TIME of incepton of the policy - condition no 6 (b)
 2 intimatation of the claim was not furuished within the stipulated
   24 hours o f hospitlization. no intimation recvd from yu side.
 3 the treatg surgeon's case papers for the ANGIOPLASTY etc. have not
   been recd from the hospitl inspite of repeated remdrs — the claim is
   be ing HELD PENDING till subm is sion of the same.
u may send evidnce to the sr. claims officer within 30 days.
regrets & yers faithfully, Senior Claims Officer (illegible signature)
EASTCOAST GENERAL INSURANCE CO LTD"""


def test_messy_letter_through_the_handler_demo_mode():
    """Pasting an ugly letter must still produce a full, valid analysis."""
    os.environ["DEMO_MODE"] = "1"
    event = {
        "httpMethod": "POST",
        "resource": "/analyze",
        "body": json.dumps({"text": MESSY_LETTER, "language": "english"}),
        "pathParameters": None,
        "queryStringParameters": None,
    }
    out = analyze.handle_analyze(event)
    assert out["statusCode"] == 200, out.get("body")
    body = json.loads(out["body"])
    assert body["ok"] is True
    a = body["analysis"]
    assert len(a["assessments"]) >= 1
    assert a["verdict"]["label"] in ("LIKELY_INVALID", "LIKELY_VALID", "NEEDS_INPUT")
    assert len(a["letter"]) > 200


def test_rules_survive_degenerate_reasons():
    """Unknown/manhandled categories and empty text must not crash the engine."""
    messy_reasons = [
        {"text": "", "category": "pre_existing", "confidence": 0.1},
        {"text": None, "category": "PRE-EXISTING DISEASE", "confidence": None},
        {
            "text": "gibberish ......... 8=====D @@@##",
            "category": "economic_loss",
            "confidence": -0.5,
        },
        {"text": "x" * 600, "category": "missing_documents", "confidence": 1.01},
    ]
    extraction = extraction_from_dict({"reasons": messy_reasons})
    assessments = assess_all(extraction.reasons, None)
    assert assessments
    for a in assessments:
        assert a.grounds_strength in ("weak", "strong", "undetermined")
        assert a.category  # normalized — never empty
        assert a.label
    verdict = decide_verdict(assessments, None)
    assert verdict.label in ("LIKELY_INVALID", "LIKELY_VALID", "NEEDS_INPUT")
    assert 0 <= verdict.fight_score <= 100


def test_no_verdict_prompt_when_everything_is_unknown():
    """A letter whose reasons are all unreadable must degrade to needs_input."""
    out = demo_analysis()
    # Simulate OCR that recognised a rejection but no usable reason wording:
    gibberish = extraction_from_dict(
        {"reasons": [{"text": "gntq", "category": "other", "confidence": 0.4}]}
    )
    assessments = assess_all(gibberish.reasons, None)
    verdict = decide_verdict(assessments, None)
    assert verdict.label in ("LIKELY_INVALID", "LIKELY_VALID", "NEEDS_INPUT")
    assert verdict.summary.strip()