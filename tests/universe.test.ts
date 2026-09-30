import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { loadUniverse, isEligible, bandsFor, quantile, percentileRank } from "@/engine/universe";

const artifact = JSON.parse(
  readFileSync(path.join(process.cwd(), "data/universe/universe-2026-09-30.json"), "utf8"),
) as Parameters<typeof loadUniverse>[0];
const u = loadUniverse(artifact);

describe("universe artifact → computed bands (percentile-only)", () => {
  it("parses all 2466 rows, eligible set = 1083", () => {
    expect(u.rows.length).toBe(2466);
    expect(u.eligibleN).toBe(1083);
    expect(u.rows.filter(isEligible).length).toBe(u.eligibleN);
  });

  it("global peer-set bands match pinned numbers (excluded classes out of denominator)", () => {
    const g = u.bands.global;
    expect(g.n).toBe(834); // peer set — 1083 eligible minus stable/wrapped/lst/venue-equity
    expect(g.ut25).toBe(65);
    expect(g.ut50).toBe(225);
    expect(g.ratio75).toBeCloseTo(1.2452, 2);
    expect(g.ratio95).toBeCloseTo(11.7132, 1);
    expect(g.usdPerTrader75).toBeCloseTo(1885, 0);
    expect(g.churn75).toBeNull(); // txs not in search rows
    expect(g.utVals.length).toBe(834);
  });

  it("per-chain bands exist only for chains with n≥30 peers", () => {
    const sol = u.bands.perChain["Solana"];
    expect(sol).toBeDefined();
    expect(sol.n).toBe(261);
    expect(sol.ratio95).toBeCloseTo(50.55, 1);
    expect(sol.ut25).toBe(112);
    expect(sol.scope).toBe("chain");
    expect(u.bands.perChain["Robinhood"]).toBeUndefined(); // venue-equity: excluded from peers entirely
    expect(Object.keys(u.bands.perChain)).toEqual(
      expect.arrayContaining(["Base", "BSC", "Ethereum", "Solana"]),
    );
    // Near has <30 eligible → global fallback
    expect(bandsFor(u, "Near", null).scope).toBe("global");
    expect(bandsFor(u, "Solana", null).scope).toBe("chain");
  });

  it("quantile + percentileRank helpers", () => {
    const s = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(quantile(s, 0.5)).toBe(6); // floor(p*n) index — same method as seed bands
    expect(percentileRank(s, 5)).toBe(0.5);
    expect(percentileRank([], 5)).toBeNaN();
  });
});
