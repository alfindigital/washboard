# Washboard — Technical Specification

> Spec-kit: `specs/TECH_SPEC.md`. Engine contracts yang diimplementasi verbatim:
> `../ideas/LiquidityGap-plan.md` §3 (universe/exclusions/gap/cohort/persistence) dan
> `../ideas/FundingSpot-plan.md` §4 (funding.ts, Jev). File ini mengikat bentuk app-nya — formula TIDAK diubah di sini.

---

## Part 1: Architecture & Tech Stack

### 1.1 Tech Stack

| Layer | Teknologi | Justifikasi |
| :--- | :--- | :--- |
| Runtime | Node ≥20, package manager **pnpm** | Konsisten sibling |
| Frontend | **Next.js 15 App Router** + React 19 + Tailwind CSS v4 | Pola makerheat/ghosttape; server routes untuk drill; Vercel-deployable |
| Language | TypeScript strict | Nol `any` di engine path |
| Validation | **Zod** | Schema shared client/server |
| Testing | **Vitest** | Konsisten sibling |
| Lint | `tsc --noEmit` + `eslint` (flat config sibling) | |
| Storage | **File artifacts** committed (`data/`) — no DB | Board dari snapshot; drill records = JSON files |
| AI | **Jev `noul` ×2** per drill via vendored `src/lib/jev.ts` (env `TYPESAFE_API_KEYS`) | second opinion probabilistik, per FundingSpot spec §5 |
| CMC | vendored `src/lib/cmc-client.ts` + `dex.ts` (dari `verdex`) + `live-guard.ts` | keyed endpoints, quota guard |
| Deploy | **Vercel** | Deploy target user |
| Secrets | `.env.local` + Vercel env vars; `.env.example` terdokumentasi; nol secret di repo | |

