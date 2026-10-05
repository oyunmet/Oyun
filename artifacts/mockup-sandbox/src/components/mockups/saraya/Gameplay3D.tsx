import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  createGameState,
  GROUND_Y,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  stepGame,
} from "../../../../src/game/engine";
import type {
  EngineUpgrades,
  GameInput,
  GameState,
  Obstacle,
  Pickup,
} from "../../../../src/game/engine";
import type { UpgradeKey } from "../../../../src/storage/profile";
import "./Gameplay3D.css";

type Profile = {
  gold: number;
  gems: number;
  unlockedLevel: number;
  upgrades: Record<UpgradeKey, number>;
  skin: number;
  skinsOwned: number[];
  soundOn: boolean;
};

type Rewards = { gold: number; gems: number };
type RunStatus = "playing" | "complete" | "gameover" | "exit" | "left";
type MoveKey = "left" | "right";

const PROFILE_KEY = "saraya-yolculuk.profile.v1";
const DEFAULT_PROFILE: Profile = {
  gold: 90,
  gems: 3,
  unlockedLevel: 1,
  upgrades: { speed: 0, jump: 0, maxHp: 0, armor: 0, doubleJump: 0, magnet: 0, dash: 0 },
  skin: 0,
  skinsOwned: [0],
  soundOn: true,
};
const SKINS = ["#3b82f6", "#ef5b59", "#55bd87", "#d28d45", "#b57be0", "#ec7eaa"];

