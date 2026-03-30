import type { MissionKind, MissionRarity } from "../../constants/missions.ts";
import { getActiveSlotsByLevel } from "../../constants/company-capacity.ts";
import { getStandardMissionEncounter } from "./mission-scenarios.ts";

export interface MissionRewardInput {
  difficulty: number;
  kind: MissionKind;
  rarity: MissionRarity;
  missionLevel?: number;
}

const KIND_REWARD_MODIFIERS: Record<MissionKind, number> = {
  defend_objective: 1.0,
  skirmish: 1.1,
  manhunt: 1.15,
};

const RARITY_REWARD_MODIFIERS: Record<MissionRarity, number> = {
  normal: 1,
  rare: 1.25,
  epic: 1.7,
};

const BASE_CREDITS_BY_DIFFICULTY: Record<number, number> = {
  1: 220,
  2: 360,
  3: 560,
  4: 820,
};

// Global economy lever for mission cash payouts.
const CREDIT_REWARD_GLOBAL_MULTIPLIER = 1.2;

const BASE_XP_BY_DIFFICULTY: Record<number, number> = {
  1: 36,
  2: 72,
  3: 114,
  4: 168,
};

function clampDifficulty(difficulty: number): 1 | 2 | 3 | 4 {
  if (difficulty <= 1) return 1;
  if (difficulty >= 4) return 4;
  return Math.round(difficulty) as 1 | 2 | 3 | 4;
}

function computeLevelCreditMultiplier(level?: number): number {
  const lvl = Math.max(1, Math.min(999, Math.floor(level ?? 1)));
  const pre20 = Math.min(lvl, 20) - 1;
  const post20 = Math.max(0, lvl - 20);
  return 1 + (pre20 * 0.04) + (post20 * 0.007);
}

export function computeMissionRewards(input: MissionRewardInput): {
  creditReward: number;
  xpReward: number;
} {
  const difficulty = clampDifficulty(input.difficulty);
  const baseCredits = BASE_CREDITS_BY_DIFFICULTY[difficulty];
  const baseXp = BASE_XP_BY_DIFFICULTY[difficulty];
  const kindMod = KIND_REWARD_MODIFIERS[input.kind] ?? 1;
  const rarityMod = RARITY_REWARD_MODIFIERS[input.rarity] ?? 1;
  const levelCreditMod = computeLevelCreditMultiplier(input.missionLevel);
  const totalMod = kindMod * rarityMod;
  return {
    creditReward: Math.round(
      baseCredits * totalMod * levelCreditMod * CREDIT_REWARD_GLOBAL_MULTIPLIER,
    ),
    xpReward: Math.round(baseXp * totalMod),
  };
}

export function computeMissionEnemyCount(
  difficulty: number,
  rarity: MissionRarity,
  companyLevel = 1,
  kind?: MissionKind,
): number {
  const d = clampDifficulty(difficulty);
  if (kind && rarity !== "epic") {
    return getStandardMissionEncounter(kind, d).initialEnemyCount;
  }
  const activeSlots = getActiveSlotsByLevel(companyLevel);
  const minEnemies = 4;
  const maxEnemiesByRoster = Math.max(6, activeSlots + 2);
  const epicBonus = rarity === "epic" ? 2 : 0;
  const target = d + 3 + epicBonus;
  return Math.max(minEnemies, Math.min(maxEnemiesByRoster, target));
}
