# Antislop Delivery Gate — Washboard

Date: 2026-10-01 · Scope: board UI, drill card, API envelopes, video, copy deck.

## Verdict: PASS (with 2 documented compromises)

## Checks

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | No generic AI slop copy ("unlock insights", "supercharge", "game-changer") | PASS | grep clean; copy written to spec vocabulary |
| 2 | Forbidden claim vocabulary never user-facing | PASS | `scam`/`insider`/`wash confirmed` appear only in the forbidden-words doc, vendored jev prompt internals (never rendered), and the deliberate strikethrough scene |
| 3 | Unknown ≠ zero | PASS | `ut24h=null`→`NO_DATA`; dead `sts[]` windows filtered→`INSUFFICIENT` (shipped fix, not a patch note) |
| 4 | Provider facts vs computed vs AI opinion are visually separated | PASS | drill card sections are labeled; Jev block reads "second opinion — not the verdict" |
| 5 | Coverage labels honest | PASS | board header shows `2,466 rows / query-bounded snapshot / universeAt / sha`; no "whole market" claim |
| 6 | States implemented, not aspirational | PASS | loading/empty/error/insufficient/dormant/excluded all render; 67OHIO fixture proves INSUFFICIENT end-to-end |
| 7 | Numbers are real | PASS | video + fixtures use snapshot/fixture values only; no invented figures |
| 8 | Accessibility | PASS | semantic table, aria-labels on flags, keyboard-navigable search, text-flag chips not color-only |
| 9 | Design direction followed | PASS | warm paper, rust accent, clothesline chips, restrained motion — consistent across app + video |
| 10 | Not a prediction | PASS | "observation, not a verdict" + falsifiers present on card and video |

## Compromises (documented, not hidden)

1. **ElevenLabs VO substituted with edge-tts** — API exists and was checked (`text_to_speech` reachable) but account had 9 credits vs ~830 required. Swap `public/vo.mp3` when quota returns; script is in `docs/copy/social.md`.
2. **Jev unavailable on 3/5 showcase fixtures** — typesafe endpoint enforces a burst limit; first call succeeds, rapid subsequent calls return unavailable. This is a designed state and is shown as such on the cards.

## Residual risks

- Single dated universe artifact; harvest cadence is operator-run, not scheduled.
- Serverless deploy loses local drill persistence — mitigated by committed fixtures; live drills on Vercel are per-invocation ephemeral.
- `ut24h` is provider-reported and farmable — disclosed on every surface that uses it.

## Post-ship external audit addendum (2026-09-30)

External review (`ideas/FundingSpot-LiquidityGap-review-2026-09-30.md`) verified spec↔engine divergences. Verified independently here:

- **Doc-level bug confirmed**: handoff counts "8 ER / 7 dual" only reproduce at `pc24h≥3` (+300%) — wrong unit in spec text. Shipped engine uses `0.03` correctly (`src/types.ts:99`, `src/engine/funding.ts:151`). No product bug.
- **Canonical shipped counts**: `nEmptyRoom=313` on all reported rows (predicates: `ut≤p25` OR `$/trader≥p75` OR borderline `ut≤2×p25`→WARN). Borderline band is implemented but was under-specified — now documented.
- **Spec §6 vectors wrong**: INU/Solana ut=142 → WARN not DANGER; ADO is BELOW_FLOOR on board (drill floor-free); Base cohort = two groups ≥4, not one wave-8.
- **New risk logged**: raw 2,466-row snapshot committed to repo is a CMC redistribution gray zone — consider publishing derived stats + sha only if repo goes public.
- **Agreed, already our position**: pace/cohort are descriptive not coordinative proof; competitor/moat/subscription caveats unchanged; Data & Viz track is the right fit.
