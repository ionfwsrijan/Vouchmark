"""Shared data shapes for the claim-analysis pipeline.

Everything here is pure data — no AWS imports — so the module can be unit
tested on a laptop with no account attached.
"""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any, Optional


# ---------------------------------------------------------------------------
# Analysis context (supplied by the user / frontend, optional)
# ---------------------------------------------------------------------------
@dataclass
class AnalysisContext:
    policy_years: Optional[float] = None     # years since policy inception
    diagnosis_age_years: Optional[float] = None  # years between diagnosis and policy start
    amount_claimed: Optional[float] = None
    amount_rejected: Optional[float] = None
    language: str = "English"

    @classmethod
    def from_dict(cls, raw: Any) -> "AnalysisContext":
        if not isinstance(raw, dict):
            return cls()
        def _num(key: str) -> Optional[float]:
            v = raw.get(key)
            try:
                if v is None or v == "":
                    return None
                return float(v)
            except (TypeError, ValueError):
                return None
        return cls(
            policy_years=_num("policyYears"),
            diagnosis_age_years=_num("diagnosisAgeYears"),
            amount_claimed=_num("amountClaimed"),
            amount_rejected=_num("amountRejected"),
            language=str(raw.get("language") or "English"),
        )


# ---------------------------------------------------------------------------
# LLM extraction result
# ---------------------------------------------------------------------------
@dataclass
class Extraction:
    document_type: str = "unknown"
    insurer: Optional[str] = None
    policy_number: Optional[str] = None
    claim_number: Optional[str] = None
    patient_name: Optional[str] = None
    diagnosis: Optional[str] = None
    hospital: Optional[str] = None
    amount_claimed: Optional[float] = None
    amount_rejected: Optional[float] = None
    rejection_date: Optional[str] = None
    policy_start_date: Optional[str] = None
    sum_insured: Optional[float] = None
    policy_holder_name: Optional[str] = None
    reasons: list[dict] = field(default_factory=list)  # [{text, category, confidence}]
    context_notes: str = ""

    def to_public(self) -> dict:
        d = asdict(self)
        # Cap the amount of unstructured text we echo back to the browser.
        d["context_notes"] = (d.get("context_notes") or "")[:600]
        return d


# ---------------------------------------------------------------------------
# Rule assessment
# ---------------------------------------------------------------------------
@dataclass
class Assessment:
    category: str
    label: str
    grounds_strength: str  # "weak" | "strong" | "undetermined"
    why: str
    evidence: list[str]
    action_guide: str = ""
    question: str = ""

    @property
    def is_weak(self) -> bool:
        return self.grounds_strength == "weak"

    def to_public(self) -> dict:
        return asdict(self)


@dataclass
class Verdict:
    label: str          # "LIKELY_INVALID" | "LIKELY_VALID" | "NEEDS_INPUT"
    fight_score: int    # 0-100
    headline: str
    summary: str
    actions: list[str]
    verification_context: dict = field(default_factory=dict)

    def to_public(self) -> dict:
        return asdict(self)


def reason_tag(reason: dict) -> str:
    return str(reason.get("text") or "").strip()