function readProfile(): Profile {
  try {
    const saved = window.localStorage.getItem(PROFILE_KEY);
    if (!saved) return DEFAULT_PROFILE;
    const parsed = JSON.parse(saved) as Partial<Profile>;
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      unlockedLevel: Math.max(1, Number(parsed.unlockedLevel) || 1),
      upgrades: { ...DEFAULT_PROFILE.upgrades, ...(parsed.upgrades ?? {}) },
      skinsOwned: Array.from(new Set([0, ...(parsed.skinsOwned ?? [])])),
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function copyState(state: GameState): GameState {
  return {
    ...state,
    player: { ...state.player },
    obstacles: state.obstacles.map((obstacle) => ({ ...obstacle })),
    pickups: state.pickups.map((pickup) => ({ ...pickup })),
  };
}

function Icon({ name, size = 17 }: { name: "back" | "coin" | "gem" | "jump" | "bolt" | "lock"; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (name === "back") return <svg {...common}><path d="m14.5 5-7 7 7 7" /><path d="M8 12h11" /></svg>;
  if (name === "coin") return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="m12 7 1.3 3.7L17 12l-3.7 1.3L12 17l-1.3-3.7L7 12l3.7-1.3L12 7Z" /></svg>;
  if (name === "gem") return <svg {...common}><path d="m12 3 7 4-7 14L5 7l7-4Z" /><path d="M5 7h14M9 7l3 14 3-14m-5-4 2 4 2-4" /></svg>;
  if (name === "jump") return <svg {...common}><path d="M12 20V5" /><path d="m6 11 6-6 6 6" /><path d="M5 20h14" /></svg>;
  if (name === "bolt") return <svg {...common}><path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" /></svg>;
  return <svg {...common}><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" /></svg>;
}

function HeartGlyph({ empty = false }: { empty?: boolean }) {
  return (
    <svg className={`s3d-heart${empty ? " is-empty" : ""}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21.1 3.6 13A5.3 5.3 0 0 1 11.2 5.6L12 6.4l.8-.8a5.3 5.3 0 0 1 7.6 7.4L12 21.1Z" />
    </svg>
  );
}

function GameplayScene({ state, cameraX, skin, reduceMotion, sceneHeight }: {
  state: GameState;
  cameraX: number;
  skin: number;
  reduceMotion: boolean;
  sceneHeight: number;
}) {
  const worldLeft = cameraX - 70;
  const worldRight = cameraX + SCENE_WIDTH + 210;
  const obstacles = state.obstacles.filter((item) => item.x + item.width > worldLeft && item.x < worldRight);
  const pickups = state.pickups.filter((item) => !item.collected && item.x > worldLeft && item.x < worldRight);
  const player = state.player;
  const playerTransform = `translate(${player.x - 13}, ${player.y - 10})`;
  const sceneOffset = Math.max(0, (sceneHeight - SCENE_HEIGHT) / 2);
  const localBottom = sceneHeight - sceneOffset;

  return (
    <svg className="s3d-scene" viewBox={`0 0 500 ${sceneHeight}`} preserveAspectRatio="none" role="img" aria-label="Şövalye, altınlar ve tuzaklarla dolu saray yolunda ilerliyor">
      <defs>
        <linearGradient id="s3d-sky" x1="0" y1="0" x2=".2" y2="1">
          <stop stopColor="#24384a" />
          <stop offset=".43" stopColor="#657178" />
          <stop offset=".75" stopColor="#c18d6e" />
          <stop offset="1" stopColor="#d4aa79" />
        </linearGradient>
        <linearGradient id="s3d-earth" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#75836c" />
          <stop offset=".3" stopColor="#576c5c" />
          <stop offset="1" stopColor="#293f3d" />
        </linearGradient>
        <linearGradient id="s3d-earth-edge" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#d1bb84" />
          <stop offset=".18" stopColor="#9c956d" />
          <stop offset="1" stopColor="#344943" />
        </linearGradient>
        <linearGradient id="s3d-armor" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#eef0df" />
          <stop offset=".38" stopColor="#9eaca9" />
          <stop offset="1" stopColor="#5e7478" />
        </linearGradient>
        <linearGradient id="s3d-wood" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#b38d5c" />
          <stop offset="1" stopColor="#604b3a" />
        </linearGradient>
        <linearGradient id="s3d-axe" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#eceddb" />
          <stop offset=".53" stopColor="#aab9b5" />
          <stop offset="1" stopColor="#64787c" />
        </linearGradient>
        <radialGradient id="s3d-moon-halo">
          <stop stopColor="#f0d8a2" stopOpacity=".38" />
          <stop offset=".48" stopColor="#e3c393" stopOpacity=".14" />
          <stop offset="1" stopColor="#e3c393" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="s3d-pit" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#172b35" />
          <stop offset=".55" stopColor="#101d28" />
          <stop offset="1" stopColor="#563f3a" />
        </linearGradient>
        <filter id="s3d-soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <clipPath id="s3d-ground-clip">
          <rect y={GROUND_Y} width="500" height={sceneHeight - GROUND_Y} />
        </clipPath>
      </defs>

      <rect width="500" height={sceneHeight} fill="url(#s3d-sky)" />
      <g transform={`translate(0 ${sceneOffset})`}>
      <path d="M0 118h500v94H0Z" fill="#e7c095" opacity=".08" />
      <circle cx="409" cy="48" r="76" fill="url(#s3d-moon-halo)" />
      <circle cx="409" cy="48" r="20" fill="#f0d8a2" opacity=".92" />
      <circle cx="418" cy="41" r="18" fill="#8a7c73" opacity=".7" />
      <g fill="#f2e0bc" opacity=".7">
        <circle cx="34" cy="33" r="1.2" /><circle cx="77" cy="61" r=".9" />
        <circle cx="128" cy="29" r="1.1" /><circle cx="191" cy="61" r="1" />
        <circle cx="247" cy="24" r="1.3" /><circle cx="343" cy="82" r=".9" />
        <circle cx="475" cy="28" r="1.1" /><circle cx="308" cy="51" r=".8" />
      </g>
      <g fill="none" stroke="#f1d9a8" strokeWidth="1" opacity=".52">
        <path d="M58 84v6m-3-3h6M155 41v5m-2.5-2.5h5M281 76v6m-3-3h6M466 94v5m-2.5-2.5h5" />
      </g>

      <g transform={`translate(${-(cameraX * .075) % 165} 0)`}>
        <path d="M-220 163q37-34 77-5 34-39 75-5 34-29 71 1 38-36 74-3 39-32 75 3 40-37 77-2 38-28 77 0 36-27 75 4v67h-681Z" fill="#5b6865" opacity=".56" />
        <path d="M-150 151q42-30 78-1 36-35 72-2 42-36 77-3 40-33 76-1 42-28 75 3 43-29 79 4" fill="none" stroke="#d3ad7e" strokeWidth="1.2" opacity=".26" />
      </g>

      <g transform={`translate(${-(cameraX * .15) % 230} 0)`}>
        <path d="M-240 186q41-43 82-7 43-54 82-5 42-43 83-3 41-44 83-1 42-39 82 3 43-35 85 3 38-29 77 6v54h-574Z" fill="#3b504e" opacity=".82" />
        <path d="M-130 178q38-29 74-1 39-34 75-1 39-36 76-3 38-31 74-1 43-30 78 4 37-24 74 7" fill="none" stroke="#bca47b" strokeWidth="1.3" opacity=".33" />
        <Tree x={20} y={170} />
        <Tree x={144} y={166} />
        <Tree x={277} y={171} />
        <Tree x={392} y={164} />
        <Tree x={488} y={173} />
      </g>

      <g transform={`translate(${-(cameraX * .21) % 260} 0)`} opacity=".9">
        <path d="M-250 202q46-44 89-1 41-37 81-1 44-40 85 1 43-40 85 0 44-34 84 3 45-35 86 0 46-34 85 4v62h-595Z" fill="#304740" />
        <path d="M-187 203q41-28 79-1m12 0q41-32 78-1m10 1q39-31 76-2m14 2q42-32 79-1m7 1q40-34 78-1" fill="none" stroke="#a49a70" strokeWidth="1.4" opacity=".43" />
      </g>

      <g transform={`translate(${-(cameraX * .17) + 394} 0)`} opacity=".9">
        <path d="M0 143V91h15V75h17v16h14v52Z" fill="#2c4045" stroke="#b49a6b" strokeOpacity=".4" strokeWidth="1.2" />
        <path d="m-4 92 12-24 12 24Zm27-16 13-26 14 26Zm16 17 11-20 11 20Z" fill="#37474a" stroke="#c3a170" strokeOpacity=".38" strokeWidth="1" />
        <path d="M11 143v-20a7 7 0 0 1 14 0v20m-27-31h4v8h-4zm18 0h4v8h-4zm18 0h4v8h-4z" fill="#e0c68e" opacity=".78" />
        <path d="M8 68v-7m31-10v-8m20 41v-6" stroke="#c3ab76" strokeWidth="1.3" />
      </g>

      <path d={`M0 ${GROUND_Y}q67-6 126 0t123 0 126 0 125 0v${localBottom - GROUND_Y}H0Z`} fill="url(#s3d-earth)" />
      <path d={`M0 ${GROUND_Y}q67-6 126 0t123 0 126 0 125 0`} fill="none" stroke="#d0bb84" strokeWidth="4" opacity=".78" />
      <path d={`M0 ${GROUND_Y + 8}q69-5 126 0t123 0 126 0 125 0`} fill="none" stroke="#9e9b72" strokeWidth="1.4" opacity=".5" />
      <g clipPath="url(#s3d-ground-clip)" transform={`translate(${-cameraX % 92} 0)`} opacity=".48">
        <path d="M-30 224h54l9 8H-21Zm87 15h31l8 7H52Zm74-30h39l10 8h-43Zm94 18h50l10 8h-49Zm89-20h44l10 8h-48Zm78 32h45l10 8h-49Z" fill="#233d39" />
        <path d="M4 251h42m83-16h29m88 22h49m87-18h33m37 12h28" fill="none" stroke="#ac9c71" strokeWidth="1.2" opacity=".5" />
      </g>
      {sceneHeight > SCENE_HEIGHT && (
        <g opacity=".45">
          <path d={`M0 ${localBottom - 68}q63-25 121 0t125-2 126-1 128 0v${sceneHeight - (localBottom - 68)}H0Z`} fill="#233b39" />
          <path d={`M0 ${localBottom - 70}q63-25 121 0t125-2 126-1 128 0`} fill="none" stroke="#9d9a71" strokeWidth="1.5" />
          <path d={`M28 ${localBottom - 25}l15-10 12 10m53 8 18-11 15 11m104-11 14-9 15 9m54 10 17-12 15 12m55-8 14-9 12 9`} fill="none" stroke="#a39b76" strokeWidth="1.2" opacity=".54" />
          <path d={`M0 ${localBottom - 8}q84-10 157 1t166-2 177 0v25H0Z`} fill="#1e3434" opacity=".62" />
        </g>
      )}
      <path d={`M0 ${localBottom - 16}q76-12 147-2t130-3 120 2 103-4v${sceneHeight - (localBottom - 16)}H0Z`} fill="#243b38" opacity=".42" />

      <g className="s3d-world-layer" transform={`translate(${-cameraX} 0)`}>
        <g transform={`translate(${state.length - 116}, 123)`}>
          <CastleLandmark />
        </g>
        {obstacles.map((obstacle) => <ObstacleArt key={obstacle.id} obstacle={obstacle} elapsed={state.elapsed} sceneHeight={localBottom} />)}
        {pickups.map((pickup) => <PickupArt key={pickup.id} pickup={pickup} elapsed={reduceMotion ? 0 : state.elapsed} />)}
        <g
          transform={playerTransform}
          opacity={state.invulnerable > 0 ? .64 : 1}
          style={state.invulnerable > 0 ? { filter: "saturate(1.35)" } : undefined}
        >
          <g transform={player.direction < 0 ? "translate(58 0) scale(-1 1)" : undefined}>
            <KnightBike skin={SKINS[skin] ?? SKINS[0]} elapsed={reduceMotion ? 0 : state.elapsed} />
          </g>
        </g>
      </g>
      <path d={`M0 ${GROUND_Y + 1}h500`} fill="none" stroke="#e2c98f" strokeWidth="1" opacity=".3" />
      </g>
    </svg>
  );
}

function Tree({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 16v-13" stroke="#5d5147" strokeWidth="2" />
      <path d="M-10 9Q-9-2 0-11 10-1 10 9L0 5Z" fill="#304946" stroke="#9d9a73" strokeOpacity=".42" strokeWidth=".8" />
      <path d="M-6 1q6-10 12 0" fill="none" stroke="#b7a57a" strokeWidth=".8" opacity=".5" />
    </g>
  );
}

function CastleLandmark() {
  return (
    <g opacity=".98">
      <ellipse cx="61" cy="78" rx="70" ry="14" fill="#d7b784" opacity=".1" filter="url(#s3d-soft-shadow)" />
      <path d="M7 73V34h16V17h18v17h15v39Zm67 0V26h15V8h20v18h17v47Z" fill="#35484a" stroke="#c5a976" strokeOpacity=".45" strokeWidth="1.2" />
      <path d="M1 35 15 9l14 26Zm50-1L68 1l17 33Zm29-8 15-26 16 26Zm33 8 14-22 14 22Z" fill="#455256" stroke="#c3a271" strokeOpacity=".5" strokeWidth="1.1" />
      <path d="M43 73V55a11 11 0 0 1 22 0v18Z" fill="#202f39" stroke="#c8ad79" strokeOpacity=".55" />
      <path d="M16 43h6v12h-6zm36 0h6v12h-6zm29-6h6v12h-6zm36 0h6v12h-6z" fill="#e5ca91" opacity=".76" />
      <path d="M15 8v-8m53 1v-9m27-1v-7m45 20v-8" stroke="#d2b77e" strokeWidth="1.2" />
      <path d="M0 74h139" stroke="#d8bc84" strokeWidth="1.4" opacity=".5" />
    </g>
  );
}

function ObstacleArt({ obstacle, elapsed, sceneHeight }: { obstacle: Obstacle; elapsed: number; sceneHeight: number }) {
  const x = obstacle.x;
  if (obstacle.broken) return null;
  if (obstacle.kind === "pit") {
    return (
      <g>
        <path d={`M${x - 4} ${GROUND_Y}h${obstacle.width + 8}l-8 59H${x + 8}Z`} fill="#233d3e" opacity=".74" />
        <rect x={x} y={GROUND_Y} width={obstacle.width} height={sceneHeight - GROUND_Y} fill="url(#s3d-pit)" />
        <path d={`M${x} ${GROUND_Y + 3}q${obstacle.width / 2} 6 ${obstacle.width} 0`} fill="none" stroke="#d18d67" strokeWidth="2.3" opacity=".88" />
        <path d={`M${x + 6} ${GROUND_Y + 20}q${obstacle.width / 2} 7 ${obstacle.width - 12} 0`} fill="none" stroke="#a75f4e" strokeWidth="1.2" opacity=".44" />
        <path d={`M${x + 10} ${GROUND_Y + 3}v7m${obstacle.width - 20}-7v7`} stroke="#e5c78e" strokeWidth="1" opacity=".45" />
      </g>
    );
  }
  if (obstacle.kind === "spikes") {
    const count = Math.max(2, Math.floor(obstacle.width / 14));
    return (
      <g>
        <path d={`M${x} ${GROUND_Y}h${obstacle.width}`} stroke="#513f3a" strokeWidth="3" />
        {Array.from({ length: count }, (_, index) => {
          const sx = x + index * (obstacle.width / count);
          const sw = obstacle.width / count;
          return (
            <g key={index}>
              <path d={`M${sx} ${GROUND_Y}l${sw * .48} -29 ${sw * .48} 29Z`} fill="#8a6054" stroke="#e1c097" strokeWidth="1.1" strokeLinejoin="round" />
              <path d={`M${sx + sw * .48} ${GROUND_Y - 26}l${sw * .34} 25`} stroke="#f0d7ad" strokeWidth="1.2" opacity=".78" />
              <path d={`M${sx + sw * .13} ${GROUND_Y - 3}h${sw * .68}`} stroke="#584438" strokeWidth="1.5" opacity=".7" />
            </g>
          );
        })}
      </g>
    );
  }
  if (obstacle.kind === "crate") {
    return (
      <g>
        <path d={`M${x + 4} ${GROUND_Y - 31}l7-6h${obstacle.width - 6}l-7 6Z`} fill="#c4a06a" stroke="#684f3a" strokeWidth="1.4" />
        <path d={`M${x} ${GROUND_Y - 31}h${obstacle.width - 7}v31H${x}Z`} fill="url(#s3d-wood)" stroke="#594535" strokeWidth="2" />
        <path d={`M${x + obstacle.width - 7} ${GROUND_Y - 31}l7-6v30l-7 7Z`} fill="#57483c" stroke="#463d36" strokeWidth="1.5" />
        <path d={`m${x + 5} ${GROUND_Y - 27} ${obstacle.width - 17} 22m0 -22 -${obstacle.width - 17} 22`} fill="none" stroke="#d0aa73" strokeWidth="2.2" />
        <path d={`M${x + 4} ${GROUND_Y - 24}h${obstacle.width - 13}M${x + 4} ${GROUND_Y - 6}h${obstacle.width - 13}`} stroke="#493c34" strokeWidth="1.4" opacity=".7" />
        <circle cx={x + 4} cy={GROUND_Y - 4} r="1.4" fill="#e2c690" />
      </g>
    );
  }
  if (obstacle.kind === "platform") {
    const y = obstacle.y ?? GROUND_Y - 56;
    return (
      <g opacity={obstacle.breakingFor ? .7 : 1}>
        <path d={`M${x + 3} ${y + 8}h${obstacle.width - 1}l-4 12H${x + 9}Z`} fill="#313f3c" opacity=".7" />
        <path d={`M${x} ${y}h${obstacle.width - 3}l3 8H${x + 3}Z`} fill="url(#s3d-wood)" stroke="#554639" strokeWidth="1.3" />
        <path d={`M${x + 2} ${y + 1}h${obstacle.width - 6}`} stroke="#e0c78f" strokeWidth="1.5" />
        <path d={`M${x + 7} ${y + 4}h${obstacle.width - 14}`} stroke="#574c3e" strokeWidth="1" opacity=".75" />
      </g>
    );
  }
  const swing = Math.sin(elapsed * 4 + obstacle.x) * 20;
  const centerX = x + obstacle.width / 2;
  const axeY = GROUND_Y - 85 + Math.sin(elapsed * 4 + obstacle.x) * 24;
  return (
    <g>
      <path d={`M${centerX} 0v${axeY - 15}`} stroke="#566268" strokeWidth="4" opacity=".35" />
      <path d={`M${centerX} 0v${axeY - 15}`} stroke="#c2b89c" strokeWidth="1.3" opacity=".8" />
      <g transform={`translate(${centerX} ${axeY}) rotate(${swing})`}>
        <path d="M0-22v24" stroke="#604f3c" strokeWidth="5" />
        <path d="M-1-25v29" stroke="#d2af77" strokeWidth="2" />
        <path d="M-1 0Q10 0 20 12L15 26 1 20-5 10Z" fill="url(#s3d-axe)" stroke="#4e5d61" strokeWidth="2" strokeLinejoin="round" />
        <path d="M3 3q10 3 14 10" fill="none" stroke="#fff3d6" strokeWidth="1.5" opacity=".82" />
        <circle cx="0" cy="-1" r="3" fill="#6a5d4c" stroke="#e0c089" strokeWidth="1" />
      </g>
    </g>
  );
}

function PickupArt({ pickup, elapsed }: { pickup: Pickup; elapsed: number }) {
  const bob = Math.sin(elapsed * 2.5 + pickup.x) * 2;
  const x = pickup.x;
  const y = pickup.y + bob;
  if (pickup.kind === "gold") {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r="12" fill="#f2d18c" opacity=".1" />
        <ellipse cy="1" rx="7.5" ry="9" fill="#a67643" opacity=".8" />
        <ellipse rx="6" ry="8" fill="#d9ae5c" stroke="#ffedb3" strokeWidth="1.4" />
        <ellipse rx="3.2" ry="5" fill="none" stroke="#f6df9e" strokeWidth="1" opacity=".85" />
        <path d="M-1-5v10m-2-4 2 2 2-2" fill="none" stroke="#8c683f" strokeWidth="1" />
        <path d="M-2-5h3" stroke="#fff0c5" strokeWidth="1.1" opacity=".8" />
      </g>
    );
  }
  if (pickup.kind === "gem") {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r="13" fill="#c1e8df" opacity=".11" />
        <path d="m0-10 8 5-2 11-6 5-6-5-2-11Z" fill="#79aaa6" stroke="#e0f0d5" strokeWidth="1.4" />
        <path d="M-8-5H8M-4-5l4 16 4-16M-4-9 0-5l4-4" fill="none" stroke="#d8ece0" strokeWidth="1" opacity=".82" />
        <path d="m-4-5 4 13 1-13Z" fill="#d2e8d9" opacity=".3" />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="12" fill="#e6a69a" opacity=".1" />
      <path d="M0 8C-4 4-10 0-10-4a5 5 0 0 1 9-3l1 1 1-1a5 5 0 0 1 9 3C10 0 4 4 0 8Z" fill="#c97770" stroke="#f2c3a7" strokeWidth="1.3" />
      <path d="M-4-4q3-2 5 0" fill="none" stroke="#ffe1bd" strokeWidth="1.1" opacity=".8" />
    </g>
  );
}

function KnightBike({ skin, elapsed }: { skin: string; elapsed: number }) {
  const spokeAngle = elapsed * 230;
  return (
    <g>
      <ellipse cx="29" cy="43" rx="31" ry="4" fill="#14272b" opacity=".38" />
      <g fill="none" stroke="#28363a" strokeWidth="2">
        <circle cx="12" cy="38" r="7" />
        <circle cx="43" cy="38" r="7" />
      </g>
      <g transform={`rotate(${spokeAngle} 12 38)`} stroke="#cbb992" strokeWidth=".8" opacity=".76">
        <path d="M12 31v14m-7-7h14m-12-5 10 10m0-10L7 43" />
      </g>
      <g transform={`rotate(${spokeAngle} 43 38)`} stroke="#cbb992" strokeWidth=".8" opacity=".76">
        <path d="M43 31v14m-7-7h14m-12-5 10 10m0-10L38 43" />
      </g>
      <path d="m12 38 8-14 7 14H12l9-15h11l11 15-16 0" fill="none" stroke="#d9c99f" strokeWidth="2.3" strokeLinejoin="round" />
      <path d="m27 38 5-14m-2-1h7m-4-2 3 3" fill="none" stroke="#d9c99f" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M20 24h8m-5-2h5" stroke="#a8b7b1" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 26 17 32l9 1 4-7-4-5-5 1Z" fill={skin} stroke="#e1d6bd" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="m21 27-6 3-3-2m13 6 5 4" fill="none" stroke="#d8c69c" strokeWidth="2.4" strokeLinecap="round" />
      <path d="m25 32-4 6m5-6 6 5" fill="none" stroke="#3d3531" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M18 18q0-12 10-13 10 1 10 13l-2 4H19Z" fill="url(#s3d-armor)" stroke="#f1e2c1" strokeWidth="1.6" />
      <path d="M20 17h16v5H20Z" fill="#263944" stroke="#b5c0b2" strokeWidth=".8" />
      <path d="M23 18h3m5 0h3" stroke="#e9d8a8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="m26 6 2-4 3 4m-3-4v5" fill="none" stroke="#e6c782" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 13q7-6 15 0" fill="none" stroke="#fff1d1" strokeWidth="1.2" opacity=".85" />
      <path d="m37 23 9 12" stroke="#d8ded0" strokeWidth="1.7" />
      <path d="m44 33 5 4-4-1-2 3-2-5Z" fill="#e5e6d8" stroke="#9aa8a3" strokeWidth=".8" />
      <path d="m27 33 2-5" stroke="#f0d79d" strokeWidth="1.2" />
    </g>
  );
}

export function Gameplay3D() {
  const profileSeed = useRef<Profile | null>(null);
  if (profileSeed.current === null) profileSeed.current = readProfile();
  const [profile, setProfile] = useState<Profile>(profileSeed.current);
  const [level, setLevel] = useState(profileSeed.current.unlockedLevel);
  const [runStatus, setRunStatus] = useState<RunStatus>("playing");
  const [runResult, setRunResult] = useState<Rewards>({ gold: 0, gems: 0 });
  const [runEpoch, setRunEpoch] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [phoneLayout, setPhoneLayout] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 680px)").matches,
  );
  const [sceneHeight, setSceneHeight] = useState(SCENE_HEIGHT);
  const frameRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<GameInput>({ left: false, right: false, jump: false, dash: false });
  const jumpPending = useRef(false);
  const dashPending = useRef(false);
  const pointerHolds = useRef(new Map<number, MoveKey>());
  const keyboardHolds = useRef(new Set<MoveKey>());
  const resultSent = useRef(false);
  const stateRef = useRef<GameState>(createGameState(level, profile.upgrades as EngineUpgrades));
  const [viewState, setViewState] = useState<GameState>(() => copyState(stateRef.current));
  const upgrades = profile.upgrades as EngineUpgrades;
  const cameraX = Math.max(0, Math.min(viewState.length - 500, viewState.player.x - 174));
  const progress = Math.min(100, (viewState.player.x / viewState.length) * 100);
  const dashAvailable = Boolean(upgrades.dash);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // Keep the run playable if local storage is unavailable.
    }
  }, [profile]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduceMotion(media.matches);
    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 680px)");
    const syncLayout = () => setPhoneLayout(media.matches);
    syncLayout();
    media.addEventListener("change", syncLayout);
    return () => media.removeEventListener("change", syncLayout);
  }, []);

  useEffect(() => {
    if (!phoneLayout) {
      setSceneHeight(SCENE_HEIGHT);
      return undefined;
    }
    const frame = frameRef.current;
    if (!frame) return undefined;
    const measure = () => {
      const { width, height } = frame.getBoundingClientRect();
      if (width > 0 && height > 0) setSceneHeight(Math.max(SCENE_HEIGHT, Math.round((height / width) * 500)));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    measure();
    return () => observer.disconnect();
  }, [phoneLayout]);

  const syncMovement = useCallback(() => {
    const held = new Set<MoveKey>(keyboardHolds.current);
    for (const key of pointerHolds.current.values()) held.add(key);
    inputRef.current.left = held.has("left");
    inputRef.current.right = held.has("right");
  }, []);

  const handleComplete = useCallback((rewards: Rewards) => {
    setProfile((current) => ({
      ...current,
      gold: current.gold + rewards.gold,
      gems: current.gems + rewards.gems,
      unlockedLevel: Math.max(current.unlockedLevel, level + 1),
    }));
    setRunResult(rewards);
    setRunStatus("complete");
  }, [level]);

  const handleGameOver = useCallback((rewards: Rewards) => {
    setProfile((current) => ({
      ...current,
      gold: current.gold + rewards.gold,
      gems: current.gems + rewards.gems,
    }));
    setRunResult(rewards);
    setRunStatus("gameover");
  }, []);

  useEffect(() => {
    stateRef.current = createGameState(level, upgrades);
    setViewState(copyState(stateRef.current));
    inputRef.current = { left: false, right: false, jump: false, dash: false };
    pointerHolds.current.clear();
    keyboardHolds.current.clear();
    jumpPending.current = false;
    dashPending.current = false;
    resultSent.current = false;
  }, [level, runEpoch, upgrades]);

  useEffect(() => {
    if (runStatus !== "playing") return undefined;
    let active = true;
    let lastTime = 0;
    let tick = 0;
    let frame = 0;

    const loop = (now: number) => {
      if (!active) return;
      const dt = lastTime ? (now - lastTime) / 1000 : 1 / 60;
      lastTime = now;
      inputRef.current.jump = jumpPending.current;
      inputRef.current.dash = dashPending.current;
      jumpPending.current = false;
      dashPending.current = false;
      const events = stepGame(stateRef.current, inputRef.current, upgrades, dt);
      for (const event of events) {
        if (event.type === "complete" && !resultSent.current) {
          resultSent.current = true;
          handleComplete({
            gold: stateRef.current.gold + 30 + level * 3,
            gems: stateRef.current.gems + 1,
          });
        }
        if (event.type === "gameOver" && !resultSent.current) {
          resultSent.current = true;
          handleGameOver({
            gold: Math.floor(stateRef.current.gold * .6),
            gems: stateRef.current.gems,
          });
        }
      }
      if (Math.floor(now / 48) !== tick) {
        tick = Math.floor(now / 48);
        setViewState(copyState(stateRef.current));
      }
      if (!stateRef.current.ended) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      inputRef.current = { left: false, right: false, jump: false, dash: false };
      pointerHolds.current.clear();
      keyboardHolds.current.clear();
    };
  }, [handleComplete, handleGameOver, level, runEpoch, runStatus, upgrades]);

  useEffect(() => {
    if (runStatus !== "playing") return undefined;
    const movementKey = (event: KeyboardEvent): MoveKey | null => {
      if (event.code === "ArrowLeft" || event.code === "KeyA") return "left";
      if (event.code === "ArrowRight" || event.code === "KeyD") return "right";
      return null;
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const movement = movementKey(event);
      const jump = event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW";
      const dash = event.code === "ShiftLeft" || event.code === "ShiftRight";
      if (!movement && !jump && !dash) return;
      event.preventDefault();
      if (movement) {
        keyboardHolds.current.add(movement);
        syncMovement();
      } else if (jump && !event.repeat) {
        jumpPending.current = true;
      } else if (dash && !event.repeat && dashAvailable) {
        dashPending.current = true;
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const movement = movementKey(event);
      if (!movement) return;
      keyboardHolds.current.delete(movement);
      syncMovement();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      keyboardHolds.current.clear();
      syncMovement();
    };
  }, [dashAvailable, runStatus, syncMovement]);

  const pointerMoveDown = (key: MoveKey) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointerHolds.current.set(event.pointerId, key);
    syncMovement();
  };

  const pointerMoveUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    pointerHolds.current.delete(event.pointerId);
    syncMovement();
  };

  const triggerJump = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (runStatus === "playing") jumpPending.current = true;
  };

  const triggerDash = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (runStatus === "playing" && dashAvailable) dashPending.current = true;
  };

  const restartRun = () => {
    if (runStatus === "complete") setLevel(profile.unlockedLevel);
    setRunStatus("playing");
    setRunEpoch((current) => current + 1);
  };

  return (
    <main className="saraya-gameplay-3d">
      <div className="s3d-shell">
        <header className="s3d-topbar">
          <button
            type="button"
            className="s3d-menu-button"
            onClick={() => setRunStatus(runStatus === "exit" ? "playing" : "exit")}
            aria-label="Menüyü aç"
          >
            <Icon name="back" size={15} />
            <span>MENÜ</span>
          </button>
          <div className="s3d-level-stamp"><span>BÖLÜM</span><strong>{String(level).padStart(2, "0")}</strong><i /><span>MASAL YOLU</span></div>
          <div className="s3d-wallet" aria-label={`Altın ${viewState.gold}, mücevher ${viewState.gems}`}>
            <span className="s3d-wallet-item"><Icon name="coin" size={15} /><b>{viewState.gold}</b></span>
            <span className="s3d-wallet-item"><Icon name="gem" size={15} /><b>{viewState.gems}</b></span>
          </div>
        </header>

        <section ref={frameRef} className="s3d-frame" aria-label="Saray yolundaki oyun sahnesi">
          <GameplayScene state={viewState} cameraX={cameraX} skin={profile.skin} reduceMotion={reduceMotion} sceneHeight={sceneHeight} />
          <div className="s3d-frame-vignette" />
          <div className="s3d-hud">
            <div className="s3d-health" aria-label={`Can ${viewState.player.hp} / ${viewState.player.maxHp}`}>
              <span>CAN</span>
              <span className="s3d-heart-row">
                {Array.from({ length: viewState.player.maxHp }, (_, index) => <HeartGlyph key={index} empty={index >= viewState.player.hp} />)}
              </span>
              <b>{viewState.player.hp}/{viewState.player.maxHp}</b>
            </div>
            <div className="s3d-progress" aria-label={`Bölüm ilerlemesi yüzde ${Math.round(progress)}`}>
              <div className="s3d-progress-fill" style={{ width: `${Math.max(1, progress)}%` }} />
            </div>
            <span className="s3d-route-label">SARAY YOLU</span>
          </div>

          {runStatus !== "playing" && (
            <div className="s3d-overlay" role="dialog" aria-modal="true">
              <div className="s3d-result-card">
                <div className="s3d-result-kicker">
                  {runStatus === "complete" ? "MASALIN YENİ SAYFASI" : runStatus === "gameover" ? "BU YOLCULUK BURADA BİTTİ" : runStatus === "left" ? "SARAY YOLCULUĞU" : "KISA BİR MOLA"}
                </div>
                <h2>
                  {runStatus === "complete" ? "Sarayın kapısı açıldı" : runStatus === "gameover" ? "Bir kez daha dene" : runStatus === "left" ? "Bölümden ayrıldın" : "Yolculuk durakladı"}
                </h2>
                <p>
                  {runStatus === "complete" ? "Şövalyenin cesareti bu masalın yolunu aydınlattı." :
                    runStatus === "gameover" ? "Topladıkların korundu. Bir sonraki denemede tuzaklara dikkat et." :
                      runStatus === "left" ? "Saray yolu seni yeniden bekliyor." : "Hazır olduğunda macerana kaldığın yerden devam et."}
                </p>
                {(runStatus === "complete" || runStatus === "gameover") && (
                  <div className="s3d-rewards">
                    <span><Icon name="coin" size={16} />{runResult.gold}</span>
                    <span><Icon name="gem" size={16} />{runResult.gems}</span>
                  </div>
                )}
                <div className="s3d-overlay-actions">
                  {runStatus === "exit" && (
                    <button type="button" className="s3d-overlay-button" onClick={() => setRunStatus("left")}>BÖLÜMDEN ÇIK</button>
                  )}
                  <button type="button" className="s3d-overlay-button is-primary" onClick={() => {
                    if (runStatus === "exit") {
                      setRunStatus("playing");
                    } else if (runStatus === "left") {
                      setRunStatus("playing");
                      setRunEpoch((current) => current + 1);
                    } else {
                      restartRun();
                    }
                  }}>
                    {runStatus === "exit" ? "DEVAM ET" : runStatus === "complete" ? "YENİ BÖLÜM" : runStatus === "left" ? "BÖLÜME DÖN" : "YENİDEN DENE"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="s3d-mobile-route" aria-hidden="true">
          <span className="s3d-mobile-route-label">YOLUNDA</span>
          <strong>Uzakta bir saray görünüyor.</strong>
          <span className="s3d-mobile-route-copy">Tuzakları aş, yol üzerindeki altınları topla.</span>
          <div className="s3d-mobile-route-track"><i style={{ width: `${Math.max(2, progress)}%` }} /></div>
        </div>

        <nav
          className="s3d-control-zone"
          aria-label="Oyun kontrolleri"
          onContextMenu={(event) => event.preventDefault()}
          onDragStart={(event) => event.preventDefault()}
          onSelectCapture={(event) => event.preventDefault()}
        >
          <div className="s3d-control-side">
            <div className="s3d-buttons">
              <button type="button" className="s3d-button s3d-direction-button" aria-label="Sola git" onPointerDown={pointerMoveDown("left")} onPointerUp={pointerMoveUp} onPointerCancel={pointerMoveUp}>
                <span className="s3d-keycap">A</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7" /></svg>
              </button>
              <button type="button" className="s3d-button s3d-direction-button" aria-label="Sağa git" onPointerDown={pointerMoveDown("right")} onPointerUp={pointerMoveUp} onPointerCancel={pointerMoveUp}>
                <span className="s3d-keycap">D</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
              </button>
            </div>
            <div className="s3d-control-caption"><strong>YÖNÜNÜ SEÇ</strong><span>Basılı tutarak ilerle</span></div>
          </div>
          <div className="s3d-buttons">
            <button type="button" className="s3d-button s3d-action-button" aria-label="Zıpla" onPointerDown={triggerJump}>
              <span className="s3d-keycap">SPACE</span><Icon name="jump" size={21} /><span>ZIPLA</span>
            </button>
            <button type="button" className={`s3d-button s3d-action-button s3d-dash-button${dashAvailable ? "" : " is-locked"}`} aria-label={dashAvailable ? "Atıl" : "Atılma kilitli"} aria-disabled={!dashAvailable} onPointerDown={triggerDash}>
              <span className="s3d-keycap">SHIFT</span><Icon name={dashAvailable ? "bolt" : "lock"} size={19} /><span>{dashAvailable ? "ATIL" : "KİLİTLİ"}</span>
            </button>
          </div>
        </nav>
        <p className="s3d-hint"><b>HAREKET</b> için basılı tut <span aria-hidden="true">·</span> <b>ZIPLA</b> için dokun <span aria-hidden="true">·</span> Klavye: A / D, Space</p>
      </div>
    </main>
  );
}
