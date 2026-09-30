import type { ReactNode } from "react";
import { Audio, Sequence, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

// Forensic-blotter palette — matches app/globals.css.
const PAPER = "#f5efe2";
const INK = "#231f1a";
const MUTED = "#6b6455";
const RUST = "#a13d16";
const RUST_DARK = "#7c2d12";
const GOOD = "#3f6212";
const LINE = "#d9cfba";
const CARD = "#faf6ec";

const mono = "'JetBrains Mono', 'Consolas', monospace";
const serif = "Georgia, 'Times New Roman', serif";

const rise = (frame: number, delay = 0) =>
  interpolate(frame - delay, [0, 18], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const fade = (frame: number, delay = 0) =>
  interpolate(frame - delay, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const Chip = ({ text, tone, delay = 0 }: { text: string; tone: "bad" | "warn" | "ok" | "mute"; delay?: number }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 12, stiffness: 180 } });
  const colors = {
    bad: { bg: RUST, fg: "#fff8f0" },
    warn: { bg: "#b45309", fg: "#fff8f0" },
    ok: { bg: GOOD, fg: "#fffdf5" },
    mute: { bg: "#e7ddc8", fg: MUTED },
  }[tone];
  return (
    <span
      style={{
        display: "inline-block",
        transform: `scale(${s}) rotate(${interpolate(s, [0, 1], [-6, -1.5])}deg)`,
        background: colors.bg,
        color: colors.fg,
        fontFamily: mono,
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: 1,
        padding: "7px 16px 6px",
        borderRadius: 3,
        boxShadow: `0 2px 0 ${LINE}`,
      }}
    >
      {text}
    </span>
  );
};

const Label = ({ children, style }: { children: ReactNode; style?: React.CSSProperties }) => (
  <div style={{ fontFamily: mono, fontSize: 19, color: MUTED, letterSpacing: 2, textTransform: "uppercase", ...style }}>
    {children}
  </div>
);

const Scene = ({ children, from, dur }: { children: ReactNode; from: number; dur: number }) => (
  <Sequence from={from} durationInFrames={dur}>
    <div style={{ position: "absolute", inset: 0, background: PAPER, padding: "90px 110px" }}>{children}</div>
  </Sequence>
);

const Big = ({ children, size = 120, color = INK }: { children: ReactNode; size?: number; color?: string }) => (
  <div style={{ fontFamily: serif, fontWeight: 700, fontSize: size, color, lineHeight: 1.02 }}>{children}</div>
);

// Real numbers from the captured universe + fixtures — not props.
const ROWS = [
  { s: "DOGE", c: "SOL", v: "$299,046", l: "$12,099", ut: "6", flag: "TURNOVER_ANOMALY", tone: "bad" as const },
  { s: "INU", c: "BASE", v: "$171,941", l: "$18,506", ut: "29", flag: "TURNOVER_ANOMALY", tone: "bad" as const },
  { s: "FROG", c: "BASE", v: "$248,749", l: "$19,377", ut: "31", flag: "EMPTY_ROOM", tone: "bad" as const },
  { s: "QNT", c: "ETH", v: "$4.1M", l: "$2.64M", ut: "2,062", flag: "FADING", tone: "warn" as const },
  { s: "JUP", c: "SOL", v: "$9.9M", l: "$4.83M", ut: "7,520", flag: "observed · clean", tone: "ok" as const },
];

const BoardRow = ({ r, i }: { r: (typeof ROWS)[0]; i: number }) => {
  const f = useCurrentFrame();
  const d = i * 6;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28,
        padding: "17px 0",
        borderBottom: `2px solid ${LINE}`,
        opacity: fade(f, d),
        transform: `translateY(${rise(f, d)}px)`,
      }}
    >
      <div style={{ width: 130, fontFamily: serif, fontWeight: 700, fontSize: 34 }}>{r.s}</div>
      <div style={{ width: 90, fontFamily: mono, fontSize: 20, color: MUTED }}>{r.c}</div>
      <div style={{ flex: 1, fontFamily: mono, fontSize: 24 }}>
        vol {r.v} · liq {r.l} · <span style={{ color: r.tone === "ok" ? MUTED : RUST, fontWeight: 700 }}>{r.ut} traders</span>
      </div>
      <Chip text={r.flag} tone={r.tone} delay={d + 8} />
    </div>
  );
};

