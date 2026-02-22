/**
 * Combat loop: attack scheduling, target assignment, Take Cover, smoke effects.
 */
import type { Combatant, TargetMap } from "./types.ts";

export const TAKE_COVER_DURATION_MS = 3000;

export function isInCover(c: Combatant, now: number): boolean {
  return c.takeCoverUntil != null && now < c.takeCoverUntil;
}

export function isStunned(c: Combatant, now: number): boolean {
  return c.stunUntil != null && now < c.stunUntil;
}

/** Assign targets: enemies target players, players target enemies. Skip dead, in cover, stunned. */
export function assignTargets(
  players: Combatant[],
  enemies: Combatant[],
  targets: TargetMap,
  now: number,
): void {
  targets.clear();
  const alivePlayers = players.filter((p) => p.hp > 0 && !p.downState && !isInCover(p, now) && !isStunned(p, now));
  const aliveEnemies = enemies.filter((e) => e.hp > 0 && !e.downState && !isInCover(e, now) && !isStunned(e, now));

  for (const enemy of aliveEnemies) {
    if (alivePlayers.length === 0) continue;
    const idx = Math.floor(Math.random() * alivePlayers.length);
    targets.set(enemy.id, alivePlayers[idx].id);
  }

  for (const player of alivePlayers) {
    if (aliveEnemies.length === 0) continue;
    const idx = Math.floor(Math.random() * aliveEnemies.length);
    targets.set(player.id, aliveEnemies[idx].id);
  }
}

/** Clear expired effects on all combatants */
export function clearExpiredEffects(combatants: Combatant[], now: number): void {
  for (const c of combatants) {
    if (c.takeCoverUntil != null && now >= c.takeCoverUntil) delete c.takeCoverUntil;
    if (c.smokedUntil != null && now >= c.smokedUntil) delete c.smokedUntil;
    if (c.stunUntil != null && now >= c.stunUntil) delete c.stunUntil;
    if (c.panicUntil != null && now >= c.panicUntil) delete c.panicUntil;
    if (c.burningUntil != null && now >= c.burningUntil) delete c.burningUntil;
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
  const dmg = Math.floor(
    (attacker.damageMin ?? 4) +
      Math.random() * ((attacker.damageMax ?? 6) - (attacker.damageMin ?? 4) + 1),
  );
  let mit = target.mitigateDamage ?? 0;
  if (target.stunUntil != null && Date.now() < target.stunUntil) mit *= 0.5;
  const mitigated = Math.max(1, Math.floor(dmg * (1 - mit)));
  const newHp = Math.max(0, Math.floor(target.hp - mitigated));
  target.hp = newHp;
  if (newHp <= 0) {
    target.downState = target.side === "player" && Math.random() < 0.3 ? "incapacitated" : "kia";
  }
  return { attackerId: attacker.id, targetId: target.id, hit: true, evaded: false, damage: mitigated };
}

/** Compute next attack time for attacker (accounts for stim buff) */
export function getNextAttackAt(attacker: Combatant, now: number): number {
  const baseInterval = attacker.attackIntervalMs ?? 1500;
  const mult =
    attacker.attackSpeedBuffUntil != null &&
    now < attacker.attackSpeedBuffUntil &&
    attacker.attackSpeedBuffMultiplier != null
      ? attacker.attackSpeedBuffMultiplier
      : 1;
  return now + baseInterval * mult;
}
