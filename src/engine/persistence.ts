// persistence.ts — daysFlagged counters, updated at harvest time only.
// Consecutive-flag semantics: flag on this snapshot → counter+1; absent → 0.
// History (firstSeen/lastSeen/snapshots) is never reset.
import type { PersistStore } from "@/types";

export interface FlagsMap {
  [identity: string]: { gap: boolean; funding: boolean };
}

const MAX_SNAPSHOTS = 30;

export function updatePersistence(
  store: PersistStore,
  snapshotId: string,
  flags: FlagsMap,
): PersistStore {
  for (const [identity, seen] of Object.entries(flags)) {
    const row = store[identity] ?? {
      firstSeen: snapshotId,
      lastSeen: snapshotId,
      daysFlaggedGap: 0,
      daysFlaggedFunding: 0,
      snapshots: [],
    };
    row.lastSeen = snapshotId;
    if (!row.snapshots.includes(snapshotId)) {
      row.snapshots = [...row.snapshots, snapshotId].slice(-MAX_SNAPSHOTS);
    }
    row.daysFlaggedGap = seen.gap ? row.daysFlaggedGap + 1 : 0;
    row.daysFlaggedFunding = seen.funding ? row.daysFlaggedFunding + 1 : 0;
    store[identity] = row;
  }
  return store;
}

export function daysFlaggedFor(store: PersistStore, identity: string): { gap: number; funding: number } {
  const row = store[identity];
  return row ? { gap: row.daysFlaggedGap, funding: row.daysFlaggedFunding } : { gap: 0, funding: 0 };
}
