import type { BackgroundId, PlayerProfile } from "../storage/profile";

export type BackgroundSpec = {
  id: BackgroundId;
  name: string;
  subtitle: string;
  price: number;
  sky: string;
  farHill: string;
  nearHill: string;
  ground: string;
  accent: string;
};

export const BACKGROUNDS: BackgroundSpec[] = [
  {
    id: "royal",
    name: "Saray Ormanı",
    subtitle: "Kale yolundaki ilk macera.",
    price: 0,
    sky: "#c7d8ef",
    farHill: "#829bab",
    nearHill: "#517460",
    ground: "#8fa76c",
    accent: "#efc678",
  },
  {
    id: "candy",
    name: "Şeker Vadisi",
    subtitle: "Şeker ağaçları ve tatlı yollar.",
    price: 150,
    sky: "#f8cfe1",
    farHill: "#f5a9c7",
    nearHill: "#e57f9f",
    ground: "#a6d990",
    accent: "#ffe28a",
  },
  {
    id: "clouds",
    name: "Bulut Krallığı",
    subtitle: "Gökyüzünde bir kale turu.",
    price: 185,
    sky: "#b8e4ff",
    farHill: "#d4e7fa",
    nearHill: "#91bfe2",
    ground: "#edf6ff",
    accent: "#f5d584",
  },
  {
    id: "snow",
    name: "Buzlu Orman",
    subtitle: "Kristal ağaçların arasında.",
    price: 210,
    sky: "#c9edff",
    farHill: "#b6d8ed",
    nearHill: "#84b6d1",
    ground: "#dff6ff",
    accent: "#ffe5a8",
  },
  {
    id: "dino",
    name: "Dino Vadisi",
    subtitle: "Dost dinozorlarla yeşil bir rota.",
    price: 235,
    sky: "#bfe8d9",
    farHill: "#80c1a0",
    nearHill: "#579779",
    ground: "#a5d777",
    accent: "#ffdc82",
  },
  {
    id: "space",
    name: "Yıldız Bahçesi",
    subtitle: "Renkli gezegenlerde uzay gezisi.",
    price: 260,
    sky: "#c9c6f4",
    farHill: "#9a93cc",
    nearHill: "#726eae",
    ground: "#b6b5db",
    accent: "#f6d77d",
  },
];

export function getBackgroundSpec(id: BackgroundId): BackgroundSpec {
  return BACKGROUNDS.find((background) => background.id === id) ?? BACKGROUNDS[0];
}

export function purchaseBackground(profile: PlayerProfile, id: BackgroundId): PlayerProfile | null {
  const background = getBackgroundSpec(id);
  if (profile.backgroundsOwned.includes(id)) return { ...profile, backgroundId: id };
  if (profile.gold < background.price) return null;

  return {
    ...profile,
    gold: profile.gold - background.price,
    backgroundId: id,
    backgroundsOwned: [...profile.backgroundsOwned, id],
  };
}
