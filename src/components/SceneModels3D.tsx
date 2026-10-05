import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Quaternion, Vector3 } from "three";
import { getVehicleModelSpec } from "../game/vehicles";
import type { CharacterId, VehicleId, VehicleModelId } from "../storage/profile";

type VehicleProps = {
  vehicle: VehicleId;
  model: VehicleModelId;
  character: CharacterId;
  riderColor: string;
  elapsed?: number;
};

function Bar({
  start,
  end,
  color,
  radius = 2,
  metalness = 0.55,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  radius?: number;
  metalness?: number;
}) {
  const a = new Vector3(...start);
  const b = new Vector3(...end);
  const direction = b.clone().sub(a);
  const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize());
  const midpoint = a.add(b).multiplyScalar(0.5);

  return (
    <mesh position={midpoint} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius, radius, direction.length(), 9]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={0.32} />
    </mesh>
  );
}

function Wheel3D({
  x,
  y,
  radius,
  elapsed,
  tire = "#20242d",
}: {
  x: number;
  y: number;
  radius: number;
  elapsed: number;
  tire?: string;
}) {
  return (
    <group position={[x, y, 0]} rotation={[0, 0, elapsed * -4]}>
      <mesh castShadow>
        <torusGeometry args={[radius, radius * 0.105, 8, 28]} />
        <meshStandardMaterial color={tire} roughness={0.62} />
      </mesh>
      <mesh position={[0, 0, 0.8]}>
        <torusGeometry args={[radius * 0.69, radius * 0.045, 7, 24]} />
        <meshStandardMaterial color="#d4bd8d" metalness={0.82} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0, 1]}>
        <cylinderGeometry args={[radius * 0.16, radius * 0.16, 1.8, 16]} />
        <meshStandardMaterial color="#f2d892" metalness={0.75} roughness={0.2} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        return (
          <Bar
            key={index}
            start={[Math.cos(angle) * radius * 0.14, Math.sin(angle) * radius * 0.14, 1.2]}
            end={[Math.cos(angle) * radius * 0.68, Math.sin(angle) * radius * 0.68, 1.2]}
            color="#d8d2c2"
            radius={0.65}
          />
        );
      })}
    </group>
  );
}

