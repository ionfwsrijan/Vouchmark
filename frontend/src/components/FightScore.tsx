interface Props {
  score: number;
  tone: "clay" | "ok" | "amber";
}

const TONE_COLORS: Record<Props["tone"], string> = {
  clay: "#d6533f",
  ok: "#178543",
  amber: "#d97706",
};

export function FightScore({ score, tone }: Props) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const pct = clamped / 100;

  return (
    <div className="fight-score" aria-label={`Fight intensity ${clamped} out of 100`}>
      <svg width="92" height="92" viewBox="0 0 92 92" role="img">
        <circle
          cx="46"
          cy="46"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.20)"
          strokeWidth="9"
        />
        <circle
          cx="46"
          cy="46"
          r={r}
          fill="none"
          stroke={TONE_COLORS[tone]}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform="rotate(-90 46 46)"
        />
      </svg>
      <div className="fight-score-text">
        <span className="fight-score-number">{clamped}</span>
        <span className="fight-score-unit">/ 100</span>
      </div>
    </div>
  );
}