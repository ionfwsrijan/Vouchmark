# Demo video — 3-minute beat sheet

Rule of the festival: *the video is what the judges see.* No live demo. One
continuous screen recording, clean audio scripted in advance, closed captions.

## The problem, stated before anything else

A judge has already read your README. The first 10 seconds of the video do not
need the product — they need the **stakes**:

> “A claim got rejected. The letter says *pre-existing disease, not disclosed at
> inception.* Six years of premiums paid. Most families read that line twice and
> then they stop. Vouchmark reads the line a third time — for them.”

Show the rupee number (₹6,82,000) highlighted. No logo card before this pitch;
a nameplate overlay in the corner is enough. Everything the user does after
this frames the product as *answering that specific injustice.*

## The setup

- One tab: the deployed site. On record-day use the live URL, not localhost.
- Phone + redacted photo of a rejection letter ready in Photos (or paste
  `sample_01`'s text if the photo is awkward to record).
- `backend/samples/letters/sample_04_messy_fax_scrawl.txt` exists purely as an
  honesty prop: mention that the tool also reads genuinely messy faxes — we
  stress-test parsing on a deliberately ugly letter (121 pytest green).
- Record at 1080p. No title card longer than 2 seconds.

## Beats

**0:00–0:10 — The hook (nothing on screen but the letter + the number above).**

**0:10–0:55 — The tool, in one flow.**
Drag the photo in. Click *Check this rejection.* No login, no forms.
Result screen: **Likely contestable** banner, score ring (60/100), three reason
cards each with a strength chip. Zoom on the pre-existing card: *diagnosed
*while the cover was running, six years in* — that is why the ground is weak.
Then the “intimation not given in 24 hours” card: *late intimation alone is not
a reason to reject a genuine claim.* This beat is the product: the letter says
“no”, the tool shows *why the no does not hold.*

**0:55–1:35 — The counter letter.**
Scroll to the draft: numbered paragraphs arguing each ground, the evidence list
per reason, the 30-day written-decision ask, the Bima Bharosa escalation path.
Hit Copy. Frame it in one line: *“This is not an argument — it is paperwork,
pre-drafted for them.”*

**1:35–2:15 — Where AWS fits (sticky-note style).**
Simple architecture card: photo → Bedrock vision reads it → rules engine →
counter letter; Lambda + API Gateway + DynamoDB + S3 on the side. One honest
line about scale-to-zero on free credits, and that the verdicts are the output
of a **deterministic rule engine** so the same letter always gets the same
answer.

**2:15–2:50 — The point + what we learned.**
> “A rejection is not a verdict. It's the opening bid — and now families can
> read it.”

Then three sentences max, one each: first Bedrock vision model; persisting
cases and re-opening an old verdict; and the honest part below. Logo.

## The honesty beat (does not need to be an apology)

If the account's Anthropic access is still pending, record with one neutral
sentence right before the architecture card:

> “Today this runs on a faithful simulation of the model while our account
> approval is processed; the pipeline and product are the same either way.”

And in the description, one line: *demo = deterministic, no tuning lives
behind the verdicts; real model runs when AWS approval lands.* That converts a
risk into a trust signal for judges who probe it.

## Watch-outs

- Do not promise outcomes in the VO. “Looks weak, worth contesting”, not
  “they will pay”.
- Keep the letter readable: zoom before scrolling; avoid text smaller than the
  recording can capture.
- Record in 3:00 or less. Leave 5 seconds of clean air after the last word.
- Rehearse the hook (0:00–0:10) three times before recording; whisper-timing
  beats, do not script-stumble on the one line that sells.