// Live-scan abuse guard: per-IP cap + global daily cap + CMC quota
// circuit-breaker. In-memory = per-serverless-instance, a floor not a hard
// cross-instance limit — the quota probe is the real monthly-budget guard.

export interface LiveGuardOpts {
  perIpCap?: number; // default 30
  globalCap?: number; // default 200
  quotaFloor?: number; // block live scans below this monthly balance
  quotaProbeEveryMs?: number; // min interval between /v1/key/info probes
}

export interface QuotaClient {
  get(endpoint: string, params?: Record<string, unknown>): Promise<{ data: unknown }>;
}

export function createLiveGuard(opts: LiveGuardOpts = {}) {
  const PER_IP = opts.perIpCap ?? 30;
  const GLOBAL = opts.globalCap ?? 200;
  const QUOTA_FLOOR = opts.quotaFloor ?? 1_000;
  const PROBE_EVERY = opts.quotaProbeEveryMs ?? 15 * 60_000;

  const hits = new Map<string, { day: string; n: number }>();
  let global = { day: "", n: 0 };
  let quota: { checkedAt: number; left: number | null } = { checkedAt: 0, left: null };
  let quotaProbe: Promise<boolean> | null = null;

  function allowIp(ip: string): boolean {
    const day = new Date().toISOString().slice(0, 10);
    if (global.day !== day) global = { day, n: 0 };
    // Bound the map: on day rollover, flush stale-day entries once they pile up.
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (v.day !== day) hits.delete(k);
    }
    if (global.n >= GLOBAL) return false;
    const e = hits.get(ip);
    if (!e || e.day !== day) {
      hits.set(ip, { day, n: 1 });
      global.n++;
      return true;
    }
    if (e.n >= PER_IP) return false;
    e.n++;
    global.n++;
    return true;
  }

  // Credits probe: /v1/key/info costs 1 credit but is the only authoritative
  // monthly-balance signal — cached per instance, re-probed at most every
  // PROBE_EVERY ms. Unknown quota state fails CLOSED so a probe outage cannot
  // silently spend live API credits. A real low-balance answer also fails
  // CLOSED (snapshot mode survives).
  async function quotaOk(client: QuotaClient): Promise<boolean> {
    if (Date.now() - quota.checkedAt < PROBE_EVERY) {
      return quota.left !== null && quota.left >= QUOTA_FLOOR;
    }
    if (quotaProbe) return quotaProbe;
    quotaProbe = (async () => {
      try {
        const { data } = await client.get("/v1/key/info");
        const left = (data as { usage?: { current_month?: { credits_left?: unknown } } } | undefined)?.usage
          ?.current_month?.credits_left;
        quota.left = typeof left === "number" ? left : null;
      } catch {
        quota.left = null;
      } finally {
        quota.checkedAt = Date.now();
      }
      return quota.left !== null && quota.left >= QUOTA_FLOOR;
    })();
    try {
      return await quotaProbe;
    } finally {
      quotaProbe = null;
    }
  }

  return { allowIp, quotaOk, PER_IP, GLOBAL, QUOTA_FLOOR };
}
