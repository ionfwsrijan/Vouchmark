import type { Analysis, VerdictLabel } from "../types";
import { FightScore } from "./FightScore";
import { LetterBlock } from "./LetterBlock";
import { caseToCsv, downloadCsv } from "../lib/exportCsv";

interface Props {
  analysis: Analysis;
  onReload: () => void;
}

function inr(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return "₹ " + value.toLocaleString("en-IN");
}

const PREP_LABELS: Record<string, string> = {
  policy_number: "Policy number",
  claim_number: "Claim number",
  policy_holder_name: "Policy holder name",
  rejection_date: "Rejection date",
  diagnosis: "Diagnosed condition",
  hospital: "Hospital name",
  amount_claimed: "Amount claimed",
  amount_rejected: "Amount rejected",
  policy_start_date: "Policy start date",
  sum_insured: "Sum insured",
};

function exportAsCsv(analysis: Analysis): void {
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsv(`vouchmark-case-${stamp}.csv`, caseToCsv(analysis));
}

type Tone = "clay" | "ok" | "amber";

const VERDICT_THEME: Record<VerdictLabel, { tone: Tone; label: string; blurb: string }> = {
  LIKELY_INVALID: {
    tone: "clay",
    label: "Likely contestable",
    blurb: "These grounds look fightable on paper. Engage the grievance process.",
  },
  LIKELY_VALID: {
    tone: "ok",
    label: "Looks valid on paper",
    blurb: "The reasons match common lawful exclusions — confirm before accepting.",
  },
  NEEDS_INPUT: {
    tone: "amber",
    label: "Needs documents, not slogans",
    blurb: "No ground is clearly right or wrong. Resubmit with the right papers.",
  },
};

const STRENGTH_META: Record<
  "weak" | "strong" | "undetermined",
  { tag: string; icon: string }
> = {
  weak: { tag: "Ground looks weak", icon: "▼" },
  strong: { tag: "Looks valid", icon: "▲" },
  undetermined: { tag: "Opened — needs docs", icon: "◆" },
};

export function VerdictView({ analysis, onReload }: Props) {
  const { verdict, assessments, extraction, letter } = analysis;
  const theme = VERDICT_THEME[verdict.label];

  return (
    <article className="verd outcome" aria-label="Analysis outcome">
      <div className={`verdict-banner ${theme.tone}`}>
        <FightScore score={verdict.fight_score} tone={theme.tone} />
        <div className="verdict-copy">
          <div className={`verdict-tag ${theme.tone}`}>{theme.label}</div>
          <h2>{verdict.headline}</h2>
          <p>{theme.blurb}</p>
        </div>
      </div>

      <p className="verdict-summary">{verdict.summary}</p>

      <div className="doc-facts">
        {extraction.insurer && (
          <span>
            <b>Insurer</b> {extraction.insurer}
          </span>
        )}
        {extraction.diagnosis && (
          <span>
            <b>Diagnosis</b> {extraction.diagnosis}
          </span>
        )}
        {extraction.amount_rejected !== null && (
          <span>
            <b>In question</b> ₹
            {extraction.amount_rejected.toLocaleString("en-IN")}
          </span>
        )}
      </div>

      {analysis.numbers &&
        (analysis.numbers.claimed !== null ||
          analysis.numbers.shortfall !== null) && (
          <section className="numbers-card">
            <h3 className="section-title">The numbers</h3>
            <dl className="numbers-grid">
              <div>
                <dt>Claimed</dt>
                <dd>{inr(analysis.numbers.claimed)}</dd>
              </div>
              {analysis.numbers.admitted !== null && (
                <div>
                  <dt>Admitted / paid</dt>
                  <dd>{inr(analysis.numbers.admitted)}</dd>
                </div>
              )}
              {analysis.numbers.shortfall !== null && (
                <div>
                  <dt>Unreimbursed</dt>
                  <dd>{inr(analysis.numbers.shortfall)}</dd>
                </div>
              )}
              {analysis.numbers.sumInsured !== null && (
                <div>
                  <dt>Sum insured</dt>
                  <dd>{inr(analysis.numbers.sumInsured)}</dd>
                </div>
              )}
            </dl>
            <p className="reason-why">{analysis.numbers.note}</p>
          </section>
        )}

      {analysis.preparation &&
        (analysis.preparation.critical.length > 0 ||
          analysis.preparation.optional.length > 0) && (
          <section className="prep-card">
            <h3 className="section-title">Before you reply, gather these</h3>
            <p className="reason-why">{analysis.preparation.note}</p>
            <ul className="evidence-list">
              {analysis.preparation.critical.map((k) => (
                <li key={k} className="prep-critical">
                  {PREP_LABELS[k] ?? k}
                </li>
              ))}
              {analysis.preparation.optional.map((k) => (
                <li key={k} className="prep-optional">
                  {PREP_LABELS[k] ?? k}
                </li>
              ))}
            </ul>
          </section>
        )}

      <section>
        <h3 className="section-title">Each reason, checked</h3>
        <div className="reason-list">
          {assessments.map((a) => {
            const meta = STRENGTH_META[a.grounds_strength];
            return (
              <div key={a.category} className="reason-card">
                <div className="reason-head">
                  <span className={`strength-chip ${a.grounds_strength}`}>
                    <span aria-hidden="true">{meta.icon}</span> {meta.tag}
                  </span>
                  <span className="reason-label">{a.label}</span>
                </div>
                {a.source_quote && (
                  <blockquote className="reason-quote">
                    “{a.source_quote}”
                  </blockquote>
                )}
                <p className="reason-why">{a.why}</p>
                {a.action_guide && (
                  <p className="reason-action">→ {a.action_guide}</p>
                )}
                <details className="evidence-details">
                  <summary>What to attach</summary>
                  <ul className="evidence-list">
                    {a.evidence.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </details>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="section-title">Your next moves</h3>
        <ul className="action-list">
          {verdict.actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </section>

      <LetterBlock letter={letter} label="Counter letter draft" />

      <p className="disclaimer">{analysis.disclaimer}</p>

      <div className="meta-row no-print">
        <span className="chip">model {analysis.meta.modelId}</span>
        <span className="chip">
          {analysis.generatedVia === "demo" ? "demo pipeline" : "Bedrock + Guardrails"}
        </span>
        <span className="chip">language {analysis.language}</span>
        <button className="ghost-btn small" onClick={() => window.print()}>
          Print / PDF
        </button>
        <button className="ghost-btn small" onClick={() => exportAsCsv(analysis)}>
          Export CSV
        </button>
        <button className="ghost-btn small" onClick={onReload}>
          Try another letter
        </button>
      </div>
    </article>
  );
}