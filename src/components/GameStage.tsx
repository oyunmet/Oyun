import { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CastleSprite, HorseSprite, PrincessSprite } from "./GameSprites";
import {
  createGameState,
  GameEvent,
  GameInput,
  GameState,
  GROUND_Y,
  Obstacle,
  Pickup,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  stepGame,
} from "../game/engine";
import { EngineUpgrades } from "../game/engine";
import { UpgradeKey } from "../storage/profile";
import { playSound } from "../audio/sounds";

const SKINS = ["#3b82f6", "#ef5b59", "#55bd87", "#d28d45", "#b57be0", "#ec7eaa"];

type Props = {
  level: number;
  upgrades: Record<UpgradeKey, number>;
  skin: number;
  soundOn: boolean;
  onExit: () => void;
  onComplete: (rewards: { gold: number; gems: number }) => void;
  onGameOver: (rewards: { gold: number; gems: number }) => void;
};

function snapshot(state: GameState): GameState {
  return {
    ...state,
    player: { ...state.player },
    obstacles: state.obstacles.map((obstacle) => ({ ...obstacle })),
    pickups: state.pickups.map((pickup) => ({ ...pickup })),
  };
}

function Character({ color, scale, left, top, invulnerable, dash }: {
  color: string;
  scale: number;
  left: number;
  top: number;
  invulnerable: boolean;
  dash: boolean;
}) {
  return (
    <View
      style={[
        styles.character,
        {
          left,
          top,
          width: PLAYER_WIDTH * scale,
          height: PLAYER_HEIGHT * scale,
          opacity: invulnerable ? 0.55 : 1,
          transform: [{ scaleX: dash ? 1.18 : 1 }],
          pointerEvents: "none",
        },
      ]}
    >
      <View style={[styles.helmet, { backgroundColor: color, height: 10 * scale }]} />
      <View style={[styles.face, { left: 7 * scale, top: 7 * scale, width: 11 * scale, height: 8 * scale }]} />
      <View style={[styles.torso, { backgroundColor: color, left: 4 * scale, top: 14 * scale, width: 16 * scale, height: 11 * scale }]} />
      <View style={[styles.boot, { left: 2 * scale, top: 25 * scale }]} />
      <View style={[styles.boot, { left: 13 * scale, top: 25 * scale }]} />
      <View style={[styles.sword, { top: 12 * scale, left: 20 * scale, width: 3 * scale, height: 15 * scale }]} />
    </View>
  );
}

function obstacleView(obstacle: Obstacle, left: number, scale: number, elapsed: number) {
  if (obstacle.kind === "pit") {
    return (
      <View
        key={obstacle.id}
        style={[
          styles.pit,
          { left, top: GROUND_Y * scale, width: obstacle.width * scale, height: (SCENE_HEIGHT - GROUND_Y + 8) * scale, pointerEvents: "none" },
        ]}
      >
        <View style={[styles.pitGlow, { height: 4 * scale }]} />
      </View>
    );
  }
  if (obstacle.kind === "spikes") {
    return (
      <View key={obstacle.id} style={{ position: "absolute", left, top: (GROUND_Y - 25) * scale, flexDirection: "row", pointerEvents: "none" }}>
        <Text style={{ fontSize: 25 * scale, lineHeight: 28 * scale, color: "#f36d64" }}>▲▲</Text>
      </View>
    );
  }
  if (obstacle.kind === "crate") {
    return (
      <View
        key={obstacle.id}
        style={[
          styles.crate,
          { left, top: (GROUND_Y - 30) * scale, width: obstacle.width * scale, height: 30 * scale, pointerEvents: "none" },
        ]}
      >
        <Text style={{ color: "#614024", fontSize: 16 * scale, fontWeight: "900" }}>╳</Text>
      </View>
    );
  }
  if (obstacle.kind === "platform") {
    if (obstacle.broken) return null;
    return (
      <View
        key={obstacle.id}
        style={[
          styles.platform,
          {
            left,
            top: (obstacle.y ?? GROUND_Y - 56) * scale,
            width: obstacle.width * scale,
            height: 9 * scale,
            opacity: obstacle.breakingFor ? 0.62 : 1,
            pointerEvents: "none",
          },
        ]}
      />
    );
  }
  const swing = Math.sin(elapsed * 4 + obstacle.x) * 30;
  return (
    <View key={obstacle.id} style={{ position: "absolute", left: left + obstacle.width * scale / 2 - 2 * scale, top: (GROUND_Y - 115) * scale, pointerEvents: "none" }}>
      <View style={[styles.chain, { height: 42 * scale }]} />
      <View style={[styles.axe, { transform: [{ rotate: `${swing}deg` }], width: 22 * scale, height: 22 * scale }]} />
    </View>
  );
}

