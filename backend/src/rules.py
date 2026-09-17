"""The rejection-reason taxonomy + rules engine.

This is the domain heart of the product: it takes the reasons an insurer
quoted on a rejection letter and classifies how fightable each ground is,
using plain common knowledge about how Indian health policies actually
behave. Everything here is deterministic and testable — no network, no LLM.

Every statement is written to be *informatable*, never legal or financial
advice. The Bedrock Guardrail (see scripts/) reinforces that boundary.
"""
from __future__ import annotations

from .models import AnalysisContext, Assessment, Verdict

# A "weak" ground means the insurer's reason likely does *not* hold.
# A "strong" ground means the reason looks valid on its face.
RULE_BOOK: dict[str, dict] = {
    "pre_existing": {
        "label": "Pre-existing disease (PED) exclusion",
        "default": "undetermined",
        "line": (
            "A disease can be excluded as pre-existing only if it was diagnosed "
            "(or its symptoms were present) before the policy started, and it falls "
            "inside the PED waiting period, which IRDAI norms typically cap at up to "
            "48 months. A condition first diagnosed after that window is not "
            "pre-existing."
        ),
        "evidence": [
            "Policy schedule page showing the start date",
            "Hospital discharge summary with the FIRST diagnosis date",
            "Doctor's certificate / old reports showing when the condition appeared",
            "Your policy's PED waiting-period wording",
        ],
    },
    "delayed_intimation": {
        "label": "Late / non-intimation",
        "default": "weak",
        "line": (
            "Late intimation by itself is rarely a valid ground to reject a genuine "
            "claim. Insurers can ask for a written reason for the delay; a claim that "
            "is otherwise admissible should not be repudiated for intimation alone "
            "(IRDAI's own regulations treat intimation as a procedural duty)."
        ),
        "evidence": [
            "A short written explanation for the delay (family emergency, surgery)",
            "Claim form acknowledging the intimation date",
            "Any correspondence showing you informed them (email / call reference)",
        ],
    },
    "missing_documents": {
        "label": "Missing or unsigned documents",
        "default": "undetermined",
        "line": (
            "This is a curable reason: the claim is not dead, it is waiting for papers. "
            "Ask the insurer for the exact checklist in writing and resubmit with a "
            "tracked courier."
        ),
        "evidence": [
            "Written checklist from the insurer of exactly what is missing",
            "Hospital bills, discharge summary, lab reports",
            "Attending doctor's certificate",
        ],
    },
    "room_rent_cap": {
        "label": "Room rent capping",
        "default": "undetermined",
        "line": (
            "Room-rent caps mean any charge above the cap is payable by you, and in "
            "some policies the extra is deducted proportionally across the whole bill. "
            "Check the cap on the policy schedule and how the deduction was applied "
            "to each line item."
        ),
        "evidence": [
            "Itemized hospital bill showing the room-rent line",
            "Policy schedule with the cap wording",
            "The settlement letter showing the math",
        ],
    },
    "specific_ailment_exclusion": {
        "label": "Specific ailment exclusion",
        "default": "undetermined",
        "line": (
            "A specific ailment can be excluded only if the exclusion was clearly "
            "written into the policy document you received at inception or at renewal. "
            "Ambiguous exclusions are generally read in the consumer's favour."
        ),
        "evidence": [
            "Your copy of the signed policy document",
            "Renewal advisories / annexures",
            "Hospital notes on the treated condition",
        ],
    },
    "first_year_restriction": {
        "label": "First-year / short waiting restriction",
        "default": "undetermined",
        "line": (
            "Many policies limit cover in the first 30–90 days or first policy year. "
            "Check whether the treatment falls inside that schedule, and whether an "
            "emergency admission exception applies."
        ),
        "evidence": [
            "Policy wording's waiting-period schedule",
            "Hospital emergency-admission certificate (if applicable)",
        ],
    },
    "cashless_refusal": {
        "label": "Cashless refused at the hospital",
        "default": "undetermined",
        "line": (
            "A cashless refusal is not a claim rejection — you can still claim "
            "reimbursement after discharge. Get the refusal reason in writing and "
            "compare it against your policy before deciding what to do."
        ),
        "evidence": [
            "The written cashless refusal reason",
            "Hospital discharge summary and full bills",
            "Provisional or paid receipts",
        ],
    },
    "maternity_wait": {
        "label": "Maternity waiting period",
        "default": "undetermined",
        "line": (
            "Maternity cover runs on its own waiting period (months, depending on the "
            "product). Compare the admission/delivery date against the schedule on "
            "your policy pages."
        ),
        "evidence": [
            "Policy maternity / waiting-period schedule",
            "Confirmation of expected / actual delivery date",
        ],
    },
    "late_submission": {
        "label": "Claim filed late (beyond the submission window)",
        "default": "weak",
        "line": (
            "Filing a claim past the deadline can produce a rejection, but genuine "
            "claims with a reasonable explanation are frequently admitted or re-"
            "examined. Ask for condonation in writing while giving a plain reason "
            "for the delay."
        ),
        "evidence": [
            "Written explanation of the delay with dates",
            "Any acknowledgment the insurer gave you",
            "Claim form and medical papers",
        ],
    },
    "daycare_not_covered": {
        "label": "Procedure not paid as day-care",
        "default": "undetermined",
        "line": (
            "Whether a procedure is payable as day-care depends on the policy's "
            "day-care list or the medical requirement for an overnight stay. Ask for "
            "the policy clause that excludes this procedure."
        ),
        "evidence": [
            "Policy's day-care list page",
            "Doctor's note that an overnight stay was medically necessary",
        ],
    },
    "unreasonable_charges": {
        "label": "Charges seen as 'not reasonably incurred'",
        "default": "undetermined",
        "line": (
            "Insurers can disallow charges they consider excessive or unnecessary. "
            "You can ask for a line-item explanation and compare the disputed "
            "charges against the hospital's package rate card."
        ),
        "evidence": [
            "Itemized bills for the disputed lines",
            "Hospital package rate card",
            "Doctor's written justification for the treatment",
        ],
    },
    "out_of_cover": {
        "label": "Treatment outside policy cover",
        "default": "strong",
        "line": (
            "If the treatment category is genuinely outside what the policy covers, "
            "the rejection may be valid. Confirm against the cover page before "
            "spending time fighting."
        ),
        "evidence": [
            "Policy cover page",
            "Clinical opinion on medical necessity of the procedure",
        ],
    },
    "policy_lapsed": {
        "label": "Policy lapsed / not in force",
        "default": "strong",
        "line": (
            "If the policy lapsed for unpaid premiums and is outside the grace "
            "period, cover is genuinely off. But if premiums continued to be "
            "collected after the lapse date or you paid inside the grace period, "
            "that can be contested."
        ),
        "evidence": [
            "Premium payment receipts / auto-debit statements",
            "Renewal notices from the insurer",
        ],
    },
    "amount_capped": {
        "label": "Paid less than billed (partial settlement)",
        "default": "undetermined",
        "line": (
            "A partial payment is a reduction, not a rejection. Get the signed "
            "breakup: what was allowed, what was not allowed, and why, then check "
            "each item against the policy."
        ),
        "evidence": [
            "Final settlement letter with the breakup",
            "Itemized hospital bill",
            "Hospital certification of charges",
        ],
    },
    "other": {
        "label": "Reason not automatically recognized",
        "default": "undetermined",
        "line": (
            "This reason is not a common category. Quote it word-for-word and check "
            "it against your policy wording before responding."
        ),
        "evidence": [
            "Your policy document",
            "The exact reason quoted in the letter",
        ],
    },
}

