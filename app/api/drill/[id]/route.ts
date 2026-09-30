// GET /api/drill/[id] — fetch a persisted drill record (replay, zero CMC).
import { readFileSync } from "fs";
import { drillFilePath } from "@/lib/drill-index";
import { err, ok } from "@/lib/envelope";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[\w.:-]{3,140}$/.test(id)) return err(400, "BAD_REQUEST", "malformed drill id");
  try {
    const bundle = JSON.parse(readFileSync(drillFilePath(id), "utf8"));
    return ok(bundle, { mode: "replay" });
  } catch {
    return err(404, "NOT_FOUND", `no drill bundle "${id}"`);
  }
}
