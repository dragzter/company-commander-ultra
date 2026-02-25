/**
 * 4 epic weapons. Best-in-class with stat bonuses + effect traits.
 */
import type { GearLevel, WeaponBonus, WeaponEffectId } from "./types.ts";
import { ITEM_TYPES, RARITY } from "./types.ts";

export interface EpicWeaponBase {
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
  bonuses: WeaponBonus[];
  weaponEffect: WeaponEffectId;
}

/** Epic: +4–8 base damage over common, stat bonuses + effect traits. */
export const EPIC_WEAPON_BASES: EpicWeaponBase[] = [
  { baseId: "titan_slam", name: "Titan Slam", description: "Epic shotgun. Obliterates at close range.", icon: "weapon_43.png", damageMinBase: 16, damageMaxBase: 25, damagePerLevel: 3, speed_base: 2, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "toughness", value: 5 }, { type: "flat", stat: "awareness", value: 4 }], weaponEffect: "heavy_caliber" },
  { baseId: "phantom_rifle", name: "Phantom Rifle", description: "Elite infiltrator rifle. Fast, precise, deadly.", icon: "weapon_53.png", damageMinBase: 10, damageMaxBase: 14, damagePerLevel: 2, speed_base: 7, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "dex", value: 5 }, { type: "flat", stat: "awareness", value: 4 }], weaponEffect: "calibrated" },
  { baseId: "reaper_hmg", name: "Reaper HMG", description: "Epic heavy machine gun. Unmatched suppression.", icon: "weapon_55.png", damageMinBase: 19, damageMaxBase: 25, damagePerLevel: 3, speed_base: 4, damage_type: "ballistic", restrictRole: "support", bonuses: [{ type: "flat", stat: "toughness", value: 6 }], weaponEffect: "steady_grip" },
  { baseId: "savior_smg", name: "Savior SMG", description: "Epic medic weapon. Protection through firepower.", icon: "weapon_2.png", damageMinBase: 9, damageMaxBase: 13, damagePerLevel: 2, speed_base: 9, damage_type: "ballistic", restrictRole: "medic", bonuses: [{ type: "flat", stat: "dex", value: 6 }, { type: "flat", stat: "morale", value: 8 }], weaponEffect: "quick_cycle" },
];

export function createEpicWeapon(base: EpicWeaponBase, level: GearLevel) {
  const tier = Math.max(1, Math.min(20, level)) as GearLevel;
  const add = (tier - 1) * base.damagePerLevel;
  const damageMin = base.damageMinBase + add;
  const damageMax = base.damageMaxBase + add;
  const damage = Math.round((damageMin + damageMax) / 2);
  return {
    id: `${base.baseId}_${level}`,
    name: base.name,
    type: ITEM_TYPES.ballistic_weapon,
    rarity: RARITY.epic,
    description: base.description,
    usable: true,
    icon: base.icon,
    damage,
    damage_min: damageMin,
    damage_max: damageMax,
    damage_type: base.damage_type,
    target: "enemy" as const,
    speed_base: base.speed_base,
    level: tier as GearLevel,
    restrictRole: base.restrictRole,
    bonuses: base.bonuses,
    weaponEffect: base.weaponEffect,
  };
}
