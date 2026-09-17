# Architecture

## Flow at a glance

```
[Browser SPA (React, CloudFront/S3)]
      │  photo/PDF   (client-side downscale → ≤1280px JPEG)
      ▼
[API Gateway REST  /analyze  (CORS, 10MB)]
      │  base64 image or pasted text + optional context + language
      ▼
[Lambda: analyze.lambda_handler]
      ├─ validate (mime, size, base64, text caps)   → 400/413
      ├─ Bedrock Converse (Claude vision)           → structured extraction JSON
      │      └─ Bedrock Guardrail (topic deny: promised outcomes,
      │         legal/financial advice) + PROMPT_INSECURITY HIGH
      ├─ Rules engine (pure, testable)              → per-reason grounds_strength
      ├─ Verdict + fight score (deterministic)
      ├─ Second Bedrock call → counter letter (multilingual)
      │      └─ deterministic letter fallback if model throws
      └─ DynamoDB put_item (best-effort, digest only, never fails the request)
      ▼
 Response: verdict, per-reason assessments, letter, 30-day action plan
```

`GET /cases?deviceId=…` returns the last checks for that anonymous device.
`GET /health` is the liveness probe.

## Why each piece is where it is

- **Bedrock vision is the only place an LLM is required.** The rules engine and
  letter skeleton are deterministic. If Bedrock is down or still being
  provisioned, `DEMO_MODE=1` swaps in `demo.py` — the *same* downstream code path,
  so the demo and production behave identically.
- **Client-side downscale** keeps the whole pipeline under every size limit and
  keeps a phone photo → answer in ~3–5 seconds.
- **Anonymous device key, no auth.** History is keyed by a client-generated
  device id (localStorage). No login wall to demo; no PII stored beyond what the
  user chose to send. Auth (Cognito) is a later bolt-on, not a Day-1 risk.
- **Best-effort persistence.** DynamoDB writes happen after the verdict is
  computed; if storage fails the user still gets their analysis. Storage never
  takes the app down.
- **Guardrails keep it honest.** The tool explains *why a ground is weak* and
  routes to the official grievance process — it never guarantees an outcome and
  never gives legal/financial advice. That boundary is enforced in the model
  stack, not just in copy.

## Cost posture

- On-demand DynamoDB (zero provisioned capacity).
- Pay-per-use Lambda, 512 MB, 60 s max.
- One Bedrock Converse call per extraction + one per letter (~2–4k tokens).
- CloudFront PriceClass_100 + S3 static. Scales to zero.

All of it comfortably inside the hackathon's free-credit envelope.

## Failure modes handled

| Failure | Behaviour |
|---|---|
| Bedrock model access not yet granted | `DEMO_MODE=1` → identical UX via deterministic pipeline |
| Model returns non-JSON / garbage | retry once with a repair instruction, then structured 502 |
| Guardrail blocks the request | explicit, human message; no white screen |
| DynamoDB unreachable | analysis still returned; log + continue |
| Oversized / wrong-type file | client+server validation → friendly 400 |
| Unusual rejection reason | categorized `other`, still scored and lettered |