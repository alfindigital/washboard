import type { Wave } from "@/types";

export function Waves({ waves }: { waves: Wave[] }) {
  if (!waves.length) return null;
  return (
    <section aria-label="detected same-shape waves" className="panel" style={{ marginTop: 18 }}>
      <h2>
        Same-shape waves <span className="dim mono-sm">({waves.length})</span>
      </h2>
      <p className="dim" style={{ fontSize: 12.5, marginTop: 0 }}>
        Groups of ≥4 flagged tokens sharing chain, age band, and trader band — the shape
        of a campaign, not proof of coordination. Addresses are not entities.
      </p>
      {waves.slice(0, 8).map((w, i) => (
        <div key={`${w.key.platform}-${i}`} className="line" style={{ marginTop: 14 }}>
          <div>
            <span className="chip">
              <span className="dot" style={{ background: "var(--rust)" }} />
              {w.key.platform} · {w.key.ageBand} · ut {w.key.utBand} · n={w.size}
            </span>
            {w.members.slice(0, 14).map((m) => (
              <a
                key={m.identity}
                className="chip"
                href={`/drill?platform=${encodeURIComponent(w.key.platform)}&address=${encodeURIComponent(m.address)}`}
                title={`turnover ${m.ratio?.toFixed(1)}× · ${m.ut ?? "?"} reported traders`}
              >
                {m.symbol}
              </a>
            ))}
            {w.members.length > 14 ? <span className="mono-sm dim">+{w.members.length - 14} more</span> : null}
          </div>
          <p className="mono-sm dim" style={{ margin: "4px 0 0" }}>
            median turnover {w.medianRatio?.toFixed(1) ?? "—"}× · median traders {w.medianUt ?? "—"}
          </p>
        </div>
      ))}
      {waves.length > 8 ? (
        <p className="mono-sm dim" style={{ marginTop: 8 }}>
          +{waves.length - 8} more waves — see <a className="link" href="/api/board">/api/board</a> for the full set.
        </p>
      ) : null}
    </section>
  );
}
