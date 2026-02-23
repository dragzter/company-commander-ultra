/**
 * 5 rare armors (plan names). Purple/amethyst color. Mix of bonuses: TGH, HP, % MIT, % AVD.
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
  bonuses: ArmorBonus[];
}

export const RARE_ARMOR_BASES: RareArmorBase[] = [
  { baseId: "phantom_carapace", name: "Phantom Carapace", description: "Elite stealth armor.", icon: "armor_12.png", toughnessBase: 22, toughnessPerLevel: 2, bonuses: [{ type: "percent", stat: "mitigation", value: 3 }, { type: "flat", stat: "awareness", value: 3 }, { type: "flat", stat: "dex", value: 2 }] },
  { baseId: "bastion_plate", name: "Bastion Plate", description: "Heavy tank plate.", icon: "armor_8.png", toughnessBase: 40, toughnessPerLevel: 4, bonuses: [{ type: "flat", stat: "toughness", value: 10 }, { type: "percent", stat: "mitigation", value: 2 }] },
  { baseId: "vipers_embrace", name: "Viper's Embrace", description: "Light and agile.", icon: "armor_0.png", toughnessBase: 16, toughnessPerLevel: 2, bonuses: [{ type: "percent", stat: "mitigation", value: 2 }, { type: "flat", stat: "dex", value: 4 }, { type: "flat", stat: "awareness", value: 2 }] },
  { baseId: "ironclad_resolve", name: "Ironclad Resolve", description: "Defensive with morale boost.", icon: "armor_19.png", toughnessBase: 32, toughnessPerLevel: 3, bonuses: [{ type: "percent", stat: "mitigation", value: 6 }, { type: "flat", stat: "toughness", value: 8 }, { type: "flat", stat: "morale", value: 5 }] },
  { baseId: "revenant_shell", name: "Revenant Shell", description: "Survivor's armor.", icon: "armor_5.png", toughnessBase: 26, toughnessPerLevel: 3, bonuses: [{ type: "percent", stat: "mitigation", value: 5 }, { type: "flat", stat: "hp", value: 15 }] },
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
