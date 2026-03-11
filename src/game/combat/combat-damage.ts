/**
 * Centralized combat damage calculation.
 *
 * Flow (weapons, grenades, throwing knives, etc.):
 * 1. Hit check → 2. Evade check → 3. Damage = raw * (1 - mitigation)
 *
 * Mitigation is a single final value:
 *   mitigation = toughness->mitigation + additive mitigation bonus (gear/effects),
 * then quantized to 0.1% and capped.
 * If toughness is reduced by debuffs, mitigation is recalculated from current
 * effective toughness plus the additive bonus.
 * Example: 100 raw damage, 10% mitigation → target takes 90 damage.
 */
import type { Combatant } from "./types.ts";

const MAX_MITIGATION = 0.6;
const TOUGHNESS_DIVISOR = 9;
const MITIGATION_STEP = 0.001; // 0.1%

/** Convert toughness to mitigation percentage (0–0.6). Same formula as soldier-manager. */
export function toughnessToMitigation(toughness: number): number {
  return Math.min(MAX_MITIGATION, toughness / TOUGHNESS_DIVISOR / 100);
}

function quantizeMitigation(mitigation: number): number {
  const clamped = Math.max(0, Math.min(MAX_MITIGATION, mitigation));
  return Math.ceil(clamped / MITIGATION_STEP) * MITIGATION_STEP;
}

/**
 * Compute final damage to apply to target.
 * Mitigation is derived from target's current toughness (so debuffs flow through).
 * Stun halves effective mitigation. Toughness reduction (e.g. M3A Repressor) reduces effective toughness.
 */
export function computeFinalDamage(
  rawDamage: number,
  target: Pick<
    Combatant,
    | "mitigateDamage"
    | "mitigationBonusPct"
    | "toughness"
    | "stunUntil"
    | "toughnessReducedUntil"
    | "toughnessReductionPct"
  >,
): number {
  let effectiveToughness = target.toughness ?? 0;
  if (
    target.toughnessReducedUntil != null &&
    Date.now() < target.toughnessReducedUntil &&
    target.toughnessReductionPct != null
  ) {
    effectiveToughness = effectiveToughness * (1 - target.toughnessReductionPct);
  }

  const fromToughness = toughnessToMitigation(effectiveToughness);
  const additiveBonus =
    target.mitigationBonusPct ??
    Math.max(0, (target.mitigateDamage ?? 0) - fromToughness);
  let mit = quantizeMitigation(fromToughness + additiveBonus);
  if (target.stunUntil != null && Date.now() < target.stunUntil) {
    mit *= 0.5; // Stunned: toughness-derived mitigation halved
    mit = quantizeMitigation(mit);
  }
  const damage = rawDamage * (1 - mit);
  return Math.max(1, Math.ceil(damage));
}
