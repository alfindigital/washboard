// LiquidityGap — universe harvest: sweep /v1/dex/search over letters,
// digits, and high-collision meme tickers before the CMC key expires.
// Saves a replayable snapshot: ideas/liquiditygap-universe-<date>.json

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(here, "../verdex/.env.local"), "utf8")
    .split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);
const KEY = env.CMC_API_KEY;
if (!KEY) { console.error("CMC_API_KEY missing"); process.exit(1); }
const BASE = "https://pro-api.coinmarketcap.com";

// letters + digits for breadth; high-collision tickers for the clone/scam habitat
const QUERIES = [
  ..."abcdefghijklmnopqrstuvwxyz".split(""),
  ..."0123456789".split(""),
  "pepe","doge","shib","inu","floki","wif","bonk","trump","melania","mog",
  "popcat","neiro","brett","degen","turbo","wojak","bob","cat","dog","frog",
  "moon","safe","baby","grok","elon","mars","rocket","pepu","slerf","bome",
  "mew","pnut","goat","act","maneki","michi","giga","boden","wen","pixel",
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const seen = new Map();
let credits = 0, failed = 0;
const t0 = Date.now();

for (const q of QUERIES) {
  const url = new URL(BASE + "/v1/dex/search");
  url.searchParams.set("q", q);
  try {
    const res = await fetch(url, { headers: { "X-CMC_PRO_API_KEY": KEY, Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
    const body = await res.json();
    credits += body?.status?.credit_count ?? 0;
    const tks = body?.data?.tks ?? [];
    let added = 0;
    for (const t of tks) {
      const key = `${t.plt}:${t.addr}`;
      if (!seen.has(key)) { seen.set(key, t); added++; }
    }
    console.log(`q="${q}" → ${tks.length} rows (+${added} new, total ${seen.size})`);
  } catch (e) {
    failed++;
    console.log(`q="${q}" → FAIL ${e.message}`);
  }
  await sleep(200);
}

const rows = [...seen.values()];
const snapshot = {
  schemaVersion: 1,
  capturedAt: new Date().toISOString(),
  endpoint: "/v1/dex/search",
  queries: QUERIES,
  creditsSpent: credits,
  failedQueries: failed,
  uniqueTokens: rows.length,
  rows,
};
const raw = JSON.stringify(snapshot);
snapshot.bodySha256 = createHash("sha256").update(raw).digest("hex");
const out = join(here, `liquiditygap-universe-${new Date().toISOString().slice(0, 10)}.json`);
writeFileSync(out, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
console.log(`\nDONE in ${((Date.now() - t0) / 1000).toFixed(0)}s — ${rows.length} unique tokens, ${credits} credits, ${failed} failed`);
console.log(`snapshot → ${out}`);
console.log(`sha256: ${snapshot.bodySha256}`);
