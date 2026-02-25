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

export interface GearMarketEntry {
  item: Item;
  price: number;
}

/** Market tier = avg company soldier level (1-20). Company sees gear at its level only. */
function marketTier(avgCompanyLevel: number): GearLevel {
  const t = Math.max(1, Math.min(20, Math.floor(avgCompanyLevel)));
  return t as GearLevel;
}

/** All weapons at company level: one tier per base. Level 2 company sees level 2 gear. Sorted by price. */
export function getWeaponsMarketItems(avgCompanyLevel: number): GearMarketEntry[] {
  const tier = marketTier(avgCompanyLevel);
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

/** All armor at company level: one tier per base. Level 2 company sees level 2 gear. Sorted by price. */
export function getArmorMarketItems(avgCompanyLevel: number): GearMarketEntry[] {
  const tier = marketTier(avgCompanyLevel);
  const entries: GearMarketEntry[] = [];
  for (const base of ARMOR_BASES) {
    const item = createArmor(base, tier);
    entries.push({ item, price: getArmorPrice(item) });
  }
  for (const base of RARE_ARMOR_BASES) {
    const item = createRareArmor(base, tier);
    entries.push({ item, price: getArmorPrice(item) });
  }
  for (const base of EPIC_ARMOR_BASES) {
    const item = createEpicArmor(base, tier);
    entries.push({ item, price: getArmorPrice(item) });
  }
  entries.sort((a, b) => a.price - b.price);
  return entries;
}
