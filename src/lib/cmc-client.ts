import { createHash } from "crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { SourceEvidence } from "@/lib/verdict-types";

export interface Receipt {
  endpoint: string;
  params: Record<string, unknown>;
  ts: string;
  credits: number;
  sha256: string;
  cached: boolean;
}

export interface CmcResult<T> {
  data: T;
  receipt: Receipt;
  source?: SourceEvidence;
}

export class CmcError extends Error {
  constructor(
    public code: number,
    message: string,
    public endpoint: string,
  ) {
    super(message);
    this.name = "CmcError";
  }
}

export interface CmcClientOpts {
  apiKey?: string;
  apiKeys?: string[];
  fallbackApiKey?: string;
  logPath: string;
  cacheDir: string;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  quotaFloor?: number;
}

interface CmcEnvelope<T> {
  data?: T;
  status?: { error_code?: number | string; error_message?: string | null; credit_count?: number; timestamp?: string };
}

export function createCmcClient(opts: CmcClientOpts) {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const baseUrl = opts.baseUrl ?? "https://pro-api.coinmarketcap.com";
  mkdirSync(path.dirname(opts.logPath), { recursive: true });
  mkdirSync(opts.cacheDir, { recursive: true });

  const rawList: (string | undefined)[] = [];
  if (opts.apiKeys && opts.apiKeys.length > 0) {
    rawList.push(...opts.apiKeys);
  } else {
    if (opts.apiKey) rawList.push(opts.apiKey);
    if (opts.fallbackApiKey) rawList.push(opts.fallbackApiKey);
  }

  const keys = Array.from(
    new Set(
      rawList
        .flatMap((k) => (k ? String(k).split(",") : []))
        .map((k) => k.trim())
        .filter(Boolean),
    ),
  );

  if (keys.length === 0) {
    throw new Error("createCmcClient: at least one API key is required");
  }

  let activeKeyIndex = 0;
  const permanentlyExhausted = new Set<number>();

  function cacheKey(endpoint: string, params: Record<string, unknown>) {
    return createHash("sha256").update(endpoint + JSON.stringify(sortObj(params))).digest("hex");
  }

  function sortObj(o: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  }

  async function get<T>(endpoint: string, params: Record<string, unknown> = {}, o?: { ttlMs?: number }): Promise<CmcResult<T>> {
    const key = cacheKey(endpoint, params);
    const cacheFile = path.join(opts.cacheDir, `${key}.json`);
    if (o?.ttlMs && existsSync(cacheFile)) {
      try {
        const raw = JSON.parse(readFileSync(cacheFile, "utf8")) as { cachedAt?: unknown; data?: T; receipt?: Receipt };
        const cachedAt = typeof raw.cachedAt === "number" ? raw.cachedAt : 0;
        if (cachedAt > 0 && Date.now() - cachedAt < o.ttlMs && raw.receipt) {
          return { data: raw.data as T, receipt: { ...raw.receipt, cached: true } };
        }
      } catch {
        // Corrupt/partial cache is disposable; refetch from the provider.
      }
    }

    const url = new URL(baseUrl + endpoint);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

    const MAX_ATTEMPTS = 2;
    const REQUEST_DEADLINE_MS = 15_000;
    const ATTEMPT_TIMEOUT_MS = 6_000;
    const deadlineAt = Date.now() + REQUEST_DEADLINE_MS;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const retryWithinBudget = () => Date.now() + 2_000 <= deadlineAt;
    let lastErr: unknown;
    let receipt: Receipt | undefined;
    let data: T | undefined;

    // Start from current non-exhausted active key
    let startIdx = activeKeyIndex;
    while (permanentlyExhausted.has(startIdx) && startIdx < keys.length - 1) {
      startIdx++;
    }
    activeKeyIndex = startIdx;

    for (let keyIdx = startIdx; keyIdx < keys.length; keyIdx++) {
      if (Date.now() >= deadlineAt) break;
      if (permanentlyExhausted.has(keyIdx) && keyIdx < keys.length - 1) {
        continue;
      }
      const currentKey = keys[keyIdx];
      let fallbackTriggered = false;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          const remainingMs = deadlineAt - Date.now();
          if (remainingMs <= 0) throw new CmcError(408, `request deadline exceeded on ${endpoint}`, endpoint);
          const res = await fetchImpl(url.toString(), {
            headers: { "X-CMC_PRO_API_KEY": currentKey, Accept: "application/json" },
            signal: AbortSignal.timeout(Math.min(ATTEMPT_TIMEOUT_MS, remainingMs)),
          });
          const rawText = await res.text();

          if (!res.ok) {
            // Check if fallback to another key is available
            const hasFallback = keyIdx < keys.length - 1;
            if (res.status === 429 && hasFallback) {
              console.warn(`[cmc-client] Key [${keyIdx}] hit HTTP 429 rate limit on ${endpoint}, falling back to next key...`);
              activeKeyIndex = keyIdx + 1;
              fallbackTriggered = true;
              break;
            }
            if ((res.status === 401 || res.status === 403) && hasFallback) {
              console.warn(`[cmc-client] Key [${keyIdx}] auth error (HTTP ${res.status}) on ${endpoint}, falling back to next key...`);
              permanentlyExhausted.add(keyIdx);
              activeKeyIndex = keyIdx + 1;
              fallbackTriggered = true;
              break;
            }

            if ((res.status >= 500 || res.status === 429) && attempt < MAX_ATTEMPTS - 1 && retryWithinBudget()) {
              await sleep(400 * Math.pow(2, attempt));
              continue;
            }
            throw new CmcError(res.status, `HTTP ${res.status} on ${endpoint}`, endpoint);
          }

          const env = JSON.parse(rawText) as CmcEnvelope<T>;
          const code = Number(env.status?.error_code ?? 0);
          if (code !== 0) {
            const hasFallback = keyIdx < keys.length - 1;
            // 1008 = Credit limit reached / HTTP request limit reached
            if (code === 1008 && hasFallback) {
              console.warn(`[cmc-client] Key [${keyIdx}] credit limit reached (code 1008), falling back to next key...`);
              permanentlyExhausted.add(keyIdx);
              activeKeyIndex = keyIdx + 1;
              fallbackTriggered = true;
              break;
            }
            // 1001/1002/1006/1007 = Invalid key, bad format, plan restricted, missing
            if ([1001, 1002, 1006, 1007].includes(code) && hasFallback) {
              console.warn(`[cmc-client] Key [${keyIdx}] code ${code} (${env.status?.error_message}), falling back to next key...`);
              permanentlyExhausted.add(keyIdx);
              activeKeyIndex = keyIdx + 1;
              fallbackTriggered = true;
              break;
            }

            if (code >= 500 && code < 600 && attempt < MAX_ATTEMPTS - 1 && retryWithinBudget()) {
              await sleep(400 * Math.pow(2, attempt));
              continue;
            }
            throw new CmcError(code, env.status?.error_message ?? "CMC error", endpoint);
          }

          // Special check for /v1/key/info to preemptively switch if credits are below floor
          if (endpoint.includes("/v1/key/info")) {
            const left = (env.data as { usage?: { current_month?: { credits_left?: unknown } } } | undefined)
              ?.usage?.current_month?.credits_left;
            const quotaFloor = opts.quotaFloor ?? 1000;
            if (typeof left === "number" && left < quotaFloor && keyIdx < keys.length - 1) {
              console.warn(`[cmc-client] Key [${keyIdx}] balance (${left}) below floor (${quotaFloor}), switching to fallback key...`);
              permanentlyExhausted.add(keyIdx);
              activeKeyIndex = keyIdx + 1;
              fallbackTriggered = true;
              break;
            }
          }

          receipt = {
            endpoint,
            params: sortObj(params),
            ts: env.status?.timestamp ?? new Date().toISOString(),
            credits: env.status?.credit_count ?? 0,
            sha256: createHash("sha256").update(rawText).digest("hex"),
            cached: false,
          };
          data = env.data as T;
          break;
        } catch (e) {
          if (e instanceof CmcError) {
            lastErr = e;
            const hasFallback = keyIdx < keys.length - 1;
            if (([401, 403, 429, 1008, 1001, 1002, 1006, 1007].includes(e.code)) && hasFallback) {
              fallbackTriggered = true;
              activeKeyIndex = keyIdx + 1;
              break;
            }
            throw e;
          }
          lastErr = e;
          if (attempt < MAX_ATTEMPTS - 1 && retryWithinBudget()) await sleep(400 * Math.pow(2, attempt));
        }
      }

      if (fallbackTriggered) {
        continue;
      }

      if (receipt && data !== undefined) {
        break;
      }
    }

    if (!receipt) throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));

    appendFileSync(opts.logPath, JSON.stringify(receipt) + "\n");

    if (o?.ttlMs) {
      writeFileSync(cacheFile, JSON.stringify({ cachedAt: Date.now(), data, receipt }));
    }

    return { data: data as T, receipt };
  }

  return {
    get,
    getActiveKeyIndex: () => activeKeyIndex,
    getKeyCount: () => keys.length,
    resetExhaustion: () => { permanentlyExhausted.clear(); activeKeyIndex = 0; },
  };
}

