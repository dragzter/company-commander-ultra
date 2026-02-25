/**
 * 5 rare armors (plan names). Purple/amethyst color. Mix of bonuses: TGH, HP, % MIT, % AVD.
 * Percent bonuses don't scale with tier; flat bonuses scale.
 */
import type { ArmorBonus, GearLevel } from "./types.ts";
import type { ArmorImmunity } from "./epic-armor-bases.ts";
import { ITEM_TYPES, RARITY, TARGET_TYPES } from "./types.ts";

export interface RareArmorBase {
  baseId: string;
  name: string;
  description: string;
  icon: string;
  toughnessBase: number;
  toughnessPerLevel: number;
  bonuses: ArmorBonus[];
  /** If false, item is drop-only (not in store). Default true. */
  storeAvailable?: boolean;
  /** Minimum tier (1-20). Item only exists at this tier and above. */
  minLevel?: number;
  /** Immunities granted by this armor */
  immunities?: ArmorImmunity[];
}

export const RARE_ARMOR_BASES: RareArmorBase[] = [
  { baseId: "phantom_carapace", name: "Phantom Carapace", description: "Elite stealth armor.", icon: "armor_12.png", toughnessBase: 22, toughnessPerLevel: 2, bonuses: [{ type: "percent", stat: "mitigation", value: 3 }, { type: "flat", stat: "awareness", value: 3 }, { type: "flat", stat: "dex", value: 2 }] },
  { baseId: "bastion_plate", name: "Bastion Plate", description: "Heavy tank plate.", icon: "armor_8.png", toughnessBase: 40, toughnessPerLevel: 4, bonuses: [{ type: "flat", stat: "toughness", value: 10 }, { type: "percent", stat: "mitigation", value: 2 }] },
  { baseId: "vipers_embrace", name: "Viper's Embrace", description: "Light and agile.", icon: "armor_0.png", toughnessBase: 16, toughnessPerLevel: 2, bonuses: [{ type: "percent", stat: "mitigation", value: 2 }, { type: "flat", stat: "dex", value: 4 }, { type: "flat", stat: "awareness", value: 2 }] },
  { baseId: "ironclad_resolve", name: "Ironclad Resolve", description: "Defensive with morale boost.", icon: "armor_19.png", toughnessBase: 32, toughnessPerLevel: 3, bonuses: [{ type: "percent", stat: "mitigation", value: 6 }, { type: "flat", stat: "toughness", value: 8 }, { type: "flat", stat: "morale", value: 5 }] },
  { baseId: "revenant_shell", name: "Revenant Shell", description: "Survivor's armor.", icon: "armor_5.png", toughnessBase: 26, toughnessPerLevel: 3, bonuses: [{ type: "percent", stat: "mitigation", value: 5 }, { type: "flat", stat: "hp", value: 15 }] },
  { baseId: "infantry_harness", name: "Infantry Harness", description: "Sturdy tactical harness. Boosts accuracy and awareness.", icon: "armor_19.png", toughnessBase: 20, toughnessPerLevel: 2, bonuses: [{ type: "flat", stat: "toughness", value: 20 }, { type: "percent", stat: "chanceToHit", value: 1 }, { type: "flat", stat: "awareness", value: 10 }], minLevel: 5 },
  { baseId: "grunts_embrace", name: "Grunt's Embrace", description: "Heavy harness. Immune to stun.", icon: "armor_8.png", toughnessBase: 28, toughnessPerLevel: 3, bonuses: [{ type: "flat", stat: "toughness", value: 10 }, { type: "flat", stat: "awareness", value: 20 }], minLevel: 4, immunities: ["stun"] },
];

export function createRareArmor(base: RareArmorBase, level: GearLevel) {
  const tier = Math.max(1, Math.min(20, level));
  const baseToughness = base.toughnessBase + (tier - 1) * base.toughnessPerLevel;
  const bonuses = base.bonuses.map((b) => {
    if (b.type === "flat" && b.stat === "toughness") {
      return { ...b, value: b.value + (tier - 1) * 1 };
    }
    return b;
  });
  return {
    id: `${base.baseId}_${tier}`,
    baseId: base.baseId,
    name: base.name,
    type: ITEM_TYPES.armor,
    rarity: RARITY.rare,
    description: base.description,
    usable: true,
    icon: base.icon,
    toughness: baseToughness,
    level: tier as GearLevel,
    bonuses,
    target: TARGET_TYPES.none,
  };
}
