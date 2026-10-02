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
import { playSound, prepareAudio } from "./src/audio/sounds";
import ShopScreen from "./src/screens/ShopScreen";
import {
  DEFAULT_PROFILE,
  loadProfile,
  parseProfile,
  PlayerProfile,
  saveProfile,
  UpgradeKey,
} from "./src/storage/profile";
import { purchaseUpgrade, SHOP_ITEMS } from "./src/game/shop";

type Screen = "menu" | "shop" | "map" | "settings" | "playing" | "completed" | "gameover";
type Rewards = { gold: number; gems: number };

const SKIN_SWATCHES = ["#3b82f6", "#ef5b59", "#55bd87", "#d28d45", "#b57be0", "#ec7eaa"];

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() => ({
    ...DEFAULT_PROFILE,
    upgrades: { ...DEFAULT_PROFILE.upgrades },
    skinsOwned: [...DEFAULT_PROFILE.skinsOwned],
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
          key={`level-${selectedLevel}`}
          level={selectedLevel}
          upgrades={profile.upgrades}
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
              <View style={styles.brandChip}><Text style={styles.brandIcon}>✦</Text><Text style={styles.brandText}>MASAL  /  MACERA</Text></View>
              <Pressable onPress={() => setScreen("settings")} style={styles.settingsIcon} accessibilityLabel="Ayarlar">
                <Text style={styles.settingsIconText}>⚙</Text>
              </Pressable>
            </View>
            <View style={styles.hero}>
              <Text style={styles.heroEyebrow}>BİR SONRAKİ BÖLÜM HİÇBİTMİYOR</Text>
              <Text style={styles.heroTitle}>SARAYA{"\n"}YOLCULUK</Text>
              <Text style={styles.heroCopy}>Tuzakları aş. Altınları topla.{"\n"}Sarayın yolunu bul.</Text>
              <View style={styles.heroArt}>
                <View style={styles.starA}><Text style={styles.starText}>✦</Text></View>
                <View style={styles.starB}><Text style={styles.starText}>✧</Text></View>
                <View style={styles.heroCastle}><Text style={styles.castleEmoji}>🏰</Text></View>
                <View style={[styles.heroKnight, { backgroundColor: SKIN_SWATCHES[profile.skin] }]}>
                  <Text style={styles.knightFace}>•ᴗ•</Text>
                </View>
                <View style={styles.heroGround} />
                <View style={styles.heroSign}><Text style={styles.heroSignText}>BÖLÜM {profile.unlockedLevel} · DEVAM ET</Text></View>
              </View>
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
          </View>
        </ScrollView>
      )}

      {screen === "shop" && (
        <ShopScreen
          profile={profile}
          onBack={() => setScreen("menu")}
          onBuyUpgrade={buyUpgrade}
          onBuySkin={buySkin}
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
                    <Text style={styles.levelNumberText}>{unlocked ? String(level).padStart(2, "0") : "🔒"}</Text>
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
  root: { flex: 1, backgroundColor: "#0b1624", alignItems: "stretch" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  brandMark: { color: "#f3cc6b", fontSize: 36 },
  loadingText: { color: "#9eafc1", fontSize: 10, fontWeight: "900", letterSpacing: 2, marginTop: 12 },
  storageBanner: { margin: 8, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#593f29", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  storageBannerText: { flex: 1, color: "#fff0d1", fontSize: 11, fontWeight: "700" },
  dismiss: { color: "#fff0d1", fontSize: 20, paddingHorizontal: 6 },
  menuScroll: { flexGrow: 1, justifyContent: "center", paddingVertical: 8 },
  menu: { width: "100%", maxWidth: 540, alignSelf: "center", paddingHorizontal: 20, paddingBottom: 12 },
  topline: { height: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandChip: { flexDirection: "row", gap: 7, alignItems: "center", borderRadius: 99, paddingVertical: 7, paddingHorizontal: 11, backgroundColor: "#15263a", borderWidth: 1, borderColor: "#2f465e" },
  brandIcon: { color: "#f0cb71", fontSize: 13 },
  brandText: { color: "#aebfd0", fontSize: 8, fontWeight: "900", letterSpacing: 1.15 },
  settingsIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "#15263a", borderWidth: 1, borderColor: "#2f465e" },
  settingsIconText: { color: "#c6d2de", fontSize: 16 },
  hero: { marginTop: 15, paddingHorizontal: 2 },
  heroEyebrow: { color: "#eac767", fontWeight: "900", fontSize: 8, letterSpacing: 2 },
  heroTitle: { color: "#f4efe4", fontWeight: "900", fontSize: 42, lineHeight: 42, letterSpacing: 1.3, marginTop: 7 },
  heroCopy: { color: "#9fb0c1", fontSize: 13, lineHeight: 19, marginTop: 7 },
  heroArt: { height: 135, marginTop: 12, borderRadius: 17, backgroundColor: "#152941", borderWidth: 1, borderColor: "#304a65", overflow: "hidden" },
  starA: { position: "absolute", top: 18, left: 37 },
  starB: { position: "absolute", top: 45, right: 115 },
  starText: { color: "#e4c878", fontSize: 15 },
  heroCastle: { position: "absolute", right: 35, top: 19 },
  castleEmoji: { fontSize: 59 },
  heroKnight: { position: "absolute", left: 83, top: 55, width: 30, height: 39, borderRadius: 7, borderWidth: 2, borderColor: "#d5eaff", alignItems: "center", justifyContent: "center" },
  knightFace: { color: "#ffdda8", fontSize: 9, fontWeight: "900" },
  heroGround: { position: "absolute", bottom: 0, left: 0, right: 0, height: 21, backgroundColor: "#33544a", borderTopWidth: 3, borderTopColor: "#8db574" },
  heroSign: { position: "absolute", left: 17, bottom: 29, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6, backgroundColor: "#263d56" },
  heroSignText: { fontSize: 7, color: "#becbd8", fontWeight: "900", letterSpacing: 1 },
  walletRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  walletCard: { flex: 1, minHeight: 53, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 13, backgroundColor: "#122237", borderWidth: 1, borderColor: "#263c55" },
  walletIconGold: { color: "#ffd75e", fontSize: 17 },
  walletIconGem: { color: "#78dfea", fontSize: 17 },
  walletIconLevel: { color: "#d0aaff", fontSize: 16 },
  walletNumber: { color: "#f1f4f6", fontSize: 15, fontWeight: "900" },
  walletLabel: { color: "#71879e", fontSize: 7, fontWeight: "900", letterSpacing: 0.8, marginTop: 1 },
  primaryButton: { minHeight: 52, marginTop: 13, paddingHorizontal: 17, borderRadius: 13, backgroundColor: "#ba8842", borderWidth: 1, borderColor: "#e8be68", flexDirection: "row", alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#fff6e3", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  primaryArrow: { position: "absolute", right: 17, color: "#fff2d7", fontSize: 20, fontWeight: "700" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  secondaryRow: { flexDirection: "row", gap: 9, marginTop: 9 },
  menuTile: { flex: 1, height: 49, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 9, borderRadius: 12, backgroundColor: "#15263a", borderWidth: 1, borderColor: "#30465e" },
  menuTileIcon: { color: "#d0b36a", fontSize: 18 },
  menuTileLabel: { color: "#d6e0e9", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  menuTileArrow: { marginLeft: "auto", color: "#71879e", fontSize: 14 },
  tip: { flexDirection: "row", gap: 8, alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, marginTop: 13, borderRadius: 11, backgroundColor: "#18283a" },
  tipIcon: { color: "#f1ce78", fontSize: 13 },
  tipText: { flex: 1, color: "#9daebe", fontSize: 8, fontWeight: "800", letterSpacing: 0.5, lineHeight: 13 },
  footer: { color: "#52667b", fontSize: 7, fontWeight: "900", letterSpacing: 1.6, textAlign: "center", marginTop: 13 },
  subScreen: { flex: 1, width: "100%", maxWidth: 620, alignSelf: "center" },
  subHeader: { alignItems: "center", paddingTop: 20, paddingBottom: 12 },
  subBack: { position: "absolute", left: 16, top: 19, backgroundColor: "#182940", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 11 },
  subBackText: { color: "#d8e5f2", fontSize: 10, fontWeight: "900" },
  subEyebrow: { color: "#eac767", fontSize: 9, fontWeight: "900", letterSpacing: 2 },
  subTitle: { color: "#f4efe4", fontSize: 27, fontWeight: "900", marginTop: 3 },
  mapIntro: { marginHorizontal: 17, padding: 15, borderRadius: 14, backgroundColor: "#14253a", borderWidth: 1, borderColor: "#2d435c" },
  mapIntroTitle: { color: "#f0cc75", fontSize: 13, fontWeight: "900" },
  mapIntroCopy: { color: "#9aacc0", fontSize: 10, lineHeight: 15, marginTop: 4 },
  levelList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 25, gap: 8 },
  levelCard: { minHeight: 66, padding: 10, borderRadius: 13, flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: "#14253a", borderWidth: 1, borderColor: "#2a4059" },
  selectedLevelCard: { borderColor: "#e2b958", backgroundColor: "#1e3043" },
  lockedLevelCard: { opacity: 0.5 },
  levelNumber: { width: 39, height: 39, borderRadius: 12, backgroundColor: "#2a3a4d", alignItems: "center", justifyContent: "center" },
  levelNumberOpen: { backgroundColor: "#36536a" },
  levelNumberText: { color: "#e3c36b", fontSize: 12, fontWeight: "900" },
  levelInfo: { flex: 1 },
  levelTitle: { color: "#eaf0f5", fontSize: 12, fontWeight: "900" },
  levelDescription: { color: "#8fa2b8", fontSize: 9, marginTop: 3 },
  levelStatus: { color: "#90a3b7", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  mapStartButton: { marginTop: 5 },
  settingsCard: { marginHorizontal: 16, marginTop: 15, padding: 15, backgroundColor: "#14253a", borderWidth: 1, borderColor: "#2d435c", borderRadius: 15 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  settingIcon: { width: 38, height: 38, backgroundColor: "#2a4059", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  settingTextWrap: { flex: 1 },
  settingTitle: { color: "#edf2f7", fontSize: 13, fontWeight: "900" },
  settingDescription: { color: "#94a8bb", fontSize: 9, lineHeight: 14, marginTop: 4 },
  settingsNote: { marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 13, backgroundColor: "#17283c" },
  settingsNoteTitle: { color: "#e6c46c", fontWeight: "900", fontSize: 11 },
  settingsNoteBody: { color: "#9aacc0", fontSize: 10, lineHeight: 16, marginTop: 5 },
  secondaryWide: { marginHorizontal: 16, marginTop: 12, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: "#1d3046", borderWidth: 1, borderColor: "#3c536c" },
  secondaryWideText: { color: "#dce6ef", fontSize: 10, fontWeight: "900", letterSpacing: 0.9 },
  resultScroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 24 },
  result: { width: "100%", maxWidth: 480, alignSelf: "center", alignItems: "center" },
  resultMedallion: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#3b4d40", borderWidth: 1, borderColor: "#95bd79" },
  failMedallion: { backgroundColor: "#4b3339", borderColor: "#bd6b70" },
  resultMedallionText: { color: "#f1d27e", fontSize: 31, fontWeight: "900" },
  resultEyebrow: { color: "#e5c46e", fontSize: 9, letterSpacing: 2.2, fontWeight: "900", marginTop: 16 },
  resultTitle: { color: "#f4efe4", fontSize: 26, fontWeight: "900", marginTop: 4, textAlign: "center" },
  resultBody: { color: "#9aabbd", fontSize: 12, lineHeight: 19, textAlign: "center", maxWidth: 340, marginTop: 7 },
  resultCard: { width: "100%", maxWidth: 380, marginTop: 18, borderRadius: 16, backgroundColor: "#14253a", borderWidth: 1, borderColor: "#30475f", padding: 15 },
  resultCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultCardLabel: { color: "#90a3b7", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  resultRank: { color: "#f4d074", fontSize: 13, fontWeight: "900" },
  rewardRow: { flexDirection: "row", alignItems: "center", marginTop: 15 },
  rewardBox: { flex: 1, alignItems: "center" },
  rewardValue: { color: "#f3f3ed", fontSize: 21, fontWeight: "900" },
  rewardLabel: { color: "#9baec0", fontSize: 8, fontWeight: "900", letterSpacing: 0.8, marginTop: 3 },
  rewardDivider: { width: 1, height: 34, backgroundColor: "#344a60" },
  unlockText: { color: "#a8d29d", fontSize: 9, textAlign: "center", fontWeight: "900", letterSpacing: 1, marginTop: 15 },
  resultLinks: { flexDirection: "row", gap: 10, marginTop: 9 },
  secondaryButton: { minWidth: 125, paddingVertical: 13, paddingHorizontal: 15, borderRadius: 12, backgroundColor: "#182b41", borderWidth: 1, borderColor: "#3b526b", alignItems: "center" },
  secondaryButtonText: { color: "#cbd7e2", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  toast: { position: "absolute", bottom: 22, left: 18, right: 18, alignSelf: "center", maxWidth: 440, backgroundColor: "#e8c36c", borderRadius: 12, paddingVertical: 11, paddingHorizontal: 15, zIndex: 30 },
  toastText: { color: "#312817", textAlign: "center", fontWeight: "900", fontSize: 11 },
});