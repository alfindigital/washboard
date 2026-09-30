# Washboard — copy deck

All copy follows the product's own rules: observations, not accusations. No
"scam", no "wash confirmed", no "insider", no price predictions. Flags are
evidence states, not verdicts.

## Tagline

**Washboard — evidence before conviction.**

Alternates:
- The busy tape isn't always a crowded room.
- Two lenses on every token. Never one score.
- A blotter for spot-market anomalies — with receipts.

## One-liner (submission / README hero)

> Washboard replays a hash-pinned snapshot of 2,466 spot DEX tokens and flags
> two independent anomalies — turnover that outruns its reported crowd, and
> price moves with a near-empty room — every flag shipped with its API receipt.

## 60-second pitch (video VO — shipped)

Two shipped cuts: `video/washboard-demo.mp4` (edge-tts single voice) and
`video/washboard-demo-el.mp4` (**ElevenLabs v4**, two voices — Brian reads the
problem/lenses, Sarah reads evidence/method/outro; per-line assets
`public/vo-el-s*.mp3`, timings `public/vo-el-timing.json`, generator
`scripts/gen-vo-elevenlabs.py`). The EL cut also carries the post-audit
wording ("two separate questions", "AI second opinion").

> Most DEX boards rank tokens by volume and price. But volume alone doesn't
> tell you who's actually in the room.
>
> Washboard replays one snapshot of 2,466 spot tokens and asks two separate
> questions.
>
> First: is this turnover real? High volume cycling through a thin pool,
> reported by only a handful of unique traders, gets flagged as a turnover
> anomaly.
>
> Second: is this move backed by anyone? A price pump with a near-empty room
> gets flagged separately — two lenses, never one score.
>
> Every flag ships with its receipt: the query, the timestamp, the hash.
> Reproducible, not vibes.
>
> And because numbers deserve a second read, each drill card adds an
> independent AI opinion — labeled, and never the verdict.
>
> No accusations. No predictions. Just the evidence, and what would change the
> view.
>
> Washboard. Evidence before conviction.

## Social captions

### X / Twitter — launch post

$299,046 in reported 24h volume. $12,099 in the pool. 6 reported unique traders.

Washboard replays a snapshot of 2,466 spot tokens and flags this kind of tape —
plus pumps nobody showed up for.

Two lenses. Receipts on every flag. No verdicts — just what was observed, and
what would change the view.

### X — shorter variant

A busy tape is not a crowded room.

Washboard flags turnover anomalies and empty-room pumps across a 2,466-token
snapshot — deterministic rules, hashable receipts, AI opinion labeled as a
second read only.

### LinkedIn / long form

Most DEX dashboards rank tokens by volume and price. Neither tells you how many
participants the provider actually counted.

Washboard is a blotter built on the CoinMarketCap DEX API. It takes one pinned
snapshot (2,466 tokens, 1,083 eligible after liquidity and coverage floors) and
runs two independent lenses:

1. Turnover anomaly — volume/liquidity ratio far above the eligible-set
   percentile while reported unique traders sit in the bottom quartile.
2. Empty room / fading crowd — a ≥3% 24h move reported against thin
   participation, or a green day whose short-window momentum and trader pace
   have already rolled over.

Nothing is merged into a composite score. Every flag carries the API receipt —
endpoint, timestamp, SHA-256 of the response body — so the analysis replays
exactly. An optional second opinion (an independent AI model) is shown beside
the rules verdict, clearly labeled as opinion, never the flag itself.

The board will not say "scam", "wash confirmed", or "insider" — the data does
not support those claims. It shows what was observed, the percentile it was
measured against, and the falsifier that would change the view.

### Hackathon submission blurb (short)

Washboard is an evidence-first blotter over the CMC DEX API: a replayable
snapshot board that flags turnover anomalies and empty-room pumps as two
independent lenses — deterministic rules, provider-labeled counts, sha-pinned
receipts on every call, and a clearly-labeled AI second opinion that never
overrides the rules. Spot-only. No accusations, no predictions — observations
with falsifiers attached.

## On-screen captions (video)

Synced to `public/vo.vtt` — burned into `video/washboard-demo.mp4` via the
Remotion `Captions` component. Source timings in `src/remotion/WashboardDemo.tsx`.

## Words we do not use

`scam` · `wash confirmed` · `insider` · `manipulation` · `guaranteed` ·
`will pump` / `will dump` · `rug`

Approved replacements: `flagged`, `observed`, `reported`, `anomaly`,
`insufficient evidence`, `what would change this view`.
