import {
  MAX_COMPANY_LEVEL,
  getCompanyProgressionEntry,
} from "./company-progression.ts";

/**
 * Company capacity by level (1-10).
 * Total: max soldiers in company. Active: deployable on missions.
 * Reserve: non-active slots; always at least total roster count.
 * Max at 10: 8 active, 18 total, 18 reserve.
 */
export const COMPANY_CAPACITY_BY_LEVEL: {
  level: number;
  total: number;
  active: number;
  reserve: number;
}[] = [
  ...Array.from({ length: MAX_COMPANY_LEVEL }, (_, i) => {
    const p = getCompanyProgressionEntry(i + 1);
    return {
      level: p.level,
      total: p.roster.total,
      active: p.roster.active,
      reserve: p.roster.reserve,
    };
  }),
];

export const MAX_COMPANY_SIZE_LEVEL_1 = getCompanyProgressionEntry(1).roster.total;
export const MAX_ACTIVE_SOLDIERS = getCompanyProgressionEntry(MAX_COMPANY_LEVEL).roster.active;
export const MAX_COMPANY_SIZE = getCompanyProgressionEntry(MAX_COMPANY_LEVEL).roster.total;

export function getMaxCompanySize(level: number): number {
  const p = getCompanyProgressionEntry(level);
  return p.roster.total;
}

export function getActiveSlotsByLevel(level: number): number {
  const p = getCompanyProgressionEntry(level);
  return Math.min(MAX_ACTIVE_SOLDIERS, p.roster.active);
}

export function getReserveSlotsByLevel(level: number): number {
  const p = getCompanyProgressionEntry(level);
  const total = p.roster.total;
  const reserve = p.roster.reserve;
  return Math.max(total, reserve);
}
