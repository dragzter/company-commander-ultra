import type {
  MissionEnvironmentId,
  Mission,
  MissionFactionId,
  MissionKind,
} from "../../constants/missions.ts";
import {
  filterAvailableBattleBackgrounds,
  MISSION_ENVIRONMENT_META,
  MISSION_FACTION_ORDER,
  MISSION_KIND_ORDER,
} from "../../constants/missions.ts";
import {
  computeMissionEnemyCount,
  computeMissionRewards,
} from "./mission-reward-policy.ts";
import { getCompanyProgressionEntry } from "../../constants/company-progression.ts";
import { getEliteSuperCountForDifficulty } from "../../constants/mission-difficulty-tuning.ts";
import {
  getStandardMissionEncounter,
  normalizeEncounterForMission,
} from "./mission-scenarios.ts";

/** Bump this when mission generation output changes and old boards should be regenerated. */
export const MISSION_BOARD_SCHEMA_VERSION = 10;

const ENVIRONMENT_ORDER_ALL: MissionEnvironmentId[] = [
  "city",
  "forest",
  "harbor",
  "village",
  "desert",
  "structure",
];

const ENVIRONMENT_ORDER: MissionEnvironmentId[] = ENVIRONMENT_ORDER_ALL.filter(
  (id) =>
    filterAvailableBattleBackgrounds(
      MISSION_ENVIRONMENT_META[id].battleBackgrounds,
    ).length > 0,
);

const LOCATIONS_BY_ENVIRONMENT: Record<MissionEnvironmentId, string[]> = {
  city: [
    "the downtown sector",
    "the metro junction",
    "the ruined boulevard",
    "the civic center",
  ],
  forest: [
    "the treeline ridge",
    "the pine corridor",
    "the marsh trail",
    "the forest edge",
  ],
  harbor: [
    "the dry docks",
    "the cargo piers",
    "the container yard",
    "the breakwater lane",
  ],
  village: [
    "the village square",
    "the river crossing",
    "the old market road",
    "the outskirts",
  ],
  desert: [
    "the dune corridor",
    "the salt flats",
    "the canyon pass",
    "the sun-baked outpost",
  ],
  structure: [
    "the industrial complex",
    "the abandoned facility",
    "the concrete sector",
    "the fortified compound",
  ],
};

const KIND_OBJECTIVES: Record<MissionKind, string[]> = {
  defend_objective: [
    "the relay station",
    "the supply cache",
    "the command post",
    "the fuel depot",
  ],
  ambush: [
    "an armored convoy",
    "a patrol column",
    "a logistics team",
    "a radio truck",
  ],
  attack_objective: [
    "the mortar nest",
    "the comms bunker",
    "the checkpoint",
    "the weapons dump",
  ],
  skirmish: [
    "a sabotage cell",
    "an HVT escort",
    "an infiltration team",
    "a recon element",
  ],
  manhunt: [
    "a warlord",
    "an insurgent leader",
    "a defector",
    "a sniper captain",
  ],
};

