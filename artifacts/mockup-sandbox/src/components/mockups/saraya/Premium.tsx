import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import {
  createGameState,
  GROUND_Y,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  stepGame,
} from "../../../../src/game/engine";
import type { EngineUpgrades, GameInput, GameState, Obstacle, Pickup } from "../../../../src/game/engine";
import { itemCost, purchaseUpgrade, SHOP_ITEMS } from "../../../../src/game/shop";
import type { PlayerProfile, UpgradeKey } from "../../../../src/storage/profile";
import "./_group.css";
import "./Premium.css";

type Screen = "menu" | "shop" | "map" | "settings" | "playing" | "completed" | "gameover";
type Rewards = { gold: number; gems: number };
type Profile = {
  gold: number;
  gems: number;
  unlockedLevel: number;
  upgrades: Record<UpgradeKey, number>;
  skin: number;
  skinsOwned: number[];
  soundOn: boolean;
};

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

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.65,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  const paths: Record<string, ReactElement> = {
    settings: <><circle cx="12" cy="12" r="3.1" /><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 0 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z" /></>,
    back: <><path d="m14.5 5-7 7 7 7" /><path d="M8 12h11" /></>,
    arrow: <><path d="M4 12h15" /><path d="m13 5 7 7-7 7" /></>,
    diagonal: <><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>,
    shop: <><path d="M4 9.5h16l-1.1 10H5.1L4 9.5Z" /><path d="m3 9.5 2.1-5h13.8l2.1 5M9 9v2.4a3 3 0 0 0 6 0V9" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /><circle cx="15" cy="9" r="1.4" /></>,
    sound: <><path d="M4 10v4h4l5 4V6l-5 4H4Z" /><path d="M17 9a5 5 0 0 1 0 6m2.5-8.5a8.5 8.5 0 0 1 0 11" /></>,
    crown: <><path d="m3 8 5 4 4-7 4 7 5-4-2 11H5L3 8Z" /><path d="M6 16h12" /></>,
    spark: <><path d="m12 2 1.8 7.2L21 12l-7.2 2.8L12 22l-1.8-7.2L3 12l7.2-2.8L12 2Z" /></>,
    jump: <><path d="M12 20V5" /><path d="m6 11 6-6 6 6" /><path d="M5 20h14" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.2 8.4-8 10-4.8-1.6-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    heart: <><path d="M20.8 8.8c0 4.2-8.8 10.2-8.8 10.2S3.2 13 3.2 8.8A4.4 4.4 0 0 1 12 6.5a4.4 4.4 0 0 1 8.8 2.3Z" /></>,
    magnet: <><path d="M5 4v8a7 7 0 0 0 14 0V4h-4v8a3 3 0 0 1-6 0V4H5Z" /><path d="M5 8h4m6 0h4" /></>,
    bolt: <><path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></>,
    coin: <><circle cx="12" cy="12" r="8.5" /><path d="m12 7 1.3 3.7L17 12l-3.7 1.3L12 17l-1.3-3.7L7 12l3.7-1.3L12 7Z" /></>,
    gem: <><path d="m12 3 7 4-7 14L5 7l7-4Z" /><path d="M5 7h14M9 7l3 14 3-14m-5-4 2 4 2-4" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h7" /></>,
  };
  return <svg {...common}>{paths[name] ?? paths.spark}</svg>;
}

function CoinMark({ gem = false }: { gem?: boolean }) {
  return <span className={`sy-currency-mark ${gem ? "is-gem" : ""}`} aria-hidden="true">{gem ? <Icon name="gem" size={14} /> : <Icon name="coin" size={14} />}</span>;
}

function Wallet({ profile, compact = false }: { profile: Profile; compact?: boolean }) {
  return (
    <div className={`sy-wallet ${compact ? "is-compact" : ""}`}>
      <div className="sy-wallet-item">
        <CoinMark />
        <span className="sy-wallet-value">{profile.gold}</span>
        <span className="sy-wallet-label">ALTIN</span>
      </div>
      <div className="sy-wallet-divider" />
      <div className="sy-wallet-item">
        <CoinMark gem />
        <span className="sy-wallet-value">{profile.gems}</span>
        <span className="sy-wallet-label">MÜCEVHER</span>
      </div>
      {!compact && <>
        <div className="sy-wallet-divider" />
        <div className="sy-wallet-item sy-level-wallet">
          <Icon name="book" size={15} />
          <span className="sy-wallet-value">{profile.unlockedLevel}</span>
          <span className="sy-wallet-label">AÇIK BÖLÜM</span>
        </div>
      </>}
    </div>
  );
}

