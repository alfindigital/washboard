# Data provenance & license notes

## Committed evidence bundles

This repository contains captured API responses, committed deliberately as
**replayable evidence** for the Build with CMC: API Hackathon (2026):

| Path | Contents | Why it is committed |
|---|---|---|
| `data/universe/universe-2026-09-30.json` | One-time harvest of 2,466 DEX token rows via `GET /v1/dex/search` (76 queries, 2026-09-30, sha256-pinned) | The board is a **replayable snapshot** by design — judges can verify every flag offline without spending API credits |
| `data/logs/cmc-requests.jsonl` | Endpoint + params + timestamps of real API calls | Required "visible evidence of a real API call" |
| `data/fixtures/drills/*.json` | Per-token drill bundles with request receipts (sha256) | Deterministic replay of `/v1/dex/token` + `/v1/dex/token/pools` responses |

This data was obtained with an event-window Startup-tier CMC API key issued
for the hackathon. It is published **for evaluation and reproducibility of
this submission**, not as a redistributed market-data feed. Market data
remains © CoinMarketCap; see https://coinmarketcap.com/api/terms/.

## No secrets

No API keys or credentials are committed. All keys are read from environment
variables (`.env.local`, Vercel env). `.env*` files are gitignored except
`.env.example`, which contains no values.