function PickupSprite({ pickup, left, scale }: { pickup: Pickup; left: number; scale: number }) {
  if (pickup.collected) return null;
  const glyph = pickup.kind === "gold" ? "●" : pickup.kind === "gem" ? "◆" : "♥";
  const color = pickup.kind === "gold" ? "#ffd75e" : pickup.kind === "gem" ? "#7ee7ed" : "#ff6f79";
  return (
    <View
      key={pickup.id}
      style={[
        styles.pickup,
        { left: left - 9 * scale, top: (pickup.y - 9) * scale, width: 18 * scale, height: 18 * scale, borderColor: color, pointerEvents: "none" },
      ]}
    >
      <Text style={{ color, fontSize: 11 * scale, fontWeight: "900" }}>{glyph}</Text>
    </View>
  );
}

export default function GameStage({ level, upgrades, skin, soundOn, onExit, onComplete, onGameOver }: Props) {
  const input = useRef<GameInput>({ left: false, right: false, jump: false, dash: false });
  const pendingJump = useRef(false);
  const pendingDash = useRef(false);
  const frameRef = useRef(0);
  const stateRef = useRef(createGameState(level, upgrades as EngineUpgrades));
  const [viewState, setViewState] = useState(() => snapshot(stateRef.current));
  const [stageWidth, setStageWidth] = useState(SCENE_WIDTH);
  const [cinematic, setCinematic] = useState(false);
  const horseX = useRef(new Animated.Value(SCENE_WIDTH + 75)).current;
  const lastTime = useRef(0);
  const resultSent = useRef(false);
  const scale = stageWidth / SCENE_WIDTH;
  const cameraX = Math.max(0, Math.min(viewState.length - SCENE_WIDTH, viewState.player.x - 126));
  const playerLeft = (viewState.player.x - cameraX) * scale;
  const playerTop = viewState.player.y * scale;
  const tint = SKINS[skin] ?? SKINS[0];

  const measureStage = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width;
    if (measured > 0 && Math.abs(measured - stageWidth) > 1) setStageWidth(measured);
  };

  useEffect(() => {
    stateRef.current = createGameState(level, upgrades as EngineUpgrades);
    setViewState(snapshot(stateRef.current));
    input.current = { left: false, right: false, jump: false, dash: false };
    pendingJump.current = false;
    pendingDash.current = false;
    setCinematic(false);
    resultSent.current = false;
    horseX.setValue(SCENE_WIDTH + 75);
  }, [level, upgrades, horseX]);

  useEffect(() => {
    let active = true;
    const loop = (now: number) => {
      if (!active) return;
      const dt = lastTime.current ? (now - lastTime.current) / 1000 : 1 / 60;
      lastTime.current = now;
      const currentInput = {
        left: input.current.left,
        right: input.current.right,
        jump: pendingJump.current,
        dash: pendingDash.current,
      };
      pendingJump.current = false;
      pendingDash.current = false;
      const events = stepGame(stateRef.current, currentInput, upgrades, dt);
      for (const event of events) {
        if (event.type === "gold") playSound("coin", soundOn);
        else if (event.type === "gem") playSound("gem", soundOn);
        else if (event.type === "hit") playSound("hit", soundOn);
        else if (event.type === "complete" && !resultSent.current) {
          resultSent.current = true;
          setCinematic(true);
          playSound("horse", soundOn);
          Animated.timing(horseX, {
            toValue: -120,
            duration: 1900,
            useNativeDriver: true,
          }).start(() => {
            if (active) onComplete({ gold: stateRef.current.gold, gems: stateRef.current.gems });
          });
        } else if (event.type === "gameOver" && !resultSent.current) {
          resultSent.current = true;
          onGameOver({ gold: Math.floor(stateRef.current.gold * 0.6), gems: stateRef.current.gems });
        }
      }
      if (Math.floor(now / 45) !== frameRef.current && !stateRef.current.ended) {
        frameRef.current = Math.floor(now / 45);
        setViewState(snapshot(stateRef.current));
      }
      if (!stateRef.current.ended) requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => {
      active = false;
      cancelAnimationFrame(id);
      lastTime.current = 0;
    };
  }, [upgrades, soundOn, onComplete, onGameOver, horseX]);

  const setHeld = (key: "left" | "right", held: boolean) => {
    input.current[key] = held;
  };
  const liveObstacles = viewState.obstacles.filter((obstacle) => {
    const x = (obstacle.x - cameraX) * scale;
    return x + obstacle.width * scale > -80 && x < stageWidth + 80;
  });
  const livePickups = viewState.pickups.filter((pickup) => {
    const x = (pickup.x - cameraX) * scale;
    return !pickup.collected && x > -24 && x < stageWidth + 24;
  });

  return (
    <View style={styles.gamePage}>
      <View style={styles.gameTop}>
        <Pressable onPress={onExit} style={styles.leaveButton} accessibilityLabel="Bölümden çık">
          <Text style={styles.leaveText}>‹  MENÜ</Text>
        </Pressable>
        <Text style={styles.levelLabel}>BÖLÜM {level}</Text>
        <View style={styles.miniCurrency}><Text style={styles.miniGold}>● {viewState.gold}</Text><Text style={styles.miniGem}>◆ {viewState.gems}</Text></View>
      </View>

      <View onLayout={measureStage} style={styles.stage}>
        <View style={[styles.sky, { height: SCENE_HEIGHT * scale }]}>
          <View style={[styles.moon, { right: 39 * scale, top: 28 * scale, width: 27 * scale, height: 27 * scale }]} />
          <View style={[styles.cloud, { left: 48 * scale, top: 62 * scale, transform: [{ scale: scale }] }]}>
            <View style={styles.cloudPuffLeft} /><View style={styles.cloudPuffTop} /><View style={styles.cloudPuffRight} />
          </View>
          <View style={[styles.cloud, { left: 234 * scale, top: 42 * scale, transform: [{ scale: scale * 0.75 }] }]}>
            <View style={styles.cloudPuffLeft} /><View style={styles.cloudPuffTop} /><View style={styles.cloudPuffRight} />
          </View>
          <View style={[styles.castle, { left: (viewState.length - 104 - cameraX) * scale, top: (GROUND_Y - 70) * scale }]}>
            <CastleSprite size={58 * scale} />
          </View>
          <View style={[styles.princess, { left: (viewState.length - 58 - cameraX) * scale, top: (GROUND_Y - 39) * scale }]}>
            <PrincessSprite size={24 * scale} />
          </View>

          <View style={[styles.ground, { top: GROUND_Y * scale, height: (SCENE_HEIGHT - GROUND_Y) * scale }]} />
          {liveObstacles.map((obstacle) =>
            obstacleView(obstacle, (obstacle.x - cameraX) * scale, scale, viewState.elapsed),
          )}
          {livePickups.map((pickup) =>
            <PickupSprite key={pickup.id} pickup={pickup} left={(pickup.x - cameraX) * scale} scale={scale} />,
          )}
          <Character
            color={tint}
            scale={scale}
            left={playerLeft}
            top={playerTop}
            invulnerable={viewState.invulnerable > 0}
            dash={viewState.dashTime > 0}
          />
          {cinematic && (
            <View style={styles.cinematicCover}>
              <Text style={styles.cinematicTitle}>ATLI PRENSESİ KAÇIRDI!</Text>
              <Animated.View style={[styles.horse, { transform: [{ translateX: horseX }] }]}>
                <HorseSprite size={54 * scale} />
                <View style={styles.dustPuffs}>
                  <View style={styles.dustPuff} /><View style={styles.dustPuff} /><View style={styles.dustPuff} />
                </View>
              </Animated.View>
            </View>
          )}

          <View style={[styles.hud, { top: 10 * scale, left: 10 * scale, right: 10 * scale }]}>
            <View style={styles.hpPill}>
              <Text style={styles.hpText}>♥ {viewState.player.hp}/{viewState.player.maxHp}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (viewState.player.x / viewState.length) * 100)}%` }]} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.controlRow}>
        <View style={styles.directionGroup}>
          <Pressable
            onPressIn={() => setHeld("left", true)}
            onPressOut={() => setHeld("left", false)}
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlPressed]}
            accessibilityLabel="Sola git"
          >
            <Text style={styles.controlGlyph}>◀</Text>
          </Pressable>
          <Pressable
            onPressIn={() => setHeld("right", true)}
            onPressOut={() => setHeld("right", false)}
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlPressed]}
            accessibilityLabel="Sağa git"
          >
            <Text style={styles.controlGlyph}>▶</Text>
          </Pressable>
        </View>
        <View style={styles.actionGroup}>
          <Pressable
            onPressIn={() => { pendingJump.current = true; playSound("jump", soundOn); }}
            style={({ pressed }) => [styles.jumpButton, pressed && styles.controlPressed]}
            accessibilityLabel="Zıpla"
          >
            <Text style={styles.actionGlyph}>↑</Text>
            <Text style={styles.actionLabel}>ZIPLA</Text>
          </Pressable>
          <Pressable
            onPressIn={() => { pendingDash.current = true; if (upgrades.dash) playSound("dash", soundOn); }}
            style={({ pressed }) => [styles.dashButton, pressed && styles.controlPressed, !upgrades.dash && styles.lockedButton]}
            accessibilityLabel={upgrades.dash ? "Atıl" : "Atılma kilitli"}
          >
            <Text style={styles.actionGlyph}>{upgrades.dash ? "➤" : "·"}</Text>
            <Text style={styles.actionLabel}>{upgrades.dash ? "ATIL" : "KİLİTLİ"}</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.controlHint}>Hareket için basılı tut · Zıplamak için dokun</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gamePage: { flex: 1, width: "100%", maxWidth: 560, alignSelf: "center", justifyContent: "center", paddingHorizontal: 14, paddingBottom: 12 },
  gameTop: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  leaveButton: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#202c3d", borderRadius: 12, borderWidth: 1, borderColor: "#514b43" },
  leaveText: { color: "#dbe8f5", fontWeight: "900", fontSize: 11, letterSpacing: 0.4 },
  levelLabel: { color: "#e7c77f", fontWeight: "900", fontSize: 12, letterSpacing: 1.3 },
  miniCurrency: { flexDirection: "row", gap: 9, alignItems: "center" },
  miniGold: { color: "#ffd75e", fontWeight: "900", fontSize: 12 },
  miniGem: { color: "#7ee7ed", fontWeight: "900", fontSize: 12 },
  stage: { width: "100%", maxWidth: 520, alignSelf: "center", aspectRatio: SCENE_WIDTH / SCENE_HEIGHT, borderWidth: 2, borderRadius: 18, borderColor: "#9b805e", overflow: "hidden", backgroundColor: "#182638" },
  sky: { width: "100%", backgroundColor: "#243446", overflow: "hidden" },
  moon: { position: "absolute", borderRadius: 99, backgroundColor: "#f1d799", elevation: 3 },
  cloud: { position: "absolute", width: 42, height: 17 },
  cloudPuffLeft: { position: "absolute", left: 3, bottom: 0, width: 21, height: 11, borderRadius: 99, backgroundColor: "rgba(236,223,196,0.5)" },
  cloudPuffTop: { position: "absolute", left: 13, top: 0, width: 17, height: 15, borderRadius: 99, backgroundColor: "rgba(236,223,196,0.58)" },
  cloudPuffRight: { position: "absolute", right: 2, bottom: 0, width: 20, height: 10, borderRadius: 99, backgroundColor: "rgba(236,223,196,0.48)" },
  castle: { position: "absolute" },
  princess: { position: "absolute" },
  ground: { position: "absolute", left: 0, right: 0, backgroundColor: "#354e47", borderTopWidth: 5, borderTopColor: "#b3a06c" },
  pit: { position: "absolute", backgroundColor: "#09111c", borderLeftWidth: 2, borderRightWidth: 2, borderColor: "#141b27" },
  pitGlow: { backgroundColor: "#d15b47" },
  crate: { position: "absolute", alignItems: "center", justifyContent: "center", backgroundColor: "#927052", borderWidth: 3, borderColor: "#57423b", borderRadius: 5 },
  platform: { position: "absolute", backgroundColor: "#88714f", borderTopWidth: 3, borderColor: "#d7b876", borderRadius: 4 },
  chain: { width: 3, alignSelf: "center", backgroundColor: "#afa58f" },
  axe: { backgroundColor: "#c6c9bf", borderRadius: 3, borderWidth: 3, borderColor: "#727c7c", marginLeft: -10 },
  pickup: { position: "absolute", borderWidth: 2, borderRadius: 99, backgroundColor: "#18283d", alignItems: "center", justifyContent: "center" },
  character: { position: "absolute", zIndex: 4 },
  helmet: { position: "absolute", left: 3, right: 3, top: 0, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderWidth: 1, borderColor: "#c7e6ff" },
  face: { position: "absolute", backgroundColor: "#ffdfa9", borderRadius: 2 },
  torso: { position: "absolute", borderRadius: 3, borderWidth: 1, borderColor: "#c7e6ff" },
  boot: { position: "absolute", width: 9, height: 6, backgroundColor: "#f0c078", borderRadius: 2 },
  sword: { position: "absolute", backgroundColor: "#e4f6ff", borderRadius: 2, transform: [{ rotate: "24deg" }] },
  cinematicCover: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(10,16,28,0.48)", alignItems: "center", justifyContent: "center", zIndex: 8 },
  cinematicTitle: { color: "#fff0c8", fontFamily: "serif", fontSize: 17, fontWeight: "700", letterSpacing: 1, marginBottom: 35 },
  horse: { position: "absolute", top: "52%", left: 0, alignItems: "center", flexDirection: "row" },
  dustPuffs: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 5, marginTop: 20 },
  dustPuff: { width: 10, height: 5, borderRadius: 99, backgroundColor: "rgba(240,216,177,0.68)" },
  hud: { position: "absolute", flexDirection: "row", alignItems: "center", gap: 10, zIndex: 6 },
  hpPill: { backgroundColor: "rgba(9,18,31,0.78)", paddingVertical: 5, paddingHorizontal: 9, borderRadius: 99, borderWidth: 1, borderColor: "#65778a" },
  hpText: { color: "#ff8990", fontSize: 11, fontWeight: "900" },
  progressTrack: { flex: 1, height: 7, borderRadius: 99, backgroundColor: "rgba(10,19,32,0.78)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99, backgroundColor: "#d9b46f" },
  controlRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 16, gap: 14 },
  directionGroup: { flexDirection: "row", gap: 10 },
  actionGroup: { flexDirection: "row", gap: 10 },
  controlButton: { width: 58, height: 58, borderRadius: 17, backgroundColor: "#263649", borderWidth: 1, borderColor: "#776850", alignItems: "center", justifyContent: "center" },
  controlPressed: { opacity: 0.74, transform: [{ scale: 0.96 }] },
  controlGlyph: { fontSize: 22, color: "#f1e6d3", fontWeight: "900" },
  jumpButton: { width: 68, height: 62, borderRadius: 17, backgroundColor: "#b87950", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e2c17f" },
  dashButton: { width: 68, height: 62, borderRadius: 17, backgroundColor: "#385966", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#7caaa9" },
  lockedButton: { backgroundColor: "#333d4a", borderColor: "#62645e" },
  actionGlyph: { fontSize: 21, color: "#fff2d8", fontWeight: "900", lineHeight: 23 },
  actionLabel: { fontSize: 8, color: "#fff2d8", fontWeight: "900", letterSpacing: 0.6 },
  controlHint: { color: "#a4a8ad", fontSize: 10, textAlign: "center", marginTop: 10 },
});