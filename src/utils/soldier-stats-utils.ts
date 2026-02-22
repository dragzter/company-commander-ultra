import type { Soldier } from "../game/entities/types.ts";
/** Stat abbreviations for display (HP, MIT, AVD, CTH, MOR, TGH, AWR, DEX) */
export const STAT_LABELS: Record<string, string> = {
  hit_points: "HP",
  mitigateDamage: "MIT",
  chanceToEvade: "AVD",
  chanceToHit: "CTH",
  morale: "MOR",
  toughness: "TGH",
  awareness: "AWR",
  dexterity: "DEX",
};

export type SoldierDisplayStats = {
  hp: number;
  mit: number;
  avd: number;
  cth: number;
  mor: number;
  tgh: number;
  awr: number;
  dex: number;
};

/**
 * Equipment stat contributions (from weapon, armor, gear).
 * Used for tooltips and stat-enhanced styling.
 */
export function getEquipmentStatContributions(soldier: Soldier): {
  damage?: number;
  armor?: number;
  speed?: number;
} {
  const contrib: { damage?: number; armor?: number; speed?: number } = {};
  if (soldier.weapon?.damage) contrib.damage = soldier.weapon.damage;
  if (soldier.armor?.toughness) contrib.armor = soldier.armor.toughness;
  if (soldier.weapon?.speed_base) contrib.speed = soldier.weapon.speed_base;
  return contrib;
}

/**
 * Get display stats for a soldier (uses pre-computed combat profile).
 */
export function getSoldierDisplayStats(soldier: Soldier): SoldierDisplayStats {
  const a = soldier.attributes;
  const cp = soldier.combatProfile;
  return {
    hp: a.hit_points,
    mit: Math.floor(cp.mitigateDamage * 100),
    avd: Math.floor(cp.chanceToEvade * 100),
    cth: Math.floor(cp.chanceToHit * 100),
    mor: a.morale,
    tgh: a.toughness,
    awr: a.awareness,
    dex: a.dexterity,
  };
}
