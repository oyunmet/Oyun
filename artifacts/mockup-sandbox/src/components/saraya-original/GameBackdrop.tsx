import { useId } from "react";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

type Props = {
  cameraX: number;
  elapsed: number;
  level: number;
};

const palettes = [
  { skyTop: "#25364a", skyMid: "#687078", horizon: "#d49b72", moon: "#f4dba5" },
  { skyTop: "#293b46", skyMid: "#6c746b", horizon: "#d49b72", moon: "#f2d8a0" },
  { skyTop: "#30364d", skyMid: "#77706d", horizon: "#d99d79", moon: "#f4dfb0" },
];

export default function GameBackdrop({ cameraX, elapsed, level }: Props) {
  const id = `saraya-backdrop-${useId().replace(/:/g, "")}`;
  const palette = palettes[Math.abs(Math.floor(level)) % palettes.length];
  const farShift = -((cameraX * 0.075) % 180);
  const middleShift = -((cameraX * 0.16) % 210);
  const nearShift = -((cameraX * 0.28) % 240);
  const starOpacity = 0.62 + Math.sin(elapsed * 1.5) * 0.07;

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 360 270"
      preserveAspectRatio="none"
      accessible={false}
    >
      <Defs>
        <LinearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.skyTop} />
          <Stop offset=".58" stopColor={palette.skyMid} />
          <Stop offset="1" stopColor={palette.horizon} />
        </LinearGradient>
        <LinearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f1c895" stopOpacity=".12" />
          <Stop offset="1" stopColor="#edc596" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      <Rect width="360" height="270" fill={`url(#${id}-sky)`} />
      <Rect y="112" width="360" height="85" fill={`url(#${id}-haze)`} />

      <Circle cx="285" cy="51" r="25" fill="#f0d9a4" opacity=".1" />
      <Circle cx="285" cy="51" r="13" fill={palette.moon} opacity=".91" />
      <Circle cx="290" cy="47" r="12" fill={palette.skyMid} opacity=".88" />

      <G fill="#f1dfb8" opacity={starOpacity}>
        <Circle cx="34" cy="31" r="1.1" />
        <Circle cx="81" cy="54" r=".9" />
        <Circle cx="126" cy="25" r="1.1" />
        <Circle cx="183" cy="63" r=".8" />
        <Circle cx="230" cy="27" r="1" />
        <Circle cx="334" cy="83" r=".9" />
        <Circle cx="315" cy="24" r=".7" />
      </G>
      <G fill="none" stroke="#f0d6a3" strokeWidth="1" opacity=".7">
        <Path d="M59 79v7m-3.5-3.5h7M158 43v6m-3-3h6M227 78v6m-3-3h6" />
      </G>

      <G transform={`translate(${farShift} 0)`}>
        <Path d="M-200 164q33-29 72-8 43-48 91-9 35-31 76-3 37-35 81-2 40-33 81 1 41-34 78 4v78h-557Z" fill="#5a6462" opacity=".62" />
        <Path d="M-190 149q28-23 59-6 39-39 77-8 30-25 62-4 35-34 68-1 31-28 62 1 36-25 71 5v10q-37-29-73-2-31-28-62-1-33-32-66 2-32-24-62 1-39-27-76 9-30-15-60 7Z" fill="#a08a70" opacity=".28" />
        <Path d="M7 132q13-21 26 0m78-4q12-19 23 0m104-10q15-24 30 0" fill="none" stroke="#c5a078" strokeWidth="1.1" opacity=".36" />
      </G>

      <G transform={`translate(${middleShift} 0)`}>
        <Path d="M-190 185q36-44 78-6 39-51 83-5 38-43 81-1 42-38 82 0 38-39 76 1 36-28 69 6v43h-469Z" fill="#455755" opacity=".82" />
        <Path d="M-150 177q37-32 73-1 36-35 72-1 36-39 74-3 38-35 75-1 39-30 74 3 35-28 68 8" fill="none" stroke="#c3a071" strokeWidth="1.2" opacity=".42" />
        <TreeLine id={id} x={14} y={165} />
        <TreeLine id={id} x={148} y={170} />
        <TreeLine id={id} x={268} y={162} />
        <TreeLine id={id} x={338} y={175} />
      </G>

      <G transform={`translate(${nearShift} 0)`} opacity=".9">
        <Path d="M-210 203q42-37 86-2 38-35 76-1 44-42 86 0 45-34 88 3 39-31 80-1 42-33 84 1 42-27 83 5v40h-583Z" fill="#344843" />
        <Path d="M-160 202q36-24 69-1m17 0q32-28 65-2m26 0q35-31 68-2m37 2q36-28 70-1m18 0q34-30 67-2" fill="none" stroke="#9e9870" strokeWidth="1.2" opacity=".45" />
      </G>

      <Path d="M0 209q45-7 92 0t91 0 91 0 86 0" fill="none" stroke="#d1af77" strokeWidth="1.3" opacity=".38" />
      <Path d="M0 218q55-8 113 1t123 0 124 1" fill="none" stroke="#263d37" strokeWidth="1" opacity=".5" />
    </Svg>
  );
}

function TreeLine({ id, x, y }: { id: string; x: number; y: number }) {
  return (
    <G>
      <Path d={`M${x} ${y + 15}v-9`} stroke="#66594c" strokeWidth="2" />
      <Path d={`M${x - 7} ${y + 8}q1-8 7-13 7 5 7 13l-7-2Z`} fill="#384d49" stroke={`url(#${id}-haze)`} strokeWidth=".6" />
      <Path d={`M${x - 4} ${y + 3}q4-6 8 0`} fill="none" stroke="#a79a70" strokeWidth=".8" opacity=".52" />
    </G>
  );
}
