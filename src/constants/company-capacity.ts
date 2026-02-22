/**
 * Company capacity by level.
 * - Total: max soldiers in company
 * - Active: max soldiers deployable on missions
 * - Reserve: max soldiers that can be in reserve (same as total so all can sit in reserve)
 *
 * | Level | Total | Active | Reserve |
 * |-------|-------|--------|---------|
 * | 1     | 8     | 4      | 8       |
 * | 2     | 9     | 5      | 9       |
 * | 3     | 10    | 5      | 10      |
 * | 4     | 11    | 6      | 11      |
 * | 5     | 12    | 6      | 12      |
 * | 6     | 14    | 7      | 14      |
 * | 7     | 16    | 8      | 16      |
 * | 8     | 18    | 9      | 18      |
 * | 9     | 19    | 9      | 19      |
 * | 10    | 20    | 10     | 20      |
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
];

export const MAX_COMPANY_SIZE_LEVEL_1 = 8;

export function getMaxCompanySize(level: number): number {
  const entry = COMPANY_CAPACITY_BY_LEVEL.find((e) => e.level === level);
  return entry?.total ?? MAX_COMPANY_SIZE_LEVEL_1;
}

export function getActiveSlotsByLevel(level: number): number {
  const entry = COMPANY_CAPACITY_BY_LEVEL.find((e) => e.level === level);
  return entry?.active ?? 4;
}

export function getReserveSlotsByLevel(level: number): number {
  const entry = COMPANY_CAPACITY_BY_LEVEL.find((e) => e.level === level);
  return entry?.reserve ?? MAX_COMPANY_SIZE_LEVEL_1;
}
