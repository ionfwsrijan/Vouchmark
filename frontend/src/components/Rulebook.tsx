import { useMemo, useState } from "react";
import type { UICopy } from "../i18n";
import {
  GROUNDS,
  GRIEVANCE_ARC,
  STRENGTH_LABELS,
  TIMELINES,
  type Ground,
  type Strength,
} from "../grounds";

const STRENGTH_FILTERS: Array<Strength | "all"> = [
  "all",
  "weak",
  "undetermined",
  "strong",
];

function matchGround(g: Ground, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${g.id} ${g.label} ${g.why} ${g.move}`.toLowerCase();
  return q.split(/\s+/).every((part) => hay.includes(part));
}

export function Rulebook({ t }: { t: UICopy }) {
  const [query, setQuery] = useState("");
  const [strength, setStrength] = useState<Strength | "all">("all");

  const visible = useMemo(
    () =>
      GROUNDS.filter(
        (g) => (strength === "all" || g.default === strength) && matchGround(g, query),
      ),
    [query, strength],
  );

  const counts: Record<Strength | "all", number> = useMemo(() => {
    const c: Record<Strength | "all", number> = { all: GROUNDS.length, weak: 0, undetermined: 0, strong: 0 };
    for (const g of GROUNDS) c[g.default] += 1;
    return c;
  }, []);

  const filterLabel: Record<Strength | "all", string> = {
    all: t.groundsFilterAll,
    weak: t.groundsFilterWeak,
    undetermined: t.groundsFilterUndetermined,
    strong: t.groundsFilterStrong,
  };

  return (
    <section className="rulebook" aria-label={t.groundsHeading}>
      <div className="workspace-heading rulebook-heading">
        <div>
          <p className="eyebrow">{t.groundsKicker}</p>
          <h1>{t.groundsHeading}</h1>
          <p className="heading-copy">{t.groundsIntro}</p>
        </div>
      </div>

      <div className="rules-toolbar">
        <input
          className="rules-search"
          type="search"
          aria-label={t.groundsSearchAria}
          placeholder={t.groundsSearchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="filter-row" role="group" aria-label={t.groundsSearchAria}>
          {STRENGTH_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              className={`filter-chip${strength === s ? " active" : ""}`}
              aria-pressed={strength === s}
              onClick={() => setStrength(s)}
            >
              {filterLabel[s]}
              <span className="filter-count">{counts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="grounds-empty">{t.groundsNone}</p>
      ) : (
        <div className="grounds-grid">
          {visible.map((g) => (
            <GroundCard key={g.id} g={g} t={t} />
          ))}
        </div>
      )}

      <div className="rules-meta">
        <ContentBlock title={t.timelinesTitle} items={TIMELINES} />
        <ContentBlock title={t.grievancesTitle} items={GRIEVANCE_ARC} numbered />
      </div>

      <p className="fine-print">{t.groundsNote}</p>
    </section>
  );
}

function StrengthChip({ strength }: { strength: Strength }) {
  return (
    <span className={`strength-chip ${strength}`}>
      {STRENGTH_LABELS[strength]}
    </span>
  );
}

function GroundCard({ g, t }: { g: Ground; t: UICopy }) {
  return (
    <article className="grounds-card">
      <div className="grounds-card-head">
        <h3>{g.label}</h3>
        <StrengthChip strength={g.default} />
      </div>
      <dl className="grounds-dl">
        <div>
          <dt>{t.groundsWhy}</dt>
          <dd>{g.why}</dd>
        </div>
        <div>
          <dt>{t.groundsMove}</dt>
          <dd>{g.move}</dd>
        </div>
      </dl>
      <span className="grounds-weight">
        <span className="weight-label">{t.groundsWeight}:</span>{" "}
        <em>{STRENGTH_LABELS[g.default]}</em>
      </span>
    </article>
  );
}

function ContentBlock({
  title,
  items,
  numbered = false,
}: {
  title: string;
  items: Array<[string, string]>;
  numbered?: boolean;
}) {
  return (
    <section className="rules-block">
      <h3>{title}</h3>
      <ol className={numbered ? "rules-list arc" : "rules-list"}>
        {items.map(([head, body]) => (
          <li key={head}>
            <strong>{head}</strong> — {body}
          </li>
        ))}
      </ol>
    </section>
  );
}