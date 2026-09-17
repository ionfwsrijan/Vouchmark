"""Demo / offline mode.

Runs the exact same deterministic rules engine and letter builder as the
production path, but with a realistic fixture instead of a Bedrock call.
This is what powers:
  * the ReadMe quick-start (no AWS account needed)
  * SAM local / Build-It-track demos
  * the fallback if Bedrock model access is still being granted on Day 1
"""
from __future__ import annotations

from .extract import DISCLAIMER, extraction_from_dict
from .letters import build_counter_letter, short_summary_markdown
from .models import AnalysisContext
from .rules import assess_all, decide_verdict


def demo_extraction_raw() -> dict:
    return {
        "documentType": "claim_rejection",
        "insurer": "Example Health & Allied Insurance (sample redacted letter)",
        "policyNumber": "EHAI/FLA/21/ID-0012354",
        "claimNumber": "CLM20260828-00741",
        "patientName": "[insured name]",
        "diagnosis": "Acute myocardial infarction (heart attack) with hypertension",
        "hospital": "Sunrise Multispecialty Hospital",
        "amountClaimed": 682000.0,
        "amountRejected": 682000.0,
        "rejectionDate": "2026-09-02",
        "reasons": [
            {
                "text": (
                    "The ailment treated is a pre-existing disease and the same was "
                    "not disclosed at the time of inception of the policy."
                ),
                "category": "pre_existing",
                "confidence": 0.92,
            },
            {
                "text": (
                    "Intimation of the claim was not provided within the stipulated "
                    "period of 24 hours of hospitalization."
                ),
                "category": "delayed_intimation",
                "confidence": 0.85,
            },
            {
                "text": (
                    "Treating surgeon's case papers have not been received from the "
                    "hospital; the claim is being held pending."
                ),
                "category": "missing_documents",
                "confidence": 0.7,
            },
        ],
        "contextNotes": "Sample letter used for offline and demo evaluation.",
    }


def demo_analysis(
    *,
    language: str = "English",
    context: AnalysisContext = None,
    pasted_text: str = "",
) -> dict:
    ctx = context or AnalysisContext()
    raw = demo_extraction_raw()
    if pasted_text and pasted_text.strip():
        raw["contextNotes"] = (
            pasted_text.strip()[:600] + " | (pasted text received instead of a file)"
        )
    extraction = extraction_from_dict(raw)
    assessments = assess_all(extraction.reasons, ctx)
    assessment_public = [a.to_public() for a in assessments]
    verdict = decide_verdict(assessments, ctx)
    letter = build_counter_letter(extraction.to_public(), assessment_public, ctx)
    return {
        "ok": True,
        "analysis": {
            "extraction": extraction.to_public(),
            "assessments": assessment_public,
            "verdict": verdict.to_public(),
            "letter": letter,
            "markdownSummary": short_summary_markdown(
                extraction.to_public(), assessment_public, verdict.to_public()
            ),
            "language": language,
            "generatedVia": "demo",
            "meta": {"modelId": "DEMO_MODE", "guardrail": False},
            "disclaimer": DISCLAIMER,
        },
    }