import type { Metadata } from "next";
import { readFileSync } from "fs";
import { drillFilePath } from "@/lib/drill-index";
import { DrillCard } from "@/components/DrillCard";
import { DrillSearch } from "@/components/DrillSearch";
import type { DrillRecord } from "@/types";

export const dynamic = "force-dynamic";

function loadRecord(id: string): DrillRecord | null {
  if (!/^[\w.:-]{3,140}$/.test(id)) return null;
  try {
    return JSON.parse(readFileSync(drillFilePath(id), "utf8")) as DrillRecord;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const rec = loadRecord(decodeURIComponent(id));
  if (!rec) return { title: "Washboard — drill not found" };
  const er = rec.flags.empty_room;
  const fd = rec.flags.fading;
  const lvl = [er.level, fd.level].includes("DANGER") ? "DANGER" : [er.level, fd.level].includes("WARN") ? "WARN" : "clean";
  return {
    title: `${rec.subject.symbol} — ${lvl} | Washboard`,
    description: `${rec.subject.symbol} drill: empty-room ${er.state.toLowerCase()} (${er.level.toLowerCase()}), fading ${fd.state.toLowerCase()} (${fd.level.toLowerCase()}). Observed CMC fields, not a prediction.`,
  };
}

export default async function DrillRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rec = loadRecord(decodeURIComponent(id));
  if (!rec) {
    return (
      <div>
        <div className="notice" role="alert">
          <strong>no drill bundle</strong> — this token hasn&apos;t been drilled yet, or the record was
          rotated out. Run a live drill below.
        </div>
        <div style={{ marginTop: 14 }}>
          <DrillSearch />
        </div>
      </div>
    );
  }
  return (
    <div>
      <p className="mono-sm dim">
        <a className="link" href="/">← the blotter</a> · replay of a captured drill (mode: {rec.mode})
      </p>
      <DrillCard rec={rec} />
      <div style={{ marginTop: 18 }}>
        <DrillSearch />
      </div>
    </div>
  );
}
