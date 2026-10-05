import { Image } from "react-native";
import type { CharacterId, VehicleId } from "../storage/profile";

const RIDERS: Record<CharacterId, number> = {
  knight: require("../../assets/saraya-rider-knight.png"),
  ranger: require("../../assets/saraya-rider-ranger.png"),
  guardian: require("../../assets/saraya-rider-guardian.png"),
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
      source={RIDERS[character]}
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
