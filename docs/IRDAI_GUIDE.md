# The IRDAI grounding guide

> Informational overview of the Indian insurance rules the rulebook leans on.
> Regulations change and policies vary — this is *direction*, not advice.
> Confirm the current IRDAI circulars and your own policy wording before
> relying on anything here.

## What this document is

Vouchmark's `rules.py` scores each quoted rejection reason against a plain
rulebook. That rulebook is a distilled, hedged version of how Indian health
insurance behaves under IRDAI's regulatory frame. This guide explains *why*
each category is treated the way it is, so a judge (or a family member) can
follow the reasoning.

## The category map

| Rulebook category | Why it's treated this way |
|---|---|
| `pre_existing` | A disease is "pre-existing" only if the condition/symptoms existed **before** the policy began **and** the exclusion sits inside the PED waiting period. IRDAI's earlier health regulations capped the norm at up to **48 months** from inception. Conditions first diagnosed in cover, after the window, are not pre-existing. |
| `delayed_intimation` | Intimation is a **procedural** duty, not a coverage test. IRDAI's own treatment of late intimation keeps the substantive claim alive — the insurer may ask *why* it was late, not simply repudiate a genuine claim on that alone. |
| `missing_documents` | A documents ground is **curable**, not terminal. The claim is pending, not dead. The insurer is required to give a consumer a clear checklist. |
| `room_rent_cap` | Caps are a **contractual** term from the policy schedule. The dispute is usually the *math*: whether the deduction was applied only to the excess room rent or proportionally across the bill per the policy's own formula. |
| `specific_ailment_exclusion` | A named ailment can be excluded only if it is **written into the policy** the consumer received. Ambiguous exclusions are read against the drafter (the insurer). |
| `first_year_restriction` | Short/first-year waiting windows are normal; the question is whether treatment fell inside a listed window and whether an **emergency** exception applied. |
| `cashless_refusal` | Cashless refusal ≠ claim rejection. Reimbursement remains available; the insurer must give the refusal reason **in writing**. |
| `maternity_wait` | Maternity cover has its own waiting window, printed on the schedule. Compare dates before arguing. |
| `late_submission` | A genuine claim filed late with a credible explanation is usually **re-examined** — ask for condonation in writing. |
| `daycare_not_covered` | Day-care coverage follows the policy's list and the medical necessity of an overnight stay. Ask for the excluding clause. |
| `unreasonable_charges` | Disallowed "excess" charges must be explained **line-item**, and can be tested against the hospital's package rate card. |
| `out_of_cover` | If the treatment category is genuinely outside the cover page, the rejection is likely valid — but appeal the *classification* with a medical-necessity note where it feels wrong. |
| `policy_lapsed` | Lapse is real only if the premium is genuinely unpaid outside the grace period. If premiums were *still collected* after the lapse date, the lapse is contestable. |
| `amount_capped` | A partial settlement is a **reduction**, and the insurer must show the breakup. Each disallowed line is individually testable. |

## The timelines people argue about

These are the norms commonly cited — always confirm the current circular:

- **Intimation** of a health claim is typically expected "as soon as
  possible" and in many policies within 15 days of hospitalization (longer in
  genuine difficulty).
- **Claim processing**: insurers are expected to settle non-medical claims
  within about 15 days and medical claims within 30 days of receiving all
  required documents, and to extend to ~45 days where an investigation is
  genuinely needed. Delay beyond that usually starts triggering interest.
- **Written decision**: a rejection should come with the *reasons* and the
  policy reference quoted.

## The grievance arc (top to bottom)

1. **The insurer's grievance / claims officer** — send the counter letter by
   tracked courier *and* email, ask for written acknowledgment and a written
   decision within 30 days.
2. **The insurer's Grievance Redressal Officer (GCO)** — every insurer must
   maintain one; state plainly that you're escalating to the GCO.
3. **IRDAI's Bima Bharosa portal** — the regulator's consolidated grievance
   system for insurers; behind `bimabharosa.irdai.gov.in`.
4. **The Insurance Ombudsman** — an independent, binding-arbitration-style
   forum. Generally you file **within 1 year** of the insurer's final reply
   (or of repudiation), and the award is capped (typical health-claim
   threshold is in the low lakhs — confirm the current award limit). Keep
   every document: policy, letter, bills, courier receipts, replies.

## How this shapes Vouchmark's output

- Weak grounds → the letter contests each one and attaches a matching evidence
  list.
- Undetermined grounds → the letter asks for a written checklist and commits
  to resubmitting; it does **not** claim victory.
- Strong grounds → the letter is replaced by "confirm this before accepting",
  because a genuine lapse or outside-cover condition is worth verifying, not
  shouting at.

## Sources of truth when you go deeper

- IRDAI **Health Insurance Regulations** and their amendments (waiting
  periods, PED windows, portability).
- Your **own policy schedule** and the signed policy document — the contract
  governs.
- Current IRDAI **circulars** on claim turnaround, grievance handlers
  (GCO/CPGRMS/Bima Bharosa), and Ombudsman limits — these move.