import type { VehicleId, VehicleModelId } from "../storage/profile";

type PlayerProfile = {
  gold: number;
  vehicle: VehicleId;
  vehicleModel: VehicleModelId;
  vehiclesOwned: VehicleId[];
  vehicleModelsOwned: VehicleModelId[];
};

export type VehicleSpec = {
  id: VehicleId;
  name: string;
  price: number;
  description: string;
  speed: number;
  jumpVelocity: number;
  hitboxWidth: number;
  hitboxHeight: number;
  spriteWidth: number;
  spriteHeight: number;
  hpBonus: number;
};

export type VehicleModelSpec = {
  id: VehicleModelId;
  vehicle: VehicleId;
  name: string;
  description: string;
  price: number;
  paint: string;
  highlight: string;
  trim: string;
};

export const VEHICLE_MODELS: VehicleModelSpec[] = [
  { id: "bike-royal", vehicle: "bike", name: "Saray Bisikleti", description: "Klasik altın ayrıntılar.", price: 0, paint: "#4778bd", highlight: "#a7d5ff", trim: "#f1d38e" },
  { id: "bike-rainbow", vehicle: "bike", name: "Gökkuşağı", description: "Renkli ve ışıl ışıl.", price: 145, paint: "#dc6e99", highlight: "#ffc3dd", trim: "#9a6ddd" },
  { id: "bike-cloud", vehicle: "bike", name: "Bulut Bisikleti", description: "Bulut gibi hafif görünür.", price: 185, paint: "#54b9b5", highlight: "#b4fff1", trim: "#f5e8b3" },
  { id: "motorcycle-comet", vehicle: "motorcycle", name: "Kuyruklu Yıldız", description: "Parlak gövde, hızlı sürüş.", price: 0, paint: "#e67551", highlight: "#ffc18b", trim: "#ffe2a0" },
  { id: "motorcycle-berry", vehicle: "motorcycle", name: "Böğürtlen", description: "Mor çizgileriyle dikkat çeker.", price: 175, paint: "#8d72d6", highlight: "#d1baff", trim: "#f5d3a2" },
  { id: "motorcycle-jungle", vehicle: "motorcycle", name: "Orman Roketi", description: "Yeşil ve altın detaylı.", price: 205, paint: "#44a67e", highlight: "#a7f0c1", trim: "#f7d788" },
  { id: "car-palace", vehicle: "car", name: "Saray Arabası", description: "Geniş camlı, sağlam gövdeli.", price: 0, paint: "#e6a861", highlight: "#ffe3ad", trim: "#e9cb8a" },
  { id: "car-sunrise", vehicle: "car", name: "Gün Doğumu", description: "Neşeli mercan ve altın tonu.", price: 225, paint: "#e77567", highlight: "#ffc2a8", trim: "#ffde97" },
  { id: "car-ice", vehicle: "car", name: "Buz Kristali", description: "Buz mavisi, parlak detaylı.", price: 260, paint: "#69a9d5", highlight: "#d4f2ff", trim: "#f6e5a2" },
];

export const VEHICLES: VehicleSpec[] = [
  {
    id: "bike",
    name: "Bisiklet",
    price: 0,
    description: "Hafif, dengeli ve her maceraya hazır.",
    speed: 164,
    jumpVelocity: 420,
    hitboxWidth: 31,
    hitboxHeight: 29,
    spriteWidth: 88,
    spriteHeight: 54,
    hpBonus: 0,
  },
  {
    id: "motorcycle",
    name: "Motor",
    price: 250,
    description: "Daha hızlı ilerle; ama engelleri iyi zamanla.",
    speed: 202,
    jumpVelocity: 398,
    hitboxWidth: 36,
    hitboxHeight: 30,
    spriteWidth: 82,
    spriteHeight: 49,
    hpBonus: 0,
  },
  {
    id: "car",
    name: "Araba",
    price: 520,
    description: "Bir ekstra can ve daha sağlam bir gövde.",
    speed: 148,
    jumpVelocity: 375,
    hitboxWidth: 52,
    hitboxHeight: 30,
    spriteWidth: 112,
    spriteHeight: 65,
    hpBonus: 1,
  },
];

export function getVehicleSpec(vehicle: VehicleId): VehicleSpec {
  return VEHICLES.find((candidate) => candidate.id === vehicle) ?? VEHICLES[0];
}

export function getVehicleModelSpec(model: VehicleModelId): VehicleModelSpec {
  return VEHICLE_MODELS.find((candidate) => candidate.id === model) ?? VEHICLE_MODELS[0];
}

export function getDefaultVehicleModel(vehicle: VehicleId): VehicleModelId {
  return VEHICLE_MODELS.find((model) => model.vehicle === vehicle && model.price === 0)?.id ?? VEHICLE_MODELS[0].id;
}

export function purchaseVehicle(profile: PlayerProfile, vehicle: VehicleId): PlayerProfile | null {
  const spec = getVehicleSpec(vehicle);
  const defaultModel = getDefaultVehicleModel(vehicle);
  if (profile.vehiclesOwned.includes(vehicle)) {
    const ownedModel = profile.vehicleModelsOwned.find((id) => getVehicleModelSpec(id).vehicle === vehicle);
    return {
      ...profile,
      vehicle,
      vehicleModel: ownedModel ?? defaultModel,
    };
  }
  if (profile.gold < spec.price) return null;

  return {
    ...profile,
    gold: profile.gold - spec.price,
    vehicle,
    vehiclesOwned: [...profile.vehiclesOwned, vehicle],
    vehicleModel: defaultModel,
    vehicleModelsOwned: [...new Set([...profile.vehicleModelsOwned, defaultModel])],
  };
}

export function purchaseVehicleModel(profile: PlayerProfile, modelId: VehicleModelId): PlayerProfile | null {
  const model = getVehicleModelSpec(modelId);
  if (!profile.vehiclesOwned.includes(model.vehicle)) return null;

  if (profile.vehicleModelsOwned.includes(modelId)) {
    return { ...profile, vehicle: model.vehicle, vehicleModel: modelId };
  }
  if (profile.gold < model.price) return null;

  return {
    ...profile,
    gold: profile.gold - model.price,
    vehicle: model.vehicle,
    vehicleModel: modelId,
    vehicleModelsOwned: [...profile.vehicleModelsOwned, modelId],
  };
}
