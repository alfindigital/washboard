# Washboard — Product Specification

> Spec-kit: `specs/PRODUCT_SPEC.md`. Sibling specs: `TECH_SPEC.md`, `DESIGN_SPEC.md`.
> Sumber kebenaran konsep: `../ideas/LiquidityGap-plan.md` (board engine), `../ideas/FundingSpot-plan.md` (drill engine), `../ideas/LiquidityGap-validation.md`, `../ideas/FundingSpot-validation.md`. Dokumen ini menyatukan; bila konflik, engine-spec menang untuk formula, doc ini menang untuk scope.

---

## Part 1: Business Requirements (WHY)

### 1.1 Executive Summary & Business Objectives
- **Nama Proyek:** Washboard (merger produk LiquidityGap #15 + FundingSpot #19 dari `ideas/30-TOOLS.md`).
- **Latar Belakang Masalah:** Volume DEX besar tidak berarti pasar ramai — dana yang sama bisa diputar-putar (wash/churn). Sebaliknya harga bisa naik pada partisipasi tipis (hollow pump). Provider existing (DexScreener, GeckoTerminal, DEXTools) menampilkan volume, liquidity, dan trader-count sebagai kolom terpisah — user sendiri yang harus menyambungkan titik. Tidak ada board retail yang meranking anomali turnover×partisipasi; detektor yang ada semuanya dev-tool atau enterprise.
- **Tujuan:** membangun screening board evidence-first yang menandai dua anomali berbeda — turnover anomaly (volume vs liquidity vs orang) dan empty room (harga naik vs orang) — plus kohor "wave" terkoordinasi dan persistence counter. Retail = satu tabel yang bisa dibaca; researcher = drill card dengan receipts.
- **Target Audiens:** (a) retail DEX trader saat due-diligence cepat, (b) researcher yang butuh board replayable dengan bukti per baris.
- **Model:** gratis, no-auth, no-DB. Evidence discipline = produknya, bukan fitur.

### 1.2 Business Rules & Financial Logic (Aturan Mutlak)
- **Spot-only:** tidak ada sinyal futures/margin/derivatif — yang dianalisis aktivitas spot DEX on-chain.
- **Bukan prediksi:** setiap flag = "observed anomaly on window X", bukan rekomendasi beli/jual dan bukan tuduhan.
- **Vocabulary wajib** (dicek di test): `TURNOVER_ANOMALY`, `EMPTY_ROOM`, `FADING_CROWD`, `CROWDED_TAPE`, `DORMANT`, `BELOW_FLOOR`, `NO_DATA`, `EXCLUDED`, `observed`, `CMC-reported unique traders`, `addresses not entities`, `not reported`.
- **Vocabulary terlarang:** `wash confirmed`, `fake` (sebagai verdict per-token), `scam`, `insider` (sebagai fakta), `manipulation` (sebagai fakta), `safe to buy`, `guaranteed`, `pasti dump`.
- **Batasan kuota:** harvest snapshot ≈76 kredit/run (manual/scheduled); drill live ≤3 kredit/call, per-IP cap 30/hari + global 200/hari + credit budget env. Board view = nol kredit (baca snapshot).

### 1.3 User Roles, Hierarchy & Permissions

| Role | Tanggung Jawab | Izin Otoritas | Batasan Mutlak |
| :--- | :--- | :--- | :--- |
| `ACT-01` Visitor (retail) | Baca board, filter, klik row → drill | Semua permukaan publik | Read-only; tidak ada action yang mengubah data |
| `ACT-02` Researcher | Drill card, receipts, download JSON | Sama, + akses receipt/bundle per drill | Tidak bisa memaksa live call melebihi rate cap |
| `ACT-03` Harvest operator | Jalankan `scripts/harvest-universe.mjs` + `update-persistence` | Tulis `data/universe/` & `data/persistence.json` | Hanya lewat script lokal dengan key; tidak pernah dari request user |
| `ACT-04` CMC API | Sumber data provider | Endpoint `/v1/dex/*` keyed | Tidak boleh dipanggil saat board render |

### 1.4 Compliance, Security & Legal Constraints
- **Zero-secret:** `CMC_API_KEY`, `TYPESAFE_API_KEYS`, `WB_*` hanya via `.env.local`/env; dilarang print/log/commit. Jev/drill tidak pernah meneruskan raw API response atau key ke model.
- **Defamation care:** board menandai *pola data*, bukan menuduh entitas — wording, falsifier per flag, disclaimer permanen, link explorer per row.
- **Data rights CMC:** output publik = derived metrics + hash + metadata request; raw response bodies tidak di-redistribute publik (bundle untuk replay internal).
- **Replay-verifiable:** snapshot membawa `capturedAt` + `sha256`; integrity = "bundle tidak berubah sejak capture", BUKAN "CMC pasti mengirim ini".

### 1.5 Success Metrics & KPI (Canonical)

| Metrik | Target | Kategori |
| :--- | :--- | :--- |
| Board render | ≤3s interactive pada 2.400 row (client paginate/search) | Produk |
| Replay integrity | `pnpm evidence:verify` → sha match 100% snapshot+bundles committed | Produk |
| Zero live dependency | `WB_REPLAY=1 pnpm build && pnpm start` jalan tanpa key | Produk |
| Vocabulary compliance | grep daftar terlarang di `app/`+`src/` = 0 hit di luar test-fixtures | Kepatuhan |
| Test vectors | 11 vektor §TECH_SPEC lolos (angka pin dari snapshot riil) | Produk |
| Drill latency live | p95 < 8s (≤3 CMC calls + Jev ≤4s) | Operasional |
| Share-ability | 1 OG card per drill permalink | Bisnis |

### 1.6 Risk Analysis & Mitigation

| Risiko | Impact | Probabilitas | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| Percentile universe berubah komposisi → band jalan | High | Medium | Bands dihitung di-harvest dan disimpan di artifact; `universeAt` wajib di label flag; fallback absolute saat eligible<30 |
| Salah tuduh token bernama via share-card | High | Medium | Kartu membawa (address, chain, snapshot ts, universe n, band definisi, hash, disclaimer); vocabulary gate di test |
| CMC key mati → drill live gagal | High | High | Key-gated: `CMC_API_KEY` absen → replay-only mode + `mode` badge; committed bundles fallback per token |
| ut24h di-farm → flag lolos | Medium | High | ut rendah=flag, ut tinggi≠bersih (wording permanen); $/trader counter-axis; persistence counter; caveat bar |
| Query-bounded universe salah baca "seluruh pasar" | Medium | High | Disclaimer universe-bound permanen + n eligible + queries count di header |
| Rate-limit / abuse board publik | Medium | Medium | per-IP 30/hari + global 200/hari + dedup + cache freshness-labeled |

---

## Part 2: Product Requirements (WHAT)

### 2.1 Product Overview & Goals
- **Nama Produk:** Washboard — "board yang misahin volume beneran dari volume yang diputer-puterin."
- **Tujuan Utama:** satu tabel multi-token yang menandai turnover anomaly + empty room + coordinated waves, dengan drill evidence per token.
- **Target Persona:** retail due-diligence (cepat, satu layar) + researcher (drill + receipts).

### 2.2 Scope & Boundaries
- **In-Scope v1:**
  1. Board tabel 2.400+ row dari snapshot universe (GAP flag + EMPTY_ROOM preview per row).
  2. Sort/filter: dual-flag → danger → warn; chip `[turnover] [empty room] [dua-duanya] [include infra] [waves only]`; search token/chain.
  3. Sections: main table + `Coordinated waves` + `Dormant liquidity` (collapsed) + excluded counter.
  4. Drill card per token (FundingSpot spec §7): dual banner EMPTY_ROOM+FADING_CROWD, metric strip, window ladder, Jev strip, receipts.
  5. Persistence counter `daysFlagged` shared kedua flag.
  6. Live drill gated `CMC_API_KEY`; replay bundles; rate limit; evidence sha256.
  7. On-demand lookup (`q=` resolver) append ke board session yang sama.
- **Out-of-Scope v1:**
  - Board-level AI/narasi (DeepSeek) — stretch v1.5.
  - Board OG stats card — stretch.
  - Auto-harvest scheduler — harvest manual/operator.
  - MakerHeat drill (maker concentration dari transactions) — v2, drill tahu depth CMC transactions.
  - Auth, user accounts, watchlist persist, DB.
  - Historical timeseries chart (sts[] ladder adalah struktur window, bukan chart).

### 2.3 MVP Features
1. **Board (LiquidityGap lens):** snapshot → eligible set → per-chain percentile bands → quadrant flag `TURNOVER_ANOMALY`/`CROWDED_TAPE`/`ACTIVE_THIN`/`DORMANT`/`BELOW_FLOOR`/`NO_DATA`/`EXCLUDED` per row.
2. **EMPTY_ROOM preview (FundingSpot lens):** dari search-row fields (`pc24h≥3%` ∧ (`ut≤chain-p25` ∨ `$/trader≥p75`)) — flag nyata, trajectory-nya `—` sampai drill.
3. **Drill card:** `/v1/dex/token` sts[] → evalFunding penuh (EMPTY_ROOM+FADING_CROWD) + ladder + Jev noul×2 + receipts; live kalau key ada, replay kalau tidak.
4. **Coordinated waves:** cohort ≥4 member flagged berbagi (chain, ageBand, utBand, ratioBand).
5. **Persistence:** `flagged Nd` per identity `plt:addr` — dihitung saat harvest.
6. **Evidence:** `universeAt`+sha256 di header; drill receipts per call; disclaimer permanen.

### 2.4 User Stories & Acceptance Criteria
- **US-01:** Sebagai retail, saya buka board dan langsung melihat token paling mencurigakan di atas, sehingga saya tahu mana yang perlu dicek dulu.
  - [ ] Sort default: dual-flag > GAP-DANGER > ER-DANGER > warns.
  - [ ] Setiap flag membawa alasan singkat (`reasons[]`) yang bisa dibaca non-teknis.
- **US-02:** Sebagai retail, saya bisa membedakan "volume bohongan" dari "pump kosong" tanpa belajar metrik.
  - [ ] Dua kolom flag terpisah, label berbahasa awam tapi nama teknis tetap ada.
  - [ ] Explainer satu paragraf di header board.
- **US-03:** Sebagai researcher, saya bisa membuka satu row dan melihat evidence lengkap.
  - [ ] Drill card menampilkan dual flag, metric strip, window ladder, Jev probs, receipts+sha256.
  - [ ] Permalink `/drill/[id]` + OG image.
- **US-04:** Sebagai researcher, saya bisa memverifikasi snapshot-nya sendiri.
  - [ ] Header menampilkan `capturedAt`, `sha256`, `n universe`, `n eligible`, `n queries`.
  - [ ] `pnpm evidence:verify` memvalidasi semua hash.
- **US-05:** Sebagai pengunjung, saya paham batasannya.
  - [ ] Disclaimer universe-bound + "ut24h farmable" + "bukan prediksi" terlihat tanpa scroll.

### 2.5 Constraints & Assumptions
**Constraints:**
- Board = nol CMC call saat render; semua angka dari artifact committed.
- `ut24h`/`v24h`/`liq` provider-reported — dilabeli "CMC-observed/reported", definisi internal CMC adalah kotak hitam.
- Missing field → `NO_DATA`/`not reported`, tidak pernah 0 palsu; `liq≤0` → bukan high-ratio.
- Percentile-only (keputusan user 30 Sep) — tidak ada absolute backstop; threshold lahir dari distribusi eligible set.
- Dua kolom flag independen — dilarang composite score.
- 1 task = 1 commit; orchestrator satu-satunya writer.
- Bahasa copy UI: English (konsisten sibling); docs/narasi spec: Bahasa Indonesia.

**Assumptions:**
- `CMC_API_KEY` optional di runtime; ketika ada → drill live aktif; tidak ada → replay.
- `TYPESAFE_API_KEYS` optional; Jev down/absen → drill tetap terbit `jevProb:null`.
- Universe seed = `liquiditygap-universe-2026-09-30.json` (2.466 token, 76 kredit, sha `b72646ba…`); snapshot baru di-append, `latest.json` pointer menunjuk terbaru.
- FundingSpot drill contract (`funding.ts`) diimplementasi verbatim dari `FundingSpot-plan.md` §4 — tidak ditulis ulang.

---

## Part 3: Software Requirements & DoD

### 3.1 Matriks Aktor & Peran Sistem

| Role ID | Nama Aktor | Deskripsi Wewenang | Batasan Akses |
| :--- | :--- | :--- | :--- |
| `ACT-01` | Visitor | Baca board, filter, drill | Read-only |
| `ACT-02` | Researcher | + receipts, JSON export drill | Rate cap |
| `ACT-03` | Operator | Harvest script lokal | Tidak lewat HTTP |
| `SYS-01` | Universe engine | Hitung bands dari snapshot | Read-only artifact |
| `SYS-02` | Rate limiter | Cap per-IP/global + credit budget | Fail-closed saat budget habis |
| `SYS-03` | Jev client | noul×2 per drill | Input = metrik computed saja |

### 3.2 Rincian Backlog Fungsional

#### `BL-001` Universe artifact loader — `SYS-01`, system-facing
Load `data/universe/latest.json` → validasi schema + sha → hitung eligible set (`v24h>5000 ∧ liq>500 ∧ ut24h!=null`) → bands global + per-chain (min n=30, else global-fallback+caveat). Output `UniverseFile` ter-cache.
- Edge: file korup → build-time fail keras (lebih baik no-board daripada board bohong). Eligible <30 → bands null → semua flags pakai absolute fallback berlabel.

#### `BL-002` Asset exclusion classifier — `SYS-01`, system-facing
`classifyAsset(row)` → `stable|wrapped|lst|infra-token|venue-equity|null`. Excluded tetap di tabel berlabel abu, counter di header, toggle menampilkan.
- Edge: heuristik stable tidak boleh menyentuh token mcap≥$100M tanpa match daftar — daftar eksplisit prioritas.

#### `BL-003` GAP flag evaluator — `SYS-01`, system-facing
`evalGap(row, bands, excl)` → state machine §LiquidityGap-plan 3c (NO_DATA→EXCLUDED→BELOW_FLOOR→quadrant→mature cap). Output `GapFlag{state,level,reasons[],falsifier}` + `GapMetrics{turnover,usdPerTrader,ratioPercentile,utPercentile}`.
- Edge: `liq<=0`→NO_DATA; `ut24h==null`→NO_DATA; `v24h==0&&liq>500`→DORMANT.

#### `BL-004` FundingSpot board adapter — `SYS-01`, system-facing
`evalFundingBoard(row, bands)` → EMPTY_ROOM preview: guard `pc24h≥3%` → `ut≤ut25 || usdPerTrader≥upt75` → state + level; mature→cap WARN. `NO_DATA` saat field kurang. churn/FADING ditandai `drill-only`.

#### `BL-005` Cohort wave detector — `SYS-01`, system-facing
`detectWaves(flaggedRows)` → group (platform×ageBand×utBand×ratioBand) → ≥4 member flagged → Wave{key,members,medianRatio,medianUt,ageSpan}.
- Edge: wave hanya dari member flagged; label "same-shape cluster", caveat dilampirkan.

#### `BL-006` Persistence writer — `ACT-03` (harvest-time), system-facing
`updatePersistence(store, snapshot, flagsMap)` → `daysFlaggedGap`/`daysFlaggedFunding` + `firstSeen/lastSeen/snapshots[]` per `plt:addr`. Increment hanya saat flag level WARN+ nyala pada snapshot itu; reset counter jika bersih (tapi history tetap).

#### `BL-007` Board view assembly — `SYS-01`, system-facing
`buildBoardView(universe)` → `{stats, rows[], waves[], dormant[], excludedCount}` — satu pass; rows membawa dua flag + metrics + daysFlagged + identity. Sort default terapkan di server.

#### `BL-008` `GET /api/board` — user-facing
Return board view + meta (universeAt, sha, n, mode). Cache in-memory; no params.
- Edge: artifact gagal load → 500 terstruktur `UNIVERSE_LOAD_FAILED` + UI error state.

#### `BL-009` `POST /api/drill` — user-facing
Body `{platform,address}` atau `{q}` → resolver (`/v1/dex/search` live, atau fixture) → `/v1/dex/token` (+pools) → `evalFunding` penuh → FundingResult + receipts + `daysFlagged` konteks → simpan `data/drills/<id>.json` → `{id,result,mode}`.
- Edge: no key & no bundle → `DRILL_UNAVAILABLE`; CMC 4xx/5xx → `CMC_ERROR` + reason; rate cap → `RATE_LIMITED`; ticker ambigu → kandidat list (pola AmbiguityDesk), tidak pernah silent-pick.

#### `BL-010` `GET /api/drill/[id]` + `drill/[id]/page` + OG — user-facing
Permalink record; OG image 1200×630 membawa (token, chain, dua flag, ut, ratio, snapshot ts, hash, disclaimer).
- Edge: id tidak ada → 404 jujur.

#### `BL-011` Board page UI — user-facing
Header strip (stats+weather chain+universe meta+disclaimer), filter chips, search box, tabel (pagination client), wave cards, dormant collapsed, excluded counter, footer vocabulary-safe.
- States wajib: loading/empty/error; mobile = stacked row-cards tanpa horizontal scroll.

#### `BL-012` Drill page UI — user-facing
Dual banner (bukan satu vonis), metric strip, window ladder (label "window snapshot"), confidence bar (coverage, umur pool, universeAt, mcAnomaly, "ut bisa di-farm"), Jev strip, receipts+sha+copy JSON.
- States: loading/error/replay-vs-live badge; contested Jev ditampilkan terbuka.

#### `BL-013` Rate limit + credit guard — `SYS-02`, system-facing
per-IP 30/hari + global 200/hari (in-memory + optional Upstash later), `WB_DAILY_CREDIT_BUDGET` env; hit sebelum CMC call; budget habis → `DRILL_UNAVAILABLE` bukan 500.

#### `BL-014` Harvest pipeline — `ACT-03`, system-facing
Port `ideas/harvest-universe.mjs` → `scripts/harvest-universe.mjs` (queries dari `scripts/queries.txt`), output `data/universe/universe-YYYY-MM-DD.json` + sha + `latest.json` + panggil `updatePersistence`. Log: queries, credits, failed, unique, eligible.

#### `BL-015` Evidence verify — `SYS-01`, system-facing
`pnpm evidence:verify` → recompute sha256 universe files + drill bundles + fixtures → report mismatch.

#### `BL-016` On-demand lookup — user-facing
`POST /api/drill` dengan `q=` menghasilkan row yang sama kontrak flag-nya dengan row sweep; di UI di-append ke board session + tandai `on-demand` (tidak masuk universe bands).

### 3.3 Dependency Matrix

| Backlog | Prasyarat | Dibutuhkan Oleh | Blast Radius |
| :--- | :--- | :--- | :--- |
| BL-001 universe | — | SEMUA engine | Tinggi |
| BL-002 exclusions | BL-001 | BL-003/004/007 | Tinggi |
| BL-003 gap | BL-001,002 | BL-007,011 | Tinggi |
| BL-004 funding-board | BL-001 | BL-007 | Sedang |
| BL-005 cohort | BL-003,004 | BL-007,011 | Sedang |
| BL-006 persistence | BL-003,004 | BL-007,009,014 | Sedang |
| BL-007 board view | BL-001..006 | BL-008,011 | Tinggi |
| BL-008 api/board | BL-007 | BL-011 | Tinggi |
| BL-009 drill route | funding.ts contract | BL-010,012,016 | Tinggi |
| BL-010 drill page | BL-009 | BL-012 | Sedang |
| BL-011 board UI | BL-008 | — | Tinggi |
| BL-012 drill UI | BL-010 | — | Tinggi |
| BL-013 rate limit | — | BL-009,016 | Tinggi |
| BL-014 harvest | BL-001,006 | data pipeline | Sedang |
| BL-015 verify | artifacts | CI | Rendah |
| BL-016 on-demand | BL-009,011 | — | Rendah |

### 3.4 Definition of Done (DoD) — universal
- [ ] Fungsi murni ≤40 baris; strict types, nol `any` di path engine.
- [ ] Semua konstanta di `*_THRESHOLDS` const — nol magic number di evaluators.
- [ ] Unit tests untuk setiap engine + 11 vektor golden (TECH_SPEC §6) hijau.
- [ ] Missing → `null` → `not reported` ter-render; nol pembagian-by-zero.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm build` hijau; `pnpm evidence:verify` 100%.
- [ ] Vocabulary grep terlarang = 0 hit di luar fixture comments.
- [ ] antislop Delivery Gate report PASS sebelum ship (mode DURING).
- [ ] `.env*` tidak ter-commit; `.env.example` terdokumentasi.
- [ ] `docs/living/CURRENT_STATE.md` di-update tiap fase.

### 3.5 API Envelope
Canonical di `TECH_SPEC.md §3.1` — sukses `{ok:true,data,meta{ts,requestId,mode}}`, error `{ok:false,error{code,message,details}}`. Semua endpoint memakai itu, termasuk error CMC-forward.

### 3.6 NFR

| Kategori | Target |
| :--- | :--- |
| Board interactive | ≤3s pada 2.4k row (client-side pagination, no virtualization lib — plain paginate) |
| Drill live | p95 < 8s; Jev timeout 4s tidak memblokir kartu |
| Availability | Replay mode 100% berfungsi tanpa internet ke CMC |
| Integrity | 100% artifacts sha-verifiable |
| A11y | WCAG AA contrast; full keyboard; mobile no-overflow |
