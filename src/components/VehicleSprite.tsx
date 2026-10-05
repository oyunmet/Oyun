import { useId } from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

type Props = {
  vehicle: "bike" | "motorcycle" | "car";
  riderColor: string;
  width: number;
  height: number;
};

export default function VehicleSprite({
  vehicle,
  riderColor,
  width,
  height,
}: Props) {
  const id = `saraya-vehicle-${useId().replace(/:/g, "")}`;
  const bike = vehicle === "bike";
  const motorcycle = vehicle === "motorcycle";

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 120 82"
      preserveAspectRatio="xMidYMid meet"
      accessible={false}
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

      <Ellipse cx="60" cy="73.5" rx={bike ? 43 : 48} ry="4.5" fill="#17242c" opacity=".35" />

      {bike && (
        <G>
          <Wheel id={id} cx={27} cy={58} />
          <Wheel id={id} cx={83} cy={58} />
          <Path d="m27 58 24-27 12 27H27l20-1 13 1 12-29 11 29" fill="none" stroke={`url(#${id}-metal)`} strokeWidth="3.2" strokeLinejoin="round" />
          <Path d="m27 58 24-27m12 27 12-29m-22 28-4 1 4 1" fill="none" stroke="#e7cc96" strokeWidth="1" opacity=".86" />
          <Circle cx="51" cy="58" r="4" fill={`url(#${id}-metal)`} stroke="#654d3f" strokeWidth="1.2" />
          <Path d="m51 58 7 4m-7-4-4-7m3-23h12" fill="none" stroke="#423d40" strokeWidth="3.2" strokeLinecap="round" />
          <Path d="m70 29 5-5 8 1m-35 0-5-4h-8" fill="none" stroke="#7e5e45" strokeWidth="2.4" strokeLinecap="round" />
          <Path d="m39 24 6 1m31 0 5-1" stroke="#f0d9a5" strokeWidth="1.1" strokeLinecap="round" />
          <Path d="m45 53 7 5m-1-4 8 5" stroke="#70543d" strokeWidth="1.5" />
          <Knight id={id} riderColor={riderColor} seated />
        </G>
      )}

      {motorcycle && (
        <G>
          <Wheel id={id} cx={28} cy={58} />
          <Wheel id={id} cx={83} cy={58} />
          <Path d="M27 57 38 43l18-5 17 5 10 14H27Z" fill="#71604d" stroke="#d0b17c" strokeWidth="1.4" strokeLinejoin="round" />
          <Path d="M42 41q8-10 21-9l11 8-4 8H46Z" fill="#a65a50" stroke="#e1bd83" strokeWidth="1.7" strokeLinejoin="round" />
          <Path d="M47 39q7-8 15-6l7 5-2 5H50Z" fill={`url(#${id}-body)`} />
          <Path d="m34 45 9-2-5 10H29Zm36-2 9 3 6 10H68Z" fill="#d8b775" stroke="#765743" strokeWidth="1.3" />
          <Path d="M37 54h26m-22 5h26" stroke="#e2c88f" strokeWidth="1.2" opacity=".72" />
          <Path d="m73 43 7-6 7 1-2 5-7 1m-41-1-7-5-7 1" fill="none" stroke="#524942" strokeWidth="2.2" strokeLinecap="round" />
          <Path d="M28 58h55" stroke="#382f2e" strokeWidth="2" opacity=".7" />
          <Path d="m43 59-1 6m10-7 2 6" stroke="#c89f65" strokeWidth="2" strokeLinecap="round" />
          <Knight id={id} riderColor={riderColor} seated />
        </G>
      )}

      {!bike && !motorcycle && (
        <G>
          <Wheel id={id} cx={31} cy={59} radius={10.5} />
          <Wheel id={id} cx={79} cy={59} radius={10.5} />
          <Path d="M11 54q2-7 10-9l13-14q5-5 15-5h22q9 0 14 8l10 10q9 3 12 10v8H10Z" fill={`url(#${id}-body)`} stroke="#e3c18a" strokeWidth="1.7" strokeLinejoin="round" />
          <Path d="m36 31q4-3 12-3h10v16H24Zm26-3h7q7 0 11 7l7 9H62Z" fill={`url(#${id}-glass)`} stroke="#f0d7a5" strokeWidth="1.3" strokeLinejoin="round" />
          <Path d="M60 28v17m-36 0h61" stroke="#694b42" strokeWidth="1.5" />
          <Path d="M13 51h13m71 0 8 2" stroke="#f1d192" strokeWidth="2.2" strokeLinecap="round" />
          <Path d="M15 58h6m82 0h6" stroke="#e9c477" strokeWidth="2.4" strokeLinecap="round" />
          <Path d="M48 45v12m27-12v12" stroke="#8b5947" strokeWidth="1.4" />
          <Knight id={id} riderColor={riderColor} seated car />
        </G>
      )}
    </Svg>
  );
}

