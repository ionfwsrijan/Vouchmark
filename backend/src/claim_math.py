"""Pure money/text helpers for the claim review flow.

Everything here is deterministic, round-number-safe and unit-testable with no
AWS or network: Indian-format amount rendering and a shortfall/coverage
summary that powers the "the numbers" card in the result view.
"""
from __future__ import annotations

from typing import Optional


def fmt_inr(value: float | None) -> str:
    """Render an amount in Indian digit grouping: 682000 -> '₹ 6,82,000'."""
    if value is None:
        return "[amount in ₹]"
    whole = int(round(float(value)))
    sign = "-" if whole < 0 else ""
    digits = str(abs(whole))
    if len(digits) <= 3:
        return f"{sign}₹ {digits}"
    last3 = digits[-3:]
    rest = digits[:-3]
    grouped = ""
    while len(rest) > 2:
        grouped = "," + rest[-2:] + grouped
        rest = rest[:-2]
    grouped = rest + grouped
    return f"{sign}₹ {grouped},{last3}"


def shortfall_summary(
    claimed: float | None,
    admitted: float | None,
    sum_insured: float | None,
) -> dict:
    """Describe how the numbers relate, truthfully and in plain language.

    `admitted` is what the insurer actually paid/settled for; when a claim was
    fully rejected, choose `admitted=0`. Missing numbers are simply flagged,
    never guessed.
    """
    has_claimed = claimed is not None
    has_admitted = admitted is not None
    has_si = sum_insured is not None

    shortfall = None
    if has_claimed and has_admitted:
        shortfall = claimed - admitted

    note: list[str] = []
    if has_claimed and has_admitted and shortfall is not None:
        if shortfall <= 0:
            note.append("The admitted amount covers the claimed amount in full.")
        elif shortfall >= claimed * 0.999:
            note.append("The entire claimed amount appears to have been declined.")
        else:
            note.append(
                f"An amount of {fmt_inr(shortfall)} remains unreimbursed — "
                "ask the insurer to show the line-item breakup for it."
            )
    if has_claimed and has_si and claimed > 0:
        if claimed > sum_insured:
            note.append(
                f"The claim ({fmt_inr(claimed)}) exceeds the sum insured "
                f"({fmt_inr(sum_insured)}); anything above the SI is a genuine "
                "limit unless riders/interim enhancement apply."
            )
        else:
            note.append(
                f"The claim sits inside the sum insured ({fmt_inr(sum_insured)}), "
                "so a capping reason needs explicit policy wording."
            )

    return {
        "claimed": claimed,
        "admitted": admitted,
        "sumInsured": sum_insured,
        "shortfall": shortfall,
        "note": " ".join(note) if note else "No amounts are available to compare yet.",
    }