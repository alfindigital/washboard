// funding.ts — FundingSpot drill engine. Contract VERBATIM from
// ideas/FundingSpot-plan.md §4: FUNDING_THRESHOLDS, FlagState, FundingInput,
// evalFunding → { emptyRoom, fadingCrowd, metrics, mature }.
// Angka dari kode — kata dari AI. Deterministik, nol network.
import type { FlagState, FundingFlag, FundingInput, FundingMetrics, FundingResult, WindowStat } from "@/types";
import { FUNDING_THRESHOLDS } from "@/types";
import { percentileRank, quantile } from "@/engine/universe";
export { FUNDING_THRESHOLDS };

const WIN = { "1m": 1 / 60, "5m": 5 / 60, "1h": 1, "4h": 4, "24h": 24 } as const;

function windowOf(windows: WindowStat[], tp: string): WindowStat | undefined {
  return windows.find((w) => w.tp === tp);
}

function metricsOf(windows: WindowStat[], utVals: number[] | undefined): FundingMetrics {
  const w24 = windowOf(windows, "24h");
  const w1 = windowOf(windows, "1h");
  const w4 = windowOf(windows, "4h");
  const w5m = windowOf(windows, "5m");
  const ut24h = w24?.uniqueTraders ?? null;
  const churn24h =
    w24?.txCount != null && ut24h != null && ut24h > 0 ? w24.txCount / ut24h : null;
  const usdPerTrader =
    w24?.volUsd != null && ut24h != null && ut24h > 0 ? w24.volUsd / ut24h : null;
  const pace = (w: WindowStat | undefined, hours: number): number | null => {
    if (w?.uniqueTraders == null || ut24h == null || ut24h <= 0 || hours <= 0) return null;
    return w.uniqueTraders / hours / (ut24h / 24);
  };
  return {
    ut24h,
    utPercentile: ut24h !== null && utVals?.length ? percentileRank(utVals, ut24h) : null,
    churn24h,
    usdPerTrader,
    pace: { "1h": pace(w1, WIN["1h"]), "4h": pace(w4, WIN["4h"]) },
    momentum: {
      "5m": w5m?.priceChange ?? null,
      "1h": w1?.priceChange ?? null,
      "4h": w4?.priceChange ?? null,
      "24h": w24?.priceChange ?? null,
    },
  };
}

const flag = (state: FlagState, level: FundingFlag["level"], reasons: string[], falsifier: string): FundingFlag => ({
  state,
  level,
  reasons,
  falsifier,
});

export function evalFunding(input: FundingInput): FundingResult {
  const m = metricsOf(input.windows, input.universe?.utVals);
  const mature = (input.token.mcapUsd ?? 0) >= FUNDING_THRESHOLDS.matureMcapUsd;
  const pc24h = m.momentum["24h"];
  const uni = input.universe;
  const uniReady = uni !== null && uni.n >= 30;

  // ---- shared insufficiency ----
  const insufficient = (reasons: string[]) => ({
    emptyRoom: flag("INSUFFICIENT", "INSUFFICIENT", reasons, "n/a — provider fields missing"),
    fadingCrowd: flag("INSUFFICIENT", "INSUFFICIENT", reasons, "n/a — provider fields missing"),
    metrics: m,
    mature,
  });
  if (input.windows.length === 0) return insufficient(["no window stats (sts[] empty) — CMC did not report"]);
  if (m.ut24h === null) return insufficient(["ut24h missing — CMC did not report unique traders"]);
  if (pc24h === null) return insufficient(["pc24h missing — CMC did not report a 24h price change"]);

  // ---- Flag A: EMPTY_ROOM (guard: pc24h ≥ +3%) ----
  let emptyRoom: FundingFlag;
  const erReasons: string[] = [];
  const absoluteFallback = !uniReady;
  if (absoluteFallback) erReasons.push("absolute fallback — no percentile universe");
  if (pc24h < FUNDING_THRESHOLDS.minMoveEmpty) {
    emptyRoom = flag("NO_MOVE", "CLEAN", [`24h move ${(pc24h * 100).toFixed(1)}% below +3% guard`], "invalid if 24h move ≥ +3%");
  } else {
    erReasons.push(`24h move +${(pc24h * 100).toFixed(1)}% on ${m.ut24h} reported unique traders`);
    const thinPct = m.utPercentile !== null ? m.utPercentile <= FUNDING_THRESHOLDS.thinUtPct : m.ut24h <= (uni?.ut25 ?? 0);
    const fatUsd =
      m.usdPerTrader !== null &&
      (uniReady ? m.usdPerTrader >= uni!.usdPerTrader75 : absoluteFallback);
    let level: FundingFlag["level"] | null = null;
    if (thinPct || fatUsd) {
      level = "DANGER";
      if (thinPct) erReasons.push(`trader breadth ≤ p25 of peer universe${uniReady ? ` (p25=${uni!.ut25})` : ""}`);
      if (fatUsd && m.usdPerTrader !== null) erReasons.push(`$${Math.round(m.usdPerTrader).toLocaleString("en-US")} per reported trader${uniReady ? ` ≥ p75 ($${Math.round(uni!.usdPerTrader75)})` : ""}`);
    } else if (uniReady) {
      const upt50 = uni!.uptVals?.length ? quantile(uni!.uptVals, 0.5) : uni!.usdPerTrader75 / 2;
      const borderline =
        m.utPercentile !== null && m.utPercentile <= 0.5 &&
        m.usdPerTrader !== null && m.usdPerTrader >= upt50;
      const churnHot = m.churn24h !== null && uni!.churn75 !== null && m.churn24h >= uni!.churn75;
      if (borderline || churnHot) {
        level = "WARN";
        if (borderline) erReasons.push("borderline breadth — ut ≤ p50 with high $/trader");
        if (churnHot) erReasons.push(`churn ${m.churn24h!.toFixed(1)} txs/trader ≥ p75 — bot-tape tell`);
      }
    }
    if (absoluteFallback && m.ut24h < 200 && (m.usdPerTrader ?? 0) > 3000) {
      level = "DANGER";
      erReasons.push("ut < 200 and $/trader > $3k — absolute fallback flag");
    }
    if (mature && level === "DANGER") {
      level = "WARN";
      erReasons.push("mature market cap — arb/MM flow is thin-ut by design; capped at WARN");
    }
    emptyRoom = level === null
      ? flag("CROWDED", "CLEAN", [...erReasons, "participation breadth adequate for the move"], "invalid if trader breadth falls to p25")
      : flag("EMPTY_ROOM", level, erReasons, "invalid if trader breadth rises above p25 AND $/trader falls below p75 — both branches must clear");
  }

  // ---- Flag B: FADING_CROWD (guard: pc24h ≥ +2%) ----
  let fadingCrowd: FundingFlag;
  const fcReasons: string[] = [];
  const pc1h = m.momentum["1h"];
  const pc4h = m.momentum["4h"];
  const pace4h = m.pace["4h"];
  if (pc24h < FUNDING_THRESHOLDS.minMoveFading) {
    fadingCrowd = flag("NO_MOVE", "CLEAN", [`24h move ${(pc24h * 100).toFixed(1)}% below +2% guard`], "invalid if 24h move ≥ +2%");
  } else if (pc1h === null || pc4h === null || pace4h === null) {
    fadingCrowd = flag("INSUFFICIENT", "INSUFFICIENT", ["1h/4h windows missing — cannot read trajectory"], "n/a — window data missing");
  } else {
    if (pc1h < 0 && pc4h < 0 && pace4h < FUNDING_THRESHOLDS.fadingPace) {
      fadingCrowd = flag("FADING", "DANGER", [
        `green 24h (+${(pc24h * 100).toFixed(1)}%) but 1h ${(pc1h * 100).toFixed(1)}% and 4h ${(pc4h * 100).toFixed(1)}% negative`,
        `reported-participant density 4h = ${pace4h.toFixed(2)}× daily baseline`,
      ], "invalid if pc1h returns ≥ 0 or 4h trader density recovers ≥ 1×");
    } else if (pc1h < 0 || pc4h < 0 || pace4h < 0.8) {
      fadingCrowd = flag("FADING", "WARN", [
        `weaker leg: 1h ${(pc1h * 100).toFixed(1)}%, 4h ${(pc4h * 100).toFixed(1)}%, density ${pace4h.toFixed(2)}×`,
      ], "invalid if short windows return positive with density ≥ 1×");
    } else {
      fadingCrowd = flag("HOLDING", "CLEAN", [
        `short windows hold (1h ${(pc1h * 100).toFixed(1)}%, 4h ${(pc4h * 100).toFixed(1)}%) with density ${pace4h.toFixed(2)}×`,
      ], "invalid if 1h/4h flip negative with density < 1×");
    }
  }

  return { emptyRoom, fadingCrowd, metrics: m, mature };
}

