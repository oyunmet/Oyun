import { Image } from "react-native";
import knightRider from "../../assets/saraya-rider-knight.png";
import rangerRider from "../../assets/saraya-rider-ranger.png";
import guardianRider from "../../assets/saraya-rider-guardian.png";
import type { CharacterId, VehicleId } from "../../storage/profile";

const RIDERS: Record<CharacterId, string> = {
  knight: knightRider,
  ranger: rangerRider,
  guardian: guardianRider,
};

type Props = {
  character: CharacterId;
  vehicle: VehicleId;
  width: number;
  height: number;
};

export default function CharacterRider({ character, vehicle, width, height }: Props) {
  const inCar = vehicle === "car";
  return (
    <Image
      source={{ uri: RIDERS[character] }}
      resizeMode="contain"
      style={{
        position: "absolute",
        left: width * (inCar ? 0.38 : 0.09),
        top: height * (inCar ? -0.17 : -0.11),
        width: width * (inCar ? 0.58 : 0.81),
        height: height * (inCar ? 1.17 : 1.1),
        zIndex: 5,
      }}
      accessible={false}
    />
  );
}
