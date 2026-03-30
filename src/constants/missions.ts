export const MISSION_KINDS = {
  defend_objective: "defend_objective",
  skirmish: "skirmish",
  manhunt: "manhunt",
} as const;

export type MissionKind = keyof typeof MISSION_KINDS;

export interface MissionKindDefinition {
  kind: MissionKind;
  name: string;
  description: string;
  flavorTemplates: string[];
  displayOrder: number;
  regularWeight?: number;
  epicWeight?: number;
}

export const ACTIVE_MISSION_KINDS: MissionKind[] = [
  MISSION_KINDS.defend_objective,
  MISSION_KINDS.skirmish, // Shown as "Skirmish"
  MISSION_KINDS.manhunt,
];

/**
 * Central mission registry.
 * Add a new mission type here and generation/template flows will pick it up.
 */
export const MISSION_KIND_DEFINITIONS: MissionKindDefinition[] = [
  {
    kind: MISSION_KINDS.defend_objective,
    name: "Defend Objective",
    description: "Hold the position against enemy assault.",
    flavorTemplates: [
      "Enemy forces are assaulting {LOC}. Hold the line at all costs.",
      "Defend {LOC} against the advancing hostiles.",
    ],
    displayOrder: 1,
    regularWeight: 1,
    epicWeight: 1,
  },
  {
    kind: MISSION_KINDS.skirmish,
    name: "Skirmish",
    description: "Standard deathmatch against hostile forces.",
    flavorTemplates: [
      "A high-value target is holed up at {LOC}. Eliminate them.",
      "Neutralize the target at {LOC}.",
    ],
    displayOrder: 2,
    regularWeight: 1,
    epicWeight: 1,
  },
  {
    kind: MISSION_KINDS.manhunt,
    name: "Manhunt",
    description: "Track and eliminate a priority target.",
    flavorTemplates: [
      "The target is fleeing through {LOC}. Don't let them escape.",
      "Track the priority target to {LOC} and eliminate them.",
    ],
    displayOrder: 3,
    regularWeight: 1,
    epicWeight: 1,
  },
];

export const MISSION_KIND_META: Record<
  MissionKind,
  { name: string; description: string }
> = MISSION_KIND_DEFINITIONS.reduce(
  (acc, def) => {
    acc[def.kind] = { name: def.name, description: def.description };
    return acc;
  },
  {} as Record<MissionKind, { name: string; description: string }>,
);

export const MISSION_KIND_ORDER: MissionKind[] = [...MISSION_KIND_DEFINITIONS]
  .filter((d) => ACTIVE_MISSION_KINDS.includes(d.kind))
  .sort((a, b) => a.displayOrder - b.displayOrder)
  .map((d) => d.kind);

export function getMissionKindDefinition(
  kind: MissionKind,
): MissionKindDefinition {
  const found = MISSION_KIND_DEFINITIONS.find((d) => d.kind === kind);
  if (found) return found;
  throw new Error(`Mission kind definition missing for '${kind}'`);
}

export function getMissionKindsForGeneration(
  mode: "regular" | "epic",
): MissionKind[] {
  const weightedKinds: MissionKind[] = [];
  for (const def of MISSION_KIND_DEFINITIONS.filter((d) =>
    ACTIVE_MISSION_KINDS.includes(d.kind),
  )) {
    const weight =
      mode === "epic" ? (def.epicWeight ?? 1) : (def.regularWeight ?? 1);
    const copies = Math.max(0, Math.floor(weight));
    for (let i = 0; i < copies; i++) weightedKinds.push(def.kind);
  }
  return weightedKinds.length > 0 ? weightedKinds : MISSION_KIND_ORDER;
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
  4: "Extreme",
};

export type MissionRarity = "normal" | "rare" | "epic";
export type MissionFactionId =
  | "desert_wolves"
  | "iron_corps"
  | "liberties_vanguard"
  | "scarlet_accord";

export const MISSION_FACTION_ORDER: MissionFactionId[] = [
  "desert_wolves",
  "iron_corps",
  "liberties_vanguard",
  "scarlet_accord",
];

export const MISSION_FACTION_META: Record<
  MissionFactionId,
  { name: string; emblem: string; accent: string }
> = {
  desert_wolves: {
    name: "Desert Wolves",
    emblem: "/images/desert_wolves.png",
    accent: "#d7b85c",
  },
  iron_corps: {
    name: "Iron Corps",
    emblem: "/images/iron_corps.png",
    accent: "#8ca8c8",
  },
  liberties_vanguard: {
    name: "Liberties Vanguard",
    emblem: "/images/liberties_vanguard.png",
    accent: "#78c98a",
  },
  scarlet_accord: {
    name: "Scarlet Accord",
    emblem: "/images/scarlett_accord.png",
    accent: "#d16f79",
  },
};

export type MissionEnvironmentId =
  | "city"
  | "forest"
  | "harbor"
  | "village"
  | "desert"
  | "structure";

export const MISSION_ENVIRONMENT_META: Record<
  MissionEnvironmentId,
  { name: string; titleCue: string; battleBackgrounds: string[] }
