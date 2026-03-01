/**
 * 10 common weapon bases. Each has tiers 1-10; damage scales with level.
 * Good variety: slow/high dmg, fast/low dmg, balanced, spray, precision, etc.
 */
import type { GearLevel } from "./types.ts";
import { ITEM_TYPES, RARITY } from "./types.ts";
import { BASE_GEAR_LEVEL_CAP } from "./types.ts";
import { applyPostCapWeaponDamage, clampGearLevel } from "./gear-scaling.ts";

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
  { baseId: "m5_assault_rifle", name: "M5 Assault Rifle", description: "Standard-issue. Every soldier knows how to use one.", icon: "weapon_57.png", damageMinBase: 7, damageMaxBase: 10, damagePerLevel: 21 / 19, speed_base: 5, damage_type: "ballistic", restrictRole: "any" },
  { baseId: "s44_galt", name: "S44 Galt Carbine", description: "Developed in former Belgium, a staple for light infantry.", icon: "weapon_29.png", damageMinBase: 4, damageMaxBase: 7, damagePerLevel: 1, speed_base: 7, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "war_rifle", name: "Old War Rifle", description: "This baby has seen some action.", icon: "weapon_39.png", damageMinBase: 12, damageMaxBase: 16, damagePerLevel: 21 / 19, speed_base: 2, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "double_barrel_shotgun", name: "Double Barrel Shotgun", description: "Not very practical on the modern battlefield, but it packs a punch.", icon: "weapon_43.png", damageMinBase: 11, damageMaxBase: 19, damagePerLevel: 2, speed_base: 1, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "m42_pistol_carbine", name: "M42 Pistol Carbine", description: "A staple in the spec ops community.", icon: "weapon_2.png", damageMinBase: 2, damageMaxBase: 5, damagePerLevel: 18 / 19, speed_base: 9, damage_type: "ballistic", restrictRole: "any" },
  { baseId: "lsaw_guardsman", name: "LSAW Guardsman Rifle", description: "For the professional on the move.", icon: "weapon_34.png", damageMinBase: 11, damageMaxBase: 16, damagePerLevel: 2, speed_base: 2, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "akpd_assault", name: "AK PD-2 Assault", description: "Based on the venerable AK-47 lineage.", icon: "weapon_14.png", damageMinBase: 2, damageMaxBase: 7, damagePerLevel: 1, speed_base: 8, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "m240_delta", name: "M240 Delta Pattern MG", description: "Tried and true squad assault weapon.", icon: "weapon_45.png", damageMinBase: 12, damageMaxBase: 17, damagePerLevel: 2, speed_base: 4, damage_type: "ballistic", restrictRole: "support" },
  { baseId: "compact_smg", name: "Compact SMG", description: "Trusted by medics who need to keep their hands free.", icon: "weapon_2.png", damageMinBase: 4, damageMaxBase: 7, damagePerLevel: 1, speed_base: 7, damage_type: "ballistic", restrictRole: "medic" },
  { baseId: "r99_battle_rifle", name: "R99 Battle Rifle", description: "A marksman's choice for mid-range engagements.", icon: "weapon_34.png", damageMinBase: 7, damageMaxBase: 11, damagePerLevel: 1, speed_base: 4, damage_type: "ballistic", restrictRole: "rifleman" },
];

export function scaleWeapon(base: WeaponBase, tier: GearLevel) {
  return createWeapon(base, tier);
}

export function createWeapon(base: WeaponBase, level: GearLevel) {
  const tier = clampGearLevel(level);
  const preCapLevel = Math.min(tier, BASE_GEAR_LEVEL_CAP);
  const add = (preCapLevel - 1) * base.damagePerLevel;
  let damageMin = Math.round(base.damageMinBase + add);
  let damageMax = Math.round(base.damageMaxBase + add);
  if (tier > BASE_GEAR_LEVEL_CAP) {
    const boosted = applyPostCapWeaponDamage(damageMin, damageMax, tier);
    damageMin = boosted.min;
    damageMax = boosted.max;
  }
  const damage = Math.round((damageMin + damageMax) / 2);
  return {
    id: `${base.baseId}_${tier}`,
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
