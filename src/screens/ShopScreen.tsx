import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BackgroundId, CharacterAttribute, CharacterId, PlayerProfile, UpgradeKey, VehicleModelId } from "../storage/profile";
import { canAfford, itemCost, SHOP_ITEMS } from "../game/shop";
import { VEHICLES, VEHICLE_MODELS } from "../game/vehicles";
import { BACKGROUNDS } from "../game/backgrounds";
import {
  CHARACTER_ATTRIBUTES,
  CHARACTER_UPGRADE_MAX_LEVEL,
  CHARACTERS,
  characterUpgradeCost,
  getCharacterSpec,
} from "../game/characters";
import VehicleSprite from "../components/VehicleSprite";
import VehicleShowcase3D from "../components/VehicleShowcase3D";
import { BackgroundIllustration } from "../components/GameBackdrop";

const SKINS = ["#3b82f6", "#ef5b59", "#55bd87", "#d28d45", "#b57be0", "#ec7eaa"];

type Props = {
  profile: PlayerProfile;
  onBack: () => void;
  onBuyUpgrade: (key: UpgradeKey) => void;
  onBuySkin: (skin: number) => void;
  onSelectVehicleModel: (model: VehicleModelId) => void;
  onSelectBackground: (background: BackgroundId) => void;
  onSelectCharacter: (character: CharacterId) => void;
  onBuyCharacterUpgrade: (character: CharacterId, attribute: CharacterAttribute) => void;
};

