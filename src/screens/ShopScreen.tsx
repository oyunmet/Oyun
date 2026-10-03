import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PlayerProfile, UpgradeKey } from "../storage/profile";
import { canAfford, itemCost, SHOP_ITEMS } from "../game/shop";

const SKINS = ["#3b82f6", "#ef5b59", "#55bd87", "#d28d45", "#b57be0", "#ec7eaa"];

type Props = {
  profile: PlayerProfile;
  onBack: () => void;
  onBuyUpgrade: (key: UpgradeKey) => void;
  onBuySkin: (skin: number) => void;
};

export default function ShopScreen({ profile, onBack, onBuyUpgrade, onBuySkin }: Props) {
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
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 9, alignItems: "center" },
  backButton: { position: "absolute", left: 16, top: 15, zIndex: 2, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 11, backgroundColor: "#202c3d", borderWidth: 1, borderColor: "#514b43" },
  backText: { color: "#d8e5f2", fontSize: 10, fontWeight: "900" },
  eyebrow: { color: "#dabb7a", fontSize: 9, fontWeight: "900", letterSpacing: 2 },
  title: { color: "#f5ead7", fontFamily: "serif", fontSize: 29, fontWeight: "700", marginTop: 2 },
  wallet: { flexDirection: "row", gap: 14, marginTop: 8, paddingVertical: 7, paddingHorizontal: 13, backgroundColor: "#202d3e", borderRadius: 99, borderWidth: 1, borderColor: "#514c44" },
  gold: { color: "#ffd75e", fontSize: 12, fontWeight: "900" },
  gem: { color: "#7ee7ed", fontSize: 12, fontWeight: "900" },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { color: "#b2a186", fontSize: 10, letterSpacing: 1.8, fontWeight: "900", marginBottom: 10 },
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