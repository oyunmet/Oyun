import { useId } from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { GROUND_Y, SCENE_HEIGHT, SCENE_WIDTH } from "../game/engine";
import type { Obstacle, Pickup } from "../game/engine";
import { getBackgroundSpec } from "../game/backgrounds";
import type { BackgroundId } from "../storage/profile";

export function GameTerrain({ scale, theme }: { scale: number; theme: BackgroundId }) {
  const id = `saraya-terrain-${useId().replace(/:/g, "")}`;
  const terrainHeight = SCENE_HEIGHT - GROUND_Y;
  const background = getBackgroundSpec(theme);

  return (
    <Svg
      width={SCENE_WIDTH * scale}
      height={terrainHeight * scale}
      viewBox={`0 0 ${SCENE_WIDTH} ${terrainHeight}`}
      preserveAspectRatio="none"
      style={{ position: "absolute", left: 0, top: GROUND_Y * scale, pointerEvents: "none" }}
    >
      <Defs>
        <LinearGradient id={`${id}-meadow`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={background.ground} />
          <Stop offset=".12" stopColor={background.nearHill} />
          <Stop offset=".36" stopColor={background.farHill} />
          <Stop offset="1" stopColor={background.farHill} />
        </LinearGradient>
        <LinearGradient id={`${id}-soil`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={background.nearHill} />
          <Stop offset=".4" stopColor={background.farHill} />
          <Stop offset="1" stopColor={background.farHill} />
        </LinearGradient>
        <LinearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={background.accent} />
          <Stop offset=".48" stopColor={background.ground} />
          <Stop offset="1" stopColor={background.nearHill} />
        </LinearGradient>
      </Defs>

      <Rect width={SCENE_WIDTH} height={terrainHeight} fill={`url(#${id}-soil)`} />
      <Path d="M0 0h360v14H0Z" fill={`url(#${id}-edge)`} />
      <Path d="M0 3q46-5 91 0t92 0 91 0 86 0v11H0Z" fill={`url(#${id}-meadow)`} />
      <Path d="M0 13q58-4 114 1t119-1 127 1" fill="none" stroke={background.farHill} strokeWidth="2" opacity=".8" />
      <Path d="M0 24q43-5 89 1t94-2 91 2 86-1" fill="none" stroke={background.accent} strokeWidth="1.2" opacity=".5" />
      <Path d="M0 43q56-6 110 2t108-2 142 2" fill="none" stroke="#fff" strokeWidth="2" opacity=".18" />

      <G fill="#203a36" opacity=".64">
        <Path d="m17 29 10-5 12 6-6 3-13-1Z" />
        <Path d="m83 48 8-4 12 3-4 4-13 1Z" />
        <Path d="m155 25 13-5 13 5-8 4-15-1Z" />
        <Path d="m229 46 12-5 16 4-7 5-18 1Z" />
        <Path d="m301 29 10-4 15 5-7 4-16-2Z" />
      </G>
      <G fill="none" stroke="#c1b68a" strokeLinecap="round" opacity=".5">
        <Path d="M53 20h19m75 22h27m75-17h22m43 24h20" strokeWidth="1.1" />
        <Path d="m38 49 4-2m124-27 4-2m84 30 4-2m53-24 4-2" strokeWidth="1.5" />
      </G>
      <Ellipse cx="181" cy="4" rx="180" ry="7" fill="#d6c592" opacity=".1" />
    </Svg>
  );
}

export function GameObstacle({
  obstacle,
  left,
  scale,
  elapsed,
}: {
  obstacle: Obstacle;
  left: number;
  scale: number;
  elapsed: number;
}) {
  const id = `saraya-obstacle-${useId().replace(/:/g, "")}`;
  const width = obstacle.width;
  if (obstacle.broken) return null;

  if (obstacle.kind === "pit") {
    const height = SCENE_HEIGHT - GROUND_Y + 8;
    return (
      <Svg
        width={width * scale}
        height={height * scale}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ position: "absolute", left, top: GROUND_Y * scale, pointerEvents: "none" }}
      >
        <Defs>
          <LinearGradient id={`${id}-shaft`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#111c29" />
            <Stop offset=".44" stopColor="#0c1520" />
            <Stop offset="1" stopColor="#321f28" />
          </LinearGradient>
        </Defs>
        <Path d={`M0 0h${width}l-7 ${height}H7Z`} fill="#182b30" />
        <Path d={`M4 0h${width - 8}v${height - 4}H4Z`} fill={`url(#${id}-shaft)`} />
        <Path d={`M3 1q${width / 2} 5 ${width - 3} 0`} fill="none" stroke="#d3a16c" strokeWidth="2" opacity=".9" />
        <Path d={`M${width / 2 - 6} ${height - 8}h12`} stroke="#a15c4e" strokeWidth="1.3" opacity=".54" />
        <Path d={`M7 5v6m${width - 14} -6v6`} stroke="#ecd29b" strokeWidth="1" opacity=".55" />
      </Svg>
    );
  }

  if (obstacle.kind === "spikes") {
    const height = 33;
    const count = Math.max(2, Math.floor(width / 12));
    const spikeWidth = width / count;
    return (
      <Svg
        width={width * scale}
        height={height * scale}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ position: "absolute", left, top: (GROUND_Y - height + 2) * scale, pointerEvents: "none" }}
      >
        <Defs>
          <LinearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#566169" />
            <Stop offset=".44" stopColor="#e3d6b6" />
            <Stop offset="1" stopColor="#72817f" />
          </LinearGradient>
        </Defs>
        <Path d={`M1 29h${width - 2}v3H1Z`} fill="#392f2e" />
        {Array.from({ length: count }, (_, index) => {
          const x = index * spikeWidth;
          return (
            <G key={index} transform={`translate(${x} 0)`}>
              <Path
                d={`M1 29  ${spikeWidth * 0.49} 2 ${spikeWidth - 1} 29Z`}
                fill={`url(#${id}-steel)`}
                stroke="#4e4945"
                strokeWidth="1"
                strokeLinejoin="round"
              />
              <Path d={`M${spikeWidth * 0.48} 4 2 28`} stroke="#fff1d0" strokeWidth="1.2" opacity=".86" />
              <Path d={`M${spikeWidth * 0.52} 7 ${spikeWidth - 2} 27`} stroke="#59665f" strokeWidth="1" opacity=".7" />
              <Path d={`M3 29h${spikeWidth - 4}`} stroke="#d1b87d" strokeWidth="1" opacity=".8" />
            </G>
          );
        })}
      </Svg>
    );
  }

  if (obstacle.kind === "crate") {
    const height = 39;
    return (
      <Svg
        width={(width + 7) * scale}
        height={height * scale}
        viewBox={`0 0 ${width + 7} ${height}`}
        preserveAspectRatio="none"
        style={{ position: "absolute", left, top: (GROUND_Y - 34) * scale, pointerEvents: "none" }}
      >
        <Defs>
          <LinearGradient id={`${id}-wood`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#d2ad73" />
            <Stop offset=".42" stopColor="#956c48" />
            <Stop offset="1" stopColor="#5c4638" />
          </LinearGradient>
          <LinearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#e0c38b" />
            <Stop offset="1" stopColor="#8b684a" />
          </LinearGradient>
        </Defs>
        <Path d={`M2 8 9 2h${width - 1}l-8 7Z`} fill={`url(#${id}-top)`} stroke="#4f4035" strokeWidth="1.2" />
        <Path d={`M${width} 9  ${width + 7} 5v28l-7 4Z`} fill="#59483c" stroke="#403b35" strokeWidth="1.3" />
        <Path d={`M1 8h${width - 1}v29H1Z`} fill={`url(#${id}-wood)`} stroke="#4e4035" strokeWidth="1.5" />
        <Path d={`m6 12 ${width - 12} 20m0-20L6 32`} fill="none" stroke="#e0bd81" strokeWidth="2.5" opacity=".92" />
        <Path d={`M4 14h${width - 7}M4 32h${width - 7}`} stroke="#593f32" strokeWidth="1.4" opacity=".78" />
        <Path d={`M5 9v28m${width - 7}-29v29`} stroke="#e2c58e" strokeWidth="1.2" opacity=".68" />
        <Circle cx="5" cy="11" r="1.3" fill="#f4dfad" />
        <Circle cx={width - 4} cy="35" r="1.3" fill="#d8bc86" />
      </Svg>
    );
  }

  if (obstacle.kind === "platform") {
    const height = 19;
    const top = obstacle.y ?? GROUND_Y - 56;
    return (
      <Svg
        width={width * scale}
        height={height * scale}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ position: "absolute", left, top: top * scale, opacity: obstacle.breakingFor ? 0.65 : 1, pointerEvents: "none" }}
      >
        <Defs>
          <LinearGradient id={`${id}-platform`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#d5bc83" />
            <Stop offset=".3" stopColor="#8c7855" />
            <Stop offset="1" stopColor="#51463a" />
          </LinearGradient>
        </Defs>
        <Path d={`M1 2h${width - 3}l2 5H3Z`} fill="#e0cc97" stroke="#534637" strokeWidth="1" />
        <Path d={`M3 7h${width - 1}v9H3Z`} fill={`url(#${id}-platform)`} stroke="#4d4238" strokeWidth="1.2" />
        <Path d={`M5 11h${width - 10}`} stroke="#564837" strokeWidth="1" opacity=".8" />
        <Path d={`M6 15h${width - 12}`} stroke="#d3b879" strokeWidth=".8" opacity=".62" />
        <Path d={`M8 16v2m${width - 16}-2v2`} stroke="#282f2d" strokeWidth="2" />
      </Svg>
    );
  }

  if (obstacle.kind === "monster") {
    const height = 48;
    const walk = Math.sin(elapsed * 8 + (obstacle.patrolPhase ?? obstacle.x)) * 3;
    return (
      <Svg
        width={(width + 14) * scale}
        height={height * scale}
        viewBox={`0 0 ${width + 14} ${height}`}
        preserveAspectRatio="none"
        style={{ position: "absolute", left: left - 7 * scale, top: (GROUND_Y - height + 2) * scale, pointerEvents: "none" }}
      >
        <Defs>
          <LinearGradient id={`${id}-monster`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#f4b277" />
            <Stop offset=".45" stopColor="#bd5c69" />
            <Stop offset="1" stopColor="#533e65" />
          </LinearGradient>
          <LinearGradient id={`${id}-horn`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#fff0c9" />
            <Stop offset="1" stopColor="#b48a6b" />
          </LinearGradient>
        </Defs>
        <Ellipse cx={(width + 14) / 2} cy="46" rx="23" ry="2" fill="#14232d" opacity=".32" />
        <Path d={`M${width / 2 - 5} 35l-3 10m17-10 4 10`} stroke="#514156" strokeWidth="5" strokeLinecap="round" />
        <Path d={`M${width / 2 - 5} 36l${walk} 8m12-8 ${-walk} 8`} stroke="#e6b17d" strokeWidth="3" strokeLinecap="round" />
        <Ellipse cx={(width + 14) / 2} cy="29" rx="20" ry="17" fill={`url(#${id}-monster)`} stroke="#694859" strokeWidth="1.5" />
        <Path d={`M${width / 2 - 9} 18  ${width / 2 - 15} 5l12 9m17 4 4-13 7 14`} fill={`url(#${id}-horn)`} stroke="#7b5261" strokeWidth="1.2" strokeLinejoin="round" />
        <Ellipse cx={(width + 14) / 2 + 6} cy="27" rx="8" ry="7" fill="#f2d8b8" />
        <Circle cx={(width + 14) / 2 + 3} cy="26" r="2.2" fill="#f7d768" />
        <Circle cx={(width + 14) / 2 + 10} cy="26" r="2.2" fill="#f7d768" />
        <Path d={`M${width / 2 + 1} 32q5 4 11 0`} fill="none" stroke="#503b4e" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }

  const swing = Math.sin(elapsed * 4 + obstacle.x) * 30;
  const axeWidth = 52;
  const axeHeight = 84;
  return (
    <Svg
      width={axeWidth * scale}
      height={axeHeight * scale}
      viewBox={`0 0 ${axeWidth} ${axeHeight}`}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        left: left + (width * scale) / 2 - (axeWidth * scale) / 2,
        top: (GROUND_Y - 121) * scale,
        pointerEvents: "none",
      }}
    >
      <Defs>
        <LinearGradient id={`${id}-blade`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#fff0cc" />
          <Stop offset=".4" stopColor="#bdc9bf" />
          <Stop offset="1" stopColor="#657778" />
        </LinearGradient>
        <LinearGradient id={`${id}-haft`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#d9b479" />
          <Stop offset="1" stopColor="#624633" />
        </LinearGradient>
      </Defs>
      <Path d="M26 0v39" stroke="#58656a" strokeWidth="3" opacity=".65" />
      <Path d="M26 0v39" stroke="#e4d3ab" strokeWidth="1" opacity=".8" />
      <G transform={`translate(26 45) rotate(${swing})`}>
        <Path d="M0-6v38" stroke={`url(#${id}-haft)`} strokeWidth="5" strokeLinecap="round" />
        <Path d="M-3 2h6m-6 7h6m-6 7h6" stroke="#71533a" strokeWidth="1.5" opacity=".8" />
        <Path d="M0-2q12-1 21 10l-4 14Q7 21 0 16Z" fill={`url(#${id}-blade)`} stroke="#536369" strokeWidth="1.8" strokeLinejoin="round" />
        <Path d="M3 1q9 3 15 9" fill="none" stroke="#fff8e3" strokeWidth="1.4" opacity=".9" />
        <Circle cx="0" cy="-2" r="3.5" fill="#7c5d3e" stroke="#e5c88c" strokeWidth="1" />
      </G>
    </Svg>
  );
}

export function GamePickup({
  pickup,
  centerX,
  scale,
  elapsed,
}: {
  pickup: Pickup;
  centerX: number;
  scale: number;
  elapsed: number;
}) {
  const id = `saraya-pickup-${useId().replace(/:/g, "")}`;
  const size = 34;
  const bob = Math.sin(elapsed * 2.8 + pickup.x) * 1.4;
  const top = (pickup.y + bob - size / 2) * scale;

  return (
    <Svg
      width={size * scale}
      height={size * scale}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: "absolute", left: centerX - (size / 2) * scale, top, pointerEvents: "none" }}
    >
      <Defs>
        <LinearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#fff0af" />
          <Stop offset=".38" stopColor="#edbf59" />
          <Stop offset="1" stopColor="#a77336" />
        </LinearGradient>
        <LinearGradient id={`${id}-gem`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#e7fff2" />
          <Stop offset=".38" stopColor="#9bddd1" />
          <Stop offset="1" stopColor="#4d8590" />
        </LinearGradient>
        <LinearGradient id={`${id}-heart`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffc0a1" />
          <Stop offset="1" stopColor="#bb5a61" />
        </LinearGradient>
      </Defs>
      <Circle cx="17" cy="17" r="15" fill={pickup.kind === "gold" ? "#ffd77e" : pickup.kind === "gem" ? "#a9e9da" : "#ff9b92"} opacity=".12" />
      {pickup.kind === "gold" ? (
        <G>
          <Ellipse cx="18" cy="19" rx="7.5" ry="10" fill="#684628" opacity=".55" />
          <Ellipse cx="16.5" cy="17" rx="7.5" ry="10" fill={`url(#${id}-gold)`} stroke="#fff1bf" strokeWidth="1.5" />
          <Ellipse cx="16.5" cy="17" rx="4" ry="6.5" fill="none" stroke="#fff2c7" strokeWidth="1" opacity=".92" />
          <Path d="M16.5 12v10m-2.5-3 2.5 2 2.5-2" fill="none" stroke="#9b6a32" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M13 12h4" stroke="#fff9dc" strokeWidth="1.2" strokeLinecap="round" />
        </G>
      ) : pickup.kind === "gem" ? (
        <G>
          <Path d="m17 5 10 6-3 13-7 5-7-5-3-13Z" fill={`url(#${id}-gem)`} stroke="#e4fff2" strokeWidth="1.5" strokeLinejoin="round" />
          <Path d="M7 11h20M12 11l5 18 5-18m-9-5 4 5 4-5" fill="none" stroke="#f2fff2" strokeWidth="1.2" opacity=".86" />
          <Path d="m12 12 5 15 1-15Z" fill="#efffec" opacity=".26" />
        </G>
      ) : (
        <G>
          <Path d="M17 28C13 24 6 19 6 13a5.5 5.5 0 0 1 10-3l1 1 1-1a5.5 5.5 0 0 1 10 3c0 6-7 11-11 15Z" fill={`url(#${id}-heart)`} stroke="#ffe0bd" strokeWidth="1.4" />
          <Path d="M11 14q2-3 5-1" fill="none" stroke="#fff0d6" strokeWidth="1.4" strokeLinecap="round" opacity=".9" />
        </G>
      )}
    </Svg>
  );
}
