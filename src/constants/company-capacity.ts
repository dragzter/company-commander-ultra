/**
 * Company capacity by level (1-20).
 * Total: max soldiers. Active: deployable on missions. Reserve: same as total.
 */
export const COMPANY_CAPACITY_BY_LEVEL: {
  level: number;
  total: number;
  active: number;
  reserve: number;
}[] = [
  { level: 1, total: 8, active: 4, reserve: 8 },
  { level: 2, total: 9, active: 5, reserve: 9 },
  { level: 3, total: 10, active: 5, reserve: 10 },
  { level: 4, total: 11, active: 6, reserve: 11 },
  { level: 5, total: 12, active: 6, reserve: 12 },
  { level: 6, total: 14, active: 7, reserve: 14 },
  { level: 7, total: 16, active: 8, reserve: 16 },
  { level: 8, total: 18, active: 9, reserve: 18 },
  { level: 9, total: 19, active: 9, reserve: 19 },
  { level: 10, total: 20, active: 10, reserve: 20 },
  { level: 11, total: 22, active: 11, reserve: 22 },
  { level: 12, total: 24, active: 12, reserve: 24 },
  { level: 13, total: 26, active: 13, reserve: 26 },
  { level: 14, total: 28, active: 14, reserve: 28 },
  { level: 15, total: 30, active: 15, reserve: 30 },
  { level: 16, total: 32, active: 16, reserve: 32 },
  { level: 17, total: 34, active: 17, reserve: 34 },
  { level: 18, total: 36, active: 18, reserve: 36 },
  { level: 19, total: 38, active: 19, reserve: 38 },
  { level: 20, total: 40, active: 20, reserve: 40 },
];

export const MAX_COMPANY_SIZE_LEVEL_1 = 8;

export function getMaxCompanySize(level: number): number {
  const capped = Math.max(1, Math.min(20, level));
  const entry = COMPANY_CAPACITY_BY_LEVEL.find((e) => e.level === capped);
  return entry?.total ?? (capped >= 20 ? 40 : MAX_COMPANY_SIZE_LEVEL_1);
}

export function getActiveSlotsByLevel(level: number): number {
  const capped = Math.max(1, Math.min(20, level));
  const entry = COMPANY_CAPACITY_BY_LEVEL.find((e) => e.level === capped);
  return entry?.active ?? 4;
}

export function getReserveSlotsByLevel(level: number): number {
  const capped = Math.max(1, Math.min(20, level));
  const entry = COMPANY_CAPACITY_BY_LEVEL.find((e) => e.level === capped);
  return entry?.reserve ?? MAX_COMPANY_SIZE_LEVEL_1;
}
