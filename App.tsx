import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import GameStage from "./src/components/GameStage";
import RoyalStoryArt from "./src/components/RoyalStoryArt";
import { playSound, prepareAudio } from "./src/audio/sounds";
import ShopScreen from "./src/screens/ShopScreen";
import {
  DEFAULT_PROFILE,
  loadProfile,
  parseProfile,
  PlayerProfile,
  saveProfile,
  CharacterAttribute,
  CharacterId,
  UpgradeKey,
  VehicleId,
} from "./src/storage/profile";
import { purchaseUpgrade, SHOP_ITEMS } from "./src/game/shop";
import { getVehicleSpec, purchaseVehicle } from "./src/game/vehicles";
import {
  getCharacterSpec,
  purchaseCharacter as unlockCharacter,
  purchaseCharacterUpgrade,
} from "./src/game/characters";

type Screen = "menu" | "shop" | "map" | "settings" | "playing" | "completed" | "gameover";
type Rewards = { gold: number; gems: number };

const SKIN_SWATCHES = ["#3b82f6", "#ef5b59", "#55bd87", "#d28d45", "#b57be0", "#ec7eaa"];

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() => ({
    ...DEFAULT_PROFILE,
    upgrades: { ...DEFAULT_PROFILE.upgrades },
    skinsOwned: [...DEFAULT_PROFILE.skinsOwned],
    vehiclesOwned: [...DEFAULT_PROFILE.vehiclesOwned],
    charactersOwned: [...DEFAULT_PROFILE.charactersOwned],
    characterUpgrades: {
      knight: { ...DEFAULT_PROFILE.characterUpgrades.knight },
      ranger: { ...DEFAULT_PROFILE.characterUpgrades.ranger },
      guardian: { ...DEFAULT_PROFILE.characterUpgrades.guardian },
    },
  }));
  const profileRef = useRef(profile);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>("menu");
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [runResult, setRunResult] = useState<Rewards>({ gold: 0, gems: 0 });
  const [storeIssue, setStoreIssue] = useState("");
  const [toast, setToast] = useState("");

  const commitProfile = useCallback((update: (current: PlayerProfile) => PlayerProfile) => {
    const next = update(profileRef.current);
    profileRef.current = next;
    setProfile(next);
  }, []);

  useEffect(() => {
    let mounted = true;
    loadProfile()
      .then((saved) => {
        if (!mounted) return;
        profileRef.current = saved;
        setProfile(saved);
      })
      .catch((error) => {
        console.error("Could not load saved game", error);
        if (!mounted) return;
        profileRef.current = parseProfile(null);
        setProfile(parseProfile(null));
        setStoreIssue("Kayıt okunamadı. Varsayılan kayıtla devam ediliyor.");
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      saveProfile(profile).then(() => {
        setStoreIssue((current) => current.startsWith("Kayıt yazılamadı") ? "" : current);
      }).catch((error) => {
        console.error("Could not save game", error);
        setStoreIssue("Kayıt yazılamadı. Uygulamayı kapatmadan önce tekrar deneyin.");
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [profile, loaded]);

  useEffect(() => {
    if (!loaded || !profile.soundOn) return;
    prepareAudio().catch((error) => console.warn("Audio setup failed", error));
  }, [loaded, profile.soundOn]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const startGame = useCallback((level: number) => {
    setSelectedLevel(level);
    setRunResult({ gold: 0, gems: 0 });
    setScreen("playing");
  }, []);

  const addRewards = useCallback((rewards: Rewards) => {
    commitProfile((current) => ({
      ...current,
      gold: current.gold + rewards.gold,
      gems: current.gems + rewards.gems,
    }));
    setRunResult(rewards);
  }, [commitProfile]);

  const handleComplete = useCallback((rewards: Rewards) => {
    commitProfile((current) => ({
      ...current,
      gold: current.gold + rewards.gold + 30 + selectedLevel * 3,
      gems: current.gems + rewards.gems + 1,
      unlockedLevel: Math.max(current.unlockedLevel, selectedLevel + 1),
    }));
    setRunResult({ gold: rewards.gold + 30 + selectedLevel * 3, gems: rewards.gems + 1 });
    setScreen("completed");
  }, [commitProfile, selectedLevel]);

  const handleGameOver = useCallback((rewards: Rewards) => {
    addRewards(rewards);
    setScreen("gameover");
  }, [addRewards]);

  const buyUpgrade = useCallback((key: UpgradeKey) => {
    const item = SHOP_ITEMS.find((candidate) => candidate.key === key);
    if (!item) return;
    const before = profileRef.current;
    const next = purchaseUpgrade(before, item);
    if (!next) {
      setToast(before.upgrades[key] >= item.maxLevel ? "Bu yetenek en yüksek seviyede." : "Bu yükseltme için yeterli para yok.");
      return;
    }
    commitProfile(() => next);
    playSound("gem", before.soundOn);
    setToast(`${item.title} kalıcı olarak geliştirildi.`);
  }, [commitProfile]);

  const buyCharacterUpgrade = useCallback((character: CharacterId, attribute: CharacterAttribute) => {
    const before = profileRef.current;
    const next = purchaseCharacterUpgrade(before, character, attribute);
    if (!next) {
      const current = before.characterUpgrades[character][attribute];
      setToast(current >= 5 ? "Bu özellik en yüksek seviyede." : "Bu özellik için yeterli altın yok.");
      return;
    }
    commitProfile(() => next);
    playSound("coin", before.soundOn);
    setToast(`${getCharacterSpec(character).name} için ${attribute === "health" ? "can" : attribute === "armor" ? "zırh" : attribute === "jump" ? "zıplama" : "hız"} geliştirildi.`);
  }, [commitProfile]);

  const selectCharacter = useCallback((character: CharacterId) => {
    const before = profileRef.current;
    if (before.charactersOwned.includes(character)) {
      commitProfile((current) => ({ ...current, character }));
      setToast(`${getCharacterSpec(character).name} seçildi.`);
      playSound("coin", before.soundOn);
      return;
    }
    const next = unlockCharacter(before, character);
    if (!next) {
      setToast("Bu kahraman için yeterli altın yok.");
      return;
    }
    commitProfile(() => next);
    playSound("gem", before.soundOn);
    setToast(`${getCharacterSpec(character).name} açıldı ve seçildi.`);
  }, [commitProfile]);

  const selectVehicle = useCallback((vehicle: VehicleId) => {
    const before = profileRef.current;
    if (before.vehiclesOwned.includes(vehicle)) {
      commitProfile((current) => ({ ...current, vehicle }));
      setToast(`${getVehicleSpec(vehicle).name} seçildi.`);
      return;
    }

    const next = purchaseVehicle(before, vehicle);
    if (!next) {
      setToast("Bu araç için yeterli altın yok.");
      return;
    }
    commitProfile(() => next);
    playSound("coin", before.soundOn);
    setToast(`${getVehicleSpec(vehicle).name} satın alındı ve seçildi.`);
  }, [commitProfile]);

  const characterSpec = getCharacterSpec(profile.character);
  const characterLevels = profile.characterUpgrades[profile.character];
  const gameUpgrades = {
    ...profile.upgrades,
    speed: profile.upgrades.speed + characterLevels.speed + (characterSpec.bonus.speed ?? 0),
    jump: profile.upgrades.jump + characterLevels.jump + (characterSpec.bonus.jump ?? 0),
    maxHp: profile.upgrades.maxHp + characterLevels.health + (characterSpec.bonus.health ?? 0),
    armor: profile.upgrades.armor + characterLevels.armor + (characterSpec.bonus.armor ?? 0),
  };

  const buySkin = useCallback((skin: number) => {
    const before = profileRef.current;
    if (before.skinsOwned.includes(skin)) {
      commitProfile((current) => ({ ...current, skin }));
      setToast("Kostüm seçildi.");
      playSound("coin", before.soundOn);
      return;
    }
    const cost = 45 + skin * 20;
    if (before.gold < cost) {
      setToast("Bu kostüm için yeterli altın yok.");
      return;
    }
    commitProfile((current) => ({
      ...current,
      gold: current.gold - cost,
      skin,
      skinsOwned: [...current.skinsOwned, skin],
    }));
    playSound("coin", before.soundOn);
    setToast("Yeni kostüm açıldı ve seçildi.");
  }, [commitProfile]);

  if (!loaded) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.loading}>
          <Text style={styles.brandMark}>⚔</Text>
          <Text style={styles.loadingText}>KAYIT YÜKLENİYOR</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {storeIssue ? (
        <View style={styles.storageBanner}>
          <Text style={styles.storageBannerText}>{storeIssue}</Text>
          <Pressable onPress={() => setStoreIssue("")}><Text style={styles.dismiss}>×</Text></Pressable>
        </View>
      ) : null}

      {screen === "playing" && (
        <GameStage
          key={`level-${selectedLevel}-${profile.character}`}
          level={selectedLevel}
          character={profile.character}
          vehicle={profile.vehicle}
          upgrades={gameUpgrades}
          skin={profile.skin}
          soundOn={profile.soundOn}
          onExit={() => setScreen("menu")}
          onComplete={handleComplete}
          onGameOver={handleGameOver}
        />
      )}

      {screen === "menu" && (
        <ScrollView contentContainerStyle={styles.menuScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.menu}>
            <View style={styles.topline}>
              <View style={styles.brandChip}><Text style={styles.brandIcon}>✦</Text><Text style={styles.brandText}>SARAYA YOLCULUK  /  ROYAL QUEST</Text></View>
              <Pressable onPress={() => setScreen("settings")} style={styles.settingsIcon} accessibilityLabel="Ayarlar">
                <Text style={styles.settingsIconText}>⚙</Text>
              </Pressable>
            </View>
            <View style={styles.hero}>
              <Text style={styles.heroEyebrow}>BİR SONRAKİ BÖLÜM HİÇBİTMİYOR</Text>
              <Text style={styles.heroTitle}>SARAYA{"\n"}<Text style={styles.heroTitleEm}>YOLCULUK</Text></Text>
              <Text style={styles.heroCopy}>Tuzakları aş. Altınları topla.{"\n"}Sarayın yolunu bul.</Text>
              <View style={styles.heroArt}>
                <RoyalStoryArt
                  knightColor={SKIN_SWATCHES[profile.skin] ?? SKIN_SWATCHES[0]}
                  character={profile.character}
                  vehicle={profile.vehicle}
                />
                <View style={styles.heroArtFrame} />
                <View style={styles.heroArtCaption}>
                  <Text style={styles.heroArtCaptionText}>{getCharacterSpec(profile.character).name.toLocaleUpperCase("tr-TR")}</Text>
                  <Text style={styles.heroArtCaptionText}>GECE YOLU</Text>
                </View>
              </View>
              <View style={styles.chapterRow}>
                <Text style={styles.chapterLabel}>ŞİMDİKİ SAYFA</Text>
                <View style={styles.chapterRule} />
                <Text style={styles.chapterNumber}>BÖLÜM {profile.unlockedLevel}</Text>
              </View>
              <Pressable
                onPress={() => setScreen("shop")}
                style={({ pressed }) => [styles.heroCharacterButton, pressed && styles.pressed]}
                accessibilityLabel={`${getCharacterSpec(profile.character).name} karakterini değiştir veya geliştir`}
              >
                <View style={styles.heroCharacterSeal}><Text style={styles.heroCharacterSealText}>✦</Text></View>
                <View style={styles.heroCharacterInfo}>
                  <Text style={styles.heroCharacterLabel}>YOL ARKADAŞIN</Text>
                  <Text style={styles.heroCharacterName}>{getCharacterSpec(profile.character).name}</Text>
                </View>
                <Text style={styles.heroCharacterAction}>DEĞİŞTİR  →</Text>
              </Pressable>
            </View>
            <View style={styles.walletRow}>
              <View style={styles.walletCard}><Text style={styles.walletIconGold}>●</Text><View><Text style={styles.walletNumber}>{profile.gold}</Text><Text style={styles.walletLabel}>ALTIN</Text></View></View>
              <View style={styles.walletCard}><Text style={styles.walletIconGem}>◆</Text><View><Text style={styles.walletNumber}>{profile.gems}</Text><Text style={styles.walletLabel}>MÜCEVHER</Text></View></View>
              <View style={styles.walletCard}><Text style={styles.walletIconLevel}>▣</Text><View><Text style={styles.walletNumber}>{profile.unlockedLevel}</Text><Text style={styles.walletLabel}>AÇIK BÖLÜM</Text></View></View>
            </View>
            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={() => startGame(profile.unlockedLevel)}>
              <Text style={styles.primaryButtonText}>MACERAYA BAŞLA</Text><Text style={styles.primaryArrow}>→</Text>
            </Pressable>
            <View style={styles.secondaryRow}>
              <MenuTile icon="⬡" label="DÜKKAN" onPress={() => setScreen("shop")} />
              <MenuTile icon="⌁" label="BÖLÜMLER" onPress={() => { setSelectedLevel(profile.unlockedLevel); setScreen("map"); }} />
            </View>
            <View style={styles.tip}><Text style={styles.tipIcon}>✦</Text><Text style={styles.tipText}>İPUCU  ·  ÇİFT ZIPLAMA VE ATILMA YETENEKLERİNİ DÜKKANDAN AÇ.</Text></View>
            <Text style={styles.footer}>KÜÇÜK BİR KAHRAMANIN BÜYÜK YOLCULUĞU</Text>
            <View style={styles.copyright}>
              <Text style={styles.copyrightText}>Tüm hakları saklıdır. Muhammed Emin Türkoğlu tarafından tasarlanmıştır.</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {screen === "shop" && (
        <ShopScreen
          profile={profile}
          onBack={() => setScreen("menu")}
          onBuyUpgrade={buyUpgrade}
          onBuySkin={buySkin}
          onSelectVehicle={selectVehicle}
          onSelectCharacter={selectCharacter}
          onBuyCharacterUpgrade={buyCharacterUpgrade}
        />
      )}

      {screen === "map" && (
        <View style={styles.subScreen}>
          <HeaderBack title="Bölüm Haritası" eyebrow="İLERLEME" onBack={() => setScreen("menu")} />
          <View style={styles.mapIntro}>
            <Text style={styles.mapIntroTitle}>Sıradaki durak: bölüm {profile.unlockedLevel}</Text>
            <Text style={styles.mapIntroCopy}>Her zafer yeni bir rota açar. Tuzaklar her bölümde sıklaşır.</Text>
          </View>
          <ScrollView contentContainerStyle={styles.levelList}>
            {Array.from({ length: Math.min(profile.unlockedLevel + 3, 12) }, (_, index) => index + 1).map((level) => {
              const unlocked = level <= profile.unlockedLevel;
              const selected = level === selectedLevel;
              return (
                <Pressable
                  key={level}
                  onPress={() => unlocked && setSelectedLevel(level)}
                  style={[styles.levelCard, selected && styles.selectedLevelCard, !unlocked && styles.lockedLevelCard]}
                >
                  <View style={[styles.levelNumber, unlocked && styles.levelNumberOpen]}>
                    <Text style={styles.levelNumberText}>{unlocked ? String(level).padStart(2, "0") : "×"}</Text>
                  </View>
                  <View style={styles.levelInfo}>
                    <Text style={styles.levelTitle}>{unlocked ? `Bölüm ${level}` : "Henüz kilitli"}</Text>
                    <Text style={styles.levelDescription}>{unlocked ? level === 1 ? "İlk adım · Saray yolu" : "Daha fazla tuzak · Daha çok ödül" : "Önce önceki bölümü tamamla"}</Text>
                  </View>
                  <Text style={styles.levelStatus}>{unlocked ? selected ? "SEÇİLİ" : "AÇIK" : "KİLİTLİ"}</Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => startGame(selectedLevel)}
              style={[styles.primaryButton, styles.mapStartButton]}
            >
              <Text style={styles.primaryButtonText}>BÖLÜM {selectedLevel} OYNA</Text><Text style={styles.primaryArrow}>→</Text>
            </Pressable>
          </ScrollView>
        </View>
      )}

      {screen === "settings" && (
        <View style={styles.subScreen}>
          <HeaderBack title="Ayarlar" eyebrow="OYUN TERCİHLERİ" onBack={() => setScreen("menu")} />
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}><Text>♫</Text></View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Ses efektleri</Text>
                <Text style={styles.settingDescription}>Zıplama, ödül, hasar ve atlı kaçış sesleri</Text>
              </View>
              <Switch
                value={profile.soundOn}
                onValueChange={(value) => {
                  commitProfile((current) => ({ ...current, soundOn: value }));
                  if (value) playSound("coin", true);
                }}
                trackColor={{ false: "#445367", true: "#c18e43" }}
                thumbColor="#fff5dd"
              />
            </View>
          </View>
          <View style={styles.settingsNote}>
            <Text style={styles.settingsNoteTitle}>Kayıt durumu</Text>
            <Text style={styles.settingsNoteBody}>Altınların, mücevherlerin, açtığın bölümler ve yükseltmeler bu cihazda otomatik kaydedilir.</Text>
          </View>
          <Pressable style={styles.secondaryWide} onPress={() => setScreen("shop")}>
            <Text style={styles.secondaryWideText}>DÜKKANI AÇ  →</Text>
          </Pressable>
        </View>
      )}

      {screen === "completed" && (
        <ResultScreen
          complete
          level={selectedLevel}
          rewards={runResult}
          nextLevel={profile.unlockedLevel}
          onNext={() => startGame(profile.unlockedLevel)}
          onMenu={() => setScreen("menu")}
          onShop={() => setScreen("shop")}
        />
      )}

      {screen === "gameover" && (
        <ResultScreen
          complete={false}
          level={selectedLevel}
          rewards={runResult}
          nextLevel={selectedLevel}
          onNext={() => startGame(selectedLevel)}
          onMenu={() => setScreen("menu")}
          onShop={() => setScreen("shop")}
        />
      )}

      {toast ? <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View> : null}
    </SafeAreaView>
  );
}

function MenuTile({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuTile, pressed && styles.pressed]}>
      <Text style={styles.menuTileIcon}>{icon}</Text>
      <Text style={styles.menuTileLabel}>{label}</Text>
      <Text style={styles.menuTileArrow}>↗</Text>
    </Pressable>
  );
}

function HeaderBack({ title, eyebrow, onBack }: { title: string; eyebrow: string; onBack: () => void }) {
  return (
    <View style={styles.subHeader}>
      <Pressable onPress={onBack} style={styles.subBack}><Text style={styles.subBackText}>‹  GERİ</Text></Pressable>
      <Text style={styles.subEyebrow}>{eyebrow}</Text>
      <Text style={styles.subTitle}>{title}</Text>
    </View>
  );
}

function ResultScreen({ complete, level, rewards, nextLevel, onNext, onMenu, onShop }: {
  complete: boolean;
  level: number;
  rewards: Rewards;
  nextLevel: number;
  onNext: () => void;
  onMenu: () => void;
  onShop: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.resultScroll}>
      <View style={styles.result}>
        <View style={[styles.resultMedallion, !complete && styles.failMedallion]}>
          <Text style={styles.resultMedallionText}>{complete ? "✦" : "♥"}</Text>
        </View>
        <Text style={styles.resultEyebrow}>{complete ? "BÖLÜM TAMAMLANDI!" : "BU KEZ OLMADI"}</Text>
        <Text style={styles.resultTitle}>{complete ? "Sarayın kapısında" : "Bir can daha lazım"}</Text>
        <Text style={styles.resultBody}>
          {complete
            ? `Atlı prensesi kaçırdı; ama yeni bir bölüm açıldı. Şövalye yeniden yola çıkmaya hazır.`
            : "Topladığın ganimetin bir kısmı sende kaldı. Dükkandan güçlenip yeniden dene."}
        </Text>
        <View style={styles.resultCard}>
          <View style={styles.resultCardTop}><Text style={styles.resultCardLabel}>BÖLÜM {level}</Text><Text style={styles.resultRank}>{complete ? "✦ ✦ ✦" : "↻"}</Text></View>
          <View style={styles.rewardRow}>
            <View style={styles.rewardBox}><Text style={styles.rewardValue}>+{rewards.gold}</Text><Text style={styles.rewardLabel}>● ALTIN</Text></View>
            <View style={styles.rewardDivider} />
            <View style={styles.rewardBox}><Text style={styles.rewardValue}>+{rewards.gems}</Text><Text style={styles.rewardLabel}>◆ MÜCEVHER</Text></View>
          </View>
          {complete ? <Text style={styles.unlockText}>BÖLÜM {nextLevel} AÇILDI  →</Text> : null}
        </View>
        <Pressable onPress={onNext} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{complete ? `BÖLÜM ${nextLevel} OYNA` : "YENİDEN DENE"}</Text><Text style={styles.primaryArrow}>→</Text>
        </Pressable>
        <View style={styles.resultLinks}>
          <Pressable onPress={onShop} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>DÜKKAN</Text></Pressable>
          <Pressable onPress={onMenu} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>ANA MENÜ</Text></Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#091321", alignItems: "stretch" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  brandMark: { color: "#f3cc6b", fontSize: 36 },
  loadingText: { color: "#9eafc1", fontSize: 10, fontWeight: "900", letterSpacing: 2, marginTop: 12 },
  storageBanner: { margin: 8, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#593f29", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  storageBannerText: { flex: 1, color: "#fff0d1", fontSize: 11, fontWeight: "700" },
  dismiss: { color: "#fff0d1", fontSize: 20, paddingHorizontal: 6 },
  menuScroll: { flexGrow: 1, justifyContent: "flex-start", paddingVertical: 10 },
  menu: { width: "100%", maxWidth: 580, alignSelf: "center", flexGrow: 1, paddingHorizontal: 20, paddingBottom: 16 },
  topline: { height: 44, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandChip: { flexDirection: "row", gap: 7, alignItems: "center", borderRadius: 99, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#17273a", borderWidth: 1, borderColor: "#8f7652" },
  brandIcon: { color: "#e6c47e", fontSize: 13 },
  brandText: { color: "#d5c8ad", fontSize: 8, fontWeight: "900", letterSpacing: 1.05 },
  settingsIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#17273a", borderWidth: 1, borderColor: "#665442" },
  settingsIconText: { color: "#e4d5ba", fontSize: 16 },
  hero: { marginTop: 17, paddingHorizontal: 2 },
  heroEyebrow: { color: "#e2bd78", fontWeight: "900", fontSize: 8, letterSpacing: 2.1 },
  heroTitle: { color: "#f5ead7", fontFamily: "serif", fontWeight: "700", fontSize: 43, lineHeight: 44, letterSpacing: 0.8, marginTop: 8 },
  heroTitleEm: { color: "#e1c792", fontFamily: "serif", fontWeight: "600", fontSize: 38, fontStyle: "italic", letterSpacing: 1.5 },
  heroCopy: { color: "#c2c3c6", fontSize: 13, lineHeight: 19, marginTop: 8 },
  heroArt: { height: 220, marginTop: 14, borderRadius: 20, backgroundColor: "#172638", borderWidth: 1, borderColor: "#c2a46d", overflow: "hidden", elevation: 9 },
  heroArtFrame: { ...StyleSheet.absoluteFill, margin: 5, borderRadius: 15, borderWidth: 1, borderColor: "rgba(245,224,184,0.22)", pointerEvents: "none" },
  heroArtCaption: { position: "absolute", left: 12, right: 12, bottom: 11, flexDirection: "row", justifyContent: "space-between" },
  heroArtCaptionText: { color: "rgba(248,232,205,0.76)", fontSize: 6, fontWeight: "900", letterSpacing: 0.8 },
  chapterRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 10, marginBottom: 8, paddingHorizontal: 2 },
  chapterLabel: { color: "#888f89", fontSize: 7, fontWeight: "900", letterSpacing: 1.25 },
  chapterRule: { width: 19, height: 1, backgroundColor: "rgba(195,170,116,0.55)" },
  chapterNumber: { color: "#d2bc8b", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  heroCharacterButton: { minHeight: 46, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, borderRadius: 14, backgroundColor: "rgba(20, 37, 54, 0.94)", borderWidth: 1, borderColor: "#4f5a5c" },
  heroCharacterSeal: { width: 29, height: 29, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#303a43", borderWidth: 1, borderColor: "#b99a61" },
  heroCharacterSealText: { color: "#e9cb89", fontSize: 15, fontWeight: "900" },
  heroCharacterInfo: { marginLeft: 9 },
  heroCharacterLabel: { color: "#939da5", fontSize: 7, fontWeight: "900", letterSpacing: 1 },
  heroCharacterName: { color: "#f2eadb", fontSize: 11, fontWeight: "900", marginTop: 2 },
  heroCharacterAction: { marginLeft: "auto", color: "#e6ca8a", fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  walletRow: { flexDirection: "row", gap: 7, marginTop: 11 },
  walletCard: { flex: 1, minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, backgroundColor: "#1a293a", borderWidth: 1, borderColor: "#4d4a43" },
  walletIconGold: { color: "#ffd75e", fontSize: 17 },
  walletIconGem: { color: "#78dfea", fontSize: 17 },
  walletIconLevel: { color: "#d4c08c", fontSize: 16 },
  walletNumber: { color: "#f1f4f6", fontSize: 15, fontWeight: "900" },
  walletLabel: { color: "#a39c91", fontSize: 7, fontWeight: "900", letterSpacing: 0.8, marginTop: 1 },
  primaryButton: { minHeight: 55, marginTop: 13, paddingHorizontal: 17, borderRadius: 15, backgroundColor: "#aa6d4b", borderWidth: 1, borderColor: "#f0d38e", flexDirection: "row", alignItems: "center", justifyContent: "center", elevation: 5 },
  primaryButtonText: { color: "#fff4df", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  primaryArrow: { position: "absolute", right: 17, color: "#fff2d7", fontSize: 20, fontWeight: "700" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  secondaryRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  menuTile: { flex: 1, height: 48, flexDirection: "row", alignItems: "center", paddingHorizontal: 11, gap: 8, borderRadius: 13, backgroundColor: "#1b2a3b", borderWidth: 1, borderColor: "#4a4a46" },
  menuTileIcon: { color: "#d8bb82", fontSize: 18 },
  menuTileLabel: { color: "#e2dccf", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  menuTileArrow: { marginLeft: "auto", color: "#9b958b", fontSize: 14 },
  tip: { flexDirection: "row", gap: 8, alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, marginTop: 10, borderRadius: 12, backgroundColor: "#202d36", borderWidth: 1, borderColor: "#414b4a" },
  tipIcon: { color: "#e7ca8c", fontSize: 13 },
  tipText: { flex: 1, color: "#c0bdba", fontSize: 8, fontWeight: "800", letterSpacing: 0.4, lineHeight: 13 },
  footer: { color: "#99958c", fontSize: 7, fontWeight: "900", letterSpacing: 1.5, textAlign: "center", marginTop: "auto", paddingTop: 13 },
  copyright: { alignItems: "center", marginTop: 7, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(212, 190, 150, 0.15)" },
  copyrightText: { color: "#77828d", fontSize: 8, lineHeight: 13, textAlign: "center", letterSpacing: 0.1 },
  subScreen: { flex: 1, width: "100%", maxWidth: 620, alignSelf: "center" },
  subHeader: { alignItems: "center", paddingTop: 20, paddingBottom: 12 },
  subBack: { position: "absolute", left: 16, top: 19, backgroundColor: "#202c3d", borderRadius: 11, paddingVertical: 8, paddingHorizontal: 11, borderWidth: 1, borderColor: "#514b43" },
  subBackText: { color: "#d8e5f2", fontSize: 10, fontWeight: "900" },
  subEyebrow: { color: "#dabb7a", fontSize: 9, fontWeight: "900", letterSpacing: 2 },
  subTitle: { color: "#f5ead7", fontFamily: "serif", fontSize: 28, fontWeight: "700", marginTop: 3 },
  mapIntro: { marginHorizontal: 17, padding: 15, borderRadius: 15, backgroundColor: "#1d2b3c", borderWidth: 1, borderColor: "#625342" },
  mapIntroTitle: { color: "#e8c984", fontSize: 13, fontWeight: "900" },
  mapIntroCopy: { color: "#b0b4bc", fontSize: 10, lineHeight: 15, marginTop: 4 },
  levelList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 25, gap: 8 },
  levelCard: { minHeight: 66, padding: 10, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: "#1d2a3a", borderWidth: 1, borderColor: "#474b4a" },
  selectedLevelCard: { borderColor: "#d9b772", backgroundColor: "#293648" },
  lockedLevelCard: { opacity: 0.5 },
  levelNumber: { width: 39, height: 39, borderRadius: 12, backgroundColor: "#3a424d", alignItems: "center", justifyContent: "center" },
  levelNumberOpen: { backgroundColor: "#4b4b47" },
  levelNumberText: { color: "#e3c88c", fontSize: 12, fontWeight: "900" },
  levelInfo: { flex: 1 },
  levelTitle: { color: "#eaf0f5", fontSize: 12, fontWeight: "900" },
  levelDescription: { color: "#8fa2b8", fontSize: 9, marginTop: 3 },
  levelStatus: { color: "#b5aa96", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  mapStartButton: { marginTop: 5 },
  settingsCard: { marginHorizontal: 16, marginTop: 15, padding: 15, backgroundColor: "#1d2b3c", borderWidth: 1, borderColor: "#514c44", borderRadius: 16 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  settingIcon: { width: 38, height: 38, backgroundColor: "#394453", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  settingTextWrap: { flex: 1 },
  settingTitle: { color: "#f1e9dc", fontSize: 13, fontWeight: "900" },
  settingDescription: { color: "#adb4bd", fontSize: 9, lineHeight: 14, marginTop: 4 },
  settingsNote: { marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: "#202d39", borderWidth: 1, borderColor: "#414b4a" },
  settingsNoteTitle: { color: "#e2c483", fontWeight: "900", fontSize: 11 },
  settingsNoteBody: { color: "#b1b5bb", fontSize: 10, lineHeight: 16, marginTop: 5 },
  secondaryWide: { marginHorizontal: 16, marginTop: 12, paddingVertical: 14, borderRadius: 13, alignItems: "center", backgroundColor: "#202d3e", borderWidth: 1, borderColor: "#655844" },
  secondaryWideText: { color: "#e7decf", fontSize: 10, fontWeight: "900", letterSpacing: 0.9 },
  resultScroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 24 },
  result: { width: "100%", maxWidth: 480, alignSelf: "center", alignItems: "center" },
  resultMedallion: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#3c5146", borderWidth: 1, borderColor: "#b3aa79" },
  failMedallion: { backgroundColor: "#51404a", borderColor: "#bc7770" },
  resultMedallionText: { color: "#f0d394", fontSize: 31, fontWeight: "900" },
  resultEyebrow: { color: "#dfbd79", fontSize: 9, letterSpacing: 2.2, fontWeight: "900", marginTop: 16 },
  resultTitle: { color: "#f5ead7", fontFamily: "serif", fontSize: 27, fontWeight: "700", marginTop: 4, textAlign: "center" },
  resultBody: { color: "#b0b4bc", fontSize: 12, lineHeight: 19, textAlign: "center", maxWidth: 340, marginTop: 7 },
  resultCard: { width: "100%", maxWidth: 380, marginTop: 18, borderRadius: 17, backgroundColor: "#1d2b3c", borderWidth: 1, borderColor: "#554e44", padding: 15 },
  resultCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultCardLabel: { color: "#90a3b7", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  resultRank: { color: "#e7c77f", fontSize: 13, fontWeight: "900" },
  rewardRow: { flexDirection: "row", alignItems: "center", marginTop: 15 },
  rewardBox: { flex: 1, alignItems: "center" },
  rewardValue: { color: "#f3f3ed", fontSize: 21, fontWeight: "900" },
  rewardLabel: { color: "#9baec0", fontSize: 8, fontWeight: "900", letterSpacing: 0.8, marginTop: 3 },
  rewardDivider: { width: 1, height: 34, backgroundColor: "#344a60" },
  unlockText: { color: "#a8d29d", fontSize: 9, textAlign: "center", fontWeight: "900", letterSpacing: 1, marginTop: 15 },
  resultLinks: { flexDirection: "row", gap: 10, marginTop: 9 },
  secondaryButton: { minWidth: 125, paddingVertical: 13, paddingHorizontal: 15, borderRadius: 13, backgroundColor: "#202d3e", borderWidth: 1, borderColor: "#514d46", alignItems: "center" },
  secondaryButtonText: { color: "#e4ded4", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  toast: { position: "absolute", bottom: 22, left: 18, right: 18, alignSelf: "center", maxWidth: 440, backgroundColor: "#e2c17f", borderRadius: 13, paddingVertical: 11, paddingHorizontal: 15, zIndex: 30, elevation: 4 },
  toastText: { color: "#34291d", textAlign: "center", fontWeight: "900", fontSize: 11 },
});