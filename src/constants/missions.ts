export const MISSION_KINDS = {
  defend_objective: "defend_objective",
  ambush: "ambush",
  attack_objective: "attack_objective",
  seek_and_destroy: "seek_and_destroy",
  manhunt: "manhunt",
} as const;

export type MissionKind = keyof typeof MISSION_KINDS;

export const MISSION_KIND_META: Record<
  MissionKind,
  { name: string; description: string }
> = {
  defend_objective: {
    name: "Defend Objective",
    description: "Hold the position against enemy assault.",
  },
  ambush: {
    name: "Ambush",
    description: "Set up a surprise attack on enemy forces.",
  },
  attack_objective: {
    name: "Attack Objective",
    description: "Assault and neutralize enemy positions.",
  },
  seek_and_destroy: {
    name: "Seek and Destroy",
    description: "Eliminate high-value targets.",
  },
  manhunt: {
    name: "Manhunt",
    description: "Track and eliminate a priority target.",
  },
};

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Trivial",
  2: "Easy",
  3: "Medium",
  4: "Hard",
  5: "Extreme",
};

export type MissionRarity = "normal" | "rare" | "epic";

export type Mission = {
  id: string;
  kind: MissionKind;
  name: string;
  difficulty: number;
  enemyCount: number;
  creditReward: number;
  flavorText?: string;
  isEpic?: boolean;
  rarity?: MissionRarity;
  rewardItems?: string[];
};
