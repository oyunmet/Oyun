import { DoubleSide, Quaternion, Shape, Vector3 } from "three";
import type { CharacterId, VehicleId } from "../storage/profile";

type Point3 = [number, number, number];

const CAPE_SHAPE = (() => {
  const shape = new Shape();
  shape.moveTo(3, 54);
  shape.quadraticCurveTo(-3, 46, -7, 39);
  shape.quadraticCurveTo(-20, 34, -37, 27);
  shape.quadraticCurveTo(-31, 39, -22, 45);
  shape.quadraticCurveTo(-13, 52, 3, 56);
  shape.closePath();
  return shape;
})();

function Segment({
  start,
  end,
  color,
  radius,
  metalness = 0.45,
  roughness = 0.3,
}: {
  start: Point3;
  end: Point3;
  color: string;
  radius: number;
  metalness?: number;
  roughness?: number;
}) {
  const a = new Vector3(...start);
  const b = new Vector3(...end);
  const direction = b.clone().sub(a);
  const quaternion = new Quaternion().setFromUnitVectors(
    new Vector3(0, 1, 0),
    direction.clone().normalize(),
  );

  return (
    <mesh
      position={a.add(b).multiplyScalar(0.5)}
      quaternion={quaternion}
      castShadow
    >
      <cylinderGeometry args={[radius, radius, direction.length(), 12]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

function Ovoid({
  position,
  size,
  color,
  metalness = 0,
  roughness = 0.38,
}: {
  position: Point3;
  size: Point3;
  color: string;
  metalness?: number;
  roughness?: number;
}) {
  return (
    <mesh position={position} scale={size} castShadow>
      <sphereGeometry args={[1, 20, 14]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

export default function RoyalRider3D({
  character,
  vehicle,
  riderColor,
}: {
  character: CharacterId;
  vehicle: VehicleId;
  riderColor: string;
}) {
  const palette = character === "ranger"
    ? { cloth: "#315a43", cape: "#214333", plume: "#385446", gold: "#c7a467" }
    : character === "guardian"
      ? { cloth: "#593b52", cape: "#402b43", plume: "#633e54", gold: "#d3b078" }
      : { cloth: "#1e355d", cape: "#142747", plume: "#1a2c50", gold: "#d3ae68" };
  const cloth = riderColor || palette.cloth;
  const car = vehicle === "car";
  const z = car ? 15 : 8;
  const hip: Point3 = car ? [-3, 38, z] : [-6, 39, z];
  const shoulder: Point3 = car ? [3, 52, z] : [5, 55, z];
  const head: Point3 = car ? [7, 66, z] : [14, 71, z];
  const elbow: Point3 = car ? [14, 48, z + 3] : [20, 50, z + 3];
  const hand: Point3 = car ? [22, 43, z + 5] : [30, 45, z + 5];
  const knee: Point3 = car ? [9, 28, z] : [12, 26, z];
  const boot: Point3 = car ? [21, 24, z + 2] : [25, 18, z + 2];

  return (
    <group>
      {/* Flowing blue cape, kept behind the original silver-and-blue silhouette. */}
      <mesh position={[0, 0, z - 6]} castShadow>
        <extrudeGeometry
          args={[CAPE_SHAPE, { depth: 1.2, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.7, bevelThickness: 0.5 }]}
        />
        <meshStandardMaterial color={palette.cape} side={DoubleSide} roughness={0.68} />
      </mesh>
      <Segment start={[2, 53, z - 3.5]} end={[-10, 39, z - 3.5]} color={palette.gold} radius={0.72} metalness={0.58} />
      <Segment start={[-10, 39, z - 3.5]} end={[-35, 28, z - 3.5]} color={palette.gold} radius={0.72} metalness={0.58} />
      <Segment start={[-20, 38, z - 3.3]} end={[-29, 34, z - 3.3]} color="#8c744c" radius={0.48} />

      {/* Hair and plume remain visible behind the open-faced helmet. */}
      <Ovoid position={[head[0] - 6, head[1] + 1, z - 1]} size={[4.6, 6.2, 4.2]} color="#4b302c" roughness={0.58} />
      <Ovoid position={[head[0] - 5, head[1] + 8, z - 1.7]} size={[5.2, 8.5, 3.6]} color={palette.plume} roughness={0.52} />
      <Ovoid position={[head[0] - 10, head[1] + 13, z - 1.4]} size={[4.1, 7.5, 3.1]} color={palette.plume} roughness={0.52} />
      <Ovoid position={[head[0] - 14, head[1] + 16, z - 1]} size={[2.8, 5.6, 2.5]} color={palette.plume} roughness={0.5} />

      {/* Face: a shaped cheek, one clear blue eye, a small nose and a smile. */}
      <Ovoid position={head} size={[7.4, 8.2, 6.8]} color="#e8b58f" roughness={0.54} />
      <Ovoid position={[head[0] + 4.2, head[1] + 0.8, z + 6.1]} size={[1.9, 2.25, 1.45]} color="#fff9ea" roughness={0.26} />
      <Ovoid position={[head[0] + 4.8, head[1] + 0.7, z + 7.25]} size={[1.12, 1.42, 0.76]} color="#4d93ce" roughness={0.26} />
      <Ovoid position={[head[0] + 5.1, head[1] + 0.7, z + 7.83]} size={[0.53, 0.85, 0.42]} color="#1c2a36" roughness={0.22} />
      <Ovoid position={[head[0] + 5.35, head[1] + 1.28, z + 8.12]} size={[0.28, 0.34, 0.2]} color="#fff" roughness={0.16} />
      <Segment
        start={[head[0] + 2.6, head[1] + 3.3, z + 6.5]}
        end={[head[0] + 5.3, head[1] + 3.0, z + 6.3]}
        color="#56382f"
        radius={0.72}
        metalness={0.02}
        roughness={0.7}
      />
      <Ovoid position={[head[0] + 7.1, head[1] - 0.7, z + 5.7]} size={[1.4, 1.15, 1.15]} color="#e8b58f" roughness={0.56} />
      <Segment
        start={[head[0] + 4.8, head[1] - 2.8, z + 6.4]}
        end={[head[0] + 6.3, head[1] - 2.5, z + 6.1]}
        color="#8a4e43"
        radius={0.42}
        metalness={0.02}
        roughness={0.66}
      />

      {/* Silver domed helmet, gold crest hardware and an open face guard. */}
      <mesh position={[head[0] - 1, head[1] + 3.3, z - 0.1]} castShadow>
        <sphereGeometry args={[9.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#d7d7d0" metalness={0.78} roughness={0.24} />
      </mesh>
      <Segment
        start={[head[0] - 9, head[1] + 3.1, z + 1]}
        end={[head[0] + 7, head[1] + 3.1, z + 1]}
        color="#f0d9a0"
        radius={1.05}
        metalness={0.82}
        roughness={0.2}
      />
      <Ovoid position={[head[0] - 7.1, head[1] - 1.2, z + 5.7]} size={[2.1, 2.7, 1.15]} color="#b6b7b1" metalness={0.74} roughness={0.24} />
      <Ovoid position={[head[0] - 7.1, head[1] - 1.2, z + 6.8]} size={[1.12, 1.55, 0.52]} color={palette.gold} metalness={0.82} roughness={0.2} />
      <Segment start={[head[0] + 0.6, head[1] + 5.8, z + 4.7]} end={[head[0] + 5.8, head[1] + 5.8, z + 4.7]} color="#f1eadb" radius={0.55} metalness={0.85} roughness={0.2} />

      {/* Riding tunic, layered breastplate, shoulder guards and royal crest. */}
      <Ovoid position={[hip[0] + 3, shoulder[1] - 5, z - 0.1]} size={[8, 11.4, 5.1]} color={cloth} roughness={0.48} />
      <Ovoid position={[hip[0] + 3, shoulder[1] - 5.2, z + 4.5]} size={[9.1, 10.5, 3.8]} color={palette.gold} metalness={0.62} roughness={0.28} />
      <Ovoid position={[hip[0] + 3, shoulder[1] - 4.9, z + 5.5]} size={[7.8, 9.1, 3.4]} color="#c7cbd0" metalness={0.78} roughness={0.23} />
      <Segment start={[hip[0] - 3, hip[1] - 2, z + 3]} end={[hip[0] + 8, hip[1] - 2, z + 3]} color="#513d32" radius={1.8} metalness={0.18} roughness={0.48} />
      <Ovoid position={[hip[0] + 4, hip[1] - 2, z + 5]} size={[2, 1.7, 1]} color={palette.gold} metalness={0.83} roughness={0.22} />
      <mesh position={[hip[0] + 3, shoulder[1] - 5, z + 9]} rotation={[0.15, 0.25, 0.18]} castShadow>
        <octahedronGeometry args={[2.15, 0]} />
        <meshStandardMaterial color={palette.gold} metalness={0.88} roughness={0.18} />
      </mesh>
      <Ovoid position={[shoulder[0] - 1, shoulder[1] - 1, z + 3]} size={[6.2, 5.4, 4.7]} color={palette.gold} metalness={0.66} roughness={0.28} />
      <Ovoid position={[shoulder[0] - 1, shoulder[1] - 0.4, z + 4]} size={[5.2, 4.4, 4.1]} color="#d7d8d2" metalness={0.76} roughness={0.24} />
      <Ovoid position={[shoulder[0] + 4, shoulder[1] - 2, z - 1.4]} size={[5.4, 4.5, 3.7]} color="#aeb2b4" metalness={0.72} roughness={0.28} />

      {/* Both arms reach the handlebar; overlapping plates replace the stick figure. */}
      <Segment start={[shoulder[0], shoulder[1] - 4, z + 1]} end={elbow} color={cloth} radius={4.1} metalness={0.16} roughness={0.48} />
      <Ovoid position={[elbow[0], elbow[1], z + 4]} size={[4.2, 4.1, 3.6]} color="#bfc2c2" metalness={0.76} roughness={0.25} />
      <Segment start={elbow} end={hand} color="#d1d2cb" radius={3.2} metalness={0.78} roughness={0.23} />
      <Segment start={[shoulder[0] - 2, shoulder[1] - 5, z - 2]} end={[elbow[0] - 4, elbow[1] - 1, z - 2]} color={cloth} radius={3.6} metalness={0.12} roughness={0.52} />
      <Segment start={[elbow[0] - 4, elbow[1] - 1, z - 2]} end={[hand[0] - 1, hand[1] - 1, z - 1]} color="#bbbdb9" radius={2.8} metalness={0.72} roughness={0.28} />
      <Ovoid position={[hand[0], hand[1], z + 5]} size={[3, 2.6, 2.6]} color="#493a35" roughness={0.53} />
      <Ovoid position={[hand[0] - 1, hand[1] - 1, z - 1]} size={[2.5, 2.2, 2.1]} color="#493a35" roughness={0.55} />

      {/* Trousers, articulated greaves, knee plates and leather boots. */}
      <Segment start={[hip[0] + 1, hip[1] - 5, z]} end={[knee[0], knee[1], z + 1]} color={cloth} radius={4.6} metalness={0.12} roughness={0.5} />
      <Ovoid position={[knee[0], knee[1], z + 4]} size={[4.3, 4.3, 3.2]} color={palette.gold} metalness={0.7} roughness={0.25} />
      <Ovoid position={[knee[0], knee[1] + 0.2, z + 5]} size={[3.4, 3.4, 2.8]} color="#d6d7d0" metalness={0.8} roughness={0.23} />
      <Segment start={[knee[0], knee[1] - 1, z + 1]} end={boot} color="#d1d2cc" radius={3.1} metalness={0.76} roughness={0.24} />
      <Segment start={[hip[0] - 3, hip[1] - 6, z - 2]} end={[knee[0] - 11, knee[1] + 1, z - 2]} color={palette.cloth} radius={3.7} metalness={0.12} roughness={0.54} />
      <Segment start={[knee[0] - 11, knee[1] + 1, z - 2]} end={[boot[0] - 12, boot[1] + 1, z - 1]} color="#aeb2b5" radius={2.5} metalness={0.72} roughness={0.28} />
      <Ovoid position={[boot[0], boot[1], z + 2]} size={[5.7, 2.8, 3.3]} color="#49352d" roughness={0.52} />
      <Ovoid position={[boot[0] - 12, boot[1] + 1, z - 1]} size={[4.7, 2.5, 2.7]} color="#49352d" roughness={0.54} />
    </group>
  );
}
