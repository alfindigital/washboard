"use client";

import { useMemo, useState } from "react";
import type { BoardRow } from "@/types";
import { fmtAge, fmtPct, fmtUsd } from "@/lib/ui";
import { DualMark, FundChip, GapChip } from "@/components/FlagChip";

type Filter = "all" | "gap" | "empty" | "dual" | "dormant" | "excluded" | "below" | "nodata";
type SortKey = "rank" | "pc24h" | "v24h" | "liq" | "turnover" | "ut24h" | "ageDays";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "all rows" },
  { key: "dual", label: "dual-flagged" },
  { key: "gap", label: "turnover anomaly" },
  { key: "empty", label: "empty room" },
  { key: "dormant", label: "dormant" },
  { key: "excluded", label: "excluded" },
  { key: "below", label: "below floor" },
  { key: "nodata", label: "no data" },
];

const flagged = (lvl: string) => lvl === "WARN" || lvl === "DANGER";

function pass(r: BoardRow, f: Filter): boolean {
  switch (f) {
    case "all": return true;
    case "dual": return r.dual;
    case "gap": return flagged(r.gap.level);
    case "empty": return flagged(r.funding.level);
    case "dormant": return r.gap.state === "DORMANT";
    case "excluded": return r.gap.state === "EXCLUDED";
    case "below": return r.gap.state === "BELOW_FLOOR";
    case "nodata": return r.gap.state === "NO_DATA";
  }
}

export function BoardTable({ rows }: { rows: BoardRow[] }) {
  const [filter, setFilter] = useState<Filter>("dual");
  const [sort, setSort] = useState<SortKey>("rank");
  const [desc, setDesc] = useState(true);
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const lq = q.trim().toLowerCase();
    let list = rows.filter((r) => pass(r, filter));
    if (lq) {
      list = list.filter(
        (r) =>
          r.symbol.toLowerCase().includes(lq) ||
          r.name.toLowerCase().includes(lq) ||
          r.address.toLowerCase().startsWith(lq),
      );
    }
    const val = (r: BoardRow): number => {
      switch (sort) {
        case "pc24h": return r.pc24h ?? -Infinity;
        case "v24h": return r.v24h ?? -Infinity;
        case "liq": return r.liq ?? -Infinity;
        case "turnover": return r.metrics.turnover ?? -Infinity;
        case "ut24h": return r.ut24h ?? -Infinity;
        case "ageDays": return r.ageDays ?? Infinity;
        default: return r.rank;
      }
    };
    list = [...list].sort((a, b) => {
      const d = val(a) - val(b);
      return (desc ? -d : d) || a.rank - b.rank;
    });
    return list.slice(0, 400);
  }, [rows, filter, sort, desc, q]);

  const sortBtn = (key: SortKey, label: string, num = false) => (
    <button
      onClick={() => {
        if (sort === key) setDesc(!desc);
        else { setSort(key); setDesc(true); }
      }}
      aria-sort={sort === key ? (desc ? "descending" : "ascending") : undefined}
    >
      {label} {sort === key ? (desc ? "↓" : "↑") : ""}
    </button>
  );

  return (
    <section aria-label="token blotter">
      <div className="line" role="toolbar" aria-label="row filters" style={{ marginTop: 14 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className="chip"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <input
          type="text"
          className="mono-sm"
          aria-label="filter by symbol, name, or address"
          placeholder="filter: symbol / address…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            border: "1px solid var(--line-dark)", background: "var(--card)",
            padding: "4px 8px", fontSize: 11, width: 200,
          }}
        />
        <span className="mono-sm dim" aria-live="polite">{shown.length} shown</span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="blotter">
          <thead>
            <tr>
              <th>{sortBtn("rank", "#")}</th>
              <th>token</th>
              <th className="hide-sm">chain</th>
              <th className="num">{sortBtn("pc24h", "24h", true)}</th>
              <th className="num">{sortBtn("v24h", "volume", true)}</th>
              <th className="num hide-sm">{sortBtn("liq", "liquidity", true)}</th>
              <th className="num">{sortBtn("turnover", "turnover", true)}</th>
              <th className="num">{sortBtn("ut24h", "traders", true)}</th>
              <th className="hide-sm">{sortBtn("ageDays", "age")}</th>
              <th>volume vs people</th>
              <th>price vs people</th>
              <th className="hide-sm">days</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.identity}>
                <td className="num dim">{r.rank}</td>
                <td className="symcell">
                  <a className="link" href={`/drill?platform=${encodeURIComponent(r.platform)}&address=${encodeURIComponent(r.address)}`}>
                    {r.symbol}
                  </a>
                  <span className="name" title={r.address}>{r.name}</span>
                </td>
                <td className="hide-sm mono-sm">{r.platform}</td>
                <td className={`num ${r.pc24h !== null && r.pc24h < 0 ? "neg" : "pos"}`}>{fmtPct(r.pc24h)}</td>
                <td className="num">{fmtUsd(r.v24h)}</td>
                <td className="num hide-sm">{fmtUsd(r.liq)}</td>
                <td className="num">{r.metrics.turnover === null ? "—" : `${r.metrics.turnover.toFixed(1)}×`}</td>
                <td className="num" title="CMC-reported unique traders — provider counter, not ground truth">
                  {r.ut24h ?? "—"}
                </td>
                <td className="hide-sm mono-sm">{fmtAge(r.ageDays)}</td>
                <td><GapChip flag={r.gap} /> {r.dual ? <DualMark /> : null}</td>
                <td><FundChip flag={r.funding} /></td>
                <td className="hide-sm mono-sm" title="consecutive snapshots flagged">
                  {r.daysFlagged.gap + r.daysFlagged.funding > 0
                    ? `${r.daysFlagged.gap}g/${r.daysFlagged.funding}f`
                    : "—"}
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={12} className="dim" style={{ textAlign: "center", padding: 24 }}>
                no rows match this filter — try &ldquo;all rows&rdquo;
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
