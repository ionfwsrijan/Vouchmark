export type GroundsStrength = "weak" | "strong" | "undetermined";
export type VerdictLabel = "LIKELY_INVALID" | "LIKELY_VALID" | "NEEDS_INPUT";

export interface ContextInput {
  policyYears?: number | "";
  diagnosisAgeYears?: number | "";
  amountClaimed?: number | "";
  amountRejected?: number | "";
}

export interface ReasonAssessment {
  category: string;
  label: string;
  grounds_strength: GroundsStrength;
  why: string;
  evidence: string[];
  question?: string;
}

export interface Verdict {
  label: VerdictLabel;
  fight_score: number;
  headline: string;
  summary: string;
  actions: string[];
  verification_context: Record<string, string[]>;
}

export interface Extraction {
  document_type: string;
  insurer: string | null;
  policy_number: string | null;
  claim_number: string | null;
  patient_name: string | null;
  diagnosis: string | null;
  hospital: string | null;
  amount_claimed: number | null;
  amount_rejected: number | null;
  rejection_date: string | null;
  reasons: { text: string; category: string; confidence: number }[];
  context_notes: string;
}

export interface Analysis {
  extraction: Extraction;
  assessments: ReasonAssessment[];
  verdict: Verdict;
  letter: string;
  markdownSummary: string;
  language: string;
  generatedVia: string;
  meta: { modelId: string; guardrail: boolean };
  disclaimer: string;
}

export interface AnalyzeResponse {
  ok: boolean;
  caseId?: string;
  analysis?: Analysis;
  error?: string;
}

export interface CaseDigest {
  insurer?: string | null;
  diagnosis?: string | null;
  amountRejected?: number | null;
  reasons?: string[];
  headline?: string;
}

export interface Case {
  caseId: string;
  createdAt?: string;
  verdictLabel?: string;
  fightScore?: number;
  language?: string;
  digest?: CaseDigest;
}

export interface DeviceConfig {
  deviceId: string;
}