import type { Combatant } from "../../game/combat/types.ts";
import type { Item } from "../../constants/items/types.ts";

const SPLASH_DAMAGE_PCT = 0.5;
const SPLASH_EFFECT_PCT = 0.5;
const MAX_TARGETS = 3;
const TURN_MS = 1000;
const GRENADE_EVADE_FACTOR = 0.4;
const INCAPACITATED_CHANCE = 0.3;
const SMOKE_DURATION_MS = 5000;
const SMOKE_PRIMARY_ACCURACY_DEBUFF = 0.4;
const SMOKE_ADJACENT_ACCURACY_DEBUFF = 0.1;
const SMOKE_EVASION_BONUS = 0.05;

function isSmokeGrenade(grenade: Item): boolean {
  const tags = grenade.tags as string[] | undefined;
  return (tags?.includes("smoke")) || grenade.id === "mk18_smoke";
}

export interface GrenadeHitResult {
  targetId: string;
  hit: boolean;
  evaded: boolean;
  damageDealt: number;
  targetNewHp: number;
  targetDown: boolean;
  targetIncapacitated: boolean | null;
}

export interface GrenadeThrowResult {
  throwerId: string;
  primaryTargetId: string;
  grenadeDamage: number;
  primary: GrenadeHitResult;
  splash: GrenadeHitResult[];
}

function applyDownState(c: Combatant, newHp: number): boolean | null {
  if (newHp > 0) return null;
  if (c.side === "player") {
    const rollIncap = Math.random() < INCAPACITATED_CHANCE;
    c.downState = rollIncap ? "incapacitated" : "kia";
    return rollIncap;
  }
  c.downState = "kia";
  return null;
}

/**
 * Resolve grenade throw: hit roll → primary evade → damage. If primary hit, splash (50%) to others.
 */
