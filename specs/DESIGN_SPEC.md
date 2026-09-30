# Washboard — Design Specification

> Direction keputusan user: **"Baru — serahkan ke plan"** (bukan amber-terminal, bukan paper-desk Verdex).
> antislop mode: **DURING** — rules diterapkan saat nulis UI; Delivery Gate report wajib sebelum ship.

---

## 1. Direction (R-37, R-31 — setiap keputusan punya alasan)

**Identity:** *"forensic blotter"* — papan dakwaan investigasi di ruang bukti. Bukan dashboard crypto, bukan terminal trading. Benda analoginya: meja cuci + daftar barang bukti + stempel karat.

**Design Read (deklarasi wajib sebelum generate):**
> Reading this as: `multi-token forensic screening board` for `retail due-diligence + researcher`, in a `daylight evidence-desk / blotter` language, dial **ENERGY 1 / RHYTHM 2 / MOTION 1**.

- **ENERGY 1 (calm):** alat data; satu focal point = tabel. Alasan: data board itu produknya — energi tinggi mengalahkan angka.
- **RHYTHM 2:** irama dasar = tabel padat; break tunggal = wave-cards + drill card layout beda bentuk. Alasan: variasi nyata datang dari konten (wave, drill), bukan dekorasi.
- **MOTION 1:** hover/focus states saja; nol scroll-reveal, nol parallax. Alasan: tool analisis; animasi = noise.

**Identity motif (wajib berulang):** **"clothesline"** — garis horizontal tipis di header section dengan **tag chips yang "menggantung"** padanya (filter chips, flag chips). Ini motif visual satu-satunya — mereferensikan meja cuci/jemuran + tag barang bukti, bukan dekorasi.
**Alasan:** satu motif spesifik-produk, bukan generik crypto.

**Status semantics (color bukan satu-satunya indikator):**
- Flag chips = bentuk konsisten: `TURNOVER ANOMALY` (rust), `EMPTY ROOM` (rust outline berbeda glyph `∅`), `FADING` (amber), `DUAL` (solid rust + tag dobel), `DORMANT` (muted), `EXCLUDED` (abu strike), `NO_DATA`/`—` (abu, label "not reported" — TIDAK dirender 0).
- `DANGER` = solid; `WARN` = outline; selalu disertai teks + glyph — warna tidak sendirian (a11y).

## 2. Design Tokens

### 2.1 Palette — "daylight blotter" (light-first; alasan: kertas barang bukti = pembeda dari sibling yang dark-first)

| Token | Light ("day shift") | Dark ("night shift") | Penggunaan |
| :--- | :--- | :--- | :--- |
| `--bg` | `#f2efe4` (kertas hangat) | `#14110b` | page |
| `--panel` | `#faf7ec` | `#1c1810` | tabel body, kartu |
| `--ink` | `#171308` | `#ece4cd` | teks utama |
| `--ink-dim` | `#5c5340` | `#a2967a` | meta/labels (contrast ≥4.5 di kedua mode — cek sebelum ship) |
| `--line` | `#d9d2bb` | `#3a3221` | hairline, clothesline |
| `--rust` | `#a3400a` | `#d97e3f` | SATU aksen: flags, dual, clothesline hooks (R-29: 1 accent) |
| `--amber` | `#8a6208` | `#cfa13a` | FADING/state caution (lebih gelap di light untuk AA) |
| `--ok` | `#3f6212` | `#8fae4e` | clean/crowded |
| `--muted` | `#8a8371` | `#6b6249` | dormant/excluded |

**Alasan warna:** rust = karat di cucian bersih — "noda yang ketahuan" — identity color tunggal; warm paper = ruang bukti siang hari. Bukan "dark tech" karena Washboard itu *papan bukti*, bukan terminal.

### 2.2 Typography

| Token | Font | Penggunaan | Alasan |
| `--font-data` | `IBM Plex Mono` | SEMUA angka, tabel, chip flag, hash | data mono = voice produk; angka itu konten utamanya |
| `--font-sans` | `Archivo` | headline, narasi, label | netral tapi punya wajah — bukan Inter default |
| `--text-display` | mono 28–34/1.1 uppercase | judul board, flag name | motif stempel/daftar — mono sengaja, bukan dekorasi |
| `--text-h2` | sans 20/1.3 semibold | section ("Coordinated waves") | |
| `--text-body` | sans 15/1.55 | disclaimers, reasons | |
| `--text-data` | mono 13/1.4 tabular-nums | rows | tabular-nums wajib (alignment kolom) |

### 2.3 Spacing / Radius / Elevation

