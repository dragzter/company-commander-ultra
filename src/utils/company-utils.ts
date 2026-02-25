import type { Company } from "../game/entities/company/company.ts";

/** Average level of company soldiers, rounded up. Fallback 1 if no soldiers. */
export function getAverageCompanyLevel(company: Company | null | undefined): number {
  const soldiers = company?.soldiers ?? [];
  if (soldiers.length === 0) return 1;
  const sum = soldiers.reduce((a, s) => a + (s.level ?? 1), 0);
  return Math.max(1, Math.ceil(sum / soldiers.length));
}

/** Max level among company soldiers. Determines highest gear tier available in market. Fallback 1 if no soldiers. */
export function getMaxSoldierLevel(company: Company | null | undefined): number {
  const soldiers = company?.soldiers ?? [];
  if (soldiers.length === 0) return 1;
  return Math.max(1, ...soldiers.map((s) => s.level ?? 1));
}
