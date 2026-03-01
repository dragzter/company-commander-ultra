import type { ArmorBonus, GearLevel, WeaponBonus } from "./types.ts";
import { BASE_GEAR_LEVEL_CAP, MAX_GEAR_LEVEL, MIN_GEAR_LEVEL } from "./types.ts";

export function clampGearLevel(level: number): GearLevel {
  return Math.max(MIN_GEAR_LEVEL, Math.min(MAX_GEAR_LEVEL, Math.floor(level))) as GearLevel;
}

export function getPostCapGearSteps(level: number): number {
  return Math.max(0, clampGearLevel(level) - BASE_GEAR_LEVEL_CAP);
}

/**
 * Armor pre-cap bonus growth (levels 1-20):
 * - Flat bonuses: +1 per level above 1
 * - Percent bonuses: +0.1% per level above 1
 */
export function scaleArmorBonusesToPreCapLevel(baseBonuses: ArmorBonus[] | undefined, level: number): ArmorBonus[] | undefined {
  if (!baseBonuses || baseBonuses.length === 0) return baseBonuses;
  const tier = clampGearLevel(level);
  const preCapLevel = Math.min(tier, BASE_GEAR_LEVEL_CAP);
  const growth = Math.max(0, preCapLevel - 1);
  if (growth <= 0) return [...baseBonuses];

  return baseBonuses.map((b) => {
    if (
      b.type === "flat" &&
      (b.stat === "dex" || b.stat === "toughness" || b.stat === "morale" || b.stat === "awareness")
    ) {
      return { ...b, value: b.value + growth };
    }
    return { ...b };
  });
}

/**
 * Weapon pre-cap bonus growth (levels 1-20):
 * - Flat bonuses: +1 per level above 1
 * - Percent bonuses: +0.1% per level above 1
 */
export function scaleWeaponBonusesToPreCapLevel(baseBonuses: WeaponBonus[] | undefined, level: number): WeaponBonus[] | undefined {
  if (!baseBonuses || baseBonuses.length === 0) return baseBonuses;
  const tier = clampGearLevel(level);
  const preCapLevel = Math.min(tier, BASE_GEAR_LEVEL_CAP);
  const growth = Math.max(0, preCapLevel - 1);
  if (growth <= 0) return [...baseBonuses];

  return baseBonuses.map((b) => {
    if (
      b.type === "flat" &&
      (b.stat === "dex" || b.stat === "toughness" || b.stat === "morale" || b.stat === "awareness")
    ) {
      return { ...b, value: b.value + growth };
    }
    return { ...b };
  });
}

/**
 * Weapon post-cap growth:
 * - Levels 1-20 use each base weapon's original curve.
 * - Levels 21+ add +0.4 min and +0.4 max damage per level.
 */
export function applyPostCapWeaponDamage(level20Min: number, level20Max: number, level: number): { min: number; max: number } {
  const postCap = getPostCapGearSteps(level);
  return {
    min: level20Min + postCap * 0.4,
    max: level20Max + postCap * 0.4,
  };
}

/**
 * Armor post-cap growth (level 21+):
 * - Adds only flat HP growth.
 * - Does NOT add passive percent bonuses (MIT/AVD/CTH).
 */
export function applyPostCapArmorBonuses(baseBonuses: ArmorBonus[] | undefined, level: number): ArmorBonus[] | undefined {
  const postCap = getPostCapGearSteps(level);
  if (postCap <= 0) return baseBonuses;

  const hpGain = Math.floor((postCap + 1) / 2);

  const next = [...(baseBonuses ?? [])];
  const addOrMergeFlat = (stat: "hp" | "toughness" | "dex" | "awareness" | "morale", value: number) => {
    if (value <= 0) return;
    const idx = next.findIndex((b) => b.type === "flat" && b.stat === stat);
    if (idx >= 0) {
      const cur = next[idx] as Extract<ArmorBonus, { type: "flat" }>;
      next[idx] = { ...cur, value: cur.value + value };
      return;
    }
    next.push({ type: "flat", stat, value });
  };

  addOrMergeFlat("hp", hpGain);

  return next;
}
