import { useId } from "react";
import Svg, {
  Circle,
  Defs,
  G,
  Image as SvgImage,
  LinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

type Props = {
  cameraX: number;
  elapsed: number;
  level: number;
};

const palettes = [
  { shade: "#14284a", glow: "#dfa06a" },
  { shade: "#17384a", glow: "#e0a16a" },
  { shade: "#242b51", glow: "#dba16f" },
];

export default function GameBackdrop({ cameraX, elapsed, level }: Props) {
  const id = `saraya-backdrop-${useId().replace(/:/g, "")}`;
  const palette = palettes[Math.abs(Math.floor(level)) % palettes.length];
  const parallax = -(cameraX * 0.024);
  const glint = 0.58 + Math.sin(elapsed * 1.4) * 0.08;

  return (
    <Svg width="100%" height="100%" viewBox="0 0 360 270" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={`${id}-shade`} x1="0" y1="0" x2="0.2" y2="1">
          <Stop offset="0" stopColor={palette.shade} stopOpacity=".3" />
          <Stop offset=".55" stopColor="#18364a" stopOpacity=".08" />
          <Stop offset="1" stopColor={palette.glow} stopOpacity=".15" />
        </LinearGradient>
        <LinearGradient id={`${id}-horizon`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f4d39a" stopOpacity="0" />
          <Stop offset="1" stopColor="#edbd7d" stopOpacity=".2" />
        </LinearGradient>
      </Defs>

      <G transform={`translate(${parallax} 0)`}>
        <SvgImage
          href={require("../../assets/saraya-3d-kingdom.png")}
          x={-55}
          y={0}
          width={500}
          height={270}
          preserveAspectRatio="xMidYMid slice"
        />
      </G>
      <Rect width="360" height="270" fill={`url(#${id}-shade)`} />
      <Rect y="146" width="360" height="66" fill={`url(#${id}-horizon)`} />

      <G fill="#fff0c8" opacity={glint}>
        <Circle cx="42" cy="35" r=".9" />
        <Circle cx="120" cy="57" r=".7" />
        <Circle cx="204" cy="28" r=".8" />
        <Circle cx="329" cy="79" r=".9" />
      </G>
      <G fill="none" stroke="#ffe1a8" strokeWidth="1" opacity=".52">
        <Circle cx="108" cy="127" r="1.4" />
        <Circle cx="247" cy="103" r="1" />
        <Circle cx="307" cy="154" r="1.3" />
      </G>
    </Svg>
  );
}
