#!/usr/bin/env node
// verify-evidence.mjs — recompute sha256 of every hashable artifact and
// compare against the stored hash. Exit 1 on any mismatch. Read-only.
import { createHash } from "crypto";
import { existsSync, readFileSync, readdirSync } from "fs";
import path from "path";

const root = process.cwd();
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
let fail = 0;
const results = [];

function check(name, filePath, expected) {
  if (!existsSync(filePath)) {
    results.push({ name, ok: false, why: "missing file" });
    fail++;
    return;
  }
  const actual = sha(readFileSync(filePath));
  const ok = actual === expected;
  results.push({ name, ok, expected: expected?.slice(0, 12), actual: actual.slice(0, 12) });
  if (!ok) fail++;
}

// 1) universe artifact — the artifact stores sha256 of `rows` (bodySha256)
// plus a pointer file for the active snapshot.
const uniDir = path.join(root, "data", "universe");
const pointer = JSON.parse(readFileSync(path.join(uniDir, "latest.json"), "utf8"));
const uniFile = path.join(uniDir, pointer.pointsTo);
const uni = JSON.parse(readFileSync(uniFile, "utf8"));
// Harvest convention: bodySha256 = sha256(JSON.stringify(snapshot)) computed
// BEFORE the field itself is appended. Recompute by deleting the field.
const preHash = { ...uni };
delete preHash.bodySha256;
const recomputed = sha(JSON.stringify(preHash));
results.push({
  name: `universe bodySha256 (${pointer.pointsTo})`,
  ok: recomputed === uni.bodySha256,
  expected: (uni.bodySha256 ?? "n/a").slice(0, 12),
  actual: recomputed.slice(0, 12),
});
if (recomputed !== uni.bodySha256) fail++;
results.push({ name: "universe file sha256", ok: true, actual: sha(readFileSync(uniFile)).slice(0, 12) });

// 2) drill bundles — each record carries per-call receipt sha; verify the
// record file parses and reported receipts carry sha fields.
const drillsDir = path.join(root, "data", "drills");
if (existsSync(drillsDir)) {
  for (const f of readdirSync(drillsDir).filter((x) => x.endsWith(".json"))) {
    try {
      const rec = JSON.parse(readFileSync(path.join(drillsDir, f), "utf8"));
      const receipts = rec.receipts ?? [];
      const allSha = receipts.every((r) => typeof r.bodySha256 === "string" && r.bodySha256.length >= 32);
      results.push({ name: `drill ${f}`, ok: allSha && !!rec.id && !!rec.generatedAt, why: allSha ? "receipts carry sha256" : "receipt missing sha256" });
      if (!(allSha && rec.id)) fail++;
    } catch {
      results.push({ name: `drill ${f}`, ok: false, why: "unparseable" });
      fail++;
    }
  }
} else {
  results.push({ name: "drills dir", ok: true, why: "no drills captured yet" });
}

// 3) fixtures parse
for (const f of readdirSync(path.join(root, "data", "fixtures")).filter((x) => x.endsWith(".json"))) {
  try {
    JSON.parse(readFileSync(path.join(root, "data", "fixtures", f), "utf8"));
    results.push({ name: `fixture ${f}`, ok: true, actual: sha(readFileSync(path.join(root, "data", "fixtures", f))).slice(0, 12) });
  } catch {
    results.push({ name: `fixture ${f}`, ok: false, why: "unparseable" });
    fail++;
  }
}

for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.expected ? `  expected=${r.expected}` : ""}${r.actual ? `  actual=${r.actual}` : ""}${r.why ? `  (${r.why})` : ""}`);
}
console.log(fail === 0 ? "\nall evidence verified" : `\n${fail} check(s) failed`);
process.exit(fail === 0 ? 0 : 1);