VALID_CATEGORIES: set[str] = set(RULE_BOOK.keys())


def normalize_category(category: str) -> str:
    """Map whatever the LLM or fixtures provide back to a known category."""
    c = (category or "").strip().lower().replace(" ", "_").replace("-", "_")
    if c in VALID_CATEGORIES:
        return c
    # Fuzzy aliases
    aliases = {
        "pre_existing_disease": "pre_existing",
        "preexisting": "pre_existing",
        "pre_existing_condition": "pre_existing",
        "ped": "pre_existing",
        "late_intimation": "delayed_intimation",
        "intimation": "delayed_intimation",
        "non_intimation": "delayed_intimation",
        "not_informed": "delayed_intimation",
        "documents": "missing_documents",
        "missing_document": "missing_documents",
        "room_rent": "room_rent_cap",
        "specified_ailment": "specific_ailment_exclusion",
        "specific_disease": "specific_ailment_exclusion",
        "first_year": "first_year_restriction",
        "cashless": "cashless_refusal",
        "maternity": "maternity_wait",
        "late_submission_of_claim": "late_submission",
        "daycare": "daycare_not_covered",
        "reasonable_charges": "unreasonable_charges",
        "out_of_cover": "out_of_cover",
        "not_covered": "out_of_cover",
        "lapsed": "policy_lapsed",
        "partial": "amount_capped",
    }
    return aliases.get(c, "other")


