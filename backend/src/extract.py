"""Production analysis pipeline: Bedrock extraction -> rules -> verdict.

Orchestrates a single LLM pass for structured extraction, then runs the
deterministic rules engine, then a second LLM pass for the counter letter
(with a deterministic fallback if the letter call fails).
"""
from __future__ import annotations

import json
import os
import re
from typing import Any, Optional

from . import bedrock
from .letters import build_counter_letter, short_summary_markdown
from .models import AnalysisContext, Assessment, Extraction, Verdict
from .prompts import LETTER_PROMPT_TEMPLATE, SYSTEM_PROMPT, user_extraction_prompt
from .rules import assess_all, decide_verdict, normalize_category

DISCLAIMER = (
    "This is an informational assessment generated from the text you provided. "
    "It is not legal or financial advice, it does not guarantee any outcome, and "
    "it should be reviewed by you (and, where relevant, a certified advisor) "
    "before acting."
)


class AnalysisError(Exception):
    """Raised when the pipeline cannot produce a usable extraction."""


def _to_float(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = re.sub(r"[^0-9.,]", "", str(value)).strip("., ")
    if not s:
        return None
    s = s.replace(",", "")
    try:
        return float(s)
    except ValueError:
        return None


def _strip_code_fence(raw: str) -> str:
    raw = (raw or "").strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1] if raw.count("```") >= 2 else raw[3:]
        # drop trailing comment marks occasionally hallucinated
        raw = raw.split("```")[0]
    return raw.strip()


def _extract_json(raw: str, attempts: int = 2) -> dict:
    """Parse a JSON object out of a model response, retrying once on fix."""
    candidate = _strip_code_fence(raw)
    for _ in range(attempts):
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            start = candidate.find("{")
            end = candidate.rfind("}")
            if start != -1 and end > start:
                try:
                    return json.loads(candidate[start : end + 1])
                except json.JSONDecodeError:
                    pass
            if attempts == 2:  # final attempt: second call with repair instruction
                break
            raise AnalysisError("Model did not return parseable JSON.")
    raise AnalysisError("The model response could not be parsed after retry.")


def extraction_from_dict(data: dict) -> Extraction:
    reasons_raw = data.get("reasons") or []
    reasons: list[dict] = []
    for r in reasons_raw:
        if not isinstance(r, dict):
            continue
        text = str(r.get("text") or "").strip()
        if not text:
            continue
        reasons.append({
            "text": text,
            "category": normalize_category(str(r.get("category") or "other")),
            "confidence": float(r.get("confidence") or 0.5),
        })

    return Extraction(
        document_type=str(data.get("documentType") or "unknown"),
        insurer=_str_or_none(data.get("insurer")),
        policy_number=_str_or_none(data.get("policyNumber")),
        claim_number=_str_or_none(data.get("claimNumber")),
        patient_name=_str_or_none(data.get("patientName")),
        diagnosis=_str_or_none(data.get("diagnosis")),
        hospital=_str_or_none(data.get("hospital")),
        amount_claimed=_to_float(data.get("amountClaimed")),
        amount_rejected=_to_float(data.get("amountRejected")),
        rejection_date=_str_or_none(data.get("rejectionDate")),
        reasons=reasons,
        context_notes=str(data.get("contextNotes") or "")[:600],
    )


def _str_or_none(value: Any) -> Optional[str]:
    if value is None:
        return None
    s = str(value).strip()
    return s or None


def _lang(language: str) -> str:
    return (language or "English").strip() or "English"


def run_analysis(
    *,
    language: str,
    context: AnalysisContext,
    document_b64: Optional[str] = None,
    mime: str = "",
    text: str = "",
) -> dict:
    """Run the full production pipeline and return a public payload dict."""
    lang = _lang(language)
    user_ctx = json.dumps({
        "policy_years": context.policy_years,
        "diagnosis_age_years": context.diagnosis_age_years,
        "amount_claimed": context.amount_claimed,
        "amount_rejected": context.amount_rejected,
    }, ensure_ascii=False)

    extraction_raw = invoke_extraction(
        language=lang,
        user_context=user_ctx,
        document_b64=document_b64,
        mime=mime,
        text=text,
    )
    extraction = extraction_from_dict(extraction_raw)
    if not extraction.reasons and extraction.document_type in ("other", "unknown"):
        raise AnalysisError(
            "This document does not look like a claim rejection letter and no "
            "rejection reasons could be extracted. Please upload the rejection "
            "letter itself (or paste its exact wording)."
        )

    assessments = assess_all(extraction.reasons, context)
    verdict = decide_verdict(assessments, context)
    assessment_public = [a.to_public() for a in assessments]

    letter = _letter_with_fallback(extraction, assessment_public, context, lang)

    return _payload(
        extraction=extraction,
        assessments=assessment_public,
        verdict=verdict,
        letter=letter,
        language=lang,
        generated_via="bedrock",
        meta={
            "modelId": bedrock.default_model_id(),
            "guardrail": bool(bedrock.guardrails_config()),
        },
    )


def invoke_extraction(
    *,
    language: str,
    user_context: str,
    document_b64: Optional[str] = None,
    mime: str = "",
    text: str = "",
) -> dict:
    prompt = user_extraction_prompt(
        language=language,
        user_context=user_context,
        has_document=bool(document_b64),
    )
    system_text = SYSTEM_PROMPT
    if text:
        prompt = f"{prompt}\n\nLetter text:\n{text}"
    try:
        raw = bedrock.invoke_converse(
            system=system_text,
            user_text=prompt,
            document_b64=document_b64,
            mime=mime,
        )
        return _extract_json(raw)
    except AnalysisError:
        raise
    except Exception as exc:
        raise AnalysisError(_friendly_bedrock_error(exc)) from exc


def _friendly_bedrock_error(exc: Exception) -> str:
    if bedrock.guardrail_blocked(exc):
        return (
            "The safety guardrail blocked this request. If you believe this is an "
            "error, simplify the document text and try again."
        )
    return f"{exc.__class__.__name__}: {str(exc)[:240]}"


def _letter_with_fallback(
    extraction: Extraction,
    assessments: list[dict],
    context: AnalysisContext,
    lang: str,
) -> str:
    extraction_public = extraction.to_public()
    try:
        raw = bedrock.invoke_converse(
            system="",
            user_text=LETTER_PROMPT_TEMPLATE.format(
                language=lang,
                extraction=json.dumps(extraction_public, ensure_ascii=False),
                assessments=json.dumps(assessments, ensure_ascii=False),
            ),
            max_tokens=1600,
        )
        letter = (raw or "").strip()
        if letter:
            return letter
    except Exception:
        pass  # deterministic fallback below
    return build_counter_letter(extraction_public, assessments, context)


def _payload(
    *,
    extraction: Extraction,
    assessments: list[dict],
    verdict: Verdict,
    letter: str,
    language: str,
    generated_via: str,
    meta: dict,
) -> dict:
    return {
        "ok": True,
        "analysis": {
            "extraction": extraction.to_public(),
            "assessments": assessments,
            "verdict": verdict.to_public(),
            "letter": letter,
            "markdownSummary": short_summary_markdown(
                extraction.to_public(), assessments, verdict.to_public()
            ),
            "language": language,
            "generatedVia": generated_via,
            "meta": meta,
            "disclaimer": DISCLAIMER,
        },
    }


def demo_enabled() -> bool:
    return os.environ.get("DEMO_MODE", "").lower() in ("1", "true", "yes")