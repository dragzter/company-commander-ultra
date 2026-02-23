/**
 * 10 common armor bases (cut 5 similar). Tiers 1-10; toughness scales with level.
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
  { baseId: "guardian_plate", name: "Guardian Plate", description: "Defensive posture optimized.", icon: "armor_9.png", toughnessBase: 38, toughnessPerLevel: 4 },
  { baseId: "breacher_rig", name: "Breacher Rig", description: "Close quarters specialist.", icon: "armor_11.png", toughnessBase: 24, toughnessPerLevel: 3 },
];

/** Scale armor to tier (1-10). Flat stats scale, percent bonuses fixed. */
export function scaleArmor(base: ArmorBase, tier: GearLevel) {
  return createArmor(base, tier);
}

export function createArmor(base: ArmorBase, level: GearLevel) {
  const toughness = base.toughnessBase + (level - 1) * base.toughnessPerLevel;
  // Percent bonuses do NOT scale with tier - stay fixed
  const bonuses = base.bonuses;
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
