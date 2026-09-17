import { useCallback, useEffect, useRef, useState } from "react";
import type { Analysis, Case, ContextInput } from "./types";
import {
  ApiError,
  analyze,
  fetchCase,
  fetchCases,
  prepareFile,
} from "./api";
import { Dropzone } from "./components/Dropzone";
import { ContextPanel } from "./components/ContextPanel";
import { VerdictView } from "./components/VerdictView";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { uiStrings } from "./i18n";

type Tab = "upload" | "paste";
type Status = "idle" | "working" | "done" | "error";

const LANGUAGES = ["English", "Hinglish", "Hindi", "Tamil", "Telugu", "Bengali"];

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

  const t = uiStrings(language);

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

  async function openCase(caseId: string) {
    setStatus("working");
    setErrorMsg(null);
    try {
      const analysis = await fetchCase(caseId);
      setResult(analysis);
      setStatus("done");
      setShowHistory(false);
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof ApiError
          ? err.message
          : "Could not open that case. It may have expired.",
      );
    }
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
            <span className="brand-tag">{t.brandTag}</span>
          </div>
        </div>
        <div className="topbar-actions">
          <select
            aria-label={t.outputLangLabel}
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
            {t.trySample}
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
              {t.uploadTab}
            </button>
            <button
              role="tab"
              aria-selected={tab === "paste"}
              className={tab === "paste" ? "tab active" : "tab"}
              onClick={() => setTab("paste")}
            >
              {t.pasteTab}
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
              placeholder={t.pastePlaceholder}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={12}
              aria-label={t.textareaLabel}
            />
          )}

          <button
            className="context-toggle"
            onClick={() => setShowContext((s) => !s)}
            aria-expanded={showContext}
          >
            {showContext ? t.contextHide : t.contextShow} (makes the verdict
            sharper)
          </button>
          {showContext && (
            <ContextPanel value={context} onChange={setContext} />
          )}

          {status === "working" && (
            <div className="progress" role="status" aria-live="polite">
              <span className="spinner" />
              <span>{t.workPhases[phaseIndex]}</span>
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
              {status === "working" ? t.analysing : t.checkRejection}
            </button>
          </div>
          <p className="fine-print">{t.finePrint}</p>
        </section>

        <section className="panel result-panel" aria-label="Result">
          {result ? (
            <VerdictView analysis={result} onReload={loadSample} />
          ) : (
            <div className="empty-state">
              <h2>{t.emptyH2}</h2>
              <p>{t.emptyP}</p>
              <ol className="how-it-works">
                {t.how.map(([title, body], index) => (
                  <li key={index}>
                    <strong>{title}</strong>
                    {body}
                  </li>
                ))}
              </ol>
              <button className="ghost-btn" onClick={loadSample}>
                {t.watchSample}
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
          onSelect={openCase}
          copy={{ heading: t.historyHeading, empty: t.historyEmpty }}
        />
      )}

      <footer className="foot">{t.footer}</footer>
    </div>
  );
}