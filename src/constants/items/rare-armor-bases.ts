/**
 * 5 rare armors. Blue color, 10 tiers each. Mix of bonuses: TGH, HP, % MIT, % AVD.
 * Percent bonuses don't scale with tier; flat bonuses scale.
 */
import type { ArmorBonus, GearLevel } from "./types.ts";
import { ITEM_TYPES, RARITY, TARGET_TYPES } from "./types.ts";

export interface RareArmorBase {
  baseId: string;
  name: string;
  description: string;
  icon: string;
  toughnessBase: number;
  toughnessPerLevel: number;
  bonuses: ArmorBonus[]; // Flat bonuses scale with level for TGH; percent don't
}

export const RARE_ARMOR_BASES: RareArmorBase[] = [
  { baseId: "phantom_weave", name: "Phantom Weave", description: "Elite stealth armor.", icon: "armor_3.png", toughnessBase: 18, toughnessPerLevel: 2, bonuses: [{ type: "percent", stat: "avoidance", value: 5 }, { type: "flat", stat: "dex", value: 2 }] },
  { baseId: "iron_bastion", name: "Iron Bastion", description: "Heavy rare plate.", icon: "armor_5.png", toughnessBase: 35, toughnessPerLevel: 4, bonuses: [{ type: "flat", stat: "toughness", value: 5 }, { type: "percent", stat: "mitigation", value: 3 }] },
  { baseId: "vanguard_plate", name: "Vanguard Plate", description: "Front-line specialist.", icon: "armor_4.png", toughnessBase: 30, toughnessPerLevel: 3, bonuses: [{ type: "flat", stat: "hp", value: 10 }] },
  { baseId: "sentinel_guard", name: "Sentinel Guard", description: "Defensive awareness boost.", icon: "armor_9.png", toughnessBase: 28, toughnessPerLevel: 3, bonuses: [{ type: "flat", stat: "awareness", value: 3 }, { type: "percent", stat: "mitigation", value: 2 }] },
  { baseId: "berserker_rig", name: "Berserker Rig", description: "Morale-focused assault.", icon: "armor_7.png", toughnessBase: 22, toughnessPerLevel: 2, bonuses: [{ type: "flat", stat: "morale", value: 15 }, { type: "percent", stat: "avoidance", value: 2 }] },
];

export function createRareArmor(base: RareArmorBase, level: GearLevel) {
  const baseToughness = base.toughnessBase + (level - 1) * base.toughnessPerLevel;
  const bonuses = base.bonuses.map((b) => {
    if (b.type === "flat" && b.stat === "toughness") {
      return { ...b, value: b.value + (level - 1) * 1 };
    }
    return b;
  });
  return {
    id: `${base.baseId}_${level}`,
    name: base.name,
    type: ITEM_TYPES.armor,
    rarity: RARITY.rare,
    description: base.description,
    usable: true,
    icon: base.icon,
    toughness: baseToughness,
    level,
    bonuses,
    target: TARGET_TYPES.none,
  };
}
