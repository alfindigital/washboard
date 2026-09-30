import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { drillFilePath } from "@/lib/drill-index";
import type { DrillRecord } from "@/types";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function load(id: string): DrillRecord | null {
  if (!/^[\w.:-]{3,140}$/.test(id)) return null;
  try {
    return JSON.parse(readFileSync(drillFilePath(id), "utf8")) as DrillRecord;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rec = load(decodeURIComponent(id));
  const paper = "#f6f1e7";
  const ink = "#262019";
  const rust = "#b23a1d";

  const sym = rec?.subject.symbol ?? "unknown";
  const er = rec?.flags.empty_room;
  const fd = rec?.flags.fading;
  const worst = [er?.level, fd?.level].includes("DANGER") ? "DANGER" : [er?.level, fd?.level].includes("WARN") ? "WARN" : "CLEAN";
  const chips = rec
    ? [
        `EMPTY ROOM — ${er!.level}`,
        `FADING — ${fd!.level}`,
        rec.metrics.ut24h !== null ? `${rec.metrics.ut24h} traders` : "traders unreported",
      ]
    : ["drill bundle not found"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: paper, padding: 56, fontFamily: "serif",
          border: `10px solid ${ink}`,
        }}
      >
        <div style={{ fontSize: 26, color: rust, letterSpacing: 4, textTransform: "uppercase" }}>
          Washboard — drill card
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 24 }}>
          <div style={{ fontSize: 110, color: ink, fontWeight: 700 }}>{sym}</div>
          <div
            style={{
              fontSize: 34, color: worst === "CLEAN" ? "#3f6f51" : worst === "WARN" ? "#b07d10" : rust,
              border: `3px solid ${worst === "CLEAN" ? "#3f6f51" : worst === "WARN" ? "#b07d10" : rust}`,
              padding: "6px 18px",
            }}
          >
            {worst}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 30 }}>
          {chips.map((c) => (
            <div
              key={c}
              style={{ fontSize: 26, color: ink, border: "2px solid #b8ab90", padding: "8px 16px", background: "#fdfaf2" }}
            >
              {c}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", fontSize: 22, color: "#8a7d6a", display: "flex", justifyContent: "space-between" }}>
          <span>volume vs. people — observed, not predicted</span>
          <span>addresses are not entities</span>
        </div>
      </div>
    ),
    size,
  );
}