function Wheel({
  id,
  cx,
  cy,
  radius = 14.5,
}: {
  id: string;
  cx: number;
  cy: number;
  radius?: number;
}) {
  return (
    <G>
      <Circle cx={cx + 1.2} cy={cy + 1.5} r={radius + 1.2} fill="#151e27" opacity=".56" />
      <Circle cx={cx} cy={cy} r={radius} fill={`url(#${id}-tire)`} stroke="#101923" strokeWidth="1.5" />
      <Circle cx={cx} cy={cy} r={radius - 3.3} fill="#b9a27b" stroke="#e7d2aa" strokeWidth="1.1" />
      <Circle cx={cx} cy={cy} r={radius - 5.3} fill="#46515a" stroke="#736d61" strokeWidth=".8" />
      <Circle cx={cx} cy={cy} r="2.2" fill="#e6cb91" />
      <Path d={`M${cx - radius + 2} ${cy - 5}a${radius} ${radius} 0 0 1 ${radius * 1.1} -${radius * 0.82}`} fill="none" stroke="#88909a" strokeWidth="1.4" strokeLinecap="round" opacity=".72" />
      <Path d={`M${cx - 1} ${cy - radius + 4}v${radius * 1.55}m-${radius * 0.7} -${radius * 0.75}h${radius * 1.4}`} stroke="#ded0ae" strokeWidth=".8" opacity=".72" />
    </G>
  );
}

function Knight({
  id,
  riderColor,
  seated,
  car = false,
}: {
  id: string;
  riderColor: string;
  seated: boolean;
  car?: boolean;
}) {
  if (car) {
    return (
      <G>
        <Path d="M47 35q0-10 9-10t9 10v7H47Z" fill={`url(#${id}-armor)`} stroke="#f0ddb6" strokeWidth="1.2" />
        <Path d="M50 34q0-8 6-8t6 8v3H50Z" fill="#344451" />
        <Circle cx="56" cy="21" r="8" fill={`url(#${id}-armor)`} stroke="#f1dfbc" strokeWidth="1.2" />
        <Path d="M49 20q0-8 7-9 8 1 8 9l-3-2H51Z" fill="#8a9da0" stroke="#ead9b7" strokeWidth="1.1" />
        <Path d="M51 19h10v4H51Z" fill="#35424a" />
        <Path d="M58 11q0-7 7-9-1 7-6 11Z" fill="#a95157" stroke="#e8bd7d" strokeWidth=".8" />
        <Circle cx="53" cy="21" r=".8" fill="#f5d99b" />
      </G>
    );
  }

  return (
    <G>
      <Path d="M49 31q0-8 8-8t9 9l2 12-19 2-5-7Z" fill={`url(#${id}-armor)`} stroke="#f0ddb6" strokeWidth="1.3" strokeLinejoin="round" />
      <Path d="M49 35q-6 1-9 7l-5 7m29-14 8 4 3 5" fill="none" stroke="#d4d5c7" strokeWidth="3.1" strokeLinecap="round" />
      <Circle cx="44" cy="49" r="2" fill="#e6c985" />
      <Circle cx="77" cy="45" r="2" fill="#e6c985" />
      <Path d="M50 44q8 5 18 0" fill="none" stroke="#e3c88e" strokeWidth="1.4" />
      <Path d="M52 46 48 55m15-9 6 9" fill="none" stroke="#735546" strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M46 55h8m12 0h8" stroke="#40383b" strokeWidth="3" strokeLinecap="round" />
      <Circle cx="57" cy="19" r="8.2" fill={`url(#${id}-armor)`} stroke="#f2e3c4" strokeWidth="1.3" />
      <Path d="M49 19q0-9 8-10 9 1 9 10l-3-2H52Z" fill="#91a2a0" stroke="#f0dfbe" strokeWidth="1.2" />
      <Path d="M52 18h11v4H52Z" fill="#38454c" />
      <Path d="M54 19h2m4 0h2" stroke="#efd79c" strokeWidth="1.1" strokeLinecap="round" />
      <Path d="M57 10q-1-7 6-10 0 7-4 11Z" fill="#a95357" stroke="#e9c27e" strokeWidth=".8" />
      <Path d="M67 40q5-5 9-4" fill="none" stroke="#e6ce9a" strokeWidth="1.2" strokeLinecap="round" />
      {seated ? <Path d="m75 36 7-4 2 2-7 5" fill="none" stroke="#e1d8bd" strokeWidth="1.4" /> : null}
    </G>
  );
}
