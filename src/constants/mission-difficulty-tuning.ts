import type { MissionEnemyRoleMix, MissionKind } from "./missions.ts";

export type MissionModeTuning = "normal" | "elite";

export type MissionGrenadePlan =
  | { type: "team_total"; totalThrows: number; grenadeIds?: string[] }
  | { type: "per_rifleman"; throwsPerRifleman: number; grenadeIds?: string[] };

export interface MissionDifficultyBehavior {
  grenadePlan: MissionGrenadePlan;
  suppressUsesPerSupport: number;
  healsPerMedic: number;
}

export interface MissionCompositionTuning {
  initialEnemyCount: number;
  totalEnemyCount: number;
  reinforceIntervalMs: number;
  reinforceSetupMs: number;
  rolesInitial: MissionEnemyRoleMix;
  rolesReinforcement: MissionEnemyRoleMix;
  normalEliteCount: number;
}

function mix(
  rifleman: number,
  medic: number,
  support: number,
): MissionEnemyRoleMix {
  return { rifleman, medic, support };
}

export const MISSION_COMPOSITION_BY_KIND_DIFFICULTY: Record<
  MissionKind,
  Record<1 | 2 | 3 | 4, MissionCompositionTuning>
> = {
  defend_objective: {
    1: {
      initialEnemyCount: 4,
      totalEnemyCount: 8,
      reinforceIntervalMs: 30_000,
      reinforceSetupMs: 2000,
      rolesInitial: mix(4, 0, 0),
      rolesReinforcement: mix(4, 0, 0),
      normalEliteCount: 0,
    },
    2: {
      initialEnemyCount: 6,
      totalEnemyCount: 12,
      reinforceIntervalMs: 30_000,
      reinforceSetupMs: 2000,
      rolesInitial: mix(5, 1, 0),
      rolesReinforcement: mix(6, 0, 0),
      normalEliteCount: 0,
    },
    3: {
      initialEnemyCount: 8,
      totalEnemyCount: 16,
      reinforceIntervalMs: 30_000,
      reinforceSetupMs: 2000,
      rolesInitial: mix(6, 1, 1),
      rolesReinforcement: mix(7, 0, 1),
      normalEliteCount: 0,
    },
    4: {
      initialEnemyCount: 8,
      totalEnemyCount: 20,
      reinforceIntervalMs: 30_000,
      reinforceSetupMs: 2000,
      rolesInitial: mix(6, 1, 1),
      rolesReinforcement: mix(10, 1, 1),
      normalEliteCount: 0,
    },
  },
  skirmish: {
    1: {
      initialEnemyCount: 4,
      totalEnemyCount: 4,
      reinforceIntervalMs: 0,
      reinforceSetupMs: 2000,
      rolesInitial: mix(3, 1, 0),
      rolesReinforcement: mix(0, 0, 0),
      normalEliteCount: 0,
    },
    2: {
      initialEnemyCount: 6,
      totalEnemyCount: 6,
      reinforceIntervalMs: 0,
      reinforceSetupMs: 2000,
      rolesInitial: mix(4, 1, 1),
      rolesReinforcement: mix(0, 0, 0),
      normalEliteCount: 0,
    },
    3: {
      initialEnemyCount: 8,
      totalEnemyCount: 10,
      reinforceIntervalMs: 0,
      reinforceSetupMs: 2000,
      rolesInitial: mix(6, 1, 1),
      rolesReinforcement: mix(2, 0, 0),
      normalEliteCount: 0,
    },
    4: {
      initialEnemyCount: 8,
      totalEnemyCount: 14,
      reinforceIntervalMs: 0,
      reinforceSetupMs: 2000,
      rolesInitial: mix(5, 1, 2),
      rolesReinforcement: mix(6, 0, 0),
      normalEliteCount: 0,
    },
  },
  manhunt: {
    1: {
      initialEnemyCount: 4,
      totalEnemyCount: 4,
      reinforceIntervalMs: 0,
      reinforceSetupMs: 2000,
      rolesInitial: mix(4, 0, 0),
      rolesReinforcement: mix(0, 0, 0),
      normalEliteCount: 1,
    },
    2: {
      initialEnemyCount: 6,
      totalEnemyCount: 6,
      reinforceIntervalMs: 0,
      reinforceSetupMs: 2000,
      rolesInitial: mix(4, 1, 1),
      rolesReinforcement: mix(0, 0, 0),
      normalEliteCount: 1,
    },
    3: {
      initialEnemyCount: 8,
      totalEnemyCount: 8,
      reinforceIntervalMs: 0,
      reinforceSetupMs: 2000,
      rolesInitial: mix(6, 1, 1),
      rolesReinforcement: mix(0, 0, 0),
      normalEliteCount: 2,
    },
    4: {
      initialEnemyCount: 8,
      totalEnemyCount: 10,
      reinforceIntervalMs: 0,
      reinforceSetupMs: 2000,
      rolesInitial: mix(5, 1, 2),
      rolesReinforcement: mix(2, 0, 0),
      normalEliteCount: 2,
    },
  },
};

