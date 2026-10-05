import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";

export function CastleSprite({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.82} viewBox="0 0 90 74" accessible={false}>
      <G stroke="#e1c89e" strokeWidth="1.5">
        <Rect x="12" y="25" width="66" height="43" rx="3" fill="#c5ac8d" />
        <Rect x="4" y="17" width="22" height="51" rx="2" fill="#ddc9a6" />
        <Rect x="64" y="11" width="22" height="57" rx="2" fill="#bda48d" />
        <Path d="M1 19 15 1l14 18Z" fill="#9b4e58" />
        <Path d="M61 13 75 0l14 13Z" fill="#a85a5b" />
        <Path d="M29 27 45 7l16 20Z" fill="#714653" />
        <Rect x="38" y="45" width="14" height="23" rx="7" fill="#4b3949" />
        <Rect x="9" y="33" width="6" height="11" rx="3" fill="#f4dca6" stroke="none" />
        <Rect x="72" y="29" width="6" height="11" rx="3" fill="#f4dca6" stroke="none" />
        <Rect x="29" y="35" width="6" height="9" rx="3" fill="#f4dca6" stroke="none" />
        <Rect x="55" y="35" width="6" height="9" rx="3" fill="#f4dca6" stroke="none" />
      </G>
      <Path d="M15 1v-8m60 7v-8M45 7v-8" stroke="#e6d3b1" strokeWidth="1.5" />
      <Path d="m15-7 8 3-8 3Zm60 0 8 3-8 3ZM45-8l8 3-8 3Z" fill="#e3bd70" />
    </Svg>
  );
}

export function PrincessSprite({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.35} viewBox="0 0 40 54" accessible={false}>
      <Ellipse cx="20" cy="51" rx="12" ry="2.5" fill="#111d28" opacity=".45" />
      <Path d="M8 28q0-12 12-12t12 12l5 20H3Z" fill="#ba6d86" stroke="#f1d1a0" strokeWidth="1.4" />
      <Path d="M10 27q-1-13 10-17 12 4 10 17l-3-5H13Z" fill="#704254" />
      <Circle cx="20" cy="15" r="7" fill="#f0c7a7" />
      <Path d="M14 13 11 22m15-9 4 8" stroke="#704254" strokeWidth="3" strokeLinecap="round" />
      <Path d="m15 7 5-6 5 6m-5-4v5" fill="#e3bc6c" stroke="#f5db9f" strokeWidth="1.2" strokeLinejoin="round" />
      <Path d="M12 34h16" stroke="#ecc989" strokeWidth="1.6" opacity=".85" />
      <Circle cx="17.5" cy="15" r="1" fill="#493844" />
      <Circle cx="22.5" cy="15" r="1" fill="#493844" />
    </Svg>
  );
}

export function HorseSprite({ size }: { size: number }) {
  return (
    <Svg width={size * 1.35} height={size} viewBox="0 0 108 72" accessible={false}>
      <G fill="#986c50" stroke="#e1c394" strokeWidth="1.5" strokeLinejoin="round">
        <Path d="M17 37q7-19 32-18l19 8 14-8 5 5-8 14-12 4-5 18h-7l-1-17-18 2-6 15h-7l1-18-12 2Z" />
        <Path d="M67 29 76 14l13-5 7 4-2 7-12 4-8 12Z" />
        <Path d="M91 12 98 9l4 5-7 5m-30 31 2 12m-30-9-2 10" fill="none" stroke="#d0af7c" strokeWidth="4" strokeLinecap="round" />
        <Path d="M18 35Q5 33 7 20q7 7 13 3" fill="none" stroke="#684b45" strokeWidth="4" strokeLinecap="round" />
        <Path d="M69 26q7-16 19-18" fill="none" stroke="#513c3d" strokeWidth="5" strokeLinecap="round" />
        <Circle cx="91" cy="17" r="1.3" fill="#302e36" stroke="none" />
      </G>
      <Path d="M83 23q9 7 16 2" fill="none" stroke="#e2ca9d" strokeWidth="1.5" />
    </Svg>
  );
}