import { MAX_GEAR_LEVEL, MIN_GEAR_LEVEL } from "./types.ts";

function clampThrowableLevel(level: number): number {
  return Math.max(MIN_GEAR_LEVEL, Math.min(MAX_GEAR_LEVEL, Math.floor(level)));
}

/**
 * Unified throwable direct-damage scaling.
 * - Levels 1-20 follow existing 10% tier growth (keeps Lv20 frag at 87 from base 30).
 * - Levels 21+ use a flat post-cap lane (+0.4 damage per level, ceil).
 */
export function getScaledThrowableDamage(baseDamage: number, level: number): number {
  const lvl = clampThrowableLevel(level);
  const safeBase = Math.max(0, baseDamage);
  if (safeBase <= 0) return 0;
  const level20Damage = Math.round(safeBase * (1 + 19 * 0.1));
  if (lvl <= 20) {
    return Math.max(1, Math.round(safeBase * (1 + (lvl - 1) * 0.1)));
  }
  return Math.max(1, level20Damage + Math.ceil((lvl - 20) * 0.4));
}

export function getScaledThrowableLevel20Damage(baseDamage: number): number {
  return getScaledThrowableDamage(baseDamage, 20);
}

/**
 * Unified incendiary burn-tick scaling.
 * - Levels 1-20 keep legacy growth (+2 per level from base tick value).
 * - Levels 21+ use the shared post-cap lane (+0.4 per level, ceil).
 */
export function getScaledIncendiaryTickDamage(baseTickDamage: number, level: number): number {
  const lvl = clampThrowableLevel(level);
  const safeBase = Math.max(1, baseTickDamage);
  const level20Tick = Math.round(safeBase + 19 * 2);
  if (lvl <= 20) {
    return Math.max(1, Math.round(safeBase + (lvl - 1) * 2));
  }
  return Math.max(1, level20Tick + Math.ceil((lvl - 20) * 0.4));
}
