/**
 * Epic weapon effects: passive combat traits and proc effects.
 * Each effect has a display name, description, and combat modifiers.
 * Proc effects (firebreaker, eye_for_an_eye, stormhammer) trigger on hit.
 */
import type { WeaponEffectId, WeaponEffectModifiers } from "./types.ts";

export type WeaponProcType = "fire" | "blind" | "stun" | "carnage" | "overwhelm" | "bleed";

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
    description: "Attacks 10% faster",
    modifiers: { attackIntervalMultiplier: 0.9 },
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
    description: "5% chance to stun enemy for 3s",
    modifiers: {},
    proc: { chance: 0.05, type: "stun", durationMs: 3000 },
  },
  eagle_eye: {
    id: "eagle_eye",
    name: "Eagle Eye",
    description: "Increases chance to hit by 5%",
    modifiers: { chanceToHit: 0.05 },
  },
  target_acquired: {
    id: "target_acquired",
    name: "Target Acquired",
    description: "Ignores 60% of target's avoidance",
    modifiers: { ignoreAvoidancePercent: 0.6 },
  },
  carnage: {
    id: "carnage",
    name: "Carnage",
    description: "8% chance to deal 5 extra damage per shot",
    modifiers: {},
    proc: { chance: 0.08, type: "carnage", damage: 5 },
  },
  overwhelm: {
    id: "overwhelm",
    name: "Overwhelm",
    description: "8% chance to reduce target's chance to hit by 5% for 10s",
    modifiers: {},
    proc: { chance: 0.08, type: "overwhelm", durationMs: 10000, hitChanceReduction: 0.05 },
  },
  focused: {
    id: "focused",
    name: "Focused",
    description: "Increases chance to hit by 2%",
    modifiers: { chanceToHit: 0.02 },
  },
  eviscerate: {
    id: "eviscerate",
    name: "Eviscerate",
    description: "Chance to inflict bleeding: 3 damage per second for 4 seconds.",
    modifiers: {},
    proc: { chance: 0.08, type: "bleed", damage: 3, durationMs: 4000 },
  },
};
