import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Group } from "three";
import { View } from "react-native";
import { getBackgroundSpec, type BackgroundSpec } from "../game/backgrounds";
import { GROUND_Y, SCENE_HEIGHT, SCENE_WIDTH } from "../game/engine";
import type { GameState, Obstacle, Pickup } from "../game/engine";
import { getVehicleSpec } from "../game/vehicles";
import type { BackgroundId, CharacterId, VehicleId, VehicleModelId } from "../storage/profile";
import { Vehicle3DModel, WalkingMonster3D } from "./SceneModels3D";

type Props = {
  state: GameState;
  cameraX: number;
  character: CharacterId;
  vehicle: VehicleId;
  vehicleModel: VehicleModelId;
  riderColor: string;
  scale: number;
  backgroundId: BackgroundId;
};

const worldY = (pixelY: number) => SCENE_HEIGHT / 2 - pixelY;
const groundTop = worldY(GROUND_Y);
const GROUND_THICKNESS = SCENE_HEIGHT - GROUND_Y;
const GROUND_DEPTH = 82;

function Spikes({ width }: { width: number }) {
  const count = Math.max(2, Math.floor(width / 13));
  return (
    <group>
      {Array.from({ length: count }, (_, index) => {
        const spikeWidth = width / count;
        return (
          <group key={index} position={[-width / 2 + spikeWidth * (index + 0.5), 13, 0]}>
            <mesh castShadow>
              <coneGeometry args={[spikeWidth * 0.5, 27, 5]} />
              <meshStandardMaterial color="#d9e1d5" metalness={0.8} roughness={0.22} />
            </mesh>
            <mesh position={[0, -13.5, 0]}>
              <boxGeometry args={[spikeWidth, 3, 16]} />
              <meshStandardMaterial color="#564344" roughness={0.66} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function WoodenCrate({ width }: { width: number }) {
  return (
    <group position={[0, 17, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 34, 23]} />
        <meshStandardMaterial color="#9a6845" roughness={0.57} />
      </mesh>
      <mesh position={[0, 0, 12]}>
        <boxGeometry args={[width + 1, 3, 1.5]} />
        <meshStandardMaterial color="#e4c38a" metalness={0.22} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 13]}>
        <boxGeometry args={[4, 33, 1.8]} />
        <meshStandardMaterial color="#d4ae77" roughness={0.48} />
      </mesh>
      <mesh position={[0, 0, 13.2]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[4, Math.sqrt(width * width + 34 * 34), 1.6]} />
        <meshStandardMaterial color="#ddbd85" roughness={0.48} />
      </mesh>
      <mesh position={[0, 0, 13.3]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[4, Math.sqrt(width * width + 34 * 34), 1.6]} />
        <meshStandardMaterial color="#ddbd85" roughness={0.48} />
      </mesh>
      <mesh position={[0, 17.5, 0]}>
        <boxGeometry args={[width + 5, 3, 28]} />
        <meshStandardMaterial color="#d6b781" metalness={0.18} roughness={0.42} />
      </mesh>
    </group>
  );
}

function GroundSegment({
  start,
  end,
  ground,
}: {
  start: number;
  end: number;
  ground: BackgroundSpec;
}) {
  const width = end - start;
  if (width < 1) return null;
  const center = (start + end) / 2;
  const royal = ground.id === "royal";
  const roadSurface = royal ? ground.farHill : ground.ground;
  const cliffFace = royal ? "#52616a" : ground.nearHill;

  return (
    <group>
      <mesh position={[center, groundTop - GROUND_THICKNESS / 2, -4]} receiveShadow>
        <boxGeometry args={[width, GROUND_THICKNESS, GROUND_DEPTH]} />
        <meshStandardMaterial attach="material-0" color={ground.farHill} roughness={0.88} />
        <meshStandardMaterial attach="material-1" color={ground.nearHill} roughness={0.9} />
        <meshStandardMaterial attach="material-2" color={roadSurface} roughness={0.86} />
        <meshStandardMaterial attach="material-3" color={ground.farHill} roughness={0.94} />
        <meshStandardMaterial attach="material-4" color={cliffFace} roughness={0.86} />
        <meshStandardMaterial attach="material-5" color={ground.farHill} roughness={0.92} />
      </mesh>
      <mesh position={[center, groundTop - 0.7, 0]} receiveShadow>
        <boxGeometry args={[width, 1.5, GROUND_DEPTH - 6]} />
        <meshStandardMaterial color={roadSurface} roughness={0.82} />
      </mesh>
      {[-8, -18, -29, -41].map((depth, index) => (
        <mesh key={`strata-${depth}`} position={[center, groundTop + depth, GROUND_DEPTH / 2 - 4]}>
          <boxGeometry args={[width, 0.55, 0.7]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? ground.accent : ground.farHill}
            transparent
            opacity={index % 2 === 0 ? 0.48 : 0.34}
            roughness={0.88}
          />
        </mesh>
      ))}
      {[-31, 31].map((z) => (
        <mesh key={z} position={[center, groundTop - 0.12, z]}>
          <boxGeometry args={[width, 0.5, 0.8]} />
          <meshStandardMaterial color={ground.accent} metalness={0.28} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function Pit3D({ width, ground }: { width: number; ground: BackgroundSpec }) {
  const innerWidth = Math.max(12, width - 12);
  return (
    <group>
      <mesh position={[0, -39, -3]} receiveShadow>
        <boxGeometry args={[innerWidth, 2, GROUND_DEPTH - 8]} />
        <meshStandardMaterial color="#392f3d" roughness={0.95} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (width / 2 - 3), -20, 0]}>
          <mesh rotation={[0, 0, side * -0.08]} castShadow receiveShadow>
            <boxGeometry args={[6, 40, GROUND_DEPTH - 4]} />
            <meshStandardMaterial color={ground.nearHill} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0, 27]}>
            <boxGeometry args={[2, 35, 2]} />
            <meshStandardMaterial color={ground.farHill} roughness={0.88} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`lip-${side}`} position={[side * (width / 2 + 1), -0.5, 27]}>
          <boxGeometry args={[7, 3, 15]} />
          <meshStandardMaterial color={ground.accent} metalness={0.24} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, -37.5, 3]}>
        <octahedronGeometry args={[4.5, 0]} />
        <meshStandardMaterial color="#bf6d61" emissive="#7c352f" emissiveIntensity={0.22} roughness={0.55} />
      </mesh>
    </group>
  );
}

function SwingingAxe({ phase }: { phase: number }) {
  const pivot = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (pivot.current) pivot.current.rotation.z = Math.sin(clock.elapsedTime * 4 + phase) * 0.5;
  });

  return (
    <group position={[0, 45, 1]}>
      <mesh position={[0, 13, -2]}>
        <cylinderGeometry args={[1.2, 1.2, 44, 8]} />
        <meshStandardMaterial color="#e5d8b8" metalness={0.7} roughness={0.25} />
      </mesh>
      <group ref={pivot} position={[0, -8, 0]}>
        <mesh position={[0, -16, 0]} castShadow>
          <cylinderGeometry args={[2.5, 2.5, 36, 8]} />
          <meshStandardMaterial color="#826044" roughness={0.48} />
        </mesh>
        <mesh position={[11, -5, 1]} rotation={[0, 0, -0.25]} castShadow>
          <boxGeometry args={[23, 16, 6]} />
          <meshStandardMaterial color="#c9d2ce" metalness={0.9} roughness={0.17} />
        </mesh>
        <mesh position={[15, -2, 4]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[15, 2, 1]} />
          <meshStandardMaterial color="#fff6dc" emissive="#fff0c2" emissiveIntensity={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function Obstacle3D({
  obstacle,
  elapsed,
  ground,
}: {
  obstacle: Obstacle;
  elapsed: number;
  ground: BackgroundSpec;
}) {
  if (obstacle.broken) return null;
  const width = obstacle.width;

  if (obstacle.kind === "monster") {
    return <WalkingMonster3D phase={obstacle.patrolPhase ?? obstacle.x} elapsed={elapsed} />;
  }
  if (obstacle.kind === "platform") {
    const top = obstacle.y ?? GROUND_Y - 56;
    const topWorld = worldY(top);
    return (
      <group position={[0, topWorld - 8, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[width, 17, 24]} />
          <meshStandardMaterial color="#8e7652" roughness={0.58} />
        </mesh>
        <mesh position={[0, 8.5, 0.3]}>
          <boxGeometry args={[width + 3, 3, 27]} />
          <meshStandardMaterial color="#e0c88f" metalness={0.2} roughness={0.4} />
        </mesh>
      </group>
    );
  }
  if (obstacle.kind === "pit") {
    return <Pit3D width={width} ground={ground} />;
  }
  if (obstacle.kind === "spikes") {
    return <Spikes width={width} />;
  }
  if (obstacle.kind === "crate") {
    return <WoodenCrate width={width} />;
  }
  return <SwingingAxe phase={obstacle.x + elapsed} />;
}

function Pickup3D({ pickup, elapsed }: { pickup: Pickup; elapsed: number }) {
  const ref = useRef<Group>(null);
  const y = worldY(pickup.y);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = y + Math.sin(clock.elapsedTime * 2.8 + pickup.x * 0.04) * 2.2;
    ref.current.rotation.y += 0.015;
  });

  return (
    <group ref={ref} position={[0, y, 17]}>
      {pickup.kind === "gold" ? (
        <>
          <mesh castShadow>
            <cylinderGeometry args={[8, 8, 2.7, 12]} />
            <meshStandardMaterial color="#e9b84d" metalness={0.86} roughness={0.18} />
          </mesh>
          <mesh position={[0, 0, 1.8]}>
            <torusGeometry args={[5.2, 0.9, 6, 12]} />
            <meshStandardMaterial color="#fff0b3" metalness={0.82} roughness={0.19} />
          </mesh>
        </>
      ) : pickup.kind === "gem" ? (
        <mesh castShadow rotation={[0.18, 0.45, 0.3]}>
          <octahedronGeometry args={[11, 0]} />
          <meshPhysicalMaterial color="#75d7d2" emissive="#2e8e9a" emissiveIntensity={0.22} metalness={0.58} roughness={0.12} clearcoat={1} />
        </mesh>
      ) : (
        <group>
          <mesh position={[-4, 3, 0]}>
            <sphereGeometry args={[5.5, 12, 10]} />
            <meshStandardMaterial color="#ed6f74" roughness={0.3} />
          </mesh>
          <mesh position={[4, 3, 0]}>
            <sphereGeometry args={[5.5, 12, 10]} />
            <meshStandardMaterial color="#ed6f74" roughness={0.3} />
          </mesh>
          <mesh position={[0, -3, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[10, 10, 6]} />
            <meshStandardMaterial color="#ed6f74" roughness={0.3} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function World({
  state,
  cameraX,
  character,
  vehicle,
  vehicleModel,
  riderColor,
  backgroundId,
}: Omit<Props, "scale">) {
  const vehicleSpec = getVehicleSpec(vehicle);
  const ground = getBackgroundSpec(backgroundId);
  const visibleObstacles = state.obstacles.filter(
    (obstacle) => obstacle.x + obstacle.width > cameraX - 80 && obstacle.x < cameraX + SCENE_WIDTH + 80,
  );
  const visiblePickups = state.pickups.filter(
    (pickup) => !pickup.collected && pickup.x > cameraX - 32 && pickup.x < cameraX + SCENE_WIDTH + 32,
  );
  const pits = state.obstacles
    .filter((obstacle) => obstacle.kind === "pit" && !obstacle.broken)
    .sort((a, b) => a.x - b.x);
  const groundSegments: { start: number; end: number }[] = [];
  let groundCursor = -320;
  const groundEnd = state.length + 320;
  for (const pit of pits) {
    const pitStart = Math.max(groundCursor, pit.x);
    const pitEnd = Math.min(groundEnd, pit.x + pit.width);
    if (pitStart > groundCursor) groundSegments.push({ start: groundCursor, end: pitStart });
    groundCursor = Math.max(groundCursor, pitEnd);
  }
  if (groundCursor < groundEnd) groundSegments.push({ start: groundCursor, end: groundEnd });
  const lift = Math.max(0, GROUND_Y - (state.player.y + vehicleSpec.hitboxHeight));
  const groundMarkers = Array.from(
    { length: Math.ceil(state.length / 160) },
    (_, index) => 70 + index * 160,
  ).filter((x) =>
    Math.abs(x - state.player.x) > 56 &&
    !state.obstacles.some((obstacle) => x > obstacle.x - 28 && x < obstacle.x + obstacle.width + 28),
  );

  return (
    <>
      <ambientLight intensity={0.88} />
      <directionalLight position={[-45, 115, 85]} intensity={2.35} color="#fff1d7" />
      <directionalLight position={[120, 35, 50]} intensity={0.82} color="#bfdcff" />
      <group position={[-cameraX, 0, 0]}>
        {groundSegments.map((segment, index) => (
          <GroundSegment key={`${segment.start}-${index}`} {...segment} ground={ground} />
        ))}
        {groundMarkers.map((x) => (
          <mesh key={`stone-${x}`} position={[x, groundTop + 2.1, 28]} rotation={[0, 0, x * 0.017]}>
            <dodecahedronGeometry args={[2.6 + ((x / 16) % 1), 0]} />
            <meshStandardMaterial color={ground.accent} metalness={0.12} roughness={0.76} />
          </mesh>
        ))}
        {visibleObstacles.map((obstacle) => (
          <group
            key={obstacle.id}
            position={[
              obstacle.x + obstacle.width / 2,
              obstacle.kind === "platform" ? 0 : groundTop,
              obstacle.kind === "monster" ? 3 : 0,
            ]}
            rotation={obstacle.kind === "monster" && state.player.direction < 0 ? [0, Math.PI, 0] : [0, 0, 0]}
          >
            <Obstacle3D obstacle={obstacle} elapsed={state.elapsed} ground={ground} />
          </group>
        ))}
        {visiblePickups.map((pickup) => (
          <group key={pickup.id} position={[pickup.x, 0, 0]}>
            <Pickup3D pickup={pickup} elapsed={state.elapsed} />
          </group>
        ))}
        <group
          position={[
            state.player.x + vehicleSpec.hitboxWidth / 2,
            groundTop + lift,
            5,
          ]}
          rotation={[0, 0, state.player.grounded ? Math.sin(state.elapsed * 8) * 0.018 : Math.max(-0.08, Math.min(0.1, state.player.vy / 4200))]}
          scale={[state.player.direction * (state.dashTime > 0 ? 1.06 : 1), 1, 1]}
        >
          <mesh position={[0, 0.3, 14]} rotation={[-Math.PI / 2, 0, 0]} scale={[42, 12, 1]}>
            <circleGeometry args={[1, 20]} />
            <meshBasicMaterial color="#101c28" transparent opacity={0.22} depthWrite={false} />
          </mesh>
          <Vehicle3DModel
            vehicle={vehicle}
            model={vehicleModel}
            character={character}
            riderColor={riderColor}
            elapsed={state.elapsed}
          />
        </group>
      </group>
    </>
  );
}

export default function GameScene3D(props: Props) {
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
      <Canvas
        orthographic
        dpr={1}
        camera={{
          left: -SCENE_WIDTH / 2,
          right: SCENE_WIDTH / 2,
          top: SCENE_HEIGHT / 2,
          bottom: -SCENE_HEIGHT / 2,
          near: 0.1,
          far: 500,
          position: [SCENE_WIDTH / 2, 26, 85],
          rotation: [-Math.atan2(26, 85), 0, 0],
        }}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        <World {...props} />
      </Canvas>
    </View>
  );
}
