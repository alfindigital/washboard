// jev-funding.ts — Jev second opinion for the drill card: 2 noul questions,
// input = computed metrics only (never raw payload / API key).
// Contract per FundingSpot-plan §5. Jev down → flags still ship, probs null.
const JEV_URL = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-1.13.0";

export type JevAgreement = "consensus" | "contested" | "lean" | "unavailable";

function keys(): string[] {
  const raw = process.env.TYPESAFE_API_KEY ?? process.env.TYPESAFE_API_KEYS ?? "";
  return raw.split(",").map((k) => k.trim()).filter(Boolean);
}

const noul = (instructions: string, isTrue: string, isFalse: string) => ({
  type: "noul",
  instructions,
  criteria: { true: isTrue, false: isFalse },
});

export interface JevFundingOpinion {
  emptyRoomProb: number | null;
  fadingProb: number | null;
  agreement: JevAgreement;
  latencyMs: number | null;
  error?: string;
}

export async function jevFunding(metrics: Record<string, unknown>): Promise<JevFundingOpinion> {
  if (keys().length === 0) {
    return { emptyRoomProb: null, fadingProb: null, agreement: "unavailable", latencyMs: null, error: "TYPESAFE_API_KEYS missing" };
  }
  const t0 = Date.now();
  let lastErr: unknown = new Error("no keys");
  for (const k of keys()) {
    try {
      const res = await fetch(JEV_URL, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${k}` },
        signal: AbortSignal.timeout(4_000),
        body: JSON.stringify({
          model: MODEL,
          state: {
            task: "Judge this DEX token's two participation anomalies INDEPENDENTLY from the computed metrics in state. Probability 0..1.",
            metrics,
          },
          questions: {
            emptyRoom: noul(
              "Does the price move rest on thin participation?",
              "very low unique traders vs peers, high USD-per-trader, high tx-churn per wallet",
              "broad unique-trader participation proportional to the move",
            ),
            fadingCrowd: noul(
              "Is the move already losing crowd and momentum?",
              "negative 1h/4h price windows after a green 24h, declining trader density",
              "recent windows hold or grow participation",
            ),
          },
        }),
      });
      if (!res.ok) throw new Error(`jev http ${res.status}`);
      const body = await res.json();
      const er = body?.answers?.emptyRoom?.noul;
      const fc = body?.answers?.fadingCrowd?.noul;
      const prob = (v: unknown) => (typeof v === "number" && v >= 0 && v <= 1 ? v : null);
      const emptyRoomProb = prob(er);
      const fadingProb = prob(fc);
      if (emptyRoomProb === null && fadingProb === null) {
        return { emptyRoomProb: null, fadingProb: null, agreement: "unavailable", latencyMs: Date.now() - t0, error: "malformed response" };
      }
      return { emptyRoomProb, fadingProb, agreement: "unavailable", latencyMs: Date.now() - t0 };
    } catch (e) {
      lastErr = e;
    }
  }
  return {
    emptyRoomProb: null,
    fadingProb: null,
    agreement: "unavailable",
    latencyMs: Date.now() - t0,
    error: lastErr instanceof Error ? lastErr.message : "jev error",
  };
}

/** Sign-match Jev probs vs rule outcomes. Contested wins; greyzone → lean. */
export function fundingAgreement(
  rules: { emptyRoom: string; fading: string },
  jev: { emptyRoomProb: number | null; fadingProb: number | null },
): JevAgreement {
  const pair = (rulesLevel: string, p: number | null): "agree" | "fight" | "grey" | "na" => {
    if (p === null || rulesLevel === "INSUFFICIENT" || rulesLevel === "CLEAN") return "na";
    const rulesRisky = rulesLevel === "WARN" || rulesLevel === "DANGER";
    if (p > 0.65 || p < 0.35) {
      const jevRisky = p > 0.5;
      return rulesRisky === jevRisky ? "agree" : "fight";
    }
    return "grey";
  };
  const a = pair(rules.emptyRoom, jev.emptyRoomProb);
  const b = pair(rules.fading, jev.fadingProb);
  if (a === "fight" || b === "fight") return "contested";
  if (a === "na" && b === "na") return "unavailable";
  if (a === "grey" || b === "grey") return "lean";
  return "consensus";
}