/** Board-side EMPTY_ROOM preview from a search row (no sts[] → FADING stays drill-only). */
export function evalFundingBoard(
  row: { pc24h: number | null; ut24h: number | null; v24h: number | null; mc: number | null },
  uni: { ut25: number; usdPerTrader75: number; n: number } | null,
): FundingFlag {
  if (row.pc24h === null || row.ut24h === null || row.v24h === null) {
    return flag("INSUFFICIENT", "INSUFFICIENT", ["search row missing pc24h/ut24h/v24h"], "n/a — provider did not report");
  }
  if (row.pc24h < FUNDING_THRESHOLDS.minMoveEmpty) {
    return flag("NO_MOVE", "CLEAN", [`24h move ${(row.pc24h * 100).toFixed(1)}% below +3% guard`], "invalid if 24h move ≥ +3%");
  }
  const upt = row.ut24h > 0 ? row.v24h / row.ut24h : null;
  const mature = (row.mc ?? 0) >= FUNDING_THRESHOLDS.matureMcapUsd;
  const thin = uni !== null ? row.ut24h <= uni.ut25 : row.ut24h < 200;
  const fat = uni !== null ? (upt !== null && upt >= uni.usdPerTrader75) : (upt !== null && upt > 3000);
  const reasons = [`+${(row.pc24h * 100).toFixed(1)}% on ${row.ut24h} reported traders`];
  if (thin) reasons.push(`trader count ≤ p25${uni ? ` (${uni.ut25})` : ""}`);
  if (fat && upt !== null) reasons.push(`$${Math.round(upt).toLocaleString("en-US")} per reported trader${uni ? ` ≥ p75 ($${Math.round(uni.usdPerTrader75)})` : ""}`);
  if (thin || fat) {
    const level: FundingFlag["level"] = mature ? "WARN" : "DANGER";
    if (mature) reasons.push("mature market cap — capped at WARN");
    return flag("EMPTY_ROOM", level, reasons, "invalid if trader breadth rises above p25 AND $/trader falls below p75 — both branches must clear");
  }
  if (uni !== null && row.ut24h <= uni.ut25 * 2) {
    if (mature) reasons.push("mature market cap — capped at WARN");
    return flag("EMPTY_ROOM", "WARN", [...reasons, "borderline breadth — near p25 band"], "invalid if trader breadth rises above p25 AND $/trader falls below p75");
  }
  return flag("CROWDED", "CLEAN", [...reasons, "breadth adequate"], "invalid if trader breadth falls to p25");
}
