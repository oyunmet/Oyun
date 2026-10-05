import { useId } from "react";
import { View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import CharacterRider from "./CharacterRider";
import type { CharacterId } from "../storage/profile";

type Props = {
  vehicle: "bike" | "motorcycle" | "car";
  character: CharacterId;
  riderColor: string;
  width: number;
  height: number;
  elapsed?: number;
};

export default function VehicleSprite({
  vehicle,
  character,
  riderColor,
  width,
  height,
  elapsed = 0,
}: Props) {
  const id = `saraya-vehicle-${useId().replace(/:/g, "")}`;
  if (vehicle === "bike") {
    return (
      <View style={{ width, height, overflow: "hidden" }}>
        <Svg width={width} height={height} viewBox="0 0 120 82" preserveAspectRatio="xMidYMid meet">
          <Defs>
            <LinearGradient id={`${id}-tire`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#48505a" />
              <Stop offset=".42" stopColor="#202b36" />
              <Stop offset="1" stopColor="#111b25" />
            </LinearGradient>
            <LinearGradient id={`${id}-metal`} x1="0" y1="0" x2=".9" y2="1">
              <Stop offset="0" stopColor="#f2dcaa" />
              <Stop offset=".34" stopColor="#b78f59" />
              <Stop offset="1" stopColor="#76563f" />
            </LinearGradient>
          </Defs>
          <Ellipse cx="60" cy="73.5" rx="48" ry="4.5" fill="#17242c" opacity=".35" />
          <Wheel id={id} cx={27} cy={58} radius={14} rotation={elapsed * 210} />
          <Wheel id={id} cx={89} cy={58} radius={14} rotation={elapsed * 210} />
          <Path
            d="M27 57 47 38 58 58 84 38 89 57 58 58 47 38 39 58m8-20 27 0 12 20"
            fill="none"
            stroke={`url(#${id}-metal)`}
            strokeWidth="3.3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <Path d="M38 48 47 39" stroke={riderColor} strokeWidth="2.4" strokeLinecap="round" />
          <Path d="m45 36 11-2m19 3 9-8m-3 0 8 1" fill="none" stroke="#614a39" strokeWidth="2.6" strokeLinecap="round" />
          <Path d="M41 58h11m10 0h11" stroke="#e2c88f" strokeWidth="2.2" strokeLinecap="round" />
          <Circle cx="58" cy="58" r="4.5" fill="#b8905d" stroke="#f0d9a3" strokeWidth="1.3" />
          <Path d="m58 58-6 12m6-12 9 10" stroke="#71543a" strokeWidth="2" strokeLinecap="round" />
        </Svg>
        <CharacterRider character={character} vehicle={vehicle} width={width} height={height} />
      </View>
    );
  }
  const motorcycle = vehicle === "motorcycle";

  return (
    <View style={{ width, height, overflow: "hidden" }}>
      <Svg
        width={width}
        height={height}
        viewBox="0 0 120 82"
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
        <LinearGradient id={`${id}-tire`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#48505a" />
          <Stop offset=".42" stopColor="#202b36" />
          <Stop offset="1" stopColor="#111b25" />
        </LinearGradient>
        <LinearGradient id={`${id}-metal`} x1="0" y1="0" x2=".9" y2="1">
          <Stop offset="0" stopColor="#f2dcaa" />
          <Stop offset=".34" stopColor="#b78f59" />
          <Stop offset="1" stopColor="#76563f" />
        </LinearGradient>
        <LinearGradient id={`${id}-armor`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#f2e4c5" />
          <Stop offset=".26" stopColor={riderColor} />
          <Stop offset="1" stopColor="#554b55" />
        </LinearGradient>
        <LinearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#d7a36d" />
          <Stop offset=".5" stopColor="#a96d4f" />
          <Stop offset="1" stopColor="#67483f" />
        </LinearGradient>
        <LinearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#b5d0cf" stopOpacity=".88" />
          <Stop offset="1" stopColor="#54727a" stopOpacity=".94" />
        </LinearGradient>
        </Defs>

        <Ellipse cx="60" cy="73.5" rx="48" ry="4.5" fill="#17242c" opacity=".35" />

        {motorcycle && (
          <G>
          <Wheel id={id} cx={28} cy={58} rotation={elapsed * 250} />
          <Wheel id={id} cx={83} cy={58} rotation={elapsed * 250} />
          <Path d="M27 57 38 43l18-5 17 5 10 14H27Z" fill="#71604d" stroke="#d0b17c" strokeWidth="1.4" strokeLinejoin="round" />
          <Path d="M42 41q8-10 21-9l11 8-4 8H46Z" fill="#a65a50" stroke="#e1bd83" strokeWidth="1.7" strokeLinejoin="round" />
          <Path d="M47 39q7-8 15-6l7 5-2 5H50Z" fill={`url(#${id}-body)`} />
          <Path d="M48 42q9-8 17-6" fill="none" stroke={riderColor} strokeWidth="2" strokeLinecap="round" />
          <Path d="m34 45 9-2-5 10H29Zm36-2 9 3 6 10H68Z" fill="#d8b775" stroke="#765743" strokeWidth="1.3" />
          <Path d="M37 54h26m-22 5h26" stroke="#e2c88f" strokeWidth="1.2" opacity=".72" />
          <Path d="m73 43 7-6 7 1-2 5-7 1m-41-1-7-5-7 1" fill="none" stroke="#524942" strokeWidth="2.2" strokeLinecap="round" />
          <Path d="M28 58h55" stroke="#382f2e" strokeWidth="2" opacity=".7" />
          <Path d="m43 59-1 6m10-7 2 6" stroke="#c89f65" strokeWidth="2" strokeLinecap="round" />
          </G>
        )}

        {!motorcycle && (
          <G>
          <Wheel id={id} cx={31} cy={59} radius={10.5} rotation={elapsed * 180} />
          <Wheel id={id} cx={79} cy={59} radius={10.5} rotation={elapsed * 180} />
          <Path d="M11 54q2-7 10-9l13-14q5-5 15-5h22q9 0 14 8l10 10q9 3 12 10v8H10Z" fill={`url(#${id}-body)`} stroke="#e3c18a" strokeWidth="1.7" strokeLinejoin="round" />
          <Path d="m36 31q4-3 12-3h10v16H24Zm26-3h7q7 0 11 7l7 9H62Z" fill={`url(#${id}-glass)`} stroke="#f0d7a5" strokeWidth="1.3" strokeLinejoin="round" />
          <Path d="M60 28v17m-36 0h61" stroke="#694b42" strokeWidth="1.5" />
          <Path d="M22 51h15m34 0h21" stroke={riderColor} strokeWidth="2.1" opacity=".9" strokeLinecap="round" />
          <Path d="M13 51h13m71 0 8 2" stroke="#f1d192" strokeWidth="2.2" strokeLinecap="round" />
          <Path d="M15 58h6m82 0h6" stroke="#e9c477" strokeWidth="2.4" strokeLinecap="round" />
          <Path d="M48 45v12m27-12v12" stroke="#8b5947" strokeWidth="1.4" />
          </G>
        )}
      </Svg>
      <CharacterRider character={character} vehicle={vehicle} width={width} height={height} />
    </View>
  );
}

function Wheel({
  id,
  cx,
  cy,
  radius = 14.5,
  rotation = 0,
}: {
  id: string;
  cx: number;
  cy: number;
  radius?: number;
  rotation?: number;
}) {
  return (
    <G>
      <Circle cx={cx + 1.2} cy={cy + 1.5} r={radius + 1.2} fill="#151e27" opacity=".56" />
      <Circle cx={cx} cy={cy} r={radius} fill={`url(#${id}-tire)`} stroke="#101923" strokeWidth="1.5" />
      <Circle cx={cx} cy={cy} r={radius - 3.3} fill="#b9a27b" stroke="#e7d2aa" strokeWidth="1.1" />
      <Circle cx={cx} cy={cy} r={radius - 5.3} fill="#46515a" stroke="#736d61" strokeWidth=".8" />
      <Circle cx={cx} cy={cy} r="2.2" fill="#e6cb91" />
      <G transform={`rotate(${rotation} ${cx} ${cy})`}>
        <Path d={`M${cx - radius + 2} ${cy - 5}a${radius} ${radius} 0 0 1 ${radius * 1.1} -${radius * 0.82}`} fill="none" stroke="#88909a" strokeWidth="1.4" strokeLinecap="round" opacity=".72" />
        <Path d={`M${cx - 1} ${cy - radius + 4}v${radius * 1.55}m-${radius * 0.7} -${radius * 0.75}h${radius * 1.4}`} stroke="#ded0ae" strokeWidth=".8" opacity=".72" />
      </G>
    </G>
  );
}
