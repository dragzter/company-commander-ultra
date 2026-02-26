/**
 * 5 rare armors (plan names). Purple/amethyst color. Mix of bonuses: TGH, HP, % MIT, % AVD.
 * Percent bonuses don't scale with tier; flat bonuses scale.
 */
import type { ArmorBonus, GearLevel } from "./types.ts";
import type { ArmorImmunity } from "./epic-armor-bases.ts";
import type { ItemSpecialEffectId } from "../item-special-effects.ts";
import { getItemSpecialEffect } from "../item-special-effects.ts";
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
  /** Immunities granted by this armor (for simple immunities) */
  immunities?: ArmorImmunity[];
  /** Named special effect (Infantry Grunt, Unshakeable, Relentless) - overrides immunities when set */
  specialEffect?: ItemSpecialEffectId;
}

export const RARE_ARMOR_BASES: RareArmorBase[] = [
  { baseId: "phantom_carapace", name: "Phantom Carapace", description: "Favored by infiltrators and scouts.", icon: "armor_14.png", toughnessBase: 22, toughnessPerLevel: 2, bonuses: [{ type: "percent", stat: "mitigation", value: 3 }, { type: "flat", stat: "awareness", value: 3 }, { type: "flat", stat: "dex", value: 2 }] },
  { baseId: "bastion_plate", name: "Bastion Plate", description: "Built for those who draw fire.", icon: "armor_8.png", toughnessBase: 40, toughnessPerLevel: 4, bonuses: [{ type: "flat", stat: "toughness", value: 10 }, { type: "percent", stat: "mitigation", value: 2 }] },
  { baseId: "vipers_embrace", name: "Viper's Embrace", description: "Strikes the balance between protection and mobility.", icon: "armor_0.png", toughnessBase: 16, toughnessPerLevel: 2, bonuses: [{ type: "percent", stat: "mitigation", value: 2 }, { type: "flat", stat: "dex", value: 4 }, { type: "flat", stat: "awareness", value: 2 }] },
  { baseId: "ironclad_resolve", name: "Ironclad Resolve", description: "Steadfast protection for those who refuse to yield.", icon: "armor_12.png", toughnessBase: 32, toughnessPerLevel: 3, bonuses: [{ type: "percent", stat: "mitigation", value: 6 }, { type: "flat", stat: "toughness", value: 8 }, { type: "flat", stat: "morale", value: 5 }] },
  { baseId: "revenant_shell", name: "Revenant Shell", description: "Worn by those who refuse to stay down.", icon: "armor_18.png", toughnessBase: 26, toughnessPerLevel: 3, bonuses: [{ type: "percent", stat: "mitigation", value: 5 }, { type: "flat", stat: "hp", value: 15 }] },
  { baseId: "infantry_harness", name: "Infantry Harness", description: "The harness of choice for those who hold the line.", icon: "armor_1.png", toughnessBase: 20, toughnessPerLevel: 2, bonuses: [{ type: "flat", stat: "toughness", value: 20 }, { type: "percent", stat: "chanceToHit", value: 1 }, { type: "flat", stat: "awareness", value: 10 }], minLevel: 5 },
  { baseId: "grunts_embrace", name: "Grunt's Embrace", description: "Heavy harness worn by those who hold the line.", icon: "armor_19.png", toughnessBase: 28, toughnessPerLevel: 3, bonuses: [{ type: "flat", stat: "toughness", value: 10 }, { type: "flat", stat: "awareness", value: 20 }], minLevel: 4, specialEffect: "infantry_grunt" },
];

export function createRareArmor(base: RareArmorBase, level: GearLevel) {
  const tier = Math.max(1, Math.min(20, level));
  const baseToughness = base.toughnessBase + (tier - 1) * base.toughnessPerLevel;
  let bonuses = base.bonuses.map((b) => {
    if (b.type === "flat" && b.stat === "toughness") {
      return { ...b, value: b.value + (tier - 1) * 1 };
    }
    return b;
  });
  if (base.specialEffect) {
    const eff = getItemSpecialEffect(base.specialEffect);
    const effectBonuses = eff.bonuses ?? [];
    bonuses = [...bonuses, ...effectBonuses];
  }
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
    immunities: base.specialEffect ? (getItemSpecialEffect(base.specialEffect).immunities ?? base.immunities) : base.immunities,
    specialEffect: base.specialEffect,
    target: TARGET_TYPES.none,
  };
}
