/** Starting credits when beginning a new game (100k for testing) */
export const STARTING_CREDITS = 100_000;

/** Base cost to recruit one soldier from the market */
export const RECRUIT_COST_PER_SOLDIER = 500;

/** Default inventory capacity for a new company (level 1) */
export const DEFAULT_INVENTORY_CAPACITY = 20;

/**
 * Armory slots: 20 base, +4 every other level. L1=20, L10=40, L20=60.
 */
export function getArmorySlots(level: number): number {
  if (level < 1) return DEFAULT_INVENTORY_CAPACITY;
  return 20 + Math.floor(Math.min(level, 20) / 2) * 4;
}

/**
 * Per-category armory caps:
 * L1–6: 6/6/20 (weapons/armor/supplies)
 * L7–12: 8/8/25
 * L13–18: 10/10/30
 * L19–20: 10/10/40
 */
export function getWeaponArmorySlots(level: number): number {
  if (level < 1) return 6;
  if (level <= 6) return 6;
  if (level <= 12) return 8;
  return 10;
}
export function getArmorArmorySlots(level: number): number {
  if (level < 1) return 6;
  if (level <= 6) return 6;
  if (level <= 12) return 8;
  return 10;
}
export function getEquipmentArmorySlots(level: number): number {
  if (level < 1) return 20;
  if (level <= 6) return 20;
  if (level <= 12) return 25;
  if (level <= 18) return 30;
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

/** Total armory slots (weapons + armor + equipment) for display. L1=20, L10=80. */
export function getTotalArmorySlots(level: number): number {
  return getWeaponArmorySlots(level) + getArmorArmorySlots(level) + getEquipmentArmorySlots(level);
}

/** Company XP required to reach level L (total). Slow: ~80-100+ missions to L10, ~200+ to L20. */
const XP_FOR_LEVEL = [
  0, 500, 1500, 3000, 5000, 7500, 10500, 14000, 18000, 22500, 27500,
  33000, 39000, 46000, 54000, 63000, 73000, 84000, 96000, 109000, 124000,
];

export function getXpRequiredForLevel(level: number): number {
  if (level < 1 || level > 20) return level <= 1 ? 0 : XP_FOR_LEVEL[20];
  return XP_FOR_LEVEL[level] ?? 0;
}

/** Soldier XP required to reach level L (total). Exponential: L2~130 (3–4 missions), each level needs ~22% more XP. */
const SOLDIER_XP_FOR_LEVEL = [
  0, 130, 289, 483, 720, 1009, 1362, 1793, 2319, 2961, 3744,
  4699, 5864, 7285, 9019, 11134, 13714, 16862, 20703, 25389,
];

export function getSoldierXpRequiredForLevel(level: number): number {
  if (level < 1 || level > 20) return level <= 1 ? 0 : SOLDIER_XP_FOR_LEVEL[19];
  return SOLDIER_XP_FOR_LEVEL[level - 1] ?? 0;
}

/** Derive level from total XP (RPG-style: level is calculated from XP). */
export function getLevelFromExperience(totalXp: number): number {
  let lvl = 1;
  for (let i = 2; i <= 20; i++) {
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

/** Soldier energy (0–100, fixed). Depleted by missions; rested soldiers recover. */
export const ENERGY_MAX = 100;
/** Base energy cost per mission (each participating soldier) */
export const ENERGY_COST_BASE = 5;
/** Extra energy cost (once) if any soldier dies or is incapacitated */
export const ENERGY_COST_CASUALTY = 5;
/** Extra energy cost (once) if mission is failed */
export const ENERGY_COST_FAIL = 10;
/** Energy recovered by soldiers who did not participate in the mission */
export const ENERGY_RECOVERY_REST = 20;

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
