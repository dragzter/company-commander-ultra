/** Entry for a fallen soldier displayed on the Memorial Wall. */
export interface MemorialEntry {
  name: string;
  level: number;
  missionName: string;
  enemiesKilled: number;
}

/** Normalize legacy Soldier objects to MemorialEntry for backward compatibility. */
export function toMemorialEntry(
  item: MemorialEntry | { name?: string; level?: number; combatProfile?: unknown },
  missionName = "Unknown",
  enemiesKilled = 0,
): MemorialEntry {
  if ("missionName" in item && typeof item.missionName === "string") {
    return item as MemorialEntry;
  }
  return {
    name: (item as { name?: string }).name ?? "Unknown",
    level: (item as { level?: number }).level ?? 1,
    missionName,
    enemiesKilled: (item as MemorialEntry).enemiesKilled ?? enemiesKilled,
  };
}
