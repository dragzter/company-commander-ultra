import { MAX_GEAR_LEVEL } from "./types.ts";
import { getStatsForLevel } from "../../game/entities/levels.ts";

const MEDKIT_LEVEL_CAP = MAX_GEAR_LEVEL;
const MEDKIT_LV1_NON_MEDIC_HEAL = 20;
const MEDKIT_LV20_NON_MEDIC_HEAL = 40;
const MEDKIT_LV1_MEDIC_HEAL = 50;
const MEDKIT_LV20_MEDIC_HEAL = 100;
const LV20_SPAN = 19;
const POST20_LEVEL_SPAN = MEDKIT_LEVEL_CAP - 20;
const NON_MEDIC_TARGET_RATIO = 0.5;

/** Sum baseline soldier HP gains up to level (no trait/gear/status modifiers). */
export function getBaseSoldierHpForLevel(level: number): number {
  const capped = Math.max(1, Math.min(MEDKIT_LEVEL_CAP, Math.floor(level || 1)));
  let total = 0;
  for (let lvl = 1; lvl <= capped; lvl++) {
    total += getStatsForLevel(lvl)?.hit_points ?? 0;
  }
  return total;
}

/** Baseline HP for a level-999 soldier before traits and gear. */
export const BASE_SOLDIER_HP_AT_999 = getBaseSoldierHpForLevel(999);

/** Target medkit heal at level 999 for medics: ~25% of baseline level-999 soldier HP. */
export const MEDKIT_TARGET_MEDIC_HEAL_AT_999 = Math.round(BASE_SOLDIER_HP_AT_999 * 0.25);
export const MEDKIT_TARGET_NON_MEDIC_HEAL_AT_999 = Math.round(MEDKIT_TARGET_MEDIC_HEAL_AT_999 * NON_MEDIC_TARGET_RATIO);

const MEDKIT_POST20_MEDIC_PER_LEVEL =
  (MEDKIT_TARGET_MEDIC_HEAL_AT_999 - MEDKIT_LV20_MEDIC_HEAL) / POST20_LEVEL_SPAN;
const MEDKIT_POST20_NON_MEDIC_PER_LEVEL =
  (MEDKIT_TARGET_NON_MEDIC_HEAL_AT_999 - MEDKIT_LV20_NON_MEDIC_HEAL) / POST20_LEVEL_SPAN;

/** MedKit heal amounts by item level. */
export function getMedKitHealValues(level: number): { nonMedic: number; medic: number } {
  const lvl = Math.max(1, Math.min(MEDKIT_LEVEL_CAP, Math.floor(level || 1)));
  if (lvl <= 20) {
    const t = (lvl - 1) / LV20_SPAN;
    return {
      nonMedic: Math.round(MEDKIT_LV1_NON_MEDIC_HEAL + (MEDKIT_LV20_NON_MEDIC_HEAL - MEDKIT_LV1_NON_MEDIC_HEAL) * t),
      medic: Math.round(MEDKIT_LV1_MEDIC_HEAL + (MEDKIT_LV20_MEDIC_HEAL - MEDKIT_LV1_MEDIC_HEAL) * t),
    };
  }

  const post20Levels = lvl - 20;
  return {
    nonMedic: MEDKIT_LV20_NON_MEDIC_HEAL + Math.ceil(post20Levels * MEDKIT_POST20_NON_MEDIC_PER_LEVEL),
    medic: MEDKIT_LV20_MEDIC_HEAL + Math.ceil(post20Levels * MEDKIT_POST20_MEDIC_PER_LEVEL),
  };
}