export function resolveGrenadeThrow(
  thrower: Combatant,
  primaryTarget: Combatant,
  grenade: Item,
  allEnemies: Combatant[],
): GrenadeThrowResult {
  const baseDamage = grenade.damage ?? 0;
  const splashBase = Math.max(1, Math.floor(baseDamage * SPLASH_DAMAGE_PCT));

  const rollHit = Math.random() < (thrower.chanceToHit ?? 0.6);
  if (!rollHit) {
    return {
      throwerId: thrower.id,
      primaryTargetId: primaryTarget.id,
      grenadeDamage: baseDamage,
      primary: {
        targetId: primaryTarget.id,
        hit: false,
        evaded: false,
        damageDealt: 0,
        targetNewHp: primaryTarget.hp,
        targetDown: false,
        targetIncapacitated: null,
      },
      splash: [],
    };
  }

  const evadeChance = (primaryTarget.chanceToEvade ?? 0) * GRENADE_EVADE_FACTOR;
  const rollEvade = Math.random() < evadeChance;
  if (rollEvade) {
    return {
      throwerId: thrower.id,
      primaryTargetId: primaryTarget.id,
      grenadeDamage: baseDamage,
      primary: {
        targetId: primaryTarget.id,
        hit: true,
        evaded: true,
        damageDealt: 0,
        targetNewHp: primaryTarget.hp,
        targetDown: false,
        targetIncapacitated: null,
      },
      splash: [],
    };
  }

  const now = Date.now();

  if (isSmokeGrenade(grenade)) {
    primaryTarget.smokedUntil = now + SMOKE_DURATION_MS;
    primaryTarget.chanceToHit = Math.max(0.05, (primaryTarget.chanceToHit ?? 0.6) * (1 - SMOKE_PRIMARY_ACCURACY_DEBUFF));
    primaryTarget.chanceToEvade = Math.min(1, (primaryTarget.chanceToEvade ?? 0) + SMOKE_EVASION_BONUS);

    const primary: GrenadeHitResult = {
      targetId: primaryTarget.id,
      hit: true,
      evaded: false,
      damageDealt: 0,
      targetNewHp: primaryTarget.hp,
      targetDown: false,
      targetIncapacitated: null,
    };

    const primaryIdx = allEnemies.findIndex((e) => e.id === primaryTarget.id);
    const splash: GrenadeHitResult[] = [];
    for (let i = 0; i < allEnemies.length && splash.length < MAX_TARGETS - 1; i++) {
      const enemy = allEnemies[i];
      if (enemy.id === primaryTarget.id || enemy.hp <= 0 || enemy.downState) continue;
      const isAdjacent = primaryIdx >= 0 && Math.abs(i - primaryIdx) === 1;
      if (!isAdjacent) continue;
      const evadeSplash = (enemy.chanceToEvade ?? 0) * GRENADE_EVADE_FACTOR;
      const rollEvadeSplash = Math.random() < evadeSplash;
      if (rollEvadeSplash) {
        splash.push({ targetId: enemy.id, hit: true, evaded: true, damageDealt: 0, targetNewHp: enemy.hp, targetDown: false, targetIncapacitated: null });
        continue;
      }
      enemy.smokedUntil = now + SMOKE_DURATION_MS;
      enemy.chanceToHit = Math.max(0.05, (enemy.chanceToHit ?? 0.6) * (1 - SMOKE_ADJACENT_ACCURACY_DEBUFF));
      enemy.chanceToEvade = Math.min(1, (enemy.chanceToEvade ?? 0) + SMOKE_EVASION_BONUS);
      splash.push({ targetId: enemy.id, hit: true, evaded: false, damageDealt: 0, targetNewHp: enemy.hp, targetDown: false, targetIncapacitated: null });
    }

    return { throwerId: thrower.id, primaryTargetId: primaryTarget.id, grenadeDamage: 0, primary, splash };
  }

  const mitigated = baseDamage * (1 - (primaryTarget.mitigateDamage ?? 0));
  const damageDealt = Math.max(1, Math.floor(mitigated));
  const newHp = Math.max(0, Math.floor(primaryTarget.hp - damageDealt));
  primaryTarget.hp = newHp;
  const targetIncap = applyDownState(primaryTarget, newHp);

  const eff = grenade.effect;
  if (eff?.result && eff.duration) {
    let durMs = eff.duration * TURN_MS;
    if (eff.result === "panic" || eff.result === "suppression") {
      const morale = (primaryTarget as Combatant & { soldierRef?: { attributes?: { morale?: number } } }).soldierRef?.attributes?.morale ?? 50;
      const reduction = Math.min(50, morale / 2) / 100;
      durMs = Math.max(500, Math.floor(durMs * (1 - reduction)));
    }
    if (eff.result === "stun") primaryTarget.stunUntil = now + durMs;
    else if (eff.result === "panic") primaryTarget.panicUntil = now + durMs;
    else if (eff.result === "burn") primaryTarget.burningUntil = now + durMs;
  }

  const primary: GrenadeHitResult = {
    targetId: primaryTarget.id,
    hit: true,
    evaded: false,
    damageDealt,
    targetNewHp: newHp,
    targetDown: newHp === 0,
    targetIncapacitated: targetIncap,
  };

  const splash: GrenadeHitResult[] = [];
  const primaryIdx = allEnemies.findIndex((e) => e.id === primaryTarget.id);
  const adjacent = primaryIdx >= 0
    ? allEnemies
        .map((e, i) => ({ enemy: e, i }))
        .filter(({ enemy, i }) => enemy.id !== primaryTarget.id && enemy.hp > 0 && !enemy.downState && Math.abs(i - primaryIdx) === 1)
        .slice(0, MAX_TARGETS - 1)
    : [];
  for (const { enemy } of adjacent) {
    const evadeSplash = (enemy.chanceToEvade ?? 0) * GRENADE_EVADE_FACTOR;
    const rollEvadeSplash = Math.random() < evadeSplash;
    if (rollEvadeSplash) {
      splash.push({
        targetId: enemy.id,
        hit: true,
        evaded: true,
        damageDealt: 0,
        targetNewHp: enemy.hp,
        targetDown: false,
        targetIncapacitated: null,
      });
      continue;
    }
    const mitigatedSplash = splashBase * (1 - (enemy.mitigateDamage ?? 0));
    const splashDmg = Math.max(1, Math.floor(mitigatedSplash));
    const splashNewHp = Math.max(0, Math.floor(enemy.hp - splashDmg));
    enemy.hp = splashNewHp;
    const splashIncap = applyDownState(enemy, splashNewHp);
    const eff = grenade.effect;
    if (eff?.result && eff.duration) {
      let adjDurMs = Math.floor(eff.duration * TURN_MS * SPLASH_EFFECT_PCT);
      if (eff.result === "panic" || eff.result === "suppression") {
        const morale = (enemy as Combatant & { soldierRef?: { attributes?: { morale?: number } } }).soldierRef?.attributes?.morale ?? 50;
        const reduction = Math.min(50, morale / 2) / 100;
        adjDurMs = Math.max(500, Math.floor(adjDurMs * (1 - reduction)));
      } else {
        adjDurMs = Math.max(500, adjDurMs);
      }
      if (eff.result === "stun") enemy.stunUntil = now + adjDurMs;
      else if (eff.result === "panic") enemy.panicUntil = now + adjDurMs;
      else if (eff.result === "burn") enemy.burningUntil = now + adjDurMs;
    }
    splash.push({
      targetId: enemy.id,
      hit: true,
      evaded: false,
      damageDealt: splashDmg,
      targetNewHp: splashNewHp,
      targetDown: splashNewHp === 0,
      targetIncapacitated: splashIncap,
    });
  }

  return {
    throwerId: thrower.id,
    primaryTargetId: primaryTarget.id,
    grenadeDamage: baseDamage,
    primary,
    splash,
  };
}
