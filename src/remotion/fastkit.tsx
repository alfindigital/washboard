import type { ReactNode } from "react";
import { Audio, Sequence, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

// Shared atoms for the three fast-cut variants (V1 Blotter / V2 Terminal / V3 Poster).
// Same VO track, same timing, same captions — visuals differ.

export const VO_FILES = [
  { file: "vo-f-s0.mp3", from: 6 },   // 0.20-4.28s  hook
  { file: "vo-f-s1.mp3", from: 140 }, // 4.68-10.12s board
  { file: "vo-f-s2.mp3", from: 316 }, // 10.52-16.20s lens one
  { file: "vo-f-s3.mp3", from: 498 }, // 16.60-22.28s lens two
  { file: "vo-f-s4.mp3", from: 680 }, // 22.68-27.88s receipts
  { file: "vo-f-s5.mp3", from: 848 }, // 28.28-33.88s guardrails
  { file: "vo-f-s6.mp3", from: 1028 },// 34.28-37.64s outro
];

export const SCENES = [
  { from: 0, dur: 140 },
  { from: 140, dur: 176 },
  { from: 316, dur: 182 },
  { from: 498, dur: 182 },
  { from: 680, dur: 168 },
  { from: 848, dur: 180 },
  { from: 1028, dur: 132 },
];
export const TOTAL_FRAMES = 1160;

export const CAPTIONS: { from: number; to: number; text: string }[] = [
  { from: 6, to: 134, text: "Every DEX board shows you the volume. None show you the room." },
  { from: 140, to: 310, text: "Washboard replays 2,466 spot tokens — two questions, no score." },
  { from: 316, to: 492, text: "Is this turnover real? $300k through a $12k pool — six traders." },
  { from: 498, to: 674, text: "Is this pump backed by anyone? Green candles, empty room — flagged." },
  { from: 680, to: 842, text: "Every flag ships its receipt — the query, the timestamp, the hash." },
  { from: 848, to: 1022, text: "Deterministic. Replayable. No accusations, no predictions." },
  { from: 1028, to: 1155, text: "Washboard. Evidence before conviction." },
];

// snappier timing than the original cut
export const fade = (frame: number, delay = 0) =>
  interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
export const rise = (frame: number, delay = 0, dist = 30) =>
  interpolate(frame - delay, [0, 12], [dist, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Local-frame fade/rise wrapper — use inside <Sequence>, NOT as fade(n) static calls.
export const FadeIn = ({
  children, delay = 0, dist = 26, style,
}: { children: ReactNode; delay?: number; dist?: number; style?: React.CSSProperties }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ opacity: fade(f, delay), transform: `translateY(${rise(f, delay, dist)}px)`, ...style }}>
      {children}
    </div>
  );
};

export const AudioTrack = () => (
  <>
    {VO_FILES.map((v) => (
      <Sequence key={v.file} from={v.from}>
        <Audio src={staticFile(v.file)} />
      </Sequence>
    ))}
  </>
);

export const CaptionBar = ({ fg = "#fff8ef", bg = "rgba(22,18,14,0.9)" }: { fg?: string; bg?: string }) => {
  const f = useCurrentFrame();
  const cap = CAPTIONS.find((c) => f >= c.from && f <= c.to);
  if (!cap) return null;
  return (
    <div style={{ position: "absolute", bottom: 34, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
      <div
        style={{
          fontFamily: "'JetBrains Mono','Cascadia Mono',Consolas,monospace",
          fontSize: 24,
          color: fg,
          background: bg,
          padding: "9px 24px",
          borderRadius: 3,
          maxWidth: 1500,
          textAlign: "center",
        }}
      >
        {cap.text}
      </div>
    </div>
  );
};

export const Centered = ({ children, bg }: { children: ReactNode; bg: string }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: bg,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      padding: "0 110px",
    }}
  >
    {children}
  </div>
);

export const Pop = ({
  children, delay = 0, bg, fg,
}: { children: ReactNode; delay?: number; bg: string; fg: string }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 11, stiffness: 240 } });
  return (
    <span
      style={{
        display: "inline-block",
        transform: `scale(${s})`,
        background: bg,
        color: fg,
        fontFamily: "'JetBrains Mono','Cascadia Mono',Consolas,monospace",
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: 1,
        padding: "8px 18px 7px",
        borderRadius: 3,
      }}
    >
      {children}
    </span>
  );
};
