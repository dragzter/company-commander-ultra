import type { MissionKind, MissionRarity } from "../../constants/missions.ts";
import { getActiveSlotsByLevel } from "../../constants/company-capacity.ts";
import { getStandardMissionEncounter } from "./mission-scenarios.ts";

export interface MissionRewardInput {
  difficulty: number;
  kind: MissionKind;
  rarity: MissionRarity;
}

const KIND_REWARD_MODIFIERS: Record<MissionKind, number> = {
  defend_objective: 1.0,
  ambush: 1.05,
  attack_objective: 1.1,
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

const BASE_XP_BY_DIFFICULTY: Record<number, number> = {
  1: 30,
  2: 60,
  3: 95,
  4: 140,
};

function clampDifficulty(difficulty: number): 1 | 2 | 3 | 4 {
  if (difficulty <= 1) return 1;
  if (difficulty >= 4) return 4;
  return Math.round(difficulty) as 1 | 2 | 3 | 4;
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
  const totalMod = kindMod * rarityMod;
  return {
    creditReward: Math.round(baseCredits * totalMod),
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