def _decide_pre_existing(rule: dict, ctx: AnalysisContext) -> tuple[str, str]:
    """Return (grounds_strength, why) for a pre-existing reason given context."""
    base = rule["line"]
    if ctx.policy_years is None and ctx.diagnosis_age_years is None:
        return "undetermined", base + (
            " To call this one, we need to know: when was the condition FIRST "
            "diagnosed, and how long had you held the policy at that time?"
        )
    if ctx.diagnosis_age_years is not None and ctx.policy_years is not None:
        # diagnosis_age_years = years BEFORE the policy the disease existed.
        if ctx.diagnosis_age_years > 0:
            return "strong", base + (
                f" You told us the condition was present about "
                f"{ctx.diagnosis_age_years:g} years before the policy started, so "
                f"the pre-existing ground looks valid unless the waiting period had "
                f"ended before treatment."
            )
        # diagnosed at/after policy start
        if ctx.policy_years >= 4:
            return "weak", base + (
                f" You have held the policy for {ctx.policy_years:g} years — longer "
                f"than the usual 48-month PED window — and the condition was "
                f"diagnosed after the policy started. Rejecting it as pre-existing "
                f"looks like a weak ground: this is exactly the kind of decision to "
                f"contest."
            )
        return "undetermined", base + (
            f" The policy is {ctx.policy_years:g} years old. If the condition was "
            f"first diagnosed after the policy started and the PED waiting period "
            f"(often up to 48 months) had ended, this ground is weak. Confirm the "
            f"first diagnosis date from the discharge summary."
        )
    if ctx.policy_years is not None:
        if ctx.policy_years >= 4:
            return "weak", base + (
                f" You have held the policy for {ctx.policy_years:g} years, past the "
                f"usual PED window; if the condition was diagnosed during cover, this "
                f"ground looks weak. Verify the first diagnosis date."
            )
        return "undetermined", base + (
            f" The policy is {ctx.policy_years:g} years old — still possibly inside "
            f"a PED waiting period. What matters is when the condition was FIRST "
            f"diagnosed."
        )
    return "undetermined", base


def assess_all(reasons: list[dict], ctx: AnalysisContext) -> list[Assessment]:
    """Turn raw extracted reasons into checked assessments."""
    out: list[Assessment] = []
    for reason in reasons:
        category = normalize_category(str(reason.get("category") or "other"))
        rule = RULE_BOOK[category]
        strength: str = rule["default"]
        why: str = rule["line"]

        if category == "pre_existing":
            strength, why = _decide_pre_existing(rule, ctx)

        if category == "missing_documents" and strength == "undetermined":
            why += " This usually ends in a successful resubmission — the claim is alive."
        if category == "cashless_refusal" and strength == "undetermined":
            why += " Keep the reimbursement route open and get the refusal in writing."

        out.append(Assessment(
            category=category,
            label=rule["label"],
            grounds_strength=strength,
            why=why,
            evidence=rule["evidence"],
            question="",
        ))
    return out


def decide_verdict(assessments: list[Assessment], ctx: AnalysisContext) -> Verdict:
    weak = [a for a in assessments if a.is_weak]
    strong = [a for a in assessments if a.grounds_strength == "strong"]
    undetermined = [a for a in assessments if a.grounds_strength == "undetermined"]

    if not assessments:
        return Verdict(
            label="NEEDS_INPUT", fight_score=0,
            headline="Not enough to go on yet",
            summary=(
                "We could not match any rejection ground. Quote the exact wording of "
                "the insurer's reason to get a useful assessment."
            ),
            actions=[
                "Getting the exact rejection wording in the letter",
                "Keeping your policy document and bills organised",
            ],
        )

    if weak:
        label = "LIKELY_INVALID"
        n = len(set(a.grounds_strength for a in assessments))
        fight_score = 78 if n == 1 else 60
        headline = f"On paper, {len(weak)} of the rejection grounds look weak"
        summary = (
            f"The insurer gave {len(assessments)} reason(s); at least "
            f"{len(weak)} of them appear contestable on the face of the letter. "
            f"That does not guarantee a win — paper that argues well usually wins "
            f"in a grievance process, not an argument. Send a structured reply, "
            f"attach the evidence, and escalate if there's no response in 30 days."
        )
        actions = [
            "Drafting and sending the counter letter (we did it below) by tracked courier and email",
            "Attaching every document listed against each reason",
            "Noting the date — if no answer in 30 days, escalate to the insurer's grievance officer, then IRDAI's Bima Bharosa portal",
        ]
    elif undetermined and not strong:
        label = "NEEDS_INPUT"
        fight_score = 40
        headline = "The case is open — it needs documents, not slogans"
        summary = (
            "None of the grounds is clearly wrong, but none is clearly right either. "
            "These are the easiest fights to move from 'undetermined' to a win or a "
            "loss: ask for a written checklist, submit what is missing, and get the "
            "insurer to commit to a written decision."
        )
        actions = [
            "Getting the insurer's exact requirements in writing",
            "Resubmitting with a tracked courier and keeping the receipt",
            "Asking for a written decision within 30 days",
        ]
    else:
        label = "LIKELY_VALID"
        fight_score = 15
        headline = "On paper, the insurer's grounds look valid"
        summary = (
            "The stated reasons match the normal, lawful ways a claim can fall "
            "outside cover (for example a genuine pre-existing disease or a lapsed "
            "policy). The best next step is to confirm the exact policy wording that "
            "supports each ground before accepting it — paperwork errors still "
            "happen in the insurer's favour."
        )
        actions = [
            "Confirming each ground against your policy schedule",
            "Asking the insurer to point to the exact clause that excludes this claim",
            "Keeping reimbursement/voucher options open if you are still paying out of pocket",
        ]

    verification = {
        "weakGrounds": [a.category for a in weak],
        "strongGrounds": [a.category for a in strong],
        "undeterminedGrounds": [a.category for a in undetermined],
    }
    return Verdict(
        label=label, fight_score=fight_score, headline=headline,
        summary=summary, actions=actions, verification_context=verification,
    )