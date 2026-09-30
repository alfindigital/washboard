// exclusions.ts — asset classes whose liq/vol semantics break the metric.
// Excluded ≠ hidden: rows stay visible, labelled, countered, toggleable.
import type { ExclusionClass, SearchRow } from "@/types";

const STABLES = new Set([
  "USDT", "USDC", "DAI", "FDUSD", "USDE", "SUSDE", "USDS", "PYUSD", "TUSD",
  "EURC", "FRAX", "USDY", "GHO", "BUSD", "USDP", "LUSD", "CRVUSD", "USDD",
  "RLUSD", "USDT0", "USD1", "BFUSD", "AUSD", "USDB",
]);

const WRAPPED = new Set([
  "WETH", "WBTC", "WBNB", "WSOL", "WAVAX", "WMATIC", "WSTETH", "CBETH", "CBETH",
  "WBTCSOL", "WROSE", "WXTZ",
]);

const LSTS = new Set([
  "WEETH", "RETH", "JITO", "JITOSOL", "MSOL", "BSOL", "STSOL", "SAVAX", "RSETH",
  "EETH", "EZETH", "LSETH", "OSNOS", "SFRXETH", "SWETH", "ANKRETH", "CBETH",
]);

const STABLE_PATTERNS = /^(usdt|usdc|usd|eur|dai|fdusd|pyusd|tusd|busd|gho|frax|lusd|usdy|rlusd|ausd|usdb|usde|susde|usds|usdd)/i;
const WRAP_PATTERNS = /^w(eth|btc|bnb|sol|avax|matic|rose|xtz|near|ftm|arb|op)/i;
const LST_PATTERNS = /(steth|reth|jito|msol|bsol|stsol|savax|rseth|eeth|ezeth|sweth|osnos|sfrx|ankreth|cbeth|staked|liquid stake)/i;

/**
 * Conservative classifier: explicit symbol lists first, then narrow heuristics.
 * A token ≥ $100M mcap never matches a *heuristic* — only the explicit list —
 * so a legit large-cap is not silently excluded.
 */
export function classifyAsset(row: SearchRow): ExclusionClass {
  if (row.platform === "Robinhood") return "venue-equity";
  const sym = row.symbol.trim();
  const name = row.name.toLowerCase();
  const big = (row.mc ?? 0) >= 100_000_000;

  if (STABLES.has(sym.toUpperCase())) return "stable";
  if (WRAPPED.has(sym.toUpperCase())) return "wrapped";
  if (LSTS.has(sym.toUpperCase())) return "lst";

  if (!big) {
    if (STABLE_PATTERNS.test(sym) || /stable(coin)?|peg/.test(name)) return "stable";
    if (WRAP_PATTERNS.test(sym) || /wrapped /.test(name)) return "wrapped";
    if (LST_PATTERNS.test(sym) || LST_PATTERNS.test(name)) return "lst";
    // Infrastructure/oracle/plumbing tokens — narrow name match only.
    if (/(oracle|indexer|bridge |wrapped token)/.test(name)) return "infra-token";
  }
  return null;
}
