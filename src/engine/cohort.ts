// cohort.ts — same-shape cluster detection ("waves"). Descriptive only:
// a wave = ≥4 flagged members sharing (platform, ageBand, utBand, ratioBand).
// Never "coordinated control" — the label is same-shape cluster + caveat.
import type { BoardRow, CohortKey, SearchRow, Wave } from "@/types";

export function ageBand(ageDays: number | null): string {
  if (ageDays === null) return "unknown";
  if (ageDays < 1) return "0-1d";
  if (ageDays < 7) return "1-7d";
  if (ageDays < 30) return "7-30d";
  return ">30d";
}

export function ageDaysOf(row: SearchRow, capturedAt: string): number | null {
  const ts = row.firstPairTs ?? row.firstPoolTs;
  if (ts === null) return null;
  const cap = Date.parse(capturedAt);
  if (!Number.isFinite(cap)) return null;
  return Math.max(0, (cap - ts) / 86_400_000);
}

function utBand(ut: number | null): string {
  if (ut === null) return "unknown";
  if (ut < 10) return "<10";
  if (ut < 50) return "10-50";
  if (ut < 200) return "50-200";
  return "200+";
}

export function cohortKey(row: BoardRow): CohortKey {
  return {
    platform: row.platform,
    ageBand: ageBand(row.ageDays),
    utBand: utBand(row.ut24h),
    ratioBand: "flagged", // members pre-filtered to flagged rows
  };
}

const flagged = (r: BoardRow) =>
  r.gap.state !== "EXCLUDED" && r.gap.state !== "NO_DATA" &&
  (r.gap.level === "WARN" || r.gap.level === "DANGER" || r.funding.level === "WARN" || r.funding.level === "DANGER");

/** Detect waves among flagged board rows: same platform × age × ut band, ≥4. */
export function detectWaves(rows: BoardRow[]): Wave[] {
  const groups = new Map<string, BoardRow[]>();
  for (const r of rows) {
    if (!flagged(r)) continue;
    const k = `${r.platform}|${ageBand(r.ageDays)}|${utBand(r.ut24h)}`;
    const list = groups.get(k) ?? [];
    list.push(r);
    groups.set(k, list);
  }
  const waves: Wave[] = [];
  for (const [k, members] of groups) {
    if (members.length < 4) continue;
    const [platform, aBand, uBand] = k.split("|");
    const ratios = members.map((m) => m.metrics.turnover).filter((v): v is number => v !== null).sort((a, b) => a - b);
    const uts = members.map((m) => m.ut24h).filter((v): v is number => v !== null).sort((a, b) => a - b);
    const median = (s: number[]) => (s.length ? s[Math.floor(s.length / 2)] : null);
    waves.push({
      key: { platform, ageBand: aBand, utBand: uBand, ratioBand: "flagged" },
      size: members.length,
      members: members.map((m) => ({
        identity: m.identity,
        symbol: m.symbol,
        address: m.address,
        ratio: m.metrics.turnover,
        ut: m.ut24h,
      })),
      medianRatio: median(ratios),
      medianUt: median(uts),
    });
  }
  return waves.sort((a, b) => b.size - a.size);
}
