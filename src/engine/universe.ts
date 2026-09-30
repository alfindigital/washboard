// universe.ts — LiqGap owns; dipakai kedua engine (board + drill).
// Bands dihitung pada ELIGIBLE set saja (v>5k ∧ liq>500 ∧ ut≠null) — denominator
// adalah bagian dari bukti; bands hidup di artifact, bukan hardcode.
import type { SearchRow, Universe, UniverseBands } from "@/types";

export const ELIGIBLE = { V_MIN: 5_000, LIQ_MIN: 500, MIN_SAMPLE: 30 } as const;

const num = (v: unknown): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

/** Normalize one raw tks[] row → SearchRow. Missing → null, never false-zero. */
export function normSearchRow(t: Record<string, unknown>): SearchRow {
  return {
    platform: String(t.plt ?? ""),
    address: String(t.addr ?? ""),
    name: String(t.n ?? ""),
    symbol: String(t.s ?? ""),
    priceUsd: num(t.pu),
    pc24h: num(t.pc24h),
    v24h: num(t.v24h),
    mc: num(t.mc),
    liq: num(t.liq),
    ut24h: num(t.ut24h),
    firstPairTs: num(t.fpt),
    firstPoolTs: num(t.fpct),
    logo: str(t.l),
  };
}

export function isEligible(r: SearchRow): boolean {
  return (
    r.v24h !== null && r.v24h > ELIGIBLE.V_MIN &&
    r.liq !== null && r.liq > ELIGIBLE.LIQ_MIN &&
    r.ut24h !== null
  );
}

export function turnover(r: SearchRow): number | null {
  return r.v24h !== null && r.liq !== null && r.liq > 0 ? r.v24h / r.liq : null;
}

export function usdPerTrader(r: SearchRow): number | null {
  return r.v24h !== null && r.ut24h !== null && r.ut24h > 0 ? r.v24h / r.ut24h : null;
}

/** p-quantile: sorted[floor(p*n)] — matches the seed artifact numbers. */
export function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

/** Fraction of sorted values ≤ x (exact percentile rank, 0..1). */
export function percentileRank(sorted: number[], x: number): number {
  if (sorted.length === 0) return NaN;
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= x) lo = mid + 1;
    else hi = mid;
  }
  return lo / sorted.length;
}

function computeBands(rows: SearchRow[], scope: UniverseBands["scope"], asOf: string, sha256: string): UniverseBands {
  const utes = rows.map((r) => r.ut24h as number).sort((a, b) => a - b);
  const ratios = rows.map(turnover).filter((v): v is number => v !== null).sort((a, b) => a - b);
  const upts = rows.map(usdPerTrader).filter((v): v is number => v !== null).sort((a, b) => a - b);
  return {
    n: rows.length,
    asOf,
    sha256,
    scope,
    ut25: quantile(utes, 0.25),
    ut50: quantile(utes, 0.5),
    ratio75: quantile(ratios, 0.75),
    ratio95: quantile(ratios, 0.95),
    usdPerTrader75: quantile(upts, 0.75),
    churn75: null, // txs missing from search rows — drill-only
    utVals: utes,
    ratioVals: ratios,
    uptVals: upts,
  };
}

/** Load raw artifact (`liquiditygap-universe-*.json`) → computed Universe. */
export function loadUniverse(raw: {
  capturedAt: string;
  bodySha256: string;
  queries: number | string[];
  creditsSpent: number;
  rows: Record<string, unknown>[];
}): Universe {
  const rows = raw.rows.map(normSearchRow);
  const eligible = rows.filter(isEligible);
  const byChain = new Map<string, SearchRow[]>();
  for (const r of eligible) {
    const list = byChain.get(r.platform) ?? [];
    list.push(r);
    byChain.set(r.platform, list);
  }
  const perChain: Record<string, UniverseBands> = {};
  for (const [chain, list] of byChain) {
    // Chain gets its own bands only when n ≥ MIN_SAMPLE — else global fallback.
    if (list.length >= ELIGIBLE.MIN_SAMPLE) {
      perChain[chain] = computeBands(list, "chain", raw.capturedAt, raw.bodySha256);
    }
  }
  return {
    capturedAt: raw.capturedAt,
    sha256: raw.bodySha256,
    queries: Array.isArray(raw.queries) ? raw.queries.length : raw.queries,
    credits: raw.creditsSpent,
    rows,
    eligibleN: eligible.length,
    bands: {
      global: computeBands(eligible, "global", raw.capturedAt, raw.bodySha256),
      perChain,
    },
  };
}

/** Bands for a row — per-chain when the chain has n≥30 eligible, else global. */
export function bandsFor(u: Universe, platform: string, _mcapUsd: number | null): UniverseBands {
  return u.bands.perChain[platform] ?? u.bands.global;
}

/** ut25 / upt75 etc for the drill FundingInput.universe shape. */
export function fundingUniverse(u: Universe, platform: string) {
  const b = bandsFor(u, platform, null);
  return {
    ut25: b.ut25,
    usdPerTrader75: b.usdPerTrader75,
    churn75: b.churn75,
    n: b.n,
    asOf: b.asOf,
    utVals: b.utVals,
    uptVals: b.uptVals,
  };
}