const DEFAULT_GRENADE_IDS = [
  "m3_frag_grenade",
  "m84_flashbang",
  "incendiary_grenade",
] as const;

const ELITE_GRENADE_IDS = [
  "m3_frag_grenade",
  "m84_flashbang",
  "incendiary_grenade",
] as const;

export const MISSION_BEHAVIOR_BY_MODE_DIFFICULTY: Record<
  MissionModeTuning,
  Record<1 | 2 | 3 | 4, MissionDifficultyBehavior>
> = {
  normal: {
    1: {
      grenadePlan: { type: "team_total", totalThrows: 1, grenadeIds: [...DEFAULT_GRENADE_IDS] },
      suppressUsesPerSupport: 1,
      healsPerMedic: 1,
    },
    2: {
      grenadePlan: { type: "team_total", totalThrows: 2, grenadeIds: [...DEFAULT_GRENADE_IDS] },
      suppressUsesPerSupport: 1,
      healsPerMedic: 3,
    },
    3: {
      grenadePlan: { type: "per_rifleman", throwsPerRifleman: 1, grenadeIds: [...DEFAULT_GRENADE_IDS] },
      suppressUsesPerSupport: 1,
      healsPerMedic: 4,
    },
    4: {
      grenadePlan: { type: "per_rifleman", throwsPerRifleman: 1, grenadeIds: [...DEFAULT_GRENADE_IDS] },
      suppressUsesPerSupport: 1,
      healsPerMedic: 5,
    },
  },
  elite: {
    1: {
      grenadePlan: { type: "per_rifleman", throwsPerRifleman: 2, grenadeIds: [...DEFAULT_GRENADE_IDS] },
      suppressUsesPerSupport: 1,
      healsPerMedic: 3,
    },
    2: {
      grenadePlan: { type: "per_rifleman", throwsPerRifleman: 2, grenadeIds: [...ELITE_GRENADE_IDS] },
      suppressUsesPerSupport: 1,
      healsPerMedic: 5,
    },
    3: {
      grenadePlan: { type: "per_rifleman", throwsPerRifleman: 2, grenadeIds: [...ELITE_GRENADE_IDS] },
      suppressUsesPerSupport: 1,
      healsPerMedic: 5,
    },
    4: {
      grenadePlan: { type: "per_rifleman", throwsPerRifleman: 2, grenadeIds: [...ELITE_GRENADE_IDS] },
      suppressUsesPerSupport: 1,
      healsPerMedic: 5,
    },
  },
};

export const ELITE_SUPER_COUNT_BY_DIFFICULTY: Record<1 | 2 | 3 | 4, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 3,
};

export const ELITE_LEVEL_BONUS_MIN = 1;
export const ELITE_LEVEL_BONUS_MAX = 2;
export const ELITE_NON_ELITE_HP_BONUS_PCT = 0.05;
export const ELITE_STAT_BONUS_PCT = 0.2;
export const ELITE_ABILITY_USES = {
  grenades: 3,
  suppress: 3,
  heals: 6,
} as const;

function clampDifficulty(difficulty: number): 1 | 2 | 3 | 4 {
  if (difficulty <= 1) return 1;
  if (difficulty >= 4) return 4;
  return Math.round(difficulty) as 1 | 2 | 3 | 4;
}

export function getMissionBehaviorForDifficulty(
  mode: MissionModeTuning,
  difficulty: number,
): MissionDifficultyBehavior {
  const d = clampDifficulty(difficulty);
  return MISSION_BEHAVIOR_BY_MODE_DIFFICULTY[mode][d];
}

export function getEliteSuperCountForDifficulty(difficulty: number): number {
  return ELITE_SUPER_COUNT_BY_DIFFICULTY[clampDifficulty(difficulty)];
}

export function getMissionCompositionForDifficulty(
  kind: MissionKind,
  difficulty: number,
): MissionCompositionTuning {
  const d = clampDifficulty(difficulty);
  return MISSION_COMPOSITION_BY_KIND_DIFFICULTY[kind][d];
}
