import { DoubleSide, Shape } from "three";
import type { VehicleModelId } from "../storage/profile";
import { getVehicleModelSpec } from "../game/vehicles";

const BODY = (() => {
  const shape = new Shape();
  shape.moveTo(-55, 17);
  shape.lineTo(-56, 24);
  shape.quadraticCurveTo(-54, 31, -45, 33);
  shape.lineTo(-32, 49);
  shape.quadraticCurveTo(-29, 53, -24, 53);
  shape.lineTo(12, 53);
  shape.quadraticCurveTo(18, 53, 23, 47);
  shape.lineTo(39, 33);
  shape.quadraticCurveTo(51, 31, 55, 24);
  shape.lineTo(55, 17);
  shape.lineTo(45, 17);
  shape.quadraticCurveTo(32, 36, 19, 17);
  shape.lineTo(-18, 17);
  shape.quadraticCurveTo(-32, 36, -45, 17);
  shape.closePath();
  return shape;
})();

function makeWindow(points: [number, number][]) {
  const shape = new Shape();
  shape.moveTo(...points[0]);
  points.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
  shape.closePath();
  return shape;
}

const REAR_WINDOW = makeWindow([[-26, 49], [-8, 49], [-8, 33], [-39, 33]]);
const FRONT_WINDOW = makeWindow([[-4, 49], [13, 49], [34, 33], [-4, 33]]);

function Wheel({ x, elapsed, rate }: { x: number; elapsed: number; rate: number }) {
  return (
    <group position={[x, 17, 15]} rotation={[0, 0, -elapsed * rate]}>
      <mesh castShadow>
        <torusGeometry args={[11.6, 3.2, 12, 32]} />
        <meshStandardMaterial color="#202731" roughness={0.68} />
      </mesh>
      <mesh position={[0, 0, 1.2]}>
        <torusGeometry args={[8.2, 0.9, 8, 32]} />
        <meshStandardMaterial color="#c9bd9e" metalness={0.78} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0, 1.9]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[4.3, 4.3, 3.5, 16]} />
        <meshStandardMaterial color="#d8c07f" metalness={0.84} roughness={0.2} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => (
        <mesh
          key={index}
          position={[0, 0, 1.25]}
          rotation={[0, 0, (index / 8) * Math.PI * 2]}
        >
          <boxGeometry args={[0.9, 15, 0.65]} />
          <meshStandardMaterial color="#b9b7ad" metalness={0.78} roughness={0.27} />
        </mesh>
      ))}
      <mesh position={[0, 0, 2.7]}>
        <sphereGeometry args={[1.8, 10, 8]} />
        <meshStandardMaterial color="#fff0b3" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

