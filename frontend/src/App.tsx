import { useCallback, useEffect, useRef, useState } from "react";
import type { Analysis, Case, ContextInput } from "./types";
import {
  ApiError,
  analyze,
  fetchCases,
  prepareFile,
} from "./api";
import { Dropzone } from "./components/Dropzone";
import { ContextPanel } from "./components/ContextPanel";
import { VerdictView } from "./components/VerdictView";
import { HistoryDrawer } from "./components/HistoryDrawer";

type Tab = "upload" | "paste";
type Status = "idle" | "working" | "done" | "error";

const LANGUAGES = ["English", "Hinglish", "Hindi", "Tamil", "Telugu", "Bengali"];

const WORK_PHASES = [
  "Reading the letter…",
  "Checking each reason against policy rules…",
  "Drafting your reply letter…",
];

const SAMPLE_LETTER = `Example Health & Allied Insurance Co. Ltd.
Claim No: CLM20260828-00741  |  Policy No: EHAI/FLA/21/ID-0012354

Dear Policyholder,

This is with reference to the claim lodged for hospitalization at Sunrise
Multispecialty Hospital for "Acute myocardial infarction with hypertension".
The claim has been rejected on the following grounds:

1. The ailment treated is a pre-existing disease and the same was not
   disclosed at the time of inception of the policy.
2. Intimation of the claim was not provided within the stipulated period
   of 24 hours of hospitalization.
3. The treating surgeon's case papers have not been received from the
   hospital; the claim is being held pending until submission.

Yours faithfully,
Claims Department`;

export default function App() {
  const [tab, setTab] = useState<Tab>("paste");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [language, setLanguage] = useState("Hinglish");
  const [context, setContext] = useState<ContextInput>({});
  const [showContext, setShowContext] = useState(false);

  const [status, setStatus] = useState<Status>("idle");
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [result, setResult] = useState<Analysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<Case[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const phaseTimer = useRef<number | null>(null);

  const refreshHistory = useCallback(() => {
    fetchCases()
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    return () => {
      if (phaseTimer.current !== null) window.clearTimeout(phaseTimer.current);
    };
  }, []);

  function beginWork() {
    setStatus("working");
    setErrorMsg(null);
    setPhaseIndex(0);
    phaseTimer.current = window.setTimeout(() => {
      setPhaseIndex(1);
      window.setTimeout(() => setPhaseIndex(2), 1400);
    }, 1400);
  }

  async function runAnalyze(input: {
    base64?: string;
    mimeType?: string;
    text?: string;
  }) {
    beginWork();
    try {
      const analysis = await analyze({
        base64: input.base64,
        mimeType: input.mimeType,
        text: input.text,
        language,
        context,
      });
      setResult(analysis);
      setStatus("done");
      refreshHistory();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError
        ? err.message
        : "Something went wrong. Please try again.");
    }
  }

  async function handleUpload(fileToUse: File) {
    setFileError(null);
    try {
      const { base64, mimeType } = await prepareFile(fileToUse);
      if (!base64) {
        throw new ApiError("Could not read that file. Try another photo.");
      }
      await runAnalyze({ base64, mimeType });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Could not read the file.");
    }
  }

  async function handlePaste() {
    if (!pastedText.trim()) {
      setStatus("error");
      setErrorMsg("Paste the rejection letter text first.");
      return;
    }
    await runAnalyze({ text: pastedText });
  }

  function loadSample() {
    setTab("paste");
    setPastedText(SAMPLE_LETTER);
    setErrorMsg(null);
    setStatus("idle");
  }

  const inputReady =
    status !== "working" &&
    (tab === "upload" ? !!file && !fileError : pastedText.trim().length > 0);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <img src="./favicon.svg" alt="" width="34" height="34" />
          <div>
            <span className="brand-name">Vouchmark</span>
            <span className="brand-tag">your rejection, vouched</span>
          </div>
        </div>
        <div className="topbar-actions">
          <select
            aria-label="Output language"
            className="lang-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <button className="ghost-btn" onClick={loadSample}>
            Try a sample
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="panel input-panel" aria-label="Input">
          <div className="tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === "upload"}
              className={tab === "upload" ? "tab active" : "tab"}
              onClick={() => setTab("upload")}
            >
              Upload a letter
            </button>
            <button
              role="tab"
              aria-selected={tab === "paste"}
              className={tab === "paste" ? "tab active" : "tab"}
              onClick={() => setTab("paste")}
            >
              Paste the text
            </button>
          </div>

          {tab === "upload" ? (
            <Dropzone
              file={file}
              error={fileError}
              onChange={(f) => {
                setFile(f);
                if (f) setFileError(null);
              }}
            />
          ) : (
            <textarea
              className="paste-area"
              placeholder="Paste the exact wording of the rejection letter… policy number, the reasons for rejection, amounts, dates."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={12}
              aria-label="Rejection letter text"
            />
          )}

          <button
            className="context-toggle"
            onClick={() => setShowContext((s) => !s)}
            aria-expanded={showContext}
          >
            {showContext ? "Hide optional details" : "Add optional details"} (makes the
            verdict sharper)
          </button>
          {showContext && (
            <ContextPanel value={context} onChange={setContext} />
          )}

          {status === "working" && (
            <div className="progress" role="status" aria-live="polite">
              <span className="spinner" />
              <span>{WORK_PHASES[phaseIndex]}</span>
            </div>
          )}

          {status === "error" && errorMsg && (
            <div className="alert error" role="alert">
              {errorMsg}
            </div>
          )}

          <div className="actions-row">
            <button
              className="primary-btn"
              disabled={!inputReady}
              onClick={() =>
                tab === "upload" && file ? handleUpload(file) : handlePaste()
              }
            >
              {status === "working" ? "Analysing…" : "Check this rejection"}
            </button>
          </div>
          <p className="fine-print">
            Your letter is analysed, not stored as text by anyone. No login, no
            account. Informational only — never a promise.
          </p>
        </section>

        <section className="panel result-panel" aria-label="Result">
          {result ? (
            <VerdictView analysis={result} onReload={loadSample} />
          ) : (
            <div className="empty-state">
              <h2>If an insurer says “no”, is that the whole story?</h2>
              <p>
                Upload the rejection letter, or paste its wording. We extract each
                stated reason, check it against how Indian health policies actually
                behave, and draft a counter letter a real person can send.
              </p>
              <ol className="how-it-works">
                <li>
                  <strong>Bedrock vision</strong> reads the letter (even a photo), in
                  English, Hindi, Tamil, Telugu or Bengali.
                </li>
                <li>
                  <strong>Rules, not vibes</strong> — each reason is scored: weak
                  ground, curable, or looks valid.
                </li>
                <li>
                  <strong>A letter you can actually send</strong>, plus the evidence
                  list that makes it stick.
                </li>
              </ol>
              <button className="ghost-btn" onClick={loadSample}>
                Watch it work on a sample letter →
              </button>
            </div>
          )}
        </section>
      </main>

      {history && (history.length > 0 || showHistory) && (
        <HistoryDrawer
          cases={history}
          open={showHistory}
          onToggle={() => setShowHistory((s) => !s)}
        />
      )}

      <footer className="foot">
        Built for the AWS First Commit hackathon · Amazon Bedrock + Lambda + API
        Gateway + DynamoDB + CloudFront · a rejection is a disagreement, not a verdict
      </footer>
    </div>
  );
}