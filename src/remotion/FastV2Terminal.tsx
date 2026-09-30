import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { AudioTrack, CaptionBar, FadeIn, Pop, SCENES, fade } from "./fastkit";

// V2 · TERMINAL — dark room, mono-only, dense data, streaming rows.

const BG = "#14100c", PANEL = "#1d1712", INK = "#ece3d2", MUTED = "#8d8172";
const RUST = "#e0603a", AMBER = "#d9a53a", GOOD = "#6fae85", LINEC = "#3a3227";
const mono = "'JetBrains Mono','Cascadia Mono',Consolas,monospace";

const Line = ({ children, delay = 0, color = INK, size = 30 }: { children: React.ReactNode; delay?: number; color?: string; size?: number }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ fontFamily: mono, fontSize: size, color, opacity: fade(f, delay), transform: `translateX(${interpolate(f - delay, [0, 10], [-26, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)` }}>
      {children}
    </div>
  );
};

const Shell = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <div style={{ position: "absolute", inset: 0, background: BG, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 130px" }}>
    <div style={{ fontFamily: mono, fontSize: 18, color: MUTED, letterSpacing: 3, marginBottom: 40 }}>
      <span style={{ color: RUST }}>▮</span> {title}
    </div>
    {children}
  </div>
);

const scan = (f: number) => ({
  position: "absolute" as const, inset: 0, pointerEvents: "none" as const,
  background: `repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,0.09) 3px 4px)`,
  opacity: 0.55,
});

const Blink = () => {
  const f = useCurrentFrame();
  return <span style={{ opacity: f % 30 < 16 ? 1 : 0, color: RUST }}>▮</span>;
};

export const FastV2Terminal = () => (
  <div style={{ position: "absolute", inset: 0, background: BG, color: INK }}>
    <AudioTrack />
    <Scan f={0} />

    <Sequence from={SCENES[0].from} durationInFrames={SCENES[0].dur}>
      <Shell title="WB://HOOK">
        <Line size={44} delay={4}>$299,046 <span style={{ color: MUTED, fontSize: 24 }}>reported 24h volume</span></Line>
        <div style={{ height: 26 }} />
        <Line size={44} delay={26} color={RUST}>6 <span style={{ color: MUTED, fontSize: 24 }}>reported unique traders</span></Line>
        <div style={{ height: 36 }} />
        <Line size={26} delay={78} color={MUTED}>$ cat room.txt → almost nobody there <Blink /></Line>
      </Shell>
    </Sequence>

    <Sequence from={SCENES[1].from} durationInFrames={SCENES[1].dur}>
      <Shell title="WB://BOARD · snapshot 2026-09-30 · sha b72646ba…">
        {[
          ["DOGE", "SOL", "vol $299k", "liq $12k", "ut 6", "TURNOVER_ANOMALY", RUST],
          ["INU", "BASE", "vol $171k", "liq $18k", "ut 29", "TURNOVER_ANOMALY", RUST],
          ["FROG", "BASE", "vol $248k", "liq $19k", "ut 31", "EMPTY_ROOM", RUST],
          ["QNT", "ETH", "vol $4.1M", "liq $2.6M", "ut 2062", "FADING", AMBER],
          ["JUP", "SOL", "vol $9.9M", "liq $4.8M", "ut 7520", "clean", GOOD],
        ].map((r, i) => (
          <Line key={r[0]} delay={i * 10} size={26}>
            <span style={{ color: INK, fontWeight: 700 }}>{r[0].padEnd(8)}</span>
            <span style={{ color: MUTED }}> {r[1].padEnd(5)} {r[2].padEnd(11)} {r[3].padEnd(10)} {r[4].padEnd(8)}</span>
            <span style={{ color: r[6], fontWeight: 700 }}> {r[5]}</span>
          </Line>
        ))}
        <div style={{ height: 30 }} />
        <Line size={22} delay={55} color={MUTED}>2,466 rows · 35 turnover anomalies · 315 empty rooms · 22 dual</Line>
      </Shell>
    </Sequence>

    <Sequence from={SCENES[2].from} durationInFrames={SCENES[2].dur}>
      <Shell title="WB://LENS1 · turnover vs people">
        <Line size={30} delay={4}>DOGE · Solana</Line>
        <div style={{ height: 22 }} />
        <Line size={30} delay={14} color={MUTED}>volume 24h&nbsp;&nbsp;&nbsp;&nbsp;$299,046</Line>
        <Line size={30} delay={24} color={MUTED}>pool depth&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$12,099</Line>
        <Line size={30} delay={34} color={RUST}>turnover&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;24.7×</Line>
        <Line size={30} delay={44} color={RUST}>unique traders&nbsp;6</Line>
        <div style={{ height: 30 }} />
        <FadeIn delay={70}><Pop bg={RUST} fg="#14100c">TURNOVER_ANOMALY · DANGER</Pop></FadeIn>
      </Shell>
    </Sequence>

    <Sequence from={SCENES[3].from} durationInFrames={SCENES[3].dur}>
      <Shell title="WB://LENS2 · price vs people">
        <Line size={30} delay={4} color={GOOD}>24h&nbsp;&nbsp;+21.1%&nbsp;&nbsp;2,062 traders</Line>
        <Line size={30} delay={30} color={AMBER}>4h&nbsp;&nbsp;&nbsp;−3.7%&nbsp;&nbsp;&nbsp;418 traders</Line>
        <Line size={30} delay={55} color={RUST}>1h&nbsp;&nbsp;&nbsp;−1.7%&nbsp;&nbsp;&nbsp;97 traders</Line>
        <div style={{ height: 34 }} />
        <FadeIn delay={80} style={{ display: "flex", gap: 18 }}>
          <Pop bg={RUST} fg="#14100c">EMPTY_ROOM</Pop>
          <Pop bg={AMBER} fg="#14100c" delay={8}>FADING</Pop>
        </FadeIn>
      </Shell>
    </Sequence>

    <Sequence from={SCENES[4].from} durationInFrames={SCENES[4].dur}>
      <Shell title="WB://RECEIPTS">
        {[
          ["GET /v1/dex/token", "platform=Base address=0xba37…79f0", "sha256 2f1213e5…"],
          ["GET /v1/dex/token/pools", "platform=Base address=0xba37…79f0", "sha256 7ca07f6f…"],
          ["GET /v1/dex/search", "q=FROG", "sha256 bf0012d2…"],
        ].map((r, i) => (
          <Line key={r[0]} delay={i * 12} size={26}>
            <span style={{ color: RUST }}>{r[0].padEnd(26)}</span>
            <span style={{ color: MUTED }}> {r[1].padEnd(42)} </span>
            <span style={{ color: GOOD }}>{r[2]}</span>
          </Line>
        ))}
        <div style={{ height: 30 }} />
        <Line size={26} delay={55} color={INK}>replay the snapshot → same flags, every time.</Line>
      </Shell>
    </Sequence>

    <Sequence from={SCENES[5].from} durationInFrames={SCENES[5].dur}>
      <Shell title="WB://WILL-NOT-SAY">
        {[
          ["scam", "accusation needs evidence this data can't carry"],
          ["wash confirmed", "a flag is an observation, not a verdict"],
          ["insider", "addresses are not entities"],
        ].map(([w, why], i) => (
          <Line key={w} delay={i * 22} size={32}>
            <span style={{ color: MUTED, textDecoration: "line-through", textDecorationColor: RUST, textDecorationThickness: 3 }}>{w.padEnd(16)}</span>
            <span style={{ color: INK, fontSize: 24 }}>  ← {why}</span>
          </Line>
        ))}
      </Shell>
    </Sequence>

    <Sequence from={SCENES[6].from} durationInFrames={SCENES[6].dur}>
      <Shell title="">
        <div style={{ textAlign: "center" }}>
          <FadeIn delay={2}><div style={{ fontFamily: mono, fontSize: 96, fontWeight: 700, letterSpacing: 6 }}>
            WASH<span style={{ color: RUST }}>BOARD</span>
          </div></FadeIn>
          <FadeIn delay={28}><div style={{ fontFamily: mono, fontSize: 24, color: GOOD, letterSpacing: 4, marginTop: 24 }}>
            evidence before conviction <Blink />
          </div></FadeIn>
          <FadeIn delay={50}><div style={{ fontFamily: mono, fontSize: 19, color: MUTED, marginTop: 36 }}>
            washboard-dex.vercel.app · spot-only · not investment advice
          </div></FadeIn>
        </div>
      </Shell>
    </Sequence>

    <CaptionBar />
  </div>
);

const Scan = ({ f }: { f: number }) => <div style={scan(f)} />;
