import { Composition } from "remotion";
import { WashboardDemo } from "./WashboardDemo";

export const RemotionRoot = () => (
  <Composition
    id="WashboardDemo"
    component={WashboardDemo}
    durationInFrames={1920}
    fps={30}
    width={1920}
    height={1080}
  />
);
