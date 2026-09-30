import type { DrillRecord } from "@/types";
import { flagClass, fmtAge, fmtPct, fmtUsd } from "@/lib/ui";
import { FundChip, DualMark } from "@/components/FlagChip";

const agreeLabel: Record<string, string> = {
  consensus: "jev agrees with the rules on both flags",
  contested: "jev disagrees with at least one flag — shown openly",
  lean: "jev probability sits in the grey zone (0.35–0.65)",
  unavailable: "jev unavailable — rules output only",
};

export function DrillCard({ rec }: { rec: DrillRecord }) {
  const s = rec.subject;
  const er = rec.flags.empty_room;
  const fd = rec.flags.fading;
  const dual =
    (er.level === "WARN" || er.level === "DANGER") && (fd.level === "WARN" || fd.level === "DANGER");
  const pcp = (v: number | null) => (
    <span className={v !== null && v < 0 ? "neg" : "pos"}>{fmtPct(v)}</span>
  );
  return (
    <article className="panel" aria-label={`drill card ${s.symbol}`}>
      <header style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 24, margin: 0 }}>
          {s.symbol} <span className="dim" style={{ fontSize: 14, fontWeight: 400 }}>{s.name}</span>
        </h2>
        <span className="mono-sm">{s.platform}</span>
        <span className="mono-sm dim">{s.address}</span>
      </header>

      <div className="statgrid" style={{ marginTop: 12 }}>
        <div className="stat"><div className="k">price 24h</div><div className="v">{pcp(s.pc24h)}</div></div>
        <div className="stat"><div className="k">unique traders 24h</div><div className="v">{rec.metrics.ut24h ?? "—"}</div>
          <div className="s">CMC-reported — provider counter</div></div>
        <div className="stat"><div className="k">$ per trader</div><div className="v">{fmtUsd(rec.metrics.usdPerTrader)}</div></div>
        <div className="stat"><div className="k">churn</div><div className="v">{rec.metrics.churn24h === null ? "—" : `${rec.metrics.churn24h.toFixed(1)}tx`}</div>
          <div className="s">transactions per reported trader</div></div>
        <div className="stat"><div className="k">pool age</div><div className="v">{fmtAge(s.poolAgeDays ?? null)}</div></div>
        <div className="stat"><div className="k">mcap / liq</div><div className="v" style={{ fontSize: 15 }}>{fmtUsd(s.mcap ?? null)} / {fmtUsd(s.liqUsd ?? null)}</div>
          {rec.data.mcPriceAnomaly ? <div className="s neg">mc/liq outside [0.1, 1e4] — reported values conflict</div> : null}</div>
      </div>

      {/* two independent flags — never a composite score */}
      <div className="line" style={{ marginTop: 16 }}>
        <div>
          <span className={flagClass(er.level)} style={{ fontSize: 12, padding: "5px 10px" }}>
            EMPTY ROOM — {er.level === "CLEAN" ? "not flagged" : er.level}
          </span>
          {dual ? <DualMark /> : null}
        </div>
        <p className="dim" style={{ fontSize: 12.5, margin: "4px 0 10px" }}>
          price moved ≥3% on thin participation. {er.falsifier}.
        </p>
        <div>
          <span className={flagClass(fd.level)} style={{ fontSize: 12, padding: "5px 10px" }}>
            FADING CROWD — {fd.level === "CLEAN" ? "not flagged" : fd.level}
          </span>
        </div>
        <p className="dim" style={{ fontSize: 12.5, margin: "4px 0 0" }}>
          green 24h while short windows decay. {fd.falsifier}.
        </p>
      </div>

      <h3 style={{ marginTop: 18 }}>window ladder</h3>
      <table className="ladder" aria-label="per-window stats">
        <thead>
          <tr><th>window</th><th>move</th><th>traders</th><th>txs</th><th>buys</th><th>sells</th><th>volume</th></tr>
        </thead>
        <tbody>
          {rec.ladder.map((w) => (
            <tr key={w.key}>
              <td>{w.key}</td>
              <td>{pcp(w.pct)}</td>
              <td>{w.uniqueTraders ?? "—"}</td>
              <td>{w.txs ?? "—"}</td>
              <td>{w.buyTxs ?? "—"}</td>
              <td>{w.sellTxs ?? "—"}</td>
              <td>{fmtUsd(w.volUsd)}</td>
            </tr>
          ))}
          {rec.ladder.length === 0 && (
            <tr><td colSpan={7} className="dim">no window stats reported by the provider</td></tr>
          )}
        </tbody>
      </table>

      {rec.jev ? (
        <div className="notice" style={{ marginTop: 14 }}>
          <strong>second opinion (jev, second-pass only):</strong>{" "}
          empty-room probability {rec.jev.emptyRoomProb === null ? "—" : rec.jev.emptyRoomProb.toFixed(2)} ·
          fading probability {rec.jev.fadingProb === null ? "—" : ` ${rec.jev.fadingProb.toFixed(2)}`} ·{" "}
          {agreeLabel[rec.jev.agreement]}. It reads the same computed metrics — it never overrides the flags.
        </div>
      ) : null}

      <div className="footnote">
        <p style={{ margin: "0 0 4px" }}>{rec.meta.why}</p>
        <p style={{ margin: "0 0 4px" }}>
          Observed from CMC-reported fields. Addresses are not entities. Not a prediction — describes the
          last 24h window. Universe-bounded: comparisons are vs the {rec.data.eligibleN}-row eligible
          snapshot of {rec.data.universeAt.slice(0, 10)}.
        </p>
        <p className="mono-hash" style={{ margin: 0 }}>
          receipts: {rec.receipts.map((r) => `${r.call} sha ${r.bodySha256.slice(0, 10)}`).join(" · ")} ·
          rules {rec.rulesVersion} · mode {rec.mode} · {rec.generatedAt}
        </p>
      </div>
    </article>
  );
}
