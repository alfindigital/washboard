# HANDOVER — Washboard

> Untuk sesi berikutnya. Baca urutan ini: `CONTEXT.md` → file ini → `docs/living/CURRENT_STATE.md`.

## State saat handover
Build + media selesai dan terverifikasi. Aplikasi jalan lokal (`pnpm dev`/`pnpm start -p 3111`), deploy Vercel belum dicoba. Yang tersisa: deploy opsional + polish kalau diminta.

## Peta repo (yang penting)
| Path | Isi |
| --- | --- |
| `src/engine/` | universe, gap, funding, cohort, persistence — kontrak verbatim dari `../../ideas/*-plan.md` |
| `src/lib/api-drill.ts` | orkestrasi drill: resolve → dedup → live-gated fetch → eval → Jev → record hashable |
| `src/lib/drill-index.ts` | index rescan-per-call; `data/drills/` (lokal) + `data/fixtures/drills/` (committed showcase) |
| `src/components/` | BoardTable, DrillCard, Waves (compact, capped), FlagChip, StatStrip, DrillSearch |
| `app/api/` | `/api/board`, `/api/drill`, `/api/drill/[id]` |
| `data/universe/` | snapshot 2466 rows (2026-09-30) + `latest.json` pointer |
| `data/fixtures/drills/` | 5 showcase records ter-commit → permalinks `/drill/<platform>:<addr>` |
| `src/remotion/` | komposisi video (`WashboardDemo`), `public/vo.mp3`, output `video/` |
| `docs/copy/social.md` | tagline, pitch 60s, caption sosial, daftar kata terlarang |

## Verify gate (run before claim)
```bash
pnpm test && pnpm typecheck && pnpm build && pnpm evidence:verify
```
Terakhir: semua hijau (2026-10-01). Smoke: `curl localhost:3111/api/board` → mode replay; `curl -X POST /api/drill {platform,address}` → live|dedup.

## Gotchas yang sudah terjadi (jangan ulangi)
- `sts[]` provider bisa semua-nol → wajib filter `>0` sebelum evalFunding (bukan `!= null`).
- Filename NTFS: `:` di id → sanitize via `drillFilePath`.
- Drill index harus rescan per call — jangan cache di module scope.
- Jev burst-limit: space calls ≥60s kalau mau semua dapat opinion; `unavailable` itu state legal.
- `pnpm approve-builds <pkgs>` non-interaktif untuk allowBuilds; field `pnpm` di package.json sudah deprecated di pnpm 11.

## Deploy notes
- Env Vercel wajib: `CMC_API_KEY` (+ `TYPESAFE_API_KEYS`, `WB_*` opsional). Tanpa key board tetap jalan (replay) tapi POST drill → `DRILL_UNAVAILABLE` di luar fixtures — acceptable degradation by design.
- Filesystem drill persistence tidak survive di serverless — fixtures committed tetap bisa dibaca via index fallback; itu disengaja.

## Selesai = apa
`pnpm test && typecheck && build && evidence:verify` hijau · vocabulary grep bersih (`scam|insider|wash confirmed` hanya sebagai teks terlarang yang di-strikethrough) · board+drill render dari replay tanpa key.
