import { computeFinalDamage } from "../../game/combat/combat-damage.ts";
import type { Combatant } from "../../game/combat/types.ts";
import type { WeaponProc, WeaponProcType } from "../../constants/items/weapon-effects.ts";

export interface WeaponProcApplyContext {
  attacker: Combatant;
  target: Combatant;
  now: number;
  proc: WeaponProc;
}

export interface WeaponProcApplyResult {
  extraDamage?: number;
  appliedFlags?: string[];
}

type WeaponProcHandler = (ctx: WeaponProcApplyContext) => WeaponProcApplyResult;

const WEAPON_PROC_HANDLERS: Record<WeaponProcType, WeaponProcHandler> = {
  fire: ({ proc, target }) => {
    if (proc.damage == null || target.immuneToBurning) return {};
    const extraDamage = Math.max(1, Math.floor(proc.damage));
    target.hp = Math.max(0, Math.floor(target.hp - extraDamage));
    return { extraDamage, appliedFlags: ["fire"] };
  },
  carnage: ({ proc, target }) => {
    if (proc.damage == null) return {};
    const extraDamage = computeFinalDamage(proc.damage, target);
    target.hp = Math.max(0, Math.floor(target.hp - extraDamage));
    return { extraDamage, appliedFlags: ["carnage"] };
  },
  overwhelm: ({ now, proc, target }) => {
    if (proc.durationMs == null || proc.hitChanceReduction == null) return {};
    target.accuracyDebuffUntil = now + proc.durationMs;
    target.accuracyDebuffPct = proc.hitChanceReduction;
    return { appliedFlags: ["overwhelm"] };
  },
  blind: ({ now, proc, target }) => {
    if (proc.durationMs == null) return {};
    target.blindedUntil = now + proc.durationMs;
    return { appliedFlags: ["blind"] };
  },
  stun: ({ now, proc, target }) => {
    if (proc.durationMs == null || target.immuneToStun) return {};
    target.stunUntil = now + proc.durationMs;
    return { appliedFlags: ["stun"] };
  },
  bleed: ({ now, proc, target }) => {
    if (proc.damage == null || proc.durationMs == null) return {};
    const ticks = Math.max(1, Math.floor(proc.durationMs / 1000));
    target.bleedTickDamage = Math.max(1, Math.floor(proc.damage));
    target.bleedTicksRemaining = ticks;
    target.bleedingUntil = now + proc.durationMs;
    return { appliedFlags: ["bleed"] };
  },
};

/**
 * Dispatch weapon proc effects using a registry instead of hardcoded combat-loop branches.
 */
export function applyWeaponProcEffect(ctx: WeaponProcApplyContext): WeaponProcApplyResult {
  const handler = WEAPON_PROC_HANDLERS[ctx.proc.type];
  if (!handler) return {};
  return handler(ctx);
}

