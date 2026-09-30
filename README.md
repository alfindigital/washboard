# Washboard

> Evidence before conviction.

Board forensic multi-token: menandai **turnover yang tak sepadan dengan kerumunan yang dilaporkan** (`TURNOVER_ANOMALY`) dan **pump tanpa kerumunan** (`EMPTY_ROOM` / `FADING_CROWD`) — dua lensa terpisah atas input yang sama (`ut24h`, volume) — bukan satu skor, dan bukan bukti independen.

Merger dari `ideas/LiquidityGap` (#15) + `ideas/FundingSpot` (#19). Kontrak engine: `../ideas/LiquidityGap-plan.md`, `../ideas/FundingSpot-plan.md`.

## Demo

- `video/washboard-demo.mp4` — explainer 64 detik (Remotion, VO + caption burned-in).
- `docs/shots/` — screenshot board + drill.
- Drill permalinks replayable tanpa key (fixtures ter-commit):
  `/drill/Base:0xba3785f43d0b28080879cdbd9cf8d1759b0979f0` (FROG — EMPTY_ROOM DANGER, Jev consensus)
  `/drill/Ethereum:0x4a220e6096b25eadb88358cb44068a3248254675` (QNT — FADING, Jev lean)
  `/drill/Base:0x822419392804df483fa504dcf79606857f2eded4` (67OHIO — INSUFFICIENT, provider tidak populate sts[])

## Modes

- **Board (`/`)** — membaca `data/universe/` snapshot ter-commit. Nol CMC call saat render; `universeAt` + `sha256` tampil permanen.
- **Drill (`/drill/[id]`, `POST /api/drill`)** — evidence card per token. **Live** jika `CMC_API_KEY` ada (search→token→pools, ≤3 kredit, Jev noul×2); **replay** dari bundle/fixture kalau tidak ada key. Badge `live|replay` selalu tampil. Dedup per identitas kanonik (TTL 30 menit).
- **Harvest (operator)** — `node scripts/harvest-universe.mjs` + `node scripts/update-persistence.mjs` (key di `.env.local`).

## Commands

```bash
pnpm i            # install
pnpm dev          # dev server
pnpm test         # vitest (30 golden vectors + contract tests)
pnpm typecheck    # tsc --noEmit
pnpm build        # next build
pnpm evidence:verify  # sha256 semua artifacts

node scripts/harvest-universe.mjs        # universe baru (butuh CMC_API_KEY)
node scripts/update-persistence.mjs      # roll daysFlagged + board view
npx remotion render src/remotion/index.ts WashboardDemo video/washboard-demo.mp4
```

## Env (.env.example)

`CMC_API_KEY` · `TYPESAFE_API_KEYS` (Jev, optional) · `WB_DAILY_CREDIT_BUDGET=40` · `WB_PER_IP_LIMIT=30` · `WB_GLOBAL_LIMIT=200`

## Honesty notes

`ut24h` = **CMC-reported unique traders** — addresses ≠ entities, angka bisa di-farm. Flag = `observed anomaly on window`, **bukan prediksi, bukan tuduhan**. Universe = hasil N query `/v1/dex/search` (query-bounded), bukan seluruh pasar. Token yang provider-nya tidak populate `sts[]` dilaporkan `INSUFFICIENT`, bukan dipaksa `NO_MOVE`.

## Video pipeline

`src/remotion/WashboardDemo.tsx` — komposisi 1920×1080@30fps, angka riil dari snapshot/fixtures. VO saat ini via edge-tts (ElevenLabs quota habis saat build — interface `text_to_speech` tersedia, ganti track di `public/vo.mp3` kalau quota kembali). Copy deck: `docs/copy/social.md`.
