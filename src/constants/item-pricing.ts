/**
 * Price gear based on stats. Armor: toughness + mitigation contribution.
 * Rare +10%, Epic +20% on top of base. Weapons: damage + speed.
 */
import type { Item } from "./items/types.ts";
import { RARITY } from "./items/types.ts";

const ARMOR_PRICE_PER_TGH = 3;
const ARMOR_PRICE_PER_MIT_PCT = 8; // Per 1% mitigation equivalent
const RARE_MULTIPLIER = 1.2; // 20% more (10% + 10% from transcript)
const EPIC_MULTIPLIER = 1.32; // 20% on top of rare

const WEAPON_PRICE_PER_DMG = 5;
const WEAPON_PRICE_PER_SPEED = 3;
const WEAPON_BASE = 20;

/** Mitigation from toughness: rough approx. toughness/9 gives ~% mitigation */
function toughnessToMitigationPct(toughness: number): number {
  return Math.min(50, Math.floor((toughness / 9) * 10)) / 10;
}

/** Compute armor price from toughness + mitigation. Bonuses add value. */
export function getArmorPrice(item: Item): number {
  const tgh = item.toughness ?? 0;
  const mitPct = toughnessToMitigationPct(tgh);
  let base = tgh * ARMOR_PRICE_PER_TGH + mitPct * ARMOR_PRICE_PER_MIT_PCT;

  // Bonus stats add value
  const bonuses = (item as Item & { bonuses?: Array<{ type: string; stat: string; value: number }> }).bonuses ?? [];
  for (const b of bonuses) {
    if (b.type === "flat") {
      base += b.value * 4; // Flat stats add ~4 per point
    } else {
      base += b.value * 12; // Percent bonuses add ~12 per %
    }
  }

  // Passive effect (epic) adds value
  const passive = (item as Item & { passiveEffect?: string }).passiveEffect;
  if (passive) base *= 1.15;

  const rarity = item.rarity ?? "common";
  if (rarity === RARITY.rare) base *= RARE_MULTIPLIER;
  else if (rarity === RARITY.epic) base *= EPIC_MULTIPLIER;

  return Math.max(50, Math.round(base));
}

/** Compute weapon price from damage + speed. */
export function getWeaponPrice(item: Item): number {
  const dmg = item.damage ?? 0;
  const spd = item.speed_base ?? 5;
  const base = WEAPON_BASE + dmg * WEAPON_PRICE_PER_DMG + spd * WEAPON_PRICE_PER_SPEED;
  return Math.max(30, Math.round(base));
}
