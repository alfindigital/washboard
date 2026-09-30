// drill-index.ts — dedup index over data/drills/*.json (tokenId → record).
import { existsSync, readFileSync, readdirSync } from "fs";
import path from "path";
import type { DrillRecord } from "@/types";

const DRILLS_DIR = path.join(process.cwd(), "data", "drills");
const FIXTURES_DIR = path.join(process.cwd(), "data", "fixtures", "drills");
const TTL_MS = Number(process.env.DRILL_TTL_MINUTES ?? 30) * 60_000;

/** Rescan per call — bundles appear between requests; dirs stay small. */
export function loadDrillIndex(): Map<string, { id: string; generatedAt: string; record: DrillRecord }> {
  const index = new Map<string, { id: string; generatedAt: string; record: DrillRecord }>();
  for (const dir of [DRILLS_DIR, FIXTURES_DIR]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      try {
        const rec = JSON.parse(readFileSync(path.join(dir, f), "utf8")) as DrillRecord;
        if (!rec?.id || !rec.generatedAt) continue;
        index.set(rec.id, { id: rec.id, generatedAt: rec.generatedAt, record: rec });
      } catch {
        // unreadable file — skip, never crash the route
      }
    }
  }
  return index;
}

/** Fresh record for tokenId within TTL, or null. */
export function findCachedDrill(tokenId: string): { id: string; generatedAt: string; record: DrillRecord } | null {
  const hit = loadDrillIndex().get(tokenId);
  if (!hit) return null;
  if (Date.now() - Date.parse(hit.generatedAt) > TTL_MS) return null;
  return hit;
}

/** Windows-safe filename — NTFS would turn "Base:0x…" into an ADS stream. */
export function drillFilePath(id: string): string {
  return path.join(DRILLS_DIR, `${id.replace(/[^a-zA-Z0-9._-]/g, "_")}.json`);
}
