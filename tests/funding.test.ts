import { describe, expect, it } from "vitest";
import { evalFunding, evalFundingBoard } from "@/engine/funding";
import type { FundingInput, WindowStat } from "@/types";

const uni = { ut25: 69, usdPerTrader75: 2255, churn75: 8, n: 1083, asOf: "2026-09-30", utVals: [5, 30, 69, 120, 267, 500, 1200, 3000], uptVals: [10, 50, 200, 800, 2255, 9000] };

const win = (tp: string, pc: number | null, ut: number | null, vol: number | null, txs: number | null): WindowStat => ({
  tp, priceChange: pc, uniqueTraders: ut, volUsd: vol, txCount: txs,
  buyCount: null, sellCount: null, buyVolUsd: null, sellVolUsd: null, buyTraders: null, sellTraders: null,
});

const base: FundingInput = {
  token: { platform: "Solana", address: "x", symbol: "TST", mcapUsd: 500_000, liqUsd: 40_000 },
  windows: [
    win("5m", 0.001, 1, 900, 12),
    win("1h", -0.02, 1, 3_000, 40),
    win("4h", -0.03, 2, 6_000, 60),
    win("24h", 0.105, 30, 300_000, 3000),
  ],
  universe: uni,
};

describe("evalFunding — contract from FundingSpot-plan §4", () => {
  it("thin-ut green move + decaying short windows → EMPTY_ROOM + FADING", () => {
    const r = evalFunding(base);
    expect(r.emptyRoom.state).toBe("EMPTY_ROOM");
    expect(r.emptyRoom.level).toBe("DANGER"); // ut=30 ≤ p25=69 (utPercentile .375? — ut=30 → rank(30)=2/8=0.25)
    expect(r.fadingCrowd.state).toBe("FADING");
    expect(r.fadingCrowd.level).toBe("DANGER");
    expect(r.metrics.ut24h).toBe(30);
    expect(r.metrics.churn24h).toBe(100); // 3000 txs / 30 ut
    expect(r.metrics.pace["4h"]).toBeCloseTo((2 / 4) / (30 / 24), 2); // 0.4× — crowd thinning
  });

  it("broad participation → CROWDED, green holding windows → HOLDING", () => {
    const r = evalFunding({
      ...base,
      windows: [
        win("1h", 0.01, 400, 200_000, 900),
        win("4h", 0.02, 900, 600_000, 3000),
        win("24h", 0.06, 3500, 2_000_000, 12_000),
      ],
    });
    expect(r.emptyRoom.state).toBe("CROWDED");
    expect(r.fadingCrowd.state).toBe("HOLDING");
  });

  it("ut null / no 24h window → INSUFFICIENT both flags", () => {
    const r = evalFunding({ ...base, windows: [win("1h", -0.01, 10, 1000, 50)] });
    expect(r.emptyRoom.state).toBe("INSUFFICIENT");
    expect(r.fadingCrowd.state).toBe("INSUFFICIENT");
  });

  it("no move → NO_MOVE guards", () => {
    const r = evalFunding({ ...base, windows: [win("1h", 0, 10, 500, 10), win("4h", 0, 20, 1000, 30), win("24h", 0.01, 30, 5000, 100)] });
    expect(r.emptyRoom.state).toBe("NO_MOVE");
    expect(r.fadingCrowd.state).toBe("NO_MOVE");
  });

  it("mature mcap caps EMPTY_ROOM DANGER → WARN", () => {
    const r = evalFunding({ ...base, token: { ...base.token, mcapUsd: 500_000_000 } });
    expect(r.mature).toBe(true);
    expect(r.emptyRoom.level).toBe("WARN");
  });

  it("pc1h negative only → FADING WARN not DANGER", () => {
    const r = evalFunding({
      ...base,
      windows: [win("1h", -0.01, 40, 9000, 100), win("4h", 0.02, 150, 40_000, 500), win("24h", 0.05, 30, 100_000, 900)],
    });
    expect(r.fadingCrowd.state).toBe("FADING");
    expect(r.fadingCrowd.level).toBe("WARN");
  });
});

describe("evalFundingBoard — board EMPTY_ROOM preview (FADING stays drill-only)", () => {
  const uniRow = { ut25: 69, usdPerTrader75: 2255, n: 1083 };
  it("ADO-style: +10% on 5 traders → EMPTY_ROOM DANGER", () => {
    const f = evalFundingBoard({ pc24h: 0.105, ut24h: 5, v24h: 1642, mc: 32_000_000 }, uniRow);
    expect(f.state).toBe("EMPTY_ROOM");
    expect(f.level).toBe("DANGER");
  });
  it("no move → NO_MOVE; missing ut → INSUFFICIENT", () => {
    expect(evalFundingBoard({ pc24h: 0.01, ut24h: 5, v24h: 10000, mc: 1e6 }, uniRow).state).toBe("NO_MOVE");
    expect(evalFundingBoard({ pc24h: 0.05, ut24h: null, v24h: 10000, mc: 1e6 }, uniRow).state).toBe("INSUFFICIENT");
  });
  it("crowded move → CROWDED", () => {
    const f = evalFundingBoard({ pc24h: 0.08, ut24h: 2000, v24h: 500_000, mc: 3e6 }, uniRow);
    expect(f.state).toBe("CROWDED");
  });
});
