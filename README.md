# Vouchmark

> An insurance rejection is not a verdict. It's a claim — vouch it, then reply.

![CI](https://github.com/ionfwsrijan/Vouchmark/actions/workflows/ci.yml/badge.svg)

**Vouchmark** helps Indian families understand *why* a health-insurance
claim was rejected and whether the stated reason actually holds — then drafts a
counter letter a real person can send.

Built for the **AWS First Commit** hackathon (Bharat Builds Tour, Sept 17–20 2026)
on the **Ship It** track, with a zero-account **Build It** demo bundled in.

---

## The problem

A middle-class family gets a bill, a cashless claim is rejected for a
paper-thin reason — *“pre-existing disease”*, *“intimation not given in 24
hours”*, *“surgeon's papers awaited”* — and the family either eats a 4-lakh
rupee bill or doesn't know the appeal process exists. The insurer's staff
know the rules. The patient doesn't. That information asymmetry is the enemy.

When a rejection's stated ground is weak on its face (a condition diagnosed
*after* the PED waiting period; late intimation alone; missing documents that
are simply curable), **silence costs money**. A structured written reply is
how these get re-examined.

## What it does

1. **Reads the letter** — upload a photo/PDF or paste the text. Amazon Bedrock
   (Claude, vision) extracts the insurer's exact stated reasons plus policy
   metadata (policy/claim numbers, holder, start date, sum insured).
2. **Scores each reason** against a plain rulebook of how Indian health
   policies actually behave: `weak` (contestable), `undetermined` (curable),
   `strong` (looks valid) — with the letter's exact wording quoted back, plus
   a per-reason **action guide**.
3. **Drafts the counter letter** — with the evidence list per reason, a 30-day
   written-decision request, and the Bima Bharosa / grievance escalation path.
   It also shows **the numbers** (Indian-formatted claimed/rejected/shortfall
   vs sum insured) and a **"gather these before you reply"** checklist.
4. **Keeps a private history** of checks per device — reopen any past result,
   print it to PDF, or export the reason-by-reason CSV. No login, no account.

All output is informational, guarded so it never promises an outcome.
See [`docs/IRDAI_GUIDE.md`](docs/IRDAI_GUIDE.md) for the regulatory reasoning
and [`docs/PRIVACY.md`](docs/PRIVACY.md) for what touches the network and the
store.

## The 60-second story for judges

| Line | Why it lands |
|---|---|
| **Idea & impact** | Small, specific, financial, provable: a rejection letter where the ground is clearly weak. The tool exists *because* the knowledge is asymmetric. |
| **Built on AWS** | Bedrock vision (document → structured data), Bedrock Guardrails, Lambda, API Gateway, DynamoDB, S3 + CloudFront. Scales to zero, runs on free credits. |
| **Learning** | First Bedrock vision model, first Guardrail, first deployed URL on this stack — all four days of it. |
| **Execution** | Exactly one flow that works end-to-end *today*, with a deterministic offline twin that requires no account at all. |
| **Demo video** | Opens with an uncle's rejection photo; 20 seconds in, the app says the ground looks weak and hands back a letter. |

---

## Repository layout

```
vouchmark/
├─ backend/
│  ├─ template.yaml               # SAM stack: Lambda + API Gateway + DynamoDB + S3/CloudFront static
│  ├─ requirements.txt
│  ├─ src/                        # Python package (pure logic + lazy boto3)
│  │  ├─ analyze.py               # Lambda handler (routes, validation, errors)
│  │  ├─ extract.py               # Bedrock pipeline orchestration
│  │  ├─ bedrock.py               # Converse API wrapper + Guardrails
│  │  ├─ rules.py                 # rejection-reason taxonomy + rules engine (pure)
│  │  ├─ letters.py               # deterministic counter-letter fallback
│  │  ├─ demo.py                  # offline demo pipeline (no account)
│  │  ├─ ddb.py                   # DynamoDB persistence (best-effort)
│  │  ├─ prompts.py / models.py
│  ├─ tests/                      # 115 pytest tests, no AWS required
│  ├─ samples/letters/            # redacted sample rejection letters
│  ├─ scripts/                    # create-guardrail / deploy-backend / deploy-frontend / run-local
│  └─ tools/local_server.py       # HTTP server for the offline demo
├─ frontend/
│  ├─ src/                        # Vite + React + TypeScript SPA (21 vitest tests)
│  └─ public/config.js            # runtime-injected API URL
├─ .github/workflows/ci.yml       # pytest + typecheck + build on every push
└─ docs/                          # ARCHITECTURE, DEMO_SCRIPT, BLOG_DRAFT, IRDAI_GUIDE, PRIVACY, DEVLOG
```

---

## Depth, at a glance