| Token | Nilai | Alasan |
| `--space` | 4px grid | konsisten sibling |
| `--radius` | `2px` chips/rows, `6px` kartu | blotter = tajam, bukan pill — anti pill-default (R-11) |
| `--shadow` | **satu**: `0 1px 0 rgba(23,19,8,.14)` hairline saja | barang bukti = flat; elevation palsu dilarang (R-12) |
| `--clothesline` | `1px solid var(--line)` + chip `transform: translateY(50%)` menggantung | THE motif |

## 3. Layout & Komponen

### 3.1 Board (`/`)
```
┌─ TOP BAR ─────────────────────────────────────────────┐
│ WASHBOARD          evidence desk for token activity    │ ← mono mark, wordmark text (R-23: no logo invention)
│ ─────────── clothesline ───────────                    │ ← hairline penuh
│ chip flag samples menggantung: [TURNOVER] [EMPTY] [2X] │
├─ STATS STRIP (mono, satu baris) ──────────────────────┤
│ universe 2,466 · eligible 1,083 · flagged 61 · dual 7  │
│ captured 2026-09-30T… · sha b72646ba… · queries 76     │
├─ FILTERS (chips menggantung di clothesline) ──────────┤
│ [turnover][empty room][dual][waves][+infra][dormant]   │ ← toggle include-excluded
│ search: [ token / address / chain _____________ ]      │
├─ TABLE (focal point, RHYTHM uniform) ─────────────────┤
│ # TOKEN CHAIN AGE UT24H VOL LIQ RATIO  GAP    ROOM  Nd │
│ 1 DOGE.. SOL  0d  6     $299k $12k 24.7  ✖     ∅    1d │ ← dual = rust corner-tick + dua chips
│   ↳ reasons: ratio > SOL-p95 (50.5) · $49.8k per trader│ ← expandable row = reasons[] verbatim
├─ COORDINATED WAVES ───────────────────────────────────┤
│ ≋ BASE · 8 tokens · age 0–1d · ut≈29 · ratio 8–12      │ ← break irama (RHYTHM 2)
├─ DORMANT (collapsed) + EXCLUDED (counter+toggle) ─────┤
├─ FOOTER: vocabulary-safe disclaimer + method link ────┤
```

- **Expandable row** = reasons[] + falsifier + metric context — tidak ada modal.
- **Pagination** client 50/page + search filter; nol virtualization lib.
- **Mobile:** rows jadi stacked "tag cards" (tabel tidak scroll horizontal — R-03).

### 3.2 Drill (`/drill/[id]`) — per FundingSpot-plan §7
- Dual banner `EMPTY_ROOM` + `FADING` berdampingan (bukan satu vonis) — glyph `∅` + `≋`.
- Metric strip mono + window ladder tabel kecil + confidence bar + Jev strip (`Jev 0.74 CONTESTED` warna agreement) + receipts + `addresses not entities` micro-copy.
- Share: OG route + copy-link.

### 3.3 States wajib (R-27)
- loading: skeleton baris (struktur nyata, bukan shimmer mewah)
- empty: "0 flagged in this universe — that is data too" + universe meta tetap tampil
- error: `UNIVERSE_LOAD_FAILED` plain message + capturedAt terakhir jika ada
- replay mode: badge `replay · captured 2026-09-30` persisten di top bar

## 4. Copy rules (R-15/R-16 — vocabulary terikat PRODUCT_SPEC §1.2)
- Headline board: `The tokens everyone's trading — and who's actually there.` (subjek data, bukan buzzword)
- CTA drill: `inspect evidence` (bukan "learn more")
- Chip labels persis nama flag teknis; reasons ditulis ulang bahasa awam: `ratio 24.7× (top 5% of 210 Solana rows)` · `6 reported traders` · `flagged 3 snapshots`.
- Dilarang: "AI-powered", "risk score", gauge, emoji.

## 5. a11y & Responsive
- AA contrast di dua mode — `--amber`/`--rust` light divalidasi ≥4.5:1 untuk teks kecil (fallback: teks gelap di chip tint).
- Keyboard: filter chips = `<button>`; expandable row = `<button aria-expanded>`; skip-link ke tabel.
- `prefers-reduced-motion`: meniadakan clothesline chip translate.
- Breakpoints: sm→stacked cards; md→tabel kolom ringkas; lg+ tabel penuh.

## 6. Delivery Gate
antislop Delivery Gate report (4 blok) di-output sebelum ship — disimpan di `docs/living/ANTISLOP-REPORT.md`. FAIL satu pun = belum ship.
