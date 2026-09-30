import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { loadUniverse } from "@/engine/universe";
import { buildBoardView } from "@/lib/board";
import { detectWaves } from "@/engine/cohort";
import { updatePersistence, daysFlaggedFor } from "@/engine/persistence";
import type { PersistStore } from "@/types";

const artifact = JSON.parse(
  readFileSync(path.join(process.cwd(), "data/universe/universe-2026-09-30.json"), "utf8"),
) as Parameters<typeof loadUniverse>[0];
const u = loadUniverse(artifact);
const view = buildBoardView(u, {});

describe("cohort — same-shape wave detection on real flagged rows", () => {
  it("detects the Base wave (same-shape ut≈30 cluster, ≥4 members)", () => {
    const wave = view.waves.find((w) => w.key.platform === "Base");
    expect(wave).toBeDefined();
    expect(wave!.size).toBeGreaterThanOrEqual(4);
    expect(wave!.medianUt).toBeLessThanOrEqual(35);
    const symbols = wave!.members.map((m) => m.symbol);
    expect(symbols).toEqual(expect.arrayContaining(["67OHIO", "FROG"]));
  });

  it("detectWaves returns [] on empty input", () => {
    expect(detectWaves([])).toEqual([]);
  });
});

describe("board stats — pinned counts", () => {
  it("stats carry universe provenance", () => {
    expect(view.stats.nTotal).toBe(2466);
    expect(view.stats.nEligible).toBe(1083);
    expect(view.stats.sha256).toBe(artifact.bodySha256);
    expect(view.stats.nFlaggedGap).toBeGreaterThan(0);
    expect(view.stats.nDormant).toBe(75); // 81 raw v=0&liq>500 minus excluded/NO_DATA
    expect(view.stats.nExcluded).toBeGreaterThan(0);
  });
  it("dual-flag rows exist (67OHIO-family = empty pump + thin tape)", () => {
    expect(view.stats.nDual).toBeGreaterThanOrEqual(4);
  });
});

describe("persistence — consecutive daysFlagged counters", () => {
  it("increments while flagged, resets to 0 on clean, keeps history", () => {
    let store: PersistStore = {};
    store = updatePersistence(store, "2026-09-30", { "Base:0x1": { gap: true, funding: true }, "Bsc:0x2": { gap: false, funding: true } });
    store = updatePersistence(store, "2026-10-01", { "Base:0x1": { gap: true, funding: false }, "Bsc:0x2": { gap: true, funding: false } });
    const a = daysFlaggedFor(store, "Base:0x1");
    expect(a).toEqual({ gap: 2, funding: 0 });
    const b = daysFlaggedFor(store, "Bsc:0x2");
    expect(b).toEqual({ gap: 1, funding: 0 });
    expect(store["Base:0x1"].snapshots).toEqual(["2026-09-30", "2026-10-01"]);
    expect(store["Bsc:0x2"].firstSeen).toBe("2026-09-30");
    expect(daysFlaggedFor(store, "absent")).toEqual({ gap: 0, funding: 0 });
  });
});
