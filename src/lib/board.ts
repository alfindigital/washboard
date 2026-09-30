// board.ts — board view assembly. Server-only: reads artifacts once per
// cold start, caches the computed view. Zero CMC calls at render.
import { existsSync, readFileSync } from "fs";
import path from "path";
import { tokenIdentity } from "@/lib/address";
import { bandsFor, loadUniverse } from "@/engine/universe";
import type { Universe } from "@/types";
import { classifyAsset } from "@/engine/exclusions";
import { evalGap } from "@/engine/gap";
import { evalFundingBoard } from "@/engine/funding";
import { ageDaysOf, detectWaves } from "@/engine/cohort";
import { daysFlaggedFor } from "@/engine/persistence";
import type { BoardRow, BoardStats, BoardView, PersistStore, SearchRow } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");

function loadUniverseArtifact(): Universe {
  const latestPath = path.join(DATA_DIR, "universe", "latest.json");
  const pointer = JSON.parse(readFileSync(latestPath, "utf8")) as { pointsTo: string };
  const filePath = path.join(DATA_DIR, "universe", pointer.pointsTo);
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Parameters<typeof loadUniverse>[0];
  return loadUniverse(raw);
}

function loadPersistence(): PersistStore {
  const p = path.join(DATA_DIR, "persistence.json");
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf8")) as PersistStore;
  } catch {
    return {};
  }
}

function rowFor(u: Universe, persist: PersistStore, row: SearchRow): BoardRow {
  const bands = bandsFor(u, row.platform, row.mc);
  const excl = classifyAsset(row);
  const { gap, metrics } = evalGap(row, bands, excl);
  const funding = evalFundingBoard(row, {
    ut25: bands.ut25,
    usdPerTrader75: bands.usdPerTrader75,
    n: bands.n,
  });
  const identity = tokenIdentity(row.platform, row.address) ?? `${row.platform}:${row.address}`;
  const dual =
    (gap.level === "WARN" || gap.level === "DANGER") &&
    (funding.level === "WARN" || funding.level === "DANGER");
  return {
    rank: 0,
    identity,
    name: row.name,
    symbol: row.symbol,
    platform: row.platform,
    address: row.address,
    priceUsd: row.priceUsd,
    pc24h: row.pc24h,
    v24h: row.v24h,
    liq: row.liq,
    ut24h: row.ut24h,
    mc: row.mc,
    ageDays: ageDaysOf(row, u.capturedAt),
    metrics,
    gap,
    funding,
    dual,
    daysFlagged: daysFlaggedFor(persist, identity),
  };
}

function sortRank(r: BoardRow): number {
  const gapFlag = r.gap.level === "DANGER" ? 3 : r.gap.level === "WARN" ? 2 : 0;
  const fFlag = r.funding.level === "DANGER" ? 3 : r.funding.level === "WARN" ? 2 : 0;
  if (r.dual) return 100 + gapFlag + fFlag;
  return Math.max(gapFlag, fFlag);
}

export function buildBoardView(u: Universe, persist: PersistStore): BoardView {
  const rows = u.rows.map((r) => rowFor(u, persist, r));
  rows.sort((a, b) => {
    const d = sortRank(b) - sortRank(a);
    if (d !== 0) return d;
    const ratioCmp = (b.metrics.turnover ?? 0) - (a.metrics.turnover ?? 0);
    return ratioCmp !== 0 ? ratioCmp : a.symbol.localeCompare(b.symbol);
  });
  rows.forEach((r, i) => (r.rank = i + 1));

  const waves = detectWaves(rows);
  const dormant = rows.filter((r) => r.gap.state === "DORMANT").sort((a, b) => (b.liq ?? 0) - (a.liq ?? 0));

  const byChain = new Map<string, { eligible: number; flagged: number }>();
  for (const r of rows) {
    if (r.gap.state === "NO_DATA" || r.gap.state === "EXCLUDED") continue;
    const eligible = r.gap.state !== "BELOW_FLOOR" && r.gap.state !== "DORMANT";
    const flagged = r.gap.level === "WARN" || r.gap.level === "DANGER";
    if (!eligible && !flagged) continue;
    const c = byChain.get(r.platform) ?? { eligible: 0, flagged: 0 };
    if (eligible) c.eligible++;
    if (flagged) c.flagged++;
    byChain.set(r.platform, c);
  }

  const flaggedGap = (r: BoardRow) => r.gap.level === "WARN" || r.gap.level === "DANGER";
  const flaggedEr = (r: BoardRow) => r.funding.level === "WARN" || r.funding.level === "DANGER";

  const stats: BoardStats = {
    universeAt: u.capturedAt,
    sha256: u.sha256,
    nTotal: u.rows.length,
    nEligible: u.eligibleN,
    nPeer: u.peerN,
    nFlaggedGap: rows.filter(flaggedGap).length,
    nEmptyRoom: rows.filter(flaggedEr).length,
    nDual: rows.filter((r) => r.dual).length,
    nWaves: waves.length,
    nDormant: dormant.length,
    nExcluded: rows.filter((r) => r.gap.state === "EXCLUDED").length,
    queries: u.queries,
    credits: u.credits,
    chainWeather: [...byChain.entries()]
      .map(([platform, c]) => ({ platform, eligible: c.eligible, flagged: c.flagged }))
      .sort((a, b) => b.flagged - a.flagged),
  };
  return { stats, rows, waves, dormant };
}

let cached: { u: Universe; view: BoardView } | null = null;

/** Cached board view — recomputed per cold start (universe is a frozen artifact). */
export function getBoard(): BoardView {
  if (!cached) {
    const u = loadUniverseArtifact();
    cached = { u, view: buildBoardView(u, loadPersistence()) };
  }
  return cached.view;
}

export function getUniverse(): Universe {
  getBoard();
  return cached!.u;
}