export default function RoyalCar3D({
  model,
  elapsed,
}: {
  model: VehicleModelId;
  elapsed: number;
}) {
  const spec = getVehicleModelSpec(model);

  return (
    <group>
      <mesh position={[0, 0, -12]} castShadow receiveShadow>
        <extrudeGeometry
          args={[BODY, { depth: 24, bevelEnabled: true, bevelSegments: 4, bevelSize: 1.3, bevelThickness: 1.6, steps: 1 }]}
        />
        <meshStandardMaterial color={spec.paint} metalness={0.42} roughness={0.28} />
      </mesh>

      {/* Side windows sit above the rounded body and keep their glass depth. */}
      <mesh position={[0, 0, 12.55]}>
        <shapeGeometry args={[REAR_WINDOW]} />
        <meshPhysicalMaterial color="#79a5b3" metalness={0.26} roughness={0.16} clearcoat={1} transparent opacity={0.84} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 12.6]}>
        <shapeGeometry args={[FRONT_WINDOW]} />
        <meshPhysicalMaterial color="#89b8c5" metalness={0.28} roughness={0.14} clearcoat={1} transparent opacity={0.82} side={DoubleSide} />
      </mesh>
      <mesh position={[4, 41, 13.1]}>
        <boxGeometry args={[2.4, 18, 1.2]} />
        <meshStandardMaterial color={spec.trim} metalness={0.76} roughness={0.23} />
      </mesh>
      <mesh position={[-7, 41, 13.1]}>
        <boxGeometry args={[1.6, 17, 1]} />
        <meshStandardMaterial color={spec.highlight} metalness={0.68} roughness={0.25} />
      </mesh>
      <mesh position={[20, 31, 13]}>
        <boxGeometry args={[1.6, 4, 0.8]} />
        <meshStandardMaterial color="#d5e5e4" metalness={0.18} roughness={0.23} />
      </mesh>

      {/* Rounded wheel arches, gold pinstripe, sculpted rocker and chrome bumpers. */}
      <mesh position={[0, 14, -1]} castShadow>
        <boxGeometry args={[96, 5, 30]} />
        <meshStandardMaterial color="#5b5147" metalness={0.45} roughness={0.42} />
      </mesh>
      <mesh position={[0, 23, 13]}>
        <boxGeometry args={[94, 1.4, 1.3]} />
        <meshStandardMaterial color={spec.trim} metalness={0.76} roughness={0.22} />
      </mesh>
      <mesh position={[0, 18, 14]}>
        <boxGeometry args={[92, 1.1, 1.3]} />
        <meshStandardMaterial color={spec.highlight} metalness={0.65} roughness={0.26} />
      </mesh>
      <mesh position={[53.5, 17, 13]}>
        <boxGeometry args={[5, 5, 30]} />
        <meshStandardMaterial color={spec.trim} metalness={0.68} roughness={0.25} />
      </mesh>
      <mesh position={[-53.5, 17, 13]}>
        <boxGeometry args={[5, 5, 30]} />
        <meshStandardMaterial color={spec.highlight} metalness={0.6} roughness={0.28} />
      </mesh>
      <Wheel x={-32} elapsed={elapsed} rate={13} />
      <Wheel x={32} elapsed={elapsed} rate={13} />

      {/* Door seams, handles, mirror, grille, jewel lamps and royal hood emblem. */}
      <mesh position={[-4, 29, 12.9]}>
        <boxGeometry args={[1.1, 12, 0.8]} />
        <meshStandardMaterial color="#9d7952" metalness={0.4} roughness={0.38} />
      </mesh>
      <mesh position={[22, 31, 13.05]}>
        <boxGeometry args={[6, 1.1, 1]} />
        <meshStandardMaterial color={spec.trim} metalness={0.72} roughness={0.24} />
      </mesh>
      <mesh position={[26, 44, 15]} rotation={[0.12, 0, -0.24]}>
        <boxGeometry args={[6.5, 3.5, 4.5]} />
        <meshStandardMaterial color={spec.paint} metalness={0.42} roughness={0.27} />
      </mesh>
      <mesh position={[52.2, 24, 13.4]}>
        <sphereGeometry args={[3.4, 16, 12]} />
        <meshStandardMaterial color="#fff0bc" emissive="#d78d35" emissiveIntensity={0.22} metalness={0.42} roughness={0.22} />
      </mesh>
      <mesh position={[-53, 24, 13.5]}>
        <sphereGeometry args={[2.7, 14, 10]} />
        <meshStandardMaterial color="#dc6b65" emissive="#7a292b" emissiveIntensity={0.12} roughness={0.28} />
      </mesh>
      <mesh position={[54.5, 20, 15.1]}>
        <boxGeometry args={[1.4, 7, 7]} />
        <meshStandardMaterial color="#d6c8a9" metalness={0.76} roughness={0.22} />
      </mesh>
      {[-2, 0.5, 3].map((offset) => (
        <mesh key={offset} position={[55.3, 20 + offset, 15.9]}>
          <boxGeometry args={[0.6, 0.65, 4]} />
          <meshStandardMaterial color="#514d4c" metalness={0.4} roughness={0.38} />
        </mesh>
      ))}
      <mesh position={[-35, 31, 13.3]} rotation={[0, 0, Math.PI / 4]}>
        <octahedronGeometry args={[3, 0]} />
        <meshStandardMaterial color={spec.trim} metalness={0.82} roughness={0.2} />
      </mesh>

      {model === "car-sunrise" && (
        <mesh position={[-9, 54, 0]} castShadow>
          <boxGeometry args={[34, 1.8, 18]} />
          <meshStandardMaterial color={spec.trim} metalness={0.7} roughness={0.24} />
        </mesh>
      )}
      {model === "car-ice" && (
        <mesh position={[2, 35, 14.1]} rotation={[0, 0.3, 0.12]}>
          <octahedronGeometry args={[3.1, 0]} />
          <meshPhysicalMaterial color={spec.highlight} emissive="#4aacc2" emissiveIntensity={0.2} metalness={0.62} roughness={0.18} clearcoat={1} />
        </mesh>
      )}
    </group>
  );
}
