/**
 * Gear market: weapons and armor for sale based on company level.
 * Items are scaled to tier (1 to companyLevel), sorted by price cheapest first.
 */
import type { Item } from "./items/types.ts";
import { WEAPON_BASES } from "./items/weapon-bases.ts";
import { createWeapon } from "./items/weapon-bases.ts";
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

/** Max tier available in market = company level, capped 1-10 */
function maxTier(companyLevel: number): GearLevel {
  const t = Math.max(1, Math.min(10, companyLevel));
  return t as GearLevel;
}

/** All weapon items (tiers 1 to companyLevel), sorted by price cheapest first */
export function getWeaponsMarketItems(companyLevel: number): GearMarketEntry[] {
  const cap = maxTier(companyLevel);
  const entries: GearMarketEntry[] = [];
  for (const base of WEAPON_BASES) {
    for (let t = 1; t <= cap; t++) {
      const item = createWeapon(base, t as GearLevel);
      entries.push({ item, price: getWeaponPrice(item) });
    }
  }
  entries.sort((a, b) => a.price - b.price);
  return entries;
}

/** All armor items: common (all bases), rare, epic. Tiers 1 to companyLevel. Sorted by price. */
export function getArmorMarketItems(companyLevel: number): GearMarketEntry[] {
  const cap = maxTier(companyLevel);
  const entries: GearMarketEntry[] = [];
  for (const base of ARMOR_BASES) {
    for (let t = 1; t <= cap; t++) {
      const item = createArmor(base, t as GearLevel);
      entries.push({ item, price: getArmorPrice(item) });
    }
  }
  for (const base of RARE_ARMOR_BASES) {
    for (let t = 1; t <= cap; t++) {
      const item = createRareArmor(base, t as GearLevel);
      entries.push({ item, price: getArmorPrice(item) });
    }
  }
  for (const base of EPIC_ARMOR_BASES) {
    for (let t = 1; t <= cap; t++) {
      const item = createEpicArmor(base, t as GearLevel);
      entries.push({ item, price: getArmorPrice(item) });
    }
  }
  entries.sort((a, b) => a.price - b.price);
  return entries;
}
