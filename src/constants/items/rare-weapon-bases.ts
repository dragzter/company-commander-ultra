/**
 * 6 rare weapons. Upgraded variants with extra damage + stat bonuses only. No special effects.
 * Common < rare < epic; rare is strictly better than common via raw stats.
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

/** Rare: +3–5 base damage over common equivalents, + flat stat bonuses. No special effects. */
export const RARE_WEAPON_BASES: RareWeaponBase[] = [
  { baseId: "storm_carbine", name: "Storm Carbine", description: "Rare tactical carbine. Fast and accurate.", icon: "weapon_29.png", damageMinBase: 11, damageMaxBase: 18, damagePerLevel: 2, speed_base: 7, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "dex", value: 5 }, { type: "flat", stat: "awareness", value: 3 }] },
  { baseId: "veteran_war_rifle", name: "Veteran War Rifle", description: "Refitted heavy rifle. Devastating single shots.", icon: "weapon_39.png", damageMinBase: 18, damageMaxBase: 25, damagePerLevel: 2, speed_base: 3, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "awareness", value: 6 }, { type: "flat", stat: "toughness", value: 4 }] },
  { baseId: "stinger_smg", name: "Stinger SMG", description: "Rare high-RoF SMG. Blistering speed.", icon: "weapon_14.png", damageMinBase: 8, damageMaxBase: 14, damagePerLevel: 2, speed_base: 8, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "dex", value: 7 }] },
  { baseId: "marksman_dmr", name: "Marksman DMR", description: "Precision marksman rifle. Tight spread, strong baseline.", icon: "weapon_34.png", damageMinBase: 14, damageMaxBase: 20, damagePerLevel: 2, speed_base: 5, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "awareness", value: 7 }] },
  { baseId: "suppressor_mg", name: "Suppressor LMG", description: "Rare LMG. Sustained accuracy and punch.", icon: "weapon_45.png", damageMinBase: 21, damageMaxBase: 29, damagePerLevel: 4, speed_base: 5, damage_type: "ballistic", restrictRole: "support", bonuses: [{ type: "flat", stat: "toughness", value: 5 }, { type: "flat", stat: "awareness", value: 4 }] },
  { baseId: "field_medic_smg", name: "Field Medic SMG", description: "Rare medic SMG. Light, fast, reliable.", icon: "weapon_2.png", damageMinBase: 10, damageMaxBase: 16, damagePerLevel: 2, speed_base: 8, damage_type: "ballistic", restrictRole: "medic", bonuses: [{ type: "flat", stat: "dex", value: 5 }, { type: "flat", stat: "morale", value: 6 }] },
];

export function createRareWeapon(base: RareWeaponBase, level: GearLevel) {
  const tier = Math.max(1, Math.min(20, level)) as GearLevel;
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
    level: tier,
    restrictRole: base.restrictRole,
    bonuses: base.bonuses,
  };
}