function MoonlitCastle({ skin }: { skin: number }) {
  return (
    <div className="sy-cover-art" aria-label="Ay ışığındaki kaleye doğru yürüyen küçük şövalyenin masal resmi">
      <div className="sy-art-frame" />
      <svg className="sy-cover-svg" viewBox="0 0 390 248" role="img" aria-label="Ay ışığında bir masal sarayı">
        <defs>
          <linearGradient id="cover-sky" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#172a3c" />
            <stop offset=".56" stopColor="#304456" />
            <stop offset="1" stopColor="#8b6d55" />
          </linearGradient>
          <linearGradient id="cover-ground" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#63705d" />
            <stop offset="1" stopColor="#283d39" />
          </linearGradient>
          <radialGradient id="cover-halo">
            <stop stopColor="#e9c98d" stopOpacity=".42" />
            <stop offset="1" stopColor="#e9c98d" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="390" height="248" fill="url(#cover-sky)" />
        <circle cx="288" cy="54" r="73" fill="url(#cover-halo)" />
        <circle cx="288" cy="54" r="22" fill="#e7d6a8" />
        <circle cx="298" cy="48" r="20" fill="#344454" />
        <g fill="#e6d3a2" opacity=".8">
          <circle cx="38" cy="36" r="1.6" /><circle cx="85" cy="58" r="1.2" /><circle cx="142" cy="31" r="1.4" />
          <circle cx="199" cy="72" r="1.2" /><circle cx="347" cy="31" r="1.6" /><circle cx="361" cy="96" r="1.1" />
          <circle cx="112" cy="94" r="1.1" /><circle cx="252" cy="24" r="1.3" />
        </g>
        <path d="M0 154 Q50 129 104 150T218 145T390 140V248H0Z" fill="#293d43" opacity=".7" />
        <path d="M0 179 Q81 147 155 176T294 166T390 176V248H0Z" fill="#344944" opacity=".92" />
        <g fill="#202f39" stroke="#d0b079" strokeOpacity=".38" strokeWidth="1.3">
          <path d="M228 161V91h23V73h21v18h18v70Z" />
          <path d="M221 98 239 65l19 33Zm38-12 22-34 21 34Zm21 13 20-29 19 29Z" />
          <path d="M237 62v-8m20 20V62m22-12v-9m21 41v-8" />
          <path d="M243 117h8v13h-8zm25 0h8v13h-8zm23 0h8v13h-8z" fill="#ddc287" fillOpacity=".75" stroke="none" />
          <path d="M263 161v-23a10 10 0 0 1 20 0v23Z" />
        </g>
        <path d="M0 207 Q55 186 118 202T232 194T390 208V248H0Z" fill="url(#cover-ground)" />
        <path d="M0 206 Q55 185 118 201T232 193T390 207" fill="none" stroke="#9f9d70" strokeOpacity=".48" strokeWidth="2" />
        <g fill="#bcad7c" opacity=".5">
          <path d="M41 205q-4-14-1-23 7 10 6 22m7 1q0-12 7-19 1 12-2 20" />
          <path d="M340 203q-3-11 2-19 5 10 2 19m7 1q2-10 9-14-2 11-7 16" />
        </g>
        <g transform="translate(112 165)">
          <ellipse cx="19" cy="48" rx="22" ry="4" fill="#1d302f" opacity=".65" />
          <path d="M12 24h19l5 21H7Z" fill={SKINS[skin] ?? SKINS[0]} stroke="#d8c59b" strokeWidth="1.5" />
          <path d="M15 15h16v14H15Z" fill={SKINS[skin] ?? SKINS[0]} stroke="#c4d2cf" strokeWidth="1.5" />
          <path d="M12 15q0-14 11-14t11 14Z" fill="#8799a0" stroke="#e1d5b7" strokeWidth="1.5" />
          <path d="M17 12h13v5H17Z" fill="#293947" />
          <path d="M20 14h2m5 0h2" stroke="#eddcae" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M9 46h11v4H7m15-4h11v4H22" fill="#342e2b" />
          <path d="M38 20l10 18" stroke="#d3d7c8" strokeWidth="2" />
          <path d="m47 36 4 7-3-1-2 3-2-8Z" fill="#d3d7c8" />
        </g>
        <path d="M19 234 Q117 216 190 227T390 225" stroke="#c3a973" strokeOpacity=".28" fill="none" />
      </svg>
      <div className="sy-art-caption"><span>MASAL KİTABI · I</span><span>GECE YOLU</span></div>
      <div className="sy-art-vignette" />
    </div>
  );
}

