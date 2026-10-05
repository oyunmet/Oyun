import type { CharacterAttribute, CharacterId, PlayerProfile } from "../storage/profile";

export type CharacterSpec = {
  id: CharacterId;
  name: string;
  title: string;
  description: string;
  price: number;
  color: string;
  accent: string;
  bonus: Partial<Record<CharacterAttribute, number>>;
};

export const CHARACTERS: CharacterSpec[] = [
  {
    id: "knight",
    name: "Şövalye",
    title: "Sarayın koruyucusu",
    description: "Dengeli ve güvenilir bir yol arkadaşı.",
    price: 0,
    color: "#426a9a",
    accent: "#e5c27b",
    bonus: {},
  },
  {
    id: "ranger",
    name: "Orman İzci",
    title: "Rüzgâr kadar çevik",
    description: "Hızlı koşar, daha yükseğe sıçrar.",
    price: 320,
    color: "#397b61",
    accent: "#a8d397",
    bonus: { speed: 1, jump: 1 },
  },
  {
    id: "guardian",
    name: "Altın Muhafız",
    title: "Zırhı kadar cesur",
    description: "Ek can ve güçlü savunmayla yola çıkar.",
    price: 520,
    color: "#a65a57",
    accent: "#f0d18a",
    bonus: { health: 1, armor: 1 },
  },
];

export const CHARACTER_ATTRIBUTES: {
  key: CharacterAttribute;
  title: string;
  detail: string;
  baseCost: number;
}[] = [
  { key: "speed", title: "Hız", detail: "İlerleme hızını artırır.", baseCost: 42 },
  { key: "jump", title: "Zıplama", detail: "Daha yükseğe sıçrarsın.", baseCost: 48 },
  { key: "health", title: "Can", detail: "Başlangıç canını artırır.", baseCost: 68 },
  { key: "armor", title: "Zırh", detail: "Darbe engelleme şansını yükseltir.", baseCost: 72 },
];

export const CHARACTER_UPGRADE_MAX_LEVEL = 5;

export function getCharacterSpec(id: CharacterId) {
  return CHARACTERS.find((character) => character.id === id) ?? CHARACTERS[0];
}

export function characterUpgradeCost(attribute: CharacterAttribute, level: number) {
  const spec = CHARACTER_ATTRIBUTES.find((candidate) => candidate.key === attribute);
  return spec ? Math.round(spec.baseCost * (1 + level * 0.72)) : 0;
}

export function purchaseCharacter(profile: PlayerProfile, id: CharacterId): PlayerProfile | null {
  if (profile.charactersOwned.includes(id)) return { ...profile, character: id };
  const spec = getCharacterSpec(id);
  if (profile.gold < spec.price) return null;
  return {
    ...profile,
    gold: profile.gold - spec.price,
    character: id,
    charactersOwned: [...profile.charactersOwned, id],
  };
}

export function purchaseCharacterUpgrade(
  profile: PlayerProfile,
  id: CharacterId,
  attribute: CharacterAttribute,
): PlayerProfile | null {
  const current = profile.characterUpgrades[id][attribute];
  if (current >= CHARACTER_UPGRADE_MAX_LEVEL) return null;
  const cost = characterUpgradeCost(attribute, current);
  if (profile.gold < cost) return null;
  return {
    ...profile,
    gold: profile.gold - cost,
    characterUpgrades: {
      ...profile.characterUpgrades,
      [id]: {
        ...profile.characterUpgrades[id],
        [attribute]: current + 1,
      },
    },
  };
}
