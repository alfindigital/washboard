// drill-index.ts — dedup index over data/drills/*.json (tokenId → record).
import { existsSync, readFileSync, readdirSync } from "fs";
import path from "path";
import type { DrillRecord } from "@/types";

const DRILLS_DIR = path.join(process.cwd(), "data", "drills");
const TTL_MS = Number(process.env.DRILL_TTL_MINUTES ?? 30) * 60_000;

let index: Map<string, { id: string; generatedAt: string; record: DrillRecord }> | null = null;

export function loadDrillIndex(): typeof index {
  if (index) return index;
  index = new Map();
  if (!existsSync(DRILLS_DIR)) return index;
  for (const f of readdirSync(DRILLS_DIR)) {
    if (!f.endsWith(".json")) continue;
    try {
      const rec = JSON.parse(readFileSync(path.join(DRILLS_DIR, f), "utf8")) as DrillRecord;
      if (!rec?.id || !rec.generatedAt) continue;
      index.set(rec.id, { id: rec.id, generatedAt: rec.generatedAt, record: rec });
    } catch {
      // unreadable file — skip, never crash the route
    }
  }
  return index;
}

/** Fresh record for tokenId within TTL, or null. */
export function findCachedDrill(tokenId: string): { id: string; generatedAt: string; record: DrillRecord } | null {
  const hit = loadDrillIndex()!.get(tokenId);
  if (!hit) return null;
  if (Date.now() - Date.parse(hit.generatedAt) > TTL_MS) return null;
  return hit;
}

export function drillFilePath(id: string): string {
  return path.join(DRILLS_DIR, `${id}.json`);
}
