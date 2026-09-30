// api-drill.ts — drill orchestration. Resolve → dedup → fetch (live-gated) →
// evalFunding (deterministic) → Jev second opinion → hashable DrillRecord.
// Flags come from the rules engine only; Jev never overrides.
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { canonicalChain } from "@/lib/address";
import { createCmcClient, type Receipt } from "@/lib/cmc-client";
import {
  AmbiguousSymbolError,
  getPools,
  getTokenMeta,
  resolveToken,
  type TokenRef,
} from "@/lib/dex";
import { fundingUniverse } from "@/engine/universe";
import { getUniverse } from "@/lib/board";
import { evalFunding } from "@/engine/funding";
import { jevFunding, fundingAgreement } from "@/lib/jev-funding";
import { findCachedDrill, drillFilePath } from "@/lib/drill-index";
import { creditsRemaining, spendCredits } from "@/lib/rate-limit";
import { FUNDING_THRESHOLDS } from "@/types";
import type {
  DrillReceipt,
  DrillRecord,
  SearchRow,
  WindowStat,
} from "@/types";

const RULES_VERSION = "washboard-rules-1.0.0";
const SECS: Record<string, number> = { "1m": 60, "5m": 300, "1h": 3600, "4h": 14_400, "24h": 86_400 };

export interface DrillResult {
  id: string;
  record: DrillRecord;
  mode: "live" | "dedup";
}

