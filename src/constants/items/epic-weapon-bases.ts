/**
 * Epic weapons. Best-in-class: clearly superior to rare via damage, stats, and special effects.
 * Only epic weapons have weapon effects. Common < rare (stats+dmg) < epic (stats+dmg+effect).
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
  /** If false, item is drop-only (not in store). All epic weapons are drop-only. */
  storeAvailable?: boolean;
}

/** Epic: superior damage + stats + unique special effect. Instantly better than rare. */
export const EPIC_WEAPON_BASES: EpicWeaponBase[] = [
  { baseId: "titan_slam", name: "Titan Slam", description: "Close range, no quarter.", icon: "weapon_44.png", damageMinBase: 24, damageMaxBase: 38, damagePerLevel: 4, speed_base: 2, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "toughness", value: 6 }, { type: "flat", stat: "awareness", value: 5 }], weaponEffect: "heavy_caliber", storeAvailable: false },
  { baseId: "phantom_rifle", name: "Phantom Rifle", description: "Favored by infiltrators who never miss.", icon: "weapon_50.png", damageMinBase: 15, damageMaxBase: 21, damagePerLevel: 2, speed_base: 7, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "dex", value: 6 }, { type: "flat", stat: "awareness", value: 5 }], weaponEffect: "eagle_eye", storeAvailable: false },
  { baseId: "predator_rifle", name: "Predator Rifle", description: "Once it locks on, there's no running.", icon: "weapon_34.png", damageMinBase: 16, damageMaxBase: 24, damagePerLevel: 2, speed_base: 5, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "awareness", value: 8 }], weaponEffect: "target_acquired", storeAvailable: false },
  { baseId: "reaper_hmg", name: "Reaper HMG", description: "The sound of incoming fire.", icon: "weapon_55.png", damageMinBase: 28, damageMaxBase: 38, damagePerLevel: 4, speed_base: 4, damage_type: "ballistic", restrictRole: "support", bonuses: [{ type: "flat", stat: "toughness", value: 7 }], weaponEffect: "steady_grip", storeAvailable: false },
  { baseId: "savior_smg", name: "Savior SMG", description: "Medics who carry this don't go down without a fight.", icon: "weapon_2.png", damageMinBase: 12, damageMaxBase: 17, damagePerLevel: 2, speed_base: 9, damage_type: "ballistic", restrictRole: "medic", bonuses: [{ type: "flat", stat: "dex", value: 7 }, { type: "flat", stat: "morale", value: 10 }], weaponEffect: "quick_cycle", storeAvailable: false },
  { baseId: "wrath_carbine", name: "Wrath Carbine", description: "Strikes with the heat of a forge.", icon: "weapon_29.png", damageMinBase: 14, damageMaxBase: 21, damagePerLevel: 2, speed_base: 7, damage_type: "ballistic", restrictRole: "any", bonuses: [{ type: "flat", stat: "dex", value: 5 }, { type: "flat", stat: "awareness", value: 3 }], weaponEffect: "firebreaker", storeAvailable: false },
  { baseId: "executioner_lmg", name: "Executioner LMG", description: "Sustained fire that ends fights.", icon: "weapon_45.png", damageMinBase: 24, damageMaxBase: 32, damagePerLevel: 4, speed_base: 5, damage_type: "ballistic", restrictRole: "support", bonuses: [{ type: "flat", stat: "toughness", value: 6 }, { type: "flat", stat: "awareness", value: 4 }], weaponEffect: "stormhammer", storeAvailable: false },
  { baseId: "nullifier_lmg", name: "Nullifier LMG", description: "Evasive targets learn to fear it.", icon: "weapon_49.png", damageMinBase: 22, damageMaxBase: 30, damagePerLevel: 4, speed_base: 5, damage_type: "ballistic", restrictRole: "support", bonuses: [{ type: "flat", stat: "toughness", value: 5 }, { type: "flat", stat: "awareness", value: 6 }], weaponEffect: "target_acquired", storeAvailable: false },
  { baseId: "guardian_smg", name: "Guardian SMG", description: "Swift in the hands of those who save lives.", icon: "weapon_14.png", damageMinBase: 11, damageMaxBase: 17, damagePerLevel: 2, speed_base: 8, damage_type: "ballistic", restrictRole: "medic", bonuses: [{ type: "flat", stat: "dex", value: 6 }, { type: "flat", stat: "morale", value: 8 }], weaponEffect: "balanced", storeAvailable: false },
  { baseId: "m17_rifle", name: "M17", description: "One shot. One kill. No second chances.", icon: "weapon_32.png", damageMinBase: 19, damageMaxBase: 27, damagePerLevel: 3, speed_base: 5, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "percent", stat: "chanceToHit", value: 1 }], weaponEffect: "carnage", storeAvailable: false },
  { baseId: "pulse_rifle", name: "Pulse Rifle", description: "Steady hand meets steady aim.", icon: "weapon_27.png", damageMinBase: 15, damageMaxBase: 21, damagePerLevel: 2, speed_base: 3, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "awareness", value: 10 }, { type: "flat", stat: "toughness", value: 20 }], weaponEffect: "focused", storeAvailable: false },
  { baseId: "hm45_assault_carbine", name: "HM 45 Assault Carbine", description: "Overwhelms before the enemy can react.", icon: "weapon_23.png", damageMinBase: 14, damageMaxBase: 20, damagePerLevel: 2, speed_base: 4, damage_type: "ballistic", restrictRole: "support", bonuses: [{ type: "flat", stat: "morale", value: 20 }, { type: "flat", stat: "hp", value: 10 }], weaponEffect: "overwhelm", storeAvailable: false },
  { baseId: "the_butcher", name: "The Butcher", description: "Named for what it does to its targets.", icon: "weapon_56.png", damageMinBase: 24, damageMaxBase: 32, damagePerLevel: 4, speed_base: 4, damage_type: "ballistic", restrictRole: "rifleman", bonuses: [{ type: "flat", stat: "toughness", value: 20 }], weaponEffect: "eviscerate", storeAvailable: false },
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
