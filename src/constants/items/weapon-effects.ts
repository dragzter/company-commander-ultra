/**
 * Epic weapon effects: passive combat traits.
 * Each effect has a display name, description, and combat modifiers.
 */
import type { WeaponEffectId, WeaponEffectModifiers } from "./types.ts";

export interface WeaponEffect {
  id: WeaponEffectId;
  name: string;
  description: string;
  modifiers: WeaponEffectModifiers;
}

export const WEAPON_EFFECTS: Record<WeaponEffectId, WeaponEffect> = {
  calibrated: {
    id: "calibrated",
    name: "Calibrated",
    description: "Increases chance to hit by 2%",
    modifiers: { chanceToHit: 0.02 },
  },
  balanced: {
    id: "balanced",
    name: "Balanced",
    description: "Increases chance to evade by 2%",
    modifiers: { chanceToEvade: 0.02 },
  },
  lethal: {
    id: "lethal",
    name: "Lethal",
    description: "Increases chance to hit by 3%",
    modifiers: { chanceToHit: 0.03 },
  },
  heavy_caliber: {
    id: "heavy_caliber",
    name: "Heavy Caliber",
    description: "Increases damage dealt by 3%",
    modifiers: { damagePercent: 0.03 },
  },
  steady_grip: {
    id: "steady_grip",
    name: "Steady Grip",
    description: "Increases damage mitigation by 2%",
    modifiers: { mitigateDamage: 0.02 },
  },
  quick_cycle: {
    id: "quick_cycle",
    name: "Quick Cycle",
    description: "Attacks 5% faster",
    modifiers: { attackIntervalMultiplier: 0.95 },
  },
};
