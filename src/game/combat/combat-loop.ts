/**
 * Combat loop: attack scheduling, target assignment, Take Cover, smoke effects.
 */
import { WEAPON_EFFECTS } from "../../constants/items/weapon-effects.ts";
import { computeFinalDamage } from "./combat-damage.ts";
import type { Combatant, TargetMap } from "./types.ts";
import { applyWeaponProcEffect } from "../../services/combat/weapon-proc-registry.ts";

export const TAKE_COVER_DURATION_MS = 3000;

export function isInCover(c: Combatant, now: number): boolean {
  return c.takeCoverUntil != null && now < c.takeCoverUntil;
}

export function isStunned(c: Combatant, now: number): boolean {
  return c.stunUntil != null && now < c.stunUntil;
}

export function isSuppressed(c: Combatant, now: number): boolean {
  return c.suppressedUntil != null && now < c.suppressedUntil;
}

/** Can this combatant perform attacks? (Excludes stunned, in cover, suppressed, dead.) */
function canAttack(c: Combatant | undefined, now: number): boolean {
  return c != null && c.hp > 0 && !c.downState && !isInCover(c, now) && !isStunned(c, now) && !isSuppressed(c, now);
}

/** Can this combatant be targeted by attacks? In-cover soldiers cannot be targeted; enemies must pick different targets. */
function canBeTargeted(c: Combatant | undefined, now: number): boolean {
  if (c == null || c.hp <= 0 || c.downState || isInCover(c, now)) return false;
  if (c.side === "enemy" && c.setupUntil != null && now < c.setupUntil) return false;
  return true;
}

/** @deprecated Use canAttack/canBeTargeted. Kept for any external callers. */
export function isValidTarget(c: Combatant | undefined, now: number): boolean {
  return canAttack(c, now);
}

/** Assign targets: enemies target players, players target enemies. In-cover soldiers cannot be targeted. Preserves existing targets until invalid; reassigns with equal distribution across remaining targets. */
export function assignTargets(
  players: Combatant[],
  enemies: Combatant[],
  targets: TargetMap,
  now: number,
): void {
  const attackingPlayers = players.filter((p) => canAttack(p, now));
  const attackingEnemies = enemies.filter((e) => canAttack(e, now));
  const targetablePlayers = players.filter((p) => canBeTargeted(p, now));
  const targetableEnemies = enemies.filter((e) => canBeTargeted(e, now));

  // Remove invalid assignments (target dead/down/in-cover, or attacker can no longer attack)
  const toDelete: string[] = [];
  for (const [attackerId, targetId] of targets) {
    const attacker = [...players, ...enemies].find((c) => c.id === attackerId);
    const target = [...players, ...enemies].find((c) => c.id === targetId);
    if (!canAttack(attacker, now) || !canBeTargeted(target, now)) toDelete.push(attackerId);
  }
  for (const id of toDelete) targets.delete(id);

  // Assign new targets for those who need one; prefer targets with fewer attackers (equal distribution)
  const assignFor = (attackers: Combatant[], pool: Combatant[]) => {
    const targetCount = new Map<string, number>();
    for (const t of pool) targetCount.set(t.id, 0);
    for (const [_, tid] of targets) {
      if (pool.some((p) => p.id === tid)) targetCount.set(tid, (targetCount.get(tid) ?? 0) + 1);
    }

    for (const attacker of attackers) {
      const currentTargetId = targets.get(attacker.id);
      const currentTarget = currentTargetId ? pool.find((p) => p.id === currentTargetId) : null;
      if (currentTarget && canBeTargeted(currentTarget, now)) continue;

      if (pool.length === 0) continue;
      const sorted = [...pool].sort((a, b) => (targetCount.get(a.id) ?? 0) - (targetCount.get(b.id) ?? 0));
      const minCount = targetCount.get(sorted[0].id) ?? 0;
      const ties = sorted.filter((p) => (targetCount.get(p.id) ?? 0) === minCount);
      const chosen = ties[Math.floor(Math.random() * ties.length)];
      targets.set(attacker.id, chosen.id);
      targetCount.set(chosen.id, (targetCount.get(chosen.id) ?? 0) + 1);
    }
  };

  assignFor(attackingEnemies, targetablePlayers);
  assignFor(attackingPlayers, targetableEnemies);
}

const BURN_TICK_INTERVAL_MS = 1000;

/** Base 20% + 1% per level (doc in codex). Relentless multiplies by 1.6. */
export function getIncapacitationChance(c: { level?: number; incapChanceMultiplier?: number }): number {
  const level = c.level ?? 1;
  const base = 0.2 + (level - 1) * 0.01;
  const mult = c.incapChanceMultiplier ?? 1;
  return Math.min(1, base * mult);
}

export interface BurnDamageEvent {
  targetId: string;
  damage: number;
}

