# CURRENT_STATE — Washboard

> Update tiap akhir task/fase. Format: satu paragraf state + pointer.

**2026-10-01** — BUILD SELESAI sampai media. `pnpm test` 30/30 · `typecheck` bersih · `next build` hijau · `evidence:verify` PASS (universe + 5 fixture drills + funding fixture). Live verified end-to-end: board replay 2466 rows, drill FROG live (2 kredit) → EMPTY_ROOM DANGER + Jev consensus, dedup `dedup`, OG image 200, permalinks `/drill/<platform>:<addr>` 200 untuk 5 fixtures ter-commit. Video `video/washboard-demo.mp4` 64s rendered (Remotion, h264+aac, caption burned-in). VO via edge-tts — ElevenLabs `text_to_speech` ada tapi quota habis (9 kredit sisa vs 830 dibutuhkan).

**Commits:** `d7d3e74` scaffold+specs · `7a08f9a` engines+API+tests · `ab32fbc` UI+dedup fix · terbaru: fixtures+zero-window fix, remotion, copy.

**Keputusan baru yang resolved di sesi ini:**
- Provider kadang mengembalikan `sts[]` zeroed (pc=0,ut=0,v=0) untuk token ke-index tipis → drill memfilter window "dead" (semua 0/null) sebelum `evalFunding` sehingga hasilnya `INSUFFICIENT`, bukan `NO_MOVE` palsu. `data.stsReported`/`stsUsable` dicatat di record.
- Jev (TYPESAFE) punya limit burst: call pertama lolos, 3 berikutnya `unavailable` meski spacing 3-4s. Dirancang graceful — tapi untuk demo andalkan fixture FROG (consensus) + QNT (lean).
- `pnpm-workspace.yaml allowBuilds` wajib (oxide/esbuild/sharp) — tanpa itu `pnpm install` error di pnpm 11.24.
- Windows NTFS: canonical id `Platform:0x…` jadi ADS filename → `drillFilePath` sanitize ke `_`.

**Berikutnya:** deploy attempt (Vercel) atau ship lokal. Kill-criteria eligible<30 belum pernah kejadian; snapshot 2026-09-30 eligible=1083.

**Contracts yang mengikat:**
- Engine: `../../ideas/LiquidityGap-plan.md` §3, `../../ideas/FundingSpot-plan.md` §4.
- Percentile-only di eligible set; nol composite score; null→NO_DATA.

**Risiko terbuka:** eligible<30 pada snapshot baru (PLAN kill-criteria); CMC key expire ~2026-10-01 menurut cache lama — user melaporkan 300k kredit tersedia jadi window live lebih panjang; Jev burst-limit.
