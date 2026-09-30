import { Sequence } from "remotion";
import { AudioTrack, CaptionBar, Centered, FadeIn, Pop, SCENES } from "./fastkit";

// V1 · BLOTTER — warm paper, serif display, everything vertically centered.

const PAPER = "#f6f1e7", CARD = "#fdfaf2", INK = "#262019", MUTED = "#8a7d6a";
const RUST = "#b23a1d", AMBER = "#b07d10", GOOD = "#3f6f51", LINEC = "#d8cdb8";
const mono = "'JetBrains Mono','Cascadia Mono',Consolas,monospace";
const serif = "Georgia,'Times New Roman',serif";

const Big = ({ children, size = 120, color = INK }: { children: React.ReactNode; size?: number; color?: string }) => (
  <div style={{ fontFamily: serif, fontWeight: 700, fontSize: size, color, lineHeight: 1.04 }}>{children}</div>
);
const Tag = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: 2.5, textTransform: "uppercase", color: RUST, marginBottom: 34 }}>
    {children}
  </div>
);

const ROWS = [
  ["DOGE", "SOL", "$299,046", "$12,099", "6", "TURNOVER_ANOMALY", RUST],
  ["INU", "BASE", "$171,941", "$18,506", "29", "TURNOVER_ANOMALY", RUST],
  ["FROG", "BASE", "$248,749", "$19,377", "31", "EMPTY_ROOM", RUST],
  ["QNT", "ETH", "$4.1M", "$2.64M", "2,062", "FADING", AMBER],
  ["JUP", "SOL", "$9.9M", "$4.83M", "7,520", "observed · clean", GOOD],
] as const;

