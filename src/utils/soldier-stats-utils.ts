import { computeAttackIntervalMs } from "../constants/combat";
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
  attackSpeed: "SPD",
};

/** Compute attack interval (ms) from weapon speed_base + dexterity. */
export function getSoldierAttackIntervalMs(soldier: Soldier): number | null {
  const weapon = soldier.weapon as { speed_base?: number } | undefined;
  if (!weapon) return null;
  return computeAttackIntervalMs(weapon, soldier.attributes?.dexterity ?? 0);
}

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

/** Threshold below which a percentage contribution is treated as zero (avoids "±0.0%" from floating-point dust). */
const NEGLIGIBLE_PCT = 0.0005;

/** Format a 0–1 value as percentage with one decimal (e.g. 0.082 → "8.2"). */
export function formatPctOneDecimal(n: number): string {
  return (n * 100).toFixed(1);
}

/** Format equipment delta for +X% display; treats magnitude < 0.05% as zero to avoid floating-point dust. */
export function formatPctDelta(n: number): string {
  if (Math.abs(n) < NEGLIGIBLE_PCT) return "0";
  return (n * 100).toFixed(1);
}

/**
 * Get display stats for a soldier (uses pre-computed combat profile).
 */
export function getSoldierDisplayStats(soldier: Soldier): SoldierDisplayStats {
  const a = soldier.attributes;
  const cp = soldier.combatProfile;
  return {
    hp: a.hit_points,
    mit: cp.mitigateDamage * 100,
    avd: cp.chanceToEvade * 100,
    cth: cp.chanceToHit * 100,
    mor: a.morale,
    tgh: a.toughness,
    awr: a.awareness,
    dex: a.dexterity,
  };
}

const BONUS_STAT_TO_GEAR_KEY: Record<string, "hp" | "tgh" | "dex" | "awr" | "mor"> = {
  hp: "hp",
  hit_points: "hp",
  toughness: "tgh",
  dexterity: "dex",
  awareness: "awr",
  morale: "mor",
};

export type BaseAndGearStats = {
  hp: { base: number; gear: number };
  tgh: { base: number; gear: number };
  dex: { base: number; gear: number };
  awr: { base: number; gear: number };
  mor: { base: number; gear: number };
};

function addBonusesToGear(
  accum: { hp: number; tgh: number; dex: number; awr: number; mor: number },
  bonuses: Array<{ type: string; stat: string; value: number }> | undefined,
): void {
  for (const b of bonuses ?? []) {
    if (b.type !== "flat") continue;
    const key = BONUS_STAT_TO_GEAR_KEY[b.stat];
    if (key) accum[key] += b.value;
  }
}

/** Compute base (level + traits) vs gear (armor + weapon bonuses) for each base stat. */
export function getBaseAndGearStats(soldier: Soldier): BaseAndGearStats {
  const a = soldier.attributes ?? {};
  const totals = {
    hp: a.hit_points ?? 0,
    tgh: a.toughness ?? 0,
    dex: a.dexterity ?? 0,
    awr: a.awareness ?? 0,
    mor: a.morale ?? 0,
  };

  const gearAccum = { hp: 0, tgh: 0, dex: 0, awr: 0, mor: 0 };
  gearAccum.tgh = (soldier.armor as { toughness?: number } | undefined)?.toughness ?? 0;
  addBonusesToGear(gearAccum, (soldier.armor as { bonuses?: Array<{ type: string; stat: string; value: number }> } | undefined)?.bonuses);
  addBonusesToGear(gearAccum, (soldier.weapon as { bonuses?: Array<{ type: string; stat: string; value: number }> } | undefined)?.bonuses);

  return {
    hp: { base: Math.max(0, totals.hp - gearAccum.hp), gear: gearAccum.hp },
    tgh: { base: Math.max(0, totals.tgh - gearAccum.tgh), gear: gearAccum.tgh },
    dex: { base: Math.max(0, totals.dex - gearAccum.dex), gear: gearAccum.dex },
    awr: { base: Math.max(0, totals.awr - gearAccum.awr), gear: gearAccum.awr },
    mor: { base: Math.max(0, totals.mor - gearAccum.mor), gear: gearAccum.mor },
  };
}

/** Format stat as "base + gear" with gear in yellow span. Returns HTML string. */
export function formatStatBaseAndGear(
  base: number,
  gear: number,
  suffix = "",
): string {
  if (gear === 0) return `${base}${suffix}`;
  return `${base}+<span class="stat-gear">${gear}</span>${suffix}`;
}
