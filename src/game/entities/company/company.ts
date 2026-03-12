import type { Soldier } from "../types.ts";
import type { Item, TargetType } from "../../../constants/items/types.ts";
import type { EffectResult, EffectType } from "../effects/effect.ts";

export interface Company {
  soldiers: Soldier[];
  /** Slot index -> soldier ID. Length = activeSlots + reserveSlots. Enables placing soldiers in any slot. */
  formationSlots?: (string | null)[];
  name: string;
  level: number;
  experience: number;
  companyName: string;
  commander: string;
  inventory: Item[];
  /** Items that didn't fit in armory (e.g. mission rewards when full). Player can claim later. */
  holding_inventory?: Item[];
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
import { COMPANY_LEVEL_PROGRESSION } from "../../../constants/company-progression.ts";

/** Max company size at level 1 (4 active, 8 total) */
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
 * What a company gets at every level.
 * soldier_slots: max medic/support/rifleman in roster. rifleman = total - medic - support.
 * soldier_mission_slots: max medic/support that can be active. Rifleman unlimited (fills remaining slots).
 */
export const COMPANY_RESOURCES_BY_LEVEL: CompanyResourcesProfile[] = [
  ...COMPANY_LEVEL_PROGRESSION.map((p) => ({
    level: p.level,
    soldier_slots: {
      medic: p.roleCaps.roster.medic,
      support: p.roleCaps.roster.support,
      rifleman: p.roleCaps.roster.rifleman,
    },
    company_abilities: [],
    commander_abilities: [],
    soldier_mission_slots: {
      medic: p.roleCaps.active.medic,
      support: p.roleCaps.active.support,
      rifleman: p.roleCaps.active.rifleman,
    },
  })),
];