const TITLE_TEMPLATES: Record<MissionKind, string[]> = {
  defend_objective: ["Hold the Line", "Defend Position", "Secure Perimeter"],
  ambush: ["Set Ambush", "Silent Intercept", "Spring the Trap"],
  attack_objective: ["Assault Position", "Break Defenses", "Shock Assault"],
  skirmish: ["Sweep and Destroy", "Target Elimination", "Clear Hostiles"],
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
  skirmish: [
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
  medium: [
    "Expect resistance and rapid flanking.",
    "Enemy morale appears steady.",
  ],
  high: [
    "Expect hardened resistance and layered defenses.",
    "Reinforcements are likely if the assault drags on.",
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffledFactions(): MissionFactionId[] {
  const out = [...MISSION_FACTION_ORDER];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function shuffledEnvironments(): MissionEnvironmentId[] {
  const out = [...ENVIRONMENT_ORDER];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
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
  environmentId: MissionEnvironmentId,
  variant = 0,
): { name: string; flavorText: string } {
  const salt = `${id}:v${variant}`;
  const loc = pickDeterministic(
    LOCATIONS_BY_ENVIRONMENT[environmentId],
    `${salt}:loc`,
  );
  const obj = pickDeterministic(KIND_OBJECTIVES[kind], `${salt}:obj`);
  const titleTpl = pickDeterministic(TITLE_TEMPLATES[kind], `${salt}:title`);
  const descTpl = pickDeterministic(
    DESCRIPTION_TEMPLATES[kind],
    `${salt}:desc`,
  );
  const risk = pickDeterministic(
    RISK_CLAUSES[riskBucket(difficulty)],
    `${salt}:risk`,
  );
  const fill = (tpl: string) =>
    tpl.replaceAll("{LOC}", loc).replaceAll("{OBJ}", obj);
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
  environmentId: MissionEnvironmentId,
  usedTitles: Set<string>,
): { name: string; flavorText: string } {
  const maxVariants = 8;
  for (let variant = 0; variant < maxVariants; variant++) {
    const text = composeMissionText(
      kind,
      id,
      difficulty,
      isEpic,
      environmentId,
      variant,
    );
    if (!usedTitles.has(text.name)) {
      usedTitles.add(text.name);
      return text;
    }
  }
  const fallback = composeMissionText(
    kind,
    id,
    difficulty,
    isEpic,
    environmentId,
    maxVariants,
  );
  const uniqueFallback = `${fallback.name} ${isEpic ? "E" : "N"}${(hashString(id) % 90) + 10}`;
  usedTitles.add(uniqueFallback);
  return { ...fallback, name: uniqueFallback };
}

export function generateMissions(
  companyLevel = 1,
  _seed?: number,
  progressionLevelOverride?: number,
): Mission[] {
  const missions: Mission[] = [];
  const usedTitles = new Set<string>();
  const progressionLevel = Math.max(
    1,
    Math.floor(progressionLevelOverride ?? companyLevel),
  );
  const progression = getCompanyProgressionEntry(progressionLevel);
  const extremeUnlocked =
    getCompanyProgressionEntry(
      Math.max(1, Math.floor(companyLevel || 1)),
    ).featureGates.extremeMissions;
  const eliteUnlocked = progression.featureGates.eliteMissions;
  const factionPool = shuffledFactions();
  const environmentPool = shuffledEnvironments();
  const normalFactionPlanByKind = new Map<MissionKind, MissionFactionId[]>();
  const epicFactionPlanByKind = new Map<MissionKind, MissionFactionId[]>();
  const normalEnvironmentPlanByKind = new Map<
    MissionKind,
    MissionEnvironmentId[]
  >();
  const epicEnvironmentPlanByKind = new Map<
    MissionKind,
    MissionEnvironmentId[]
  >();
  MISSION_KIND_ORDER.forEach((kind, index) => {
    const start = index % factionPool.length;
    normalFactionPlanByKind.set(kind, [
      factionPool[start],
      factionPool[(start + 1) % factionPool.length],
      factionPool[(start + 2) % factionPool.length],
    ]);
    epicFactionPlanByKind.set(kind, [
      factionPool[(start + 3) % factionPool.length],
      factionPool[start],
    ]);
    normalEnvironmentPlanByKind.set(kind, [
      environmentPool[start],
      environmentPool[(start + 1) % environmentPool.length],
      environmentPool[(start + 2) % environmentPool.length],
    ]);
    epicEnvironmentPlanByKind.set(kind, [
      environmentPool[(start + 3) % environmentPool.length],
      environmentPool[start],
    ]);
  });
  let serial = 0;
  const addMission = (
    kind: MissionKind,
    difficulty: number,
    isEpic: boolean,
    factionId: MissionFactionId,
    environmentId: MissionEnvironmentId,
  ) => {
    serial += 1;
    const rarity = isEpic ? "epic" : "normal";
    const encounter = getStandardMissionEncounter(kind, difficulty);
    if (isEpic) {
      encounter.eliteCount = Math.max(
        0,
        Math.min(
          encounter.initialEnemyCount,
          getEliteSuperCountForDifficulty(difficulty),
        ),
      );
    }
    const enemyCount =
      encounter?.initialEnemyCount ??
      computeMissionEnemyCount(difficulty, rarity, companyLevel, kind);
    const { creditReward, xpReward } = computeMissionRewards({
      difficulty,
      kind,
      rarity,
      missionLevel: progressionLevel,
    });
    const id = `${isEpic ? "epic" : "mission"}-${kind}-${serial}-${Date.now()}`;
    const envBackgrounds = filterAvailableBattleBackgrounds(
      MISSION_ENVIRONMENT_META[environmentId].battleBackgrounds,
    );
    const battleBackground = pickDeterministic(
      envBackgrounds.length ? envBackgrounds : ["city_0.png"],
      `${id}:env-bg`,
    );
    const text = composeUniqueMissionText(
      kind,
      id,
      difficulty,
      isEpic,
      environmentId,
      usedTitles,
    );
    missions.push({
      id,
      kind,
      factionId,
      environmentId,
      battleBackground,
      name: text.name,
      difficulty,
      enemyCount,
      creditReward,
      xpReward,
      flavorText: text.flavorText,
      isEpic,
      rarity,
      encounter,
      rewardItems: isEpic
        ? [
            pick([
              "m84_flashbang",
              "incendiary_grenade",
              "stim_pack",
              "standard_medkit",
              "tk21_throwing_knife",
              "m3a_repressor",
              "m3_frag_grenade",
              "mk18_smoke",
              "orange_stim_pack",
            ]),
          ]
        : undefined,
    });
  };

  const standardDifficulties = extremeUnlocked ? [1, 2, 3, 4] : [1, 2, 3];
  for (const kind of MISSION_KIND_ORDER) {
    const factionPlan = normalFactionPlanByKind.get(kind) ?? factionPool;
    const envPlan = normalEnvironmentPlanByKind.get(kind) ?? environmentPool;
    standardDifficulties.forEach((difficulty, idx) =>
      addMission(
        kind,
        difficulty,
        false,
        factionPlan[idx % factionPlan.length] ?? factionPool[0],
        envPlan[idx % envPlan.length] ?? environmentPool[0],
      ));
  }

  if (eliteUnlocked) {
    const eliteDifficulties = extremeUnlocked ? [1, 2, 3, 4] : [1, 2, 3];
    for (const kind of MISSION_KIND_ORDER) {
      const factionPlan = epicFactionPlanByKind.get(kind) ?? factionPool;
      const envPlan = epicEnvironmentPlanByKind.get(kind) ?? environmentPool;
      eliteDifficulties.forEach((difficulty, idx) =>
        addMission(
          kind,
          difficulty,
          true,
          factionPlan[idx % factionPlan.length] ?? factionPool[0],
          envPlan[idx % envPlan.length] ?? environmentPool[0],
        ));
    }
  }

  return missions.map((m) => normalizeEncounterForMission(m));
}

/** Dev-only fixed high-level sandbox missions (4v4, Lv999, Lv999 gear). */
export function generateDevTestMissions(): Mission[] {
  const now = Date.now();
  const mk = (
    id: string,
    name: string,
    kind: MissionKind,
    isEpic: boolean,
    difficulty: 1 | 2 | 3 | 4,
    flavorText: string,
  ): Mission => {
    const encounter = getStandardMissionEncounter(kind, difficulty);
    return normalizeEncounterForMission({
      id,
      kind,
      factionId: "desert_wolves",
      environmentId: "city",
      battleBackground: "city_0.png",
      difficulty,
      enemyCount: encounter.initialEnemyCount,
      creditReward: 0,
      xpReward: 0,
      isEpic,
      rarity: isEpic ? "epic" : "normal",
      isDevTest: true,
      forcedPlayerLevel: 20,
      forcedEnemyLevel: 20,
      forcedGearLevel: 20,
      forcedSquadSize: 4,
      rewardItems: [],
      name,
      flavorText,
      encounter,
    });
  };
  const legacy999 = {
    kind: "skirmish" as MissionKind,
    factionId: "desert_wolves" as MissionFactionId,
    environmentId: "city" as MissionEnvironmentId,
    battleBackground: "city_0.png",
    difficulty: 4,
    enemyCount: 4,
    creditReward: 0,
    xpReward: 0,
    isEpic: false,
    isDevTest: true,
    forcedPlayerLevel: 999,
    forcedEnemyLevel: 999,
    forcedGearLevel: 999,
    forcedSquadSize: 4,
    rarity: "normal" as const,
    rewardItems: [] as string[],
  };
  return [
    mk(
      `dev-l20-skirmish-normal-${now}`,
      "Test Mode Lv20 Skirmish",
      "skirmish",
      false,
      2,
      "Isolated test: Lv20 squad vs level-appropriate normal skirmish.",
    ),
    mk(
      `dev-l20-skirmish-elite-${now}`,
      "Test Mode Lv20 Elite Skirmish",
      "skirmish",
      true,
      2,
      "Isolated test: Lv20 squad vs level-appropriate elite skirmish.",
    ),
    mk(
      `dev-l20-manhunt-elite-${now}`,
      "Test Mode Lv20 Elite Manhunt",
      "manhunt",
      true,
      2,
      "Isolated test: Lv20 squad vs level-appropriate elite manhunt.",
    ),
    mk(
      `dev-l20-defend-elite-${now}`,
      "Test Mode Lv20 Elite Defend",
      "defend_objective",
      true,
      2,
      "Isolated test: Lv20 squad vs level-appropriate elite defend mission.",
    ),
    {
      ...legacy999,
      id: `dev-trait-summary-preview-${now}`,
      name: "Trait Summary Preview",
      flavorText:
        "UI sandbox: preview post-mission trait awards and summary interactions.",
    },
    {
      ...legacy999,
      id: `dev-test-duel-a-${now}`,
      name: "Dev Duel A",
      flavorText: "Sandbox test: 4v4 at level 999 with level 999 gear.",
    },
    {
      ...legacy999,
      id: `dev-test-duel-b-${now}`,
      name: "Dev Duel B",
      flavorText:
        "Sandbox test: 4v4 at level 999 with level 999 gear (alt seed).",
    },
  ];
}
