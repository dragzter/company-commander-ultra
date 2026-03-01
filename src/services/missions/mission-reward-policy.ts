import type { MissionKind, MissionRarity } from "../../constants/missions.ts";
import { getActiveSlotsByLevel } from "../../constants/company-capacity.ts";

export interface MissionRewardInput {
  difficulty: number;
  kind: MissionKind;
  rarity: MissionRarity;
}

const KIND_REWARD_MODIFIERS: Record<MissionKind, number> = {
  defend_objective: 1.0,
  ambush: 1.05,
  attack_objective: 1.1,
  seek_and_destroy: 1.1,
  manhunt: 1.15,
};

const RARITY_REWARD_MODIFIERS: Record<MissionRarity, number> = {
  normal: 1,
  rare: 1.25,
  epic: 1.7,
};

const BASE_CREDITS_BY_DIFFICULTY: Record<number, number> = {
  1: 220,
  2: 320,
  3: 440,
  4: 580,
  5: 740,
};

const BASE_XP_BY_DIFFICULTY: Record<number, number> = {
  1: 30,
  2: 50,
  3: 75,
  4: 105,
  5: 140,
};

function clampDifficulty(difficulty: number): 1 | 2 | 3 | 4 | 5 {
  if (difficulty <= 1) return 1;
  if (difficulty >= 5) return 5;
  return Math.round(difficulty) as 1 | 2 | 3 | 4 | 5;
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
): number {
  const d = clampDifficulty(difficulty);
  const activeSlots = getActiveSlotsByLevel(companyLevel);
  const minEnemies = 4;
  const maxEnemies = Math.max(6, activeSlots + 2); // L1 active=4 => max 6
  const epicBonus = rarity === "epic" ? 2 : 0;
  const target = d + 2 + epicBonus;
  return Math.max(minEnemies, Math.min(maxEnemies, target));
}
