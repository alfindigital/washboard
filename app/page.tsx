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
        <strong>Two separate lenses over the same tape.</strong> The left flag asks{" "}
        <em>is this turnover real?</em> (volume ÷ pool depth, vs CMC-reported unique traders). The right
        flag asks <em>is this price move backed by a crowd?</em> (+3% move on a thin trader count). They
        never merge into one score — a row can be flagged by either, both, or neither. Snapshot of{" "}
        {stats.universeAt.slice(0, 10)} · sha256 {stats.sha256.slice(0, 12)}…
      </div>

      <div style={{ marginTop: 14 }}>
        <StatStrip stats={stats} />
      </div>

      <BoardTable rows={view.rows} />
      <Waves waves={view.waves} />

      <section className="panel" style={{ marginTop: 18 }} aria-label="dormant pools">
        <h2>Dormant pools <span className="dim mono-sm">({view.dormant.length})</span></h2>
        <p className="dim" style={{ fontSize: 12.5, marginTop: 0 }}>
          Inverse board: liquidity still parked, reported volume zero. A dead tape can also be dressed up later.
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
