import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Group } from "three";
import type { CharacterId, VehicleId, VehicleModelId } from "../storage/profile";
import { Vehicle3DModel } from "./SceneModels3D";

type Props = {
  vehicle: VehicleId;
  model: VehicleModelId;
  character: CharacterId;
  riderColor: string;
};

function RotatingModel(props: Props) {
  const model = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (model.current) model.current.rotation.y = Math.sin(clock.elapsedTime * 0.32) * 0.3;
  });

  return (
    <group ref={model} position={[0, -4, 0]}>
      <mesh position={[0, -3, 0]} receiveShadow>
        <cylinderGeometry args={[57, 63, 7, 48]} />
        <meshStandardMaterial color="#293c54" metalness={0.72} roughness={0.26} />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <torusGeometry args={[51, 1.2, 8, 48]} />
        <meshStandardMaterial color="#e5c780" metalness={0.86} roughness={0.2} />
      </mesh>
      <Vehicle3DModel {...props} elapsed={0} />
    </group>
  );
}

export default function VehicleShowcase3D(props: Props) {
  return (
    <Canvas
      orthographic
      dpr={1}
      camera={{
        left: -150,
        right: 150,
        top: 93,
        bottom: -50,
        near: 0.1,
        far: 500,
        position: [0, 80, 310],
      }}
      gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <ambientLight intensity={1.65} />
      <directionalLight position={[-80, 150, 130]} intensity={2.4} color="#fff1d8" />
      <directionalLight position={[120, 40, 60]} intensity={0.85} color="#b9d9ff" />
      <RotatingModel {...props} />
    </Canvas>
  );
}
