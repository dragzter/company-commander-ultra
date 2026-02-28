export const MISSION_KINDS = {
  defend_objective: "defend_objective",
  ambush: "ambush",
  attack_objective: "attack_objective",
  seek_and_destroy: "seek_and_destroy",
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
  MISSION_KINDS.seek_and_destroy, // Shown as "Skirmish"
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
    kind: MISSION_KINDS.ambush,
    name: "Ambush",
    description: "Set up a surprise attack on enemy forces.",
    flavorTemplates: [
      "Set up an ambush at {LOC}. The enemy won't see it coming.",
      "Lie in wait at {LOC}. Strike when they least expect it.",
    ],
    displayOrder: 2,
    regularWeight: 0,
    epicWeight: 0,
  },
  {
    kind: MISSION_KINDS.attack_objective,
    name: "Attack Objective",
    description: "Assault and neutralize enemy positions.",
    flavorTemplates: [
      "Assault {LOC} and neutralize all resistance.",
      "Take {LOC} by force. No quarter.",
    ],
    displayOrder: 3,
    regularWeight: 0,
    epicWeight: 0,
  },
  {
    kind: MISSION_KINDS.seek_and_destroy,
    name: "Skirmish",
    description: "Standard deathmatch against hostile forces.",
    flavorTemplates: [
      "A high-value target is holed up at {LOC}. Eliminate them.",
      "Neutralize the target at {LOC}.",
    ],
    displayOrder: 4,
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
    displayOrder: 5,
    regularWeight: 1,
    epicWeight: 1,
  },
];

export const MISSION_KIND_META: Record<MissionKind, { name: string; description: string }> =
  MISSION_KIND_DEFINITIONS.reduce(
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

export function getMissionKindDefinition(kind: MissionKind): MissionKindDefinition {
  const found = MISSION_KIND_DEFINITIONS.find((d) => d.kind === kind);
  if (found) return found;
  throw new Error(`Mission kind definition missing for '${kind}'`);
}

export function getMissionKindsForGeneration(mode: "regular" | "epic"): MissionKind[] {
  const weightedKinds: MissionKind[] = [];
  for (const def of MISSION_KIND_DEFINITIONS.filter((d) => ACTIVE_MISSION_KINDS.includes(d.kind))) {
    const weight = mode === "epic" ? (def.epicWeight ?? 1) : (def.regularWeight ?? 1);
    const copies = Math.max(0, Math.floor(weight));
    for (let i = 0; i < copies; i++) weightedKinds.push(def.kind);
  }
  return weightedKinds.length > 0 ? weightedKinds : MISSION_KIND_ORDER;
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Trivial",
  2: "Easy",
  3: "Medium",
  4: "Hard",
  5: "Extreme",
};

export type MissionRarity = "normal" | "rare" | "epic";

/** Any successful mission: chance to drop an epic weapon or armor (level-appropriate). */
export const LOOT_EPIC_CHANCE = 0.005;
/** Any successful mission: chance to drop a rare weapon or armor (level-appropriate). */
export const LOOT_RARE_CHANCE = 0.01;
/** Any successful mission: chance to drop a common supply item (throwable/medical). */
export const LOOT_COMMON_SUPPLY_CHANCE = 0.03;

export type Mission = {
  id: string;
  kind: MissionKind;
  name: string;
  difficulty: number;
  enemyCount: number;
  creditReward: number;
  /** XP awarded on victory. Defaults to 20 * difficulty if absent. */
  xpReward?: number;
  flavorText?: string;
  isEpic?: boolean;
  rarity?: MissionRarity;
  rewardItems?: string[];
};
