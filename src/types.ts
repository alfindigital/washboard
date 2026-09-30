// Washboard domain types — single source for engine + api + ui shapes.
// Engine contracts: ideas/LiquidityGap-plan.md §3, ideas/FundingSpot-plan.md §4.

// ---------- shared ----------
export type GapLevel = "CLEAN" | "INFO" | "WARN" | "DANGER";
export type FundingLevel = "CLEAN" | "WARN" | "DANGER" | "INSUFFICIENT";

/** Normalized CMC /v1/dex/search tks[] row (raw names abbreviated in payload). */
export interface SearchRow {
  platform: string; // plt — e.g. 'Solana'
  address: string; // addr
  name: string; // n
  symbol: string; // s
  priceUsd: number | null; // pu (string in raw)
  pc24h: number | null; // fraction, e.g. -0.0211 = -2.11%
  v24h: number | null;
  mc: number | null;
  liq: number | null;
  ut24h: number | null; // string in raw → parsed
  firstPairTs: number | null; // fpt (ms epoch) — first pair timestamp
  firstPoolTs: number | null; // fpct (ms epoch)
  logo: string | null; // l
}

/** sts[] window from /v1/dex/token. '1m' = ONE MINUTE. */
export interface WindowStat {
  tp: string; // '5m' | '1h' | '4h' | '24h' | '1m' ...
  volUsd: number | null;
  txCount: number | null;
  buyCount: number | null;
  sellCount: number | null;
  buyVolUsd: number | null;
  sellVolUsd: number | null;
  buyTraders: number | null;
  sellTraders: number | null;
  uniqueTraders: number | null;
  priceChange: number | null;
}

// ---------- universe ----------
export interface UniverseBands {
  n: number; // eligible sample count in this scope
  asOf: string; // universe capturedAt
  sha256: string;
  scope: "global" | "chain" | "chain+mature";
  ut25: number;
  ut50: number;
  ratio75: number;
  ratio95: number;
  usdPerTrader75: number;
  churn75: number | null; // null on board (txs missing in search rows) — drill fills
  /** additive: sorted eligible values for exact percentile rank */
  utVals: number[];
  ratioVals: number[];
  uptVals: number[];
}

/** Internal universe object produced by loadUniverse() from the artifact. */
export interface Universe {
  capturedAt: string;
  sha256: string; // artifact bodySha256
  queries: number;
  credits: number;
  rows: SearchRow[];
  eligibleN: number; // field-eligible rows (floors + reported fields)
  peerN: number; // eligible minus excluded asset classes — the band denominator
  bands: { global: UniverseBands; perChain: Record<string, UniverseBands> };
}

// ---------- exclusions ----------
export type ExclusionClass = "stable" | "wrapped" | "lst" | "infra-token" | "venue-equity" | null;

// ---------- gap engine (LiquidityGap) ----------
export type GapState =
  | "TURNOVER_ANOMALY"
  | "CROWDED_TAPE"
  | "ACTIVE_THIN"
  | "DORMANT"
  | "BELOW_FLOOR"
  | "EXCLUDED"
  | "NO_DATA";

export interface GapFlag {
  state: GapState;
  level: GapLevel;
  reasons: string[];
  falsifier: string;
  exclClass?: Exclude<ExclusionClass, null>;
}

export interface GapMetrics {
  turnover: number | null; // v24h / liq
  usdPerTrader: number | null; // v24h / ut24h
  ratioPercentile: number | null; // 0..1 vs eligible per-chain
  utPercentile: number | null;
}

// ---------- funding engine (FundingSpot — contract verbatim) ----------
export const FUNDING_THRESHOLDS = {
  minMoveEmpty: 0.03, // pc24h ≥ +3% → EMPTY_ROOM bisa terbit
  minMoveFading: 0.02, // pc24h ≥ +2% → FADING bisa terbit
  thinUtPct: 0.25, // ut24h ≤ p25 universe
  fatUsdPct: 0.75, // $/trader ≥ p75 universe
  churnHotPct: 0.75, // churn ≥ p75 → bot-tape tell (WARN saja)
  fadingPace: 1.0, // pace(4h) < 1 = kerumunan menipis
  matureMcapUsd: 100_000_000,
  mcAnomalyRatio: [0.1, 1e4],
} as const;

export type FlagState =
  | "EMPTY_ROOM"
  | "CROWDED"
  | "FADING"
  | "HOLDING"
  | "NO_MOVE"
  | "INSUFFICIENT";

