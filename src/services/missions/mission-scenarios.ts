import type { Mission, MissionEncounterConfig, MissionEnemyRoleMix, MissionKind } from "../../constants/missions.ts";

function roleMix(rifleman: number, medic: number, support: number): MissionEnemyRoleMix {
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

function normalizeRoleMix(total: number, mix: MissionEnemyRoleMix): MissionEnemyRoleMix {
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
  const base: MissionEncounterConfig = {
    initialEnemyCount: 4,
    totalEnemyCount: 4,
    maxConcurrentEnemies: 8,
    reinforceIntervalMs: 0,
    reinforceSetupMs: 2000,
    rolesInitial: roleMix(4, 0, 0),
    rolesReinforcement: roleMix(0, 0, 0),
    medicHealsPerMedic: d >= 4 ? 5 : d >= 3 ? 4 : d >= 2 ? 2 : 1,
    supportSuppressUses: d >= 2 ? 1 : 0,
    eliteCount: 0,
    grenadeThrowers: 0,
  };

  if (kind === "seek_and_destroy") {
    if (d === 1) {
      const includeMedic = Math.random() < 0.5;
      base.initialEnemyCount = 4;
      base.totalEnemyCount = 4;
      base.rolesInitial = includeMedic ? roleMix(3, 1, 0) : roleMix(4, 0, 0);
      base.medicHealsPerMedic = includeMedic ? 1 : 0;
      base.supportSuppressUses = 0;
    } else if (d === 2) {
      const includeMedic = Math.random() < 0.5;
      base.initialEnemyCount = 6;
      base.totalEnemyCount = 6;
      base.rolesInitial = includeMedic ? roleMix(5, 1, 0) : roleMix(5, 0, 1);
      base.medicHealsPerMedic = includeMedic ? 2 : 0;
      base.supportSuppressUses = includeMedic ? 0 : 1;
      base.grenadeThrowers = 1;
    } else if (d === 3) {
      base.initialEnemyCount = 8;
      base.totalEnemyCount = 10;
      base.rolesInitial = roleMix(6, 1, 1);
      base.rolesReinforcement = roleMix(2, 0, 0);
      base.medicHealsPerMedic = 4;
      base.supportSuppressUses = 1;
    } else {
      base.initialEnemyCount = 8;
      base.totalEnemyCount = 14;
      base.rolesInitial = roleMix(5, 1, 2);
      base.rolesReinforcement = roleMix(6, 0, 0);
      base.medicHealsPerMedic = 5;
      base.supportSuppressUses = 1;
    }
    return cloneEncounter(base);
  }

  if (kind === "manhunt") {
    if (d === 1) {
      base.initialEnemyCount = 4;
      base.totalEnemyCount = 4;
      base.rolesInitial = roleMix(4, 0, 0);
      base.eliteCount = 1;
      base.grenadeThrowers = 1;
      base.medicHealsPerMedic = 0;
      base.supportSuppressUses = 0;
    } else if (d === 2) {
      base.initialEnemyCount = 6;
      base.totalEnemyCount = 6;
      base.rolesInitial = roleMix(4, 1, 1);
      base.eliteCount = 1;
      base.medicHealsPerMedic = 2;
      base.supportSuppressUses = 1;
    } else if (d === 3) {
      base.initialEnemyCount = 8;
      base.totalEnemyCount = 8;
      base.rolesInitial = roleMix(6, 1, 1);
      base.eliteCount = 2;
      base.medicHealsPerMedic = 4;
      base.supportSuppressUses = 1;
    } else {
      base.initialEnemyCount = 8;
      base.totalEnemyCount = 10;
      base.rolesInitial = roleMix(5, 1, 2);
      base.rolesReinforcement = roleMix(2, 0, 0);
      base.eliteCount = 2;
      base.medicHealsPerMedic = 5;
      base.supportSuppressUses = 1;
    }
    return cloneEncounter(base);
  }

  if (kind === "defend_objective") {
    base.reinforceIntervalMs = 30_000;
    if (d === 1) {
      base.initialEnemyCount = 4;
      base.totalEnemyCount = 8;
      base.rolesInitial = roleMix(4, 0, 0);
      base.rolesReinforcement = roleMix(4, 0, 0);
      base.medicHealsPerMedic = 0;
      base.supportSuppressUses = 0;
    } else if (d === 2) {
      const includeMedic = Math.random() < 0.5;
      base.initialEnemyCount = 6;
      base.totalEnemyCount = 12;
      base.rolesInitial = includeMedic ? roleMix(5, 1, 0) : roleMix(5, 0, 1);
      base.rolesReinforcement = roleMix(6, 0, 0);
      base.medicHealsPerMedic = includeMedic ? 2 : 0;
      base.supportSuppressUses = includeMedic ? 0 : 1;
    } else if (d === 3) {
      base.initialEnemyCount = 8;
      base.totalEnemyCount = 16;
      base.rolesInitial = roleMix(6, 1, 1);
      base.rolesReinforcement = roleMix(7, 0, 1);
      base.medicHealsPerMedic = 4;
      base.supportSuppressUses = 1;
    } else {
      base.initialEnemyCount = 8;
      base.totalEnemyCount = 20;
      base.rolesInitial = roleMix(6, 1, 1);
      base.rolesReinforcement = roleMix(10, 1, 1);
      base.medicHealsPerMedic = 5;
      base.supportSuppressUses = 1;
    }
    return cloneEncounter(base);
  }

  return cloneEncounter(base);
}

export function getDisplayEnemyCount(mission: Mission): number {
  const encounter = mission.encounter;
  if (!encounter) return Math.max(1, mission.enemyCount ?? 1);
  return Math.max(1, encounter.totalEnemyCount || mission.enemyCount || encounter.initialEnemyCount);
}

export function shouldUseEncounterReinforcements(mission: Mission | null | undefined): boolean {
  if (!mission?.encounter) return false;
  return (mission.encounter.totalEnemyCount ?? 0) > (mission.encounter.initialEnemyCount ?? mission.enemyCount ?? 0);
}

export function normalizeEncounterForMission(mission: Mission): Mission {
  if (!mission.encounter) return mission;
  const encounter = cloneEncounter(mission.encounter);
  encounter.initialEnemyCount = Math.max(1, encounter.initialEnemyCount || mission.enemyCount || 1);
  encounter.totalEnemyCount = Math.max(encounter.initialEnemyCount, encounter.totalEnemyCount || encounter.initialEnemyCount);
  encounter.maxConcurrentEnemies = Math.max(1, encounter.maxConcurrentEnemies || 8);
  encounter.reinforceIntervalMs = Math.max(0, encounter.reinforceIntervalMs || 0);
  encounter.reinforceSetupMs = Math.max(0, encounter.reinforceSetupMs || 2000);
  encounter.rolesInitial = normalizeRoleMix(encounter.initialEnemyCount, encounter.rolesInitial);
  encounter.rolesReinforcement = normalizeRoleMix(encounter.totalEnemyCount - encounter.initialEnemyCount, encounter.rolesReinforcement);
  encounter.eliteCount = Math.max(0, Math.min(encounter.initialEnemyCount, encounter.eliteCount || 0));
  encounter.grenadeThrowers = Math.max(0, Math.min(encounter.initialEnemyCount, encounter.grenadeThrowers || 0));
  encounter.medicHealsPerMedic = Math.max(0, encounter.medicHealsPerMedic || 0);
  encounter.supportSuppressUses = Math.max(0, encounter.supportSuppressUses || 0);
  return {
    ...mission,
    enemyCount: encounter.initialEnemyCount,
    encounter,
  };
}