export default function ShopScreen({
  profile,
  onBack,
  onBuyUpgrade,
  onBuySkin,
  onSelectVehicleModel,
  onSelectBackground,
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
                  <Text style={[styles.characterButtonText, selected && styles.selectedChoiceText, !owned && !enough && styles.dimText]}>
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
        <Text style={styles.sectionCopy}>Bir model seç; kahramanını araçla birlikte canlı 3D olarak incele.</Text>
        <View style={styles.liveGaragePanel}>
          <View style={styles.liveGarageHeading}>
            <View>
              <Text style={styles.liveGarageEyebrow}>SARAY GARAJI · 3D ÖNİZLEME</Text>
              <Text style={styles.liveGarageName}>
                {VEHICLE_MODELS.find((model) => model.id === profile.vehicleModel)?.name ?? "Saray Bisikleti"}
              </Text>
            </View>
            <View style={styles.liveGarageBadge}>
              <View style={styles.liveGarageDot} />
              <Text style={styles.liveGarageBadgeText}>CANLI</Text>
            </View>
          </View>
          <View style={styles.liveGarageStage}>
            <VehicleShowcase3D
              vehicle={profile.vehicle}
              model={profile.vehicleModel}
              character={profile.character}
              riderColor={SKINS[profile.skin] ?? SKINS[0]}
            />
          </View>
          <Text style={styles.liveGarageHint}>Kahraman seçtiğin aracın üzerinde sürüş pozisyonunda gösterilir.</Text>
        </View>
        {VEHICLES.map((vehicle) => {
          const categoryOwned = profile.vehiclesOwned.includes(vehicle.id);
          return (
            <View key={vehicle.id} style={styles.vehicleCategory}>
              <View style={styles.vehicleCategoryHeading}>
                <Text style={styles.vehicleCategoryTitle}>{vehicle.name.toLocaleUpperCase("tr-TR")}</Text>
                <Text style={styles.vehicleCategoryStatus}>
                  {categoryOwned ? "GARAJINDA" : `ARACI AÇ · ● ${vehicle.price}`}
                </Text>
              </View>
              <ScrollView horizontal contentContainerStyle={styles.vehicleRail} showsHorizontalScrollIndicator={false}>
                {VEHICLE_MODELS.filter((model) => model.vehicle === vehicle.id).map((model) => {
                  const owned = profile.vehicleModelsOwned.includes(model.id);
                  const selected = profile.vehicleModel === model.id;
                  const cost = categoryOwned ? model.price : vehicle.price;
                  const enough = profile.gold >= cost;
                  return (
                    <Pressable
                      key={model.id}
                      onPress={() => onSelectVehicleModel(model.id)}
                      style={({ pressed }) => [
                        styles.vehicleCard,
                        selected && styles.selectedVehicleCard,
                        pressed && styles.pressed,
                      ]}
                      accessibilityLabel={
                        selected
                          ? `${model.name} kullanılıyor`
                          : owned
                            ? `${model.name} seç`
                            : `${model.name} modelini ${cost} altına satın al`
                      }
                    >
                      <View style={styles.vehiclePreview}>
                        <VehicleSprite
                          vehicle={vehicle.id}
                          model={model.id}
                          character={profile.character}
                          riderColor={SKINS[profile.skin] ?? SKINS[0]}
                          width={138}
                          height={92}
                        />
                      </View>
                      <Text style={styles.vehicleName}>{model.name}</Text>
                      <Text style={styles.vehicleDescription}>{model.description}</Text>
                      <View style={[
                        styles.vehicleButton,
                        selected && styles.vehicleSelectedButton,
                        !owned && !enough && styles.poorButton,
                      ]}>
                        <Text style={[styles.vehicleButtonText, selected && styles.selectedChoiceText, !owned && !enough && styles.dimText]}>
                          {selected ? "KULLANILIYOR" : owned ? "SEÇ" : `● ${cost}`}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          );
        })}

        <View style={styles.backgroundSection}>
          <View style={styles.backgroundHeading}>
            <View>
              <Text style={styles.sectionTitle}>YENİ DÜNYALAR</Text>
              <Text style={styles.sectionCopy}>Yolculuğunu rengârenk masal diyarlarında sürdür.</Text>
            </View>
            <View style={styles.newBadge}><Text style={styles.newBadgeText}>6 DÜNYA</Text></View>
          </View>
          <ScrollView horizontal contentContainerStyle={styles.backgroundRail} showsHorizontalScrollIndicator={false}>
            {BACKGROUNDS.map((background) => {
              const owned = profile.backgroundsOwned.includes(background.id);
              const selected = profile.backgroundId === background.id;
              const enough = profile.gold >= background.price;
              return (
                <Pressable
                  key={background.id}
                  onPress={() => onSelectBackground(background.id)}
                  style={({ pressed }) => [
                    styles.backgroundCard,
                    selected && styles.selectedBackgroundCard,
                    pressed && styles.pressed,
                  ]}
                  accessibilityLabel={
                    selected
                      ? `${background.name} seçili`
                      : owned
                        ? `${background.name} dünyasını seç`
                        : `${background.name} dünyasını ${background.price} altına satın al`
                  }
                >
                  <View style={styles.backgroundPreview}>
                    <BackgroundIllustration theme={background.id} width="100%" height="100%" />
                    {selected && <View style={styles.currentWorldBadge}><Text style={styles.currentWorldText}>SEÇİLİ</Text></View>}
                  </View>
                  <View style={styles.backgroundCardCopy}>
                    <Text style={styles.backgroundName}>{background.name}</Text>
                    <Text style={styles.backgroundDescription}>{background.subtitle}</Text>
                    <View style={[
                      styles.backgroundButton,
                      selected && styles.backgroundSelectedButton,
                      !owned && !enough && styles.poorButton,
                    ]}>
                      <Text style={[styles.backgroundButtonText, selected && styles.selectedChoiceText, !owned && !enough && styles.dimText]}>
                        {selected ? "OYUNDA" : owned ? "SEÇ" : `● ${background.price}`}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
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
  screen: { flex: 1, width: "100%", maxWidth: 620, alignSelf: "center", backgroundColor: "#f5f7fc" },
  header: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10, alignItems: "center" },
  backButton: { position: "absolute", left: 16, top: 15, zIndex: 2, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 11, backgroundColor: "#e8efff", borderWidth: 1, borderColor: "#d6def1" },
  backText: { color: "#3d5273", fontSize: 10, fontWeight: "900" },
  eyebrow: { color: "#7986a8", fontSize: 9, fontWeight: "900", letterSpacing: 2 },
  title: { color: "#233454", fontFamily: "serif", fontSize: 31, fontWeight: "700", marginTop: 2 },
  wallet: { flexDirection: "row", gap: 14, marginTop: 8, paddingVertical: 7, paddingHorizontal: 13, backgroundColor: "#fff", borderRadius: 99, borderWidth: 1, borderColor: "#e3e8f2" },
  gold: { color: "#d99d19", fontSize: 12, fontWeight: "900" },
  gem: { color: "#36a7bc", fontSize: 12, fontWeight: "900" },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 36 },
  sectionHeading: { marginBottom: 8 },
  sectionTitle: { color: "#4c5e81", fontSize: 10, letterSpacing: 1.7, fontWeight: "900", marginBottom: 4 },
  sectionCopy: { color: "#8390a8", fontSize: 9, lineHeight: 14 },
  characterRail: { gap: 9, paddingBottom: 17, paddingRight: 3 },
  characterCard: { width: 151, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f2", borderRadius: 17, padding: 9, alignItems: "center" },
  selectedCharacterCard: { borderColor: "#8d91ee", backgroundColor: "#f2f2ff" },
  characterPreview: { height: 87, width: "100%", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 12, backgroundColor: "#edf4ff" },
  characterName: { color: "#253651", fontSize: 13, fontWeight: "900", marginTop: 7 },
  characterTitle: { fontSize: 8, fontWeight: "900", marginTop: 2 },
  characterDescription: { height: 29, color: "#8491a8", fontSize: 8, lineHeight: 12, textAlign: "center", marginTop: 4 },
  characterButton: { minHeight: 31, width: "100%", marginTop: 8, borderRadius: 10, backgroundColor: "#777de0", borderWidth: 1, borderColor: "#a6a9f3", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  selectedCharacterButton: { backgroundColor: "#e7f7ee", borderColor: "#9bd5b4" },
  characterButtonText: { color: "#fff", fontWeight: "900", fontSize: 8, letterSpacing: 0.2, textAlign: "center" },
  characterUpgradePanel: { marginBottom: 20, padding: 12, borderRadius: 17, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e1e7f2" },
  characterUpgradeHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 9 },
  characterBadge: { width: 31, height: 31, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 1, backgroundColor: "#f1f4ff" },
  characterBadgeText: { fontSize: 17, fontWeight: "900" },
  characterStatGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  characterStatCard: { width: "48%", flexGrow: 1, minWidth: 134, padding: 9, borderRadius: 13, backgroundColor: "#f7f8fc", borderWidth: 1, borderColor: "#e7ebf4" },
  characterStatTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  characterStatName: { color: "#31435e", fontSize: 11, fontWeight: "900" },
  characterStatLevel: { color: "#8c77cc", fontSize: 9, fontWeight: "900" },
  characterStatDetail: { minHeight: 25, color: "#8190a8", fontSize: 8, lineHeight: 12, marginTop: 3 },
  levelTrack: { flexDirection: "row", gap: 3, marginTop: 6 },
  levelSegment: { flex: 1, height: 4, borderRadius: 99, backgroundColor: "#e0e5f0" },
  levelSegmentActive: { backgroundColor: "#e1bd76" },
  statBuyButton: { minHeight: 29, marginTop: 8, borderRadius: 9, backgroundColor: "#777de0", borderWidth: 1, borderColor: "#a6a9f3", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  statBuyText: { color: "#fff", fontWeight: "900", fontSize: 7, letterSpacing: 0.2, textAlign: "center" },
  vehicleCategory: { marginTop: 10, marginBottom: 11 },
  liveGaragePanel: { marginTop: 10, marginBottom: 11, padding: 12, borderRadius: 18, backgroundColor: "#1d2b42", borderWidth: 1, borderColor: "#52637e", overflow: "hidden" },
  liveGarageHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 7 },
  liveGarageEyebrow: { color: "#c7d3e4", fontSize: 8, fontWeight: "900", letterSpacing: 1.4 },
  liveGarageName: { color: "#fff2d0", fontSize: 16, fontWeight: "900", marginTop: 3 },
  liveGarageBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 99, paddingVertical: 5, paddingHorizontal: 8, backgroundColor: "#31445e", borderWidth: 1, borderColor: "#71819b" },
  liveGarageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#7de0b1" },
  liveGarageBadgeText: { color: "#d6f1e4", fontSize: 7, fontWeight: "900", letterSpacing: 0.8 },
  liveGarageStage: { height: 130, overflow: "hidden", borderRadius: 12, backgroundColor: "#dbe5f0", borderWidth: 1, borderColor: "rgba(255,255,255,.2)" },
  liveGarageHint: { color: "#b7c5d9", fontSize: 8, lineHeight: 12, marginTop: 7 },
  vehicleCategoryHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 7, paddingHorizontal: 2 },
  vehicleCategoryTitle: { color: "#536687", fontSize: 9, letterSpacing: 1.4, fontWeight: "900" },
  vehicleCategoryStatus: { color: "#8b94aa", fontSize: 7, fontWeight: "900", letterSpacing: 0.6 },
  vehicleRail: { gap: 9, paddingBottom: 4, paddingRight: 4 },
  vehicleCard: { width: 154, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e1e7f2", borderRadius: 15, padding: 9, alignItems: "center" },
  selectedVehicleCard: { borderColor: "#8d91ee", backgroundColor: "#f1f1ff" },
  vehiclePreview: { height: 78, width: "100%", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 11, backgroundColor: "#edf5ff" },
  vehicleName: { color: "#253651", fontSize: 12, fontWeight: "900", marginTop: 5 },
  vehicleDescription: { minHeight: 27, color: "#8390a8", fontSize: 8, lineHeight: 11, textAlign: "center", marginTop: 3 },
  vehicleButton: { minHeight: 30, width: "100%", marginTop: 7, borderRadius: 9, backgroundColor: "#777de0", borderWidth: 1, borderColor: "#a6a9f3", alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  vehicleSelectedButton: { backgroundColor: "#e7f7ee", borderColor: "#9bd5b4" },
  vehicleButtonText: { color: "#fff", fontWeight: "900", fontSize: 8, letterSpacing: 0.25, textAlign: "center" },
  backgroundSection: { marginTop: 9, marginBottom: 23 },
  backgroundHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  newBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: "#ffedbb" },
  newBadgeText: { color: "#9b6f25", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  backgroundRail: { gap: 10, paddingBottom: 4, paddingRight: 4 },
  backgroundCard: { width: 188, overflow: "hidden", borderRadius: 15, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e1e7f2" },
  selectedBackgroundCard: { borderColor: "#8d91ee", backgroundColor: "#f1f1ff" },
  backgroundPreview: { height: 100, width: "100%", overflow: "hidden", backgroundColor: "#e7f3ff" },
  currentWorldBadge: { position: "absolute", top: 7, right: 7, paddingVertical: 4, paddingHorizontal: 7, borderRadius: 99, backgroundColor: "rgba(255,255,255,.9)" },
  currentWorldText: { color: "#58765f", fontSize: 7, fontWeight: "900", letterSpacing: 0.6 },
  backgroundCardCopy: { padding: 10 },
  backgroundName: { color: "#253651", fontSize: 12, fontWeight: "900" },
  backgroundDescription: { minHeight: 24, color: "#8390a8", fontSize: 8, lineHeight: 11, marginTop: 3 },
  backgroundButton: { minHeight: 29, marginTop: 7, borderRadius: 9, backgroundColor: "#777de0", borderWidth: 1, borderColor: "#a6a9f3", alignItems: "center", justifyContent: "center" },
  backgroundSelectedButton: { backgroundColor: "#e7f7ee", borderColor: "#9bd5b4" },
  backgroundButtonText: { color: "#fff", fontWeight: "900", fontSize: 8, letterSpacing: 0.25 },
  selectedChoiceText: { color: "#477558" },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "48%", flexGrow: 1, minWidth: 145, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e1e7f2", borderRadius: 16, padding: 12 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 9 },
  iconBox: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#fff1cf", alignItems: "center", justifyContent: "center" },
  icon: { color: "#d39722", fontSize: 20, fontWeight: "900" },
  levelBadge: { backgroundColor: "#eef0f8", borderRadius: 99, paddingHorizontal: 7, paddingVertical: 4 },
  levelText: { color: "#75829b", fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
  cardTitle: { color: "#253651", fontWeight: "900", fontSize: 14 },
  cardDescription: { color: "#8390a8", fontSize: 10, lineHeight: 15, minHeight: 31, marginTop: 4 },
  buyButton: { marginTop: 10, borderRadius: 10, backgroundColor: "#777de0", borderWidth: 1, borderColor: "#a6a9f3", paddingVertical: 9, alignItems: "center", minHeight: 33, justifyContent: "center" },
  maxButton: { backgroundColor: "#e7f7ee", borderColor: "#9bd5b4" },
  poorButton: { backgroundColor: "#eef0f6", borderColor: "#dce1ec" },
  pressed: { opacity: 0.75 },
  buyText: { color: "#fff", fontWeight: "900", fontSize: 8, letterSpacing: 0.35, textAlign: "center" },
  dimText: { color: "#9aa3b5" },
  skinCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e1e7f2", borderRadius: 16, padding: 14 },
  skinTitle: { color: "#253651", fontSize: 14, fontWeight: "900" },
  skinCopy: { color: "#8390a8", fontSize: 10, marginTop: 4, marginBottom: 13 },
  skinRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" },
  swatchButton: { width: 48, height: 69, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "#f2f4fa", borderWidth: 1, borderColor: "transparent" },
  selectedSwatch: { borderColor: "#8d91ee", backgroundColor: "#f1f1ff" },
  swatch: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: "#d9e2eb" },
  swatchLabel: { color: "#75829b", fontSize: 7, fontWeight: "900", marginTop: 6, textAlign: "center" },
  lockBadge: { position: "absolute", top: 3, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: "#ffe9ac", alignItems: "center", justifyContent: "center" },
  lockText: { fontSize: 10, color: "#8a6423", fontWeight: "900" },
});