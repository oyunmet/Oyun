import type { BackgroundId, CharacterId, VehicleId, VehicleModelId } from "../storage/profile";
import type { GameState } from "../game/engine";

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

export default function GameScene3D(_props: Props) {
  return null;
}
