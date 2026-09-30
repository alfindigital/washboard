import { Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { AudioTrack, CaptionBar, FadeIn, SCENES } from "./fastkit";

// V3 · POSTER — giant kinetic type, hard blocks, maximum punch. Few elements, huge type.

const PAPER = "#f6f1e7", INKBG = "#1d1712", RUST = "#b23a1d", RUSTBG = "#a13418";
const INK = "#262019", ONPAPER_MUTED = "#8a7d6a", ONINK_MUTED = "#8d8172", CREAM = "#f2ead9", GOOD = "#3f6f51";
const mono = "'JetBrains Mono','Cascadia Mono',Consolas,monospace";
const serif = "Georgia,'Times New Roman',serif";

const Full = ({ bg, children, center = true }: { bg: string; children: React.ReactNode; center?: boolean }) => (
  <div style={{
    position: "absolute", inset: 0, background: bg,
    display: "flex", flexDirection: "column",
    justifyContent: center ? "center" : "flex-start",
    alignItems: center ? "center" : "flex-start",
    textAlign: center ? "center" : "left",
    padding: "0 100px",
  }}>
    {children}
  </div>
);

const Slam = ({ children, delay = 0, size = 200, color = INK }: { children: React.ReactNode; delay?: number; size?: number; color?: string }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 13, stiffness: 300 } });
  return (
    <div style={{
      fontFamily: serif, fontWeight: 700, fontSize: size, color, lineHeight: 0.95,
      transform: `scale(${interpolate(s, [0, 1], [1.6, 1])})`,
      opacity: Math.min(1, s * 2),
    }}>
      {children}
    </div>
  );
};

const K = ({ children, color = ONINK_MUTED, size = 26 }: { children: React.ReactNode; color?: string; size?: number }) => (
  <div style={{ fontFamily: mono, fontSize: size, letterSpacing: 3, textTransform: "uppercase", color, marginBottom: 30 }}>
    {children}
  </div>
);

export const FastV3Poster = () => (
  <div style={{ position: "absolute", inset: 0, background: PAPER }}>
    <AudioTrack />

    {/* hook — ink on paper */}
    <Sequence from={SCENES[0].from} durationInFrames={SCENES[0].dur}>
      <Full bg={PAPER}>
        <K color={RUST}>washboard</K>
        <Slam delay={4} size={170}>$299k<span style={{ fontSize: 80, color: ONPAPER_MUTED }}> vol</span></Slam>
        <Slam delay={30} size={230} color={RUST}>6<span style={{ fontSize: 90, color: ONPAPER_MUTED }}> traders</span></Slam>
      </Full>
    </Sequence>

    {/* board — ink block, list ripped */}
    <Sequence from={SCENES[1].from} durationInFrames={SCENES[1].dur}>
      <Full bg={INKBG}>
        <K>one snapshot · 2,466 spot tokens</K>
        <Slam delay={4} size={130} color={CREAM}>2,466</Slam>
        <div style={{ display: "flex", gap: 50, marginTop: 40 }}>
          {[
            ["35", "turnover anomaly", RUST],
            ["315", "empty room", RUST],
            ["22", "dual-flagged", "#d9a53a"],
          ].map(([v, k, c], i) => (
            <FadeIn key={k} delay={40 + i * 14}>
              <div>
                <div style={{ fontFamily: serif, fontSize: 110, fontWeight: 700, color: c }}>{v}</div>
                <div style={{ fontFamily: mono, fontSize: 20, color: ONINK_MUTED, letterSpacing: 2 }}>{k}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Full>
    </Sequence>

    {/* lens 1 — paper, equation */}
    <Sequence from={SCENES[2].from} durationInFrames={SCENES[2].dur}>
      <Full bg={PAPER}>
        <K color={RUST}>is this turnover real?</K>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <Slam delay={4} size={150}>24.7×</Slam>
          <FadeIn delay={30}><div style={{ fontFamily: serif, fontSize: 110, color: ONPAPER_MUTED }}>÷</div></FadeIn>
          <Slam delay={36} size={150} color={RUST}>6</Slam>
        </div>
        <FadeIn delay={80}>
          <div style={{ fontFamily: mono, fontSize: 26, marginTop: 40, background: INK, color: PAPER, padding: "12px 26px" }}>
            TURNOVER_ANOMALY
          </div>
        </FadeIn>
      </Full>
    </Sequence>

    {/* lens 2 — rust block */}
    <Sequence from={SCENES[3].from} durationInFrames={SCENES[3].dur}>
      <Full bg={RUSTBG}>
        <K color="#ffd9c4">is this pump backed?</K>
        <Slam delay={4} size={150} color={CREAM}>+21.1%</Slam>
        <Slam delay={34} size={150} color={INKBG}>empty room</Slam>
        <FadeIn delay={80}>
          <div style={{ fontFamily: mono, fontSize: 26, color: CREAM, marginTop: 38, border: `2px solid ${CREAM}`, padding: "10px 24px" }}>
            EMPTY_ROOM · FADING
          </div>
        </FadeIn>
      </Full>
    </Sequence>

    {/* receipts — ink block */}
    <Sequence from={SCENES[4].from} durationInFrames={SCENES[4].dur}>
      <Full bg={INKBG}>
        <K>the receipt</K>
        <FadeIn delay={6}>
          <div style={{ fontFamily: mono, fontSize: 30, color: CREAM, textAlign: "left" }}>
            <div>GET /v1/dex/token <span style={{ color: ONINK_MUTED }}>0xba37…79f0</span></div>
            <div style={{ marginTop: 14 }}>GET /v1/dex/token/pools <span style={{ color: ONINK_MUTED }}>0xba37…79f0</span></div>
            <div style={{ marginTop: 14 }}>GET /v1/dex/search <span style={{ color: ONINK_MUTED }}>q=FROG</span></div>
          </div>
        </FadeIn>
        <Slam delay={60} size={90} color={GOOD}>sha256 ✓</Slam>
      </Full>
    </Sequence>

    {/* guardrails — paper, strikethrough row */}
    <Sequence from={SCENES[5].from} durationInFrames={SCENES[5].dur}>
      <Full bg={PAPER}>
        <K color={RUST}>never said</K>
        <div style={{ display: "flex", gap: 56 }}>
          {["scam", "wash", "insider"].map((w, i) => (
            <Slam key={w} delay={i * 16} size={110} color={ONPAPER_MUTED}>
              <span style={{ textDecoration: "line-through", textDecorationColor: RUST, textDecorationThickness: 8 }}>{w}</span>
            </Slam>
          ))}
        </div>
        <FadeIn delay={62}>
          <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 40, color: INK, marginTop: 44 }}>
            observations, not verdicts.
          </div>
        </FadeIn>
      </Full>
    </Sequence>

    {/* outro — ink, giant wordmark */}
    <Sequence from={SCENES[6].from} durationInFrames={SCENES[6].dur}>
      <Full bg={INKBG}>
        <Slam delay={2} size={190} color={CREAM}>WASHBOARD</Slam>
        <FadeIn delay={30}>
          <div style={{ fontFamily: mono, fontSize: 30, letterSpacing: 6, color: "#e0603a", marginTop: 30 }}>
            EVIDENCE BEFORE CONVICTION
          </div>
        </FadeIn>
        <FadeIn delay={55}>
          <div style={{ fontFamily: mono, fontSize: 21, color: ONINK_MUTED, marginTop: 34 }}>
            washboard-dex.vercel.app
          </div>
        </FadeIn>
      </Full>
    </Sequence>

    <CaptionBar bg="rgba(20,16,11,0.88)" />
  </div>
);