### 1.2 Layered Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│ PRESENTATION   app/(board)/page.tsx, app/drill/[id]/page.tsx │
│                components/board/*, components/drill/*        │
│  - render only; DILARANG call CMC/fetch langsung             │
├──────────────────────────────────────────────────────────────┤
│ BUSINESS       src/engine/*                                  │
│  universe.ts · exclusions.ts · gap.ts · funding.ts           │
│  funding-board.ts · cohort.ts · persistence.ts · drills.ts   │
│  - murni TS, deterministik, testable tanpa network           │
├──────────────────────────────────────────────────────────────┤
│ DATA           src/lib/* (vendored) + data/* artifacts       │
│  cmc-client.ts · dex.ts · address.ts · jev.ts · live-guard   │
│  api-board.ts (GET /api/board) · api-drill.ts (POST /api/…)  │
│  data/universe/*, data/persistence.json, data/drills/*       │
└──────────────────────────────────────────────────────────────┘
```

Boundary keras: `src/engine/*` tidak meng-import `src/lib/*` yang menyentuh network — engine menerima typed rows, mengembalikan typed results. Test fixtures memakai types yang sama dengan live.

### 1.3 Folder Structure (target)

```text
washboard/
├── specs/{PRODUCT_SPEC,TECH_SPEC,DESIGN_SPEC}.md
├── PLAN.md · TASKS.md · TODO.md · CONTEXT.md · README.md
├── app/
│   ├── layout.tsx · globals.css · page.tsx          # board
│   ├── drill/[id]/page.tsx · drill/[id]/opengraph-image.tsx
│   └── api/board/route.ts · api/drill/route.ts · api/drill/[id]/route.ts
├── components/{board,drill}/*
├── src/
│   ├── engine/{universe,exclusions,gap,funding,funding-board,cohort,persistence,drills}.ts
│   ├── lib/{cmc-client,dex,address,jev,live-guard,api-board,api-drill}.ts
│   ├── fixtures/{funding-vectors,regression}.ts      # copied from FundingSpot spec
│   └── types.ts                                      # SearchRow, WindowStat, flags, bands
├── data/
│   ├── universe/{universe-2026-09-30.json,latest.json}
│   ├── persistence.json  (init {})
│   ├── drills/.gitkeep
│   └── fixtures/{fundingspot-sample.json}            # regression fixture dari ideas/
├── scripts/{harvest-universe.mjs,update-persistence.mjs,verify-evidence.mjs,queries.txt}
├── tests/{universe,exclusions,gap,funding,cohort,persistence,board,api}.test.ts
└── docs/living/{CURRENT_STATE,HANDOVER}.md
```

### 1.4 Third-Party Integrations

| Service | Fungsi | Koneksi |
| :--- | :--- | :--- |
| CMC DEX API | `/v1/dex/search` (resolve+universe), `/v1/dex/token` (drill), `/v1/dex/token/pools` (pool age+confidence), `/v1/dex/tokens/transactions` (drill detail, gated) | `cmc-client.ts`, keyed `CMC_API_KEY`, ≤3 credits/call drill |
| Jev `noul` | second opinion probabilistik per flag | `jev.ts`, keyed `TYPESAFE_API_KEYS`, 2 calls/drill |
| Vercel | hosting + OG image route | deploy |

---

## Part 2: Data Artifacts & Dictionary (no DB)

> No relational schema — storage = committed JSON artifacts. Canonical shapes di sini.

### 2.1 `data/universe/universe-<YYYY-MM-DD>.json`

```typescript
interface UniverseFile {
  version: 1;
  capturedAt: string;              // ISO, harvest time
  source: 'harvest-universe.mjs';
  queries: string[];               // queries actually used
  credits: number;
  sha256: string;                  // of normalized rows json (minified, sorted keys)
  stats: { total: number; eligible: number; perChain: Record<string, {n: number; eligible: number}> };
  bands: {
    global: PercentileBands;
    perChain: Record<string, PercentileBands>;
    eligibleCriteria: { vMin: 5000; liqMin: 500 };
    eligibleN: number;
    minSample: number;             // 30
  };
  rows: SearchRow[];
}
```

`latest.json` = pointer `{pointsTo, capturedAt, sha256}` — tidak menyalin rows (hindari duplikasi 5MB di repo).

### 2.2 `data/persistence.json`

```typescript
type PersistStore = Record<string /* `${platform}:${address}` */, {
  firstSeen: string; lastSeen: string;
  snapshots: string[];                       // capturedAt list, max 30 rolling
  daysFlaggedGap: number; daysFlaggedFunding: number;
}>;
```

### 2.3 `data/drills/<id>.json` — FundingResult (per FundingSpot-plan §4, verbatim)

`{ id, generatedAt, rulesVersion, subject{platform,address,symbol,poolAgeDays?,mcap?}, flags{empty_room,fading}, metrics{ut24h,ut1h,ut4h,pc24h,pc1h,pc4h,txs24h,vol24hUsd,churn,usdPerTrader,utPctl,uptPctl,mature,pace1h,pace4h}, ladder[{key,windowSec,pct,txs,buyTxs,sellTxs,uniqueTraders,volUsd}], jev{emptyRoomProb,fadingProb,agreement,latencyMs}|null, receipts[{call,path,fetchedAt,bodySha256}] , data{universeAt,peerUniverse:'snapshot-universe',coveragePct,mcPriceAnomaly} , meta{why,flaggedAtBand,chipSuggestion} }`

`id` = `${platform}-${address.slice(0,8)}-${yyyymmddhhmm}`; body disimpan hanya di replay bundle terpisah `data/drills/<id>.bundle.json` saat mode capture.

### 2.4 `SearchRow` (per LiquidityGap-plan §3a — verbatim)

```typescript
interface SearchRow { name, symbol, platform, address, priceUsd, pc24h, v24h, liq, ut24h, txs24h, mc, firstPairTs, pair, platformSlug }
interface WindowStat { timeSec, changePct, txns, buyTxns, sellTxns, uniqueTraders, volumeUsd }
```

### 2.5 Flag/Band types

```typescript
// Canonical (src/types.ts — synced 2026-09-30):
interface UniverseBands { n:number; asOf:string; sha256:string; scope:'global'|'chain'; ut25:number; ut50:number; ratio75:number; ratio95:number; usdPerTrader75:number; churn75:number|null; utVals:number[]; ratioVals:number[]; uptVals:number[] }
// Denominator = PEER SET = eligible ∧ !excluded-class (n=834 on 2026-09-30 snapshot;
// eligible-only n=1083 kept as stat, not the band denominator).
type GapState='TURNOVER_ANOMALY'|'CROWDED_TAPE'|'ACTIVE_THIN'|'DORMANT'|'BELOW_FLOOR'|'NO_DATA'|'EXCLUDED'
type FlagState='EMPTY_ROOM'|'CROWDED'|'FADING'|'HOLDING'|'NO_MOVE'|'INSUFFICIENT'  // shipped names
type GapLevel='CLEAN'|'INFO'|'WARN'|'DANGER'; FundingLevel='CLEAN'|'WARN'|'DANGER'|'INSUFFICIENT'
```

Constants (no magic numbers in evaluators): `ELIGIBLE={V_MIN:5000,LIQ_MIN:500,MIN_SAMPLE:30}` · `GAP_QUADRANT` per plan · `FUNDING_THRESHOLDS` per FundingSpot-plan §4 verbatim · `DORMANT={MIN_LIQ_USD:5000,MAX_VOL_USD:200,LOOKBACK_DAYS:7}`.

---

## Part 3: API Contracts

### 3.1 Envelope

```typescript
{ ok:true; data:T; meta:{ ts:string; requestId:string; mode:'live'|'replay' } }
{ ok:false; error:{ code:string; message:string; details?:unknown } }
```

### 3.2 Endpoints

#### `GET /api/board`
- Response: `data = BoardView { stats{universeAt,sha256,nTotal,nEligible,nFlaggedGap,nEmptyRoom,nDual,nWaves,nExcluded,queries}, rows:BoardRow[], waves:Wave[], dormant:BoardRow[] }`
- `BoardRow = { rank, identity, token{name,symbol}, platform, priceUsd, pc24h, v24h, liq, ut24h, ageDays, mc, metrics{ratio,usdPerTrader,rPctl,uPctl}, gap{state,level,reasons[]}, funding{state,level,reasons[]}|'DRILL_ONLY', dual:boolean, daysFlagged{gap,funding} }`
- Errors: `500 UNIVERSE_LOAD_FAILED`
- Cache: module-level computed once per cold start; `meta.mode` = replay selalu.

#### `POST /api/drill` — body `{platform?,address?}|{q}`
- Flow: rate-limit → resolve (live search atau fixture) → dedup `data/drills/` existing → live-gated fetch → `evalFunding` → persist record → return `{id,result,mode}`.
- `q` resolve: `/v1/dex/search` atau `data/fixtures` saat replay; multi-match → `409 AMBIGUOUS_SYMBOL {candidates[]}` (pola AmbiguityDesk — tidak pernah silent-pick).
- Errors: `429 RATE_LIMITED` · `503 DRILL_UNAVAILABLE` (no key & no bundle, atau budget habis) · `502 CMC_ERROR {upstreamStatus}` · `404 TOKEN_NOT_FOUND` · `400 VALIDATION_ERROR`.

#### `GET /api/drill/[id]`
- `data = FundingResult`; `404 DRILL_NOT_FOUND`.

#### `GET /drill/[id]/opengraph-image` (route handler `ImageResponse`)
- 1200×630: header `WASHBOARD / drill`, subject sym+addr-short+chain, dua flag chips, strip metrics (ut24h, ratio-context, pc24h), `universeAt`, sha pendek, disclaimer satu baris.

### 3.3 State machines
- GAP evaluator: `NO_DATA → EXCLUDED → BELOW_FLOOR → quadrant → mature-cap` (penuh di LiquidityGap-plan §3c — no deviation).
- Funding: `INSUFFICIENT → mature cap → EMPTY_ROOM → NO_MOVE → FADING` (FundingSpot-plan §4).
- Drill request: `RATE_CHECK → RESOLVE → DEDUP → FETCH → EVAL → PERSIST → 200`.

---

## Part 4: Validation Schemas (Zod)

```typescript
export const DrillBodySchema = z.union([
  z.object({ platform: z.string().min(1), address: z.string().min(4).max(128) }),
  z.object({ q: z.string().min(1).max(64) }),
]);
export const SearchRowSchema = z.object({
  name: z.string(), symbol: z.string(), platform: z.string(), address: z.string(),
  priceUsd: z.number().nullable(), pc24h: z.number().nullable(), v24h: z.number().nullable(),
  liq: z.number().nullable(), ut24h: z.number().nullable(), txs24h: z.number().nullable(),
  mc: z.number().nullable(), firstPairTs: z.string().nullable(), pair: z.string().nullable(),
  platformSlug: z.string().nullable(),
});
export const UniverseFileSchema = z.object({ version: z.literal(1), capturedAt: z.string(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/), /* + fields per §2.1 */ });
```

---

## Part 5: Security & Error Handling

1. **Zero-secret:** keys hanya env; `cmc-client` tidak pernah log key/URL penuh; bundle strips headers.
2. **Defensive boundary:** body drill lewat Zod; address/platform divalidasi pola per-chain (reuse `address.ts` vendored); `q` sanitize (≤64 char, strip kontrol).
3. **Rate limiting:** per-IP 30/hari, global 200/hari; `WB_DAILY_CREDIT_BUDGET` (default 40) dihitung sebelum CMC call; exceed → `DRILL_UNAVAILABLE` + UI honest copy.
4. **SSRF:** hanya host `https://api.coinmarketcap.com` — client tidak menerima URL bebas.
5. **Integrity:** sha = crypto deterministik; verify script membandingkan; integritas = "bundle tidak berubah", bukan bukti CMC mengirim.
6. **AI boundary:** Jev hanya menerima computed metrics (angka tercetak di `FUNDING_THRESHOLDS`+ladder), tidak pernah raw JSON/prompt-injection surface; output prob `0..1` divalidasi range.
7. **Single-writer:** scripts/CI yang menulis `data/` hanya harvest pipeline; route runtime hanya menulis `data/drills/` (di-deploy state = ephemeral Vercel fs — ditandai `not persisted across deploys`).

