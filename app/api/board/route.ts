// GET /api/board — snapshot view only. Zero CMC calls; zero AI.
import { getBoard } from "@/lib/board";
import { err, ok } from "@/lib/envelope";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const view = getBoard();
    return ok(view, { mode: "replay", universeAt: view.stats.universeAt });
  } catch (e) {
    return err(500, "BOARD_UNAVAILABLE", e instanceof Error ? e.message : "board assembly failed");
  }
}
