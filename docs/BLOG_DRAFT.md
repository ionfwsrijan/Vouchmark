# Blog / learning write-up — draft

Publish on AWS Builder Center and link it in the submission (separate
keyboard-prize category; feeds the *Learning* rubric line).

---

## Title ideas

- *A rejection is not a verdict: I built a Bedrock agent that reads your
  insurance rejection letter*
- *Vouchmark: day one, I had never touched Bedrock vision*
- *Four days, one feature: reading claim rejections with Claude on Bedrock*

## Draft

**Word count target:** 600–900, personal voice, no filler.

### 1. The problem (5 sentences)
My family's experience with a claim rejection where the insurer's own reason
did not match the policy — the cost of silence, the information asymmetry
between a claims department that knows the rules and a family that has never
seen them.

### 2. What I built (3–4 sentences + one diagram)
Photo/PDF or pasted text → Bedrock vision extracts each stated reason →
a deterministic rules engine scores grounds (weak / undetermined / strong) →
a counter letter with evidence lists and the Bima Bharosa path comes back in
English, Hindi, Tamil, Telugu or Bengali. Deployed to a URL on free credits.

### 3. Where AWS did the heavy lifting (the meat — most of the post)
- **Bedrock vision**: first time a document, not typed text, was my input.
  Turning a letter photo into typed JSON in one call changed what “building an
  app” means to me.
- **Bedrock Guardrails**: wiring a topic-deny for “guaranteed outcomes” so the
  tool explains instead of promising — the least glamorous and most important
  part.
- **SAM + one stack**: Lambda, API Gateway, DynamoDB and a CloudFront S3 site
  as *one* deploy, and it scales to zero.
- **What fought back**: the model's JSON came back wrapped in markdown fences;
  prompt discipline + a retry print. Region availability of model ids;
  image payload size → solved client-side. Student budget → a demo mode that
  shares 100% of the downstream code.

### 4. What it taught me (be honest)
Something you genuinely didn't know Thursday — name it. E.g., Guardrails are
prompt engineering AS infrastructure; a vision model turns paperwork into
structured data and that is a superpower; “one feature that runs” was a real
discipline to hold.

### 5. Link
Repo, deployed URL, demo video (3 min).

---

## Learning-scoring reminders for the submission text
- Say the single service you're proudest of and *why in your words*.
- Say one thing that failed and what you changed.
- Keep any tech claims to what the code actually does.