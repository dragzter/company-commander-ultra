/**
 * Combat types: participants and combat state.
 */

/** A participant in combat (player soldier or enemy). */
export interface Combatant {
  id: string;
  name: string;
  avatar: string;
  hp: number;
  maxHp: number;
  chanceToHit: number;
  chanceToEvade: number;
  mitigateDamage: number;
  damageMin: number;
  damageMax: number;
  attackIntervalMs: number;
  toughness: number;
  level?: number;
  side: "player" | "enemy";
  downState?: "kia" | "incapacitated";
  /** Who or what killed this combatant (set when downState becomes "kia") */
  killedBy?: string;
  soldierRef?: import("../entities/types.ts").Soldier;
  designation?: string;
  weaponIconUrl?: string;
  /** Timestamp (ms) when Take Cover ends */
  takeCoverUntil?: number;
  /** Take Cover used this combat (1x per soldier) */
  takeCoverUsed?: boolean;
  /** Timestamp (ms) when Suppress cooldown ends */
  suppressCooldownUntil?: number;
  /** Timestamp (ms) when grenade cooldown ends (per-soldier, 5s after throwing) */
  grenadeCooldownUntil?: number;
  /** Timestamp (ms) when smoke effect ends */
  smokedUntil?: number;
  /** Timestamp (ms) when stun ends */
  stunUntil?: number;
  /** Timestamp (ms) when panic ends */
  panicUntil?: number;
  /** Timestamp (ms) when burning ends (DoT) */
  burningUntil?: number;
  /** Damage per burn tick (from incendiary etc.) */
  burnTickDamage?: number;
  /** Ticks of burn remaining */
  burnTicksRemaining?: number;
  /** True if burn bypasses armor (incendiary) */
  burnIgnoresMitigation?: boolean;
  /** Timestamp (ms) when blinded ends */
  blindedUntil?: number;
  /** Timestamp (ms) when suppressed ends */
  suppressedUntil?: number;
  /** Timestamp (ms) when attack speed buff ends (stim pack) */
  attackSpeedBuffUntil?: number;
  /** Attack interval multiplier (e.g. 2/3 = 50% faster) */
  attackSpeedBuffMultiplier?: number;
  /** Epic mission elite: no HP handicap, gold frame */
  isEpicElite?: boolean;
  /** Weapon effect for proc checks (fire, blind, stun) */
  weaponEffect?: string;
}

/** Map of attacker id -> target id */
export type TargetMap = Map<string, string>;
