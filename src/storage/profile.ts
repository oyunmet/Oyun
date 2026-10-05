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

export type VehicleId = "bike" | "motorcycle" | "car";
export type CharacterId = "knight" | "ranger" | "guardian";
export type CharacterAttribute = "speed" | "jump" | "health" | "armor";
export type CharacterUpgradeLevels = Record<CharacterAttribute, number>;

export type PlayerProfile = {
  gold: number;
  gems: number;
  unlockedLevel: number;
  upgrades: Record<UpgradeKey, number>;
  skin: number;
  skinsOwned: number[];
  character: CharacterId;
  charactersOwned: CharacterId[];
  characterUpgrades: Record<CharacterId, CharacterUpgradeLevels>;
  vehicle: VehicleId;
  vehiclesOwned: VehicleId[];
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
  character: "knight",
  charactersOwned: ["knight"],
  characterUpgrades: {
    knight: { speed: 0, jump: 0, health: 0, armor: 0 },
    ranger: { speed: 0, jump: 0, health: 0, armor: 0 },
    guardian: { speed: 0, jump: 0, health: 0, armor: 0 },
  },
  vehicle: "bike",
  vehiclesOwned: ["bike"],
  soundOn: true,
};

const isVehicleId = (value: unknown): value is VehicleId =>
  value === "bike" || value === "motorcycle" || value === "car";

const isCharacterId = (value: unknown): value is CharacterId =>
  value === "knight" || value === "ranger" || value === "guardian";

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
  const savedVehicles = Array.isArray(saved.vehiclesOwned)
    ? saved.vehiclesOwned.filter(isVehicleId)
    : ["bike" as const];
  const vehiclesOwned = Array.from(new Set<VehicleId>(["bike", ...savedVehicles]));
  const vehicle = isVehicleId(saved.vehicle) && vehiclesOwned.includes(saved.vehicle)
    ? saved.vehicle
    : "bike";
  const savedCharacters = Array.isArray(saved.charactersOwned)
    ? saved.charactersOwned.filter(isCharacterId)
    : ["knight" as const];
  const charactersOwned = Array.from(new Set<CharacterId>(["knight", ...savedCharacters]));
  const character = isCharacterId(saved.character) && charactersOwned.includes(saved.character)
    ? saved.character
    : "knight";
  const savedCharacterUpgrades = saved.characterUpgrades as
    | Partial<Record<CharacterId, Partial<CharacterUpgradeLevels>>>
    | undefined;
  const characterUpgrades = (["knight", "ranger", "guardian"] as const).reduce(
    (all, id) => {
      const levels = savedCharacterUpgrades?.[id] ?? {};
      all[id] = {
        speed: clampNumber(levels.speed, 0, 0, 5),
        jump: clampNumber(levels.jump, 0, 0, 5),
        health: clampNumber(levels.health, 0, 0, 5),
        armor: clampNumber(levels.armor, 0, 0, 5),
      };
      return all;
    },
    {} as Record<CharacterId, CharacterUpgradeLevels>,
  );

  return {
    gold: clampNumber(saved.gold, DEFAULT_PROFILE.gold, 0, 999999),
    gems: clampNumber(saved.gems, DEFAULT_PROFILE.gems, 0, 999999),
    unlockedLevel: clampNumber(saved.unlockedLevel, 1, 1, 9999),
    skin: clampNumber(saved.skin, 0, 0, 5),
    skinsOwned: Array.from(new Set([0, ...savedSkins])),
    character,
    charactersOwned,
    characterUpgrades,
    vehicle,
    vehiclesOwned,
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