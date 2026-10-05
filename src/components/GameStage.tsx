import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { HorseSprite } from "./GameSprites";
import GameBackdrop from "./GameBackdrop";
import { GameObstacle, GamePickup, GameTerrain } from "./GameWorldArt";
import VehicleSprite from "./VehicleSprite";
import {
  createGameState,
  GameInput,
  GameState,
  GROUND_Y,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  stepGame,
} from "../game/engine";
import { EngineUpgrades } from "../game/engine";
import { getVehicleSpec } from "../game/vehicles";
import { BackgroundId, CharacterId, UpgradeKey, VehicleId, VehicleModelId } from "../storage/profile";
import { playSound } from "../audio/sounds";

const SKINS = ["#3b82f6", "#ef5b59", "#55bd87", "#d28d45", "#b57be0", "#ec7eaa"];
const WEB_TOUCH_STYLE = {
  userSelect: "none",
  touchAction: "none",
  WebkitUserSelect: "none",
  WebkitTouchCallout: "none",
  WebkitTapHighlightColor: "transparent",
} as unknown as ViewStyle;

type Props = {
  level: number;
  character: CharacterId;
  vehicle: VehicleId;
  vehicleModel: VehicleModelId;
  backgroundId: BackgroundId;
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
  };
}

export default function GameStage({ level, character, vehicle, vehicleModel, backgroundId, upgrades, skin, soundOn, onExit, onComplete, onGameOver }: Props) {
  const input = useRef<GameInput>({ left: false, right: false, jump: false, dash: false });
  const pendingJump = useRef(false);
  const pendingDash = useRef(false);
  const pointerHolds = useRef(new Map<string, "left" | "right">());
  const lastUiUpdate = useRef(0);
  const animationFrame = useRef<number | null>(null);
  const stateRef = useRef(createGameState(level, upgrades as EngineUpgrades, vehicle));
  const [viewState, setViewState] = useState(() => snapshot(stateRef.current));
  const [stageWidth, setStageWidth] = useState(SCENE_WIDTH);
  const [cinematic, setCinematic] = useState(false);
  const horseX = useRef(new Animated.Value(SCENE_WIDTH + 75)).current;
  const lastTime = useRef(0);
  const resultSent = useRef(false);
  const scale = stageWidth / SCENE_WIDTH;
  const vehicleSpec = getVehicleSpec(vehicle);
  const cameraX = Math.max(0, Math.min(viewState.length - SCENE_WIDTH, viewState.player.x - 126));
  const playerLeft = (viewState.player.x - cameraX - (vehicleSpec.spriteWidth - vehicleSpec.hitboxWidth) / 2) * scale;
  const playerTop = (viewState.player.y + vehicleSpec.hitboxHeight - vehicleSpec.spriteHeight) * scale;
  const tint = SKINS[skin] ?? SKINS[0];
  const rideBob = viewState.player.grounded ? Math.sin(viewState.elapsed * 13) * 1.1 : 0;
  const rideLean = viewState.player.grounded
    ? Math.sin(viewState.elapsed * 8) * 1.6
    : Math.max(-5, Math.min(7, viewState.player.vy / 48));

  const measureStage = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width;
    if (measured > 0 && Math.abs(measured - stageWidth) > 1) setStageWidth(measured);
  };

  useEffect(() => {
    stateRef.current = createGameState(level, upgrades as EngineUpgrades, vehicle);
    setViewState(snapshot(stateRef.current));
    input.current = { left: false, right: false, jump: false, dash: false };
    lastTime.current = 0;
    lastUiUpdate.current = 0;
    pointerHolds.current.clear();
    pendingJump.current = false;
    pendingDash.current = false;
    setCinematic(false);
    resultSent.current = false;
    horseX.setValue(SCENE_WIDTH + 75);
  }, [level, upgrades, vehicle, horseX]);

  useEffect(() => {
    let active = true;
    let scheduled = false;
    const scheduleFrame = () => {
      if (!active || scheduled || (Platform.OS === "web" && typeof document !== "undefined" && document.visibilityState === "hidden")) return;
      scheduled = true;
      animationFrame.current = requestAnimationFrame(loop);
    };
    const loop = (now: number) => {
      scheduled = false;
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
      if (now - lastUiUpdate.current >= 1000 / 30 && !stateRef.current.ended) {
        lastUiUpdate.current = now;
        setViewState(snapshot(stateRef.current));
      }
      if (!stateRef.current.ended) scheduleFrame();
    };
    const handleVisibilityChange = () => {
      lastTime.current = 0;
      if (document.visibilityState === "hidden") {
        if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
        scheduled = false;
      } else {
        scheduleFrame();
      }
    };
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    scheduleFrame();
    return () => {
      active = false;
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
      if (Platform.OS === "web" && typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      lastTime.current = 0;
    };
  }, [upgrades, soundOn, onComplete, onGameOver, horseX]);

  const setHeld = (key: "left" | "right", held: boolean) => {
    input.current[key] = held || Array.from(pointerHolds.current.values()).includes(key);
  };
  const triggerJump = useCallback(() => {
    pendingJump.current = true;
    playSound("jump", soundOn);
  }, [soundOn]);
  const triggerDash = useCallback(() => {
    pendingDash.current = true;
    if (upgrades.dash) playSound("dash", soundOn);
  }, [soundOn, upgrades.dash]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const touchStyle = document.createElement("style");
    touchStyle.dataset.sarayaControlGuard = "true";
    touchStyle.textContent = `
      #saraya-game-controls,
      #saraya-game-controls * {
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
        touch-action: none !important;
      }
    `;
    document.head.appendChild(touchStyle);

    const getControl = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      const control = target.closest<HTMLElement>('[id^="saraya-control-"]');
      const action = control?.id.replace("saraya-control-", "");
      return action === "left" || action === "right" || action === "jump" || action === "dash"
        ? action
        : null;
    };
    const syncMovement = () => {
      const held = Array.from(pointerHolds.current.values());
      input.current.left = held.includes("left");
      input.current.right = held.includes("right");
    };
    const handleTouchStart = (event: TouchEvent) => {
      const action = getControl(event.target);
      if (!action) return;
      if (event.cancelable) event.preventDefault();

      if (action === "left" || action === "right") {
        for (const touch of Array.from(event.changedTouches)) {
          pointerHolds.current.set(`touch:${touch.identifier}`, action);
        }
        syncMovement();
      } else if (action === "jump") {
        triggerJump();
      } else {
        triggerDash();
      }
    };
    const handleTouchEnd = (event: TouchEvent) => {
      let handled = getControl(event.target) !== null;
      for (const touch of Array.from(event.changedTouches)) {
        const key = `touch:${touch.identifier}`;
        if (pointerHolds.current.has(key)) {
          pointerHolds.current.delete(key);
          handled = true;
        }
      }
      if (!handled) return;
      if (event.cancelable) event.preventDefault();
      syncMovement();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const action = getControl(event.target);
      if (!action) return;
      if (event.cancelable) event.preventDefault();
      if (action === "left" || action === "right") {
        pointerHolds.current.set(`pointer:${event.pointerId}`, action);
        syncMovement();
      } else if (action === "jump") {
        triggerJump();
      } else {
        triggerDash();
      }
    };
    const handlePointerEnd = (event: PointerEvent) => {
      const key = `pointer:${event.pointerId}`;
      if (!pointerHolds.current.has(key)) return;
      pointerHolds.current.delete(key);
      syncMovement();
      if (event.cancelable) event.preventDefault();
    };
    const preventControlSelection = (event: Event) => {
      if (getControl(event.target) && event.cancelable) event.preventDefault();
    };
    const nonPassiveCapture = { capture: true, passive: false } as const;
    document.addEventListener("touchstart", handleTouchStart, nonPassiveCapture);
    document.addEventListener("touchend", handleTouchEnd, nonPassiveCapture);
    document.addEventListener("touchcancel", handleTouchEnd, nonPassiveCapture);
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("pointerup", handlePointerEnd, true);
    document.addEventListener("pointercancel", handlePointerEnd, true);
    document.addEventListener("contextmenu", preventControlSelection, true);
    document.addEventListener("selectstart", preventControlSelection, true);
    document.addEventListener("dragstart", preventControlSelection, true);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart, true);
      document.removeEventListener("touchend", handleTouchEnd, true);
      document.removeEventListener("touchcancel", handleTouchEnd, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("pointerup", handlePointerEnd, true);
      document.removeEventListener("pointercancel", handlePointerEnd, true);
      document.removeEventListener("contextmenu", preventControlSelection, true);
      document.removeEventListener("selectstart", preventControlSelection, true);
      document.removeEventListener("dragstart", preventControlSelection, true);
      touchStyle.remove();
      pointerHolds.current.clear();
      input.current.left = false;
      input.current.right = false;
    };
  }, [triggerDash, triggerJump]);
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
          <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
            <GameBackdrop cameraX={cameraX} elapsed={viewState.elapsed} level={level} theme={backgroundId} />
          </View>
          <GameTerrain scale={scale} theme={backgroundId} />
          {liveObstacles.map((obstacle) =>
            <GameObstacle
              key={obstacle.id}
              obstacle={obstacle}
              left={(obstacle.x - cameraX) * scale}
              scale={scale}
              elapsed={viewState.elapsed}
            />,
          )}
          {livePickups.map((pickup) =>
            <GamePickup
              key={pickup.id}
              pickup={pickup}
              centerX={(pickup.x - cameraX) * scale}
              scale={scale}
              elapsed={viewState.elapsed}
            />,
          )}
          <View
            style={[
              styles.vehicleSprite,
              { pointerEvents: "none" },
              {
                left: playerLeft,
                top: playerTop,
                width: vehicleSpec.spriteWidth * scale,
                height: vehicleSpec.spriteHeight * scale,
                opacity: viewState.invulnerable > 0 ? 0.58 : 1,
                transform: [
                  { translateY: rideBob * scale },
                  { rotate: `${rideLean}deg` },
                  { scaleX: viewState.player.direction * (viewState.dashTime > 0 ? 1.08 : 1) },
                ],
              },
            ]}
          >
            <VehicleSprite
              vehicle={vehicle}
              model={vehicleModel}
              character={character}
              riderColor={tint}
              width={vehicleSpec.spriteWidth * scale}
              height={vehicleSpec.spriteHeight * scale}
              elapsed={viewState.elapsed}
              wheelRotation={((viewState.player.x - 34) / (vehicle === "car" ? 10.5 : 14)) * (180 / Math.PI)}
            />
          </View>
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

      <View
        nativeID="saraya-game-controls"
        style={[styles.controlRow, Platform.OS === "web" && WEB_TOUCH_STYLE]}
      >
        <View style={styles.directionGroup}>
          <Pressable
            nativeID="saraya-control-left"
            onPressIn={Platform.OS === "web" ? undefined : () => setHeld("left", true)}
            onPressOut={Platform.OS === "web" ? undefined : () => setHeld("left", false)}
            style={({ pressed }) => [styles.controlButton, Platform.OS === "web" && WEB_TOUCH_STYLE, pressed && styles.controlPressed]}
            accessibilityLabel="Sola git"
            accessibilityRole="button"
          >
            <Text selectable={false} style={styles.controlGlyph}>◀</Text>
          </Pressable>
          <Pressable
            nativeID="saraya-control-right"
            onPressIn={Platform.OS === "web" ? undefined : () => setHeld("right", true)}
            onPressOut={Platform.OS === "web" ? undefined : () => setHeld("right", false)}
            style={({ pressed }) => [styles.controlButton, Platform.OS === "web" && WEB_TOUCH_STYLE, pressed && styles.controlPressed]}
            accessibilityLabel="Sağa git"
            accessibilityRole="button"
          >
            <Text selectable={false} style={styles.controlGlyph}>▶</Text>
          </Pressable>
        </View>
        <View style={styles.actionGroup}>
          <Pressable
            nativeID="saraya-control-jump"
            onPressIn={Platform.OS === "web" ? undefined : triggerJump}
            style={({ pressed }) => [styles.jumpButton, Platform.OS === "web" && WEB_TOUCH_STYLE, pressed && styles.controlPressed]}
            accessibilityLabel="Zıpla"
            accessibilityRole="button"
          >
            <Text selectable={false} style={styles.actionGlyph}>↑</Text>
            <Text selectable={false} style={styles.actionLabel}>ZIPLA</Text>
          </Pressable>
          <Pressable
            nativeID="saraya-control-dash"
            onPressIn={Platform.OS === "web" ? undefined : triggerDash}
            style={({ pressed }) => [styles.dashButton, Platform.OS === "web" && WEB_TOUCH_STYLE, pressed && styles.controlPressed, !upgrades.dash && styles.lockedButton]}
            accessibilityLabel={upgrades.dash ? "Atıl" : "Atılma kilitli"}
            accessibilityRole="button"
          >
            <Text selectable={false} style={styles.actionGlyph}>{upgrades.dash ? "➤" : "·"}</Text>
            <Text selectable={false} style={styles.actionLabel}>{upgrades.dash ? "ATIL" : "KİLİTLİ"}</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.controlHint}>Hareket için basılı tut · Zıplamak için dokun</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gamePage: { flex: 1, width: "100%", maxWidth: 560, alignSelf: "center", justifyContent: "center", paddingHorizontal: 14, paddingBottom: 12, backgroundColor: "#f4f7fb" },
  gameTop: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  leaveButton: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#e6edff", borderRadius: 12, borderWidth: 1, borderColor: "#d1dcf2" },
  leaveText: { color: "#425779", fontWeight: "900", fontSize: 11, letterSpacing: 0.4 },
  levelLabel: { color: "#687ba1", fontWeight: "900", fontSize: 12, letterSpacing: 1.3 },
  miniCurrency: { flexDirection: "row", gap: 9, alignItems: "center" },
  miniGold: { color: "#d79b1f", fontWeight: "900", fontSize: 12 },
  miniGem: { color: "#36a7bc", fontWeight: "900", fontSize: 12 },
  stage: { width: "100%", maxWidth: 520, alignSelf: "center", aspectRatio: SCENE_WIDTH / SCENE_HEIGHT, borderWidth: 2, borderRadius: 18, borderColor: "#a8b5e8", overflow: "hidden", backgroundColor: "#dff1ff", boxShadow: "0px 12px 22px rgba(67, 87, 129, 0.18)" },
  sky: { width: "100%", backgroundColor: "#dff1ff", overflow: "hidden" },
  vehicleSprite: { position: "absolute", zIndex: 4, alignItems: "center", justifyContent: "center" },
  cinematicCover: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(10,16,28,0.48)", alignItems: "center", justifyContent: "center", zIndex: 8 },
  cinematicTitle: { color: "#fff0c8", fontFamily: "serif", fontSize: 17, fontWeight: "700", letterSpacing: 1, marginBottom: 35 },
  horse: { position: "absolute", top: "52%", left: 0, alignItems: "center", flexDirection: "row" },
  dustPuffs: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 5, marginTop: 20 },
  dustPuff: { width: 10, height: 5, borderRadius: 99, backgroundColor: "rgba(240,216,177,0.68)" },
  hud: { position: "absolute", flexDirection: "row", alignItems: "center", gap: 10, zIndex: 6 },
  hpPill: { backgroundColor: "rgba(255,255,255,0.9)", paddingVertical: 5, paddingHorizontal: 9, borderRadius: 99, borderWidth: 1, borderColor: "#e2dce8" },
  hpText: { color: "#dc6680", fontSize: 11, fontWeight: "900" },
  progressTrack: { flex: 1, height: 7, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.84)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99, backgroundColor: "#8e94ec" },
  controlRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 16, gap: 14 },
  directionGroup: { flexDirection: "row", gap: 10 },
  actionGroup: { flexDirection: "row", gap: 10 },
  controlButton: { width: 58, height: 58, borderRadius: 17, backgroundColor: "#e6eaff", borderWidth: 1, borderColor: "#c6cdef", alignItems: "center", justifyContent: "center", boxShadow: "0px 4px 8px rgba(86, 106, 160, 0.12)" },
  controlPressed: { opacity: 0.74, transform: [{ scale: 0.96 }] },
  controlGlyph: { fontSize: 22, color: "#5b6799", fontWeight: "900" },
  jumpButton: { width: 68, height: 62, borderRadius: 17, backgroundColor: "#ffd66e", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#f2be45", boxShadow: "0px 5px 10px rgba(214, 163, 53, 0.2)" },
  dashButton: { width: 68, height: 62, borderRadius: 17, backgroundColor: "#86dccd", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#61c7b6", boxShadow: "0px 5px 10px rgba(62, 173, 158, 0.18)" },
  lockedButton: { backgroundColor: "#e5e9f1", borderColor: "#d3d9e4" },
  actionGlyph: { fontSize: 21, color: "#344965", fontWeight: "900", lineHeight: 23 },
  actionLabel: { fontSize: 8, color: "#344965", fontWeight: "900", letterSpacing: 0.6 },
  controlHint: { color: "#7c8ba5", fontSize: 10, textAlign: "center", marginTop: 10 },
});