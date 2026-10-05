import { Image, StyleSheet, Text, View } from "react-native";
import { WORLD_ART } from "./GameBackdrop";
import type { BackgroundId, CharacterId, VehicleId, VehicleModelId } from "../storage/profile";
import VehicleSprite from "./VehicleSprite";

type Props = {
  knightColor: string;
  character: CharacterId;
  vehicle: VehicleId;
  vehicleModel: VehicleModelId;
  backgroundId: BackgroundId;
};

export default function RoyalStoryArt({ knightColor, character, vehicle, vehicleModel, backgroundId }: Props) {
  return (
    <View style={styles.scene} accessibilityLabel="Ay ışığında saraya uzanan yolda şövalye">
      <Image
        source={WORLD_ART[backgroundId]}
        resizeMode="cover"
        style={styles.sceneBackground}
        accessible={false}
      />
      <View style={styles.sceneShade} />
      <View style={styles.knightGlow} />
      <View style={styles.rider}>
        <VehicleSprite
          character={character}
          vehicle={vehicle}
          model={vehicleModel}
          riderColor={knightColor}
          width={188}
          height={168}
        />
      </View>
      <View style={styles.sceneSeal}>
        <Text style={styles.sceneSealText}>BİR MASAL BAŞLIYOR</Text>
      </View>
      <View style={styles.sceneSparkOne} />
      <View style={styles.sceneSparkTwo} />
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { flex: 1, width: "100%", height: "100%", overflow: "hidden", justifyContent: "flex-end" },
  sceneBackground: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  sceneShade: { ...StyleSheet.absoluteFill, pointerEvents: "none", backgroundColor: "rgba(8, 17, 28, 0.06)" },
  knightGlow: {
    position: "absolute",
    left: 19,
    bottom: 7,
    width: 168,
    height: 104,
    borderRadius: 99,
    backgroundColor: "rgba(222, 175, 100, 0.21)",
  },
  rider: { position: "absolute", left: 8, bottom: -2 },
  sceneSeal: {
    position: "absolute",
    right: 12,
    top: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(240, 215, 166, 0.56)",
    backgroundColor: "rgba(13, 26, 39, 0.72)",
  },
  sceneSealText: { color: "#f4e5c3", fontSize: 7, fontWeight: "900", letterSpacing: 1.2 },
  sceneSparkOne: {
    position: "absolute",
    top: 49,
    left: "54%",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ffe3a1",
  },
  sceneSparkTwo: {
    position: "absolute",
    top: 88,
    left: "70%",
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#f8d995",
  },
});