import type { Company } from "../game/entities/company/company.ts";
import { getActiveSlotsByLevel, getMaxCompanySize, getReserveSlotsByLevel } from "./company-capacity.ts";

export function getTotalCompanySlots(company: Company | null): number {
  if (!company) return 0;
  return getMaxCompanySize(company.level ?? 1);
}

export function getActiveSlots(company: Company | null): number {
  if (!company) return 0;
  return getActiveSlotsByLevel(company.level ?? 1);
}

/** Reserve slots = max company capacity for that level (8 for L1, 9 for L2, etc.) */
export function getReserveSlots(company: Company | null): number {
  if (!company) return 0;
  return getReserveSlotsByLevel(company.level ?? 1);
}

/** Total formation slots = active + reserve */
export function getTotalFormationSlots(company: Company | null): number {
  if (!company) return 0;
  return getActiveSlots(company) + getReserveSlots(company);
}

/** Get formation slots (soldier ID per slot). Initializes from soldiers order if missing. */
export function getFormationSlots(company: Company | null): (string | null)[] {
  if (!company) return [];
  const total = getTotalFormationSlots(company);
  const soldiers = company.soldiers ?? [];
  const validIds = new Set(soldiers.map((s) => s.id));
  const existing = company.formationSlots;
  if (Array.isArray(existing) && existing.length === total) {
    return existing.map((id) => (id != null && validIds.has(id) ? id : null));
  }
  const ids = soldiers.map((s) => s.id);
  const slots: (string | null)[] = [];
  for (let i = 0; i < total; i++) slots.push(ids[i] ?? null);
  return slots;
}

/** Get soldier by ID from company */
export function getSoldierById(company: Company | null, id: string) {
  return company?.soldiers?.find((s) => s.id === id) ?? null;
}

export function getMaxMedicSlots(company: Company | null): number {
  return company?.resourceProfile?.soldier_mission_slots?.medic ?? 0;
}

export function getMaxSupportSlots(company: Company | null): number {
  return company?.resourceProfile?.soldier_mission_slots?.support ?? 0;
}
