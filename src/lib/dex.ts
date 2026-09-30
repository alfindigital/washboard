// Vendored subset of verdex/src/lib/dex.ts — drill data plane only:
// search candidates, token meta (sts[] windowStats), pools.
// Raw CMC field names are abbreviated (tks/sts/tp/vu/txs/ut/pc...).
import { canonicalChain, tokenIdentity } from "@/lib/address";
import type { WindowStat } from "@/types";

export interface TokenRef {
  platform: string; // 'Solana' | 'BSC' | 'Base' | ...
  address: string;
  name: string;
  symbol: string;
  mcapUsd?: number | null;
  vol24hUsd?: number | null;
  priceChange24h?: number | null;
  liqUsd?: number | null;
  uniqueTraders24h?: number | null; // ut24h — provider count
  logo?: string | null;
}

export interface Pool {
  address: string;
  dex: string;
  liqUsd: number;
  vol24h: number;
  t0sym: string;
  t1sym: string;
  pubAt?: number | null; // pool first-seen timestamp (ms)
  t0liqUsd?: number | null;
  t1liqUsd?: number | null;
  top?: boolean;
  rank?: number | null;
}

export interface TokenProfile {
  decimals: number | null;
  totalSupply: number | null;
  holders: number | null;
  priceUsd: number | null;
  priceAt: number | null;
  mcapUsd: number | null;
  liqUsd: number | null;
  listedAt: number | null;
  firstPoolAt: number | null; // fpct — first pool created
  logo: string | null;
  cmcId: number | null;
  poolCount: number | null;
  windowStats: WindowStat[]; // sts[]
}

export interface DexClient {
  get<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    opts?: { ttlMs?: number },
  ): Promise<{ data: T; receipt: import("./cmc-client").Receipt }>;
}

// ---------- normalizers ----------
const num = (v: unknown) => (v === undefined || v === null || v === "" ? null : Number(v));

export function isAddress(input: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(input) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input);
}

function toRef(t: Record<string, unknown>): TokenRef {
  return {
    platform: String(t.plt),
    address: String(t.addr),
    name: String(t.n),
    symbol: String(t.s),
    mcapUsd: num(t.mc),
    vol24hUsd: num(t.v24h),
    priceChange24h: num(t.pc24h),
    liqUsd: num(t.liq),
    uniqueTraders24h: num(t.ut24h),
    logo: typeof t.l === "string" && t.l ? t.l : null,
  };
}

/** All distinct-address candidates for a query (ambiguity resolution). */
export async function searchTokenCandidates(
  client: DexClient,
  input: string,
): Promise<{ candidates: TokenRef[]; receipt: import("./cmc-client").Receipt }> {
  const q = input.trim().replace(/^\$/, "");
  const res = await client.get<{ tks?: Record<string, unknown>[] }>("/v1/dex/search", { q });
  const seen = new Set<string>();
  const candidates: TokenRef[] = [];
  for (const t of res.data?.tks ?? []) {
    const ref = toRef(t);
    const k = tokenIdentity(ref.platform, ref.address) ?? `${ref.platform}:${ref.address}`;
    if (!seen.has(k)) {
      seen.add(k);
      candidates.push(ref);
    }
  }
  return { candidates, receipt: res.receipt };
}

export class TokenNotFoundError extends Error {
  constructor(q: string) {
    super(`Token not found: ${q}`);
    this.name = "TokenNotFoundError";
  }
}

export class AmbiguousSymbolError extends Error {
  candidates: TokenRef[];
  constructor(q: string, candidates: TokenRef[]) {
    super(`Ambiguous symbol: ${q}`);
    this.name = "AmbiguousSymbolError";
    this.candidates = candidates;
  }
}

