# Washboard — TASKS.md

> Backlog atomik. **1 task = 1 commit**. Selesai → centang + update `TODO.md` + `docs/living/CURRENT_STATE.md`.
> DoD universal: PRODUCT_SPEC §3.4. Contract engine: `../ideas/LiquidityGap-plan.md` §3, `../ideas/FundingSpot-plan.md` §4.

## F1 — Scaffold
- [ ] `T-001` `git init` di `washboard/`; `.gitignore`: `node_modules .next out .env* !.env.example data/drills/*.json !.gitkeep`; commit `chore: init washboard`.
- [ ] `T-002` `package.json`: next@15, react@19, tailwindcss@4, typescript, vitest, zod, tsx; scripts `dev build start test typecheck evidence:verify`; `tsconfig` strict; `pnpm i`. Commit `chore: scaffold next15 app`.
- [ ] `T-003` `app/layout.tsx` minimal + `globals.css` tokens DESIGN_SPEC (light+dark via `data-theme`); eslint flat config. Commit `chore: base layout + tokens`.
- [ ] `T-004` `.env.example`: `CMC_API_KEY`·`TYPESAFE_API_KEYS`·`WB_DAILY_CREDIT_BUDGET=40`·`WB_PER_IP_LIMIT=30`·`WB_GLOBAL_LIMIT=200`; `README.md` skeleton (produk, modes, commands). Commit `docs: env example + readme`.

## F2 — Vendor lib + data assets
- [ ] `T-005` Copy `verdex/src/lib/{cmc-client,address,jev,live-guard}.ts` → `src/lib/`; adapt import paths. Commit `feat: vendored cmc/jev clients`.
- [ ] `T-006` `src/types.ts` sesuai TECH_SPEC §2.4–2.5 + `src/lib/dex.ts` subset parser → `SearchRow`/`WindowStat` dari CMC tks[]/sts[]. Commit `feat: types + dex parser`.
- [ ] `T-007` Copy universe JSON → `data/universe/universe-2026-09-30.json`; buat `latest.json` pointer; copy `fundingspot-sample.json` → `data/fixtures/`; `data/persistence.json={}`; `data/drills/.gitkeep`. Commit `chore: seed data artifacts`.
- [ ] `T-008` Port `harvest-universe.mjs` → `scripts/` + `scripts/queries.txt` (daftar persis 76-query seed di ideas/). Commit `feat: harvest script port`.

## F3 — Universe engine
- [ ] `T-009` `src/engine/universe.ts`: `loadUniverse()` (latest.json+Zod+sha verify), `isEligible`, `computeBands`, `bandsFor`. Commit `feat: universe engine`.
- [ ] `T-010` `tests/universe.test.ts`: golden bands (§TECH_SPEC 6), eligible count 1083, fallback<30, sha mismatch → throw. Commit `test: universe golden`.

## F4 — Exclusions
- [ ] `T-011` `src/engine/exclusions.ts` + daftar kelas. Commit `feat: asset exclusions`.
- [ ] `T-012` `tests/exclusions.test.ts` (weETH, USDC, FARTCOIN, Robinhood rows). Commit `test: exclusions`.

## F5 — GAP engine
- [ ] `T-013` `src/engine/gap.ts`: `GAP_QUADRANT` const + `evalGap` state machine + `GapMetrics`. Commit `feat: gap evaluator`.
- [ ] `T-014` `tests/gap.test.ts`: vektor #1-3,#5-7,#9,#11 (reasons memuat band+pctl verbatim). Commit `test: gap vectors`.

## F6 — FundingSpot port
- [ ] `T-015` `src/engine/funding.ts` — implement verbatim FundingSpot-plan §4 (toWindows, FUNDING_THRESHOLDS, evalFunding, FundingResult). Commit `feat: funding engine`.
- [ ] `T-016` `src/engine/funding-board.ts` — `evalFundingBoard` preview dari SearchRow. Commit `feat: funding board adapter`.
- [ ] `T-017` `tests/funding.test.ts` — 10 vektor dari spec + board-preview vektor #8. Commit `test: funding vectors`.