export class DrillError extends Error {
  constructor(
    public code:
      | "AMBIGUOUS" | "NOT_FOUND" | "DRILL_UNAVAILABLE" | "LIVE_QUOTA"
      | "RATE_LIMITED" | "BAD_REQUEST" | "CMC_DOWN",
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

const apiKeys = (): string[] => {
  const raw = process.env.CMC_API_KEYS ?? process.env.CMC_API_KEY ?? "";
  return raw.split(",").map((k) => k.trim()).filter(Boolean);
};
const haveKey = () => apiKeys().length > 0;

function client() {
  // Serverless (Vercel) filesystems are read-only outside /tmp — receipts are
  // still returned in the response body; the on-disk log/cache is best-effort.
  const writable = process.env.VERCEL ? "/tmp" : process.cwd();
  return createCmcClient({
    apiKeys: apiKeys(),
    logPath: path.join(writable, "data", "logs", "cmc-requests.jsonl"),
    cacheDir: path.join(writable, "data", "cache"),
  });
}

const refFromRow = (r: SearchRow): TokenRef => ({
  platform: r.platform,
  address: r.address,
  name: r.name,
  symbol: r.symbol,
  mcapUsd: r.mc,
  vol24hUsd: r.v24h,
  priceChange24h: r.pc24h,
  liqUsd: r.liq,
  uniqueTraders24h: r.ut24h,
  logo: r.logo,
});

function universeRows(q: string): SearchRow[] {
  const u = getUniverse();
  const lq = q.trim().toLowerCase().replace(/^\$/, "");
  const byAddr = u.rows.filter((r) => r.address.toLowerCase() === lq);
  return byAddr.length ? byAddr : u.rows.filter((r) => r.symbol.toLowerCase() === lq);
}

async function resolveRef(input: { q?: string; platform?: string; address?: string }): Promise<{
  ref: TokenRef;
  row: SearchRow | null;
  searchReceipt: Receipt | null;
}> {
  const u = getUniverse();
  if (input.platform && input.address) {
    const platform = canonicalChain(input.platform) ?? input.platform;
    const row = u.rows.find(
      (r) => r.address.toLowerCase() === input.address!.toLowerCase() && r.platform === platform,
    );
    if (row) return { ref: refFromRow(row), row, searchReceipt: null };
    // Not in snapshot — fetch identity live by address.
    if (!haveKey()) {
      throw new DrillError("NOT_FOUND", `${input.address.slice(0, 12)}… not in snapshot universe and no live key`);
    }
    let token: TokenRef;
    let receipt: Receipt;
    try {
      const res = await resolveToken(client(), input.address, platform);
      token = res.token;
      receipt = res.receipt;
    } catch (e) {
      if (e instanceof AmbiguousSymbolError) {
        throw new DrillError("AMBIGUOUS", `address lookup is ambiguous — pick a candidate`, { candidates: e.candidates });
      }
      throw new DrillError("NOT_FOUND", `${platform}:${input.address.slice(0, 12)}… not found via live search`);
    }
    return { ref: token, row: null, searchReceipt: receipt };
  }

  const q = (input.q ?? "").trim();
  if (!q) throw new DrillError("BAD_REQUEST", "provide {q} or {platform,address}");

  const hits = universeRows(q);
  if (hits.length === 1) return { ref: refFromRow(hits[0]), row: hits[0], searchReceipt: null };
  if (hits.length > 1) {
    const distinctSymbols = new Set(hits.map((h) => h.symbol));
    if (distinctSymbols.size === 1) {
      // Same symbol on several pools — flag the ambiguity honestly.
      throw new DrillError("AMBIGUOUS", `"${q}" trades on ${hits.length} pools — pick an address`, {
        candidates: hits.slice(0, 10).map((h) => ({ platform: h.platform, address: h.address, symbol: h.symbol, v24h: h.v24h, liq: h.liq })),
      });
    }
    throw new DrillError("AMBIGUOUS", `"${q}" maps to ${distinctSymbols.size} distinct symbols`, {
      candidates: hits.slice(0, 10).map((h) => ({ platform: h.platform, address: h.address, symbol: h.symbol, name: h.name })),
    });
  }

  if (!haveKey()) {
    throw new DrillError("NOT_FOUND", `"${q}" not in snapshot universe and no live key configured`);
  }
  try {
    const { token, receipt } = await resolveToken(client(), q);
    const row = u.rows.find(
      (r) => r.address.toLowerCase() === token.address.toLowerCase() && r.platform === token.platform,
    ) ?? null;
    return { ref: token, row, searchReceipt: receipt };
  } catch (e) {
    if (e instanceof AmbiguousSymbolError) {
      throw new DrillError("AMBIGUOUS", `"${q}" is ambiguous — pick an address`, {
        candidates: e.candidates.map((c) => ({ platform: c.platform, address: c.address, symbol: c.symbol, name: c.name })),
      });
    }
    throw new DrillError("NOT_FOUND", `no DEX pool matches "${q}"`);
  }
}

function poolAgeDays(pubAts: (number | null | undefined)[], now: number): number | null {
  const ts = pubAts.filter((v): v is number => typeof v === "number" && v > 0).sort((a, b) => a - b)[0];
  return ts ? Math.max(0, (now - ts) / 86_400_000) : null;
}

const receiptOf = (call: string, r: Receipt | null): DrillReceipt[] =>
  r ? [{ call, path: r.endpoint, fetchedAt: r.ts, bodySha256: r.sha256 }] : [];

function whyLine(ref: TokenRef, m: { ut24h: number | null; usdPerTrader: number | null }, pc24h: number | null): string {
  const bits = [
    pc24h !== null ? `${pc24h >= 0 ? "+" : ""}${(pc24h * 100).toFixed(1)}% over 24h` : "no 24h move reported",
    m.ut24h !== null ? `${m.ut24h} CMC-reported unique traders` : "unique traders unreported",
    m.usdPerTrader !== null ? `$${Math.round(m.usdPerTrader).toLocaleString("en-US")} per reported trader` : null,
  ].filter(Boolean);
  return `${ref.symbol} — ${bits.join("; ")}.`;
}

export async function runDrill(input: { q?: string; platform?: string; address?: string }): Promise<DrillResult> {
  const u = getUniverse();
  const { ref, row, searchReceipt } = await resolveRef(input);
  const id = `${ref.platform}:${ref.address}`;

  const cached = findCachedDrill(id);
  if (cached) return { id, record: cached.record, mode: "dedup" };

  const spentSoFar = searchReceipt && !searchReceipt.cached ? 1 : 0;
  if (spentSoFar > 0) spendCredits(spentSoFar);
  if (creditsRemaining() < 2) {
    throw new DrillError("LIVE_QUOTA", "daily CMC credit budget exhausted — drill an already-captured token or wait for reset");
  }
  if (!haveKey()) {
    throw new DrillError(
      "DRILL_UNAVAILABLE",
      "no drill bundle for this token and no live key — replay coverage is drill-bundles only",
    );
  }

  let profile;
  let poolsRes;
  try {
    const c = client();
    [profile, poolsRes] = await Promise.all([getTokenMeta(c, ref), getPools(c, ref)]);
  } catch (e) {
    throw new DrillError("CMC_DOWN", e instanceof Error ? e.message : "CMC calls failed");
  }
  spendCredits(2);

  const generatedAt = new Date().toISOString();
  // Provider sometimes returns zeroed sts[] windows (pc=0, ut=0, v=null) for
  // thinly-indexed tokens. Those are "not populated", not real measurements —
  // drop them so evalFunding reports INSUFFICIENT instead of a fake NO_MOVE.
  const rawWindows = profile.profile.windowStats;
  const windows: WindowStat[] = rawWindows.filter(
    (w) =>
      (w.volUsd ?? 0) > 0 ||
      (w.txCount ?? 0) > 0 ||
      (w.uniqueTraders ?? 0) > 0 ||
      (w.priceChange != null && w.priceChange !== 0),
  );
  const mcap = row?.mc ?? profile.profile.mcapUsd;
  const liq = row?.liq ?? profile.profile.liqUsd;
  const ageDays = poolAgeDays(poolsRes.pools.map((p) => p.pubAt), Date.now());

  const rules = evalFunding({
    token: { platform: ref.platform, address: ref.address, symbol: ref.symbol, mcapUsd: mcap, liqUsd: liq },
    windows,
    universe: fundingUniverse(u, ref.platform),
  });

  const mcLiq = mcap !== null && liq !== null && liq > 0 ? mcap / liq : null;
  const [lo, hi] = FUNDING_THRESHOLDS.mcAnomalyRatio;
  const mcPriceAnomaly = mcLiq !== null && (mcLiq < lo || mcLiq > hi);

  const jev = await jevFunding({
    pc24h: rules.metrics.momentum["24h"],
    pc4h: rules.metrics.momentum["4h"],
    pc1h: rules.metrics.momentum["1h"],
    pc5m: rules.metrics.momentum["5m"],
    ut24h: rules.metrics.ut24h,
    utPercentile: rules.metrics.utPercentile,
    usdPerTrader: rules.metrics.usdPerTrader,
    churn24h: rules.metrics.churn24h,
    pace1h: rules.metrics.pace["1h"],
    pace4h: rules.metrics.pace["4h"],
    poolAgeDays: ageDays,
    mcapUsd: mcap,
    mcToLiq: mcLiq,
  });
  const agreement = fundingAgreement(
    { emptyRoom: rules.emptyRoom.level, fading: rules.fadingCrowd.level },
    { emptyRoomProb: jev.emptyRoomProb, fadingProb: jev.fadingProb },
  );

  const pc24h = row?.pc24h ?? ref.priceChange24h ?? rules.metrics.momentum["24h"];
  const record: DrillRecord = {
    id,
    generatedAt,
    rulesVersion: RULES_VERSION,
    mode: "live",
    subject: {
      platform: ref.platform,
      address: ref.address,
      symbol: ref.symbol,
      name: ref.name,
      priceUsd: row?.priceUsd ?? profile.profile.priceUsd,
      pc24h,
      poolAgeDays: ageDays,
      mcap,
      liqUsd: liq,
    },
    flags: { empty_room: rules.emptyRoom, fading: rules.fadingCrowd },
    metrics: rules.metrics,
    ladder: windows
      .filter((w) => w.tp !== "?")
      .map((w) => ({
        key: w.tp,
        windowSec: SECS[w.tp] ?? null,
        pct: w.priceChange,
        txs: w.txCount,
        buyTxs: w.buyCount,
        sellTxs: w.sellCount,
        uniqueTraders: w.uniqueTraders,
        volUsd: w.volUsd,
      })),
    jev: {
      emptyRoomProb: jev.emptyRoomProb,
      fadingProb: jev.fadingProb,
      agreement,
      latencyMs: jev.latencyMs,
    },
    receipts: [
      ...receiptOf("search", searchReceipt),
      ...receiptOf("token", profile.receipt),
      ...receiptOf("pools", poolsRes.receipt),
    ],
    data: {
      universeAt: u.capturedAt,
      peerUniverse: "snapshot-universe",
      eligibleN: u.eligibleN,
      mcPriceAnomaly,
      stsReported: rawWindows.length,
      stsUsable: windows.length,
    },
    meta: {
      why: whyLine(ref, rules.metrics, pc24h),
      falsifiers: { empty_room: rules.emptyRoom.falsifier, fading: rules.fadingCrowd.falsifier },
    },
  };

  // Best-effort persistence: on serverless the fs is read-only — the record is
  // still returned to the caller even if the bundle cannot be written.
  try {
    mkdirSync(path.join(process.cwd(), "data", "drills"), { recursive: true });
    writeFileSync(drillFilePath(id), JSON.stringify(record, null, 2));
  } catch {
    // read-only fs (serverless) — skip persistence, response already carries the record
  }
  return { id, record, mode: "live" };
}
