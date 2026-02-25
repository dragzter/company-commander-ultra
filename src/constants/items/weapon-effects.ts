/**
 * Epic weapon effects: passive combat traits and proc effects.
 * Each effect has a display name, description, and combat modifiers.
 * Proc effects (firebreaker, eye_for_an_eye, stormhammer) trigger on hit.
 */
import type { WeaponEffectId, WeaponEffectModifiers } from "./types.ts";

export type WeaponProcType = "fire" | "blind" | "stun";

export interface WeaponProc {
  chance: number;
  type: WeaponProcType;
  damage?: number;
  durationMs?: number;
  hitChanceReduction?: number;
}

export interface WeaponEffect {
  id: WeaponEffectId;
  name: string;
  description: string;
  modifiers: WeaponEffectModifiers;
  proc?: WeaponProc;
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
  firebreaker: {
    id: "firebreaker",
    name: "Firebreaker",
    description: "8% chance to deal 3 fire damage (ignores armor)",
    modifiers: {},
    proc: { chance: 0.08, type: "fire", damage: 3 },
  },
  eye_for_an_eye: {
    id: "eye_for_an_eye",
    name: "Eye for an Eye",
    description: "5% chance to blind enemy for 6s (reduces hit chance by 30%)",
    modifiers: {},
    proc: { chance: 0.05, type: "blind", durationMs: 6000, hitChanceReduction: 0.3 },
  },
  stormhammer: {
    id: "stormhammer",
    name: "Stormhammer",
    description: "5% chance to stun enemy for 3s (toughness penalty applies)",
    modifiers: {},
    proc: { chance: 0.05, type: "stun", durationMs: 3000 },
  },
  eagle_eye: {
    id: "eagle_eye",
    name: "Eagle Eye",
    description: "Increases chance to hit by 5%",
    modifiers: { chanceToHit: 0.05 },
  },
};
