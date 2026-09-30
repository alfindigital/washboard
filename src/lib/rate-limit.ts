// rate-limit.ts — drill abuse guard. Wraps vendored live-guard (per-IP +
// global daily caps) with a daily CMC credit budget counter.
import { createLiveGuard } from "@/lib/live-guard";

const PER_IP = Number(process.env.WB_PER_IP_LIMIT ?? 30);
const GLOBAL = Number(process.env.WB_GLOBAL_LIMIT ?? 200);
const CREDIT_BUDGET = Number(process.env.WB_DAILY_CREDIT_BUDGET ?? 40);

const guard = createLiveGuard({ perIpCap: PER_IP, globalCap: GLOBAL, quotaFloor: 1_000 });

let credits = { day: "", spent: 0 };

export function allowDrill(ip: string): { ok: true } | { ok: false; reason: string } {
  if (!guard.allowIp(ip)) return { ok: false, reason: `rate limit: ${PER_IP}/day per visitor or ${GLOBAL}/day global` };
  return { ok: true };
}

/** Reserve CMC credits for a drill; fails closed when the daily budget is spent. */
export function spendCredits(n: number): { ok: true; remaining: number } | { ok: false; reason: string } {
  const day = new Date().toISOString().slice(0, 10);
  if (credits.day !== day) credits = { day, spent: 0 };
  if (credits.spent + n > CREDIT_BUDGET) {
    return { ok: false, reason: `daily CMC credit budget exhausted (${CREDIT_BUDGET}/day)` };
  }
  credits.spent += n;
  return { ok: true, remaining: CREDIT_BUDGET - credits.spent };
}

export function creditsRemaining(): number {
  const day = new Date().toISOString().slice(0, 10);
  if (credits.day !== day) return CREDIT_BUDGET;
  return Math.max(0, CREDIT_BUDGET - credits.spent);
}

export { guard };
