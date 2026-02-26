/**
 * ITEM SPECIAL EFFECTS — PRIMARY DICTIONARY
 * =========================================
 * Do NOT overwrite or regress this file. This is the canonical source for
 * all item effects that can be attached to rare/epic armors and other items.
 *
 * Each effect has: name, description, and optional concrete bonuses.
 * - name = effect box label (displayed as the header)
 * - description = effect box body (displayed below the name)
 * - bonuses = flat stat enhancements (+4 DEX, +10 AWR) — always in Bonuses box, never scale
 *
 * Combat modifiers (immunities, incap multiplier, duration reduction) are also defined here.
 */
import type { ArmorImmunity } from "./items/epic-armor-bases.ts";
import type { ArmorBonus } from "./items/types.ts";

export type ItemSpecialEffectId =
  | "infantry_grunt"
  | "unshakeable"
  | "relentless"
  | "sturdy"
  | "fearless"
  | "dragonskin"
  | "commissar"
  | "visionary"
  | "flame_ward";

export interface ItemSpecialEffect {
  id: ItemSpecialEffectId;
  name: string;
  description: string;
  /** Stat bonuses — shown in Bonuses box, never scale */
  bonuses?: ArmorBonus[];
  /** Immunities granted */
  immunities?: ArmorImmunity[];
  /** Incapacitation chance multiplier at 0 HP (1.6 = 60% higher to be incapacitated vs KIA) */
  incapChanceMultiplier?: number;
  /** Duration reduction (0.25 = 25% reduction). Used by combat for stun/panic/etc. */
  durationReduction?: {
    stun?: number;
    panic?: number;
    suppression?: number;
    burning?: number;
    blind?: number;
  };
}

export const ITEM_SPECIAL_EFFECTS: Record<ItemSpecialEffectId, ItemSpecialEffect> = {
  infantry_grunt: {
    id: "infantry_grunt",
    name: "Infantry Grunt",
    description: "Immune to stun and panic.",
    immunities: ["stun", "panic"],
  },
  unshakeable: {
    id: "unshakeable",
    name: "Unshakeable",
    description: "Immune to panic and suppression.",
    immunities: ["panic", "suppression"],
  },
  relentless: {
    id: "relentless",
    name: "Relentless",
    description: "60% higher chance to be incapacitated instead of KIA when reaching 0 HP.",
    incapChanceMultiplier: 1.6,
  },
  sturdy: {
    id: "sturdy",
    name: "Sturdy",
    description: "Reduces stun duration by 25%.",
    bonuses: [{ type: "flat", stat: "toughness", value: 4 }],
    durationReduction: { stun: 0.25 },
  },
  fearless: {
    id: "fearless",
    name: "Fearless",
    description: "Reduces suppressed duration by 50%.",
    bonuses: [{ type: "flat", stat: "morale", value: 6 }],
    durationReduction: { suppression: 0.5 },
  },
  dragonskin: {
    id: "dragonskin",
    name: "Dragonskin",
    description: "Reduces burning duration by 25%.",
    bonuses: [{ type: "flat", stat: "hp", value: 10 }],
    durationReduction: { burning: 0.25 },
  },
  commissar: {
    id: "commissar",
    name: "Commissar",
    description: "Reduces panic duration by 40%.",
    bonuses: [{ type: "flat", stat: "morale", value: 10 }],
    durationReduction: { panic: 0.4 },
  },
  visionary: {
    id: "visionary",
    name: "Visionary",
    description: "Reduces blinded duration by 20%.",
    bonuses: [{ type: "flat", stat: "awareness", value: 5 }],
    durationReduction: { blind: 0.2 },
  },
  flame_ward: {
    id: "flame_ward",
    name: "Flame Ward",
    description: "Immune to burning and incendiary damage.",
    immunities: ["burning"],
    bonuses: [{ type: "flat", stat: "dex", value: 2 }],
  },
};

export function getItemSpecialEffect(id: ItemSpecialEffectId): ItemSpecialEffect {
  return ITEM_SPECIAL_EFFECTS[id];
}
