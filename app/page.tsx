import { getBoard } from "@/lib/board";
import { BoardTable } from "@/components/BoardTable";
import { StatStrip } from "@/components/StatStrip";
import { Waves } from "@/components/Waves";
import { fmtUsd } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default function BoardPage() {
  const view = getBoard();
  const { stats } = view;
  return (
    <div>
      <div className="notice">
        <strong>Two lenses, one tape.</strong> Turnover anomaly: volume ÷ pool depth vs.
        reported traders. Empty room: a +3% move on a thin crowd. Never one score.
        Snapshot {stats.universeAt.slice(0, 10)} · sha256 {stats.sha256.slice(0, 12)}… ·{" "}
        <a className="link" href="/api/board">raw JSON</a>
      </div>

      <StatStrip stats={stats} />

      <BoardTable rows={view.rows} />
      <Waves waves={view.waves} />

      <section className="panel" style={{ marginTop: 18 }} aria-label="dormant pools">
        <h2>Dormant pools <span className="dim mono-sm">({view.dormant.length})</span></h2>
        <p className="dim" style={{ fontSize: 13, marginTop: 0 }}>
          Liquidity parked, reported volume zero.
        </p>
        <div className="line">
          {view.dormant.slice(0, 24).map((r) => (
            <a
              key={r.identity}
              className="chip"
              href={`/drill?platform=${encodeURIComponent(r.platform)}&address=${encodeURIComponent(r.address)}`}
              title={`${r.platform} · pool ${fmtUsd(r.liq)} · ${r.ut24h ?? "?"} reported traders`}
            >
              {r.symbol} · {fmtUsd(r.liq)}
            </a>
          ))}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18 }} aria-label="chain weather">
        <h2>Chain weather</h2>
        <div className="line">
          {stats.chainWeather.slice(0, 14).map((c) => (
            <span key={c.platform} className="chip" title={`${c.flagged} of ${c.eligible} eligible rows flagged`}>
              <span className="dot" style={{ background: c.flagged / Math.max(1, c.eligible) > 0.05 ? "var(--rust)" : "var(--line-dark)" }} />
              {c.platform}: {c.flagged}/{c.eligible}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
