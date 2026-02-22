import type { Soldier } from "../types.ts";
import type { Item, TargetType } from "../../../constants/items/types.ts";
import type { EffectResult, EffectType } from "../effects/effect.ts";

export interface Company {
  soldiers: Soldier[];
  name: string;
  level: number;
  experience: number;
  companyName: string;
  commander: string;
  inventory: Item[];
  resourceProfile: CompanyResourcesProfile;
}

export type CompanyDamageAbilityEffect = {
  type: EffectType;
  effect_value?: number;
  attacks: number;
  attack_frequency: number;
  description?: string;
  result?: EffectResult;
  target: TargetType;
  chance_to_hit: number;
};

export type CompanyEnhancementAbilityEffect = {
  type: EffectType;
  effect_value?: number;
  applications: number;
  application_frequency: number;
  description?: string;
  result?: EffectResult;
  target: TargetType;
  chance_to_succeed: number;
};

export type CompanyAbility = {
  name: string;
  id: string;
  icon?: string;
  effect: CompanyDamageAbilityEffect | CompanyEnhancementAbilityEffect;
  cost: number;
  company_level: number;
};

export type CommanderAbility = {
  name: string;
  effect: object;
  uses: number;
  ability_level: number;
};

import {
  getMaxCompanySize as getMaxCompanySizeFromCapacity,
  MAX_COMPANY_SIZE_LEVEL_1 as CAPACITY_LEVEL_1,
} from "../../../constants/company-capacity.ts";

/** Max company size at level 1 (4 active, 8 total, 8 reserve) */
export const MAX_COMPANY_SIZE_LEVEL_1 = CAPACITY_LEVEL_1;

export function getMaxCompanySize(level: number): number {
  return getMaxCompanySizeFromCapacity(level);
}

export type CompanyResourcesProfile = {
  level: number;
  soldier_slots: {
    medic: number;
    support: number;
    rifleman: number;
  };
  soldier_mission_slots: {
    medic: number;
    support: number;
    rifleman: number;
  };
  company_abilities: CompanyAbility[];
  commander_abilities: CommanderAbility[];
};

/**
 * What a company gets at every level
 */
export const COMPANY_RESOURCES_BY_LEVEL: CompanyResourcesProfile[] = [
  {
    level: 1,
    soldier_slots: {
      medic: 1,
      support: 2,
      rifleman: 5,
    },
    company_abilities: [],
    commander_abilities: [],
    soldier_mission_slots: {
      medic: 1,
      support: 1,
      rifleman: 2,
    },
  },
  {
    level: 2,
    soldier_slots: {
      medic: 0,
      support: 1,
      rifleman: 6,
    },
    company_abilities: [],
    commander_abilities: [],
    soldier_mission_slots: {
      medic: 0,
      support: 1,
      rifleman: 5,
    },
  },
  {
    level: 3,
    soldier_slots: {
      medic: 0,
      support: 1,
      rifleman: 8,
    },
    company_abilities: [],
    commander_abilities: [],
    soldier_mission_slots: {
      medic: 0,
      support: 1,
      rifleman: 7,
    },
  },
  {
    level: 4,
    soldier_slots: {
      medic: 1,
      support: 1,
      rifleman: 8,
    },
    company_abilities: [],
    commander_abilities: [],
    soldier_mission_slots: {
      medic: 1,
      support: 1,
      rifleman: 7,
    },
  },
  {
    level: 5,
    soldier_slots: {
      medic: 1,
      support: 1,
      rifleman: 10,
    },
    company_abilities: [],
    commander_abilities: [],
    soldier_mission_slots: {
      medic: 1,
      support: 1,
      rifleman: 8,
    },
  },
  {
    level: 6,
    soldier_slots: {
      medic: 1,
      support: 2,
      rifleman: 12,
    },
    company_abilities: [],
    commander_abilities: [],
    soldier_mission_slots: {
      medic: 1,
      support: 1,
      rifleman: 10,
    },
  },
  {
    level: 7,
    soldier_slots: {
      medic: 2,
      support: 2,
      rifleman: 13,
    },
    company_abilities: [],
    commander_abilities: [],
    soldier_mission_slots: {
      medic: 1,
      support: 1,
      rifleman: 12,
    },
  },
  {
    level: 8,
    soldier_slots: {
      medic: 2,
      support: 2,
      rifleman: 15,
    },
    company_abilities: [],
    commander_abilities: [],
    soldier_mission_slots: {
      medic: 1,
      support: 2,
      rifleman: 14,
    },
  },
  {
    level: 9,
    soldier_slots: {
      medic: 3,
      support: 4,
      rifleman: 18,
    },
    company_abilities: [],
    commander_abilities: [],
    soldier_mission_slots: {
      medic: 2,
      support: 2,
      rifleman: 16,
    },
  },
  {
    level: 10,
    soldier_slots: {
      medic: 4,
      support: 4,
      rifleman: 24,
    },
    company_abilities: [],
    commander_abilities: [],
    soldier_mission_slots: {
      medic: 2,
      support: 2,
      rifleman: 20,
    },
  },
];
