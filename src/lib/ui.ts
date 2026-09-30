// ui.ts — shared display helpers (client + server components).
import type { FundingFlag, GapFlag } from "@/types";

export const fmtUsd = (v: number | null): string => {
  if (v === null) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(v / 1e3).toFixed(1)}k`;
  return `$${v.toFixed(2)}`;
};

export const fmtPct = (v: number | null): string =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;

export const fmtAge = (d: number | null): string => {
  if (d === null) return "—";
  if (d < 1) return "<1d";
  if (d < 30) return `${Math.floor(d)}d`;
  if (d < 365) return `${Math.floor(d / 30)}mo`;
  return `${(d / 365).toFixed(1)}y`;
};

const GAP_LABEL: Record<string, string> = {
  TURNOVER_ANOMALY: "TURNOVER ANOMALY",
  CROWDED_TAPE: "crowded tape",
  ACTIVE_THIN: "active thin",
  DORMANT: "dormant",
  BELOW_FLOOR: "below floor",
  EXCLUDED: "excluded",
  NO_DATA: "no data",
};
const FUND_LABEL: Record<string, string> = {
  EMPTY_ROOM: "EMPTY ROOM",
  FADING: "FADING",
  CROWDED: "crowded",
  HOLDING: "holding",
  NO_MOVE: "no move",
  INSUFFICIENT: "insufficient",
};

export function flagClass(level: string): string {
  switch (level) {
    case "DANGER": return "flag flag-danger";
    case "WARN": return "flag flag-warn";
    case "INSUFFICIENT": return "flag flag-missing";
    case "INFO": return "flag flag-info";
    default: return "flag flag-clean";
  }
}
export const gapLabel = (g: GapFlag) => GAP_LABEL[g.state] ?? g.state;
export const fundLabel = (f: FundingFlag) => FUND_LABEL[f.state] ?? f.state;
