# Washboard — TODO.md (live tracker)

> Status: `⬜` todo · `🟨` in-progress · `✅` done. Update bersamaan dengan `TASKS.md` & `docs/living/CURRENT_STATE.md`.

## Status global
- [x] **Fase 0 — Spec freeze** (2026-09-30)
- [ ] **Fase 1 — Scaffold** (T-001…T-004)
- [ ] **Fase 2 — Vendor & data** (T-005…T-008)
- [ ] **Fase 3 — Universe engine** (T-009…T-010)
- [ ] **Fase 4 — Exclusions** (T-011…T-012)
- [ ] **Fase 5 — GAP engine** (T-013…T-014)
- [ ] **Fase 6 — FundingSpot port** (T-015…T-017)
- [ ] **Fase 7 — Cohort + persistence** (T-018…T-019)
- [ ] **Fase 8 — Board API** (T-020…T-022)
- [ ] **Fase 9 — Drill backend** (T-023…T-027)
- [ ] **Fase 10 — Board UI** (T-028…T-031)
- [ ] **Fase 11 — Drill UI** (T-032…T-033)
- [ ] **Fase 12 — On-demand + pipeline** (T-034…T-035)
- [ ] **Fase 13 — Ship** (T-036…T-039)

## Command checklist (akhir tiap fase)
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm evidence:verify`
- [ ] vocabulary grep: `rg -i "wash confirmed|fake volume|scam|insider|manipulation|guaranteed|pasti dump|risk score|AI-powered" src app` → 0 hit (kecuali fixture comment berlabel)
- [ ] antislop Delivery Gate PASS → `docs/living/ANTISLOP-REPORT.md`
- [ ] `docs/living/HANDOVER.md` fresh

## Catatan penjaga (jangan dilanggar saat build)
- Percentile-only — dilarang absolute backstop.
- Dua kolom flag independen — dilarang composite score.
- `null` → `not reported` / `NO_DATA` — nol false-zero.
- Engine murni — nol network di `src/engine/`.
- Engine contract verbatim dari dua plan docs — angka berubah hanya lewat harvest artifact.
