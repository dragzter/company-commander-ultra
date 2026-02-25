import type { Company } from "../game/entities/company/company.ts";

/** Average level of company soldiers. Fallback 1 if no soldiers. */
export function getAverageCompanyLevel(company: Company | null | undefined): number {
  const soldiers = company?.soldiers ?? [];
  if (soldiers.length === 0) return 1;
  const sum = soldiers.reduce((a, s) => a + (s.level ?? 1), 0);
  return Math.max(1, Math.floor(sum / soldiers.length));
}
