# Washboard

> The tokens everyone's trading — and who's actually there.

Board forensic multi-token: menandai **volume yang diputer-puterin** (`TURNOVER_ANOMALY`) dan **pump tanpa kerumunan** (`EMPTY_ROOM` / `FADING_CROWD`) — dua lensa independen, bukan satu skor.

Merger dari `ideas/LiquidityGap` (#15) + `ideas/FundingSpot` (#19). Kontrak engine: `../ideas/LiquidityGap-plan.md`, `../ideas/FundingSpot-plan.md`.

## Modes

- **Board (`/`)** — membaca `data/universe/` snapshot ter-commit. Nol CMC call saat render; `universeAt` + `sha256` tampil permanen.
- **Drill (`/drill/[id]`, `POST /api/drill`)** — evidence card per token. **Live** jika `CMC_API_KEY` ada (search→token→pools, ≤3 kredit, Jev noul×2); **replay** dari bundle/fixture kalau tidak ada key. Badge `live|replay` selalu tampil.
- **Harvest (operator)** — `node scripts/harvest-universe.mjs` + `scripts/update-persistence.mjs` (key di `.env.local`).

## Commands

```bash
pnpm i          # install
pnpm dev        # dev server
pnpm test       # vitest (golden vectors + api contract)
pnpm typecheck  # tsc --noEmit
pnpm build      # next build
pnpm evidence:verify  # sha256 semua artifacts
node scripts/harvest-universe.mjs   # universe baru (butuh CMC_API_KEY)
```

## Env (.env.example)

`CMC_API_KEY` · `TYPESAFE_API_KEYS` (Jev, optional) · `WB_DAILY_CREDIT_BUDGET=40` · `WB_PER_IP_LIMIT=30` · `WB_GLOBAL_LIMIT=200`

## Honesty notes

`ut24h` = **CMC-reported unique traders** — addresses ≠ entities, angka bisa di-farm. Flag = `observed anomaly on window`, **bukan prediksi, bukan tuduhan**. Universe = hasil N query `/v1/dex/search` (query-bounded), bukan seluruh pasar.
