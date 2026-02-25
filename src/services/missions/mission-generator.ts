import type { Mission, MissionKind } from "../../constants/missions.ts";
import { MISSION_KINDS, MISSION_KIND_META } from "../../constants/missions.ts";
import { randomInt } from "../../utils/math.ts";

const LOCATIONS = [
  "the narrow pass",
  "the firebase",
  "the crossroads",
  "the bunker complex",
  "the perimeter zone",
  "the checkpoint",
  "the forest edge",
  "the compound",
  "the supply depot",
  "the bridgehead",
];

const FLAVOR_TEMPLATES: Record<MissionKind, string[]> = {
  defend_objective: [
    "Enemy forces are assaulting {LOC}. Hold the line at all costs.",
    "Defend {LOC} against the advancing hostiles.",
  ],
  ambush: [
    "Set up an ambush at {LOC}. The enemy won't see it coming.",
    "Lie in wait at {LOC}. Strike when they least expect it.",
  ],
  attack_objective: [
    "Assault {LOC} and neutralize all resistance.",
    "Take {LOC} by force. No quarter.",
  ],
  seek_and_destroy: [
    "A high-value target is holed up at {LOC}. Eliminate them.",
    "Neutralize the target at {LOC}.",
  ],
  manhunt: [
    "The target is fleeing through {LOC}. Don't let them escape.",
    "Track the priority target to {LOC} and eliminate them.",
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateFlavorText(kind: MissionKind): string {
  const loc = pick(LOCATIONS);
  const template = pick(FLAVOR_TEMPLATES[kind]);
  return template.replace("{LOC}", loc);
}

const CREDIT_BASE = 180;
const CREDIT_SCALE = 120;

const MISSION_KIND_LIST: MissionKind[] = [
  "defend_objective",
  "ambush",
  "attack_objective",
  "seek_and_destroy",
  "manhunt",
];

export function generateMissions(_seed?: number): Mission[] {
  const missions: Mission[] = [];
  const regularCount = 10;
  const epicCount = 4;

  const rareIndices = new Set<number>();
  while (rareIndices.size < 3) {
    rareIndices.add(Math.floor(Math.random() * regularCount));
  }
  for (let i = 0; i < regularCount; i++) {
    const kind = pick(MISSION_KIND_LIST);
    const difficulty = randomInt(1, 4);
    const meta = MISSION_KIND_META[kind];
    const enemyCount = Math.min(
      8,
      Math.max(2, difficulty * 2 + randomInt(-1, 1)),
    );
    const isRare = rareIndices.has(i);
    const creditReward =
      CREDIT_BASE + difficulty * CREDIT_SCALE + randomInt(0, 80) + (isRare ? 80 : 0);
    const xpReward = 25 * difficulty + (isRare ? 30 : 0);
    missions.push({
      id: `mission-${i}-${Date.now()}`,
      kind,
      name: `${meta.name} #${i + 1}`,
      difficulty,
      enemyCount,
      creditReward,
      xpReward,
      flavorText: generateFlavorText(kind),
      isEpic: false,
      rarity: isRare ? "rare" : "normal",
    });
  }

  const epicKinds = Object.keys(MISSION_KINDS) as MissionKind[];
  for (let i = 0; i < epicCount; i++) {
    const kind = epicKinds[i % epicKinds.length];
    const meta = MISSION_KIND_META[kind];
    const difficulty = randomInt(4, 5);
    const enemyCount = Math.min(
      12,
      Math.max(4, difficulty * 2 + randomInt(0, 2)),
    );
    const creditReward = Math.floor(
      (CREDIT_BASE + difficulty * CREDIT_SCALE) * 2.5 + randomInt(0, 200),
    );
    const xpReward = 50 * difficulty;
    missions.push({
      id: `epic-${i}-${Date.now()}`,
      kind,
      name: `Epic: ${meta.name}`,
      difficulty,
      enemyCount,
      creditReward,
      xpReward,
      flavorText: generateFlavorText(kind),
      isEpic: true,
      rarity: "epic",
      rewardItems: ["m84_flashbang", "incendiary_grenade", "stim_pack"],
    });
  }

  return missions;
}
