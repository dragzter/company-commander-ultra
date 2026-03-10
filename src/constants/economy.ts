/** Starting credits when beginning a new game (100k for testing) */
export const STARTING_CREDITS = 100_000;
export const MAX_COMPANY_LEVEL = 10;

/** Base cost to recruit one soldier from the market */
export const RECRUIT_COST_PER_SOLDIER = 500;

/** Default inventory capacity for a new company (level 1) */
export const DEFAULT_INVENTORY_CAPACITY = 20;

/**
 * Armory slots: 20 base, +4 per company level. L1=24, L10=60.
 */
export function getArmorySlots(level: number): number {
  if (level < 1) return DEFAULT_INVENTORY_CAPACITY;
  return 20 + Math.min(level, MAX_COMPANY_LEVEL) * 4;
}

/**
 * Per-category armory caps:
 * L1–3: 6/6/20 (weapons/armor/supplies)
 * L4–6: 8/8/25
 * L7–9: 10/10/30
 * L10: 10/10/40
 */
export function getWeaponArmorySlots(level: number): number {
  if (level < 1) return 6;
  if (level <= 3) return 6;
  if (level <= 6) return 8;
  return 10;
}
export function getArmorArmorySlots(level: number): number {
  if (level < 1) return 6;
  if (level <= 3) return 6;
  if (level <= 6) return 8;
  return 10;
}
export function getEquipmentArmorySlots(level: number): number {
  if (level < 1) return 20;
  if (level <= 3) return 20;
  if (level <= 6) return 25;
  if (level <= 9) return 30;
  return 40;
}

/** Cap for a category (used by external modules that need category string). */
export function getArmorySlotsForCategory(
  level: number,
  category: "weapon" | "armor" | "equipment",
): number {
  if (category === "weapon") return getWeaponArmorySlots(level);
  if (category === "armor") return getArmorArmorySlots(level);
  return getEquipmentArmorySlots(level);
}

/** Total armory slots (weapons + armor + equipment) for display. L1=32, L10=60. */
export function getTotalArmorySlots(level: number): number {
  return getWeaponArmorySlots(level) + getArmorArmorySlots(level) + getEquipmentArmorySlots(level);
}

/** Company XP required to reach level L (total). Max company level is 10. */
const XP_FOR_LEVEL = [
  0, 0, 1500, 5000, 10500, 18000, 33000, 46000, 63000, 84000, 109000,
];

export function getXpRequiredForLevel(level: number): number {
  if (level < 1 || level > MAX_COMPANY_LEVEL) {
    return level <= 1 ? 0 : XP_FOR_LEVEL[MAX_COMPANY_LEVEL];
  }
  return XP_FOR_LEVEL[level] ?? 0;
}

/** Soldier XP required to reach level L (total). */
const SOLDIER_XP_FOR_LEVEL = [
  0, 176, 390, 652, 972, 1362, 1839, 2421, 3131, 3997, 5054,
  6344, 7916, 9835, 12176, 15031, 18514, 22764, 27949, 34275,
];

export const MAX_SOLDIER_LEVEL = 999;
const SOLDIER_XP_STEP_GROWTH = 1.22;

const SOLDIER_XP_THRESHOLDS: number[] = (() => {
  // index 0 => level 1 threshold, index n => level n+1 threshold
  const thresholds: number[] = SOLDIER_XP_FOR_LEVEL.slice();
  let total = thresholds[thresholds.length - 1];
  let lastStep = thresholds[thresholds.length - 1] - thresholds[thresholds.length - 2];
  for (let lvl = 21; lvl <= MAX_SOLDIER_LEVEL; lvl++) {
    lastStep = Math.max(1, Math.round(lastStep * SOLDIER_XP_STEP_GROWTH));
    total += lastStep;
    thresholds.push(total);
  }
  return thresholds;
})();

export function getSoldierXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level >= MAX_SOLDIER_LEVEL) return SOLDIER_XP_THRESHOLDS[MAX_SOLDIER_LEVEL - 1];
  return SOLDIER_XP_THRESHOLDS[level - 1] ?? 0;
}

/** Derive level from total XP (RPG-style: level is calculated from XP). */
export function getLevelFromExperience(totalXp: number): number {
  let lvl = 1;
  for (let i = 2; i <= MAX_SOLDIER_LEVEL; i++) {
    if (totalXp >= getSoldierXpRequiredForLevel(i)) lvl = i;
    else break;
  }
  return lvl;
}

/** Soldier combat XP: base for surviving mission, + per damage dealt, + per damage taken, + per kill, + per ability use. Base reduced, damage/deal increased to favor combat participation. */
export const SOLDIER_XP_BASE_SURVIVE_VICTORY = 18;
export const SOLDIER_XP_BASE_SURVIVE_DEFEAT = 9;
export const SOLDIER_XP_PER_DAMAGE = 0.22;
export const SOLDIER_XP_PER_DAMAGE_TAKEN = 0.12;
export const SOLDIER_XP_PER_KILL = 6;
export const SOLDIER_XP_PER_ABILITY_USE = 1.5;
export const SOLDIER_XP_PER_HEAL = 0.08;

/** Multiplier applied to company XP derived from total soldier combat XP. */
export const COMPANY_XP_FROM_COMBAT_MULTIPLIER = 1.1;

/** Soldier energy (0–100, fixed). Depleted by missions; rested soldiers recover. */
export const ENERGY_MAX = 100;
/** Base energy cost per mission (each participating soldier) */
export const ENERGY_COST_BASE = 5;
/** Extra energy cost (once) if any soldier dies or is incapacitated */
export const ENERGY_COST_CASUALTY = 5;
/** Extra energy cost (once) if mission is failed */
export const ENERGY_COST_FAIL = 10;
/** Energy deducted from each participant when quitting a mission (to min 0) */
export const ENERGY_COST_QUIT = 50;
/** Energy recovered by soldiers who did not participate in the mission */
export const ENERGY_RECOVERY_REST = 3;

/** Re-export gear pricing from item-pricing for use in gear market. */
export { getWeaponPrice, getArmorPrice } from "./item-pricing.ts";

/**
 * Cost modifier per trait stat point (positive traits cost more, negative cost less)
 */
const RECRUIT_COST_PER_TRAIT_POINT = 8;

/**
 * Variable recruit cost based on soldier traits.
 * Strong traits (positive modifiers) increase cost; weak traits decrease it.
 */
export function getRecruitCost(
  traitStats: Record<string, number> | undefined,
): number {
  const base = RECRUIT_COST_PER_SOLDIER;
  if (!traitStats || typeof traitStats !== "object") return base;
  const sum = Object.values(traitStats).reduce((a, v) => a + (v ?? 0), 0);
  const modifier = Math.round(sum * RECRUIT_COST_PER_TRAIT_POINT);
  return Math.max(100, base + modifier);
}