> = {
  city: {
    name: "City",
    titleCue: "Urban",
    battleBackgrounds: ["city_0.png", "city_1.png", "city_2.png"],
  },
  forest: {
    name: "Forest",
    titleCue: "Woodland",
    battleBackgrounds: ["forrest_0.png"],
  },
  harbor: {
    name: "Harbor",
    titleCue: "Harbor",
    battleBackgrounds: ["harbor_0.png"],
  },
  village: {
    name: "Village",
    titleCue: "Village",
    battleBackgrounds: ["village_0.png"],
  },
  desert: {
    name: "Desert",
    titleCue: "Desert",
    battleBackgrounds: ["desert_0.png"],
  },
  structure: {
    name: "Structure",
    titleCue: "Structure",
    battleBackgrounds: ["structure_0.png"],
  },
};

/** Battle backgrounds confirmed to exist in `public/images/battle_bg`. */
export const AVAILABLE_BATTLE_BACKGROUNDS = new Set<string>([
  "city_0.png",
  "city_1.png",
  "city_2.png",
  "city_03.png",
  "city_04.png",
  "city_05.png",
  "forrest_0.png",
  "harbor_0.png",
  "village_0.png",
  "desert_0.png",
]);

export function filterAvailableBattleBackgrounds(
  backgrounds: string[],
): string[] {
  return backgrounds.filter((bg) => AVAILABLE_BATTLE_BACKGROUNDS.has(bg));
}

export interface MissionEnemyRoleMix {
  rifleman: number;
  medic: number;
  support: number;
}

export interface MissionEncounterConfig {
  initialEnemyCount: number;
  totalEnemyCount: number;
  maxConcurrentEnemies: number;
  reinforceIntervalMs: number;
  reinforceSetupMs: number;
  rolesInitial: MissionEnemyRoleMix;
  rolesReinforcement: MissionEnemyRoleMix;
  medicHealsPerMedic: number;
  supportSuppressUses: number;
  eliteCount: number;
  grenadeThrowers: number;
}

export type ModeLootProfile = {
  rareGear: number;
  epicGear: number;
  supplyDrop: number;
  rareSupplyWeight: number;
  epicSupplyWeight: number;
};

/** Loot profile by difficulty for normal missions. Each successful mission can roll rare gear and one supply roll. */
export const NORMAL_MODE_LOOT_BY_DIFFICULTY: Record<
  1 | 2 | 3 | 4,
  ModeLootProfile
> = {
  1: {
    rareGear: 0.01,
    epicGear: 0,
    supplyDrop: 0.05,
    rareSupplyWeight: 0,
    epicSupplyWeight: 0,
  },
  2: {
    rareGear: 0.02,
    epicGear: 0,
    supplyDrop: 0.09,
    rareSupplyWeight: 0.12,
    epicSupplyWeight: 0,
  },
  3: {
    rareGear: 0.04,
    epicGear: 0,
    supplyDrop: 0.14,
    rareSupplyWeight: 0.2,
    epicSupplyWeight: 0.02,
  },
  4: {
    rareGear: 0.07,
    epicGear: 0,
    supplyDrop: 0.2,
    rareSupplyWeight: 0.28,
    epicSupplyWeight: 0.04,
  },
};

/** Loot profile by difficulty for epic missions. Epic missions also grant one guaranteed reward item. */
export const EPIC_MODE_LOOT_BY_DIFFICULTY: Record<
  1 | 2 | 3 | 4,
  ModeLootProfile
> = {
  1: {
    rareGear: 0.08,
    epicGear: 0.015,
    supplyDrop: 0.2,
    rareSupplyWeight: 0.2,
    epicSupplyWeight: 0.03,
  },
  2: {
    rareGear: 0.1,
    epicGear: 0.025,
    supplyDrop: 0.26,
    rareSupplyWeight: 0.24,
    epicSupplyWeight: 0.04,
  },
  3: {
    rareGear: 0.12,
    epicGear: 0.035,
    supplyDrop: 0.32,
    rareSupplyWeight: 0.28,
    epicSupplyWeight: 0.05,
  },
  4: {
    rareGear: 0.15,
    epicGear: 0.05,
    supplyDrop: 0.38,
    rareSupplyWeight: 0.32,
    epicSupplyWeight: 0.06,
  },
};

export type Mission = {
  id: string;
  kind: MissionKind;
  factionId?: MissionFactionId;
  environmentId?: MissionEnvironmentId;
  battleBackground?: string;
  name: string;
  difficulty: number;
  enemyCount: number;
  creditReward: number;
  /** XP awarded on victory. Defaults to 20 * difficulty if absent. */
  xpReward?: number;
  flavorText?: string;
  isEpic?: boolean;
  /** Dev-only sandbox mission. Excluded from normal progression/economy flows. */
  isDevTest?: boolean;
  /** Optional forced combat setup values for dev/testing flows. */
  forcedPlayerLevel?: number;
  forcedEnemyLevel?: number;
  forcedGearLevel?: number;
  forcedSquadSize?: number;
  /** Career ladder mission (separate progression/state from mission board). */
  isCareer?: boolean;
  /** Career ladder level (enemy level and reward level source). */
  careerLevel?: number;
  /** Every 10th career level: boss encounter variant. */
  isCareerBoss?: boolean;
  rarity?: MissionRarity;
  encounter?: MissionEncounterConfig;
  rewardItems?: string[];
};
