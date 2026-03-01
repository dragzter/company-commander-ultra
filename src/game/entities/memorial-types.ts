/** Entry for a fallen soldier displayed on the Memorial Wall. */
export interface MemorialEntry {
  name: string;
  level: number;
  role?: string;
  missionName: string;
  /** Kills recorded in the final mission (legacy label support). */
  enemiesKilled: number;
  /** Lifetime missions completed at time of death. */
  missionsCompleted?: number;
  /** Lifetime total kills at time of death. */
  totalKills?: number;
  /** Kills recorded in the final mission where soldier died. */
  missionKills?: number;
  killedBy?: string;
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
    role: (item as MemorialEntry).role,
    missionName,
    enemiesKilled: (item as MemorialEntry).enemiesKilled ?? enemiesKilled,
    missionsCompleted: (item as MemorialEntry).missionsCompleted ?? 0,
    totalKills: (item as MemorialEntry).totalKills ?? ((item as MemorialEntry).enemiesKilled ?? enemiesKilled),
    missionKills: (item as MemorialEntry).missionKills ?? ((item as MemorialEntry).enemiesKilled ?? enemiesKilled),
    killedBy: (item as MemorialEntry).killedBy,
  };
}
