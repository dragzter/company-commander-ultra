/**
 * Gear market: weapons and armor at company average soldier level.
 * Each base has tiers 1-10. Market stocks only the tier matching avg level.
 * A predominantly level 2 company sees level 2 gear; level 5 sees level 5 gear.
 */
import type { Item } from "./items/types.ts";
import { WEAPON_BASES } from "./items/weapon-bases.ts";
import { createWeapon } from "./items/weapon-bases.ts";
import { RARE_WEAPON_BASES } from "./items/rare-weapon-bases.ts";
import { createRareWeapon } from "./items/rare-weapon-bases.ts";
import { EPIC_WEAPON_BASES } from "./items/epic-weapon-bases.ts";
import { createEpicWeapon } from "./items/epic-weapon-bases.ts";
import { ARMOR_BASES } from "./items/armor-bases.ts";
import { createArmor } from "./items/armor-bases.ts";
import { RARE_ARMOR_BASES } from "./items/rare-armor-bases.ts";
import { createRareArmor } from "./items/rare-armor-bases.ts";
import { EPIC_ARMOR_BASES } from "./items/epic-armor-bases.ts";
import { createEpicArmor } from "./items/epic-armor-bases.ts";
import type { GearLevel } from "./items/types.ts";
import { getWeaponPrice, getArmorPrice } from "./item-pricing.ts";
import { clampGearLevel } from "./items/gear-scaling.ts";

export interface GearMarketEntry {
  item: Item;
  price: number;
}

/** Market tier = avg company soldier level (1-999). Company sees gear at its level only. */
function marketTier(avgCompanyLevel: number): GearLevel {
  return clampGearLevel(avgCompanyLevel);
}

/** Min company level to see rare items. (Temporarily 1 to enable in store.) */
export const RARE_GEAR_MIN_LEVEL = 1;
/** Min company level to see epic items. (Temporarily 1 to enable in store.) */
export const EPIC_GEAR_MIN_LEVEL = 1;

/** All weapons at company level: one tier per base. Rare at lvl 2+, Epic at lvl 4+. Sorted by price. */
export function getWeaponsMarketItems(avgCompanyLevel: number, companyLevel: number): GearMarketEntry[] {
  const tier = marketTier(avgCompanyLevel);
  const entries: GearMarketEntry[] = [];
  for (const base of WEAPON_BASES) {
    const item = createWeapon(base, tier);
    entries.push({ item, price: getWeaponPrice(item) });
  }
  if (companyLevel >= RARE_GEAR_MIN_LEVEL) {
    for (const base of RARE_WEAPON_BASES) {
      if (base.storeAvailable === false) continue;
      const item = createRareWeapon(base, tier);
      entries.push({ item, price: getWeaponPrice(item) });
    }
  }
  // Epic weapons are drop-only (mission rewards), not in store
  entries.sort((a, b) => a.price - b.price);
  return entries;
}

/** All weapons including epics (for dev catalog). Not filtered by store availability. */
export function getWeaponsMarketItemsAll(tier: GearLevel): GearMarketEntry[] {
  const entries: GearMarketEntry[] = [];
  for (const base of WEAPON_BASES) {
    const item = createWeapon(base, tier);
    entries.push({ item, price: getWeaponPrice(item) });
  }
  for (const base of RARE_WEAPON_BASES) {
    const item = createRareWeapon(base, tier);
    entries.push({ item, price: getWeaponPrice(item) });
  }
  for (const base of EPIC_WEAPON_BASES) {
    const item = createEpicWeapon(base, tier);
    entries.push({ item, price: getWeaponPrice(item) });
  }
  entries.sort((a, b) => a.price - b.price);
  return entries;
}

/** All armor at company level: one tier per base. Rare at lvl 2+, Epic at lvl 4+. Sorted by price. */
export function getArmorMarketItems(avgCompanyLevel: number, companyLevel: number): GearMarketEntry[] {
  const tier = marketTier(avgCompanyLevel);
  const entries: GearMarketEntry[] = [];
  for (const base of ARMOR_BASES) {
    const item = createArmor(base, tier);
    entries.push({ item, price: getArmorPrice(item) });
  }
  if (companyLevel >= RARE_GEAR_MIN_LEVEL) {
    for (const base of RARE_ARMOR_BASES) {
      if (base.storeAvailable === false) continue;
      const minLvl = base.minLevel ?? 1;
      if (tier < minLvl) continue;
      const item = createRareArmor(base, tier);
      entries.push({ item, price: getArmorPrice(item) });
    }
  }
  // Epic armor is drop-only (mission rewards), not in store
  entries.sort((a, b) => a.price - b.price);
  return entries;
}

/** All armor including epics (for dev catalog). Not filtered by store availability. */
export function getArmorMarketItemsAll(tier: GearLevel): GearMarketEntry[] {
  const entries: GearMarketEntry[] = [];
  for (const base of ARMOR_BASES) {
    const item = createArmor(base, tier);
    entries.push({ item, price: getArmorPrice(item) });
  }
  for (const base of RARE_ARMOR_BASES) {
    const minLvl = (base as { minLevel?: number }).minLevel ?? 1;
    if (tier < minLvl) continue;
    const item = createRareArmor(base, tier);
    entries.push({ item, price: getArmorPrice(item) });
  }
  for (const base of EPIC_ARMOR_BASES) {
    const minLvl = (base as { minLevel?: number }).minLevel ?? 1;
    if (tier < minLvl) continue;
    const item = createEpicArmor(base, tier);
    entries.push({ item, price: getArmorPrice(item) });
  }
  entries.sort((a, b) => a.price - b.price);
  return entries;
}
