# Washboard — TODO.md (live tracker)

> Status: `⬜` todo · `🟨` in-progress · `✅` done. Update bersamaan dengan `TASKS.md` & `docs/living/CURRENT_STATE.md`.

## Status global
- [x] **Fase 0 — Spec freeze** (2026-09-30)
- [x] **Fase 1 — Scaffold** (T-001…T-004)
- [x] **Fase 2 — Vendor & data** (T-005…T-008)
- [x] **Fase 3 — Universe engine** (T-009…T-010)
- [x] **Fase 4 — Exclusions** (T-011…T-012)
- [x] **Fase 5 — GAP engine** (T-013…T-014)
- [x] **Fase 6 — FundingSpot port** (T-015…T-017)
- [x] **Fase 7 — Cohort + persistence** (T-018…T-019)
- [x] **Fase 8 — Board API** (T-020…T-022)
- [x] **Fase 9 — Drill backend** (T-023…T-027)
- [x] **Fase 10 — Board UI** (T-028…T-031)
- [x] **Fase 11 — Drill UI** (T-032…T-033)
- [x] **Fase 12 — On-demand + pipeline** (T-034…T-035)
- [x] **Fase 13 — Ship** (T-036…T-039) — deployed `washboard-ruddy.vercel.app`, prod-verified

## Command checklist (akhir tiap fase)
- [x] `pnpm typecheck` — bersih
- [x] `pnpm test` — 30/30 PASS
- [x] `pnpm build` — hijau lokal + Vercel
- [x] `pnpm evidence:verify` — semua sha256 PASS
- [x] vocabulary grep → 0 hit liar (2 hit by-design: strikethrough video + template prompt vendored)
- [x] antislop Delivery Gate PASS → `docs/delivery-gate.md`
- [x] `docs/living/HANDOVER.md` fresh (2026-09-30)

## Catatan penjaga (jangan dilanggar saat build)
- Percentile-only — dilarang absolute backstop.
- Dua kolom flag independen — dilarang composite score.
- `null` → `not reported` / `NO_DATA` — nol false-zero.
- Engine murni — nol network di `src/engine/`.
- Engine contract verbatim dari dua plan docs — angka berubah hanya lewat harvest artifact.
