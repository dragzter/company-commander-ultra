/**
 * 15 weapon bases. Each has tiers 1-10; same icon for all tiers, damage scales with level.
 * restrictRole: support = MG only, rifleman = rifles/carbines, any = usable by all
 */
import type { GearLevel } from "./types.ts";
import { ITEM_TYPES } from "./types.ts";

export interface WeaponBase {
  baseId: string;
  name: string;
  description: string;
  icon: string;
  damageBase: number; // Lvl 1 damage; lvl N = damageBase + (N-1) * damagePerLevel
  damagePerLevel: number;
  speed_base: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  damage_type: "ballistic";
  restrictRole: "support" | "rifleman" | "medic" | "any";
}

export const WEAPON_BASES: WeaponBase[] = [
  { baseId: "m5_assault_rifle", name: "M5 Assault Rifle", description: "Standard-issue Infantry Rifle.", icon: "weapon_57.png", damageBase: 8, damagePerLevel: 2, speed_base: 6, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "hunting_rifle", name: "Old Hunting Rifle", description: "Common hunting rifle.", icon: "weapon_53.png", damageBase: 9, damagePerLevel: 2, speed_base: 2, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "war_rifle", name: "Old War Rifle", description: "This baby has seen some action.", icon: "weapon_39.png", damageBase: 7, damagePerLevel: 2, speed_base: 3, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "m240_delta", name: "M240 Delta Pattern MG", description: "Highly accurate and suppressive machine gun.", icon: "weapon_45.png", damageBase: 26, damagePerLevel: 3, speed_base: 7, damage_type: "ballistic", restrictRole: "support" },
  { baseId: "s44_galt", name: "S44 Galt Carbine", description: "Mid-range carbine staple for light infantry.", icon: "weapon_29.png", damageBase: 7, damagePerLevel: 2, speed_base: 7, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "m16_a6", name: "M16 A6", description: "Battle-tested classic with modern enhancements.", icon: "weapon_23.png", damageBase: 9, damagePerLevel: 2, speed_base: 6, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "double_barrel_shotgun", name: "Double Barrel Shotgun", description: "Not practical but packs a punch!", icon: "weapon_43.png", damageBase: 10, damagePerLevel: 2, speed_base: 1, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "m201_auto_shotgun", name: "M201 Automatic Shotgun", description: "Reliable shotgun for close quarters.", icon: "weapon_28.png", damageBase: 17, damagePerLevel: 2, speed_base: 4, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "lsaw_guardsman", name: "LSAW Guardsman Rifle", description: "High caliber counter sniping rifle.", icon: "weapon_34.png", damageBase: 26, damagePerLevel: 3, speed_base: 2, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "akpd_assault", name: "AK PD-2 Assault Rifle", description: "Higher rate of fire.", icon: "weapon_14.png", damageBase: 6, damagePerLevel: 2, speed_base: 8, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "m1205_commando", name: "M1205 Commando SMG", description: "Compact, capable of horrific damage.", icon: "weapon_2.png", damageBase: 9, damagePerLevel: 2, speed_base: 6, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "fasw_machine_gun", name: "M60 3F Machine Gun", description: "Squad assault automatic weapon.", icon: "weapon_55.png", damageBase: 32, damagePerLevel: 4, speed_base: 5, damage_type: "ballistic", restrictRole: "support" },
  { baseId: "tactical_carbine", name: "Tactical Carbine", description: "Versatile close to mid-range.", icon: "weapon_23.png", damageBase: 8, damagePerLevel: 2, speed_base: 6, damage_type: "ballistic", restrictRole: "any" },
  { baseId: "scout_rifle", name: "Scout Rifle", description: "Light precision rifle.", icon: "weapon_53.png", damageBase: 10, damagePerLevel: 2, speed_base: 4, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "compact_smg", name: "Compact SMG", description: "Rugged submachine gun for medics.", icon: "weapon_2.png", damageBase: 7, damagePerLevel: 1, speed_base: 7, damage_type: "ballistic", restrictRole: "medic" },
  { baseId: "m42_pistol_carbine", name: "M42 Pistol Carbine", description: "Compact pistol-caliber carbine for any role.", icon: "weapon_2.png", damageBase: 6, damagePerLevel: 1, speed_base: 8, damage_type: "ballistic", restrictRole: "any" },
  { baseId: "r99_battle_rifle", name: "R99 Battle Rifle", description: "Precision battle rifle for marksmen.", icon: "weapon_34.png", damageBase: 12, damagePerLevel: 2, speed_base: 4, damage_type: "ballistic", restrictRole: "rifleman" },
  { baseId: "hmg9", name: "HMG-9", description: "Heavy machine gun for sustained fire.", icon: "weapon_55.png", damageBase: 28, damagePerLevel: 3, speed_base: 5, damage_type: "ballistic", restrictRole: "support" },
];

/** Scale weapon to tier (1-10). Flat stats scale, percent bonuses N/A for weapons. */
export function scaleWeapon(base: WeaponBase, tier: GearLevel) {
  return createWeapon(base, tier);
}

export function createWeapon(base: WeaponBase, level: GearLevel) {
  const damage = base.damageBase + (level - 1) * base.damagePerLevel;
  return {
    id: `${base.baseId}_${level}`,
    name: base.name,
    type: ITEM_TYPES.ballistic_weapon,
    rarity: "common" as const,
    description: base.description,
    usable: true,
    icon: base.icon,
    damage,
    damage_type: base.damage_type,
    target: "enemy" as const,
    speed_base: base.speed_base,
    level,
    restrictRole: base.restrictRole,
  };
}