export const FastV1Blotter = () => (
  <div style={{ position: "absolute", inset: 0, background: PAPER }}>
    <AudioTrack />

    <Sequence from={SCENES[0].from} durationInFrames={SCENES[0].dur}>
      <Centered bg={PAPER}>
        <Tag>washboard — a spot-market blotter</Tag>
        <FadeIn delay={4}><Big size={110}>$299,046 <span style={{ fontSize: 42, color: MUTED }}>24h volume</span></Big></FadeIn>
        <FadeIn delay={28}><div style={{ marginTop: 30 }}><Big size={150} color={RUST}>6 <span style={{ fontSize: 44, color: MUTED }}>traders</span></Big></div></FadeIn>
        <FadeIn delay={78}><div style={{ marginTop: 36, fontFamily: serif, fontStyle: "italic", fontSize: 38, color: INK }}>busy tape ≠ crowded room</div></FadeIn>
      </Centered>
    </Sequence>

    <Sequence from={SCENES[1].from} durationInFrames={SCENES[1].dur}>
      <Centered bg={PAPER}>
        <Tag>snapshot · 2,466 tokens · sha-pinned · replay</Tag>
        <div style={{ background: CARD, border: `2px solid ${LINEC}`, padding: "10px 34px", width: 1180 }}>
          {ROWS.map((r, i) => (
            <FadeIn key={r[0]} delay={i * 9} dist={16}>
              <div style={{
                display: "flex", alignItems: "center", gap: 26, padding: "13px 0",
                borderBottom: i < ROWS.length - 1 ? `1px dashed ${LINEC}` : "none",
              }}>
                <span style={{ width: 110, fontFamily: serif, fontWeight: 700, fontSize: 32, textAlign: "left" }}>{r[0]}</span>
                <span style={{ width: 80, fontFamily: mono, fontSize: 19, color: MUTED }}>{r[1]}</span>
                <span style={{ flex: 1, fontFamily: mono, fontSize: 21, textAlign: "left" }}>
                  vol {r[2]} · liq {r[3]} · <span style={{ color: r[6], fontWeight: 700 }}>{r[4]} traders</span>
                </span>
                <span style={{ fontFamily: mono, fontSize: 18, fontWeight: 700, color: "#fff8f0", background: r[6], padding: "5px 12px", borderRadius: 3 }}>{r[5]}</span>
              </div>
            </FadeIn>
          ))}
        </div>
      </Centered>
    </Sequence>

    <Sequence from={SCENES[2].from} durationInFrames={SCENES[2].dur}>
      <Centered bg={PAPER}>
        <Tag>lens one — is this turnover real?</Tag>
        <div style={{ display: "flex", gap: 56, alignItems: "center" }}>
          <FadeIn delay={6}><div><Big size={90}>24.7×</Big><div style={{ fontFamily: mono, fontSize: 22, color: MUTED, marginTop: 8 }}>turnover ratio</div></div></FadeIn>
          <FadeIn delay={22}><div style={{ fontFamily: serif, fontSize: 80, color: MUTED }}>·</div></FadeIn>
          <FadeIn delay={22}><div><Big size={90} color={RUST}>6</Big><div style={{ fontFamily: mono, fontSize: 22, color: MUTED, marginTop: 8 }}>reported traders</div></div></FadeIn>
        </div>
        <FadeIn delay={58}><div style={{ marginTop: 44 }}><Pop bg={RUST} fg="#fff8f0">TURNOVER_ANOMALY · DANGER</Pop></div></FadeIn>
      </Centered>
    </Sequence>

    <Sequence from={SCENES[3].from} durationInFrames={SCENES[3].dur}>
      <Centered bg={PAPER}>
        <Tag>lens two — backed by anyone?</Tag>
        <div style={{ display: "flex", gap: 44, alignItems: "center" }}>
          <FadeIn delay={4}><div><Big size={110} color={GOOD}>+21.1%</Big><div style={{ fontFamily: mono, fontSize: 22, color: MUTED, marginTop: 8 }}>24h price</div></div></FadeIn>
          <FadeIn delay={28}><div><Big size={110} color={RUST}>−3.7%</Big><div style={{ fontFamily: mono, fontSize: 22, color: MUTED, marginTop: 8 }}>4h · crowd thinning</div></div></FadeIn>
        </div>
        <FadeIn delay={68}><div style={{ display: "flex", gap: 20, marginTop: 46 }}><Pop bg={RUST} fg="#fff8f0">EMPTY_ROOM</Pop><Pop bg={AMBER} fg="#fff8f0" delay={10}>FADING</Pop></div></FadeIn>
      </Centered>
    </Sequence>

    <Sequence from={SCENES[4].from} durationInFrames={SCENES[4].dur}>
      <Centered bg={PAPER}>
        <Tag>every flag ships a receipt</Tag>
        <div style={{ background: CARD, border: `2px solid ${LINEC}`, padding: "26px 38px", fontFamily: mono, fontSize: 24, textAlign: "left" }}>
          {[
            ["/v1/dex/token", "Base · 0xba37…79f0", "sha256 · 2f1213e5…"],
            ["/v1/dex/token/pools", "Base · 0xba37…79f0", "sha256 · 7ca07f6f…"],
            ["/v1/dex/search", "q=FROG", "sha256 · bf0012d2…"],
          ].map((r, i) => (
            <FadeIn key={r[0]} delay={i * 12} dist={14}>
              <div style={{ display: "flex", gap: 30, padding: "11px 0", borderBottom: i < 2 ? `1px solid ${LINEC}` : "none" }}>
                <span style={{ width: 330, color: INK, fontWeight: 700 }}>{r[0]}</span>
                <span style={{ flex: 1, color: MUTED }}>{r[1]}</span>
                <span style={{ color: GOOD }}>{r[2]}</span>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={60}><div style={{ marginTop: 30, fontFamily: serif, fontStyle: "italic", fontSize: 34 }}>reproducible, not vibes</div></FadeIn>
      </Centered>
    </Sequence>

    <Sequence from={SCENES[5].from} durationInFrames={SCENES[5].dur}>
      <Centered bg={PAPER}>
        <Tag>what this board will not say</Tag>
        <div style={{ display: "flex", gap: 60 }}>
          {["scam", "wash confirmed", "insider"].map((w, i) => (
            <FadeIn key={w} delay={i * 18}>
              <div>
                <div style={{ fontFamily: serif, fontSize: 74, fontWeight: 700, color: MUTED, textDecoration: "line-through", textDecorationColor: RUST, textDecorationThickness: 6 }}>{w}</div>
                <div style={{ fontFamily: mono, fontSize: 19, color: INK, marginTop: 10 }}>
                  {["needs evidence we don't carry", "a flag is an observation", "addresses are not people"][i]}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Centered>
    </Sequence>

    <Sequence from={SCENES[6].from} durationInFrames={SCENES[6].dur}>
      <Centered bg={PAPER}>
        <FadeIn delay={2}><Big size={150}>WASHBOARD</Big></FadeIn>
        <FadeIn delay={28}><div style={{ fontFamily: mono, fontSize: 30, letterSpacing: 5, color: RUST, marginTop: 28 }}>EVIDENCE BEFORE CONVICTION</div></FadeIn>
        <FadeIn delay={52}><div style={{ fontFamily: mono, fontSize: 22, color: MUTED, marginTop: 40 }}>washboard-dex.vercel.app · spot-only · not investment advice</div></FadeIn>
      </Centered>
    </Sequence>

    <CaptionBar />
  </div>
);