export interface FundingInput {
  token: {
    platform: string;
    address: string;
    symbol: string;
    mcapUsd: number | null;
    liqUsd: number | null;
  };
  windows: WindowStat[]; // sts[] normalized
  universe: {
    ut25: number;
    usdPerTrader75: number;
    churn75: number | null;
    n: number;
    asOf: string;
    utVals?: number[]; // sorted — additive, for exact utPercentile
    uptVals?: number[]; // sorted — additive, for upt50 borderline
  } | null;
}

export interface FundingFlag {
  state: FlagState;
  level: FundingLevel;
  reasons: string[];
  falsifier: string;
}

export interface FundingMetrics {
  ut24h: number | null;
  utPercentile: number | null; // 0..1
  churn24h: number | null; // txCount24h / ut24h
  usdPerTrader: number | null; // volUsd24h / ut24h
  pace: Record<"1h" | "4h", number | null>;
  momentum: Record<"5m" | "1h" | "4h" | "24h", number | null>;
}

export interface FundingResult {
  emptyRoom: FundingFlag;
  fadingCrowd: FundingFlag;
  metrics: FundingMetrics;
  mature: boolean;
}

// ---------- cohort / waves ----------
export interface CohortKey {
  platform: string;
  ageBand: string; // '0-1d' | '1-7d' | '7-30d' | '>30d' | 'unknown'
  utBand: string; // '<10' | '10-50' | '50-200' | '200+'
  ratioBand: string; // 'p75+' | 'p95+'
}

export interface WaveMember {
  identity: string;
  symbol: string;
  address: string;
  ratio: number | null;
  ut: number | null;
}

export interface Wave {
  key: CohortKey;
  size: number;
  members: WaveMember[];
  medianRatio: number | null;
  medianUt: number | null;
}

// ---------- persistence ----------
export interface PersistenceRow {
  firstSeen: string;
  lastSeen: string;
  daysFlaggedGap: number;
  daysFlaggedFunding: number;
  snapshots: string[]; // capturedAt list, rolling max 30
}
export type PersistStore = Record<string, PersistenceRow>;

// ---------- board view ----------
export interface BoardRow {
  rank: number;
  identity: string; // platform:address canonical
  onDemand?: boolean;
  name: string;
  symbol: string;
  platform: string;
  address: string;
  priceUsd: number | null;
  pc24h: number | null;
  v24h: number | null;
  liq: number | null;
  ut24h: number | null;
  mc: number | null;
  ageDays: number | null;
  metrics: GapMetrics;
  gap: GapFlag;
  funding: FundingFlag; // EMPTY_ROOM preview only — FADING is drill-only
  dual: boolean;
  daysFlagged: { gap: number; funding: number };
}

export interface ChainWeather {
  platform: string;
  eligible: number;
  flagged: number;
}

export interface BoardStats {
  universeAt: string;
  sha256: string;
  nTotal: number;
  nEligible: number;
  nPeer: number;
  nFlaggedGap: number;
  nEmptyRoom: number;
  nDual: number;
  nWaves: number;
  nDormant: number;
  nExcluded: number;
  queries: number;
  credits: number;
  chainWeather: ChainWeather[];
}

export interface BoardView {
  stats: BoardStats;
  rows: BoardRow[];
  waves: Wave[];
  dormant: BoardRow[];
}

// ---------- drill record (FundingSpot card contract) ----------
export interface DrillReceipt {
  call: string;
  path: string;
  fetchedAt: string;
  bodySha256: string;
}

export interface DrillRecord {
  id: string;
  generatedAt: string;
  rulesVersion: string;
  mode: "live" | "replay";
  subject: {
    platform: string;
    address: string;
    symbol: string;
    name: string;
    priceUsd: number | null;
    pc24h: number | null;
    poolAgeDays?: number | null;
    mcap?: number | null;
    liqUsd?: number | null;
  };
  flags: { empty_room: FundingFlag; fading: FundingFlag };
  metrics: FundingMetrics;
  ladder: {
    key: string;
    windowSec: number | null;
    pct: number | null;
    txs: number | null;
    buyTxs: number | null;
    sellTxs: number | null;
    uniqueTraders: number | null;
    volUsd: number | null;
  }[];
  jev: {
    emptyRoomProb: number | null;
    fadingProb: number | null;
    agreement: "consensus" | "contested" | "lean" | "unavailable";
    latencyMs: number | null;
  } | null;
  receipts: DrillReceipt[];
  data: {
    universeAt: string;
    peerUniverse: "snapshot-universe";
    eligibleN: number;
    mcPriceAnomaly: boolean;
    stsReported: number;
    stsUsable: number;
  };
  meta: {
    why: string;
    falsifiers: { empty_room: string; fading: string };
    daysFlagged?: { gap: number; funding: number };
  };
}
