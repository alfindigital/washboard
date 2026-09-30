# HANDOVER — Washboard

> Untuk sesi build berikutnya. Baca urutan ini: `CONTEXT.md` → `PLAN.md` → `TASKS.md` → file ini.

## TL;DR untuk builder
1. Kamu membangun **Washboard**: satu Next.js 15 app, dua lensa independen (board LiquidityGap + drill FundingSpot). Bukan dua produk, bukan satu skor.
2. Semua keputusan produk sudah RESOLVED di `CONTEXT.md`. Yang boleh kamu putuskan hanya detail implementasi di dalam kontrak.
3. Engine contracts itu **verbatim**: `../../ideas/LiquidityGap-plan.md` §3 dan `../../ideas/FundingSpot-plan.md` §4. Jangan re-derive formula; bila spec ini dan plan-doc konflik → plan-doc menang untuk formula, spec menang untuk scope/stack.
4. Task order = `TASKS.md` T-001→T-039, 1 task = 1 commit, update `TODO.md`+`CURRENT_STATE.md` tiap commit.
5. antislop mode DURING: ikuti `specs/DESIGN_SPEC.md` persis; Delivery Gate report wajib di T-037.
6. Jangan pernah commit `.env*`, key, atau raw CMC headers.

## Pemetaan dokumen sumber
| Butuh | Baca |
| --- | --- |
| Kenapa produk ini ada | `../../ideas/LiquidityGap-validation.md`, `../../ideas/FundingSpot-validation.md` |
| Formula board | `../../ideas/LiquidityGap-plan.md` §3 |
| Formula drill + Jev | `../../ideas/FundingSpot-plan.md` §4–§7 |
| Angka bands seed | `../../ideas/liquiditygap-universe-2026-09-30.json` |
| Test vectors drill | `../../ideas/fundingspot-universe-sample.json` + FundingSpot-plan §8 |

## Selesai = apa
`pnpm test && typecheck && build && evidence:verify` hijau · 12 golden vectors pass · vocabulary grep bersih · antislop gate PASS · board+drill render dari replay tanpa key · deploy Vercel verified.
