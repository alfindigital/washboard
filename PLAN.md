# Washboard — PLAN.md (fase eksekusi)

> Backlog atomik ada di `TASKS.md` (1 task ≈ 1 commit). Tracker hidup: `TODO.md`.
> Engine contract verbatim: `../ideas/LiquidityGap-plan.md` §3 + `../ideas/FundingSpot-plan.md` §4 — jangan re-derive.
> Guardrail: single-writer — `washboard/` adalah path baru; jangan sentuh folder sibling. Orchestrator satu-satunya commit.

## Fase 0 — Spec freeze (DONE, pre-build)
- [x] PRODUCT_SPEC / TECH_SPEC / DESIGN_SPEC / PLAN / TASKS / TODO / CONTEXT
- [x] Keputusan user: Next.js standalone · Vercel · drill live-gated · antislop DURING · design baru · percentile-only · dormant v1 · board-OG stretch · nama **Washboard**

## Fase 1 — Scaffold & hygiene
`git init` · `.gitignore` (allowlist ketat) · `.env.example` · `package.json` Next15+React19+Tailwind v4+Vitest+Zod+tsx · `tsconfig strict` · `eslint` · `README.md` skeleton · `pnpm typecheck/test/build` script.

## Fase 2 — Port shared plumbing (vendor, no rewrite)
- Copy dari `verdex/src/lib/`: `cmc-client.ts`, `dex.ts` (parser subset — SearchRow/WindowStat norm), `address.ts`, `jev.ts`, `live-guard.ts`.
- `src/types.ts`: SearchRow, WindowStat, PercentileBands, GapState, FundingState, Level, BoardRow, BoardView, Wave, FundingResult, PersistStore (sesuai TECH_SPEC §2).
- **Data assets:** copy `../ideas/liquiditygap-universe-2026-09-30.json` → `data/universe/` + `latest.json` pointer; `../ideas/fundingspot-universe-sample.json` → `data/fixtures/fundingspot-sample.json`; `../ideas/harvest-universe.mjs` → `scripts/`; `data/persistence.json` = `{}`.
- Gate: `pnpm typecheck` hijau.

## Fase 3 — Universe engine (BL-001)
`src/engine/universe.ts`: loader `latest.json` → eligible filter → `computeBands(rows)` global + per-chain (min 30) → `bandsFor(platform,mcap)` → `UniverseFile` cache.
Tests: bands golden vs angka spec (global ut25=69/ut50=267/ut75=927, ratio50≈0.3/75≈1.3/95≈8.9, upt75≈2255, SOL ratio95≈50.5, ETH≈1.7) + eligible<30 fallback + `sha256` verify vs file.

## Fase 4 — Exclusions (BL-002)
`exclusions.ts` daftar: stable (`USDT USDC DAI FDUSD USDE PYUSD TUSD EURC*`), wrapped/lst (`W* wstETH rETH weETH WBTC cbBTC JitoSOL mSOL bSOL`, pola `staked|wrapped`), infra-token (`*LINK* oracle|infra` — heuristik konservatif + explicit list), venue-equity (`platform=Robinhood` + asset_class hint).
Tests: weETH→EXCLUDED, USDC→EXCLUDED, FARTCOIN→null.

## Fase 5 — GAP evaluator (BL-003)
`gap.ts` state machine verbatim plan §3c + metrics (turnover, usdPerTrader, pctl context) + reasons[] bahasa awam + falsifier. Percentile-only.
Tests: vektor #1,#2,#3,#5,#6,#7,#9,#11.

## Fase 6 — FundingSpot engine port + board adapter (BL-004)
- `funding.ts` = contract FundingSpot-plan §4 **verbatim** (`FUNDING_THRESHOLDS`, `toWindows`, `evalFunding`, `FundingFlag` `EMPTY_ROOM`/`FADING_CROWD`, `INSUFFICIENT`/`NO_MOVE`/`CLEAN`, mature gate).
- `funding-board.ts` = `evalFundingBoard(row,bands)` EMPTY_ROOM preview dari SearchRow.
Tests: 10 vektor FundingSpot (GNS dual, TRUMP/SPX/ARB fading-only, FARTCOIN clean, TITANO insufficient, ADO empty) + vektor #8 board-preview.

## Fase 7 — Cohort & persistence (BL-005, BL-006)
`cohort.ts` detectWaves (≥4, group-key); `persistence.ts` update/load `data/persistence.json`.
Tests: Base cohort→wave; dual-increment; reset-vs-history.

## Fase 8 — Board assembly + API (BL-007, BL-008, BL-015)
`lib/api-board.ts` buildBoardView → `GET /api/board` envelope; `verify-evidence.mjs`.
Tests: view stats match; envelope shape; sha verify.

## Fase 9 — Drill routes (BL-009, BL-010, BL-013)
`lib/api-drill.ts` orchestrasi (rate→resolve→dedup→fetch→eval→persist) + routes + OG image + rate-limit (per-IP 30, global 200, `WB_DAILY_CREDIT_BUDGET`).
Modes: `CMC_API_KEY` ada→live; tidak→replay fixture/bundle. Tests: replay path, RATE_LIMITED, DRILL_UNAVAILABLE, AMBIGUOUS_SYMBOL.

## Fase 10 — UI board (BL-011) — antislop DURING
Halaman per DESIGN_SPEC: topbar+clothesline, stats strip, filter chips, tabel+expand rows+pagination, waves, dormant, excluded, disclaimers, states (loading/empty/error), mobile stacked.
Check: R-03 mobile no-overflow; R-27 tiga states; R-31 reason-lines; vocabulary grep.

## Fase 11 — UI drill (BL-012)
Drill card per FundingSpot-plan §7 + tokens DESIGN_SPEC: dual banner, metric strip, ladder, confidence bar, Jev strip, receipts+copy, permalink+OG, mode badge.

## Fase 12 — On-demand & harvest (BL-014, BL-016)
`POST /api/drill {q}` append session board (`on-demand` mark, tidak ubah bands); `scripts/harvest-universe.mjs` + `update-persistence.mjs` port + `queries.txt`.

## Fase 13 — Hardening & ship
Full test pass + typecheck + build + `evidence:verify` · antislop Delivery Gate report (`docs/living/ANTISLOP-REPORT.md`) · vocabulary grep · Vercel deploy (env: `CMC_API_KEY?`, `TYPESAFE_API_KEYS?`, `WB_DAILY_CREDIT_BUDGET`) · `docs/living/HANDOVER.md` update.

## Stretch (v1.5 — jangan masuk v1)
Board OG stats card · DeepSeek narasi stats harian · maker concentration drill (data plane transactions) · realtime wave tracker.

## Kill-criteria / escalation
- eligible<30 di snapshot baru → band=null → UI tunjukkan "insufficient universe" bukan flag palsu → STOP diskusi.
- CMC 402/429 streak → freeze live mode, ship replay-only.
- Vocabulary grep hit → block commit.
