// GET /api/drill/[id] — fetch a persisted drill record (replay, zero CMC).
import { existsSync, readFileSync } from "fs";
import { drillFilePath, loadDrillIndex } from "@/lib/drill-index";
import { err, ok } from "@/lib/envelope";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[\w.:-]{3,140}$/.test(id)) return err(400, "BAD_REQUEST", "malformed drill id");
  // Index knows both local drills and committed fixtures — return its record.
  const hit = loadDrillIndex().get(id);
  if (hit) return ok(hit.record, { mode: "replay" });
  const local = drillFilePath(id);
  try {
    if (!existsSync(local)) return err(404, "NOT_FOUND", `no drill bundle "${id}"`);
    return ok(JSON.parse(readFileSync(local, "utf8")), { mode: "replay" });
  } catch {
    return err(404, "NOT_FOUND", `no drill bundle "${id}"`);
  }
}
