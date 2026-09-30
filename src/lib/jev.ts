// Jev (TypeSafe) adapter — cross-examiner, never the authority.
// POST https://api.typesafe.ai/v1/systemone, model jev-1.13.0.
// Jev never receives secrets or raw payloads: only the computed metric summary.

const JEV_URL = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-1.13.0";

export type JevDim = "SAFETY" | "FLOW" | "LIQUIDITY" | "PUMP";
export interface JevOpinion {
  available: boolean;
  /** Mean of per-dimension risky probabilities (0..1). */
  riskyProb: number | null;
  /** Per-dimension risky probability; null entries = Jev gave no answer. */
  dims?: Partial<Record<JevDim, number | null>>;
  tokensUsed?: number;
  error?: string;
}
export interface JevRouteResult {
  available: boolean;
  choice: string | null;
  error?: string;
}
export type Agreement = "consensus" | "contested" | "lean" | "unavailable";

/** Comma-separated key pool — every key is tried before giving up. */
function keys(): string[] {
  const raw = process.env.TYPESAFE_API_KEY ?? process.env.TYPESAFE_API_KEYS ?? "";
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

async function callJev(state: Record<string, unknown>, questions: Record<string, unknown>) {
  const pool = keys();
  let lastErr: unknown = new Error("no keys");
  for (const k of pool) {
    try {
      const res = await fetch(JEV_URL, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${k}` },
        body: JSON.stringify({ model: MODEL, state, questions }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`jev http ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

const noul = (instructions: string, isTrue: string, isFalse: string) => ({
  type: "noul",
  instructions,
  criteria: { true: isTrue, false: isFalse },
});

/** Per-dimension cross-examination: one Jev call, four independent noul questions. */
export async function jevCrossExamine(metrics: Record<string, unknown>): Promise<JevOpinion> {
  if (keys().length === 0) return { available: false, riskyProb: null, error: "TYPESAFE_API_KEYS missing" };
  try {
    const body = await callJev(
      {
        task: "Judge each evidence dimension of this DEX token INDEPENDENTLY — is this dimension risky for a buyer? Judge only from the metrics in state; do not defer to any verdict field.",
        metrics,
      },
      {
        safety: noul(
          "Do the SECURITY metrics indicate risk?",
          "honeypot/rug-pull flags, unusual taxes, vendor flag, or risky security level",
          "clean security level, no hit flags, normal taxes",
        ),
        flow: noul(
          "Do the FLOW metrics indicate manipulation?",
          "concentrated makers, near-zero third-party sells, buy-only pattern, tiny maker breadth",
          "broad maker participation, real third-party sells, balanced buy/sell",
        ),
        liquidity: noul(
          "Do the LIQUIDITY metrics indicate exit risk?",
          "shallow pools, large LP removals, negative net LP delta",
          "deep liquidity, LP adds, no large single pulls",
        ),
        pump: noul(
          "Do the PUMP metrics indicate a manufactured pump?",
          "extreme vol/mcap ratio, very few makers per volume, counter-market spike",
          "organic volume relative to mcap, adequate maker breadth",
        ),
      },
    );
    const a = body?.answers ?? {};
    const dims: JevOpinion["dims"] = {
      SAFETY: typeof a.safety?.noul === "number" ? a.safety.noul : null,
      FLOW: typeof a.flow?.noul === "number" ? a.flow.noul : null,
      LIQUIDITY: typeof a.liquidity?.noul === "number" ? a.liquidity.noul : null,
      PUMP: typeof a.pump?.noul === "number" ? a.pump.noul : null,
    };
    const probs = Object.values(dims).filter((p): p is number => typeof p === "number");
    if (probs.length === 0) return { available: false, riskyProb: null, dims, error: "malformed response" };
    return {
      available: true,
      riskyProb: probs.reduce((x, y) => x + y, 0) / probs.length,
      dims,
      tokensUsed: body?.usage?.input_tokens,
    };
  } catch (e) {
    return { available: false, riskyProb: null, error: e instanceof Error ? e.message : "jev error" };
  }
}

/** Router: pick one candidate token (or template) from a free-text query. */
export async function jevRoute(query: string, candidates: string[]): Promise<JevRouteResult> {
  if (keys().length === 0) return { available: false, choice: null, error: "TYPESAFE_API_KEYS missing" };
  try {
    const body = await callJev(
      { task: "route this user query to the best matching token candidate", query },
      {
        pick: {
          type: "choice",
          instructions: "Which candidate token does the query most likely refer to?",
          criteria: Object.fromEntries(candidates.map((c) => [c, null])),
        },
      },
    );
    const choice = body?.answers?.pick?.choice;
    if (typeof choice !== "string" || !candidates.includes(choice)) {
      return { available: false, choice: null, error: "malformed response" };
    }
    return { available: true, choice };
  } catch (e) {
    return { available: false, choice: null, error: e instanceof Error ? e.message : "jev error" };
  }
}

/**
 * Do rules and Jev point the same way?
 * Per CLAIMS: consensus when sign(rules) == sign(jev>0.5) on ≥3 of 4
 * dimensions (INSUFFICIENT dims and null probs are not comparable).
 * Falls back to the aggregate band when <3 comparable dims.
 */
export function agreement(
  verdict: string,
  jev: Pick<JevOpinion, "available" | "riskyProb" | "dims">,
  subs?: { dim: string; level: string }[],
): Agreement {
  if (!jev.available) return "unavailable";

  // Per-dimension agreement: 3+ comparable dims and every-pair agreement →
  // consensus; a contested pair → contested. But the headline check also
  // runs: if Jev's aggregate riskyProb contradicts the verdict polarity,
  // the fight is real and must show — "consensus" on a 0.24 vs JANGAN is
  // misleading. Contested always wins over consensus/lean.
  let dimResult: "consensus" | "contested" | null = null;
  if (jev.dims && subs) {
    let match = 0;
    let comparable = 0;
    for (const s of subs) {
      const p = jev.dims[s.dim as JevDim];
      if (p == null || s.level === "INSUFFICIENT") continue;
      comparable++;
      const rulesRisky = s.level === "WARN" || s.level === "DANGER";
      const jevRisky = p > 0.5;
      if (rulesRisky === jevRisky) match++;
    }
    if (comparable >= 3) dimResult = match >= 3 ? "consensus" : "contested";
  }

  if (jev.riskyProb === null) return dimResult ?? "unavailable";
  const rulesSayRisky = verdict === "JANGAN" || verdict === "RAWAN";
  const rulesSaySafe = verdict === "LAYAK";
  let band: Agreement;
  if (jev.riskyProb >= 0.65) band = rulesSayRisky ? "consensus" : "contested";
  else if (jev.riskyProb <= 0.35) band = rulesSaySafe ? "consensus" : "contested";
  else band = "lean";

  if (dimResult === "contested" || band === "contested") return "contested";
  if (dimResult === "consensus" && band === "consensus") return "consensus";
  return band === "lean" ? "lean" : (dimResult ?? band);
}
