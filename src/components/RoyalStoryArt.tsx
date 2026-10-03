import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

type Props = {
  knightColor: string;
};

export default function RoyalStoryArt({ knightColor }: Props) {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 390 248"
      preserveAspectRatio="xMidYMid slice"
      accessibilityLabel="Ay ışığında saraya doğru yürüyen küçük şövalye"
    >
      <Defs>
        <LinearGradient id="story-sky" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#172a3c" />
          <Stop offset=".56" stopColor="#304456" />
          <Stop offset="1" stopColor="#8b6d55" />
        </LinearGradient>
        <LinearGradient id="story-ground" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#63705d" />
          <Stop offset="1" stopColor="#283d39" />
        </LinearGradient>
        <RadialGradient id="story-halo" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor="#e9c98d" stopOpacity=".42" />
          <Stop offset="1" stopColor="#e9c98d" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="390" height="248" fill="url(#story-sky)" />
      <Circle cx="288" cy="54" r="73" fill="url(#story-halo)" />
      <Circle cx="288" cy="54" r="22" fill="#e7d6a8" />
      <Circle cx="298" cy="48" r="20" fill="#344454" />
      <G fill="#e6d3a2" opacity=".8">
        <Circle cx="38" cy="36" r="1.6" />
        <Circle cx="85" cy="58" r="1.2" />
        <Circle cx="142" cy="31" r="1.4" />
        <Circle cx="199" cy="72" r="1.2" />
        <Circle cx="347" cy="31" r="1.6" />
        <Circle cx="361" cy="96" r="1.1" />
        <Circle cx="112" cy="94" r="1.1" />
        <Circle cx="252" cy="24" r="1.3" />
      </G>
      <G fill="none" stroke="#e7c88e" strokeWidth="1.4" opacity=".8">
        <Path d="M58 83v10m-5-5h10M204 54v8m-4-4h8M337 70v7m-3.5-3.5h7" />
      </G>
      <Path d="M0 154 Q50 129 104 150T218 145T390 140V248H0Z" fill="#293d43" opacity=".7" />
      <Path d="M0 179 Q81 147 155 176T294 166T390 176V248H0Z" fill="#344944" opacity=".92" />
      <G fill="#202f39" stroke="#d0b079" strokeOpacity=".38" strokeWidth="1.3">
        <Path d="M228 161V91h23V73h21v18h18v70Z" />
        <Path d="M221 98 239 65l19 33Zm38-12 22-34 21 34Zm21 13 20-29 19 29Z" />
        <Path d="M237 62v-8m20 20V62m22-12v-9m21 41v-8" />
        <Path d="M243 117h8v13h-8zm25 0h8v13h-8zm23 0h8v13h-8z" fill="#ddc287" fillOpacity=".75" stroke="none" />
        <Path d="M263 161v-23a10 10 0 0 1 20 0v23Z" />
      </G>
      <Path d="M0 207 Q55 186 118 202T232 194T390 208V248H0Z" fill="url(#story-ground)" />
      <Path d="M0 206 Q55 185 118 201T232 193T390 207" fill="none" stroke="#9f9d70" strokeOpacity=".48" strokeWidth="2" />
      <G fill="#bcad7c" opacity=".5">
        <Path d="M41 205q-4-14-1-23 7 10 6 22m7 1q0-12 7-19 1 12-2 20" />
        <Path d="M340 203q-3-11 2-19 5 10 2 19m7 1q2-10 9-14-2 11-7 16" />
      </G>
      <Path d="M0 229 Q58 219 120 228T246 222T390 230" stroke="#dfbd7e" strokeOpacity=".22" fill="none" />
      <G transform="translate(112 165)">
        <Ellipse cx="19" cy="48" rx="22" ry="4" fill="#1d302f" opacity=".65" />
        <Path d="M12 24h19l5 21H7Z" fill={knightColor} stroke="#d8c59b" strokeWidth="1.5" />
        <Path d="M15 15h16v14H15Z" fill={knightColor} stroke="#c4d2cf" strokeWidth="1.5" />
        <Path d="M12 15q0-14 11-14t11 14Z" fill="#8799a0" stroke="#e1d5b7" strokeWidth="1.5" />
        <Path d="M17 12h13v5H17Z" fill="#293947" />
        <Path d="M20 14h2m5 0h2" stroke="#eddcae" strokeWidth="1.7" strokeLinecap="round" />
        <Path d="M9 46h11v4H7m15-4h11v4H22" fill="#342e2b" />
        <Path d="M38 20l10 18" stroke="#d3d7c8" strokeWidth="2" />
        <Path d="m47 36 4 7-3-1-2 3-2-8Z" fill="#d3d7c8" />
        <Path d="M21 1q-1-10 8-14-1 9-8 14Z" fill="#a2585e" />
      </G>
    </Svg>
  );
}