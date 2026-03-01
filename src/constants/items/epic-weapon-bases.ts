/**
 * Epic weapons. Best-in-class: clearly superior to rare via damage, stats, and special effects.
 * Only epic weapons have weapon effects. Common < rare (stats+dmg) < epic (stats+dmg+effect).
 */
import type { GearLevel, WeaponBonus, WeaponEffectId } from "./types.ts";
import { ITEM_TYPES, RARITY } from "./types.ts";
import { BASE_GEAR_LEVEL_CAP } from "./types.ts";
import { applyPostCapWeaponDamage, clampGearLevel, scaleWeaponBonusesToPreCapLevel } from "./gear-scaling.ts";

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
  /** If false, item is drop-only (not in store). All epic weapons are drop-only. */
  storeAvailable?: boolean;
}

/** Epic: superior damage + stats + unique special effect. Instantly better than rare. */
export const EPIC_WEAPON_BASES: EpicWeaponBase[] = [
  { baseId: "titan_slam", name: "Titan Slam", description: "Close range, no quarter.", icon: "weapon_44.png", damageMinBase: 24, damageMaxBase: 38, damagePerLevel: 4, speed_base: 2, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "toughness", value: 6 }, { type: "flat", stat: "awareness", value: 5 }], weaponEffect: "heavy_caliber", storeAvailable: false },
  { baseId: "phantom_rifle", name: "Phantom Rifle", description: "Favored by infiltrators who never miss.", icon: "weapon_50.png", damageMinBase: 15, damageMaxBase: 21, damagePerLevel: 2, speed_base: 7, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "dex", value: 6 }, { type: "flat", stat: "awareness", value: 5 }], weaponEffect: "eagle_eye", storeAvailable: false },
  { baseId: "predator_rifle", name: "Predator Rifle", description: "Once it locks on, there's no running.", icon: "weapon_34.png", damageMinBase: 16, damageMaxBase: 24, damagePerLevel: 2, speed_base: 5, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "awareness", value: 8 }], weaponEffect: "target_acquired", storeAvailable: false },
  { baseId: "reaper_hmg", name: "Reaper HMG", description: "The sound of incoming fire.", icon: "weapon_55.png", damageMinBase: 28, damageMaxBase: 38, damagePerLevel: 4, speed_base: 4, damage_type: "ballistic", restrictRole: "support", bonuses: [{ type: "flat", stat: "toughness", value: 7 }], weaponEffect: "steady_grip", storeAvailable: false },
  { baseId: "savior_smg", name: "Savior SMG", description: "Medics who carry this don't go down without a fight.", icon: "weapon_2.png", damageMinBase: 10, damageMaxBase: 14, damagePerLevel: 1.6, speed_base: 9, damage_type: "ballistic", restrictRole: "medic", bonuses: [{ type: "flat", stat: "dex", value: 7 }, { type: "flat", stat: "morale", value: 10 }], weaponEffect: "trauma_surgeon", storeAvailable: false },
  { baseId: "wrath_carbine", name: "Wrath Carbine", description: "Strikes with the heat of a forge.", icon: "weapon_29.png", damageMinBase: 14, damageMaxBase: 21, damagePerLevel: 2, speed_base: 7, damage_type: "ballistic", restrictRole: "any", bonuses: [{ type: "flat", stat: "dex", value: 5 }, { type: "flat", stat: "awareness", value: 3 }], weaponEffect: "firebreaker", storeAvailable: false },
  { baseId: "executioner_lmg", name: "Executioner LMG", description: "Sustained fire that ends fights.", icon: "weapon_45.png", damageMinBase: 24, damageMaxBase: 32, damagePerLevel: 4, speed_base: 5, damage_type: "ballistic", restrictRole: "support", bonuses: [{ type: "flat", stat: "toughness", value: 6 }, { type: "flat", stat: "awareness", value: 4 }], weaponEffect: "stormhammer", storeAvailable: false },
  { baseId: "nullifier_lmg", name: "Nullifier LMG", description: "Evasive targets learn to fear it.", icon: "weapon_49.png", damageMinBase: 22, damageMaxBase: 30, damagePerLevel: 4, speed_base: 5, damage_type: "ballistic", restrictRole: "support", bonuses: [{ type: "flat", stat: "toughness", value: 5 }, { type: "flat", stat: "awareness", value: 6 }], weaponEffect: "target_acquired", storeAvailable: false },
  { baseId: "guardian_smg", name: "Guardian SMG", description: "Swift in the hands of those who save lives.", icon: "weapon_14.png", damageMinBase: 11, damageMaxBase: 17, damagePerLevel: 2, speed_base: 8, damage_type: "ballistic", restrictRole: "medic", bonuses: [{ type: "flat", stat: "dex", value: 6 }, { type: "flat", stat: "morale", value: 8 }], weaponEffect: "balanced", storeAvailable: false },
  { baseId: "m17_rifle", name: "M17", description: "One shot. One kill. No second chances.", icon: "weapon_32.png", damageMinBase: 19, damageMaxBase: 27, damagePerLevel: 3, speed_base: 5, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "percent", stat: "chanceToHit", value: 1 }], weaponEffect: "carnage", storeAvailable: false },
  { baseId: "pulse_rifle", name: "Slug Rifle", description: "Heavy slugs for deliberate, high-impact shots.", icon: "weapon_27.png", damageMinBase: 18, damageMaxBase: 25, damagePerLevel: 2, speed_base: 3, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "awareness", value: 12 }, { type: "flat", stat: "toughness", value: 22 }], weaponEffect: "focused", storeAvailable: false },
  { baseId: "hm45_assault_carbine", name: "HM 45 Assault Carbine", description: "Overwhelms before the enemy can react.", icon: "weapon_23.png", damageMinBase: 14, damageMaxBase: 20, damagePerLevel: 2, speed_base: 4, damage_type: "ballistic", restrictRole: "support", bonuses: [{ type: "flat", stat: "morale", value: 20 }, { type: "flat", stat: "hp", value: 10 }], weaponEffect: "overwhelm", storeAvailable: false },
  { baseId: "the_butcher", name: "The Butcher", description: "Named for what it does to its targets.", icon: "weapon_56.png", damageMinBase: 24, damageMaxBase: 32, damagePerLevel: 4, speed_base: 4, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "toughness", value: 20 }], weaponEffect: "eviscerate", storeAvailable: false },
];

export function createEpicWeapon(base: EpicWeaponBase, level: GearLevel) {
  const tier = clampGearLevel(level);
  const preCapLevel = Math.min(tier, BASE_GEAR_LEVEL_CAP);
  const add = (preCapLevel - 1) * base.damagePerLevel;
  let damageMin = Math.round(base.damageMinBase + add);
  let damageMax = Math.round(base.damageMaxBase + add);
  if (tier > BASE_GEAR_LEVEL_CAP) {
    const boosted = applyPostCapWeaponDamage(damageMin, damageMax, tier, { rarity: RARITY.epic, baseId: base.baseId });
    damageMin = boosted.min;
    damageMax = boosted.max;
  }
  const damage = Math.round((damageMin + damageMax) / 2);
  const bonuses = scaleWeaponBonusesToPreCapLevel(base.bonuses, preCapLevel) ?? base.bonuses;
  return {
    id: `${base.baseId}_${tier}`,
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
    bonuses,
    weaponEffect: base.weaponEffect,
  };
}
