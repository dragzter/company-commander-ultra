/**
 * 5 epic armors. Purple color, 10 tiers each. Stats + passive effects.
 */
import type { ArmorBonus, GearLevel } from "./types.ts";
import type { ItemSpecialEffectId } from "../item-special-effects.ts";
import { getItemSpecialEffect } from "../item-special-effects.ts";
import { ITEM_TYPES, RARITY, TARGET_TYPES } from "./types.ts";

export type ArmorImmunity = "stun" | "panic" | "suppression" | "burning";

export interface EpicArmorBase {
  baseId: string;
  name: string;
  description: string;
  icon: string;
  toughnessBase: number;
  toughnessPerLevel: number;
  bonuses: ArmorBonus[];
  /** Named special effect from item-special-effects.ts */
  specialEffect: ItemSpecialEffectId;
  /** If false, item is drop-only (not in store). All epic armor is drop-only. */
  storeAvailable?: boolean;
}

export const EPIC_ARMOR_BASES: EpicArmorBase[] = [
  { baseId: "titan_plate", name: "Titan Plate", description: "Legendary heavy armor.", icon: "armor_15.png", toughnessBase: 50, toughnessPerLevel: 6, bonuses: [{ type: "flat", stat: "toughness", value: 10 }, { type: "percent", stat: "mitigation", value: 5 }], specialEffect: "sturdy", storeAvailable: false },
  { baseId: "shadow_form", name: "Shadow Form", description: "Elite infiltration suit.", icon: "armor_7.png", toughnessBase: 24, toughnessPerLevel: 2, bonuses: [{ type: "percent", stat: "avoidance", value: 10 }, { type: "flat", stat: "dex", value: 5 }], specialEffect: "fearless", storeAvailable: false },
  { baseId: "phoenix_guard", name: "Phoenix Guard", description: "Fire-resistant plating.", icon: "armor_13.png", toughnessBase: 40, toughnessPerLevel: 5, bonuses: [{ type: "flat", stat: "hp", value: 20 }], specialEffect: "dragonskin", storeAvailable: false },
  { baseId: "mind_shield", name: "Mind Shield", description: "Psychic resistance helmet.", icon: "armor_10.png", toughnessBase: 30, toughnessPerLevel: 4, bonuses: [{ type: "flat", stat: "morale", value: 25 }, { type: "percent", stat: "mitigation", value: 3 }], specialEffect: "commissar", storeAvailable: false },
  { baseId: "warden_plate", name: "Warden Plate", description: "All-around elite protection.", icon: "armor_6.png", toughnessBase: 43, toughnessPerLevel: 5, bonuses: [{ type: "flat", stat: "awareness", value: 5 }, { type: "percent", stat: "avoidance", value: 5 }, { type: "percent", stat: "mitigation", value: 3 }], specialEffect: "visionary", storeAvailable: false },
  { baseId: "sacred_cloak", name: "Sacred Cloak", description: "Blessed mantle.", icon: "armor_5.png", toughnessBase: 18, toughnessPerLevel: 2, bonuses: [{ type: "percent", stat: "avoidance", value: 2 }, { type: "flat", stat: "dex", value: 10 }], specialEffect: "flame_ward", storeAvailable: false },
];

export function createEpicArmor(base: EpicArmorBase, level: GearLevel) {
  const toughness = base.toughnessBase + (level - 1) * base.toughnessPerLevel;
  const eff = getItemSpecialEffect(base.specialEffect);
  const effectBonuses = eff.bonuses ?? [];
  const bonuses: ArmorBonus[] = [...base.bonuses, ...effectBonuses];
  return {
    id: `${base.baseId}_${level}`,
    baseId: base.baseId,
    name: base.name,
    type: ITEM_TYPES.armor,
    rarity: RARITY.epic,
    description: base.description,
    usable: true,
    icon: base.icon,
    toughness,
    level,
    bonuses,
    immunities: eff.immunities,
    specialEffect: base.specialEffect,
    target: TARGET_TYPES.none,
  };
}
