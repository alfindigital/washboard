# CONTEXT.md — Washboard resolved decisions (tanya-dulu grill output)

> Semua istilah di bawah = RESOLVED. Jangan dibuka ulang tanpa user ACC.

| Keputusan | Resolusi | Asal |
| :--- | :--- | :--- |
| Nama produk | **Washboard** (user pilih "kontroversial") | user 2026-09-30 |
| Merge | Satu app: board LiquidityGap + drill FundingSpot; dua kolom flag independen, nol composite score | user |
| Threshold | **Percentile-only** di eligible set (v>5k ∧ liq>500 ∧ ut≠null); absolute backstop DITOLAK | user |
| Denominator percentile | eligible universe (1.083 dari 2.466) + per-chain min-30 + global-fallback | engine spec |
| Dormant liquidity | **v1** — `DORMANT` state gratis dari v24h=0 | asisten→user acc "ngikut" |
| Board OG card | **stretch v1.5**; drill OG = v1 | asisten→user acc |
| Form factor | Next.js 15 app standalone `cmc-api-hackaton/washboard/` | user |
| Live scope | Board = snapshot-only; drill live-gated `CMC_API_KEY` + replay fallback | user |
| Deploy | **Vercel** | user |
| antislop | mode **DURING** + Delivery Gate sebelum ship | user |
| Design direction | **Baru** — "forensic blotter / daylight evidence-desk" (DESIGN_SPEC §1): light-first warm paper + ink + rust accent + clothesline motif; dials ENERGY 1/RHYTHM 2/MOTION 1 | plan (user delegasikan) |
| Universe seed | `ideas/liquiditygap-universe-2026-09-30.json` 2.466 rows, sha `b72646ba…`, 76 kredit | captured |
| Peer universe FundingSpot | superseded → shared eligible universe; 191-sample = regression fixture | rekonsiliasi |
| Persistence | `data/persistence.json`, update saat harvest, `daysFlagged{gap,funding}` shared | engine spec |
| AI | Jev `noul`×2 drill-only (TYPESAFE_API_KEYS); nol AI board v1; DeepSeek narasi = stretch | spec |
| Rate limit | per-IP 30/hari, global 200/hari, `WB_DAILY_CREDIT_BUDGET` default 40 | pola sibling |
| Chain nuance | bands per-platform min n=30; Robinhood = `venue-equity` EXCLUDED | captured fact |

## Open items (non-blocking)
- Nama route drill: `/drill/[id]` (keputusan di atas).
- Chart historis — out-of-scope v1; sts[] ladder bukan chart.
- Maker concentration drill — v2 (`/v1/dex/tokens/transactions` data plane).
