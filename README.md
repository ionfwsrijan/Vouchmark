# 🛡️ Vouchmark

> *A rejection is not a verdict. It's a claim — vouch it, then reply.*

![CI](https://github.com/ionfwsrijan/Vouchmark/actions/workflows/ci.yml/badge.svg)
![Tests](https://img.shields.io/badge/tests-121_backend_%2B_22_frontend_%2B_2_e2e-2B5CFF)
![Stack](https://img.shields.io/badge/stack-Bedrock%20%E2%80%A2%20Lambda%20%E2%80%A2%20API%20Gateway%20%E2%80%A2%20DynamoDB%20%E2%80%A2%20S3-232F3E?logo=amazonaws)
![Live](https://img.shields.io/badge/live-ap--south--1-success)
![Lang](https://img.shields.io/badge/Python-3.12-3776AB?logo=python) ![Lang](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Lang](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

**Vouchmark helps Indian families understand *why* a health-insurance claim was
rejected and whether the stated reason actually holds — then drafts a counter
letter a real person can send.** Built for the **AWS First Commit** hackathon
(Bharat Builds Tour, 17–20 Sep 2026) on the **Ship It** track, with a
zero-account **Build It** demo bundled in.

---

## 📸 See it in action

| Landing | Analysis | Counter letter |
|---|---|---|
| [![landing](docs/screenshots/landing.png)](docs/screenshots/landing.png) | [![verdict](docs/screenshots/verdict.png)](docs/screenshots/verdict.png) | [![history](docs/screenshots/history.png)](docs/screenshots/history.png) |
| Problem-first pitch, no login, no forms. | Score ring, per-reason strength + source quotes. | Device-private history, reopen any past check. |

How-it-works modal and a mobile view are in [docs/screenshots/](docs/screenshots/)
(`how-it-works.png`, `landing-mobile.png`). Capture them fresh any time with
`node frontend/scripts/capture-screenshots.mjs`.

---

## 🎯 The problem

A middle-class family gets a bill — a cashless claim rejected for a paper-thin
reason: *"pre-existing disease"*, *"intimation not given in 24 hours"*,
*"surgeon's papers awaited"*. The insurer's staff know the rules. The patient
doesn't. **That information asymmetry is the enemy.**

When a rejection's stated ground is weak on its face (a condition diagnosed
*after* the PED waiting period; late intimation alone; missing documents that
are simply curable), **silence costs money**. A structured written reply is how
these get re-examined.

## ⚙️ What it does

1. **📄 Reads the letter** — upload a photo/PDF or paste the text. Amazon
   Bedrock (Claude, vision) extracts the insurer's exact stated reasons plus
   policy metadata (policy/claim numbers, holder, start date, sum insured).
2. **⚖️ Scores each reason** against a plain rulebook of how Indian health
   policies actually behave: `weak` (contestable) · `undetermined` (curable) ·
   `strong` (looks valid) — quoting the letter's exact wording back, plus a
   per-reason **action guide**.
3. **✉️ Drafts the counter letter** — evidence list per reason, a 30-day
   written-decision request, and the Bima Bharosa / grievance escalation path.
   Plus **the numbers** (₹ Indian-formatted claimed/rejected/shortfall vs sum
   insured) and a **"gather these before you reply"** checklist.
4. **🔐 Keeps a private history** per device — reopen any past result, print to
   PDF, export reason-by-reason CSV. No login, no account.

All output is informational and guarded so it never promises an outcome. See
[`docs/IRDAI_GUIDE.md`](docs/IRDAI_GUIDE.md) for the regulatory reasoning and
[`docs/PRIVACY.md`](docs/PRIVACY.md) for what touches the network and the store.

---

## 🚀 The 60-second story for judges

| Line | Why it lands |
|---|---|
| **💡 Idea & impact** | Small, specific, financial, provable: a rejection letter where the ground is clearly weak. The tool exists *because* the knowledge is asymmetric. |
| **☁️ Built on AWS** | Bedrock vision (document → structured data), Bedrock Guardrails, Lambda, API Gateway, DynamoDB, S3 + CloudFront. Scales to zero, runs on free credits. |
| **🎓 Learning** | First Bedrock vision model, first Guardrail, first deployed URL on this stack — all four days of it. |
| **🔧 Execution** | Exactly one flow that works end-to-end *today*, with a deterministic offline twin that requires no account at all. |
| **🎬 Demo video** | Opens with an uncle's rejection photo; 20 seconds in, the app says the ground looks weak and hands back a letter. |

---

## 🗂️ Try it now

### 🆓 Offline demo (Build It track — zero AWS)

Requirements: Node 18+, Python 3.10+.

```powershell
.\dev.ps1 setup      # npm ci + pip install
.\dev.ps1 serve      # full offline demo on http://localhost:8000
```

Open http://localhost:8000 → *Try a sample*. Everything runs in-process:
deterministic rules + letter builder. No account, no card, no Docker.

### 🧪 Verify the logic, headless

```powershell
py -m pytest backend/tests -q        # 121 backend tests
cd frontend; npm test                # 22 vitest tests
cd frontend; npm run e2e             # 2 Playwright flows vs local demo server
```

---

## 📦 How it's wired

```
vouchmark/
├─ backend/
│  ├─ template.yaml               # ☁️ SAM stack: Lambda + API Gateway + DynamoDB + S3/CloudFront static
│  ├─ src/                        # Python package (pure logic + lazy boto3)
│  │  ├─ analyze.py               #   Lambda handler (routes, validation, errors)
│  │  ├─ extract.py               #   Bedrock pipeline orchestration
│  │  ├─ bedrock.py               #   Converse API wrapper + Guardrails
│  │  ├─ rules.py                 #   🧠 rejection-reason taxonomy + rules engine (pure)
│  │  ├─ letters.py               #   ✉️ deterministic counter-letter fallback
│  │  ├─ demo.py                  #   offline demo pipeline (no account)
│  │  ├─ ddb.py                   #   DynamoDB persistence (best-effort)
│  │  └─ prompts.py / models.py
│  ├─ tests/                      # 121 pytest tests, no AWS required
│  ├─ samples/letters/            # redacted sample rejection letters
│  ├─ scripts/                    # create-guardrail / deploy-backend / deploy-frontend / run-local
│  └─ tools/local_server.py       # HTTP server for the offline demo
├─ frontend/
│  ├─ src/                        # Vite + React + TypeScript SPA (22 vitest tests)
│  ├─ scripts/                    # e2e server, point-local-api, capture-screenshots
│  └─ public/config.js            # runtime-injected API URL
├─ .github/workflows/ci.yml       # pytest + typecheck + build on every push
└─ docs/                          # ARCHITECTURE 🏗️ · DEMO_SCRIPT 🎬 · BLOG_DRAFT ✍️ · IRDAI_GUIDE 📜 · PRIVACY 🔒 · DEVLOG 📓 · screenshots 📸
```

### ⚡ Pipeline, in one line

```
photo/PDF or text ──▶ 🧠 Bedrock vision ──▶ ⚖️ rules engine ──▶ ✉️ counter letter
                          (Claude 4)          (deterministic)      + numbers + checklist
                                                    │
                                            💾 DynamoDB history ──▶ 📂 reopen / PDF / CSV
```

## 🧠 Depth, at a glance

| Layer | What's behind it |
|---|---|
| **🧠 Rules engine** | 15-category rejection taxonomy, alias normalisation, context-aware verdict — deterministic and fully unit-tested (`rules.py`). |
| **🔀 Pipeline** | Bedrock extraction → rules → letter, with a parsed-JSON retry, a deterministic letter fallback, and an offline demo twin sharing the exact same engine. |
| **🛡️ Safety rails** | Bedrock Guardrails, file-signature sniffer on uploads, size/MIME/language whitelists, structured `code` on every 4xx/5xx. |
| **🗄️ Case store** | Per-device DynamoDB rows, full-analysis persistence, `GET /cases/{id}`, cursor pagination, optional TTL. |
| **🖥️ Frontend** | Client-side image downscale, N-language output, bilingual chrome (EN/Hinglish), reopen-history, print-to-PDF, CSV export, numbers card, source-quote chips, pre-reply checklist. |
| **✅ Testing** | 121 backend pytest + 22 frontend vitest + 2 Playwright e2e; `npm run build` and `tsc -b` clean; CI on GitHub Actions. |
| **📚 Docs** | ARCHITECTURE · IRDAI_GUIDE · PRIVACY · DEVLOG · DEMO_SCRIPT · BLOG_DRAFT. |

---

## 🚢 Shipping it (Ship It track)

Toolbox: `aws` CLI (v2) + `aws-sam-cli`, Node 18+. The $100 bonus + weekend
credits cover the ~₹2-verification account.

### 🌍 Deployed — live now, ap-south-1

- **App:** http://vouchmark-frontendbucket-iqsq8qbdvv2j.s3-website.ap-south-1.amazonaws.com
- **API:** https://jgnqzrzhhj.execute-api.ap-south-1.amazonaws.com/prod/
- Live verdicts come from a **deterministic rule engine** — the same letter
  always gets the same answer; that's exactly what CI asserts.
- `DemoMode=true` until the account is granted Anthropic model access. Bedrock
  is confirmed reachable; the model id needs the region's `-v1:0` suffix.
- **Two account gates remain** (both free, both ask for a one-time approval):
  1. 🟡 **Anthropic access** — Converse returns `Operation not allowed` until
     first-use approval in **Bedrock → Model access → Claude Sonnet 4**.
  2. 🟡 **CloudFront verification** — required to move from the `http://` S3 URL
     to `https://…cloudfront.net`. File an AWS Support case (Account & billing).

### ⏱️ Day 1 — do these first

1. Verify your student Builder Center profile.
2. **Bedrock → Model access → enable Claude Sonnet 4** in `ap-south-1` (the one
   delay risk — until it lands, `DemoMode=true` keeps the demo alive).
3. Create the guardrail: `backend\scripts\create-guardrail.ps1`

### 🔨 Deploy (one time)

```powershell
# 1. backend (prints ApiUrl, bucket). Add -UseCloudFront once verification lands.
backend\scripts\deploy-backend.ps1 -Region ap-south-1 -DemoMode -AllowedOrigin "*" `
   -GuardrailId <id> -GuardrailVersion <v>

# 2. frontend (build → inject API URL → s3 sync)
backend\scripts\deploy-frontend.ps1 -Region ap-south-1 -ApiUrl <the ApiUrl above>
```

Then tighten CORS: `-AllowedOrigin "https://<your-cloudfront-domain>"`.
Verify without a browser: `backend\scripts\verify-deploy.ps1 -ApiUrl "<...>"`
(health → analyze → reopen-the-saved-case in one pass).

### 🔑 Secrets / pins

- Model id is a stack parameter (`BedrockModelId`), default
  `anthropic.claude-sonnet-4-20250514-v1:0`.
- `backend/samconfig.toml` holds sane defaults; guardrail ids are CLI args, never
  committed. Function env: `DEMO_MODE`, `BEDROCK_MODEL_ID`, `GUARDRAIL_ID`,
  `GUARDRAIL_VERSION`, `CASES_TABLE`, `ALLOWED_ORIGIN`.
- No PII is stored: extraction is capped, history is a digest.

## 💸 Cost honesty

On-demand DynamoDB, one infrequent Lambda call per analysis, one Bedrock call
(~2k tokens) — a full weekend of demos sits inside the free credits. The stack
scales to zero; there is no always-on server.

---

## 🎬 Demo-day checklist

1. `DemoMode=true` fallback ready before the URL is needed. ✅ (it's default)
2. `backend/samples/letters/` holds four letters — three clean scenarios plus a
   deliberately **messy fax** (`sample_04`) that stress-tests parsing in CI.
3. Record the 3-minute video per [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).
4. Write the AWS Builder Center blog post (`docs/BLOG_DRAFT.md`) — a separate
   prize category that feeds the Learning score.

## ⚠️ Disclaimer

Informational software for a hackathon — not legal or financial advice.
Nothing it says guarantees a claim outcome. Where you need a decision you
trust, a certified advisor is the right step; the tool's job is to get you to
that conversation knowing your own paperwork.