import { computeFinalDamage } from "../../game/combat/combat-damage.ts";
import type { Combatant } from "../../game/combat/types.ts";
import type { Item } from "../../constants/items/types.ts";

const SPLASH_DAMAGE_PCT = 0.5;
const SPLASH_EFFECT_PCT = 0.5;
const MAX_TARGETS = 3;
const TURN_MS = 1000;
/** Morale: 1% duration reduction per 10 morale (panic/suppression). Reduction rounded up to 1 decimal. Capped at 80%. */
const MORALE_PER_PCT_REDUCTION = 10;
const MORALE_REDUCTION_CAP_PCT = 80;
const MIN_EFFECT_DURATION_MS = 500;
const GRENADE_HIT_CHANCE = 0.9;
const GRENADE_EVADE_CHANCE = 0.05;
const INCAPACITATED_CHANCE = 0.3;
const SMOKE_DURATION_MS = 5000;
const SMOKE_PRIMARY_ACCURACY_DEBUFF = 0.4;
const SMOKE_ADJACENT_ACCURACY_DEBUFF = 0.1;
const SMOKE_EVASION_BONUS = 0.05;

function isSmokeGrenade(grenade: Item): boolean {
  const tags = grenade.tags as string[] | undefined;
  return (tags?.includes("smoke")) || grenade.id === "mk18_smoke";
}

function isIncendiaryGrenade(grenade: Item): boolean {
  const tags = grenade.tags as string[] | undefined;
  return grenade.id === "incendiary_grenade" || (tags?.includes("thermal") && (grenade.effect?.result === "burn"));
}

function isThrowingKnife(grenade: Item): boolean {
  return grenade.id === "tk21_throwing_knife";
}

const THROWING_KNIFE_DAMAGE = 20;

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

  const isKnife = isThrowingKnife(grenade);
  const hitChance = isKnife ? (thrower.chanceToHit ?? 0.6) : GRENADE_HIT_CHANCE;
  const evadeChance = isKnife ? (primaryTarget.chanceToEvade ?? 0.05) : GRENADE_EVADE_CHANCE;

  const rollHit = Math.random() < hitChance;
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
      const rollEvadeSplash = Math.random() < GRENADE_EVADE_CHANCE;
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

  /* Throwing knife: single-target 20 dmg, mitigated, no splash. */
  if (isThrowingKnife(grenade)) {
    const damageDealt = computeFinalDamage(THROWING_KNIFE_DAMAGE, primaryTarget);
    const newHp = Math.max(0, Math.floor(primaryTarget.hp - damageDealt));
    primaryTarget.hp = newHp;
    const targetIncap = applyDownState(primaryTarget, newHp);
    return {
      throwerId: thrower.id,
      primaryTargetId: primaryTarget.id,
      grenadeDamage: THROWING_KNIFE_DAMAGE,
      primary: {
        targetId: primaryTarget.id,
        hit: true,
        evaded: false,
        damageDealt,
        targetNewHp: newHp,
        targetDown: newHp === 0,
        targetIncapacitated: targetIncap,
      },
      splash: [],
    };
  }

  /* Incendiary: DoT only, unmitigated. Primary 4×8 dmg, adjacent 2×4 dmg. Last tick at t=3s (1s before expiry). */
  if (isIncendiaryGrenade(grenade)) {
    primaryTarget.burnTickDamage = 8;
    primaryTarget.burnTicksRemaining = 4;
    primaryTarget.burnIgnoresMitigation = true;
    primaryTarget.burningUntil = now + 4 * TURN_MS;

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
    const adjacent = primaryIdx >= 0
      ? allEnemies
          .map((e, i) => ({ enemy: e, i }))
          .filter(({ enemy, i }) => enemy.id !== primaryTarget.id && enemy.hp > 0 && !enemy.downState && Math.abs(i - primaryIdx) === 1)
          .slice(0, MAX_TARGETS - 1)
      : [];
    for (const { enemy } of adjacent) {
      const rollEvadeSplash = Math.random() < GRENADE_EVADE_CHANCE;
      if (rollEvadeSplash) {
        splash.push({ targetId: enemy.id, hit: true, evaded: true, damageDealt: 0, targetNewHp: enemy.hp, targetDown: false, targetIncapacitated: null });
        continue;
      }
      enemy.burnTickDamage = 4;
      enemy.burnTicksRemaining = 2;
      enemy.burnIgnoresMitigation = true;
      enemy.burningUntil = now + 2 * TURN_MS;
      splash.push({ targetId: enemy.id, hit: true, evaded: false, damageDealt: 0, targetNewHp: enemy.hp, targetDown: false, targetIncapacitated: null });
    }
    return { throwerId: thrower.id, primaryTargetId: primaryTarget.id, grenadeDamage: 0, primary, splash };
  }

  const damageDealt = computeFinalDamage(baseDamage, primaryTarget);
  const newHp = Math.max(0, Math.floor(primaryTarget.hp - damageDealt));
  primaryTarget.hp = newHp;
  const targetIncap = applyDownState(primaryTarget, newHp);

  const eff = grenade.effect;
  if (eff?.result && eff.duration) {
    let durMs = eff.duration * TURN_MS;
    if (eff.result === "panic" || eff.result === "suppression") {
      const morale = (primaryTarget as Combatant & { soldierRef?: { attributes?: { morale?: number } } }).soldierRef?.attributes?.morale ?? 50;
      const reductionPct = morale / MORALE_PER_PCT_REDUCTION;
      const reduction = Math.min(MORALE_REDUCTION_CAP_PCT / 100, Math.ceil(reductionPct * 10) / 10 / 100);
      durMs = Math.max(MIN_EFFECT_DURATION_MS, Math.round(durMs * (1 - reduction) / 100) * 100);
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
    const rollEvadeSplash = Math.random() < GRENADE_EVADE_CHANCE;
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
    const splashDmg = computeFinalDamage(splashBase, enemy);
    const splashNewHp = Math.max(0, Math.floor(enemy.hp - splashDmg));
    enemy.hp = splashNewHp;
    const splashIncap = applyDownState(enemy, splashNewHp);
    const eff = grenade.effect;
    if (eff?.result && eff.duration) {
      let adjDurMs = Math.floor(eff.duration * TURN_MS * SPLASH_EFFECT_PCT);
      if (eff.result === "panic" || eff.result === "suppression") {
        const morale = (enemy as Combatant & { soldierRef?: { attributes?: { morale?: number } } }).soldierRef?.attributes?.morale ?? 50;
        const reductionPct = morale / MORALE_PER_PCT_REDUCTION;
        const reduction = Math.min(MORALE_REDUCTION_CAP_PCT / 100, Math.ceil(reductionPct * 10) / 10 / 100);
        adjDurMs = Math.max(MIN_EFFECT_DURATION_MS, Math.round(adjDurMs * (1 - reduction) / 100) * 100);
      } else {
        adjDurMs = Math.max(MIN_EFFECT_DURATION_MS, adjDurMs);
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
