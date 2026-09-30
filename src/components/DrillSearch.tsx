"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DrillRecord } from "@/types";
import { DrillCard } from "@/components/DrillCard";

interface Props {
  platform?: string;
  address?: string;
  q?: string;
}

export function DrillSearch({ platform, address, q }: Props) {
  const router = useRouter();
  const [input, setInput] = useState(q ?? "");
  const [busy, setBusy] = useState(false);
  const [record, setRecord] = useState<DrillRecord | null>(null);
  const [error, setError] = useState<{ code: string; message: string; details?: unknown } | null>(null);

  const run = useCallback(async (body: Record<string, string>) => {
    setBusy(true);
    setError(null);
    setRecord(null);
    try {
      const res = await fetch("/api/drill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error);
        return;
      }
      setRecord(json.data.record);
      router.replace(`/drill/${encodeURIComponent(json.data.id)}`, { scroll: false });
    } catch (e) {
      setError({ code: "NETWORK", message: e instanceof Error ? e.message : "request failed" });
    } finally {
      setBusy(false);
    }
  }, [router]);

  useEffect(() => {
    if (platform && address) run({ platform, address });
    else if (q) run({ q });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const candidates = (error?.details as { candidates?: { platform: string; address: string; symbol: string }[] } | undefined)?.candidates;

  return (
    <div>
      <form
        className="field"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) run({ q: input.trim() });
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="token symbol or pool address — e.g. 67OHIO or 0x8224…"
          aria-label="token symbol or pool address"
          disabled={busy}
        />
        <button className="btn" type="submit" disabled={busy || !input.trim()}>
          {busy ? "drilling…" : "drill"}
        </button>
      </form>
      <p className="dim" style={{ fontSize: 12, marginTop: 6 }}>
        A drill spends ~2 live CMC calls when the gate is open; captured drills replay free.
        Symbol lookups stay inside the snapshot universe first.
      </p>

      {busy && <p className="mono-sm dim" role="status">fetching provider fields and scoring…</p>}

      {error && (
        <div className="notice" role="alert" style={{ marginTop: 14 }}>
          <strong>{error.code}</strong> — {error.message}
          {candidates?.length ? (
            <div className="line" style={{ marginTop: 10 }}>
              {candidates.map((c) => (
                <button
                  key={`${c.platform}:${c.address}`}
                  className="chip"
                  onClick={() => run({ platform: c.platform, address: c.address })}
                >
                  {c.symbol} · {c.platform} · {c.address.slice(0, 8)}…
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {record && <div style={{ marginTop: 16 }}><DrillCard rec={record} /></div>}
    </div>
  );
}
