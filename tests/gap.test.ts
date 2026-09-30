import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { loadUniverse, bandsFor } from "@/engine/universe";
import { classifyAsset } from "@/engine/exclusions";
import { evalGap } from "@/engine/gap";
import type { SearchRow } from "@/types";

const artifact = JSON.parse(
  readFileSync(path.join(process.cwd(), "data/universe/universe-2026-09-30.json"), "utf8"),
) as Parameters<typeof loadUniverse>[0];
const u = loadUniverse(artifact);

const find = (platform: string, symbol: string, pred: (r: SearchRow) => boolean = () => true) => {
  const row = u.rows.find((r) => r.platform === platform && r.symbol === symbol && pred(r));
  if (!row) throw new Error(`row ${platform}/${symbol} not found`);
  return row;
};
const evalRow = (r: SearchRow) => evalGap(r, bandsFor(u, r.platform, r.mc), classifyAsset(r)).gap;

describe("evalGap — golden vectors from the real snapshot", () => {
  it("Solana DOGE clone (r=24.7, ut=6) → WARN not DANGER (SOL p95=50.5)", () => {
    const row = find("Solana", "DOGE", (r) => r.ut24h === 6);
    const g = evalRow(row);
    expect(g.state).toBe("TURNOVER_ANOMALY");
    expect(g.level).toBe("WARN");
  });

  it("Base 67OHIO (r=11.26, ut=31) → DANGER (Base p95 < r)", () => {
    const row = find("Base", "67OHIO", (r) => r.ut24h === 31);
    const g = evalRow(row);
    expect(g.state).toBe("TURNOVER_ANOMALY");
    expect(g.level).toBe("DANGER");
  });

  it("Solana INU (r=630, ut=2387) → CROWDED_TAPE not anomaly (broad participation)", () => {
    const row = find("Solana", "INU", (r) => (r.ut24h ?? 0) > 2000);
    const g = evalRow(row);
    expect(g.state).toBe("CROWDED_TAPE");
    expect(["INFO", "CLEAN"]).toContain(g.level);
  });

  it("JUP/Solana (r=2.06, ut=7520) → clean/crowded, no flag", () => {
    const g = evalRow(find("Solana", "JUP", (r) => (r.v24h ?? 0) > 1_000_000));
    expect(g.state).not.toBe("TURNOVER_ANOMALY");
  });

  it("sUSDe/Ethereum → EXCLUDED (stable)", () => {
    const row = find("Ethereum", "sUSDe");
    expect(classifyAsset(row)).toBe("stable");
    const g = evalRow(row);
    expect(g.state).toBe("EXCLUDED");
    expect(g.exclClass).toBe("stable");
  });

  it("Robinhood NVDA → EXCLUDED (venue-equity)", () => {
    const row = find("Robinhood", "NVDA");
    const g = evalRow(row);
    expect(g.state).toBe("EXCLUDED");
    expect(g.exclClass).toBe("venue-equity");
  });

  it("Fantom O3 (all fields null) → NO_DATA", () => {
    const g = evalRow(find("Fantom", "O3"));
    expect(g.state).toBe("NO_DATA");
  });

  it("Meter MTRG (v=0, liq=$21.7M) → DORMANT", () => {
    const row = find("Meter", "MTRG", (r) => r.v24h === 0);
    const g = evalRow(row);
    expect(g.state).toBe("DORMANT");
  });

  it("BSC DOGE dust row (v=$20, liq=$884) → BELOW_FLOOR", () => {
    const row = find("BSC", "DOGE", (r) => (r.v24h ?? 0) > 0 && (r.v24h ?? 0) <= 5000);
    const g = evalRow(row);
    expect(g.state).toBe("BELOW_FLOOR");
  });

  it("mature mcap caps DANGER → WARN", () => {
    const synthetic: SearchRow = {
      platform: "Solana", address: "mature", name: "Mature Co", symbol: "MTC",
      priceUsd: 1, pc24h: 0.01, v24h: 3_000_000, mc: 250_000_000,
      liq: 50_000, ut24h: 10, firstPairTs: null, firstPoolTs: null, logo: null,
    };
    const g = evalRow(synthetic);
    expect(g.state).toBe("TURNOVER_ANOMALY");
    expect(g.level).toBe("WARN"); // r=60 ≥ SOL p95 ∧ ut≤p25 → capped by $250M mcap
  });
});
