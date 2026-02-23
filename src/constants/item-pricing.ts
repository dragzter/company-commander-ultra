/**
 * Price gear based on stats. Armor: toughness + mitigation. Rare +75% (min 450), Epic +180% (min 850).
 * Ensures rare > common, epic > rare. Weapons: damage + speed.
 */
import type { Item } from "./items/types.ts";
import { RARITY } from "./items/types.ts";

const ARMOR_PRICE_PER_TGH = 11;
const ARMOR_PRICE_PER_MIT_PCT = 30; // Per 1% mitigation equivalent
const ARMOR_RARE_MULTIPLIER = 1.75; // 75% more for rare armor
const ARMOR_EPIC_MULTIPLIER = 2.8; // 180% more for epic armor
const ARMOR_RARE_MIN = 450; // Cheapest rare must exceed typical common
const ARMOR_EPIC_MIN = 850; // Cheapest epic must exceed typical rare

const WEAPON_PRICE_PER_DMG = 18;
const WEAPON_PRICE_PER_SPEED = 11;
const WEAPON_BASE = 85;
const WEAPON_RARE_MULTIPLIER = 1.6;
const WEAPON_EPIC_MULTIPLIER = 2.4;
const WEAPON_RARE_MIN = 280;
const WEAPON_EPIC_MIN = 520;

/** Mitigation from toughness: rough approx. toughness/9 gives ~% mitigation */
function toughnessToMitigationPct(toughness: number): number {
  return Math.min(50, Math.floor((toughness / 9) * 10)) / 10;
}

/** Compute armor price from toughness + mitigation. Bonuses add value. */
export function getArmorPrice(item: Item): number {
  const tgh = item.toughness ?? 0;
  const mitPct = toughnessToMitigationPct(tgh);
  let base = tgh * ARMOR_PRICE_PER_TGH + mitPct * ARMOR_PRICE_PER_MIT_PCT;

  // Bonus stats add value – flat and percent bonuses worth more
  const bonuses = (item as Item & { bonuses?: Array<{ type: string; stat: string; value: number }> }).bonuses ?? [];
  for (const b of bonuses) {
    if (b.type === "flat") {
      base += b.value * 12; // Flat stats (HP, TGH, DEX, AWR, MOR) add ~12 per point
    } else {
      base += b.value * 24; // Percent bonuses (MIT, AVD) add ~24 per %
    }
  }

  // Passive effect (epic) adds value
  const passive = (item as Item & { passiveEffect?: string }).passiveEffect;
  if (passive) base *= 1.15;

  const rarity = item.rarity ?? "common";
  let price: number;
  if (rarity === RARITY.rare) {
    price = Math.round(base * ARMOR_RARE_MULTIPLIER);
    price = Math.max(ARMOR_RARE_MIN, price);
  } else if (rarity === RARITY.epic) {
    price = Math.round(base * ARMOR_EPIC_MULTIPLIER);
    price = Math.max(ARMOR_EPIC_MIN, price);
  } else {
    price = Math.round(base);
  }
  return Math.max(180, price);
}

/** Compute weapon price from damage + speed. Rare +60%, Epic +140%. Ensures rare > common, epic > rare. */
export function getWeaponPrice(item: Item): number {
  const dmg =
    item.damage_min != null && item.damage_max != null
      ? (item.damage_min + item.damage_max) / 2
      : (item.damage ?? 0);
  const spd = item.speed_base ?? 5;
  const base = WEAPON_BASE + dmg * WEAPON_PRICE_PER_DMG + spd * WEAPON_PRICE_PER_SPEED;
  const rarity = item.rarity ?? "common";
  let price: number;
  if (rarity === RARITY.rare) {
    price = Math.round(base * WEAPON_RARE_MULTIPLIER);
    price = Math.max(WEAPON_RARE_MIN, price);
  } else if (rarity === RARITY.epic) {
    price = Math.round(base * WEAPON_EPIC_MULTIPLIER);
    price = Math.max(WEAPON_EPIC_MIN, price);
  } else {
    price = Math.round(base);
  }
  return Math.max(120, price);
}
