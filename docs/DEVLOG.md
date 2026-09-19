# Development log

A commit-by-commit record of how Vouchmark was built, useful for the "Learning"
judging line and for anyone reading the repository fresh. Roughly chronological.

## Foundations

| Commit | What changed |
|---|---|
| `initial` | Monorepo seed: SAM `template.yaml`, Lambda analysis pipeline, React SPA, demo letters. |
| `chore: repo hygiene` | `.editorconfig`, `.nvmrc` (Node 24), `.gitattributes`, `.gitignore` polish. |
| `ci: GitHub Actions` | Backend pytest on Python 3.12 + frontend `npm ci` → typecheck/build/test. |

## Making the rules engine trustworthy

| Commit | What changed |
|---|---|
| `test: backend suite expansion` | Parameterised coverage of the rule-book, 6-language letter fallback, JSON-repair parsing, and the input validation matrix — 30 → 83 tests. |
| `test: vitest infra` | `vitest.config.ts`, RTL jsdom setup, unit tests for FightScore / runtime config / API layer. |
| `feat: harden input validation` | Magic-byte file sniffing, language whitelist, structured error `code`s on every 4xx/5xx. |
| `feat: extract policy metadata` | Policy holder, start date, sum insured flow into `Extraction` and the counter letter. |
| `feat: IRDAI-aligned action guides` | Per-category "what to do next" across the 15-category rulebook, mirrored in UI. |
| `feat(rules): source quotes` | Each assessment now carries the exact wording from the letter that triggered it. |
| `feat(math): Indian-format amounts` | Pure `claim_math.py`: `₹ 6,82,000` styling and an honest shortfall/sum-insured summary. |

## Persistence and reopen history

| Commit | What changed |
|---|---|
| `feat: case store depth` | Full analysis JSON persisted to DynamoDB; `GET /cases/{id}` detail route; cursor pagination. |
| `feat: reopen past cases` | History items reopen into the verdict view; print-to-PDF and CSV export for results. |

## Bilingual surface

| Commit | What changed |
|---|---|
| `feat: bilingual UI chrome` | `i18n.ts` carries English + Hinglish strings for the whole chrome, keyed off the output language. |

## Trust, shipping, and documentation

| Commit | What changed |
|---|---|
| `docs: IRDAI grounding guide` | Regulation map for every rulebook category + grievance arc in `docs/IRDAI_GUIDE.md`. |
| `docs: privacy & trust` | What touches the network, what is stored, TTLs, and what the tool is not in `docs/PRIVACY.md`. |
| `chore: ship ergonomics` | Committed `samconfig.toml` defaults and a one-command `dev.ps1` harness. |
| `docs/DEVLOG.md` | This document. |

## Latest depth wave

- `feat(api)`: `numbers` (shortfall + sum-insured coverage) and `preparation`
  (what to gather before sending) ship in **both** the demo and Bedrock payloads.
- `feat(ui)`: a "The numbers" card, a "Before you reply, gather these"
  checklist, and quote-from-the-letter chips on each reason card.

## Live shipping and the honesty pass

| Commit | What changed |
|---|---|
| `429b1de` | Live deploy wave: absolute imports, OpenAPI on API Gateway, `UseCloudFront` flag, ap-south-1 model id (`…-v1:0` suffix), pinned `src/requirements.txt`. |
| `69fc93c` | DynamoDB `Decimal` fightScore fix (`_plain_num`) — the first thing a live `GET /cases` would have crashed on. |
| `89955c3` | Oscar “Hot Blue” redesign: slate backdrop, white cards, status-tinted score ring and chips. |
| `474e9cc` | Header nav wired to real features: Overview / Case history / How it works; every dummy control removed; nav copy bilingual. |
| `d409a73` | Drop favicon, English default. |
| current wave | Stress suite for messy letters (121st+ backend tests), problem-first page copy + demo script, S3 cache headers, hardened deploy-backend script. |

Notes for the learning narrative:
- **The two account gates are the real story.** Blocked on CloudFront resource
  verification and Anthropic first-use approval in the same week; shipped with
  `UseCloudFront=false` and `DemoMode=true` instead of not shipping.
- **DemoMode is deterministic on purpose.** Same letter → same verdict. That is
  testable in CI and keeps the demo honest on record day.

## Test scorecard (moving numbers)

- **Backend (pytest, no AWS):** ~30 baseline → 83 → 104 → 115 → 121 (incl. the
  messy-letter stress suite).
- **Frontend (vitest + RTL):** 12 → 15 → 18 → 21 → 22.
- **Browser e2e (Playwright):** 2 passing flows against a local demo server.
- `npm run typecheck`, `npm run build`, and GitHub Actions CI are green on `main`.

## Honest gaps (next if there were another week)

- A real Bedrock extraction-side evaluation set (today: fixtures + rules are
  deep; model outputs are validated structurally, not against a labeled corpus).
- Running the real model end-to-end against the live stack once the account
  approval lands; measuring latency and guardrail interplay under load.
- A judging one-pager / landing that carries the same pitch as the video's
  first ten seconds.