/** Apply burn DoT tick to combatants. Call each combat tick; processes at most once per second. Returns damage events for UI feedback. */
export function applyBurnTicks(
  combatants: Combatant[],
  now: number,
  lastBurnTickTimeRef: { current: number },
): BurnDamageEvent[] {
  const events: BurnDamageEvent[] = [];
  if (now - lastBurnTickTimeRef.current < BURN_TICK_INTERVAL_MS) return events;
  lastBurnTickTimeRef.current = now;
  for (const c of combatants) {
    if ((c.burnTicksRemaining ?? 0) <= 0) continue;
    if (c.immuneToBurning) continue;
    const dmg = c.burnTickDamage ?? 0;
    if (dmg <= 0) continue;
    const damage = c.burnIgnoresMitigation ? dmg : computeFinalDamage(dmg, c);
    const newHp = Math.max(0, Math.floor(c.hp - damage));
    c.hp = newHp;
    events.push({ targetId: c.id, damage });
    if (newHp <= 0) {
      c.downState = c.side === "player" && Math.random() < getIncapacitationChance(c) ? "incapacitated" : "kia";
      if (c.downState === "kia") c.killedBy = "Burning";
      clearCombatantEffectsOnDeath(c);
    }
    c.burnTicksRemaining! -= 1;
    if (c.burnTicksRemaining! <= 0) {
      delete c.burnTicksRemaining;
      delete c.burnTickDamage;
      delete c.burnIgnoresMitigation;
      /* Keep burningUntil so the burning visual lasts the full duration; clearExpiredEffects will clear it. */
    }
  }
  return events;
}

/** Apply bleed DoT tick. Uses same interval as burn (1s). Bleed damage is mitigated. */
export function applyBleedTicks(
  combatants: Combatant[],
  now: number,
  lastTickTimeRef: { current: number },
): BurnDamageEvent[] {
  const events: BurnDamageEvent[] = [];
  if (now - lastTickTimeRef.current < BURN_TICK_INTERVAL_MS) return events;
  lastTickTimeRef.current = now;
  for (const c of combatants) {
    if ((c.bleedTicksRemaining ?? 0) <= 0) continue;
    const dmg = c.bleedTickDamage ?? 0;
    if (dmg <= 0) continue;
    const damage = computeFinalDamage(dmg, c);
    const newHp = Math.max(0, Math.floor(c.hp - damage));
    c.hp = newHp;
    events.push({ targetId: c.id, damage });
    if (newHp <= 0) {
      c.downState = c.side === "player" && Math.random() < getIncapacitationChance(c) ? "incapacitated" : "kia";
      if (c.downState === "kia") c.killedBy = "Bleeding";
      clearCombatantEffectsOnDeath(c);
    }
    c.bleedTicksRemaining! -= 1;
    if (c.bleedTicksRemaining! <= 0) {
      delete c.bleedTicksRemaining;
      delete c.bleedTickDamage;
    }
  }
  return events;
}

/** Clear expired effects on all combatants */
export function clearExpiredEffects(combatants: Combatant[], now: number): void {
  for (const c of combatants) {
    if (c.takeCoverUntil != null && now >= c.takeCoverUntil) delete c.takeCoverUntil;
    if (c.smokedUntil != null && now >= c.smokedUntil) delete c.smokedUntil;
    if (c.stunUntil != null && now >= c.stunUntil) delete c.stunUntil;
    if (c.panicUntil != null && now >= c.panicUntil) delete c.panicUntil;
    if (c.burningUntil != null && now >= c.burningUntil) {
      delete c.burningUntil;
      delete c.burnTickDamage;
      delete c.burnTicksRemaining;
      delete c.burnIgnoresMitigation;
    }
    if (c.bleedingUntil != null && now >= c.bleedingUntil) {
      delete c.bleedingUntil;
      delete c.bleedTickDamage;
      delete c.bleedTicksRemaining;
    }
    if (c.blindedUntil != null && now >= c.blindedUntil) delete c.blindedUntil;
    if (c.accuracyDebuffUntil != null && now >= c.accuracyDebuffUntil) {
      delete c.accuracyDebuffUntil;
      delete c.accuracyDebuffPct;
    }
    if (c.toughnessReducedUntil != null && now >= c.toughnessReducedUntil) {
      delete c.toughnessReducedUntil;
      delete c.toughnessReductionPct;
    }
    if (c.suppressedUntil != null && now >= c.suppressedUntil) delete c.suppressedUntil;
    if (c.attackSpeedBuffUntil != null && now >= c.attackSpeedBuffUntil) {
      delete c.attackSpeedBuffUntil;
      delete c.attackSpeedBuffMultiplier;
    }
  }
}

/** Clear all effect timers and markers when a combatant dies (KIA/down). */
export function clearCombatantEffectsOnDeath(c: Combatant): void {
  delete c.takeCoverUntil;
  delete c.takeCoverCooldownUntil;
  delete c.suppressCooldownUntil;
  delete c.suppressedUntil;
  delete c.grenadeCooldownUntil;
  delete c.smokedUntil;
  delete c.stunUntil;
  delete c.panicUntil;
  delete c.burningUntil;
  delete c.burnTickDamage;
  delete c.burnTicksRemaining;
  delete c.burnIgnoresMitigation;
  delete c.bleedingUntil;
  delete c.bleedTickDamage;
  delete c.bleedTicksRemaining;
  delete c.blindedUntil;
  delete c.accuracyDebuffUntil;
  delete c.accuracyDebuffPct;
  delete c.toughnessReducedUntil;
  delete c.toughnessReductionPct;
  delete c.attackSpeedBuffUntil;
  delete c.attackSpeedBuffMultiplier;
}

