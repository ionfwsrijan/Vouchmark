import type { ContextInput } from "../types";

interface Props {
  value: ContextInput;
  onChange: (next: ContextInput) => void;
}

interface Field {
  key: keyof ContextInput;
  label: string;
  hint: string;
  placeholder: string;
}

const FIELDS: Field[] = [
  {
    key: "policyYears",
    label: "Years since policy started",
    hint: "Roughly how long has this policy been running before this hospitalisation?",
    placeholder: "e.g. 6",
  },
  {
    key: "diagnosisAgeYears",
    label: "Years the diagnosis predates the policy",
    hint: "Was this condition diagnosed before you bought the policy? Leave empty if it first appeared after.",
    placeholder: "e.g. 0 (diagnosed during cover)",
  },
  {
    key: "amountClaimed",
    label: "Amount claimed (₹)",
    hint: "What the hospital bill / claim was.",
    placeholder: "e.g. 682000",
  },
  {
    key: "amountRejected",
    label: "Amount rejected / unpaid (₹)",
    hint: "What the insurer said they will not pay.",
    placeholder: "e.g. 682000",
  },
];

function toNumberInput(raw: number | "" | undefined): string {
  return raw === undefined || raw === "" ? "" : String(raw);
}

function toNumber(raw: string): number | "" {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const asInt = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(asInt) ? asInt : "";
}

export function ContextPanel({ value, onChange }: Props) {
  return (
    <div className="context-panel" role="group" aria-label="Optional policy details">
      <div className="context-grid">
        {FIELDS.map((field) => (
          <label key={field.key} className="field">
            <span className="field-label">{field.label}</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder={field.placeholder}
              value={toNumberInput(value[field.key])}
              onChange={(e) =>
                onChange({ ...value, [field.key]: toNumber(e.target.value) })
              }
            />
            <span className="field-hint">{field.hint}</span>
          </label>
        ))}
      </div>
    </div>
  );
}