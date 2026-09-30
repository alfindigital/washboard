import { Composition } from "remotion";
import { WashboardDemo } from "./WashboardDemo";
import { WashboardDemoEL } from "./WashboardDemoEL";

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
  </>
);
