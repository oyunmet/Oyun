import { useId } from "react";
import Svg, {
  Circle,
  G,
  Image as SvgImage,
  Rect,
} from "react-native-svg";
import { getBackgroundSpec } from "../game/backgrounds";
import type { BackgroundId } from "../storage/profile";

export const WORLD_ART: Record<BackgroundId, number> = {
  royal: require("../../assets/saraya-3d-kingdom.png"),
  candy: require("../../assets/worlds/saraya-candy-valley.jpg"),
  clouds: require("../../assets/worlds/saraya-cloud-kingdom.jpg"),
  snow: require("../../assets/worlds/saraya-snowy-forest.jpg"),
  dino: require("../../assets/worlds/saraya-dinosaur-valley.jpg"),
  space: require("../../assets/worlds/saraya-space-garden.jpg"),
};

type IllustrationProps = {
  theme: BackgroundId;
  width?: number | string;
  height?: number | string;
};

export function BackgroundIllustration({
  theme,
  width = "100%",
  height = "100%",
}: IllustrationProps) {
  const background = getBackgroundSpec(theme);
  return (
    <Svg width={width} height={height} viewBox="0 0 360 270" preserveAspectRatio="xMidYMid slice">
      <Rect width="360" height="270" fill={background.sky} />
      <SvgImage
        href={WORLD_ART[theme]}
        x="0"
        y="0"
        width="360"
        height="270"
        preserveAspectRatio="xMidYMid slice"
      />
    </Svg>
  );
}

type Props = {
  cameraX: number;
  elapsed: number;
  level: number;
  theme: BackgroundId;
};

export default function GameBackdrop({ cameraX, elapsed, level, theme }: Props) {
  const id = `saraya-backdrop-${useId().replace(/:/g, "")}`;
  const background = getBackgroundSpec(theme);
  const parallax = -(cameraX * 0.024);
  const twinkle = 0.68 + Math.sin(elapsed * 1.4 + level) * 0.12;

  return (
    <Svg width="100%" height="100%" viewBox="0 0 360 270" preserveAspectRatio="none">
      <Rect width="360" height="270" fill={background.sky} />
      <G transform={`translate(${parallax} 0)`}>
        <SvgImage
          href={WORLD_ART[theme]}
          x={-55}
          y={0}
          width={470}
          height={270}
          preserveAspectRatio="xMidYMid slice"
        />
      </G>
      <Rect width="360" height="270" fill="#fff" opacity=".035" />
      <Rect y="150" width="360" height="62" fill={background.accent} opacity=".075" />
      <G fill="#fff9dc" opacity={twinkle}>
        <Circle cx="42" cy="35" r="1.15" />
        <Circle cx="120" cy="57" r=".9" />
        <Circle cx="204" cy="28" r="1" />
        <Circle cx="329" cy="79" r="1.1" />
      </G>
      <G fill="none" stroke={background.accent} strokeWidth="1" opacity=".5">
        <Circle cx="108" cy="127" r="1.7" />
        <Circle cx="247" cy="103" r="1.2" />
        <Circle cx="307" cy="154" r="1.5" />
      </G>
    </Svg>
  );
}
