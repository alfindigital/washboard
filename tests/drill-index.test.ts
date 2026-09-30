import { afterAll, describe, expect, it } from "vitest";
import { rmSync, writeFileSync } from "fs";
import { drillFilePath, findCachedDrill } from "@/lib/drill-index";
import type { DrillRecord } from "@/types";

const fake: DrillRecord = {
  id: "TestChain:0xdeadbeef",
  generatedAt: new Date().toISOString(),
  rulesVersion: "test",
  mode: "live",
  subject: { platform: "TestChain", address: "0xdeadbeef", symbol: "T", name: "t", priceUsd: 1, pc24h: 0.1 },
  flags: {
    empty_room: { state: "EMPTY_ROOM", level: "DANGER", reasons: [], falsifier: "" },
    fading: { state: "HOLDING", level: "CLEAN", reasons: [], falsifier: "" },
  },
  metrics: { ut24h: 5, utPercentile: 0.01, churn24h: 1, usdPerTrader: 1000, pace: { "1h": 1, "4h": 1 }, momentum: { "5m": 0, "1h": 0, "4h": 0, "24h": 0.1 } },
  ladder: [],
  jev: null,
  receipts: [],
  data: { universeAt: "2026-09-30", peerUniverse: "snapshot-universe", eligibleN: 1083, mcPriceAnomaly: false },
  meta: { why: "test", falsifiers: { empty_room: "", fading: "" } },
};

const file = drillFilePath(fake.id);
afterAll(() => { try { rmSync(file); } catch { /* ok */ } });

describe("drill-index — dedup rescans the dir (no stale module cache)", () => {
  it("misses before write, hits after write, then hits again", () => {
    expect(findCachedDrill(fake.id)).toBeNull();
    writeFileSync(file, JSON.stringify(fake));
    const hit = findCachedDrill(fake.id);
    expect(hit).not.toBeNull();
    expect(hit!.record.subject.symbol).toBe("T");
    expect(findCachedDrill(fake.id)!.id).toBe(fake.id);
  });
  it("file path is windows-safe (no colon)", () => {
    expect(file).toContain("TestChain_0xdeadbeef.json");
    expect(file).not.toContain("TestChain:0xdeadbeef");
  });
});
