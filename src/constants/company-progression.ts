export const MAX_COMPANY_LEVEL = 10;

export type CompanyProgressionAbilityNode =
  | { type: "none" }
  | { type: "auto"; abilityId: string }
  | { type: "choice"; abilityIds: readonly [string, string] };

export type CompanyProgressionEntry = {
  level: number;
  xpRequiredTotal: number;
  roster: {
    total: number;
    active: number;
    reserve: number;
  };
  roleCaps: {
    roster: {
      medic: number;
      support: number;
      rifleman: number;
    };
    active: {
      medic: number;
      support: number;
      rifleman: number;
    };
  };
  armory: {
    weapon: number;
    armor: number;
    equipment: number;
    total: number;
  };
  rerollsOnLevelUp: number;
  abilityNode: CompanyProgressionAbilityNode;
  featureGates: {
    eliteMissions: boolean;
    extremeMissions: boolean;
  };
};

const toArmoryTotal = (
  weapon: number,
  armor: number,
  equipment: number,
): number => weapon + armor + equipment;

export const COMPANY_LEVEL_PROGRESSION: readonly CompanyProgressionEntry[] = [
  {
    level: 1,
    xpRequiredTotal: 0,
    roster: { total: 8, active: 4, reserve: 8 },
    roleCaps: {
      roster: { medic: 1, support: 1, rifleman: 6 },
      active: { medic: 1, support: 1, rifleman: 4 },
    },
    armory: { weapon: 6, armor: 6, equipment: 20, total: toArmoryTotal(6, 6, 20) },
    rerollsOnLevelUp: 6,
    abilityNode: { type: "auto", abilityId: "focused_fire" },
    featureGates: { eliteMissions: false, extremeMissions: false },
  },
  {
    level: 2,
    xpRequiredTotal: 1500,
    roster: { total: 8, active: 5, reserve: 8 },
    roleCaps: {
      roster: { medic: 1, support: 2, rifleman: 5 },
      active: { medic: 1, support: 1, rifleman: 5 },
    },
    armory: { weapon: 6, armor: 6, equipment: 20, total: toArmoryTotal(6, 6, 20) },
    rerollsOnLevelUp: 6,
    abilityNode: {
      type: "choice",
      abilityIds: ["advanced_tactical_training", "targeting_optics"],
    },
    featureGates: { eliteMissions: true, extremeMissions: false },
  },
  {
    level: 3,
    xpRequiredTotal: 5000,
    roster: { total: 10, active: 5, reserve: 10 },
    roleCaps: {
      roster: { medic: 1, support: 2, rifleman: 7 },
      active: { medic: 1, support: 1, rifleman: 5 },
    },
    armory: { weapon: 6, armor: 6, equipment: 20, total: toArmoryTotal(6, 6, 20) },
    rerollsOnLevelUp: 6,
    abilityNode: { type: "auto", abilityId: "gunnery" },
    featureGates: { eliteMissions: true, extremeMissions: false },
  },
  {
    level: 4,
    xpRequiredTotal: 10500,
    roster: { total: 10, active: 6, reserve: 10 },
    roleCaps: {
      roster: { medic: 2, support: 2, rifleman: 6 },
      active: { medic: 1, support: 1, rifleman: 6 },
    },
    armory: { weapon: 8, armor: 8, equipment: 25, total: toArmoryTotal(8, 8, 25) },
    rerollsOnLevelUp: 6,
    abilityNode: { type: "auto", abilityId: "improved_focused_fire" },
    featureGates: { eliteMissions: true, extremeMissions: false },
  },
  {
    level: 5,
    xpRequiredTotal: 18000,
    roster: { total: 12, active: 7, reserve: 12 },
    roleCaps: {
      roster: { medic: 2, support: 3, rifleman: 7 },
      active: { medic: 1, support: 2, rifleman: 7 },
    },
    armory: { weapon: 8, armor: 8, equipment: 25, total: toArmoryTotal(8, 8, 25) },
    rerollsOnLevelUp: 6,
    abilityNode: {
      type: "choice",
      abilityIds: ["artillery_barrage", "napalm_barrage"],
    },
    featureGates: { eliteMissions: true, extremeMissions: false },
  },
  {
    level: 6,
    xpRequiredTotal: 33000,
    roster: { total: 14, active: 8, reserve: 14 },
    roleCaps: {
      roster: { medic: 2, support: 3, rifleman: 9 },
      active: { medic: 2, support: 2, rifleman: 8 },
    },
    armory: { weapon: 8, armor: 8, equipment: 25, total: toArmoryTotal(8, 8, 25) },
    rerollsOnLevelUp: 6,
    abilityNode: { type: "auto", abilityId: "grenadier_training" },
    featureGates: { eliteMissions: true, extremeMissions: true },
  },
  {
    level: 7,
    xpRequiredTotal: 46000,
    roster: { total: 16, active: 8, reserve: 16 },
    roleCaps: {
      roster: { medic: 3, support: 3, rifleman: 10 },
      active: { medic: 2, support: 2, rifleman: 8 },
    },
    armory: { weapon: 10, armor: 10, equipment: 30, total: toArmoryTotal(10, 10, 30) },
    rerollsOnLevelUp: 6,
    abilityNode: {
      type: "choice",
      abilityIds: ["entrenchment_techniques", "fire_and_maneuver"],
    },
    featureGates: { eliteMissions: true, extremeMissions: true },
  },
  {
    level: 8,
    xpRequiredTotal: 63000,
    roster: { total: 16, active: 8, reserve: 16 },
    roleCaps: {
      roster: { medic: 3, support: 3, rifleman: 10 },
      active: { medic: 2, support: 2, rifleman: 9 },
    },
    armory: { weapon: 10, armor: 10, equipment: 30, total: toArmoryTotal(10, 10, 30) },
    rerollsOnLevelUp: 6,
    abilityNode: { type: "auto", abilityId: "emergency_medevac" },
    featureGates: { eliteMissions: true, extremeMissions: true },
  },
  {
    level: 9,
    xpRequiredTotal: 84000,
    roster: { total: 18, active: 8, reserve: 18 },
    roleCaps: {
      roster: { medic: 3, support: 3, rifleman: 12 },
      active: { medic: 2, support: 2, rifleman: 9 },
    },
    armory: { weapon: 10, armor: 10, equipment: 30, total: toArmoryTotal(10, 10, 30) },
    rerollsOnLevelUp: 6,
    abilityNode: {
      type: "choice",
      abilityIds: ["trauma_response", "infantry_armor"],
    },
    featureGates: { eliteMissions: true, extremeMissions: true },
  },
  {
    level: 10,
    xpRequiredTotal: 109000,
    roster: { total: 18, active: 8, reserve: 18 },
    roleCaps: {
      roster: { medic: 3, support: 3, rifleman: 14 },
      active: { medic: 2, support: 3, rifleman: 10 },
    },
    armory: { weapon: 10, armor: 10, equipment: 40, total: toArmoryTotal(10, 10, 40) },
    rerollsOnLevelUp: 6,
    abilityNode: { type: "auto", abilityId: "battle_fervor" },
    featureGates: { eliteMissions: true, extremeMissions: true },
  },
] as const;

