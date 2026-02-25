/**
 * Company capacity by level (1-20).
 * Total: max soldiers in company. Active: deployable on missions. Reserve: formation slots for non-active.
 * Max at 20: 10 active, 20 total.
 * Asymmetric progression: uneven plateaus, "trap" levels (total up or active up without the other).
 */
export const COMPANY_CAPACITY_BY_LEVEL: {
  level: number;
  total: number;
  active: number;
  reserve: number;
}[] = [
  { level: 1, total: 8, active: 4, reserve: 4 },
  { level: 2, total: 8, active: 4, reserve: 4 },
  { level: 3, total: 8, active: 5, reserve: 3 },
  { level: 4, total: 8, active: 5, reserve: 3 },
  { level: 5, total: 10, active: 5, reserve: 5 },
  { level: 6, total: 10, active: 6, reserve: 4 },
  { level: 7, total: 10, active: 6, reserve: 4 },
  { level: 8, total: 12, active: 6, reserve: 6 },
  { level: 9, total: 12, active: 7, reserve: 5 },
  { level: 10, total: 12, active: 7, reserve: 5 },
  { level: 11, total: 14, active: 7, reserve: 7 },
  { level: 12, total: 14, active: 8, reserve: 6 },
  { level: 13, total: 14, active: 8, reserve: 6 },
  { level: 14, total: 16, active: 8, reserve: 8 },
  { level: 15, total: 16, active: 8, reserve: 8 },
  { level: 16, total: 16, active: 9, reserve: 7 },
  { level: 17, total: 16, active: 9, reserve: 7 },
  { level: 18, total: 18, active: 9, reserve: 9 },
  { level: 19, total: 18, active: 9, reserve: 9 },
  { level: 20, total: 20, active: 10, reserve: 10 },
];

export const MAX_COMPANY_SIZE_LEVEL_1 = 8;

export function getMaxCompanySize(level: number): number {
  const capped = Math.max(1, Math.min(20, level));
  const entry = COMPANY_CAPACITY_BY_LEVEL.find((e) => e.level === capped);
  return entry?.total ?? (capped >= 20 ? 20 : MAX_COMPANY_SIZE_LEVEL_1);
}

export function getActiveSlotsByLevel(level: number): number {
  const capped = Math.max(1, Math.min(20, level));
  const entry = COMPANY_CAPACITY_BY_LEVEL.find((e) => e.level === capped);
  return entry?.active ?? 4;
}

export function getReserveSlotsByLevel(level: number): number {
  const capped = Math.max(1, Math.min(20, level));
  const entry = COMPANY_CAPACITY_BY_LEVEL.find((e) => e.level === capped);
  return entry?.reserve ?? 4;
}
