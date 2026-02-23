/**
 * Combat loop: attack scheduling, target assignment, Take Cover, smoke effects.
 */
import { computeFinalDamage } from "./combat-damage.ts";
import type { Combatant, TargetMap } from "./types.ts";

export const TAKE_COVER_DURATION_MS = 3000;

export function isInCover(c: Combatant, now: number): boolean {
  return c.takeCoverUntil != null && now < c.takeCoverUntil;
}

export function isStunned(c: Combatant, now: number): boolean {
  return c.stunUntil != null && now < c.stunUntil;
}

function isValidTarget(c: Combatant | undefined, now: number): boolean {
  return c != null && c.hp > 0 && !c.downState && !isInCover(c, now) && !isStunned(c, now);
}

/** Assign targets: enemies target players, players target enemies. Preserves existing targets until dead/cover; only reassigns when needed. */
export function assignTargets(
  players: Combatant[],
  enemies: Combatant[],
  targets: TargetMap,
  now: number,
): void {
  const alivePlayers = players.filter((p) => isValidTarget(p, now));
  const aliveEnemies = enemies.filter((e) => isValidTarget(e, now));

  // Remove invalid assignments (target dead, in cover, stunned, or attacker no longer active)
  const toDelete: string[] = [];
  for (const [attackerId, targetId] of targets) {
    const attacker = [...players, ...enemies].find((c) => c.id === attackerId);
    const target = [...players, ...enemies].find((c) => c.id === targetId);
    if (!isValidTarget(attacker, now) || !isValidTarget(target, now)) toDelete.push(attackerId);
  }
  for (const id of toDelete) targets.delete(id);

  // Assign new targets only for those who need one (prefer targets with fewer attackers)
  const assignFor = (attackers: Combatant[], pool: Combatant[]) => {
    const targetCount = new Map<string, number>();
    for (const t of pool) targetCount.set(t.id, 0);
    for (const [_, tid] of targets) targetCount.set(tid, (targetCount.get(tid) ?? 0) + 1);

    for (const attacker of attackers) {
      if (targets.has(attacker.id)) continue;
      const current = targets.get(attacker.id);
      const t = pool.find((p) => p.id === current);
      if (t && isValidTarget(t, now)) continue;

      if (pool.length === 0) continue;
      const sorted = [...pool].sort((a, b) => (targetCount.get(a.id) ?? 0) - (targetCount.get(b.id) ?? 0));
      const minCount = targetCount.get(sorted[0].id) ?? 0;
      const ties = sorted.filter((p) => (targetCount.get(p.id) ?? 0) === minCount);
      const chosen = ties[Math.floor(Math.random() * ties.length)];
      targets.set(attacker.id, chosen.id);
      targetCount.set(chosen.id, (targetCount.get(chosen.id) ?? 0) + 1);
    }
  };

  assignFor(aliveEnemies, alivePlayers);
  assignFor(alivePlayers, aliveEnemies);
}

const BURN_TICK_INTERVAL_MS = 1000;

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
    const dmg = c.burnTickDamage ?? 0;
    if (dmg <= 0) continue;
    const damage = c.burnIgnoresMitigation ? dmg : computeFinalDamage(dmg, c);
    const newHp = Math.max(0, Math.floor(c.hp - damage));
    c.hp = newHp;
    events.push({ targetId: c.id, damage });
    if (newHp <= 0) {
      c.downState = c.side === "player" && Math.random() < 0.3 ? "incapacitated" : "kia";
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
    if (c.blindedUntil != null && now >= c.blindedUntil) delete c.blindedUntil;
    if (c.suppressedUntil != null && now >= c.suppressedUntil) delete c.suppressedUntil;
    if (c.attackSpeedBuffUntil != null && now >= c.attackSpeedBuffUntil) {
      delete c.attackSpeedBuffUntil;
      delete c.attackSpeedBuffMultiplier;
    }
  }
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

export interface AttackResult {
  attackerId: string;
  targetId: string;
  hit: boolean;
  evaded: boolean;
  damage: number;
}

/** Resolve a single attack. Returns result for UI feedback. */
export function resolveAttack(
  attacker: Combatant,
  target: Combatant,
): AttackResult {
  const hitRoll = Math.random() < (attacker.chanceToHit ?? 0.6);
  if (!hitRoll) {
    return { attackerId: attacker.id, targetId: target.id, hit: false, evaded: false, damage: 0 };
  }
  const evadeRoll = Math.random() < (target.chanceToEvade ?? 0.05);
  if (evadeRoll) {
    return { attackerId: attacker.id, targetId: target.id, hit: true, evaded: true, damage: 0 };
  }
  const rawDmg = Math.floor(
    (attacker.damageMin ?? 4) +
      Math.random() * ((attacker.damageMax ?? 6) - (attacker.damageMin ?? 4) + 1),
  );
  const mitigated = computeFinalDamage(rawDmg, target);
  const newHp = Math.max(0, Math.floor(target.hp - mitigated));
  target.hp = newHp;
  if (newHp <= 0) {
    target.downState = target.side === "player" && Math.random() < 0.3 ? "incapacitated" : "kia";
  }
  return { attackerId: attacker.id, targetId: target.id, hit: true, evaded: false, damage: mitigated };
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
