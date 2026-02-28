import type { Mission, MissionKind } from "../../constants/missions.ts";
import {
  MISSION_KIND_ORDER,
} from "../../constants/missions.ts";
import { randomInt } from "../../utils/math.ts";
import {
  computeMissionEnemyCount,
  computeMissionRewards,
} from "./mission-reward-policy.ts";

/** Bump this when mission generation output changes and old boards should be regenerated. */
export const MISSION_BOARD_SCHEMA_VERSION = 5;

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

const KIND_OBJECTIVES: Record<MissionKind, string[]> = {
  defend_objective: ["the relay station", "the supply cache", "the command post", "the fuel depot"],
  ambush: ["an armored convoy", "a patrol column", "a logistics team", "a radio truck"],
  attack_objective: ["the mortar nest", "the comms bunker", "the checkpoint", "the weapons dump"],
  seek_and_destroy: ["a sabotage cell", "an HVT escort", "an infiltration team", "a recon element"],
  manhunt: ["a warlord", "an insurgent leader", "a defector", "a sniper captain"],
};

const TITLE_TEMPLATES: Record<MissionKind, string[]> = {
  defend_objective: ["Hold the Line", "Defend Position", "Secure Perimeter"],
  ambush: ["Set Ambush", "Silent Intercept", "Spring the Trap"],
  attack_objective: ["Assault Position", "Break Defenses", "Shock Assault"],
  seek_and_destroy: ["Sweep and Destroy", "Target Elimination", "Clear Hostiles"],
  manhunt: ["Target Pursuit", "Track and Capture", "Live Target Hunt"],
};

const DESCRIPTION_TEMPLATES: Record<MissionKind, string[]> = {
  defend_objective: [
    "Enemy units are converging on {OBJ} near {LOC}. Hold the perimeter and deny the breach.",
    "{OBJ} is under direct assault at {LOC}. Dig in and repel all attackers.",
  ],
  ambush: [
    "{OBJ} is moving through {LOC}. Strike first, shatter cohesion, and disappear before reinforcements arrive.",
    "Establish kill zones at {LOC}. Hit {OBJ} hard and withdraw before counterfire builds.",
  ],
  attack_objective: [
    "Conduct a direct assault on {OBJ} in {LOC}. Break resistance and secure the site.",
    "{OBJ} in {LOC} is lightly entrenched. Push aggressively and clear the objective.",
  ],
  seek_and_destroy: [
    "Intel places {OBJ} inside {LOC}. Sweep the area and eliminate hostiles on contact.",
    "{OBJ} is operating around {LOC}. Track signatures, isolate threats, and destroy the target.",
  ],
  manhunt: [
    "{OBJ} is fleeing through {LOC}. Pursue, cut off escape routes, and finish the manhunt.",
    "A high-priority target, {OBJ}, was spotted near {LOC}. Track and eliminate before exfil.",
  ],
};

const RISK_CLAUSES = {
  low: ["Expect light contact.", "Visibility is favorable."],
  medium: ["Expect resistance and rapid flanking.", "Enemy morale appears steady."],
  high: ["Expect hardened resistance and layered defenses.", "Reinforcements are likely if the assault drags on."],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickDeterministic<T>(arr: T[], seed: string): T {
  return arr[hashString(seed) % arr.length];
}

function riskBucket(difficulty: number): "low" | "medium" | "high" {
  if (difficulty <= 2) return "low";
  if (difficulty <= 3) return "medium";
  return "high";
}

function composeMissionText(
  kind: MissionKind,
  id: string,
  difficulty: number,
  isEpic: boolean,
  variant = 0,
): { name: string; flavorText: string } {
  const salt = `${id}:v${variant}`;
  const loc = pickDeterministic(LOCATIONS, `${salt}:loc`);
  const obj = pickDeterministic(KIND_OBJECTIVES[kind], `${salt}:obj`);
  const titleTpl = pickDeterministic(TITLE_TEMPLATES[kind], `${salt}:title`);
  const descTpl = pickDeterministic(DESCRIPTION_TEMPLATES[kind], `${salt}:desc`);
  const risk = pickDeterministic(RISK_CLAUSES[riskBucket(difficulty)], `${salt}:risk`);
  const fill = (tpl: string) => tpl.replaceAll("{LOC}", loc).replaceAll("{OBJ}", obj);
  const baseTitle = fill(titleTpl);
  const name = isEpic ? `Elite: ${baseTitle}` : baseTitle;
  const flavorText = `${fill(descTpl)} ${risk}`;
  return { name, flavorText };
}

function composeUniqueMissionText(
  kind: MissionKind,
  id: string,
  difficulty: number,
  isEpic: boolean,
  usedTitles: Set<string>,
): { name: string; flavorText: string } {
  const maxVariants = 8;
  for (let variant = 0; variant < maxVariants; variant++) {
    const text = composeMissionText(kind, id, difficulty, isEpic, variant);
    if (!usedTitles.has(text.name)) {
      usedTitles.add(text.name);
      return text;
    }
  }
  const fallback = composeMissionText(kind, id, difficulty, isEpic, maxVariants);
  const uniqueFallback = `${fallback.name} ${isEpic ? "E" : "N"}${(hashString(id) % 90) + 10}`;
  usedTitles.add(uniqueFallback);
  return { ...fallback, name: uniqueFallback };
}

export function generateMissions(companyLevel = 1, _seed?: number): Mission[] {
  const missions: Mission[] = [];
  const usedTitles = new Set<string>();
  const COPIES_PER_KIND = 3;
  let serial = 0;
  const addMission = (kind: MissionKind, isEpic: boolean) => {
    serial += 1;
    const difficulty = isEpic ? randomInt(4, 5) : randomInt(1, 4);
    const rarity = isEpic ? "epic" : "normal";
    const enemyCount = computeMissionEnemyCount(difficulty, rarity, companyLevel);
    const { creditReward, xpReward } = computeMissionRewards({
      difficulty,
      kind,
      rarity,
    });
    const id = `${isEpic ? "epic" : "mission"}-${kind}-${serial}-${Date.now()}`;
    const text = composeUniqueMissionText(kind, id, difficulty, isEpic, usedTitles);
    missions.push({
      id,
      kind,
      name: text.name,
      difficulty,
      enemyCount,
      creditReward,
      xpReward,
      flavorText: text.flavorText,
      isEpic,
      rarity,
      rewardItems: isEpic
        ? [pick(["m84_flashbang", "incendiary_grenade", "stim_pack", "standard_medkit", "tk21_throwing_knife", "m3a_repressor", "m3_frag_grenade", "mk18_smoke", "orange_stim_pack"])]
        : undefined,
    });
  };

  for (const kind of MISSION_KIND_ORDER) {
    for (let i = 0; i < COPIES_PER_KIND; i++) addMission(kind, false);
  }

  for (const kind of MISSION_KIND_ORDER) {
    for (let i = 0; i < COPIES_PER_KIND; i++) addMission(kind, true);
  }

  return missions;
}
