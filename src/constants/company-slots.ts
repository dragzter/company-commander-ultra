import type { Company } from "../game/entities/company/company.ts";
import { getActiveSlotsByLevel, getMaxCompanySize } from "./company-capacity.ts";

export function getTotalCompanySlots(company: Company | null): number {
  if (!company) return 0;
  return getMaxCompanySize(company.level ?? 1);
}

export function getActiveSlots(company: Company | null): number {
  if (!company) return 0;
  return getActiveSlotsByLevel(company.level ?? 1);
}

export function getMaxMedicSlots(company: Company | null): number {
  return company?.resourceProfile?.soldier_mission_slots?.medic ?? 0;
}

export function getMaxSupportSlots(company: Company | null): number {
  return company?.resourceProfile?.soldier_mission_slots?.support ?? 0;
}
