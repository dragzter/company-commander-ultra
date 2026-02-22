/**
 * 5 epic armors. Purple color, 10 tiers each. Stats + passive effects.
 */
import type { ArmorBonus, GearLevel } from "./types.ts";
import { ITEM_TYPES, RARITY, TARGET_TYPES } from "./types.ts";

export interface EpicArmorBase {
  baseId: string;
  name: string;
  description: string;
  icon: string;
  toughnessBase: number;
  toughnessPerLevel: number;
  bonuses: ArmorBonus[];
  effectDescription: string; // Passive effect flavor
}

export const EPIC_ARMOR_BASES: EpicArmorBase[] = [
  { baseId: "titan_plate", name: "Titan Plate", description: "Legendary heavy armor.", icon: "armor_5.png", toughnessBase: 45, toughnessPerLevel: 5, bonuses: [{ type: "flat", stat: "toughness", value: 10 }, { type: "percent", stat: "mitigation", value: 5 }], effectDescription: "Reduces stun duration by 25%." },
  { baseId: "shadow_form", name: "Shadow Form", description: "Elite infiltration suit.", icon: "armor_3.png", toughnessBase: 20, toughnessPerLevel: 2, bonuses: [{ type: "percent", stat: "avoidance", value: 10 }, { type: "flat", stat: "dex", value: 5 }], effectDescription: "Reduces suppressed duration by 30%." },
  { baseId: "phoenix_guard", name: "Phoenix Guard", description: "Fire-resistant plating.", icon: "armor_4.png", toughnessBase: 35, toughnessPerLevel: 4, bonuses: [{ type: "flat", stat: "hp", value: 20 }], effectDescription: "Reduces burning duration by 25%." },
  { baseId: "mind_shield", name: "Mind Shield", description: "Psychic resistance helmet.", icon: "armor_9.png", toughnessBase: 25, toughnessPerLevel: 3, bonuses: [{ type: "flat", stat: "morale", value: 25 }, { type: "percent", stat: "mitigation", value: 3 }], effectDescription: "Reduces panic duration by 40%." },
  { baseId: "warden_plate", name: "Warden Plate", description: "All-around elite protection.", icon: "armor_8.png", toughnessBase: 38, toughnessPerLevel: 4, bonuses: [{ type: "flat", stat: "awareness", value: 5 }, { type: "percent", stat: "avoidance", value: 5 }, { type: "percent", stat: "mitigation", value: 3 }], effectDescription: "Reduces blinded duration by 20%." },
];

export function createEpicArmor(base: EpicArmorBase, level: GearLevel) {
  const toughness = base.toughnessBase + (level - 1) * base.toughnessPerLevel;
  return {
    id: `${base.baseId}_${level}`,
    name: base.name,
    type: ITEM_TYPES.armor,
    rarity: RARITY.epic,
    description: base.description,
    usable: true,
    icon: base.icon,
    toughness,
    level,
    bonuses: base.bonuses,
    passiveEffect: base.effectDescription,
    target: TARGET_TYPES.none,
  };
}
