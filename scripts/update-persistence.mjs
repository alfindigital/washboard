#!/usr/bin/env node
// update-persistence.mjs — run right after a harvest. Rebuilds the board view
// for the new snapshot and rolls the consecutive daysFlagged counters.
// Usage: node scripts/update-persistence.mjs [universe-file.json]
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import path from "path";

const root = process.cwd();
const uniDir = path.join(root, "data", "universe");
const file = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(uniDir, JSON.parse(readFileSync(path.join(uniDir, "latest.json"), "utf8")).pointsTo);

const artifact = JSON.parse(readFileSync(file, "utf8"));
const snapshotId = path.basename(file).replace(/^universe-|\.json$/g, "");

// Mirror of engine semantics in plain JS (scripts can't import TS directly):
const num = (v) => (v === undefined || v === null || v === "" ? null : Number(v));
const rows = artifact.rows.map((t) => ({
  platform: t.plt, address: t.addr, symbol: t.s,
  v24h: num(t.v24h), liq: num(t.liq), ut24h: num(t.ut24h), pc24h: num(t.pc24h), mc: num(t.mc),
}));
const eligible = rows.filter((r) => r.v24h > 5000 && r.liq > 500 && r.ut24h !== null);
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * s.length)]; };
const bands = (l) => ({
  ut25: q(l.map((r) => r.ut24h), 0.25),
  ut50: q(l.map((r) => r.ut24h), 0.5),
  r75: q(l.map((r) => r.v24h / r.liq), 0.75),
  r95: q(l.map((r) => r.v24h / r.liq), 0.95),
  upt75: q(l.map((r) => r.v24h / r.ut24h), 0.75),
  n: l.length,
});
const globalB = bands(eligible);
const byChain = {};
eligible.forEach((r) => { (byChain[r.platform] = byChain[r.platform] || []).push(r); });
const chainB = {};
for (const [c, l] of Object.entries(byChain)) if (l.length >= 30) chainB[c] = bands(l);

const flags = {};
for (const r of eligible) {
  const b = chainB[r.platform] || globalB;
  const rt = r.v24h / r.liq;
  const gap = (rt >= b.r95 && r.ut24h <= b.ut25) || (rt >= b.r75 && r.ut24h <= b.ut25) || (rt >= b.r95 && r.ut24h <= b.ut50);
  const thin = r.ut24h <= b.ut25;
  const fat = r.v24h / r.ut24h >= b.upt75;
  const borderline = r.ut24h <= b.ut25 * 2;
  const funding = r.pc24h !== null && r.pc24h >= 0.03 && (thin || fat || borderline);
  flags[`${r.platform}:${r.address}`] = { gap, funding };
}

const pFile = path.join(root, "data", "persistence.json");
const store = existsSync(pFile) ? JSON.parse(readFileSync(pFile, "utf8")) : {};
for (const [id, f] of Object.entries(flags)) {
  const row = store[id] ?? { firstSeen: snapshotId, lastSeen: snapshotId, daysFlaggedGap: 0, daysFlaggedFunding: 0, snapshots: [] };
  row.lastSeen = snapshotId;
  if (!row.snapshots.includes(snapshotId)) row.snapshots = [...row.snapshots, snapshotId].slice(-30);
  row.daysFlaggedGap = f.gap ? row.daysFlaggedGap + 1 : 0;
  row.daysFlaggedFunding = f.funding ? row.daysFlaggedFunding + 1 : 0;
  store[id] = row;
}
writeFileSync(pFile, JSON.stringify(store, null, 2));
console.log(`persistence updated for snapshot ${snapshotId}: ${Object.keys(flags).length} identities seen, ${Object.keys(store).length} tracked total`);
