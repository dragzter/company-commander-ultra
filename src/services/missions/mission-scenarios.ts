import type {
  Mission,
  MissionEncounterConfig,
  MissionEnemyRoleMix,
  MissionKind,
} from "../../constants/missions.ts";
import {
  getMissionBehaviorForDifficulty,
  getMissionCompositionForDifficulty,
} from "../../constants/mission-difficulty-tuning.ts";

function roleMix(
  rifleman: number,
  medic: number,
  support: number,
): MissionEnemyRoleMix {
  return { rifleman, medic, support };
}

function cloneEncounter(cfg: MissionEncounterConfig): MissionEncounterConfig {
  return {
    ...cfg,
    rolesInitial: { ...cfg.rolesInitial },
    rolesReinforcement: { ...cfg.rolesReinforcement },
  };
}

function sumRoleMix(mix: MissionEnemyRoleMix): number {
  return (mix.rifleman ?? 0) + (mix.medic ?? 0) + (mix.support ?? 0);
}

function normalizeRoleMix(
  total: number,
  mix: MissionEnemyRoleMix,
): MissionEnemyRoleMix {
  const next = { ...mix };
  const delta = total - sumRoleMix(next);
  if (delta > 0) next.rifleman += delta;
  if (delta < 0) {
    let remaining = -delta;
    const take = (key: keyof MissionEnemyRoleMix) => {
      if (remaining <= 0) return;
      const canTake = Math.min(next[key], remaining);
      next[key] -= canTake;
      remaining -= canTake;
    };
    take("rifleman");
    take("support");
    take("medic");
  }
  return next;
}

export function getStandardMissionEncounter(
  kind: MissionKind,
  difficulty: number,
): MissionEncounterConfig {
  const d = Math.max(1, Math.min(4, Math.floor(difficulty || 1)));
  const composition = getMissionCompositionForDifficulty(kind, d);
  const behavior = getMissionBehaviorForDifficulty("normal", d);
  const base: MissionEncounterConfig = {
    initialEnemyCount: composition.initialEnemyCount,
    totalEnemyCount: composition.totalEnemyCount,
    maxConcurrentEnemies: 8,
    reinforceIntervalMs: composition.reinforceIntervalMs,
    reinforceSetupMs: composition.reinforceSetupMs,
    rolesInitial: roleMix(
      composition.rolesInitial.rifleman,
      composition.rolesInitial.medic,
      composition.rolesInitial.support,
    ),
    rolesReinforcement: roleMix(
      composition.rolesReinforcement.rifleman,
      composition.rolesReinforcement.medic,
      composition.rolesReinforcement.support,
    ),
    medicHealsPerMedic: behavior.healsPerMedic,
    supportSuppressUses: behavior.suppressUsesPerSupport,
    eliteCount: composition.normalEliteCount,
    grenadeThrowers:
      behavior.grenadePlan.type === "team_total"
        ? Math.max(0, behavior.grenadePlan.totalThrows)
        : Math.max(
            0,
            composition.rolesInitial.rifleman *
              behavior.grenadePlan.throwsPerRifleman,
          ),
  };
  return cloneEncounter(base);
}

export function getDisplayEnemyCount(mission: Mission): number {
  const encounter = mission.encounter;
  if (!encounter) return Math.max(1, mission.enemyCount ?? 1);
  return Math.max(
    1,
    encounter.totalEnemyCount ||
      mission.enemyCount ||
      encounter.initialEnemyCount,
  );
}

export function shouldUseEncounterReinforcements(
  mission: Mission | null | undefined,
): boolean {
  if (!mission?.encounter) return false;
  return (
    (mission.encounter.totalEnemyCount ?? 0) >
    (mission.encounter.initialEnemyCount ?? mission.enemyCount ?? 0)
  );
}

export function normalizeEncounterForMission(mission: Mission): Mission {
  if (!mission.encounter) return mission;
  const encounter = cloneEncounter(mission.encounter);
  encounter.initialEnemyCount = Math.max(
    1,
    encounter.initialEnemyCount || mission.enemyCount || 1,
  );
  encounter.totalEnemyCount = Math.max(
    encounter.initialEnemyCount,
    encounter.totalEnemyCount || encounter.initialEnemyCount,
  );
  encounter.maxConcurrentEnemies = Math.max(
    1,
    encounter.maxConcurrentEnemies || 8,
  );
  encounter.reinforceIntervalMs = Math.max(
    0,
    encounter.reinforceIntervalMs || 0,
  );
  encounter.reinforceSetupMs = Math.max(0, encounter.reinforceSetupMs || 2000);
  encounter.rolesInitial = normalizeRoleMix(
    encounter.initialEnemyCount,
    encounter.rolesInitial,
  );
  encounter.rolesReinforcement = normalizeRoleMix(
    encounter.totalEnemyCount - encounter.initialEnemyCount,
    encounter.rolesReinforcement,
  );
  encounter.eliteCount = Math.max(
    0,
    Math.min(encounter.initialEnemyCount, encounter.eliteCount || 0),
  );
  encounter.grenadeThrowers = Math.max(
    0,
    Math.min(encounter.initialEnemyCount, encounter.grenadeThrowers || 0),
  );
  encounter.medicHealsPerMedic = Math.max(0, encounter.medicHealsPerMedic || 0);
  encounter.supportSuppressUses = Math.max(
    0,
    encounter.supportSuppressUses || 0,
  );
  return {
    ...mission,
    enemyCount: encounter.initialEnemyCount,
    encounter,
  };
}
