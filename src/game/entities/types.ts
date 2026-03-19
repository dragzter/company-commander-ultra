import type {
  Armor,
  BallisticWeapon,
  Item,
} from "../../constants/items/types.ts";

const SOLDIER_DESIGNATION = {
  rifleman: "rifleman",
  support: "support",
  medic: "medic",
} as const;

export type Designation = keyof typeof SOLDIER_DESIGNATION;

/**
 * Affected by the soldiers attributes
 */
export type CombatProfile = {
  chanceToHit: number; // increased by Awareness, Dexterity
  chanceToEvade: number; // increased by Awareness, dexterity
  mitigateDamage: number; // increased by Toughness
  suppression: number; // lowered by Morale, Toughness
};

export type SoldierTrait = Record<string, string[]>;
export type SoldierTraitProfile = Record<string, number>;
export type TraitDict = {
  name: string;
  stats: SoldierTraitProfile;
};

export type SoldierVeterancyStats = {
  veterancyXp: number;
  checkpointCursor: number;
  failedTraitRolls: number;
  grenadeThrows: number;
  grenadeHits: number;
  turnsBelow20Hp: number;
  missionsWithBelow20Hp: number;
  incapacitations: number;
};

/**
 * Some statuses represent a permanent alteration to a soldiers attributes, like a permanent injury
 */
export const SOLDIER_STATUS = {
  wounded: "wounded",
  incapacitated: "incapacitated",
  kia: "kia",
  active: "active",
  inactive: "inactive",
  hobbled: "hobbled",
  maimed: "maimed",
  retired: "retired",
  discharged: "discharged",
  awol: "awol",
} as const;

export type SoldierStatus = keyof typeof SOLDIER_STATUS;

export interface Soldier {
  id: string; // guid
  name: string;
  level: number; // increases all attributes according to a scale
  experience: number;
  /** Energy 0–100. Depleted by missions; rested soldiers recover. */
  energy?: number;
  status: SoldierStatus;
  avatar: string;

  armor?: Armor;
  weapon?: BallisticWeapon;

  // Attributes
  attributes: Attributes;
  designation: Designation;
  trait_profile: TraitDict;
  /** Permanent post-recruit traits earned from missions/incapacitations. */
  earnedTraitIds?: string[];
  /** Grenade accuracy bonus from earned traits (e.g., Grenadier). */
  grenadeHitBonusPct?: number;
  /** Company-wide flat stat bonuses applied to this soldier (derived). */
  companyFlatBonuses?: Partial<
    Pick<Attributes, "dexterity" | "morale" | "awareness" | "toughness">
  >;
  /** Company-wide hit chance bonus as decimal (e.g., 0.01 = +1%). */
  companyChanceToHitBonusPct?: number;
  /** Permanent soldier-specific flat bonuses earned from random events. */
  personalFlatBonuses?: Partial<
    Pick<Attributes, "dexterity" | "morale" | "awareness" | "toughness">
  >;
  /** Permanent soldier-specific hit chance bonus as decimal (e.g., 0.003 = +0.3%). */
  personalChanceToHitBonusPct?: number;
  /** Permanent soldier-specific mitigation bonus as decimal (e.g., 0.003 = +0.3%). */
  personalMitigationBonusPct?: number;
  /** Hidden veterancy progression and counters used for trait unlocks. */
  veterancy?: SoldierVeterancyStats;

  combatProfile: CombatProfile;

  // History
  /** Lifetime missions fully completed (excludes quit). */
  missionsCompleted?: number;
  /** Lifetime total enemy kills across all missions. */
  totalKills?: number;
  inventory: Item[];
  events: []; // a way to track history, wounded, killed, record battles.
}

export interface Attributes {
  hit_points: number; // Health bar
  dexterity: number; // Accuracy - chance to hit, initiative, evasion
  morale: number; // affects how easy it is to suppress, affect with psychic weapons, run away
  toughness: number; // Mitigation - flat reduction in damage
  awareness: number; // evasion
  level: number;
}

export type StandardLoadout = Record<
  keyof typeof SOLDIER_DESIGNATION,
  {
    weapon: BallisticWeapon;
    armor: Armor;
    inventory: Item[];
  }
>;

export { SOLDIER_DESIGNATION };
