// gap.ts — board turnover engine. PERCENTILE-ONLY (user decision 30 Sep):
// thresholds are born from the eligible-universe distribution, not opinion.
import type { ExclusionClass, GapFlag, GapMetrics, GapState, SearchRow, UniverseBands } from "@/types";
import { ELIGIBLE, percentileRank, turnover, usdPerTrader } from "@/engine/universe";

export const GAP_THRESHOLDS = {
  minVolUsd: ELIGIBLE.V_MIN,
  minLiqUsd: ELIGIBLE.LIQ_MIN,
  matureMcapUsd: 100_000_000,
} as const;

const fmt = (v: number, d = 2) =>
  v >= 100 ? v.toFixed(0) : v.toFixed(d).replace(/\.?0+$/, "");

export function evalGap(
  row: SearchRow,
  bands: UniverseBands,
  excl: ExclusionClass,
): { gap: GapFlag; metrics: GapMetrics } {
  const metrics: GapMetrics = {
    turnover: turnover(row),
    usdPerTrader: usdPerTrader(row),
    ratioPercentile: null,
    utPercentile: null,
  };
  if (metrics.turnover !== null) {
    metrics.ratioPercentile = percentileRank(bands.ratioVals, metrics.turnover);
  }
  if (row.ut24h !== null) {
    metrics.utPercentile = percentileRank(bands.utVals, row.ut24h);
  }

  const done = (state: GapState, level: GapFlag["level"], reasons: string[], falsifier: string, exclClass?: GapFlag["exclClass"]): { gap: GapFlag; metrics: GapMetrics } => ({
    gap: { state, level, reasons, falsifier, exclClass },
    metrics,
  });

  if (excl) {
    return done("EXCLUDED", "INFO", [`excluded asset class: ${excl}`], "n/a — excluded asset class", excl);
  }
  if (row.v24h === null || row.liq === null || row.ut24h === null || row.liq <= 0) {
    const missing = [row.v24h === null && "v24h", row.liq === null && "liq", row.ut24h === null && "ut24h"].filter(Boolean);
    return done("NO_DATA", "INFO", [`missing fields: ${missing.join(", ") || "liq≤0"} — CMC did not report`], "n/a — provider did not report fields");
  }
  // DORMANT: volume ≈ 0 while the pool still holds liquidity — inverse board.
  if (row.v24h === 0 && row.liq > ELIGIBLE.LIQ_MIN) {
    return done("DORMANT", "INFO", [`$0 reported 24h volume against $${fmt(row.liq / 1000, 0)}k pool depth`], "invalid if volume returns");
  }
  if (row.v24h <= GAP_THRESHOLDS.minVolUsd || row.liq <= GAP_THRESHOLDS.minLiqUsd) {
    return done("BELOW_FLOOR", "INFO", [`below flag floor (v≤$${GAP_THRESHOLDS.minVolUsd / 1000}k or liq≤$${GAP_THRESHOLDS.minLiqUsd})`], "n/a — below substance floor");
  }

  const ratio = metrics.turnover ?? 0;
  const ut = row.ut24h;
  const scope = bands.scope === "chain" ? `${bands.n} ${row.platform} rows` : `global (${bands.n} rows)`;
  const reasons: string[] = [];
  if (metrics.ratioPercentile !== null) {
    reasons.push(`turnover ${fmt(ratio)}× vs ${scope} p75 ${fmt(bands.ratio75)} / p95 ${fmt(bands.ratio95)}`);
  }
  if (metrics.utPercentile !== null) {
    reasons.push(`${ut} reported traders vs ${scope} p25 ${fmt(bands.ut25, 0)} / p50 ${fmt(bands.ut50, 0)}`);
  }

  const thinUt = ut <= bands.ut25;
  const midUt = ut <= bands.ut50;
  const highRatio75 = ratio >= bands.ratio75;
  const highRatio95 = ratio >= bands.ratio95;

  let state: GapState;
  let level: GapFlag["level"];
  let falsifier = "";
  if (highRatio95 && thinUt) {
    state = "TURNOVER_ANOMALY";
    level = "DANGER";
    falsifier = `invalid if ${row.platform} reported traders rise above p25 (${fmt(bands.ut25, 0)}) or turnover falls below p95 (${fmt(bands.ratio95)})`;
  } else if ((highRatio75 && thinUt) || (highRatio95 && midUt)) {
    state = "TURNOVER_ANOMALY";
    level = "WARN";
    falsifier = `invalid if trader count rises above p50 (${fmt(bands.ut50, 0)}) or turnover falls below p75 (${fmt(bands.ratio75)})`;
  } else if (highRatio75 && !midUt) {
    state = "CROWDED_TAPE";
    level = "INFO";
    falsifier = "hot but broad — participation is proportional";
  } else if (!highRatio75 && thinUt) {
    state = "ACTIVE_THIN";
    level = "INFO";
    falsifier = "small and thin — context, not an anomaly";
  } else {
    state = "CROWDED_TAPE"; // default clean bucket for eligible rows
    level = "CLEAN";
    falsifier = "";
  }

  // Mature gate (shared with funding.ts): cap DANGER → WARN for ≥$100M mcap.
  if ((row.mc ?? 0) >= GAP_THRESHOLDS.matureMcapUsd && level === "DANGER") {
    level = "WARN";
    reasons.push(`mature market cap ($${fmt((row.mc ?? 0) / 1e6, 0)}M) — capped at WARN`);
  }
  if (!reasons.length && metrics.turnover !== null) {
    reasons.push(`turnover ${fmt(ratio)}×, ${ut} reported traders — inside normal band`);
  }
  return done(state, level, reasons, falsifier);
}
