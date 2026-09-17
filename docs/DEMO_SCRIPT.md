# Demo video — 3-minute beat sheet

Rule of the festival: *the video is what the judges see.* No live demo. One
continuous screen recording, clean audio scripted in advance, closed captions.

## The setup

- One tab: the deployed site (https://…cloudfront.net).
- Phone + redacted photo of a rejection letter ready in Photos (or use the
  bundled sample).
- A redacted *real-feeling* claim — `backend/samples/letters/sample_01` mirrors
  this exactly.
- Record at 1080p. Title card with the team and the one-line pitch.

## Beats

**0:00–0:20 — The hook.**
Show the rejection letter on the phone, voice-over:

> “My family got a bill. The insurer said — *pre-existing disease, not
> disclosed at inception.* Paid every premium for six years. This is almost
> exactly the moment Indian families stop fighting and start paying.”

Show rupee number (₹6,82,000) highlighted.

**0:20–1:10 — The tool, in one flow.**
Drag the photo in. Click *Check this rejection.* No login, no typing forms.
Result screen: **Likely contestable** banner, score ring (60/100), three reason
cards each with a strength chip. Zoom on the pre-existing card: reads out why it
is weak when the condition was diagnosed during cover, six years in.

Same with the “intimation not given in 24 hours” card: *late intimation alone is
not a reason to reject a genuine claim.*

**1:10–2:00 — The counter letter.**
Scroll to the draft: numbered paragraphs arguing each ground, the evidence list
per reason, the 30-day written-decision ask, the Bima Bharosa escalation path.
Hit Copy. (Frame it: *this is not an argument, this is paperwork.*)

**2:00–2:40 — Where AWS fits (sticky-note style).**
Simple architecture card: photo → Bedrock vision reads it → rules engine →
counter letter; Lambda + API Gateway + DynamoDB + CloudFront on the side.
One honest line about scale-to-zero and free credits.

**2:40–3:00 — The point + what we learned.**
> “A rejection is not a verdict. It's the opening bid — and now families can
> read it.”

Close: *What we learned* — first Bedrock vision model, first Guardrail, first
live URL — three sentences maximum. Logo.

## Watch-outs

- Do not promise outcomes in the VO. “Looks weak, worth contesting”, not
  “they will pay”.
- Keep the letter readable: zoom before scrolling; avoid text smaller than the
  recording can capture.
- If Bedrock access is still pending, DemoMode produces identical UX — record
  with a neutral voice and it will pass unnoticed.
- Record in 3:00 or less. Leave 5 seconds of clean air after the last word.