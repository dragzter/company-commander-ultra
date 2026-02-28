import type { Mission, MissionKind } from "../../constants/missions.ts";
import {
  MISSION_KIND_META,
  getMissionKindDefinition,
  getMissionKindsForGeneration,
} from "../../constants/missions.ts";
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

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateFlavorText(kind: MissionKind): string {
  const loc = pick(LOCATIONS);
  const template = pick(getMissionKindDefinition(kind).flavorTemplates);
  return template.replace("{LOC}", loc);
}

const CREDIT_BASE = 100;
const CREDIT_SCALE = 70;

export function generateMissions(_seed?: number): Mission[] {
  const missions: Mission[] = [];
  const regularCount = 10;
  const epicCount = 4;
  const regularKindPool = getMissionKindsForGeneration("regular");
  const epicKindPool = getMissionKindsForGeneration("epic");

  const rareIndices = new Set<number>();
  while (rareIndices.size < 3) {
    rareIndices.add(Math.floor(Math.random() * regularCount));
  }
  for (let i = 0; i < regularCount; i++) {
    const kind = pick(regularKindPool);
    const difficulty = randomInt(1, 4);
    const meta = MISSION_KIND_META[kind];
    const enemyCount = Math.min(
      8,
      Math.max(2, difficulty * 2 + randomInt(-1, 1)),
    );
    const isRare = rareIndices.has(i);
    const creditReward =
      CREDIT_BASE + difficulty * CREDIT_SCALE + randomInt(0, 50) + (isRare ? 50 : 0);
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
      ...(isRare && { rewardItems: [pick(["m84_flashbang", "incendiary_grenade", "stim_pack", "standard_medkit", "tk21_throwing_knife", "m3a_repressor", "m3_frag_grenade", "mk18_smoke", "orange_stim_pack"])] }),
    });
  }

  for (let i = 0; i < epicCount; i++) {
    const kind = epicKindPool[i % epicKindPool.length];
    const meta = MISSION_KIND_META[kind];
    const difficulty = randomInt(4, 5);
    const enemyCount = Math.min(
      12,
      Math.max(4, difficulty * 2 + randomInt(0, 2)),
    );
    const creditReward = Math.floor(
      (CREDIT_BASE + difficulty * CREDIT_SCALE) * 1.8 + randomInt(0, 120),
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
      rewardItems: [pick(["m84_flashbang", "incendiary_grenade", "stim_pack", "standard_medkit", "tk21_throwing_knife", "m3a_repressor", "m3_frag_grenade", "mk18_smoke", "orange_stim_pack"])],
    });
  }

  return missions;
}
