# Privacy, data handling, and trust

Short version: **no login, no account, no advertising.** The app stores case
rows keyed to an anonymous device id so your history works, and it does not
retain the *document text* beyond the analysis you explicitly submit.

## What you send, and what happens to it

When you run a check, the browser sends:

- The **image/PDF of the rejection letter** (already downscaled client-side to
  a ≤1280px JPEG) or the **pasted text**.
- **Optional context** you typed in (policy years, amounts, diagnosis age).
- A **device id** — a single random UUID generated in `localStorage`, not an
  email, phone number, or national ID.

The letter is sent **over HTTPS** to the API (API Gateway → Lambda). The
Lambda calls **Amazon Bedrock** (Claude vision) purely to extract structured
fields and the quoted reasons. Under Amazon Bedrock's commitments, prompts and
completions are **not used to train foundation models**, and they are
processed in AWS regions governed by AWS data-protection terms.

## What gets stored

- A row per case in DynamoDB, keyed by `deviceId + caseId`, holding the
  analysis result (verdict, per-reason assessments, the generated letter) and
  a short digest for the history drawer.
- Extracted free-text notes are **truncated** before storage.
- No document binary is stored.
- The table can be given a **TTL** (`EnableTtl`/`CasesTtlDays` stack
  parameters, `CASES_TTL_DAYS` env) so old rows expire on their own.
- The local/offline demo (`DEMO_MODE`) performs **no network calls and writes
  nothing** except in-memory demo output.

Everything is scoped to the device id that *sent* it: history is listed and
reopened only for that id. There is no global inbox, no third-party analytics
script, and no advertising.

## Reasonable choices we make for you

- **Redact before you upload.** If your letter outlives its usefulness, the
  best delete is local: clear the table via TTL or regenerate the device id in
  `localStorage`. Do not upload documents that contain Aadhaar, PAN, or banking
  numbers if you can avoid it — the tool works fine on the policy/claim numbers
  and reason text alone.
- **The guardrail sits in front of the model**, blocking promised outcomes and
  legal/financial-advice formulations.
- **Model access is opt-in** via Bedrock model enablement in your region; the
  app also ships a fully deterministic `DEMO_MODE` that touches no model at all.

## What this tool is not

Vouchmark is informational software for a hackathon: it familiarises you with
your own paperwork and drafts a structured reply. It is **not** a certified
insurance advisor, and nothing it writes is **legal or financial advice**. It
never promises a claim outcome, and a real decision should be reviewed with a
certified advisor while you act on the evidence lists it produces.

If you have a concern about a case in DynamoDB, the fastest removal is to stop
sharing the device id and let TTL expire the rows — or delete the stack, which
removes the table entirely.