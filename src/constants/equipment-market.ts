import type { Item } from "./items/types.ts";
import type { GearLevel } from "./items/types.ts";
import { ThrowableItems } from "./items/throwable.ts";
import { MedicalItems } from "./items/medical-items.ts";

export interface EquipmentMarketEntry {
  item: Item;
  price: number;
}

/** Per-use base pricing. Leveled supplies scale price with tier. */
const SUPPLIES_BASE_PRICES = {
  smoke: 95 * 5,
  flashbang: 120 * 5,
  frag: 105 * 5,
  incendiary: 140 * 5,
  throwing_knife: 35 * 10,
  psychic_shredder: 800 * 5,
  stim_pack: 1950,
  medkit: 130 * 5,
} as const;

const TIER_PRICE_FACTOR = 0.06;

function supplyPrice(base: number, tier: number): number {
  return Math.round(base * (1 + (tier - 1) * TIER_PRICE_FACTOR));
}

/** Create leveled supply item. Psychic Shredder has no level (stays tier 1). Incendiary: only effect_value scales. */
function createLeveledSupply<T extends Item>(
  base: T,
  tier: GearLevel,
  options: {
    noLevel?: boolean;
    damageOnly?: boolean;
  } = {},
): T {
  const level = options.noLevel ? 1 : tier;
  const item = { ...base, level } as T;

  if (options.noLevel) return item;

  if (options.damageOnly) {
    if (item.effect?.result === "burn" && item.effect.effect_value != null) {
      const baseDmg = 8;
      const scaled = Math.round(baseDmg + (tier - 1) * 1.5);
      (item as Item).effect = { ...item.effect!, effect_value: scaled };
    }
    return item;
  }

  if (base.damage != null && base.damage > 0) {
    (item as Item).damage = Math.round((base.damage as number) * (1 + (tier - 1) * 0.08));
  }
  if (base.effect) {
    const eff = { ...base.effect };
    if (eff.effectiveness != null) {
      (eff as { effectiveness?: number }).effectiveness = Math.min(10, Math.round(eff.effectiveness + (tier - 1) * 0.15));
    }
    if (eff.effect_value != null && eff.result !== "burn") {
      (eff as { effect_value?: number }).effect_value = Math.round((eff.effect_value as number) * (1 + (tier - 1) * 0.08));
    }
    (item as Item).effect = eff;
  }
  return item;
}

/** Common supplies. Smoke, flashbang, stim have no level (absolute utility). Others scale with tier. */
function getCommonSupplies(tier: GearLevel, _companyLvl: number): EquipmentMarketEntry[] {
  const t = Math.max(1, Math.min(20, tier)) as GearLevel;
  const smoke = createLeveledSupply(
    { ...ThrowableItems.common.mk18_smoke } as Item,
    1,
    { noLevel: true },
  );
  const flashbang = createLeveledSupply(
    { ...ThrowableItems.common.m84_flashbang } as Item,
    1,
    { noLevel: true },
  );
  const frag = createLeveledSupply(
    { ...ThrowableItems.common.m3_frag_grenade } as Item,
    t,
  );
  const incendiary = createLeveledSupply(
    { ...ThrowableItems.common.incendiary_grenade } as Item,
    t,
    { damageOnly: true },
  );
  const knife = createLeveledSupply(
    { ...ThrowableItems.common.tk21_throwing_knife } as Item,
    t,
  );
  const stim = createLeveledSupply(
    { ...MedicalItems.common.stim_pack } as Item,
    1,
    { noLevel: true },
  );
  const medkit = createLeveledSupply(
    { ...MedicalItems.common.standard_medkit } as Item,
    t,
  );

  return [
    { item: smoke, price: supplyPrice(SUPPLIES_BASE_PRICES.smoke, t) },
    { item: flashbang, price: supplyPrice(SUPPLIES_BASE_PRICES.flashbang, t) },
    { item: frag, price: supplyPrice(SUPPLIES_BASE_PRICES.frag, t) },
    { item: incendiary, price: supplyPrice(SUPPLIES_BASE_PRICES.incendiary, t) },
    { item: knife, price: supplyPrice(SUPPLIES_BASE_PRICES.throwing_knife, t) },
    { item: stim, price: supplyPrice(SUPPLIES_BASE_PRICES.stim_pack, t) },
    { item: medkit, price: supplyPrice(SUPPLIES_BASE_PRICES.medkit, t) },
  ];
}

/** Epic: Psychic Shredder - no level. */
function getEpicSupplies(companyLvl: number): EquipmentMarketEntry[] {
  if (companyLvl < 4) return [];
  const item = createLeveledSupply(
    { ...ThrowableItems.epic.mind_ripper } as Item,
    1,
    { noLevel: true },
  );
  return [{ item, price: SUPPLIES_BASE_PRICES.psychic_shredder }];
}

/** Supplies by tier. Psychic Shredder has no level. Incendiary scales damage only. */
export function getSuppliesMarketItems(
  tier: number,
  companyLvl: number,
): { common: EquipmentMarketEntry[]; rare: EquipmentMarketEntry[]; epic: EquipmentMarketEntry[] } {
  const t = Math.max(1, Math.min(20, Math.floor(tier))) as GearLevel;
  return {
    common: getCommonSupplies(t, companyLvl),
    rare: [],
    epic: getEpicSupplies(companyLvl),
  };
}

/** Legacy: flat lists for backward compatibility */
export const EQUIPMENT_MARKET_COMMON: EquipmentMarketEntry[] = getSuppliesMarketItems(1, 4).common;
export const EQUIPMENT_MARKET_RARE: EquipmentMarketEntry[] = [];
export const EQUIPMENT_MARKET_EPIC: EquipmentMarketEntry[] = getSuppliesMarketItems(1, 4).epic;

/** Legacy flat list for backward compatibility (common + rare + epic) */
export const EQUIPMENT_MARKET: EquipmentMarketEntry[] = [
  ...EQUIPMENT_MARKET_COMMON,
  ...EQUIPMENT_MARKET_RARE,
  ...EQUIPMENT_MARKET_EPIC,
];
