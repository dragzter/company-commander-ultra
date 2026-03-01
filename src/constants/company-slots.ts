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

export type FormationRole = "rifleman" | "support" | "medic";

export type ActiveRoleCounts = {
  rifleman: number;
  support: number;
  medic: number;
  activeFilled: number;
  activeCapacity: number;
  maxSupport: number;
  maxMedic: number;
};

function getFormationRole(designation: string | undefined): FormationRole {
  const role = (designation ?? "rifleman").toLowerCase();
  if (role === "support") return "support";
  if (role === "medic") return "medic";
  return "rifleman";
}

function computeActiveRoleCountsFromSlots(company: Company | null, slots: (string | null)[]): ActiveRoleCounts {
  const activeCapacity = getActiveSlots(company);
  const counts: ActiveRoleCounts = {
    rifleman: 0,
    support: 0,
    medic: 0,
    activeFilled: 0,
    activeCapacity,
    maxSupport: getMaxSupportSlots(company),
    maxMedic: getMaxMedicSlots(company),
  };
  for (let i = 0; i < activeCapacity; i++) {
    const sid = slots[i];
    if (!sid) continue;
    const soldier = getSoldierById(company, sid);
    if (!soldier) continue;
    counts.activeFilled += 1;
    const role = getFormationRole(soldier.designation);
    counts[role] += 1;
  }
  return counts;
}

export function getActiveRoleCounts(company: Company | null): ActiveRoleCounts {
  return computeActiveRoleCountsFromSlots(company, getFormationSlots(company));
}

export function getActiveRoleSummaryText(company: Company | null): string {
  const c = getActiveRoleCounts(company);
  return `${c.rifleman}/${c.activeCapacity} R · ${c.support}/${c.maxSupport} Support · ${c.medic}/${c.maxMedic} Medic`;
}

export function isFormationReassignmentAllowed(
  company: Company | null,
  fromSlot: number,
  toSlot: number,
): boolean {
  const slots = getFormationSlots(company);
  if (fromSlot < 0 || toSlot < 0 || fromSlot >= slots.length || toSlot >= slots.length || fromSlot === toSlot) {
    return false;
  }
  const sourceId = slots[fromSlot];
  if (!sourceId) return false;

  const activeCapacity = getActiveSlots(company);
  const sourceSoldier = getSoldierById(company, sourceId);
  const sourceRole = getFormationRole(sourceSoldier?.designation);
  const currentCounts = computeActiveRoleCountsFromSlots(company, slots);

  // If a reserve medic/support is selected while that role is already capped in active slots,
  // block all moves targeting active slots (including swaps).
  if (
    fromSlot >= activeCapacity
    && toSlot < activeCapacity
    && (sourceRole === "support" || sourceRole === "medic")
  ) {
    const cap = sourceRole === "support" ? currentCounts.maxSupport : currentCounts.maxMedic;
    const current = sourceRole === "support" ? currentCounts.support : currentCounts.medic;
    if (current >= cap) return false;
  }

  const next = slots.slice();
  const targetId = next[toSlot];
  if (targetId) {
    next[toSlot] = sourceId;
    next[fromSlot] = targetId;
  } else {
    next[toSlot] = sourceId;
    next[fromSlot] = null;
  }

  const nextCounts = computeActiveRoleCountsFromSlots(company, next);
  if (nextCounts.support > nextCounts.maxSupport) return false;
  if (nextCounts.medic > nextCounts.maxMedic) return false;
  return true;
}
