import { Composition } from "remotion";
import { WashboardDemo } from "./WashboardDemo";
import { WashboardDemoEL } from "./WashboardDemoEL";
import { FastV1Blotter } from "./FastV1Blotter";
import { FastV2Terminal } from "./FastV2Terminal";
import { FastV3Poster } from "./FastV3Poster";
import { TOTAL_FRAMES } from "./fastkit";

export const RemotionRoot = () => (
  <>
    <Composition
      id="WashboardDemo"
      component={WashboardDemo}
      durationInFrames={1920}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="WashboardDemoEL"
      component={WashboardDemoEL}
      durationInFrames={1985}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition id="WashboardV1" component={FastV1Blotter} durationInFrames={TOTAL_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="WashboardV2" component={FastV2Terminal} durationInFrames={TOTAL_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="WashboardV3" component={FastV3Poster} durationInFrames={TOTAL_FRAMES} fps={30} width={1920} height={1080} />
  </>
);
