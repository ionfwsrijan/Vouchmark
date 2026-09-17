import type { Case } from "../types";

interface Props {
  cases: Case[];
  open: boolean;
  onToggle: () => void;
  onSelect?: (caseId: string) => void;
  copy?: { heading: string; empty: string };
}

const LABEL_DOT: Record<string, string> = {
  LIKELY_INVALID: "clay",
  LIKELY_VALID: "ok",
  NEEDS_INPUT: "amber",
};

export function HistoryDrawer({ cases, open, onToggle, onSelect, copy }: Props) {
  const heading = copy?.heading ?? "Past checks on this device";
  const empty = copy?.empty ?? "Nothing here yet — your first check will appear.";
  return (
    <div className="history">
      <button
        className="history-float"
        onClick={onToggle}
        aria-expanded={open}
        title={open ? "Close history" : "Open history"}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {cases.length}
      </button>
      {open && (
        <div className="history-panel">
          <h3>{heading}</h3>
          {cases.length === 0 ? (
            <p className="fine-print">{empty}</p>
          ) : (
            <ul className="history-list">
              {cases.map((c) => (
                <li key={c.caseId} className="history-item">
                  {onSelect ? (
                    <button
                      className="history-open"
                      onClick={() => onSelect(c.caseId)}
                      title="Reopen this analysis"
                    >
                      <span className={`verdict-dot ${LABEL_DOT[c.verdictLabel ?? ""] ?? "amber"}`} />
                      <HistoryBody c={c} />
                    </button>
                  ) : (
                    <div className="history-row">
                      <span className={`verdict-dot ${LABEL_DOT[c.verdictLabel ?? ""] ?? "amber"}`} />
                      <HistoryBody c={c} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryBody({ c }: { c: Case }) {
  return (
    <>
      <div className="history-title">
        {c.digest?.headline || c.verdictLabel || "Cheque"}
      </div>
      <div className="history-sub">
        {c.digest?.insurer || "—"} · {formatDate(c.createdAt)} · score{" "}
        {c.fightScore ?? "–"}
      </div>
    </>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}