/** Starting credits when beginning a new game (TODO: revert to 5000 before release) */
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
