import AsyncStorage from "@react-native-async-storage/async-storage";

export const SAVE_KEY = "saraya-yolculuk.profile.v1";

export type UpgradeKey =
  | "speed"
  | "jump"
  | "maxHp"
  | "armor"
  | "doubleJump"
  | "magnet"
  | "dash";

export type PlayerProfile = {
  gold: number;
  gems: number;
  unlockedLevel: number;
  upgrades: Record<UpgradeKey, number>;
  skin: number;
  skinsOwned: number[];
  soundOn: boolean;
};

export const DEFAULT_PROFILE: PlayerProfile = {
  gold: 90,
  gems: 3,
  unlockedLevel: 1,
  upgrades: {
    speed: 0,
    jump: 0,
    maxHp: 0,
    armor: 0,
    doubleJump: 0,
    magnet: 0,
    dash: 0,
  },
  skin: 0,
  skinsOwned: [0],
  soundOn: true,
};

const clampNumber = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.floor(value)))
    : fallback;

export function parseProfile(raw: string | null): PlayerProfile {
  if (!raw) return { ...DEFAULT_PROFILE, upgrades: { ...DEFAULT_PROFILE.upgrades } };

  const saved = JSON.parse(raw) as Partial<PlayerProfile>;
  const upgrades: Partial<Record<UpgradeKey, number>> = saved.upgrades ?? {};
  const savedSkins = Array.isArray(saved.skinsOwned)
    ? saved.skinsOwned.filter((skin): skin is number => Number.isInteger(skin) && skin >= 0 && skin <= 5)
    : [0];

  return {
    gold: clampNumber(saved.gold, DEFAULT_PROFILE.gold, 0, 999999),
    gems: clampNumber(saved.gems, DEFAULT_PROFILE.gems, 0, 999999),
    unlockedLevel: clampNumber(saved.unlockedLevel, 1, 1, 9999),
    skin: clampNumber(saved.skin, 0, 0, 5),
    skinsOwned: Array.from(new Set([0, ...savedSkins])),
    soundOn: typeof saved.soundOn === "boolean" ? saved.soundOn : true,
    upgrades: {
      speed: clampNumber(upgrades.speed, 0, 0, 5),
      jump: clampNumber(upgrades.jump, 0, 0, 5),
      maxHp: clampNumber(upgrades.maxHp, 0, 0, 5),
      armor: clampNumber(upgrades.armor, 0, 0, 5),
      doubleJump: clampNumber(upgrades.doubleJump, 0, 0, 1),
      magnet: clampNumber(upgrades.magnet, 0, 0, 1),
      dash: clampNumber(upgrades.dash, 0, 0, 1),
    },
  };
}

export async function loadProfile(): Promise<PlayerProfile> {
  const raw = await AsyncStorage.getItem(SAVE_KEY);
  return parseProfile(raw);
}

export async function saveProfile(profile: PlayerProfile): Promise<void> {
  await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(profile));
}