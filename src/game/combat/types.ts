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
  side: "player" | "enemy";
  downState?: "kia" | "incapacitated";
  soldierRef?: import("../entities/types.ts").Soldier;
  designation?: string;
  weaponIconUrl?: string;
  /** Timestamp (ms) when Take Cover ends */
  takeCoverUntil?: number;
  /** Take Cover used this combat (1x per soldier) */
  takeCoverUsed?: boolean;
  /** Timestamp (ms) when smoke effect ends */
  smokedUntil?: number;
  /** Timestamp (ms) when stun ends */
  stunUntil?: number;
  /** Timestamp (ms) when panic ends */
  panicUntil?: number;
  /** Timestamp (ms) when burning ends (DoT) */
  burningUntil?: number;
  /** Timestamp (ms) when blinded ends */
  blindedUntil?: number;
  /** Timestamp (ms) when suppressed ends */
  suppressedUntil?: number;
  /** Timestamp (ms) when attack speed buff ends (stim pack) */
  attackSpeedBuffUntil?: number;
  /** Attack interval multiplier (e.g. 2/3 = 50% faster) */
  attackSpeedBuffMultiplier?: number;
}

/** Map of attacker id -> target id */
export type TargetMap = Map<string, string>;
