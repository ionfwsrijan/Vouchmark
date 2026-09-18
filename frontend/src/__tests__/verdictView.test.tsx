import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Analysis } from "../types";
import { VerdictView } from "../components/VerdictView";

const analysis: Analysis = {
  extraction: {
    document_type: "claim_rejection",
    insurer: "Example Health & Allied Insurance",
    policy_number: "EHAI/FLA/21/ID-0012354",
    claim_number: "CLM20260828-00741",
    patient_name: null,
    diagnosis: "Acute myocardial infarction",
    hospital: "Sunrise Hospital",
    amount_claimed: 682000,
    amount_rejected: 682000,
    rejection_date: "2026-09-02",
    policy_start_date: "2021-04-14",
    sum_insured: 500000,
    policy_holder_name: "[policy holder name]",
    reasons: [{ text: "PED not disclosed", category: "pre_existing", confidence: 0.9 }],
    context_notes: "",
  },
  assessments: [
    {
      category: "pre_existing",
      label: "Pre-existing disease (PED) exclusion",
      grounds_strength: "weak",
      why: "Diagnosed during cover, past the PED window.",
      evidence: ["Discharge summary"],
      action_guide: "Attach the first-diagnosis summary.",
      source_quote: "The treated ailment is a pre-existing disease not disclosed at inception.",
    },
  ],
  verdict: { label: "LIKELY_INVALID", fight_score: 78, headline: "", summary: "", actions: [], verification_context: {} },
  letter: "DRAFT letter.",
  markdownSummary: "",
  numbers: { claimed: 682000, admitted: 0, sumInsured: 500000, shortfall: 682000, note: "The entire claimed amount appears to have been declined." },
  preparation: { critical: ["policy_holder_name"], optional: ["hospital"], note: "Before sending the draft, gather \"the policy holder's name\"" },
  language: "Hinglish",
  generatedVia: "demo",
  meta: { modelId: "demo", guardrail: false },
  disclaimer: "Informational only.",
};

describe("VerdictView depth blocks", () => {
  it("renders the source quote under the matching reason", () => {
    render(<VerdictView analysis={analysis} onReload={() => {}} />);
    screen.getByText(/pre-existing disease not disclosed/i);
  });

  it("renders Indian-formatted numbers and the shortfall note", () => {
    render(<VerdictView analysis={analysis} onReload={() => {}} />);
    expect(screen.getAllByText("₹ 6,82,000").length).toBeGreaterThan(0);
    screen.getByText(/entire claimed amount appears to have been declined/i);
  });

  it("renders the gather-before-you-reply checklist with labels", () => {
    render(<VerdictView analysis={analysis} onReload={() => {}} />);
    screen.getByText("Policy holder name");
    screen.getByText("Hospital name");
    screen.getByText(/Before sending the draft/i);
  });
});