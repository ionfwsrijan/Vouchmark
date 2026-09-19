// The plain-language rulebook behind the scoring engine.
//
// Mirrors backend/src/rules.py (category ids + default strength) and
// docs/IRDAI_GUIDE.md (why each ground is treated the way it is).
// Content is educational; it never overrides what the engine decides for a
// specific letter, because context changes the verdict.

export type Strength = "weak" | "undetermined" | "strong";

export interface Ground {
  id: string;
  label: string;
  default: Strength;
  why: string;
  move: string;
}

export const STRENGTH_LABELS: Record<Strength, string> = {
  weak: "Often contestable",
  undetermined: "Facts decide it",
  strong: "Looks valid on its face",
};

export const GROUNDS: Ground[] = [
  {
    id: "pre_existing",
    label: "Pre-existing disease (PED) exclusion",
    default: "undetermined",
    why:
      "A disease counts as pre-existing only if it was diagnosed (or its signs "
      + "were present) before the policy began AND inside the PED waiting "
      + "period, typically capped near 48 months from inception under IRDAI's "
      + "frame. A condition first diagnosed during cover, after the window, is "
      + "not pre-existing.",
    move:
      "Attach the first-diagnosis discharge summary and any older reports to "
      + "prove when the condition actually appeared; if the policy already ran "
      + "past the waiting period, say so and ask which clause excludes you.",
  },
  {
    id: "delayed_intimation",
    label: "Late / non-intimation",
    default: "weak",
    why:
      "Intimation is a procedural duty, not a coverage test. IRDAI's own "
      + "treatment of late intimation keeps a genuine claim alive — the insurer "
      + "may ask why it was late, not repudiate the claim on that alone.",
    move:
      "Write a short reason for the delay (emergency, surgery, family crisis) "
      + "with any call or email reference, and ask the insurer to name the "
      + "exact clause they rely on.",
  },
  {
    id: "missing_documents",
    label: "Missing or unsigned documents",
    default: "undetermined",
    why:
      "This is a curable reason: the claim is not dead, it is waiting for "
      + "papers. The insurer must give you a clear checklist of what is short.",
    move:
      "Ask for the missing checklist in writing, resubmit by tracked courier "
      + "and email, and keep every receipt.",
  },
  {
    id: "room_rent_cap",
    label: "Room rent capping",
    default: "undetermined",
    why:
      "The cap is a contractual term from the policy schedule. The dispute is "
      + "usually the math: whether the deduction was applied only to the excess "
      + "room rent or proportionally across the whole bill.",
    move:
      "Compare the settlement breakup line-by-line against the room-rent cap on "
      + "your schedule; if the deduction overreaches, dispute the math in "
      + "writing.",
  },
  {
    id: "specific_ailment_exclusion",
    label: "Specific ailment exclusion",
    default: "undetermined",
    why:
      "A named ailment can be excluded only if it is written into the policy "
      + "document you received at inception or renewal. Ambiguous exclusions are "
      + "generally read against the drafter — the insurer.",
    move:
      "Check that the exclusion appears verbatim in the signed policy you "
      + "received; if it is vague, ask for the exact clause.",
  },
  {
    id: "first_year_restriction",
    label: "First-year / short waiting restriction",
    default: "undetermined",
    why:
      "Short waiting windows in the first 30–90 days or first policy year are "
      + "normal. The question is whether the treatment fell inside a listed "
      + "window — and whether an emergency-admission exception applied.",
    move:
      "Check the waiting-period schedule on your policy pages; ask the insurer "
      + "to point to the exact schedule line, and attach any emergency "
      + "certificate if relevant.",
  },
  {
    id: "cashless_refusal",
    label: "Cashless refused at the hospital",
    default: "undetermined",
    why:
      "Cashless refusal is not a claim rejection. Reimbursement stays open, and "
      + "the insurer must give the refusal reason in writing.",
    move:
      "Get the refusal reason in writing, then file for reimbursement after "
      + "discharge with full bills and the discharge summary.",
  },
  {
    id: "maternity_wait",
    label: "Maternity waiting period",
    default: "undetermined",
    why:
      "Maternity cover runs on its own waiting period printed on the policy "
      + "schedule. The argument is purely about comparing dates.",
    move:
      "Compare the admission or delivery date against the printed window; if it "
      + "falls after it, attach the delivery confirmation and dispute in writing.",
  },
  {
    id: "late_submission",
    label: "Claim filed late (beyond the submission window)",
    default: "weak",
    why:
      "A genuine claim filed late with a credible explanation is usually "
      + "re-examined. Delay alone need not be fatal; condonation in writing is "
      + "the normal ask.",
    move:
      "Give a plain, documented reason for the late filing and ask for "
      + "condonation in writing.",
  },
  {
    id: "daycare_not_covered",
    label: "Procedure not paid as day-care",
    default: "undetermined",
    why:
      "Whether a procedure is payable as day-care depends on the policy's own "
      + "list or the medical requirement for an overnight stay.",
    move:
      "Ask for the policy clause that excludes this procedure, and attach the "
      + "doctor's note that an overnight stay was medically required.",
  },
  {
    id: "unreasonable_charges",
    label: "Charges seen as 'not reasonably incurred'",
    default: "undetermined",
    why:
      "Disallowed 'excess' charges must be explained line-item and can be "
      + "tested against the hospital's package rate card.",
    move:
      "Request a line-item explanation and compare each disputed charge against "
      + "the hospital's rate card.",
  },
  {
    id: "out_of_cover",
    label: "Treatment outside policy cover",
    default: "strong",
    why:
      "If the treatment category is genuinely outside the cover page, the "
      + "rejection may well be valid.",
    move:
      "Confirm the treatment against the cover page before pushing; if it still "
      + "feels wrong, appeal the classification with the doctor's medical-"
      + "necessity note.",
  },
  {
    id: "policy_lapsed",
    label: "Policy lapsed / not in force",
    default: "strong",
    why:
      "Lapse is real only when the premium is genuinely unpaid outside the "
      + "grace period. If premiums were still collected after the lapse date, "
      + "the lapse itself is contestable.",
    move:
      "Verify against premium receipts and auto-debit statements; if money was "
      + "still being collected, contest the lapse in writing.",
  },
  {
    id: "amount_capped",
    label: "Paid less than billed (partial settlement)",
    default: "undetermined",
    why:
      "A partial settlement is a reduction, not a rejection — and the insurer "
      + "must produce the breakup. Every disallowed line is individually "
      + "testable.",
    move:
      "Ask for the signed settlement breakup and check each disallowed line "
      + "against the policy, disputing item by item.",
  },
];

export const TIMELINES: Array<[string, string]> = [
  [
    "Intimation",
    "Expected 'as soon as possible'; many policies say within 15 days of "
    + "hospitalization, longer in genuine difficulty.",
  ],
  [
    "Claim processing",
    "Non-medical claims around 15 days, medical claims around 30 days from all "
    + "documents, ~45 days where an investigation is genuinely needed.",
  ],
  [
    "Written decision",
    "A rejection should come with the reasons and the policy reference quoted.",
  ],
];

export const GRIEVANCE_ARC: Array<[string, string]> = [
  [
    "The insurer's claims officer",
    "Send the counter letter by tracked courier and email; ask for written "
    + "acknowledgment and a decision within 30 days.",
  ],
  [
    "Grievance Redressal Officer (GCO)",
    "Every insurer must maintain one — say plainly you are escalating to the GCO.",
  ],
  [
    "IRDAI Bima Bharosa",
    "The regulator's consolidated grievance portal (bimabharosa.irdai.gov.in).",
  ],
  [
    "The Insurance Ombudsman",
    "Independent, binding-arbitration style. File within about 1 year of the "
    + "final reply; the award is capped, so check the current limit. Keep every "
    + "document.",
  ],
];