const LadderBar = ({ label, pct, traders, delay }: { label: string; pct: number; traders: number; delay: number }) => {
  const f = useCurrentFrame();
  const w = interpolate(f - delay, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const widthPct = Math.min(Math.abs(pct) * 60, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: fade(f, delay), marginBottom: 26 }}>
      <div style={{ width: 70, fontFamily: mono, fontSize: 24, color: MUTED, textAlign: "right" }}>{label}</div>
      <div style={{ flex: 1, height: 46, background: "#ece4d2", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: pct < 0 ? undefined : 0,
            right: pct < 0 ? 0 : undefined,
            width: `${widthPct * w}%`,
            height: "100%",
            background: pct < 0 ? RUST : GOOD,
          }}
        />
      </div>
      <div style={{ width: 300, fontFamily: mono, fontSize: 24 }}>
        {(pct * 100).toFixed(1)}% · {traders} traders
      </div>
    </div>
  );
};

// ElevenLabs v4 — Brian (male, s0–s6) + Sarah (female, s7–s14).
// Timings derived from ffprobe durations in public/vo-el-timing.json.
const VO_FILES = [
  { file: "vo-el-s0.mp3", from: 9 },
  { file: "vo-el-s1.mp3", from: 124 },
  { file: "vo-el-s2.mp3", from: 249 },
  { file: "vo-el-s3.mp3", from: 487 },
  { file: "vo-el-s4.mp3", from: 573 },
  { file: "vo-el-s5.mp3", from: 821 },
  { file: "vo-el-s6.mp3", from: 916 },
  { file: "vo-el-s7.mp3", from: 1116 },
  { file: "vo-el-s8.mp3", from: 1276 },
  { file: "vo-el-s9.mp3", from: 1370 },
  { file: "vo-el-s10.mp3", from: 1630 },
  { file: "vo-el-s11.mp3", from: 1687 },
  { file: "vo-el-s12.mp3", from: 1735 },
  { file: "vo-el-s13.mp3", from: 1860 },
  { file: "vo-el-s14.mp3", from: 1900 },
];

const CAPTIONS: { from: number; to: number; text: string }[] = [
  { from: 9, to: 120, text: "Most DEX boards rank tokens by volume and price." },
  { from: 124, to: 239, text: "But volume alone doesn't tell you who's actually in the room." },
  { from: 249, to: 477, text: "Washboard replays one snapshot of 2,466 spot tokens and asks two separate questions." },
  { from: 487, to: 569, text: "First: is this turnover real?" },
  { from: 573, to: 811, text: "High volume cycling through a thin pool, reported by only a handful of unique traders, gets flagged as a turnover anomaly." },
  { from: 821, to: 912, text: "Second: is this move backed by anyone?" },
  { from: 916, to: 1106, text: "A price pump with a near-empty room gets flagged separately — two lenses, never one score." },
  { from: 1116, to: 1272, text: "Every flag ships with its receipt: the query, the timestamp, the hash." },
  { from: 1276, to: 1360, text: "Reproducible, not vibes." },
  { from: 1370, to: 1620, text: "And because numbers deserve a second read, each drill card adds an AI second opinion — labeled, and never the verdict." },
  { from: 1630, to: 1683, text: "No accusations." },
  { from: 1687, to: 1731, text: "No predictions." },
  { from: 1735, to: 1850, text: "Just the evidence, and what would change the view." },
  { from: 1860, to: 1896, text: "Washboard." },
  { from: 1900, to: 1965, text: "Evidence before conviction." },
];

const Captions = () => {
  const f = useCurrentFrame();
  const cap = CAPTIONS.find((c) => f >= c.from && f <= c.to);
  if (!cap) return null;
  return (
    <div style={{ position: "absolute", bottom: 36, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: mono,
          fontSize: 25,
          color: "#fff8ef",
          background: "rgba(28,24,19,0.92)",
          padding: "10px 26px",
          borderRadius: 4,
          maxWidth: 1500,
          textAlign: "center",
        }}
      >
        {cap.text}
      </div>
    </div>
  );
};

