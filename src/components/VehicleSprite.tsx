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
import { getDefaultVehicleModel, getVehicleModelSpec } from "../game/vehicles";
import type { CharacterId, VehicleModelId } from "../storage/profile";

type Props = {
  vehicle: "bike" | "motorcycle" | "car";
  model?: VehicleModelId;
  character: CharacterId;
  riderColor: string;
  width: number;
  height: number;
  elapsed?: number;
  wheelRotation?: number;
};

export default function VehicleSprite({
  vehicle,
  model,
  character,
  riderColor,
  width,
  height,
  elapsed = 0,
  wheelRotation,
}: Props) {
  const id = `saraya-vehicle-${useId().replace(/:/g, "")}`;
  const modelId = model ?? getDefaultVehicleModel(vehicle);
  const modelSpec = getVehicleModelSpec(modelId);
  const rollingRotation = wheelRotation ?? elapsed * (vehicle === "motorcycle" ? 250 : 210);
  if (vehicle === "bike") {
    return (
      <View style={{ width, height, overflow: "hidden" }}>
        <Svg width={width} height={height} viewBox="0 0 120 74" preserveAspectRatio="xMidYMid meet">
          <Defs>
            <LinearGradient id={`${id}-tire`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#48505a" />
              <Stop offset=".42" stopColor="#202b36" />
              <Stop offset="1" stopColor="#111b25" />
            </LinearGradient>
            <LinearGradient id={`${id}-metal`} x1="0" y1="0" x2=".9" y2="1">
              <Stop offset="0" stopColor={modelSpec.highlight} />
              <Stop offset=".34" stopColor={modelSpec.paint} />
              <Stop offset="1" stopColor={modelSpec.trim} />
            </LinearGradient>
          </Defs>
          <Ellipse cx="60" cy="72" rx="42" ry="1.5" fill="#17242c" opacity=".24" />
          <Wheel id={id} cx={27} cy={58} radius={14} rotation={rollingRotation} />
          <Wheel id={id} cx={89} cy={58} radius={14} rotation={rollingRotation} />
          <Path
            d="M27 57 47 38 58 58 84 38 89 57 58 58 47 38 39 58m8-20 27 0 12 20"
            fill="none"
            stroke={`url(#${id}-metal)`}
            strokeWidth="3.3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <Path d="M38 48 47 39" stroke={riderColor} strokeWidth="2.4" strokeLinecap="round" />
          <Path d="m45 36 11-2m19 3 9-8m-3 0 8 1" fill="none" stroke={modelSpec.trim} strokeWidth="2.6" strokeLinecap="round" />
          <Path d="M41 58h11m10 0h11" stroke={modelSpec.highlight} strokeWidth="2.2" strokeLinecap="round" />
          <Circle cx="58" cy="58" r="4.5" fill={modelSpec.paint} stroke={modelSpec.highlight} strokeWidth="1.3" />
          <Path d="m58 58-6 12m6-12 9 10" stroke="#71543a" strokeWidth="2" strokeLinecap="round" />
          {modelId === "bike-rainbow" && (
            <G>
              <Path d="M49 34q6-7 13-7t12 7" fill="none" stroke={modelSpec.highlight} strokeWidth="3" strokeLinecap="round" />
              <Circle cx="58" cy="32" r="2.5" fill="#ffe47d" />
            </G>
          )}
          {modelId === "bike-cloud" && (
            <Path d="M46 47q5-5 10 0t10 0t10 0" fill="none" stroke={modelSpec.highlight} strokeWidth="2.6" strokeLinecap="round" />
          )}
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
        viewBox={motorcycle ? "0 0 120 72" : "0 0 120 70"}
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
          <Stop offset="0" stopColor={modelSpec.highlight} />
          <Stop offset=".5" stopColor={modelSpec.paint} />
          <Stop offset="1" stopColor={modelSpec.trim} />
        </LinearGradient>
        <LinearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#b5d0cf" stopOpacity=".88" />
          <Stop offset="1" stopColor="#54727a" stopOpacity=".94" />
        </LinearGradient>
        </Defs>

        <Ellipse cx="60" cy={motorcycle ? 71 : 68} rx="40" ry="1.7" fill="#17242c" opacity=".24" />

        {motorcycle && (
          <G>
          <Wheel id={id} cx={28} cy={58} rotation={rollingRotation} />
          <Wheel id={id} cx={83} cy={58} rotation={rollingRotation} />
          <Path d="M27 57 38 43l18-5 17 5 10 14H27Z" fill={modelSpec.trim} stroke={modelSpec.highlight} strokeWidth="1.4" strokeLinejoin="round" />
          <Path d="M42 41q8-10 21-9l11 8-4 8H46Z" fill={modelSpec.paint} stroke={modelSpec.highlight} strokeWidth="1.7" strokeLinejoin="round" />
          <Path d="M47 39q7-8 15-6l7 5-2 5H50Z" fill={`url(#${id}-body)`} />
          <Path d="M48 42q9-8 17-6" fill="none" stroke={riderColor} strokeWidth="2" strokeLinecap="round" />
          <Path d="m34 45 9-2-5 10H29Zm36-2 9 3 6 10H68Z" fill={modelSpec.highlight} stroke={modelSpec.trim} strokeWidth="1.3" />
          <Path d="M37 54h26m-22 5h26" stroke="#e2c88f" strokeWidth="1.2" opacity=".72" />
          <Path d="m73 43 7-6 7 1-2 5-7 1m-41-1-7-5-7 1" fill="none" stroke="#524942" strokeWidth="2.2" strokeLinecap="round" />
          <Path d="M28 58h55" stroke="#382f2e" strokeWidth="2" opacity=".7" />
          <Path d="m43 59-1 6m10-7 2 6" stroke="#c89f65" strokeWidth="2" strokeLinecap="round" />
          {modelId === "motorcycle-berry" && (
            <Path d="M45 45q14 7 29 0" fill="none" stroke={modelSpec.highlight} strokeWidth="2.6" strokeLinecap="round" />
          )}
          {modelId === "motorcycle-jungle" && (
            <Path d="m52 48 5 5m4-7 5 5m4-7 5 5" fill="none" stroke={modelSpec.highlight} strokeWidth="2" strokeLinecap="round" />
          )}
          </G>
        )}

        {!motorcycle && (
          <G>
          <Wheel id={id} cx={31} cy={59} radius={10.5} rotation={rollingRotation} />
          <Wheel id={id} cx={79} cy={59} radius={10.5} rotation={rollingRotation} />
          <Path d="M8 54q1-5 7-8l15-4 10-12q4-5 12-5h18q10 0 15 8l10 12 9 3q6 2 8 7l1 5q0 3-4 3H11q-4 0-4-4Z" fill={`url(#${id}-body)`} stroke="#775542" strokeWidth="2" strokeLinejoin="round" />
          <Path d="m35 41 6-9q3-4 10-4h7v14H34Zm27-13h6q7 0 11 7l6 7H62Z" fill={`url(#${id}-glass)`} stroke={modelSpec.highlight} strokeWidth="1.5" strokeLinejoin="round" />
          <Path d="m40 39 5-7q2-2 5-2h3l-5 10Zm27-9h2q5 0 8 5l3 4h-8Z" fill="#fff" opacity=".34" />
          <Path d="M60 28v16m-26 0h53" fill="none" stroke={modelSpec.trim} strokeWidth="1.6" strokeLinecap="round" />
          <Path d="M13 48q14-4 22-4m29 1q12 1 22-1m-72 8q15-3 28-1" fill="none" stroke={modelSpec.highlight} strokeWidth="1.35" opacity=".82" strokeLinecap="round" />
          <Path d="M48 44v12q13 3 27 0V44m-27 7h-9m41 0h-5" fill="none" stroke="#815b48" strokeWidth="1.25" opacity=".9" strokeLinejoin="round" />
          <Path d="M63 47h5m-2.5-1.4v2.8" stroke={modelSpec.highlight} strokeWidth="1.2" strokeLinecap="round" />
          <Path d="M20 58a11 11 0 0 1 22 0m26 0a11 11 0 0 1 22 0" fill="none" stroke={modelSpec.highlight} strokeWidth="1.7" />
          <Path d="M11 54h7l-1 4h-7m92-7 5 1 1 5h-7" fill={modelSpec.trim} stroke="#775542" strokeWidth="1" strokeLinejoin="round" />
          <Path d="M11 47q4-2 8-1l-1 4-7 1Zm92 1q3 1 5 3l-6 1-2-3Z" fill="#ffefc2" stroke={modelSpec.highlight} strokeWidth="1" strokeLinejoin="round" />
          <Path d="M17 58h5m81 0h5" stroke="#fff0bd" strokeWidth="1.4" strokeLinecap="round" opacity=".9" />
          {modelId === "car-sunrise" && (
            <G>
              <Path d="M82 46q8 1 14 4m-12 1q6 1 10 3" fill="none" stroke={modelSpec.trim} strokeWidth="1.5" strokeLinecap="round" />
              <Circle cx="30" cy="48" r="2.1" fill={modelSpec.trim} stroke={modelSpec.highlight} strokeWidth=".7" />
            </G>
          )}
          {modelId === "car-ice" && (
            <G>
              <Path d="m30 45 2 2.6-2 2.6-2-2.6Zm62 0 2 2.6-2 2.6-2-2.6Z" fill={modelSpec.highlight} stroke="#fff" strokeWidth=".55" />
              <Path d="M30 46.2v2.8m-1.2-1.4h2.4m61.6-1.4v2.8m-1.2-1.4H94" stroke="#fff" strokeWidth=".6" strokeLinecap="round" />
            </G>
          )}
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