function clampCompanyLevel(level: number): number {
  const normalized = Math.floor(Number(level) || 1);
  return Math.max(1, Math.min(MAX_COMPANY_LEVEL, normalized));
}

export function getCompanyProgressionEntry(level: number): CompanyProgressionEntry {
  const clamped = clampCompanyLevel(level);
  return (
    COMPANY_LEVEL_PROGRESSION[clamped - 1] ??
    COMPANY_LEVEL_PROGRESSION[0]
  );
}

export function getCompanyNextProgressionEntry(
  level: number,
): CompanyProgressionEntry | null {
  const current = clampCompanyLevel(level);
  if (current >= MAX_COMPANY_LEVEL) return null;
  return getCompanyProgressionEntry(current + 1);
}

export type CompanyLevelSnapshot = {
  current: CompanyProgressionEntry;
  next: CompanyProgressionEntry | null;
};

export function getCompanyLevelSnapshot(level: number): CompanyLevelSnapshot {
  return {
    current: getCompanyProgressionEntry(level),
    next: getCompanyNextProgressionEntry(level),
  };
}

function validateCompanyProgressionTable(): void {
  if (COMPANY_LEVEL_PROGRESSION.length !== MAX_COMPANY_LEVEL) {
    throw new Error(
      `[company-progression] Expected ${MAX_COMPANY_LEVEL} levels, got ${COMPANY_LEVEL_PROGRESSION.length}.`,
    );
  }

  for (let i = 0; i < COMPANY_LEVEL_PROGRESSION.length; i++) {
    const row = COMPANY_LEVEL_PROGRESSION[i];
    const expectedLevel = i + 1;
    if (row.level !== expectedLevel) {
      throw new Error(
        `[company-progression] Non-sequential level at index ${i}: expected ${expectedLevel}, got ${row.level}.`,
      );
    }
    if (i > 0) {
      const prev = COMPANY_LEVEL_PROGRESSION[i - 1];
      if (row.xpRequiredTotal < prev.xpRequiredTotal) {
        throw new Error(
          `[company-progression] XP threshold decreased at level ${row.level}.`,
        );
      }
    }
    if (row.roster.active > row.roster.total) {
      throw new Error(
        `[company-progression] Active slots exceed total roster at level ${row.level}.`,
      );
    }
    if (row.roster.reserve < row.roster.total) {
      throw new Error(
        `[company-progression] Reserve slots below total roster at level ${row.level}.`,
      );
    }
    const computedArmoryTotal =
      row.armory.weapon + row.armory.armor + row.armory.equipment;
    if (computedArmoryTotal !== row.armory.total) {
      throw new Error(
        `[company-progression] Armory total mismatch at level ${row.level}: expected ${computedArmoryTotal}, got ${row.armory.total}.`,
      );
    }
  }
}

validateCompanyProgressionTable();
