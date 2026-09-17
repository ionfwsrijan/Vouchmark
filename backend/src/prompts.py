"""Prompt templates for the Bedrock analysis.

The extraction prompt asks Claude to pull structured fields out of the
rejection letter and to tag each quoted reason against our taxonomy. The
letter prompt builds the human-facing counter letter in the user's language.
"""
from __future__ import annotations

CATEGORIES_HELP = """Known rejection-reason categories (pick the closest fit):

- pre_existing            pre-existing disease (PED) exclusion
- delayed_intimation      late / non-intimation of the claim
- missing_documents       missing or unsigned documents
- room_rent_cap           room-rent capping deduction
- specific_ailment_exclusion  a named ailment excluded by policy
- first_year_restriction  first-year / short waiting restriction
- cashless_refusal        cashless refused at the hospital
- maternity_wait          maternity waiting period
- late_submission         claim filed late, beyond the submission window
- daycare_not_covered     procedure not paid as day-care
- unreasonable_charges    charges seen as not reasonably incurred
- out_of_cover            treatment outside policy cover
- policy_lapsed           policy lapsed / not in force
- amount_capped           paid less than billed (partial settlement)
- other                   anything that does not fit"""

SYSTEM_PROMPT = f"""You are a meticulous document analyst inside "Vouchmark",
a tool that helps Indian health insurance policyholders understand why a
claim was rejected and whether the stated reasons are contestable.

Rules you must follow:
1. You are an INFORMATION TOOL, never a legal or financial advisor.
   Never promise a claim will be won. Use tentative language.
2. Never invent policy numbers, dates, or amounts. If a value is not in the
   document, output null.
3. Redact nothing that is in the document, but do NOT invent details.
4. Always quote the insurer's rejection reason word-for-word where available.
5. You respond with STRICT JSON only. No markdown fences, no commentary.
6. Keep plain-language text succinct and non-technical, as if explaining to
   a worried family member.

{CATEGORIES_HELP}"""

EXTRACTION_SCHEMA = """{
  "documentType": "claim_rejection" | "other" | "unknown",
  "insurer": "name of insurer if present, else null",
  "policyNumber": "string or null",
  "claimNumber": "string or null",
  "patientName": "string or null",
  "diagnosis": "the main diagnosis/condition treated, or null",
  "hospital": "string or null",
  "amountClaimed": "number in INR or null",
  "amountRejected": "number in INR or null",
  "rejectionDate": "ISO date YYYY-MM-DD or null",
  "policyHolderName": "the policy holder's name if present, else null",
  "policyStartDate": "ISO date the policy began (YYYY-MM-DD) if present, else null",
  "sumInsured": "the sum insured in INR if present, else null",
  "reasons": [
    {
      "text": "exact quote of the reason from the letter",
      "category": "closest category from the list",
      "confidence": "0.0 to 1.0 how sure you are about the category"
    }
  ],
  "contextNotes": "short note of anything else relevant (max 2 sentences)"
}"""


def user_extraction_prompt(
    language: str,
    user_context: str,
    has_document: bool = True,
) -> str:
    lang_line = (
        f"Write plain-language notes in {language} if that is not English, "
        "keeping all field values in their original language."
    )
    doc_line = (
        "Read the document below (a claim rejection / repudiation letter)."
        if has_document
        else "Read the letter text below."
    )
    return f"""{doc_line}

Extract the information as STRICT JSON matching this schema (no text outside JSON):

{EXTRACTION_SCHEMA}

Additional user-supplied context (may be absent): {user_context or "none"}
{lang_line}"""


LETTER_PROMPT_TEMPLATE = """You are the same analytical agent. Given the extracted
claim details and the reason-by-reason assessment below, write a formal but
plain counter letter a family will actually send.

Requirements:
- Language: write the ENTIRE letter in {language}.
- Address: "The Grievance Officer, [insurer]" and include policy/claim numbers.
- For each reason assessed as weak or undetermined, include one polite numbered
  paragraph explaining why the ground appears wrong or needs more evidence,
  and what document is being attached to resolve it.
- Ask for a written decision within 30 days and state that if none arrives the
  claim will be escalated to the insurer's grievance officer and IRDAI's
  grievance (Bima Bharosa) process.
- End with a signature placeholder. Keep it under 400 words.
- Do NOT guarantee an outcome. Do NOT give legal advice.

Extracted details (JSON):
{extraction}

Assessments (JSON):
{assessments}

Now write the letter as plain text (NOT inside JSON)."""