/**
 * 6 rare weapons. Upgraded variants with extra damage + stat bonuses only. No special effects.
 * Common < rare < epic; rare is strictly better than common via raw stats.
 */
import type { GearLevel, WeaponBonus } from "./types.ts";
import { ITEM_TYPES, RARITY } from "./types.ts";
import { BASE_GEAR_LEVEL_CAP } from "./types.ts";
import { applyPostCapWeaponDamage, clampGearLevel, scaleWeaponBonusesToPreCapLevel } from "./gear-scaling.ts";

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
  /** If false, item is drop-only (not in store). Default true. */
  storeAvailable?: boolean;
}

/** Rare: +3–5 base damage over common equivalents, + flat stat bonuses. No special effects. */
export const RARE_WEAPON_BASES: RareWeaponBase[] = [
  { baseId: "storm_carbine", name: "Storm Carbine", description: "Preferred by tactical units that hit hard and move fast.", icon: "weapon_29.png", damageMinBase: 11, damageMaxBase: 18, damagePerLevel: 2, speed_base: 7, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "dex", value: 5 }, { type: "flat", stat: "awareness", value: 3 }] },
  { baseId: "veteran_war_rifle", name: "Veteran War Rifle", description: "Refitted and rebuilt. Still knows how to kill.", icon: "weapon_39.png", damageMinBase: 19, damageMaxBase: 26, damagePerLevel: 2, speed_base: 3, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "awareness", value: 7 }, { type: "flat", stat: "toughness", value: 5 }] },
  { baseId: "stinger_smg", name: "Stinger SMG", description: "Favored by close-quarters specialists.", icon: "weapon_14.png", damageMinBase: 8, damageMaxBase: 14, damagePerLevel: 2, speed_base: 8, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "dex", value: 7 }] },
  { baseId: "marksman_dmr", name: "Marksman DMR", description: "A sharpshooter's trusted companion.", icon: "weapon_34.png", damageMinBase: 14, damageMaxBase: 20, damagePerLevel: 2, speed_base: 5, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "awareness", value: 7 }] },
  { baseId: "suppressor_mg", name: "Suppressor LMG", description: "Keeps the enemy pinned when the push goes in.", icon: "weapon_45.png", damageMinBase: 21, damageMaxBase: 29, damagePerLevel: 4, speed_base: 5, damage_type: "ballistic", restrictRole: "support", bonuses: [{ type: "flat", stat: "toughness", value: 5 }, { type: "flat", stat: "awareness", value: 4 }] },
  { baseId: "field_medic_smg", name: "Field Medic SMG", description: "Light enough to run with, reliable when it matters.", icon: "weapon_2.png", damageMinBase: 10, damageMaxBase: 16, damagePerLevel: 2, speed_base: 8, damage_type: "ballistic", restrictRole: "medic", bonuses: [{ type: "flat", stat: "dex", value: 5 }, { type: "flat", stat: "morale", value: 6 }] },
];

export function createRareWeapon(base: RareWeaponBase, level: GearLevel) {
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
  const bonuses = scaleWeaponBonusesToPreCapLevel(base.bonuses, preCapLevel) ?? base.bonuses;
  return {
    id: `${base.baseId}_${tier}`,
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
    bonuses,
  };
}
