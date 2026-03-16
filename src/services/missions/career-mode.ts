import type {
  Mission,
  MissionEnvironmentId,
  MissionFactionId,
  MissionKind,
} from "../../constants/missions.ts";
import {
  filterAvailableBattleBackgrounds,
  MISSION_ENVIRONMENT_META,
  MISSION_FACTION_ORDER,
} from "../../constants/missions.ts";
import { getFormationSlots, getActiveSlots, getSoldierById } from "../../constants/company-slots.ts";
import type { Company } from "../../game/entities/company/company.ts";
import type { Designation, Soldier } from "../../game/entities/types.ts";
import { computeMissionRewards } from "./mission-reward-policy.ts";
import { normalizeEncounterForMission } from "./mission-scenarios.ts";

function clampCareerLevel(level: number): number {
  return Math.max(1, Math.min(999, Math.floor(level || 1)));
}

function isCareerBossLevel(level: number): boolean {
  return level > 0 && level % 10 === 0;
}

export function isCareerUnlocked(
  _company: Company | null | undefined,
  onboardingFirstMissionPending: boolean,
): boolean {
  return !onboardingFirstMissionPending;
}

export function getCareerActiveSoldiers(
  company: Company | null | undefined,
): Soldier[] {
  const companyRef = company ?? null;
  const formation = getFormationSlots(companyRef);
  const activeLimit = getActiveSlots(companyRef);
  return formation
    .slice(0, activeLimit)
    .map((id) => (id ? getSoldierById(companyRef, id) : null))
    .filter((s): s is Soldier => s != null);
}

export function getCareerRoleCounts(activeSoldiers: Soldier[]): {
  rifleman: number;
  medic: number;
  support: number;
} {
  const counts = { rifleman: 0, medic: 0, support: 0 };
  for (const s of activeSoldiers) {
    const role = (s.designation ?? "rifleman") as Designation;
    if (role === "medic") counts.medic += 1;
    else if (role === "support") counts.support += 1;
    else counts.rifleman += 1;
  }
  return counts;
}

function getCareerDifficultyByLevel(level: number): 1 | 2 | 3 | 4 {
  if (level <= 3) return 1;
  if (level <= 8) return 2;
  if (level <= 15) return 3;
  return 4;
}

function getCareerFaction(level: number): MissionFactionId {
  return MISSION_FACTION_ORDER[(Math.max(1, level) - 1) % MISSION_FACTION_ORDER.length];
}

function getCareerEnvironment(level: number): MissionEnvironmentId {
  const orderAll: MissionEnvironmentId[] = [
    "city",
    "forest",
    "harbor",
    "village",
    "desert",
    "structure",
  ];
  const order = orderAll.filter(
    (id) =>
      filterAvailableBattleBackgrounds(
        MISSION_ENVIRONMENT_META[id].battleBackgrounds,
      ).length > 0,
  );
  const safeOrder = order.length ? order : (["city"] as MissionEnvironmentId[]);
  return safeOrder[(Math.max(1, level) - 1) % safeOrder.length];
}

function getCareerBattleBackground(
  environmentId: MissionEnvironmentId,
  level: number,
): string {
  const pool = filterAvailableBattleBackgrounds(
    MISSION_ENVIRONMENT_META[environmentId].battleBackgrounds,
  );
  return pool[(Math.max(1, level) - 1) % Math.max(1, pool.length)] ?? "city_0.png";
}

export function createCareerMission(
  company: Company | null | undefined,
  careerLevel: number,
): Mission {
  const level = clampCareerLevel(careerLevel);
  const isBossMission = isCareerBossLevel(level);
  const activeSoldiers = getCareerActiveSoldiers(company);
  const enemyCount = isBossMission ? 3 : Math.max(1, activeSoldiers.length);
  const rolesInitial = isBossMission
    ? { rifleman: 2, medic: 1, support: 0 }
    : getCareerRoleCounts(activeSoldiers);
  const difficulty = getCareerDifficultyByLevel(level);
  const kind: MissionKind = "skirmish";
  const rarity = "normal";
  const factionId = getCareerFaction(level);
  const environmentId = getCareerEnvironment(level);
  const battleBackground = getCareerBattleBackground(environmentId, level);
  const rewards = computeMissionRewards({
    difficulty,
    kind,
    rarity,
    missionLevel: level,
  });
  const mission: Mission = {
    id: `career_${level}`,
    kind,
    rarity,
    factionId,
    environmentId,
    battleBackground,
    isCareer: true,
    isCareerBoss: isBossMission,
    careerLevel: level,
    name: isBossMission
      ? `Career Boss Lv ${level}`
      : `Career Mission Lv ${level}`,
    difficulty,
    enemyCount,
    creditReward: rewards.creditReward,
    xpReward: rewards.xpReward,
    flavorText: isBossMission
      ? "Career Boss Mission: eliminate the elite leader and his escort."
      : "Career Ladder: eliminate all hostile targets.",
    encounter: {
      initialEnemyCount: enemyCount,
      totalEnemyCount: enemyCount,
      maxConcurrentEnemies: Math.min(8, enemyCount),
      reinforceIntervalMs: 0,
      reinforceSetupMs: 2000,
      rolesInitial,
      rolesReinforcement: { rifleman: 0, medic: 0, support: 0 },
      medicHealsPerMedic: isBossMission ? 4 : 2,
      supportSuppressUses: isBossMission ? 0 : 1,
      eliteCount: isBossMission ? 1 : 0,
      grenadeThrowers: isBossMission
        ? 1
        : Math.max(1, Math.floor(enemyCount / 3)),
    },
    rewardItems: [],
  };
  return normalizeEncounterForMission(mission);
}
