import VehicleSprite from "./VehicleSprite";
import type { CharacterId, VehicleId, VehicleModelId } from "../storage/profile";

type Props = {
  vehicle: VehicleId;
  model: VehicleModelId;
  character: CharacterId;
  riderColor: string;
};

export default function VehicleShowcase3D({ vehicle, model, character, riderColor }: Props) {
  return (
    <VehicleSprite
      vehicle={vehicle}
      model={model}
      character={character}
      riderColor={riderColor}
      width={166}
      height={130}
    />
  );
}
