import { useState } from "react";

interface Props {
  letter: string;
  label: string;
}

export function LetterBlock({ letter, label }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(letter);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = letter;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(ta);
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="letter-block">
      <div className="letter-head">
        <h3 className="section-title">{label}</h3>
        <button className="ghost-btn small" onClick={copy}>
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="letter-text" tabIndex={0}>
        {letter}
      </pre>
      <p className="fine-print">
        Review and edit this draft before sending. Send by email and tracked
        courier, and keep the receipts.
      </p>
    </section>
  );
}