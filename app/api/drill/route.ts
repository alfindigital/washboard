// POST /api/drill — on-demand token drill. Live-gated, replay fallback.
import { z } from "zod";
import { runDrill, DrillError } from "@/lib/api-drill";
import { allowDrill } from "@/lib/rate-limit";
import { err, ok } from "@/lib/envelope";

export const dynamic = "force-dynamic";

const Body = z
  .object({
    q: z.string().trim().min(1).max(120).optional(),
    platform: z.string().trim().min(1).max(60).optional(),
    address: z.string().trim().min(8).max(160).optional(),
  })
  .refine((b) => Boolean(b.q) || (b.platform && b.address), {
    message: "provide {q} or {platform,address}",
  });

const STATUS: Record<string, number> = {
  BAD_REQUEST: 400,
  AMBIGUOUS: 409,
  NOT_FOUND: 404,
  DRILL_UNAVAILABLE: 503,
  LIVE_QUOTA: 429,
  RATE_LIMITED: 429,
};

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "local";
  if (!allowDrill(ip).ok) {
    return err(429, "RATE_LIMITED", "too many drills from this visitor today");
  }
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    return err(400, "BAD_REQUEST", e instanceof z.ZodError ? e.issues[0]?.message ?? "invalid body" : "invalid body");
  }
  try {
    const result = await runDrill(body);
    return ok(result, { mode: result.mode });
  } catch (e) {
    if (e instanceof DrillError) {
      return err(STATUS[e.code] ?? 500, e.code, e.message, e.details);
    }
    return err(500, "DRILL_FAILED", e instanceof Error ? e.message : "drill failed");
  }
}
