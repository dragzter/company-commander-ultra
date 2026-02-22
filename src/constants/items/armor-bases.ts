/**
 * 15 armor bases. Each has tiers 1-10; same icon for all tiers, toughness scales with level.
 * Only some have bonuses; common max 3% at lvl 1, 10% at lvl 10 for MIT/AVD.
 */
import type { ArmorBonus, GearLevel } from "./types.ts";
import { ITEM_TYPES, RARITY, TARGET_TYPES } from "./types.ts";

export interface ArmorBase {
  baseId: string;
  name: string;
  description: string;
  icon: string;
  toughnessBase: number;
  toughnessPerLevel: number;
  bonuses?: ArmorBonus[]; // Percent bonuses don't scale with tier
}

export const ARMOR_BASES: ArmorBase[] = [
  { baseId: "s3_flak", name: "S3 Flak Jacket", description: "Standard Issue for the Intrepid Infantryman.", icon: "armor_17.png", toughnessBase: 15, toughnessPerLevel: 2 },
  { baseId: "rokkar_vest", name: "Rokkar Combat Vest", description: "Hardened with ceramic plates.", icon: "armor_19.png", toughnessBase: 18, toughnessPerLevel: 3 },
  { baseId: "m108_flak", name: "M108 Flak Jacket", description: "Durable and heavy.", icon: "armor_8.png", toughnessBase: 35, toughnessPerLevel: 4 },
  { baseId: "light_tactical_vest", name: "Light Tactical Vest", description: "Light protection, enhanced mobility.", icon: "armor_0.png", toughnessBase: 8, toughnessPerLevel: 1, bonuses: [{ type: "percent", stat: "avoidance", value: 2 }] },
  { baseId: "urban_defender", name: "Urban Defender", description: "Urban combat optimized.", icon: "armor_1.png", toughnessBase: 22, toughnessPerLevel: 2, bonuses: [{ type: "percent", stat: "mitigation", value: 2 }] },
  { baseId: "heavy_plate", name: "Heavy Plate Carrier", description: "Maximum protection.", icon: "armor_2.png", toughnessBase: 40, toughnessPerLevel: 5 },
  { baseId: "stealth_vest", name: "Stealth Vest", description: "Low profile.", icon: "armor_3.png", toughnessBase: 12, toughnessPerLevel: 2, bonuses: [{ type: "percent", stat: "avoidance", value: 3 }] },
  { baseId: "assault_rig", name: "Assault Rig", description: "Designed for assault troops.", icon: "armor_4.png", toughnessBase: 28, toughnessPerLevel: 3 },
  { baseId: "reinforced_plate", name: "Reinforced Plate", description: "Extra ceramic reinforcement.", icon: "armor_5.png", toughnessBase: 32, toughnessPerLevel: 4 },
  { baseId: "field_vest", name: "Field Vest", description: "All-purpose field armor.", icon: "armor_6.png", toughnessBase: 20, toughnessPerLevel: 2 },
  { baseId: "strike_vest", name: "Strike Vest", description: "Fast response loadout.", icon: "armor_7.png", toughnessBase: 16, toughnessPerLevel: 2 },
  { baseId: "guardian_plate", name: "Guardian Plate", description: "Defensive posture optimized.", icon: "armor_9.png", toughnessBase: 38, toughnessPerLevel: 4 },
  { baseId: "scout_armor", name: "Scout Armor", description: "Lightweight for scouts.", icon: "armor_10.png", toughnessBase: 10, toughnessPerLevel: 1, bonuses: [{ type: "percent", stat: "avoidance", value: 2 }] },
  { baseId: "breacher_rig", name: "Breacher Rig", description: "Close quarters specialist.", icon: "armor_11.png", toughnessBase: 24, toughnessPerLevel: 3 },
  { baseId: "standard_carrier", name: "Standard Carrier", description: "Balanced protection.", icon: "armor_12.png", toughnessBase: 18, toughnessPerLevel: 2 },
];

/** Scale armor to tier (1-10). Flat stats scale, percent bonuses fixed. */
export function scaleArmor(base: ArmorBase, tier: GearLevel) {
  return createArmor(base, tier);
}

export function createArmor(base: ArmorBase, level: GearLevel) {
  const toughness = base.toughnessBase + (level - 1) * base.toughnessPerLevel;
  // Common: only % bonuses (MIT/AVD), scale from max 3% at L1 to 10% at L10
  const bonuses = base.bonuses?.map((b) => {
    if (b.type !== "percent") return b;
    const scaled = Math.min(10, b.value + Math.floor(((level - 1) * (10 - b.value)) / 9));
    return { ...b, value: scaled };
  });
  return {
    id: `${base.baseId}_${level}`,
    name: base.name,
    type: ITEM_TYPES.armor,
    rarity: RARITY.common,
    description: base.description,
    usable: true,
    icon: base.icon,
    toughness,
    level,
    bonuses,
    target: TARGET_TYPES.none,
  };
}
