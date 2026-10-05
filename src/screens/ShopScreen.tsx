import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CharacterAttribute, CharacterId, PlayerProfile, UpgradeKey, VehicleId } from "../storage/profile";
import { canAfford, itemCost, SHOP_ITEMS } from "../game/shop";
import { VEHICLES } from "../game/vehicles";
import {
  CHARACTER_ATTRIBUTES,
  CHARACTER_UPGRADE_MAX_LEVEL,
  CHARACTERS,
  characterUpgradeCost,
  getCharacterSpec,
} from "../game/characters";
import VehicleSprite from "../components/VehicleSprite";

const SKINS = ["#3b82f6", "#ef5b59", "#55bd87", "#d28d45", "#b57be0", "#ec7eaa"];

type Props = {
  profile: PlayerProfile;
  onBack: () => void;
  onBuyUpgrade: (key: UpgradeKey) => void;
  onBuySkin: (skin: number) => void;
  onSelectVehicle: (vehicle: VehicleId) => void;
  onSelectCharacter: (character: CharacterId) => void;
  onBuyCharacterUpgrade: (character: CharacterId, attribute: CharacterAttribute) => void;
};

export default function ShopScreen({
  profile,
  onBack,
  onBuyUpgrade,
  onBuySkin,
  onSelectVehicle,
  onSelectCharacter,
  onBuyCharacterUpgrade,
}: Props) {
  const selectedCharacter = getCharacterSpec(profile.character);
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹  GERİ</Text>
        </Pressable>
        <Text style={styles.eyebrow}>KARAKTERİNİ GÜÇLENDİR</Text>
        <Text style={styles.title}>Dükkan</Text>
        <View style={styles.wallet}>
          <Text style={styles.gold}>●  {profile.gold}</Text>
          <Text style={styles.gem}>◆  {profile.gems}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>KAHRAMANLAR</Text>
          <Text style={styles.sectionCopy}>Kendi kahramanını seç; her birinin yeteneklerini ayrı ayrı geliştir.</Text>
        </View>
        <ScrollView horizontal contentContainerStyle={styles.characterRail} showsHorizontalScrollIndicator={false}>
          {CHARACTERS.map((character) => {
            const owned = profile.charactersOwned.includes(character.id);
            const selected = profile.character === character.id;
            const enough = profile.gold >= character.price;
            return (
              <View key={character.id} style={[styles.characterCard, selected && styles.selectedCharacterCard]}>
                <View style={styles.characterPreview}>
                  <VehicleSprite
                    vehicle="bike"
                    character={character.id}
                    riderColor={character.color}
                    width={118}
                    height={86}
                  />
                </View>
                <Text style={styles.characterName}>{character.name}</Text>
                <Text style={[styles.characterTitle, { color: character.accent }]}>{character.title}</Text>
                <Text style={styles.characterDescription}>{character.description}</Text>
                <Pressable
                  onPress={() => onSelectCharacter(character.id)}
                  disabled={!owned && !enough}
                  style={({ pressed }) => [
                    styles.characterButton,
                    selected && styles.selectedCharacterButton,
                    !owned && !enough && styles.poorButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityLabel={
                    selected
                      ? `${character.name} seçili`
                      : owned
                        ? `${character.name} karakterini seç`
                        : `${character.name} karakterini ${character.price} altına satın al`
                  }
                >
                  <Text style={[styles.characterButtonText, !owned && !enough && styles.dimText]}>
                    {selected ? "SEÇİLİ" : owned ? "KARAKTERİ SEÇ" : `● ${character.price} ALTIN`}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.characterUpgradePanel}>
          <View style={styles.characterUpgradeHeading}>
            <View>
              <Text style={styles.sectionTitle}>{selectedCharacter.name.toLocaleUpperCase("tr-TR")} · YETENEKLER</Text>
              <Text style={styles.sectionCopy}>Bu ilerleme yalnızca seçili karaktere uygulanır.</Text>
            </View>
            <View style={[styles.characterBadge, { borderColor: selectedCharacter.accent }]}>
              <Text style={[styles.characterBadgeText, { color: selectedCharacter.accent }]}>✦</Text>
            </View>
          </View>
          <View style={styles.characterStatGrid}>
            {CHARACTER_ATTRIBUTES.map((attribute) => {
              const current = profile.characterUpgrades[profile.character][attribute.key];
              const bonus = selectedCharacter.bonus[attribute.key] ?? 0;
              const maxed = current >= CHARACTER_UPGRADE_MAX_LEVEL;
              const cost = characterUpgradeCost(attribute.key, current);
              const enough = profile.gold >= cost;
              return (
                <View key={attribute.key} style={styles.characterStatCard}>
                  <View style={styles.characterStatTop}>
                    <Text style={styles.characterStatName}>{attribute.title}</Text>
                    <Text style={styles.characterStatLevel}>
                      {Math.min(CHARACTER_UPGRADE_MAX_LEVEL, current + bonus)}/{CHARACTER_UPGRADE_MAX_LEVEL}
                    </Text>
                  </View>
                  <Text style={styles.characterStatDetail}>
                    {attribute.detail}{bonus > 0 ? `  ·  Başlangıç +${bonus}` : ""}
                  </Text>
                  <View style={styles.levelTrack}>
                    {Array.from({ length: CHARACTER_UPGRADE_MAX_LEVEL }, (_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.levelSegment,
                          index < current + bonus && [
                            styles.levelSegmentActive,
                            { backgroundColor: selectedCharacter.accent },
                          ],
                        ]}
                      />
                    ))}
                  </View>
                  <Pressable
                    onPress={() => onBuyCharacterUpgrade(profile.character, attribute.key)}
                    disabled={maxed || !enough}
                    style={({ pressed }) => [
                      styles.statBuyButton,
                      (maxed || !enough) && styles.poorButton,
                      pressed && styles.pressed,
                    ]}
                    accessibilityLabel={
                      maxed
                        ? `${attribute.title} en yüksek seviyede`
                        : `${attribute.title} yeteneğini ${cost} altınla geliştir`
                    }
                  >
                    <Text style={[styles.statBuyText, !enough && !maxed && styles.dimText]}>
                      {maxed ? "EN YÜKSEK SEVİYE" : `GELİŞTİR  ·  ● ${cost}`}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitle}>ARAÇ GARAJI</Text>
        <View style={styles.vehicleGrid}>
          {VEHICLES.map((vehicle) => {
            const owned = profile.vehiclesOwned.includes(vehicle.id);
            const selected = profile.vehicle === vehicle.id;
            const enough = profile.gold >= vehicle.price;
            return (
              <View key={vehicle.id} style={[styles.vehicleCard, selected && styles.selectedVehicleCard]}>
                <View style={styles.vehiclePreview}>
                  <VehicleSprite
                    vehicle={vehicle.id}
                    character={profile.character}
                    riderColor={SKINS[profile.skin] ?? SKINS[0]}
                    width={112}
                    height={72}
                  />
                </View>
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                <Text style={styles.vehicleDescription}>{vehicle.description}</Text>
                <Pressable
                  onPress={() => onSelectVehicle(vehicle.id)}
                  style={({ pressed }) => [
                    styles.vehicleButton,
                    selected && styles.vehicleSelectedButton,
                    !owned && !enough && styles.poorButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityLabel={selected ? `${vehicle.name} kullanılıyor` : owned ? `${vehicle.name} seç` : `${vehicle.name} satın al`}
                >
                  <Text style={[styles.vehicleButtonText, !owned && !enough && styles.dimText]}>
                    {selected ? "KULLANILIYOR" : owned ? "SEÇ" : `● ${vehicle.price}`}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>YETENEKLER</Text>
        <View style={styles.cardGrid}>
          {SHOP_ITEMS.map((item) => {
            const current = profile.upgrades[item.key];
            const maxed = current >= item.maxLevel;
            const cost = itemCost(item, current);
            const enough = canAfford(profile, item);
            return (
              <View key={item.key} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.iconBox}><Text style={styles.icon}>{item.icon}</Text></View>
                  <View style={styles.levelBadge}><Text style={styles.levelText}>{maxed ? "TAMAM" : `${current}/${item.maxLevel}`}</Text></View>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.subtitle}</Text>
                <Pressable
                  onPress={() => onBuyUpgrade(item.key)}
                  disabled={maxed || !enough}
                  style={({ pressed }) => [
                    styles.buyButton,
                    maxed && styles.maxButton,
                    !maxed && !enough && styles.poorButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.buyText, !enough && !maxed && styles.dimText]}>
                    {maxed ? "EN YÜKSEK SEVİYE" : `GELİŞTİR  ·  ${item.currency === "gold" ? "●" : "◆"} ${cost}`}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 22 }]}>GÖRÜNÜM</Text>
        <View style={styles.skinCard}>
          <Text style={styles.skinTitle}>Şövalye kostümleri</Text>
          <Text style={styles.skinCopy}>Altınla yeni zırh renklerinin kilidini aç.</Text>
          <View style={styles.skinRow}>
            {SKINS.map((color, index) => {
              const isOwned = profile.skinsOwned.includes(index);
              const selected = profile.skin === index;
              return (
                <Pressable
                  key={color}
                  onPress={() => onBuySkin(index)}
                  accessibilityLabel={`${index === 0 ? "Mavi" : "Kostüm " + (index + 1)} kostümü seç veya satın al`}
                  style={[styles.swatchButton, selected && styles.selectedSwatch]}
                >
                  <View style={[styles.swatch, { backgroundColor: color }]} />
                  <Text style={styles.swatchLabel}>
                    {selected ? "SEÇİLİ" : isOwned ? "SEÇ" : `● ${45 + index * 20}`}
                  </Text>
                  {!isOwned && !selected && <View style={styles.lockBadge}><Text style={styles.lockText}>+</Text></View>}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: "100%", maxWidth: 620, alignSelf: "center" },
  header: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10, alignItems: "center" },
  backButton: { position: "absolute", left: 16, top: 15, zIndex: 2, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 11, backgroundColor: "#202c3d", borderWidth: 1, borderColor: "#514b43" },
  backText: { color: "#d8e5f2", fontSize: 10, fontWeight: "900" },
  eyebrow: { color: "#dabb7a", fontSize: 9, fontWeight: "900", letterSpacing: 2 },
  title: { color: "#f5ead7", fontFamily: "serif", fontSize: 31, fontWeight: "700", marginTop: 2 },
  wallet: { flexDirection: "row", gap: 14, marginTop: 8, paddingVertical: 7, paddingHorizontal: 13, backgroundColor: "#202d3e", borderRadius: 99, borderWidth: 1, borderColor: "#514c44" },
  gold: { color: "#ffd75e", fontSize: 12, fontWeight: "900" },
  gem: { color: "#7ee7ed", fontSize: 12, fontWeight: "900" },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 36 },
  sectionHeading: { marginBottom: 8 },
  sectionTitle: { color: "#d8c59f", fontSize: 10, letterSpacing: 1.7, fontWeight: "900", marginBottom: 4 },
  sectionCopy: { color: "#aeb4bd", fontSize: 9, lineHeight: 14 },
  characterRail: { gap: 9, paddingBottom: 17, paddingRight: 3 },
  characterCard: { width: 151, backgroundColor: "#1a293a", borderWidth: 1, borderColor: "#48505a", borderRadius: 17, padding: 9, alignItems: "center" },
  selectedCharacterCard: { borderColor: "#d7b675", backgroundColor: "#283749" },
  characterPreview: { height: 87, width: "100%", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 12, backgroundColor: "#121e2e" },
  characterName: { color: "#f1e9dc", fontSize: 13, fontWeight: "900", marginTop: 7 },
  characterTitle: { fontSize: 8, fontWeight: "900", marginTop: 2 },
  characterDescription: { height: 29, color: "#aeb4bd", fontSize: 8, lineHeight: 12, textAlign: "center", marginTop: 4 },
  characterButton: { minHeight: 31, width: "100%", marginTop: 8, borderRadius: 10, backgroundColor: "#a96f4d", borderWidth: 1, borderColor: "#d2aa68", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  selectedCharacterButton: { backgroundColor: "#355448", borderColor: "#6f9876" },
  characterButtonText: { color: "#fff5dd", fontWeight: "900", fontSize: 8, letterSpacing: 0.2, textAlign: "center" },
  characterUpgradePanel: { marginBottom: 20, padding: 12, borderRadius: 17, backgroundColor: "#172638", borderWidth: 1, borderColor: "#5b5347" },
  characterUpgradeHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 9 },
  characterBadge: { width: 31, height: 31, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 1, backgroundColor: "#263647" },
  characterBadgeText: { fontSize: 17, fontWeight: "900" },
  characterStatGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  characterStatCard: { width: "48%", flexGrow: 1, minWidth: 134, padding: 9, borderRadius: 13, backgroundColor: "#202f40", borderWidth: 1, borderColor: "#46505a" },
  characterStatTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  characterStatName: { color: "#f1e9dc", fontSize: 11, fontWeight: "900" },
  characterStatLevel: { color: "#dfc78f", fontSize: 9, fontWeight: "900" },
  characterStatDetail: { minHeight: 25, color: "#aab2bb", fontSize: 8, lineHeight: 12, marginTop: 3 },
  levelTrack: { flexDirection: "row", gap: 3, marginTop: 6 },
  levelSegment: { flex: 1, height: 4, borderRadius: 99, backgroundColor: "#46515d" },
  levelSegmentActive: { backgroundColor: "#e1bd76" },
  statBuyButton: { minHeight: 29, marginTop: 8, borderRadius: 9, backgroundColor: "#a96f4d", borderWidth: 1, borderColor: "#d2aa68", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  statBuyText: { color: "#fff5dd", fontWeight: "900", fontSize: 7, letterSpacing: 0.2, textAlign: "center" },
  vehicleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 21 },
  vehicleCard: { flex: 1, minWidth: 110, backgroundColor: "#1d2b3c", borderWidth: 1, borderColor: "#514c44", borderRadius: 15, padding: 8, alignItems: "center" },
  selectedVehicleCard: { borderColor: "#d7b675", backgroundColor: "#263547" },
  vehiclePreview: { height: 68, width: "100%", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  vehicleName: { color: "#f1e9dc", fontSize: 12, fontWeight: "900", marginTop: 2 },
  vehicleDescription: { minHeight: 30, color: "#aeb4bd", fontSize: 8, lineHeight: 11, textAlign: "center", marginTop: 3 },
  vehicleButton: { minHeight: 30, width: "100%", marginTop: 7, borderRadius: 9, backgroundColor: "#b87950", borderWidth: 1, borderColor: "#d2aa68", alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  vehicleSelectedButton: { backgroundColor: "#355448", borderColor: "#6f9876" },
  vehicleButtonText: { color: "#fff5dd", fontWeight: "900", fontSize: 8, letterSpacing: 0.25, textAlign: "center" },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "48%", flexGrow: 1, minWidth: 145, backgroundColor: "#1d2b3c", borderWidth: 1, borderColor: "#514c44", borderRadius: 16, padding: 12 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 9 },
  iconBox: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#394453", alignItems: "center", justifyContent: "center" },
  icon: { color: "#e4c784", fontSize: 20, fontWeight: "900" },
  levelBadge: { backgroundColor: "#323d4a", borderRadius: 99, paddingHorizontal: 7, paddingVertical: 4 },
  levelText: { color: "#c0b39b", fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
  cardTitle: { color: "#f1e9dc", fontWeight: "900", fontSize: 14 },
  cardDescription: { color: "#aeb4bd", fontSize: 10, lineHeight: 15, minHeight: 31, marginTop: 4 },
  buyButton: { marginTop: 10, borderRadius: 10, backgroundColor: "#b87950", borderWidth: 1, borderColor: "#d2aa68", paddingVertical: 9, alignItems: "center", minHeight: 33, justifyContent: "center" },
  maxButton: { backgroundColor: "#355448", borderColor: "#6f9876" },
  poorButton: { backgroundColor: "#303b49", borderColor: "#4a5562" },
  pressed: { opacity: 0.75 },
  buyText: { color: "#fff5dd", fontWeight: "900", fontSize: 8, letterSpacing: 0.35, textAlign: "center" },
  dimText: { color: "#929aa5" },
  skinCard: { backgroundColor: "#1d2b3c", borderWidth: 1, borderColor: "#514c44", borderRadius: 16, padding: 14 },
  skinTitle: { color: "#f1e9dc", fontSize: 14, fontWeight: "900" },
  skinCopy: { color: "#aeb4bd", fontSize: 10, marginTop: 4, marginBottom: 13 },
  skinRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" },
  swatchButton: { width: 48, height: 69, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "#2a3747", borderWidth: 1, borderColor: "transparent" },
  selectedSwatch: { borderColor: "#d7b675", backgroundColor: "#36404a" },
  swatch: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: "#d9e2eb" },
  swatchLabel: { color: "#adbdcd", fontSize: 7, fontWeight: "900", marginTop: 6, textAlign: "center" },
  lockBadge: { position: "absolute", top: 3, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: "#e7c57e", alignItems: "center", justifyContent: "center" },
  lockText: { fontSize: 10, color: "#4b3a1e", fontWeight: "900" },
});