function Rider3D({
  character,
  vehicle,
  riderColor,
}: Pick<VehicleProps, "character" | "vehicle" | "riderColor">) {
  const outfit = character === "ranger" ? "#376b4d" : character === "guardian" ? "#75445f" : "#284269";
  const armor = "#d9c9a5";
  const car = vehicle === "car";
  const z = car ? 15 : 8;
  const hip: [number, number, number] = car ? [-3, 38, z] : [-6, 39, z];
  const shoulder: [number, number, number] = car ? [3, 52, z] : [5, 56, z];
  const head: [number, number, number] = car ? [7, 66, z] : [14, 71, z];
  const hand: [number, number, number] = car ? [22, 43, z + 1] : [29, 47, z + 1];
  const knee: [number, number, number] = car ? [9, 28, z] : [11, 25, z];
  const boot: [number, number, number] = car ? [21, 27, z + 1] : [24, 18, z + 1];

  return (
    <group>
      <mesh position={[hip[0] - 12, hip[1] + 6, z - 2]} rotation={[0, 0, -0.55]} castShadow>
        <boxGeometry args={[25, 17, 2.6]} />
        <meshStandardMaterial color={outfit} roughness={0.42} />
      </mesh>
      <mesh position={hip} rotation={[0, 0, -0.38]} castShadow>
        <capsuleGeometry args={[7, 15, 4, 8]} />
        <meshStandardMaterial color={armor} metalness={0.48} roughness={0.28} />
      </mesh>
      <mesh position={shoulder} rotation={[0, 0, -0.38]} castShadow>
        <capsuleGeometry args={[8, 13, 4, 9]} />
        <meshStandardMaterial color={riderColor || outfit} metalness={0.28} roughness={0.32} />
      </mesh>
      <mesh position={head} castShadow>
        <sphereGeometry args={[9.2, 18, 14]} />
        <meshStandardMaterial color="#e9bd98" roughness={0.48} />
      </mesh>
      <mesh position={[head[0] - 0.7, head[1] + 3.4, head[2] + 0.8]} castShadow>
        <sphereGeometry args={[9.7, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color={character === "guardian" ? "#9c3549" : "#b9a475"} metalness={0.72} roughness={0.22} />
      </mesh>
      <mesh position={[head[0] + 5, head[1] - 1, head[2] + 8]} castShadow>
        <sphereGeometry args={[1.25, 8, 8]} />
        <meshStandardMaterial color="#243344" />
      </mesh>
      <Bar start={[head[0] - 9, head[1] + 4, z]} end={[head[0] - 14, head[1] + 10, z - 1]} color="#8e3d47" radius={2.4} />

      <Bar start={[shoulder[0] + 2, shoulder[1] - 4, z + 1]} end={[hand[0] - 8, hand[1] + 8, z + 1]} color={armor} radius={3.5} />
      <Bar start={[hand[0] - 8, hand[1] + 8, z + 1]} end={hand} color={armor} radius={3} />
      <mesh position={hand} castShadow>
        <sphereGeometry args={[3.7, 10, 8]} />
        <meshStandardMaterial color="#55453f" roughness={0.42} />
      </mesh>

      <Bar start={[hip[0] + 3, hip[1] - 4, z]} end={[knee[0], knee[1], z]} color={outfit} radius={4.6} metalness={0.1} />
      <mesh position={knee} castShadow>
        <sphereGeometry args={[4.2, 10, 8]} />
        <meshStandardMaterial color={armor} metalness={0.45} roughness={0.28} />
      </mesh>
      <Bar start={[knee[0], knee[1], z]} end={boot} color={armor} radius={3.6} />
      <mesh position={[boot[0] + 2, boot[1] - 2, boot[2] + 1]} rotation={[0, 0, -0.15]} castShadow>
        <boxGeometry args={[11, 5, 6]} />
        <meshStandardMaterial color="#503b35" roughness={0.48} />
      </mesh>
      <mesh position={[shoulder[0] + 7, shoulder[1] - 8, z + 5]}>
        <sphereGeometry args={[2.5, 10, 8]} />
        <meshStandardMaterial color="#f2d28d" metalness={0.84} roughness={0.2} />
      </mesh>
    </group>
  );
}

export function Vehicle3DModel({ vehicle, model, character, riderColor, elapsed = 0 }: VehicleProps) {
  const spec = getVehicleModelSpec(model);
  const paint = spec.paint;
  const highlight = spec.highlight;
  const trim = spec.trim;

  if (vehicle === "car") {
    return (
      <group>
        <mesh position={[0, 26, 0]} castShadow receiveShadow>
          <boxGeometry args={[105, 23, 28]} />
          <meshStandardMaterial color={paint} metalness={0.52} roughness={0.27} />
        </mesh>
        <mesh position={[2, 45, -1]} castShadow>
          <boxGeometry args={[57, 25, 24]} />
          <meshStandardMaterial color={highlight} metalness={0.42} roughness={0.3} />
        </mesh>
        <mesh position={[4, 46, 12]} castShadow>
          <boxGeometry args={[44, 16, 1.2]} />
          <meshStandardMaterial color="#638698" metalness={0.32} roughness={0.22} />
        </mesh>
        <mesh position={[-17, 47, 12.7]}>
          <boxGeometry args={[20, 13, 0.8]} />
          <meshStandardMaterial color="#b9dae1" metalness={0.3} roughness={0.18} />
        </mesh>
        <mesh position={[6, 47, 13]}>
          <boxGeometry args={[18, 13, 0.8]} />
          <meshStandardMaterial color="#a7d5df" metalness={0.3} roughness={0.18} />
        </mesh>
        <mesh position={[43, 29, 15]} castShadow>
          <boxGeometry args={[10, 5, 2]} />
          <meshStandardMaterial color="#ffe8a0" emissive="#c88134" emissiveIntensity={0.14} />
        </mesh>
        <mesh position={[-48, 28, 15]} castShadow>
          <boxGeometry args={[5, 5, 2]} />
          <meshStandardMaterial color="#ee7d68" />
        </mesh>
        <mesh position={[0, 14, 0]} castShadow>
          <boxGeometry args={[93, 5, 30]} />
          <meshStandardMaterial color={trim} metalness={0.7} roughness={0.24} />
        </mesh>
        <Wheel3D x={-32} y={12} radius={11} elapsed={elapsed} />
        <Wheel3D x={33} y={12} radius={11} elapsed={elapsed} />
        <Rider3D character={character} vehicle={vehicle} riderColor={riderColor} />
        <mesh position={[0, 2, -2]}>
          <boxGeometry args={[112, 1.8, 29]} />
          <meshStandardMaterial color="#172632" roughness={0.75} />
        </mesh>
        <mesh position={[1, 18, 15.8]}>
          <boxGeometry args={[67, 1.4, 1.2]} />
          <meshStandardMaterial color={trim} metalness={0.62} />
        </mesh>
      </group>
    );
  }

  const motorcycle = vehicle === "motorcycle";
  const rear: [number, number, number] = [-29, motorcycle ? 15 : 16, 0];
  const front: [number, number, number] = [motorcycle ? 30 : 32, motorcycle ? 15 : 16, 0];
  const crank: [number, number, number] = [0, 16, 0];
  const seat: [number, number, number] = [-7, motorcycle ? 43 : 39, 0];
  const handle: [number, number, number] = [motorcycle ? 27 : 33, motorcycle ? 49 : 43, 0];

  return (
    <group>
      <Wheel3D x={rear[0]} y={rear[1]} radius={motorcycle ? 13 : 15} elapsed={elapsed} />
      <Wheel3D x={front[0]} y={front[1]} radius={motorcycle ? 13 : 15} elapsed={elapsed} />
      <Bar start={rear} end={crank} color={paint} radius={motorcycle ? 4 : 2.4} />
      <Bar start={crank} end={seat} color={highlight} radius={motorcycle ? 4 : 2.4} />
      <Bar start={seat} end={rear} color={trim} radius={motorcycle ? 3.4 : 2.1} />
      <Bar start={crank} end={front} color={trim} radius={motorcycle ? 3.2 : 2.1} />
      <Bar start={front} end={handle} color={highlight} radius={motorcycle ? 3.2 : 2.1} />
      <Bar start={[handle[0] - 5, handle[1] + 2, 0]} end={handle} color={trim} radius={1.7} />
      <Bar start={[seat[0] - 8, seat[1] + 2, 0]} end={seat} color={trim} radius={2} />
      <mesh position={[seat[0] + 1, seat[1] + 3, 1]} rotation={[0, 0, -0.1]} castShadow>
        <boxGeometry args={[motorcycle ? 24 : 19, 5, 8]} />
        <meshStandardMaterial color={motorcycle ? paint : "#342c35"} roughness={0.3} metalness={0.25} />
      </mesh>
      {motorcycle ? (
        <>
          <mesh position={[1, 34, 0]} castShadow>
            <boxGeometry args={[39, 18, 20]} />
            <meshStandardMaterial color={paint} metalness={0.66} roughness={0.22} />
          </mesh>
          <mesh position={[5, 44, -1]} rotation={[0, 0, 0.04]} castShadow>
            <boxGeometry args={[25, 9, 17]} />
            <meshStandardMaterial color={highlight} metalness={0.58} roughness={0.2} />
          </mesh>
          <mesh position={[0, 24, 12]}>
            <boxGeometry args={[29, 2, 2]} />
            <meshStandardMaterial color={trim} metalness={0.82} roughness={0.22} />
          </mesh>
          <mesh position={[front[0] + 2, 39, 0]} castShadow>
            <sphereGeometry args={[6, 14, 10]} />
            <meshStandardMaterial color="#fff1c5" emissive="#ffb755" emissiveIntensity={0.22} />
          </mesh>
        </>
      ) : (
        <>
          <Bar start={crank} end={[seat[0], seat[1] - 1, 0]} color={paint} radius={3.1} />
          <Bar start={[seat[0], seat[1], -1]} end={[seat[0], 30, -1]} color={highlight} radius={2} />
          <mesh position={[crank[0], crank[1], 2]}>
            <sphereGeometry args={[4.8, 12, 10]} />
            <meshStandardMaterial color={paint} metalness={0.63} roughness={0.24} />
          </mesh>
          <Bar start={[crank[0] - 8, crank[1] - 10, 3]} end={[crank[0] + 8, crank[1] + 10, 3]} color={trim} radius={1.2} />
        </>
      )}
      <Rider3D character={character} vehicle={vehicle} riderColor={riderColor} />
      <mesh position={[0, 1.2, -1]}>
        <boxGeometry args={[motorcycle ? 82 : 89, 1.4, 4]} />
        <meshStandardMaterial color="#111d28" roughness={0.76} />
      </mesh>
    </group>
  );
}

export function WalkingMonster3D({ phase = 0, elapsed = 0 }: { phase?: number; elapsed?: number }) {
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const body = useRef<Group>(null);
  const palette = Math.abs(Math.floor(phase * 5)) % 3;
  const skin = palette === 0 ? "#a84e61" : palette === 1 ? "#5b7a67" : "#75639f";

  useFrame(({ clock }) => {
    const stride = Math.sin(clock.elapsedTime * 7 + phase) * 0.48;
    if (leftLeg.current) leftLeg.current.rotation.z = stride;
    if (rightLeg.current) rightLeg.current.rotation.z = -stride;
    if (leftArm.current) leftArm.current.rotation.z = -stride * 0.76;
    if (rightArm.current) rightArm.current.rotation.z = stride * 0.76;
    if (body.current) body.current.position.y = 27 + Math.abs(Math.sin(clock.elapsedTime * 7 + phase)) * 2;
  });

  return (
    <group>
      <mesh position={[0, 2, -1]}>
        <sphereGeometry args={[24, 16, 10]} />
        <meshBasicMaterial color="#182432" transparent opacity={0.2} />
      </mesh>
      <group ref={body} position={[0, 27, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[18, 18, 14]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
        <mesh position={[5, 14, 3]} castShadow>
          <sphereGeometry args={[14, 16, 12]} />
          <meshStandardMaterial color={skin} roughness={0.5} />
        </mesh>
        <mesh position={[9, 16, 14]}>
          <sphereGeometry args={[2.8, 10, 8]} />
          <meshStandardMaterial color="#ffe79a" emissive="#ecad43" emissiveIntensity={0.65} />
        </mesh>
        <mesh position={[17, 16, 12]}>
          <sphereGeometry args={[2.8, 10, 8]} />
          <meshStandardMaterial color="#ffe79a" emissive="#ecad43" emissiveIntensity={0.65} />
        </mesh>
        <mesh position={[4, 28, 0]} rotation={[0, 0, -0.18]} castShadow>
          <coneGeometry args={[5, 14, 5]} />
          <meshStandardMaterial color="#e7d0aa" roughness={0.38} />
        </mesh>
        <mesh position={[-8, 26, -1]} rotation={[0, 0, -0.24]} castShadow>
          <coneGeometry args={[4, 11, 5]} />
          <meshStandardMaterial color="#d2bd9a" roughness={0.4} />
        </mesh>
        <mesh position={[15, 9, 12]}>
          <boxGeometry args={[11, 2.4, 1]} />
          <meshStandardMaterial color="#3b273d" />
        </mesh>
      </group>
      <group ref={leftArm} position={[-13, 34, 0]}>
        <Bar start={[0, 0, 0]} end={[-10, -15, 3]} color={skin} radius={5} metalness={0.05} />
        <mesh position={[-10, -16, 4]}><sphereGeometry args={[5, 10, 8]} /><meshStandardMaterial color={skin} /></mesh>
      </group>
      <group ref={rightArm} position={[13, 34, 0]}>
        <Bar start={[0, 0, 0]} end={[12, -13, 3]} color={skin} radius={5} metalness={0.05} />
        <mesh position={[12, -14, 4]}><sphereGeometry args={[5, 10, 8]} /><meshStandardMaterial color={skin} /></mesh>
      </group>
      <group ref={leftLeg} position={[-8, 13, 2]}>
        <Bar start={[0, 0, 0]} end={[-4, -11, 0]} color="#493947" radius={5} metalness={0.05} />
      </group>
      <group ref={rightLeg} position={[8, 13, 2]}>
        <Bar start={[0, 0, 0]} end={[4, -11, 0]} color="#493947" radius={5} metalness={0.05} />
      </group>
    </group>
  );
}