## F7 — Cohort + persistence
- [ ] `T-018` `src/engine/cohort.ts` `detectWaves` + `src/engine/persistence.ts`. Commit `feat: cohort waves + persistence`.
- [ ] `T-019` `tests/{cohort,persistence}.test.ts` (Base wave; dual counter; snapshot-file-change ⇒ reset-counter+keep-history). Commit `test: cohort/persistence`.

## F8 — Board view + API
- [ ] `T-020` `src/lib/api-board.ts` `buildBoardView` (sort: dual>gap-danger>er-danger>warn; dormant split; excluded counter; chain weather strip stats). Commit `feat: board view`.
- [ ] `T-021` `app/api/board/route.ts` envelope + `scripts/verify-evidence.mjs` (`pnpm evidence:verify`). Commit `feat: /api/board + verify`.
- [ ] `T-022` `tests/board.test.ts` — view stats=spec values, sort order, envelope. Commit `test: board api`.

## F9 — Drill backend
- [ ] `T-023` `src/lib/rate-limit.ts` (per-IP+global+credit budget, in-memory). Commit `feat: rate limit`.
- [ ] `T-024` `src/lib/api-drill.ts` orchestrasi lengkap (resolve/live-gate/dedup/eval/persist/id). Commit `feat: drill orchestrator`.
- [ ] `T-025` `app/api/drill/route.ts` + `app/api/drill/[id]/route.ts` envelope+errors. Commit `feat: drill routes`.
- [ ] `T-026` `app/drill/[id]/opengraph-image.tsx` (ImageResponse, layout §DESIGN 3.2). Commit `feat: drill OG`.
- [ ] `T-027` `tests/api-drill.test.ts`: replay, rate-limit, unavailable, ambiguous, dedup. Commit `test: drill api`.

## F10 — Board UI (antislop DURING)
- [ ] `T-028` `app/page.tsx` + `components/board/{TopBar,StatsStrip,FilterChips}.tsx` (clothesline motif, states). Commit `feat: board chrome`.
- [ ] `T-029` `components/board/{GapTable,RowExpand,WaveCard,DormantSection}.tsx` + pagination/search client. Commit `feat: board table`.
- [ ] `T-030` Mobile stacked cards + disclaimers footer + empty/error/loading states. Commit `feat: board states + mobile`.
- [ ] `T-031` `tests/ui-board.test.ts` (render snapshot: chips per state, no forbidden vocab in markup). Commit `test: board ui`.

## F11 — Drill UI
- [ ] `T-032` `app/drill/[id]/page.tsx` + `components/drill/*` per FundingSpot-plan §7 (dual banner, metrics strip, ladder, confidence bar, Jev strip, receipts+copy, mode badge). Commit `feat: drill card ui`.
- [ ] `T-033` Drill states (replay badge, Jev unavailable/contested, insufficient). Commit `feat: drill states`.

## F12 — On-demand + pipeline
- [ ] `T-034` `POST /api/drill {q}` → on-demand row append session + `on-demand` mark UI. Commit `feat: on-demand lookup`.
- [ ] `T-035` `scripts/update-persistence.mjs` + wiring di harvest end-to-end test. Commit `feat: persistence pipeline`.

## F13 — Ship
- [ ] `T-036` `pnpm test`+`typecheck`+`build`+`evidence:verify` hijau penuh. Commit `test: full gate`.
- [ ] `T-037` antislop Delivery Gate → `docs/living/ANTISLOP-REPORT.md` (4 blok PASS/FAIL + evidence). Commit `docs: antislop gate`.
- [ ] `T-038` Vercel deploy + env set + smoke board+drill permalink + update `HANDOVER.md`+`CURRENT_STATE.md`. Commit `chore: deploy config`.
- [ ] `T-039` Final `README.md` lengkap (product, modes live/replay, commands, method link, disclaimer). Commit `docs: readme final`.
