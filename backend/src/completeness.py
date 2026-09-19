"""Input-completeness help: what a reply letter needs, and what is missing.

Checks the extracted fields against the fields a structured dispute actually
needs. Exists so the app tells a user *what to gather before they send a
letter*, rather than assuming the letter is complete. Deterministic.
"""
from __future__ import annotations

from models import Extraction

# Fields whose absence should stop a user from sending the reply cold.
CRITICAL_FIELDS: list[tuple[str, str]] = [
    ("policy_number", "your policy number"),
    ("claim_number", "the claim number"),
    ("policy_holder_name", "the policy holder's name"),
    ("rejection_date", "the date of the rejection letter"),
]

# Fields that make the reply stronger when present.
OPTIONAL_FIELDS: list[tuple[str, str]] = [
    ("diagnosis", "the diagnosed condition"),
    ("hospital", "the hospital name"),
    ("amount_claimed", "the amount claimed"),
    ("amount_rejected", "the amount rejected"),
    ("policy_start_date", "when the policy started"),
    ("sum_insured", "the sum insured"),
]


def _missing(extraction: Extraction) -> list[str]:
    out: list[str] = []
    for field, _label in CRITICAL_FIELDS + OPTIONAL_FIELDS:
        value = getattr(extraction, field)
        if value is None or (isinstance(value, str) and not value.strip()):
            out.append(field)
    return out


def preparation(extraction: Extraction) -> dict:
    """Return {"critical": [..], "optional": [..]} field names to gather."""
    missing = _missing(extraction)
    critical = [f for f, _ in CRITICAL_FIELDS if f in missing]
    optional = [f for f, _ in OPTIONAL_FIELDS if f in missing]

    label_of = {f: label for f, label in CRITICAL_FIELDS + OPTIONAL_FIELDS}
    quoted = ", ".join(f'"{label_of[f]}"' for f in missing) if missing else "nothing"

    note = (
        "Before sending the draft, gather "
        + quoted
        + (" — fill these into the fields, or the letter will carry placeholders." if missing else "")
    )

    return {"critical": critical, "optional": optional, "note": note}