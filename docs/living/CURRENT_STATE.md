# CURRENT_STATE — Washboard

> Update tiap akhir task/fase. Format: satu paragraf state + pointer.

**2026-09-30** — Fase 0 spec freeze SELESAI. Belum ada kode. Repo belum `git init` (task T-001). Specs: `specs/` (PRODUCT/TECH/DESIGN) + `PLAN.md` + `TASKS.md` (T-001..T-039) + `TODO.md` + `CONTEXT.md` (semua keputusan resolved). Data seed belum di-copy (T-007).

**Berikutnya:** T-001 scaffold. Baca `CONTEXT.md` dulu — semua keputusan sudah resolved; jangan dibuka ulang.

**Contracts yang mengikat:**
- Engine: `../../ideas/LiquidityGap-plan.md` §3 (universe/exclusions/gap/cohort/persistence), `../../ideas/FundingSpot-plan.md` §4 (funding.ts + Jev).
- Percentile-only di eligible set; nol composite score; null→NO_DATA.

**Risiko terbuka:** eligible<30 pada snapshot baru (lihat PLAN kill-criteria); CMC key expire ~2026-10-01 — live drill berumur pendek, replay mode adalah jalur utama.