/** Remove attackers whose target went into cover; they will be reassigned next tick */
export function removeTargetsForCombatantInCover(
  targets: TargetMap,
  combatantId: string,
): void {
  const toDelete: string[] = [];
  for (const [attackerId, targetId] of targets) {
    if (targetId === combatantId) toDelete.push(attackerId);
  }
  for (const id of toDelete) targets.delete(id);
}

const BLINDED_HIT_REDUCTION = 0.3;

export interface AttackResult {
  attackerId: string;
  targetId: string;
  hit: boolean;
  evaded: boolean;
  damage: number;
  /** Extra fire damage from proc (unmitigated) */
  procFireDamage?: number;
  /** Proc applied: blind or stun */
  procBlind?: boolean;
  procStun?: boolean;
}

/** Resolve a single attack. Returns result for UI feedback. */
export function resolveAttack(
  attacker: Combatant,
  target: Combatant,
  now: number = Date.now(),
): AttackResult {
  let baseCth = attacker.chanceToHit ?? 0.6;
  const blinded = attacker.blindedUntil != null && now < attacker.blindedUntil;
  if (blinded) baseCth *= 1 - BLINDED_HIT_REDUCTION;
  const accuracyDebuffed = attacker.accuracyDebuffUntil != null && now < attacker.accuracyDebuffUntil;
  if (accuracyDebuffed && attacker.accuracyDebuffPct != null) baseCth = Math.max(0.05, baseCth * (1 - attacker.accuracyDebuffPct));
  const effectiveCth = baseCth;

  const hitRoll = Math.random() < effectiveCth;
  if (!hitRoll) {
    return { attackerId: attacker.id, targetId: target.id, hit: false, evaded: false, damage: 0 };
  }
  let targetEvade = target.chanceToEvade ?? 0.05;
  const attackerEffect = attacker.weaponEffect
    ? WEAPON_EFFECTS[attacker.weaponEffect as keyof typeof WEAPON_EFFECTS]
    : undefined;
  const ignorePct = attackerEffect?.modifiers?.ignoreAvoidancePercent;
  if (ignorePct != null && ignorePct > 0) {
    targetEvade = targetEvade * (1 - ignorePct);
  }
  const evadeRoll = Math.random() < targetEvade;
  if (evadeRoll) {
    return { attackerId: attacker.id, targetId: target.id, hit: true, evaded: true, damage: 0 };
  }
  const minDmg = attacker.damageMin ?? 4;
  const maxDmg = attacker.damageMax ?? 6;
  const rawDmg = Math.ceil(minDmg + Math.random() * Math.max(0, maxDmg - minDmg));
  const mitigated = computeFinalDamage(rawDmg, target);
  let totalDamage = mitigated;
  target.hp = Math.max(0, Math.floor(target.hp - mitigated));

  let procFireDamage = 0;
  let procBlind = false;
  let procStun = false;

  const effectId = attacker.weaponEffect;
  const effect = effectId ? WEAPON_EFFECTS[effectId as keyof typeof WEAPON_EFFECTS] : undefined;
  const proc = effect?.proc;
  if (proc && target.hp > 0 && !target.downState) {
    const roll = Math.random();
    if (roll < proc.chance) {
      const procResult = applyWeaponProcEffect({ attacker, target, now, proc });
      const extraDamage = procResult.extraDamage ?? 0;
      if (extraDamage > 0) totalDamage += extraDamage;
      if (proc.type === "fire") procFireDamage = extraDamage;
      if (procResult.appliedFlags?.includes("blind")) procBlind = true;
      if (procResult.appliedFlags?.includes("stun")) procStun = true;
    }
  }

  if (target.hp <= 0) {
    target.downState = target.side === "player" && Math.random() < getIncapacitationChance(target) ? "incapacitated" : "kia";
    if (target.downState === "kia") target.killedBy = attacker.name;
    clearCombatantEffectsOnDeath(target);
  }

  return {
    attackerId: attacker.id,
    targetId: target.id,
    hit: true,
    evaded: false,
    damage: totalDamage,
    procFireDamage: procFireDamage > 0 ? procFireDamage : undefined,
    procBlind: procBlind || undefined,
    procStun: procStun || undefined,
  };
}

/** Compute next attack time for attacker (accounts for stim buff, panic 2×) */
export function getNextAttackAt(attacker: Combatant, now: number): number {
  const baseInterval = attacker.attackIntervalMs ?? 1500;
  let mult =
    attacker.attackSpeedBuffUntil != null &&
    now < attacker.attackSpeedBuffUntil &&
    attacker.attackSpeedBuffMultiplier != null
      ? attacker.attackSpeedBuffMultiplier
      : 1;
  if (attacker.panicUntil != null && now < attacker.panicUntil) mult *= 2; // Panic: 50% slower
  return now + baseInterval * mult;
}
