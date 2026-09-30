import type { BoardStats } from "@/types";

export function StatStrip({ stats }: { stats: BoardStats }) {
  const items: { v: string; k: string; hot?: boolean }[] = [
    { v: stats.nTotal.toLocaleString("en-US"), k: "rows scanned" },
    { v: stats.nPeer.toLocaleString("en-US"), k: "peer set" },
    { v: String(stats.nFlaggedGap), k: "turnover anomaly", hot: true },
    { v: String(stats.nEmptyRoom), k: "empty room", hot: true },
    { v: String(stats.nDual), k: "dual-flagged", hot: true },
    { v: String(stats.nWaves), k: "same-shape waves" },
  ];
  return (
    <div className="hero-stats" aria-label="universe statistics">
      {items.map((i) => (
        <div className={`hero-stat${i.hot ? " hot" : ""}`} key={i.k}>
          <div className="v">{i.v}</div>
          <div className="k">{i.k}</div>
        </div>
      ))}
    </div>
  );
}