/** Resolve q → single token. Never silent-picks when multiple distinct symbols share the query. */
export async function resolveToken(
  client: DexClient,
  input: string,
  platformHint?: string,
): Promise<{ token: TokenRef; receipt: import("./cmc-client").Receipt }> {
  const q = input.trim().replace(/^\$/, "");
  const { candidates, receipt } = await searchTokenCandidates(client, q);
  const requestedChain = platformHint ? canonicalChain(platformHint) : null;
  if (platformHint && !requestedChain) throw new TokenNotFoundError(q);
  const scoped = requestedChain ? candidates.filter((t) => canonicalChain(t.platform) === requestedChain) : candidates;

  if (isAddress(q)) {
    const exact = candidates.find((t) => tokenIdentity(t.platform, t.address) === tokenIdentity(t.platform, q));
    const pick = exact && (!requestedChain || canonicalChain(exact.platform) === requestedChain) ? exact : undefined;
    if (!pick) throw new TokenNotFoundError(q);
    return { token: pick, receipt };
  }

  if (scoped.length === 0) throw new TokenNotFoundError(q);
  const sameSymbol = scoped.filter(
    (t) => t.symbol.toLowerCase() === q.toLowerCase(),
  );
  const pool = sameSymbol.length > 0 ? sameSymbol : scoped;
  if (pool.length > 1) throw new AmbiguousSymbolError(q, pool);
  return { token: pool[0], receipt };
}

export async function getTokenMeta(client: DexClient, ref: TokenRef) {
  const r = await client.get<Record<string, unknown>>("/v1/dex/token", {
    platform: ref.platform,
    address: ref.address,
  });
  const d = (r.data ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const numOrNull = (v: unknown) => {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const windowStats: WindowStat[] = (Array.isArray(d.sts) ? d.sts : [])
    .filter((w): w is Record<string, unknown> => Boolean(w) && typeof w === "object")
    .map((w) => ({
      tp: str(w.tp) ?? "?",
      volUsd: numOrNull(w.vu),
      txCount: numOrNull(w.txs),
      buyCount: numOrNull(w.nb),
      sellCount: numOrNull(w.ns),
      buyVolUsd: numOrNull(w.bvu),
      sellVolUsd: numOrNull(w.svu),
      buyTraders: numOrNull(w.but),
      sellTraders: numOrNull(w.sut),
      uniqueTraders: numOrNull(w.ut),
      priceChange: numOrNull(w.pc),
    }));
  const profile: TokenProfile = {
    decimals: numOrNull(d.dec),
    totalSupply: numOrNull(d.ts),
    holders: numOrNull(d.hld),
    priceUsd: numOrNull(d.p),
    priceAt: numOrNull(d.pt),
    mcapUsd: numOrNull(d.mcap),
    liqUsd: numOrNull(d.liqUsd),
    listedAt: numOrNull(d.pubAt),
    firstPoolAt: numOrNull(d.fpct ?? d.fpt),
    logo: str(d.lg),
    cmcId: numOrNull(d.cid),
    poolCount: numOrNull(d.nps),
    windowStats,
  };
  return { profile, receipt: r.receipt };
}

export async function getPools(client: DexClient, ref: TokenRef) {
  const r = await client.get<Record<string, unknown>[]>("/v1/dex/token/pools", {
    platform: ref.platform,
    address: ref.address,
  });
  const pools = (Array.isArray(r.data) ? r.data : []).map((raw) => {
    const t0 = (raw.t0 ?? {}) as Record<string, unknown>;
    const t1 = (raw.t1 ?? {}) as Record<string, unknown>;
    const pool: Pool = {
      address: String(raw.fa ?? raw.addr ?? ""),
      dex: String(raw.exn ?? ""),
      liqUsd: Number(raw.liqUsd ?? 0),
      vol24h: Number(raw.v24 ?? 0),
      t0sym: String(t0.sym ?? ""),
      t1sym: String(t1.sym ?? ""),
      pubAt: num(raw.pubAt),
      t0liqUsd: num(t0.liqUsd),
      t1liqUsd: num(t1.liqUsd),
      top: raw.top === undefined ? undefined : Boolean(raw.top),
      rank: num(raw.bidx),
    };
    return pool;
  });
  return { pools, receipt: r.receipt };
}
