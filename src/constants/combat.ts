/**
 * Combat balance constants. Tweak these to adjust difficulty and feel.
 * All attack interval / weapon speed logic is centralized here.
 */

/** Enemy HP multiplier. Enemies have this fraction of their base HP (from gear, level, etc). 0.55 = 55% HP (reduced from 50%). */
export const ENEMY_HP_MULTIPLIER = 0.55;

/** Enemy damage multiplier. Enemies deal this fraction of their base damage vs players. 0.7 = 70%. */
export const ENEMY_DAMAGE_MULTIPLIER = 0.7;

/** Global weapon damage multiplier. Applied to all weapon damage. 0.95 = 5% reduction. */
export const WEAPON_DAMAGE_MULTIPLIER = 0.95;

// ─── Attack interval (weapon speed) ─────────────────────────────────────────
// Formula: interval = max(MIN, round((BASE - speed*FACTOR) * MULT * dexMult))
// Targets: speed 1 ≈ 5.5s, speed 10 ≈ 1s (before dex).

export const ATTACK_INTERVAL_BASE_MS = 6000;
export const ATTACK_INTERVAL_SPEED_FACTOR = 500;
export const ATTACK_INTERVAL_MULTIPLIER = 0.9;
export const ATTACK_INTERVAL_MIN_MS = 500;

/** Dexterity: at this value, soldier gets max speed bonus (interval reduced by DEX_MAX_SPEED_BONUS). */
export const ATTACK_INTERVAL_DEX_FOR_MAX_BONUS = 500;
/** Dexterity max bonus: up to 20% faster attacks (interval * 0.8). */
export const ATTACK_INTERVAL_DEX_MAX_BONUS = 0.2;

/** Compute attack interval ms from weapon speed_base (1–10) and dexterity. */
export function computeAttackIntervalMs(
  weapon: { speed_base?: number } | undefined,
  dexterity: number,
): number {
  const spd = Math.max(1, Math.min(10, weapon?.speed_base ?? 5));
  const baseMs = ATTACK_INTERVAL_BASE_MS - spd * ATTACK_INTERVAL_SPEED_FACTOR;
  const dexMult =
    1 - Math.min(ATTACK_INTERVAL_DEX_MAX_BONUS, (dexterity ?? 0) / ATTACK_INTERVAL_DEX_FOR_MAX_BONUS);
  const interval = Math.round(baseMs * ATTACK_INTERVAL_MULTIPLIER * dexMult);
  return Math.max(ATTACK_INTERVAL_MIN_MS, interval);
}
