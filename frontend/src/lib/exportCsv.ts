import type { Analysis } from "../types";

function cell(value: unknown): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function caseToCsv(analysis: Analysis): string {
  const header = [
    "verdict",
    "fight_score",
    "category",
    "label",
    "grounds_strength",
    "why",
    "action_guide",
    "evidence",
  ];
  const rows = analysis.assessments.map((a) =>
    [
      analysis.verdict.label,
      analysis.verdict.fight_score,
      a.category,
      a.label,
      a.grounds_strength,
      a.why,
      a.action_guide ?? "",
      a.evidence.join(" | "),
    ]
      .map(cell)
      .join(","),
  );
  return [header.map(cell).join(","), ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}