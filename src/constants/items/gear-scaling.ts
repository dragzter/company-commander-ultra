import type { ArmorBonus, GearLevel, Rarity, WeaponBonus } from "./types.ts";
import { BASE_GEAR_LEVEL_CAP, MAX_GEAR_LEVEL, MIN_GEAR_LEVEL } from "./types.ts";

export function clampGearLevel(level: number): GearLevel {
  return Math.max(MIN_GEAR_LEVEL, Math.min(MAX_GEAR_LEVEL, Math.floor(level))) as GearLevel;
}

export function getPostCapGearSteps(level: number): number {
  return Math.max(0, clampGearLevel(level) - BASE_GEAR_LEVEL_CAP);
}

const POST20_BASE_WEAPON_GAIN_BY_RARITY: Record<Rarity, number> = {
  common: 0.30,
  rare: 0.30 * 1.15,
  epic: 0.45,
};

const POST20_LATE_SEGMENT_MULT = 0.6;
const POST20_TOTAL_OUTPUT_MULT = 1.2;

/**
 * Per-weapon post-cap slope multipliers (first-pass rebalance sheet).
 * 1.0 = default rarity slope, <1.0 slower growth, >1.0 catch-up growth.
 */
const WEAPON_POST20_SLOPE_MULT: Record<string, number> = {
  // Common
  m5_assault_rifle: 1.1,
  s44_galt: 1.0,
  war_rifle: 1.3,
  double_barrel_shotgun: 1.05,
  m42_pistol_carbine: 0.75,
  lsaw_guardsman: 0.95,
  akpd_assault: 0.85,
  m240_delta: 0.8,
  compact_smg: 1.0,
  r99_battle_rifle: 1.25,
  // Rare
  storm_carbine: 0.95,
  veteran_war_rifle: 1.0,
  stinger_smg: 0.8,
  marksman_dmr: 1.0,
  suppressor_mg: 0.68,
  field_medic_smg: 0.78,
  // Epic
  titan_slam: 0.98,
  phantom_rifle: 0.92,
  predator_rifle: 1.05,
  reaper_hmg: 0.9,
  savior_smg: 0.9,
  wrath_carbine: 0.95,
  executioner_lmg: 0.9,
  nullifier_lmg: 0.9,
  guardian_smg: 0.9,
  m17_rifle: 0.9,
  pulse_rifle: 1.08,
  hm45_assault_carbine: 1.05,
  the_butcher: 0.9,
};

function getWeaponPost20SlopeMult(baseId: string | undefined): number {
  if (!baseId) return 1;
  return WEAPON_POST20_SLOPE_MULT[baseId] ?? 1;
}

function normalizeWeaponPost20SlopeMult(rarity: Rarity, slopeMult: number): number {
  if (rarity === "epic") return Math.max(0.9, slopeMult);
  if (rarity === "rare") return Math.min(1, slopeMult);
  return slopeMult;
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
 * - Levels 1-20 keep each weapon's base identity curve untouched.
 * - Levels 21-100 use rarity slope * weapon multiplier.
 * - Levels 101+ keep growing at 60% of the 21-100 slope (prevents runaway compression/outliers).
 */
export function applyPostCapWeaponDamage(
  level20Min: number,
  level20Max: number,
  level: number,
  options: { rarity: Rarity; baseId?: string },
): { min: number; max: number } {
  const postCap = getPostCapGearSteps(level);
  if (postCap <= 0) return { min: level20Min, max: level20Max };

  const tier = clampGearLevel(level);
  const earlySteps = Math.max(0, Math.min(tier, 100) - BASE_GEAR_LEVEL_CAP);
  const lateSteps = Math.max(0, tier - 100);
  const rarityGain = POST20_BASE_WEAPON_GAIN_BY_RARITY[options.rarity] ?? POST20_BASE_WEAPON_GAIN_BY_RARITY.common;
  const slopeMult = normalizeWeaponPost20SlopeMult(options.rarity, getWeaponPost20SlopeMult(options.baseId));
  const gainPerSide =
    (earlySteps * rarityGain + lateSteps * rarityGain * POST20_LATE_SEGMENT_MULT) *
    slopeMult;
  const scaledMin = (level20Min + gainPerSide) * POST20_TOTAL_OUTPUT_MULT;
  const scaledMax = (level20Max + gainPerSide) * POST20_TOTAL_OUTPUT_MULT;
  return {
    min: scaledMin,
    max: scaledMax,
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
