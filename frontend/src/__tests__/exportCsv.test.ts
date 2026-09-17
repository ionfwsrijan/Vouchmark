import { afterEach, describe, expect, it, vi } from "vitest";
import type { Analysis } from "../types";
import { caseToCsv, downloadCsv } from "../lib/exportCsv";

const analysis: Analysis = {
  extraction: {
    document_type: "claim_rejection",
    insurer: "X",
    policy_number: null,
    claim_number: null,
    patient_name: null,
    diagnosis: null,
    hospital: null,
    amount_claimed: null,
    amount_rejected: null,
    rejection_date: null,
    policy_start_date: null,
    sum_insured: null,
    policy_holder_name: null,
    reasons: [],
    context_notes: "",
  },
  assessments: [
    {
      category: "delayed_intimation",
      label: "Late / non-intimation",
      grounds_strength: "weak",
      why: 'A line with a "quote" and, a comma',
      evidence: ["receipt"],
      action_guide: "Write a short reason",
    },
  ],
  verdict: { label: "LIKELY_INVALID", fight_score: 78, headline: "", summary: "", actions: [], verification_context: {} },
  letter: "",
  markdownSummary: "",
  language: "English",
  generatedVia: "demo",
  meta: { modelId: "demo", guardrail: false },
  disclaimer: "",
};

describe("caseToCsv", () => {
  it("emits a header row and one row per assessment", () => {
    const csv = caseToCsv(analysis);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("verdict");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("LIKELY_INVALID");
    expect(lines[1]).toContain("delayed_intimation");
  });

  it("escapes quotes and commas inside cells", () => {
    const csv = caseToCsv(analysis);
    expect(csv[csv.indexOf("quote") - 1]).toBe('"');
    expect(csv).toContain('"A line with a ""quote"" and, a comma"');
  });
});

describe("downloadCsv", () => {
  const createObjectURL = vi.fn(() => "blob:fake");
  const revokeObjectURL = vi.fn();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("triggers a CSV download through the DOM", () => {
    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectURL,
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: revokeObjectURL,
      configurable: true,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    downloadCsv("case.csv", "a,b");
    expect(click).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledOnce();
    click.mockRestore();
  });
});