function SectionHeader({ eyebrow, title, onBack }: { eyebrow: string; title: string; onBack: () => void }) {
  return (
    <header className="sy-section-header">
      <button type="button" className="sy-back-button" onClick={onBack} aria-label="Geri dön">
        <Icon name="back" size={17} /><span>GERİ</span>
      </button>
      <div className="sy-eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
    </header>
  );
}

function Runner({ level, upgrades, skin, onExit, onComplete, onGameOver }: {
  level: number;
  upgrades: Profile["upgrades"];
  skin: number;
  onExit: () => void;
  onComplete: (rewards: Rewards) => void;
  onGameOver: (rewards: Rewards) => void;
}) {
  const stateRef = useRef<GameState>(createGameState(level, upgrades as EngineUpgrades));
  const inputRef = useRef<GameInput>({ left: false, right: false, jump: false, dash: false });
  const jumpRef = useRef(false);
  const dashRef = useRef(false);
  const resultSent = useRef(false);
  const [viewState, setViewState] = useState<GameState>(() => ({ ...stateRef.current }));

  useEffect(() => {
    stateRef.current = createGameState(level, upgrades as EngineUpgrades);
    resultSent.current = false;
    setViewState({ ...stateRef.current });
    let active = true;
    let last = 0;
    let frame = 0;
    let tick = 0;
    const loop = (now: number) => {
      if (!active) return;
      const dt = last ? (now - last) / 1000 : 1 / 60;
      last = now;
      inputRef.current.jump = jumpRef.current;
      inputRef.current.dash = dashRef.current;
      jumpRef.current = false;
      dashRef.current = false;
      const events = stepGame(stateRef.current, inputRef.current, upgrades as EngineUpgrades, dt);
      for (const event of events) {
        if (event.type === "complete" && !resultSent.current) {
          resultSent.current = true;
          onComplete({ gold: stateRef.current.gold + 30 + level * 3, gems: stateRef.current.gems + 1 });
        }
        if (event.type === "gameOver" && !resultSent.current) {
          resultSent.current = true;
          onGameOver({ gold: Math.floor(stateRef.current.gold * 0.6), gems: stateRef.current.gems });
        }
      }
      if (Math.floor(now / 48) !== tick) {
        tick = Math.floor(now / 48);
        const s = stateRef.current;
        setViewState({
          ...s,
          player: { ...s.player },
          obstacles: s.obstacles.map((item) => ({ ...item })),
          pickups: s.pickups.map((item) => ({ ...item })),
        });
      }
      if (!stateRef.current.ended) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      inputRef.current = { left: false, right: false, jump: false, dash: false };
    };
  }, [level, upgrades, onComplete, onGameOver]);

  const cameraX = Math.max(0, Math.min(viewState.length - SCENE_WIDTH, viewState.player.x - 128));
  const progress = Math.min(100, (viewState.player.x / viewState.length) * 100);
  const onMoveDown = (key: "left" | "right") => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    inputRef.current[key] = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onMoveUp = (key: "left" | "right") => () => { inputRef.current[key] = false; };

  return (
    <div className="sy-runner">
      <div className="sy-runner-head">
        <button type="button" className="sy-runner-exit" onClick={onExit}><Icon name="back" size={16} /> MENÜ</button>
        <div className="sy-level-stamp">BÖLÜM <b>{level}</b></div>
        <div className="sy-runner-wallet"><span><CoinMark />{viewState.gold}</span><span><CoinMark gem />{viewState.gems}</span></div>
      </div>
      <div className="sy-game-frame">
        <svg className="sy-game-svg" viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`} role="img" aria-label="Şövalyenin bölüm içindeki yolculuğu">
          <defs>
            <linearGradient id="run-sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#203548" /><stop offset=".66" stopColor="#7a6758" /><stop offset="1" stopColor="#9a8060" /></linearGradient>
            <linearGradient id="run-earth" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#788263" /><stop offset="1" stopColor="#354c43" /></linearGradient>
          </defs>
          <rect width="360" height="270" fill="url(#run-sky)" />
          <circle cx="292" cy="39" r="19" fill="#e4d3a5" opacity=".88" />
          <g fill="#eadcb5" opacity=".7">{[[35, 33], [76, 57], [130, 29], [188, 62], [247, 24], [340, 81]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 1 : 1.5} />)}</g>
          <path d="M0 172Q55 143 113 166t113-2 134 7v99H0Z" fill="#35484a" />
          <path d="M0 190q73-36 141-8t116-7 103 13v82H0Z" fill="#42564a" />
          <CastleAt x={viewState.length - 112 - cameraX} />
          <path d={`M0 ${GROUND_Y}h360v59H0Z`} fill="url(#run-earth)" />
          <path d={`M0 ${GROUND_Y}h360`} stroke="#c1ad78" strokeWidth="5" opacity=".78" />
          {viewState.obstacles.map((obstacle) => <ObstacleArt key={obstacle.id} obstacle={obstacle} cameraX={cameraX} elapsed={viewState.elapsed} />)}
          {viewState.pickups.map((pickup) => <PickupArt key={pickup.id} pickup={pickup} cameraX={cameraX} />)}
          <g transform={`translate(${viewState.player.x - cameraX},${viewState.player.y})`} opacity={viewState.invulnerable > 0 ? .58 : 1}>
            <path d="M3 14q0-13 10-13t10 13Z" fill={SKINS[skin] ?? SKINS[0]} stroke="#e0d4b8" strokeWidth="1.5" />
            <path d="M6 10h14v6H6Z" fill="#253747" />
            <circle cx="9" cy="13" r="1" fill="#f2ddb0" /><circle cx="17" cy="13" r="1" fill="#f2ddb0" />
            <path d="M5 17h16v13H5Z" fill={SKINS[skin] ?? SKINS[0]} stroke="#d4d5c4" strokeWidth="1.2" />
            <path d="M2 29h9v4H1m11-4h9v4h-9" fill="#392f2c" />
            <path d="m22 18 9 13m-1-17 3 7-3-1-2 3-2-7Z" fill="#dce0d2" stroke="#aab1a8" strokeWidth=".7" />
          </g>
          <g className="sy-game-progress-svg">
            <rect x="11" y="11" width="338" height="7" rx="3.5" fill="#21323a" opacity=".83" />
            <rect x="11" y="11" width={Math.max(2, 338 * progress / 100)} height="7" rx="3.5" fill="#d4b46f" />
          </g>
        </svg>
        <div className="sy-game-hud">
          <span className="sy-health">CAN <b>{viewState.player.hp}/{viewState.player.maxHp}</b></span>
          <span className="sy-game-level-label">SARAY YOLU</span>
        </div>
      </div>
      <div className="sy-controls">
        <div className="sy-direction-controls">
          <button type="button" className="sy-control-button" aria-label="Sola git" onPointerDown={onMoveDown("left")} onPointerUp={onMoveUp("left")} onPointerCancel={onMoveUp("left")} onPointerLeave={onMoveUp("left")}><span>‹</span></button>
          <button type="button" className="sy-control-button" aria-label="Sağa git" onPointerDown={onMoveDown("right")} onPointerUp={onMoveUp("right")} onPointerCancel={onMoveUp("right")} onPointerLeave={onMoveUp("right")}><span>›</span></button>
        </div>
        <div className="sy-action-controls">
          <button type="button" className="sy-action-button is-jump" onPointerDown={() => { jumpRef.current = true; }} aria-label="Zıpla"><Icon name="jump" size={22} /><span>ZIPLA</span></button>
          <button type="button" className={`sy-action-button is-dash ${upgrades.dash ? "" : "is-locked"}`} onPointerDown={() => { if (upgrades.dash) dashRef.current = true; }} aria-label={upgrades.dash ? "Atıl" : "Atılma kilitli"}><Icon name={upgrades.dash ? "bolt" : "lock"} size={21} /><span>{upgrades.dash ? "ATIL" : "KİLİTLİ"}</span></button>
        </div>
      </div>
      <p className="sy-control-hint">Hareket için basılı tut · Zıplamak için dokun</p>
    </div>
  );
}

function CastleAt({ x }: { x: number }) {
  return (
    <g transform={`translate(${x},125)`} fill="#283c43" stroke="#d0b782" strokeOpacity=".45" strokeWidth="1.5">
      <path d="M8 48V17h14V5h17v12h12v31Z" />
      <path d="m4 18 12-21 12 21Zm29-7 12-21 13 21Zm15 9 11-18 12 18Z" />
      <path d="M15 48V34a8 8 0 0 1 16 0v14Z" />
      <path d="M13 25h5v8h-5zm17 0h5v8h-5zm18 0h5v8h-5z" fill="#d9c38f" stroke="none" />
    </g>
  );
}

function ObstacleArt({ obstacle, cameraX, elapsed }: { obstacle: Obstacle; cameraX: number; elapsed: number }) {
  const x = obstacle.x - cameraX;
  if (x < -80 || x > SCENE_WIDTH + 80 || obstacle.broken) return null;
  if (obstacle.kind === "pit") return <g><rect x={x} y={GROUND_Y} width={obstacle.width} height={SCENE_HEIGHT - GROUND_Y} fill="#1e3036" /><path d={`M${x} ${GROUND_Y + 3}h${obstacle.width}`} stroke="#c7815d" strokeWidth="3" /></g>;
  if (obstacle.kind === "spikes") return <path d={`M${x} ${GROUND_Y}l10-23 10 23 10-23 10 23Z`} fill="#b57865" stroke="#e1b793" strokeWidth="1.3" />;
  if (obstacle.kind === "crate") return <g><rect x={x} y={GROUND_Y - 31} width={obstacle.width} height="31" rx="3" fill="#80664b" stroke="#c6a776" strokeWidth="2" /><path d={`m${x + 5} ${GROUND_Y - 27} ${obstacle.width - 10} 22m0-22- ${obstacle.width - 10} 22`} stroke="#bd9b6f" strokeWidth="2" /></g>;
  if (obstacle.kind === "platform") return <g><rect x={x} y={(obstacle.y ?? GROUND_Y - 56)} width={obstacle.width} height="9" rx="3" fill="#876b4b" stroke="#d2b27a" strokeWidth="2" /><path d={`M${x + 5} ${(obstacle.y ?? GROUND_Y - 56) + 4}h${obstacle.width - 10}`} stroke="#504c3f" strokeWidth="1.5" /></g>;
  const swing = Math.sin(elapsed * 4 + obstacle.x) * 18;
  return <g transform={`translate(${x + obstacle.width / 2},${GROUND_Y - 82}) rotate(${swing})`}><path d="M0-85v60" stroke="#b0aa91" strokeWidth="2" /><path d="M-4-25h8v5h-8Z" fill="#a7a89b" /><path d="M0-21 18-13 10 2 0-4Z" fill="#b6b9ae" stroke="#6e7777" strokeWidth="2" /></g>;
}

function PickupArt({ pickup, cameraX }: { pickup: Pickup; cameraX: number }) {
  if (pickup.collected) return null;
  const x = pickup.x - cameraX;
  if (x < -20 || x > SCENE_WIDTH + 20) return null;
  if (pickup.kind === "gold") return <g><circle cx={x} cy={pickup.y} r="7" fill="#ddba69" stroke="#f3dfaa" strokeWidth="1.5" /><circle cx={x} cy={pickup.y} r="2" fill="#8c7046" /></g>;
  if (pickup.kind === "gem") return <path d={`M${x} ${pickup.y - 9}l7 7-7 11-7-11Z`} fill="#83aaa8" stroke="#d6e0ca" strokeWidth="1.5" />;
  return <path d={`M${x} ${pickup.y + 7}C${x - 15} ${pickup.y - 2} ${x - 8} ${pickup.y - 13} ${x} ${pickup.y - 4}C${x + 9} ${pickup.y - 14} ${x + 16} ${pickup.y - 2} ${x} ${pickup.y + 7}`} fill="#bd7770" stroke="#e5b4a0" strokeWidth="1.3" />;
}

export function Premium() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [screen, setScreen] = useState<Screen>("menu");
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [runResult, setRunResult] = useState<Rewards>({ gold: 0, gems: 0 });
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("saraya-yolculuk.profile.v1");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Profile>;
        setProfile({
          ...DEFAULT_PROFILE,
          ...parsed,
          upgrades: { ...DEFAULT_PROFILE.upgrades, ...(parsed.upgrades ?? {}) },
          skinsOwned: Array.from(new Set([0, ...(parsed.skinsOwned ?? [])])),
        });
      }
    } catch {
      // The mockup remains usable when local storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("saraya-yolculuk.profile.v1", JSON.stringify(profile));
    } catch {
      // Saving is best-effort in this isolated visual prototype.
    }
  }, [profile]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(""), 2300);
  };

  const startGame = (level: number) => {
    setSelectedLevel(level);
    setRunResult({ gold: 0, gems: 0 });
    setScreen("playing");
  };

  const buyUpgrade = (key: UpgradeKey) => {
    const item = SHOP_ITEMS.find((candidate) => candidate.key === key);
    if (!item) return;
    const current = profile.upgrades[key];
    const next = purchaseUpgrade(profile as PlayerProfile, item);
    if (!next) {
      showToast(current >= item.maxLevel ? "Bu yetenek en yüksek seviyede." : "Bu yükseltme için yeterli para yok.");
      return;
    }
    setProfile(next);
    showToast(`${item.title} kalıcı olarak geliştirildi.`);
  };

  const buySkin = (skin: number) => {
    if (profile.skinsOwned.includes(skin)) {
      setProfile((current) => ({ ...current, skin }));
      showToast("Kostüm seçildi.");
      return;
    }
    const cost = 45 + skin * 20;
    if (profile.gold < cost) {
      showToast("Bu kostüm için yeterli altın yok.");
      return;
    }
    setProfile((current) => ({
      ...current,
      gold: current.gold - cost,
      skin,
      skinsOwned: [...current.skinsOwned, skin],
    }));
    showToast("Yeni kostüm açıldı ve seçildi.");
  };

  const handleComplete = useCallback((rewards: Rewards) => {
    setProfile((current) => ({
      ...current,
      gold: current.gold + rewards.gold,
      gems: current.gems + rewards.gems,
      unlockedLevel: Math.max(current.unlockedLevel, selectedLevel + 1),
    }));
    setRunResult(rewards);
    setScreen("completed");
  }, [selectedLevel]);

  const handleGameOver = useCallback((rewards: Rewards) => {
    setProfile((current) => ({
      ...current,
      gold: current.gold + rewards.gold,
      gems: current.gems + rewards.gems,
    }));
    setRunResult(rewards);
    setScreen("gameover");
  }, []);

  return (
    <main className="saraya-premium-root">
      <div className="sy-night-grain" />
      <div className="sy-app-shell">
        {screen === "menu" && (
          <div className="sy-main-screen">
            <div className="sy-topline">
              <div className="sy-brand-mark"><span className="sy-brand-seal"><Icon name="spark" size={14} /></span><span>MASAL <i>/</i> MACERA</span></div>
              <button type="button" className="sy-settings-trigger" onClick={() => setScreen("settings")} aria-label="Ayarlar"><Icon name="settings" size={18} /></button>
            </div>
            <section className="sy-cover-copy">
              <div className="sy-eyebrow sy-gold-eyebrow">BİR SONRAKİ BÖLÜM HİÇBİTMİYOR</div>
              <h1>SARAYA<br /><em>YOLCULUK</em></h1>
              <p>Tuzakları aş. Altınları topla.<br />Sarayın yolunu bul.</p>
            </section>
            <MoonlitCastle skin={profile.skin} />
            <div className="sy-story-chapter"><span>ŞİMDİKİ SAYFA</span><i /><strong>BÖLÜM {profile.unlockedLevel}</strong></div>
            <Wallet profile={profile} />
            <button type="button" className="sy-primary-button" onClick={() => startGame(profile.unlockedLevel)}>
              <span>MACERAYA BAŞLA</span><Icon name="arrow" size={20} />
            </button>
            <div className="sy-secondary-row">
              <button type="button" className="sy-secondary-tile" onClick={() => setScreen("shop")}>
                <span className="sy-tile-icon"><Icon name="shop" size={18} /></span><span>DÜKKAN</span><Icon name="diagonal" size={14} />
              </button>
              <button type="button" className="sy-secondary-tile" onClick={() => { setSelectedLevel(profile.unlockedLevel); setScreen("map"); }}>
                <span className="sy-tile-icon"><Icon name="map" size={18} /></span><span>BÖLÜMLER</span><Icon name="diagonal" size={14} />
              </button>
            </div>
            <div className="sy-tip"><Icon name="spark" size={15} /><p><b>İPUCU</b><span>Çift zıplama ve atılma yeteneklerini dükkandan aç.</span></p></div>
            <div className="sy-page-footer"><span>KÜÇÜK BİR KAHRAMANIN BÜYÜK YOLCULUĞU</span><Icon name="spark" size={10} /></div>
          </div>
        )}

        {screen === "shop" && (
          <div className="sy-sub-screen">
            <SectionHeader eyebrow="KARAKTERİNİ GÜÇLENDİR" title="Dükkan" onBack={() => setScreen("menu")} />
            <div className="sy-shop-wallet"><Wallet profile={profile} compact /></div>
            <div className="sy-scroll-content">
              <div className="sy-section-label"><span>YETENEKLER</span><i>PERMANENT GELİŞİM</i></div>
              <div className="sy-upgrade-grid">
                {SHOP_ITEMS.map((item) => {
                  const current = profile.upgrades[item.key];
                  const maxed = current >= item.maxLevel;
                  const cost = itemCost(item, current);
                  const enough = profile[item.currency] >= cost;
                  const disabled = maxed || !enough;
                  return (
                    <article className="sy-upgrade-card" key={item.key}>
                      <div className="sy-card-topline">
                        <span className="sy-upgrade-icon"><Icon name={item.key === "speed" ? "arrow" : item.key === "jump" ? "jump" : item.key === "maxHp" ? "heart" : item.key === "armor" ? "shield" : item.key === "doubleJump" ? "jump" : item.key === "magnet" ? "magnet" : "bolt"} size={19} /></span>
                        <span className={`sy-level-badge ${maxed ? "is-max" : ""}`}>{maxed ? "TAMAM" : `${current}/${item.maxLevel}`}</span>
                      </div>
                      <h2>{item.title}</h2>
                      <p>{item.subtitle}</p>
                      <button type="button" className={`sy-buy-button ${maxed ? "is-max" : ""} ${!enough && !maxed ? "is-poor" : ""}`} disabled={disabled} onClick={() => buyUpgrade(item.key)}>
                        {maxed ? "EN YÜKSEK SEVİYE" : <><span>GELİŞTİR</span><i>·</i><CoinMark gem={item.currency === "gems"} /><b>{cost}</b></>}
                      </button>
                    </article>
                  );
                })}
              </div>
              <div className="sy-section-label sy-appearance-label"><span>GÖRÜNÜM</span><i>ŞÖVALYE ZIRHLARI</i></div>
              <section className="sy-skin-card">
                <h2>Şövalye kostümleri</h2>
                <p>Altınla yeni zırh renklerinin kilidini aç.</p>
                <div className="sy-skin-list">
                  {SKINS.map((color, index) => {
                    const owned = profile.skinsOwned.includes(index);
                    const selected = profile.skin === index;
                    return (
                      <button type="button" className={`sy-skin-swatch ${selected ? "is-selected" : ""}`} key={color} onClick={() => buySkin(index)} aria-label={`${index === 0 ? "Mavi" : `Kostüm ${index + 1}`} kostümü seç veya satın al`}>
                        <span className="sy-armor-crest" style={{ backgroundColor: color }}><span /></span>
                        <span className="sy-swatch-label">{selected ? "SEÇİLİ" : owned ? "SEÇ" : <><CoinMark />{45 + index * 20}</>}</span>
                        {!owned && !selected && <span className="sy-swatch-lock">+</span>}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        )}

        {screen === "map" && (
          <div className="sy-sub-screen">
            <SectionHeader eyebrow="İLERLEME" title="Bölüm Haritası" onBack={() => setScreen("menu")} />
            <div className="sy-map-intro">
              <span className="sy-map-ornament"><Icon name="map" size={19} /></span>
              <div><h2>Sıradaki durak: bölüm {profile.unlockedLevel}</h2><p>Her zafer yeni bir rota açar. Tuzaklar her bölümde sıklaşır.</p></div>
            </div>
            <div className="sy-level-scroll">
              <div className="sy-level-list">
                {Array.from({ length: Math.min(profile.unlockedLevel + 3, 12) }, (_, index) => index + 1).map((level) => {
                  const unlocked = level <= profile.unlockedLevel;
                  const selected = level === selectedLevel;
                  return (
                    <button type="button" key={level} disabled={!unlocked} onClick={() => setSelectedLevel(level)} className={`sy-level-card ${selected ? "is-selected" : ""} ${!unlocked ? "is-locked" : ""}`}>
                      <span className="sy-level-medallion">{unlocked ? String(level).padStart(2, "0") : <Icon name="lock" size={16} />}</span>
                      <span className="sy-level-details"><b>{unlocked ? `Bölüm ${level}` : "Henüz kilitli"}</b><small>{unlocked ? level === 1 ? "İlk adım · Saray yolu" : "Daha fazla tuzak · Daha çok ödül" : "Önce önceki bölümü tamamla"}</small></span>
                      <span className="sy-level-status">{unlocked ? selected ? "SEÇİLİ" : "AÇIK" : "KİLİTLİ"}</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" className="sy-primary-button sy-map-start" onClick={() => startGame(selectedLevel)}><span>BÖLÜM {selectedLevel} OYNA</span><Icon name="arrow" size={20} /></button>
            </div>
          </div>
        )}

        {screen === "settings" && (
          <div className="sy-sub-screen sy-settings-screen">
            <SectionHeader eyebrow="OYUN TERCİHLERİ" title="Ayarlar" onBack={() => setScreen("menu")} />
            <button type="button" className="sy-setting-card" onClick={() => setProfile((current) => ({ ...current, soundOn: !current.soundOn }))}>
              <span className="sy-setting-icon"><Icon name="sound" size={20} /></span>
              <span className="sy-setting-copy"><b>Ses efektleri</b><small>Zıplama, ödül, hasar ve atlı kaçış sesleri</small></span>
              <span className={`sy-switch ${profile.soundOn ? "is-on" : ""}`} aria-hidden="true"><i /></span>
            </button>
            <div className="sy-save-note">
              <span className="sy-save-note-icon"><Icon name="book" size={18} /></span>
              <div><b>Kayıt durumu</b><p>Altınların, mücevherlerin, açtığın bölümler ve yükseltmeler bu cihazda otomatik kaydedilir.</p></div>
              <span className="sy-save-status">OTOMATİK</span>
            </div>
            <button type="button" className="sy-outline-button" onClick={() => setScreen("shop")}>DÜKKANI AÇ <Icon name="arrow" size={17} /></button>
          </div>
        )}

        {screen === "playing" && (
          <Runner level={selectedLevel} upgrades={profile.upgrades} skin={profile.skin} onExit={() => setScreen("menu")} onComplete={handleComplete} onGameOver={handleGameOver} />
        )}

        {(screen === "completed" || screen === "gameover") && (
          <div className="sy-result-screen">
            {screen === "completed" ? <span className="sy-result-seal"><Icon name="crown" size={27} /></span> : <span className="sy-result-seal is-failure"><Icon name="heart" size={27} /></span>}
            <div className="sy-eyebrow sy-gold-eyebrow">{screen === "completed" ? "BÖLÜM TAMAMLANDI!" : "BU KEZ OLMADI"}</div>
            <h1>{screen === "completed" ? "Sarayın kapısında" : "Bir can daha lazım"}</h1>
            <p className="sy-result-copy">{screen === "completed" ? "Atlı prensesi kaçırdı; ama yeni bir bölüm açıldı. Şövalye yeniden yola çıkmaya hazır." : "Topladığın ganimetin bir kısmı sende kaldı. Dükkandan güçlenip yeniden dene."}</p>
            <section className="sy-reward-card">
              <div className="sy-reward-head"><span>BÖLÜM {selectedLevel}</span><span className="sy-result-stars">{screen === "completed" ? <><i /><i /><i /></> : <Icon name="arrow" size={16} />}</span></div>
              <div className="sy-reward-content">
                <div><b>+{runResult.gold}</b><span><CoinMark /> ALTIN</span></div>
                <i />
                <div><b>+{runResult.gems}</b><span><CoinMark gem /> MÜCEVHER</span></div>
              </div>
              {screen === "completed" && <div className="sy-unlock-note">BÖLÜM {profile.unlockedLevel} AÇILDI <Icon name="arrow" size={14} /></div>}
            </section>
            <button type="button" className="sy-primary-button" onClick={() => startGame(screen === "completed" ? profile.unlockedLevel : selectedLevel)}><span>{screen === "completed" ? `BÖLÜM ${profile.unlockedLevel} OYNA` : "YENİDEN DENE"}</span><Icon name="arrow" size={20} /></button>
            <div className="sy-result-actions">
              <button type="button" onClick={() => setScreen("shop")}>DÜKKAN</button>
              <button type="button" onClick={() => setScreen("menu")}>ANA MENÜ</button>
            </div>
          </div>
        )}
        {toast && <div className="sy-toast" role="status">{toast}</div>}
      </div>
    </main>
  );
}

export default Premium;