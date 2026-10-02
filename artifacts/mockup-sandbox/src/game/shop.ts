import type { PlayerProfile, UpgradeKey } from "../storage/profile";

export type ShopItem = {
  key: UpgradeKey;
  title: string;
  subtitle: string;
  icon: string;
  currency: "gold" | "gems";
  baseCost: number;
  maxLevel: number;
};

export const SHOP_ITEMS: ShopItem[] = [
  { key: "speed", title: "Koşu Hızı", subtitle: "Her seviyede biraz daha hızlı ilerle.", icon: "➤", currency: "gold", baseCost: 35, maxLevel: 5 },
  { key: "jump", title: "Zıplama Gücü", subtitle: "Daha yüksek ve uzun zıplamalar yap.", icon: "↟", currency: "gold", baseCost: 40, maxLevel: 5 },
  { key: "maxHp", title: "Maksimum Can", subtitle: "Her yükseltme başlangıç canını artırır.", icon: "♥", currency: "gold", baseCost: 65, maxLevel: 5 },
  { key: "armor", title: "Zırh", subtitle: "Hasar alma ihtimalini azalt.", icon: "⬟", currency: "gold", baseCost: 70, maxLevel: 5 },
  { key: "doubleJump", title: "Çift Zıplama", subtitle: "Havada bir kez daha zıplayabilirsin.", icon: "⤴", currency: "gems", baseCost: 2, maxLevel: 1 },
  { key: "magnet", title: "Altın Mıknatısı", subtitle: "Yakındaki ödülleri otomatik toplar.", icon: "✦", currency: "gold", baseCost: 125, maxLevel: 1 },
  { key: "dash", title: "Atılma", subtitle: "Basılı tutmadan tek dokunuşla ileri atıl.", icon: "⚡", currency: "gold", baseCost: 145, maxLevel: 1 },
];

export function itemCost(item: ShopItem, level: number) {
  return item.currency === "gems" ? item.baseCost : Math.round(item.baseCost * (1 + level * 0.78));
}

export function canAfford(profile: PlayerProfile, item: ShopItem) {
  const level = profile.upgrades[item.key];
  return level < item.maxLevel && profile[item.currency] >= itemCost(item, level);
}

export function purchaseUpgrade(profile: PlayerProfile, item: ShopItem): PlayerProfile | null {
  if (!canAfford(profile, item)) return null;
  const currentLevel = profile.upgrades[item.key];
  const cost = itemCost(item, currentLevel);
  return {
    ...profile,
    [item.currency]: profile[item.currency] - cost,
    upgrades: {
      ...profile.upgrades,
      [item.key]: currentLevel + 1,
    },
  };
}