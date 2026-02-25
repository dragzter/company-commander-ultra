/**
 * 10 common weapon bases. Each has tiers 1-10; damage scales with level.
 * Good variety: slow/high dmg, fast/low dmg, balanced, spray, precision, etc.
 */
import type { GearLevel } from "./types.ts";
import { ITEM_TYPES, RARITY } from "./types.ts";

export interface WeaponBase {
  baseId: string;
  name: string;
  description: string;
  icon: string;
  damageMinBase: number;
  damageMaxBase: number;
  damagePerLevel: number;
  speed_base: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  damage_type: "ballistic";
  restrictRole: "support" | "rifleman" | "medic" | "any";
}

export const WEAPON_BASES: WeaponBase[] = [
  { baseId: "m5_assault_rifle", name: "M5 Assault Rifle", description: "Standard-issue. Balanced and reliable.", icon: "weapon_57.png", damageMinBase: 4, damageMaxBase: 7, damagePerLevel: 1, speed_base: 5, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "s44_galt", name: "S44 Galt Carbine", description: "Light carbine. Fast fire, lower per-shot damage.", icon: "weapon_29.png", damageMinBase: 2, damageMaxBase: 5, damagePerLevel: 1, speed_base: 7, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "war_rifle", name: "Old War Rifle", description: "Heavy-caliber relic. High damage, slow to fire.", icon: "weapon_39.png", damageMinBase: 6, damageMaxBase: 9, damagePerLevel: 1, speed_base: 2, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "double_barrel_shotgun", name: "Double Barrel Shotgun", description: "Devastating up close. Huge variance, extremely slow.", icon: "weapon_43.png", damageMinBase: 8, damageMaxBase: 14, damagePerLevel: 2, speed_base: 1, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "m42_pistol_carbine", name: "M42 Pistol Carbine", description: "Piston-caliber. Lowest damage, fastest cycle.", icon: "weapon_2.png", damageMinBase: 2, damageMaxBase: 4, damagePerLevel: 1, speed_base: 9, damage_type: "ballistic", restrictRole: "any" },
  { baseId: "lsaw_guardsman", name: "LSAW Guardsman Rifle", description: "Counter-sniper. High damage, very slow.", icon: "weapon_34.png", damageMinBase: 8, damageMaxBase: 11, damagePerLevel: 2, speed_base: 2, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "akpd_assault", name: "AK PD-2 Assault", description: "Spray and pray. Wide spread, very fast.", icon: "weapon_14.png", damageMinBase: 2, damageMaxBase: 5, damagePerLevel: 1, speed_base: 8, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "m240_delta", name: "M240 Delta Pattern MG", description: "Accurate, suppressive machine gun.", icon: "weapon_45.png", damageMinBase: 9, damageMaxBase: 12, damagePerLevel: 2, speed_base: 4, damage_type: "ballistic", restrictRole: "support" },
  { baseId: "compact_smg", name: "Compact SMG", description: "Rugged SMG for medics.", icon: "weapon_2.png", damageMinBase: 2, damageMaxBase: 5, damagePerLevel: 1, speed_base: 7, damage_type: "ballistic", restrictRole: "medic" },
  { baseId: "r99_battle_rifle", name: "R99 Battle Rifle", description: "Precision DMR. Tight spread, high base damage.", icon: "weapon_34.png", damageMinBase: 5, damageMaxBase: 8, damagePerLevel: 1, speed_base: 4, damage_type: "ballistic", restrictRole: "rifleman" },
];

export function scaleWeapon(base: WeaponBase, tier: GearLevel) {
  return createWeapon(base, tier);
}

export function createWeapon(base: WeaponBase, level: GearLevel) {
  const tier = Math.max(1, Math.min(20, level)) as GearLevel;
  const add = (tier - 1) * base.damagePerLevel;
  const damageMin = base.damageMinBase + add;
  const damageMax = base.damageMaxBase + add;
  const damage = Math.round((damageMin + damageMax) / 2);
  return {
    id: `${base.baseId}_${level}`,
    name: base.name,
    type: ITEM_TYPES.ballistic_weapon,
    rarity: RARITY.common,
    description: base.description,
    usable: true,
    icon: base.icon,
    damage,
    damage_min: damageMin,
    damage_max: damageMax,
    damage_type: base.damage_type,
    target: "enemy" as const,
    speed_base: base.speed_base,
    level: tier,
    restrictRole: base.restrictRole,
  };
}
