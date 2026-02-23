/**
 * 6 rare weapons. Upgraded variants with distinct flavors.
 * Rare weapons have flat stat bonuses only (no effect traits).
 */
import type { GearLevel, WeaponBonus } from "./types.ts";
import { ITEM_TYPES, RARITY } from "./types.ts";

export interface RareWeaponBase {
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
}

/** Rare: +2–4 base damage over common equivalents, + flat stat bonuses. */
export const RARE_WEAPON_BASES: RareWeaponBase[] = [
  { baseId: "storm_carbine", name: "Storm Carbine", description: "Rare tactical carbine. Fast and accurate.", icon: "weapon_29.png", damageMinBase: 7, damageMaxBase: 11, damagePerLevel: 2, speed_base: 7, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "dex", value: 4 }, { type: "flat", stat: "awareness", value: 2 }] },
  { baseId: "veteran_war_rifle", name: "Veteran War Rifle", description: "Refitted heavy rifle. Devastating single shots.", icon: "weapon_39.png", damageMinBase: 11, damageMaxBase: 16, damagePerLevel: 2, speed_base: 3, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "awareness", value: 5 }, { type: "flat", stat: "toughness", value: 3 }] },
  { baseId: "stinger_smg", name: "Stinger SMG", description: "Rare high-RoF SMG. Blistering speed.", icon: "weapon_14.png", damageMinBase: 5, damageMaxBase: 9, damagePerLevel: 2, speed_base: 8, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "dex", value: 6 }] },
  { baseId: "marksman_dmr", name: "Marksman DMR", description: "Precision marksman rifle. Tight spread, strong baseline.", icon: "weapon_34.png", damageMinBase: 9, damageMaxBase: 13, damagePerLevel: 2, speed_base: 5, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "awareness", value: 6 }] },
  { baseId: "suppressor_mg", name: "Suppressor LMG", description: "Rare LMG. Sustained accuracy and punch.", icon: "weapon_45.png", damageMinBase: 14, damageMaxBase: 19, damagePerLevel: 3, speed_base: 5, damage_type: "ballistic", restrictRole: "support", bonuses: [{ type: "flat", stat: "toughness", value: 4 }, { type: "flat", stat: "awareness", value: 3 }] },
  { baseId: "field_medic_smg", name: "Field Medic SMG", description: "Rare medic SMG. Light, fast, reliable.", icon: "weapon_2.png", damageMinBase: 6, damageMaxBase: 10, damagePerLevel: 2, speed_base: 8, damage_type: "ballistic", restrictRole: "medic", bonuses: [{ type: "flat", stat: "dex", value: 4 }, { type: "flat", stat: "morale", value: 5 }] },
];

export function createRareWeapon(base: RareWeaponBase, level: GearLevel) {
  const tier = Math.max(1, Math.min(10, level));
  const add = (tier - 1) * base.damagePerLevel;
  const damageMin = base.damageMinBase + add;
  const damageMax = base.damageMaxBase + add;
  const damage = Math.round((damageMin + damageMax) / 2);
  return {
    id: `${base.baseId}_${level}`,
    name: base.name,
    type: ITEM_TYPES.ballistic_weapon,
    rarity: RARITY.rare,
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
  };
}