### 5.4 Calculation formulas (canonical — pointer, tidak diubah)
- `turnover = v24h / liq` (liq>0 saja) · `usdPerTrader = v24h / ut24h` (ut>0 saja)
- `churn = txs24h / ut24h` · `pace(w) = (ut_w/hours) / (ut24h/24)`
- Flag rules: `LiquidityGap-plan.md §3c` & `FundingSpot-plan.md §4` — verbatim, percentile-only.

---

## Part 6: Testing Strategy & Golden Vectors

### 6.1 Test layers
| Lapisan | Alat | Target |
| Unit | Vitest | 100% pure engines (universe, exclusions, gap, funding, funding-board, cohort, persistence, drills) |
| Contract | Vitest | API routes: envelope, Zod-reject, rate-limit, replay/live modes |
| Fixtures | real captures | `data/fixtures/fundingspot-sample.json` + FundingSpot vectors |
| Golden numbers | pinned | vektor §6.2 harus match persis |

### 6.2 Golden vectors (dipin dari snapshot riil — `liquiditygap-universe-2026-09-30.json`)

| # | Token/Case | Input (ringkas) | Expected (verified post-audit, peer-set bands) |
| #1 | DOGE-clone SOL `CNcoV…` | r=24.7, ut=6, v=$299k, liq=$12k | TURNOVER_ANOMALY **WARN** — r≥SOL p75 (4.13) ∧ ut≤p25 (112), tapi r<SOL p95 (50.55) → bukan DANGER. *(spec lama "DANGER" salah — percentile-only)* |
| #2 | INU-clone SOL `6VwT7…` | r=50.5, ut=29 | WARN — r tepat di bawah SOL p95 (50.548); INU lain (r=630, ut=2387) → CROWDED_TAPE |
| #3 | Base `67OHIO` | r=11.26, ut=31 | DANGER — Base peer p95=9.73 < r ∧ ut=31 ≤ Base p25=41 |
| #4 | Base same-shape cluster | r∈[8,12], ut≈29, age 0–1d | **dua Wave{size≥4}** terpisah oleh ratio-band — bukan satu wave-8 (8 simbol = 9 address) |
| #5 | JUP/Solana | r=2.06, ut=7520 (snapshot ini) | no flag — crowded/clean |
| #6 | AAVE-class mature | mc ≥$100M | DANGER→WARN cap (arb/MM flow thin-ut by design) |
| #7 | ADO `J9B6M…` ETH | pc=+10.5%, ut=5, v=$1.6k | BELOW_FLOOR (gap) + EMPTY_ROOM flag tetap terbit — board ER sengaja floor-free; label state-nya |
| #8 | sUSDe ETH · Robinhood NVDA | stable · venue-equity | EXCLUDED — dan **keluar dari peer-set denominator** (peer n=834, bukan 1.083) |
| #9 | MTRG | v=0, liq=$21.7M | DORMANT |
| #10 | Fantom O3 / TITANO | fields null | NO_DATA |
| #11 | BSC DOGE dust | v=$20, liq=$884 | BELOW_FLOOR |
| #12 | drill thin-ut + decaying | ut=30, pace=0.4×, pc1h/pc4h<0, pc24h>0 | EMPTY_ROOM DANGER + FADING DANGER (drill) |

### 6.3 Regression gate
- Percentile bands dihitung di-harvest → snapshot `ratio50/75/95, ut25/75, upt75` diverifikasi ulang dalam test terhadap `bands` artifact (harvest salah hitung = test merah).
- FundingSpot 10-vektor (bundle `funding-vectors.json` dari ideas/) di-port verbatim — `rulesVersion` konsisten.
