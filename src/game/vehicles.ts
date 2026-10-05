import type { PlayerProfile, VehicleId } from "../storage/profile";

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
    spriteWidth: 82,
    spriteHeight: 82,
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
    spriteWidth: 68,
    spriteHeight: 56,
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
    spriteWidth: 82,
    spriteHeight: 55,
    hpBonus: 1,
  },
];

export function getVehicleSpec(vehicle: VehicleId): VehicleSpec {
  return VEHICLES.find((candidate) => candidate.id === vehicle) ?? VEHICLES[0];
}

export function purchaseVehicle(profile: PlayerProfile, vehicle: VehicleId): PlayerProfile | null {
  const spec = getVehicleSpec(vehicle);
  if (profile.vehiclesOwned.includes(vehicle)) {
    return { ...profile, vehicle };
  }
  if (profile.gold < spec.price) return null;

  return {
    ...profile,
    gold: profile.gold - spec.price,
    vehicle,
    vehiclesOwned: [...profile.vehiclesOwned, vehicle],
  };
}