| Layer | What's behind it |
|---|---|
| **Rules engine** | 15-category rejection taxonomy, alias normalisation, context-aware verdict, deterministic and fully unit-tested (`rules.py`). |
| **Pipeline** | Bedrock extraction → rules → letter, with a parsed-JSON retry, a deterministic letter fallback, and an offline demo twin that shares the exact same engine. |
| **Safety rails** | Bedrock Guardrails config, a file-signature sniffer on uploads, size/MIME/language whitelists, and structured error codes (`code` field) on every 4xx/5xx. |
| **Case store** | Per-device DynamoDB rows, full-analysis persistence, `GET /cases/{id}`, cursor pagination, optional TTL. |
| **Frontend** | Client-side image downscale, N-language output, bilingual chrome (English/Hinglish), reopen-history, print-to-PDF, CSV export, numbers card, source-quote chips, pre-reply checklist. |
| **Testing** | 118 backend pytest + 21 frontend vitest + Playwright browser e2e (demo server); `npm run build` and `tsc -b` clean; CI on GitHub Actions. |
| **Docs** | `docs/ARCHITECTURE.md`, `docs/IRDAI_GUIDE.md`, `docs/PRIVACY.md`, `docs/DEVLOG.md`, `docs/DEMO_SCRIPT.md`, `docs/BLOG_DRAFT.md`. |

---

## Quick start — offline demo (Build It track, zero AWS)

Requirements: Node 18+, Python 3.10+.

```powershell
.\dev.ps1 setup      # npm ci + pip install
.\dev.ps1 serve      # full offline demo on http://localhost:8000
```

Or step through it manually:

```powershell
cd frontend
npm install
cd ..
backend\scripts\run-local.ps1
```

Open http://localhost:8000 → *Try a sample*. Everything runs in-process:
deterministic rules + letter builder. No account, no card, no Docker.

Verify the backend logic independently (needs `py -m pip install -r backend/requirements.txt`):

```powershell
py -m pytest backend/tests -q
```

---

## Shipping it (Ship It track)

Toolbox: `aws` CLI (v2) + `aws-sam-cli` (`winget install AWS.SAM-CLI`), Node 18+.
The $100 bonus credit + weekend credits cover the ~₹2-verification account.

### Day 1 — every hour counts

1. Verify your student Builder Center profile (needed to compete).
2. Create the AWS account (~₹2), then in **Bedrock → Model access**, enable
   **Claude Sonnet 4** in `ap-south-1`. This approval is the one delay risk —
   do it first. Until it lands, `DemoMode=true` keeps the demo alive.
3. Create the guardrail (blocks promised outcomes + legal/financial advice):

```powershell
backend\scripts\create-guardrail.ps1
```

### Deploy (one time)

```powershell
# 1. backend (prints ApiUrl, CloudFrontUrl, bucket)
backend\scripts\deploy-backend.ps1 -Region ap-south-1 -AllowedOrigin "*" `
   -GuardrailId <id> -GuardrailVersion <v>

# 2. frontend (build → inject API URL → s3 sync → invalidate CloudFront)
backend\scripts\deploy-frontend.ps1 -Region ap-south-1
```

That's it — a live URL on CloudFront, API on API Gateway, table on DynamoDB.
After the first deploy, tighten CORS:

```powershell
backend\scripts\deploy-backend.ps1 -AllowedOrigin "https://<your-cloudfront-domain>"
backend\scripts\deploy-frontend.ps1
```

### Verify the deployment (no browser needed)

```powershell
backend\scripts\verify-deploy.ps1 -ApiUrl "<the ApiUrl from the deploy output>"
```

Runs health → analyze → reopen-the-saved-case in one pass and prints the
verdict + letter sizes. Works against the local demo server too.

### Secrets / pins

- Model id is a stack parameter (`BedrockModelId`), default
  `anthropic.claude-sonnet-4-20250514`. Change it if your region needs a
  different id.
- `backend/samconfig.toml` holds the sane defaults (`sam build && sam deploy`
  from `backend/` works with no flag gymnastics); guardrail ids are passed on
  the command line, never committed.
- Environment variables the function reads: `DEMO_MODE`, `BEDROCK_MODEL_ID`,
  `GUARDRAIL_ID`, `GUARDRAIL_VERSION`, `CASES_TABLE`, `ALLOWED_ORIGIN`.
- No PII is stored on purpose: extraction text is capped, history is a digest.

## Cost honesty

On-demand DynamoDB, one infrequent Lambda invocation per analysis, one Bedrock
call (~2k tokens) — a full weekend of demos is comfortably inside the free
credits. The stack scales to zero; there is no always-on NAT or server.

---

## Demo-day checklist (the video carries the story)

1. `DemoMode=true` fallback ready before the URL is needed.
2. `backend/samples/letters/` hold three redacted letters with different
   verdicts (contestable / partial payment / genuinely lapsed) — pick the one that
   makes the emotional arc.
3. Record the 3-minute video per `docs/DEMO_SCRIPT.md`.
4. Write up what you learned on the AWS Builder Center blog (`docs/BLOG_DRAFT.md`)
   — it's a separate prize category and feeds the Learning score.

## Disclaimer

This project demonstrates a document-analysis and dispute-familiarisation
workflow for a hackathon. It is informational software, not legal or financial
advice. Nothing it says guarantees a claim outcome. Where you need a decision
you trust, a certified advisor is the right step — the tool's job is to get you
to that conversation knowing your own paperwork.