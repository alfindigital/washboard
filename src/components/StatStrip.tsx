import type { BoardStats } from "@/types";

export function StatStrip({ stats }: { stats: BoardStats }) {
  const items: { k: string; v: string | number; s?: string }[] = [
    { k: "universe rows", v: stats.nTotal.toLocaleString("en-US"), s: `${stats.queries} queries · ${stats.credits} credits` },
    { k: "eligible set", v: stats.nEligible.toLocaleString("en-US"), s: "v>$5k ∧ liq>$500 ∧ ut reported" },
    { k: "turnover anomaly", v: stats.nFlaggedGap, s: "independent flag" },
    { k: "empty room", v: stats.nEmptyRoom, s: "independent flag" },
    { k: "dual-flagged", v: stats.nDual, s: "both lenses fire" },
    { k: "waves", v: stats.nWaves, s: "same-shape clusters ≥4" },
    { k: "dormant pools", v: stats.nDormant, s: "v=0, liq>500" },
    { k: "excluded", v: stats.nExcluded, s: "labeled, not hidden" },
  ];
  return (
    <div className="statgrid" role="list" aria-label="universe statistics">
      {items.map((i) => (
        <div className="stat" role="listitem" key={i.k}>
          <div className="k">{i.k}</div>
          <div className="v">{i.v}</div>
          {i.s ? <div className="s">{i.s}</div> : null}
        </div>
      ))}
    </div>
  );
}