export const WashboardDemoEL = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: PAPER }}>
      {VO_FILES.map((v) => (
        <Sequence key={v.file} from={v.from}>
          <Audio src={staticFile(v.file)} />
        </Sequence>
      ))}

      {/* S1 · hook — volume vs who's in the room (0–8.3s) */}
      <Scene from={0} dur={249}>
        <Label>WASHBOARD — a spot-market blotter</Label>
        <div style={{ marginTop: 60, opacity: fade(f, 10), transform: `translateY(${rise(f, 10)}px)` }}>
          <Big size={96}>
            $299,046 <span style={{ fontSize: 46, color: MUTED }}>reported 24h volume</span>
          </Big>
        </div>
        <div style={{ marginTop: 46, opacity: fade(f, 80), transform: `translateY(${rise(f, 80)}px)` }}>
          <Big size={150} color={RUST}>
            6 <span style={{ fontSize: 52, color: MUTED }}>reported unique traders</span>
          </Big>
        </div>
        <div style={{ marginTop: 56, opacity: fade(f, 140) }}>
          <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 40, color: INK }}>
            Busy tape ≠ crowded room.
          </div>
        </div>
      </Scene>

      {/* S2 · the board (8.3–16.2s) */}
      <Scene from={249} dur={238}>
        <Label>snapshot · 2,466 tokens · replay mode · sha-pinned</Label>
        <div style={{ marginTop: 40 }}>
          {ROWS.map((r, i) => (
            <BoardRow key={r.s} r={r} i={i} />
          ))}
        </div>
      </Scene>

      {/* S3 · lens A — turnover anomaly (16.2–27.4s) */}
      <Scene from={487} dur={334}>
        <Label>lens one — is this turnover real?</Label>
        <div style={{ marginTop: 50, display: "flex", gap: 60, alignItems: "flex-start" }}>
          <div style={{ flex: 1.2 }}>
            <Big size={82}>
              DOGE<span style={{ color: MUTED, fontSize: 44 }}> · Solana</span>
            </Big>
            <div style={{ marginTop: 40, fontFamily: mono, fontSize: 30, lineHeight: 1.9 }}>
              <div>volume 24h&nbsp;&nbsp;$299,046</div>
              <div>liquidity&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$12,099</div>
              <div>
                turnover&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: RUST, fontWeight: 700 }}>24.7×</span>
              </div>
              <div>
                unique traders&nbsp;<span style={{ color: RUST, fontWeight: 700 }}>6</span>
              </div>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              background: CARD,
              border: `2px solid ${LINE}`,
              padding: "38px 40px",
              transform: `rotate(-1deg)`,
              opacity: fade(f, 60),
            }}
          >
            <Label>reads</Label>
            <div style={{ marginTop: 20, fontFamily: serif, fontSize: 34, lineHeight: 1.35 }}>
              $299k moved through a $12k pool — and the provider counted six traders.
            </div>
            <div style={{ marginTop: 30 }}>
              <Chip text="TURNOVER_ANOMALY · DANGER" tone="bad" delay={70} />
            </div>
            <div style={{ marginTop: 24, fontFamily: mono, fontSize: 20, color: MUTED }}>
              observation — not a verdict
            </div>
          </div>
        </div>
      </Scene>

      {/* S4 · lens B — empty room / fading (27.4–37.2s) */}
      <Scene from={821} dur={295}>
        <Label>lens two — is this move backed by anyone?</Label>
        <div style={{ marginTop: 56 }}>
          <LadderBar label="24h" pct={0.211} traders={2062} delay={10} />
          <LadderBar label="4h" pct={-0.037} traders={418} delay={55} />
          <LadderBar label="1h" pct={-0.017} traders={97} delay={85} />
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 44 }}>
          <Chip text="EMPTY_ROOM" tone="bad" delay={100} />
          <Chip text="FADING_CROWD" tone="warn" delay={118} />
          <span style={{ fontFamily: mono, fontSize: 22, color: MUTED, alignSelf: "center", opacity: fade(f, 130) }}>
            two lenses — never one score
          </span>
        </div>
      </Scene>

      {/* S5 · receipts (37.2–45.7s) */}
      <Scene from={1116} dur={254}>
        <Label>evidence, attached</Label>
        <div style={{ marginTop: 46, background: CARD, border: `2px solid ${LINE}`, padding: "40px 46px" }}>
          {[
            ["GET", "/v1/dex/token", "platform=Base address=0xba37…79f0", "sha256 · 2f1213e5…"],
            ["GET", "/v1/dex/token/pools", "platform=Base address=0xba37…79f0", "sha256 · 7ca07f6f…"],
            ["GET", "/v1/dex/search", "q=FROG", "sha256 · bf0012d2…"],
          ].map(([m, p, q, s], i) => (
            <div
              key={p}
              style={{
                display: "flex",
                gap: 30,
                fontFamily: mono,
                fontSize: 25,
                padding: "15px 0",
                borderBottom: `1px solid ${LINE}`,
                opacity: fade(f, 20 + i * 14),
              }}
            >
              <span style={{ color: RUST_DARK, fontWeight: 700, width: 60 }}>{m}</span>
              <span style={{ width: 380 }}>{p}</span>
              <span style={{ flex: 1, color: MUTED }}>{q}</span>
              <span style={{ color: GOOD }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 38, fontFamily: serif, fontStyle: "italic", fontSize: 38, opacity: fade(f, 90) }}>
          Reproducible, not vibes.
        </div>
      </Scene>

      {/* S6 · second opinion (45.7–54.3s) */}
      <Scene from={1370} dur={260}>
        <Label>a labeled second read</Label>
        <div style={{ marginTop: 50, display: "flex", gap: 60, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <Big size={72}>deterministic rules</Big>
            <div style={{ fontFamily: mono, fontSize: 26, color: MUTED, marginTop: 16 }}>
              thresholds from the eligible set — same input, same flag, every replay
            </div>
          </div>
          <div style={{ fontFamily: serif, fontSize: 60, color: MUTED }}>+</div>
          <div style={{ flex: 1, opacity: fade(f, 50) }}>
            <Big size={72} color={RUST}>
              AI opinion
            </Big>
            <div style={{ fontFamily: mono, fontSize: 26, color: MUTED, marginTop: 16 }}>
              jev 0.90 / 0.78 — labeled second opinion, never the verdict
            </div>
          </div>
        </div>
        <div style={{ marginTop: 60, opacity: fade(f, 90) }}>
          <Chip text="agreement: consensus" tone="mute" delay={95} />
        </div>
      </Scene>

      {/* S7 · guardrails (54.3–62s) */}
      <Scene from={1630} dur={230}>
        <Label>what this board will not say</Label>
        <div style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 34 }}>
          {[
            ["scam", "an accusation needs evidence this data does not carry"],
            ["wash confirmed", "a flag is an observation, not a verdict"],
            ["insider", "addresses are not people"],
          ].map(([w, why], i) => (
            <div key={w} style={{ display: "flex", alignItems: "baseline", gap: 34, opacity: fade(f, 15 + i * 30) }}>
              <span
                style={{
                  fontFamily: serif,
                  fontSize: 52,
                  color: MUTED,
                  textDecoration: "line-through",
                  textDecorationColor: RUST,
                  textDecorationThickness: 5,
                }}
              >
                {w}
              </span>
              <span style={{ fontFamily: mono, fontSize: 24, color: INK }}>{why}</span>
            </div>
          ))}
        </div>
      </Scene>

      {/* S8 · outro (62–66.2s) */}
      <Scene from={1860} dur={125}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 200 }}>
          <div style={{ opacity: fade(f, 15), transform: `translateY(${rise(f, 15)}px)` }}>
            <Big size={140}>WASHBOARD</Big>
          </div>
          <div
            style={{
              marginTop: 30,
              fontFamily: mono,
              fontSize: 30,
              letterSpacing: 4,
              color: RUST,
              opacity: fade(f, 45),
            }}
          >
            EVIDENCE BEFORE CONVICTION
          </div>
          <div style={{ marginTop: 50, fontFamily: mono, fontSize: 21, color: MUTED, opacity: fade(f, 70) }}>
            spot-only · replayable snapshots · provider-reported counts · not investment advice
          </div>
        </div>
      </Scene>

      <Captions />
    </div>
  );
};
