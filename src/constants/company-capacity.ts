/**
 * Company capacity by level (1-20).
 * Total: max soldiers in company. Active: deployable on missions.
 * Reserve: non-active slots; always at least total roster count.
 * Max at 20: 8 active, 18 total, 18 reserve.
 */
export const COMPANY_CAPACITY_BY_LEVEL: {
  level: number;
  total: number;
  active: number;
  reserve: number;
}[] = [
  { level: 1, total: 8, active: 4, reserve: 8 },
  { level: 2, total: 8, active: 4, reserve: 8 },
  { level: 3, total: 8, active: 5, reserve: 8 },
  { level: 4, total: 8, active: 5, reserve: 8 },
  { level: 5, total: 10, active: 5, reserve: 10 },
  { level: 6, total: 10, active: 6, reserve: 10 },
  { level: 7, total: 10, active: 6, reserve: 10 },
  { level: 8, total: 12, active: 6, reserve: 12 },
  { level: 9, total: 12, active: 7, reserve: 12 },
  { level: 10, total: 12, active: 7, reserve: 12 },
  { level: 11, total: 14, active: 7, reserve: 14 },
  { level: 12, total: 14, active: 8, reserve: 14 },
  { level: 13, total: 14, active: 8, reserve: 14 },
  { level: 14, total: 16, active: 8, reserve: 16 },
  { level: 15, total: 16, active: 8, reserve: 16 },
  { level: 16, total: 16, active: 8, reserve: 16 },
  { level: 17, total: 16, active: 8, reserve: 16 },
  { level: 18, total: 18, active: 8, reserve: 18 },
  { level: 19, total: 18, active: 8, reserve: 18 },
  { level: 20, total: 18, active: 8, reserve: 18 },
];

export const MAX_COMPANY_SIZE_LEVEL_1 = 8;
export const MAX_ACTIVE_SOLDIERS = 8;

export function getMaxCompanySize(level: number): number {
  const capped = Math.max(1, Math.min(20, level));
  const entry = COMPANY_CAPACITY_BY_LEVEL.find((e) => e.level === capped);
  return entry?.total ?? (capped >= 20 ? 18 : MAX_COMPANY_SIZE_LEVEL_1);
}

export function getActiveSlotsByLevel(level: number): number {
  const capped = Math.max(1, Math.min(20, level));
  const entry = COMPANY_CAPACITY_BY_LEVEL.find((e) => e.level === capped);
  return Math.min(MAX_ACTIVE_SOLDIERS, entry?.active ?? 4);
}

export function getReserveSlotsByLevel(level: number): number {
  const capped = Math.max(1, Math.min(20, level));
  const entry = COMPANY_CAPACITY_BY_LEVEL.find((e) => e.level === capped);
  const total = entry?.total ?? MAX_COMPANY_SIZE_LEVEL_1;
  const reserve = entry?.reserve ?? MAX_COMPANY_SIZE_LEVEL_1;
  return Math.max(total, reserve);
}
