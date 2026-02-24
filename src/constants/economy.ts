/** Starting credits when beginning a new game (100k for testing) */
export const STARTING_CREDITS = 100_000;

/** Base cost to recruit one soldier from the market */
export const RECRUIT_COST_PER_SOLDIER = 500;

/** Default inventory capacity for a new company (level 1) */
export const DEFAULT_INVENTORY_CAPACITY = 20;

/**
 * Armory slots: 20 base, +4 every other level (L2,L4,L6,L8,L10), max 40 at L10.
 * L1=20, L2=24, L3=24, L4=28, L5=28, L6=32, L7=32, L8=36, L9=36, L10=40.
 */
export function getArmorySlots(level: number): number {
  if (level < 1) return DEFAULT_INVENTORY_CAPACITY;
  return 20 + Math.floor(level / 2) * 4;
}

/**
 * Per-category armory caps: L1→5/5/10, L10→20/20/40 (weapons/armor/equipment).
 */
export function getWeaponArmorySlots(level: number): number {
  if (level < 1) return 5;
  return 5 + Math.floor(((level - 1) * 15) / 9);
}
export function getArmorArmorySlots(level: number): number {
  if (level < 1) return 5;
  return 5 + Math.floor(((level - 1) * 15) / 9);
}
export function getEquipmentArmorySlots(level: number): number {
  if (level < 1) return 10;
  return 10 + Math.floor(((level - 1) * 30) / 9);
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

/** XP required to reach level L (total). L1=0, L2=100, L3=250, L4=450, ..., L10=3250. Max level 10. */
const XP_FOR_LEVEL = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250];

export function getXpRequiredForLevel(level: number): number {
  if (level < 1 || level > 10) return level <= 1 ? 0 : XP_FOR_LEVEL[10];
  return XP_FOR_LEVEL[level] ?? 0;
}

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
