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
  action_guide?: string;
  question?: string;
  source_quote?: string;
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
  policy_start_date: string | null;
  sum_insured: number | null;
  policy_holder_name: string | null;
  reasons: { text: string; category: string; confidence: number }[];
  context_notes: string;
}

export interface Numbers {
  claimed: number | null;
  admitted: number | null;
  sumInsured: number | null;
  shortfall: number | null;
  note: string;
}

export interface Preparation {
  critical: string[];
  optional: string[];
  note: string;
}

export interface Analysis {
  extraction: Extraction;
  assessments: ReasonAssessment[];
  verdict: Verdict;
  letter: string;
  markdownSummary: string;
  numbers?: Numbers;
  preparation?: Preparation;
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

export interface CaseDetail {
  caseId: string;
  createdAt?: string;
  verdictLabel?: string;
  fightScore?: number;
  language?: string;
  digest?: CaseDigest;
  analysis?: Analysis;
}

export interface CaseDetailResponse {
  ok: boolean;
  case?: CaseDetail;
  error?: string;
}

export interface DeviceConfig {
  deviceId: string;
}