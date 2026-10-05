import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Quaternion, Vector3 } from "three";
import { getVehicleModelSpec } from "../game/vehicles";
import type { CharacterId, VehicleId, VehicleModelId } from "../storage/profile";
import RoyalCar3D from "./RoyalCar3D";
import RoyalRider3D from "./RoyalRider3D";

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
  spinRate,
  tire = "#20242d",
}: {
  x: number;
  y: number;
  radius: number;
  elapsed: number;
  spinRate: number;
  tire?: string;
}) {
  return (
    <group position={[x, y, 0]} rotation={[0, 0, elapsed * -spinRate]}>
      <mesh castShadow>
        <torusGeometry args={[radius, radius * 0.12, 10, 32]} />
        <meshStandardMaterial color={tire} roughness={0.62} />
      </mesh>
      <mesh position={[0, 0, 0.8]}>
        <torusGeometry args={[radius * 0.78, radius * 0.045, 8, 28]} />
        <meshStandardMaterial color="#d4bd8d" metalness={0.82} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0, 1.35]}>
        <torusGeometry args={[radius * 0.34, 0.85, 6, 20]} />
        <meshStandardMaterial color="#eef0e5" metalness={0.82} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0, 1]}>
        <cylinderGeometry args={[radius * 0.16, radius * 0.16, 1.8, 16]} />
        <meshStandardMaterial color="#f2d892" metalness={0.75} roughness={0.2} />
      </mesh>
      {Array.from({ length: 10 }, (_, index) => {
        const angle = (index / 10) * Math.PI * 2;
        return (
          <Bar
            key={index}
            start={[Math.cos(angle) * radius * 0.14, Math.sin(angle) * radius * 0.14, 1.2]}
            end={[Math.cos(angle) * radius * 0.75, Math.sin(angle) * radius * 0.75, 1.2]}
            color="#d8d2c2"
            radius={0.55}
          />
        );
      })}
    </group>
  );
}

export function Vehicle3DModel({ vehicle, model, character, riderColor, elapsed = 0 }: VehicleProps) {
  const spec = getVehicleModelSpec(model);
  const paint = spec.paint;
  const highlight = spec.highlight;
  const trim = spec.trim;
  const spinRate = vehicle === "motorcycle" ? 15 : vehicle === "car" ? 13 : 11;

  if (vehicle === "car") {
    return (
      <group>
        <RoyalCar3D model={model} elapsed={elapsed} />
        <RoyalRider3D character={character} vehicle={vehicle} riderColor={riderColor} />
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
      <Wheel3D x={rear[0]} y={rear[1]} radius={motorcycle ? 13 : 15} elapsed={elapsed} spinRate={spinRate} />
      <Wheel3D x={front[0]} y={front[1]} radius={motorcycle ? 13 : 15} elapsed={elapsed} spinRate={spinRate} />
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
          <mesh position={[7, 34, 11]}>
            <boxGeometry args={[17, 3, 1.5]} />
            <meshStandardMaterial color={trim} metalness={0.72} roughness={0.22} />
          </mesh>
          <mesh position={[0, 24, 12]}>
            <boxGeometry args={[29, 2, 2]} />
            <meshStandardMaterial color={trim} metalness={0.82} roughness={0.22} />
          </mesh>
          <mesh position={[1, 25, 13]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[7, 7, 5, 14]} />
            <meshStandardMaterial color="#545965" metalness={0.78} roughness={0.32} />
          </mesh>
          <mesh position={[1, 25, 16]}>
            <torusGeometry args={[4.8, 0.8, 6, 14]} />
            <meshStandardMaterial color={trim} metalness={0.85} roughness={0.2} />
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
      <RoyalRider3D character={character} vehicle={vehicle} riderColor={riderColor} />
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
