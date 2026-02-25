/**
 * Gear catalog: unified lookup for all weapons and armor by baseId + level.
 * Stats are predetermined—e.g. savior_smg at level 10 always has the same stats.
 * Supports drops and reference lookups.
 */
import type { Item } from "./items/types.ts";
import type { GearLevel } from "./items/types.ts";
import { WEAPON_BASES, createWeapon } from "./items/weapon-bases.ts";
import { RARE_WEAPON_BASES, createRareWeapon } from "./items/rare-weapon-bases.ts";
import { EPIC_WEAPON_BASES, createEpicWeapon } from "./items/epic-weapon-bases.ts";
import { ARMOR_BASES, createArmor } from "./items/armor-bases.ts";
import { RARE_ARMOR_BASES, createRareArmor } from "./items/rare-armor-bases.ts";
import { EPIC_ARMOR_BASES, createEpicArmor } from "./items/epic-armor-bases.ts";

type WeaponBase = (typeof WEAPON_BASES)[0] | (typeof RARE_WEAPON_BASES)[0] | (typeof EPIC_WEAPON_BASES)[0];
type ArmorBase = (typeof ARMOR_BASES)[0] | (typeof RARE_ARMOR_BASES)[0] | (typeof EPIC_ARMOR_BASES)[0];

const WEAPON_LOOKUP = new Map<string, { base: WeaponBase; creator: "common" | "rare" | "epic" }>();
const ARMOR_LOOKUP = new Map<string, { base: ArmorBase; creator: "common" | "rare" | "epic" }>();

for (const b of WEAPON_BASES) WEAPON_LOOKUP.set(b.baseId, { base: b, creator: "common" });
for (const b of RARE_WEAPON_BASES) WEAPON_LOOKUP.set(b.baseId, { base: b, creator: "rare" });
for (const b of EPIC_WEAPON_BASES) WEAPON_LOOKUP.set(b.baseId, { base: b, creator: "epic" });
for (const b of ARMOR_BASES) ARMOR_LOOKUP.set(b.baseId, { base: b, creator: "common" });
for (const b of RARE_ARMOR_BASES) ARMOR_LOOKUP.set(b.baseId, { base: b, creator: "rare" });
for (const b of EPIC_ARMOR_BASES) ARMOR_LOOKUP.set(b.baseId, { base: b, creator: "epic" });

/** Create a weapon by baseId and level (1–20). Returns null if baseId unknown. */
export function createWeaponByBaseId(baseId: string, level: GearLevel): Item | null {
  const entry = WEAPON_LOOKUP.get(baseId);
  if (!entry) return null;
  const { base, creator } = entry;
  const tier = Math.max(1, Math.min(20, level)) as GearLevel;
  if (creator === "common") return createWeapon(base as (typeof WEAPON_BASES)[0], tier);
  if (creator === "rare") return createRareWeapon(base as (typeof RARE_WEAPON_BASES)[0], tier);
  return createEpicWeapon(base as (typeof EPIC_WEAPON_BASES)[0], tier);
}

/** Create armor by baseId and level (1–20). Returns null if baseId unknown or level below minLevel. */
export function createArmorByBaseId(baseId: string, level: GearLevel): Item | null {
  const entry = ARMOR_LOOKUP.get(baseId);
  if (!entry) return null;
  const { base, creator } = entry;
  const tier = Math.max(1, Math.min(20, level)) as GearLevel;
  const baseWithMin = base as { minLevel?: number };
  if (baseWithMin.minLevel != null && tier < baseWithMin.minLevel) return null;
  if (creator === "common") return createArmor(base as (typeof ARMOR_BASES)[0], tier);
  if (creator === "rare") return createRareArmor(base as (typeof RARE_ARMOR_BASES)[0], tier);
  return createEpicArmor(base as (typeof EPIC_ARMOR_BASES)[0], tier);
}

/** All epic weapon baseIds (for drops). */
export const EPIC_WEAPON_BASE_IDS = EPIC_WEAPON_BASES.map((b) => b.baseId);
/** All epic armor baseIds (for drops). */
export const EPIC_ARMOR_BASE_IDS = EPIC_ARMOR_BASES.map((b) => b.baseId);
/** All rare weapon baseIds (for drops). */
export const RARE_WEAPON_BASE_IDS = RARE_WEAPON_BASES.map((b) => b.baseId);
/** All rare armor baseIds (for drops). */
export const RARE_ARMOR_BASE_IDS = RARE_ARMOR_BASES.map((b) => b.baseId);

/** Rare armor baseIds valid at given level (respects minLevel). */
export function getRareArmorBaseIdsForLevel(level: number): string[] {
  return RARE_ARMOR_BASES.filter((b) => (b.minLevel ?? 1) <= level).map((b) => b.baseId);
}
/** Epic armor baseIds valid at given level (respects minLevel). */
export function getEpicArmorBaseIdsForLevel(level: number): string[] {
  return EPIC_ARMOR_BASES.filter((b) => ((b as { minLevel?: number }).minLevel ?? 1) <= level).map((b) => b.baseId);
}

export function pickRandomFrom<T>(arr: T[]): T | undefined {
  return arr[Math.floor(Math.random() * arr.length)];
}
