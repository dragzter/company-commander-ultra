import type { Item } from "./items/types.ts";
import { ThrowableItems } from "./items/throwable.ts";
import { MedicalItems } from "./items/medical-items.ts";

export interface EquipmentMarketEntry {
  item: Item;
  price: number;
}

/** Per-use pricing from transcript. Bundles: uses × perUse = total price. */
const SUPPLIES_PRICES = {
  smoke: 55 * 5,
  flashbang: 70 * 5,
  frag: 60 * 5,
  incendiary: 80 * 5,
  throwing_knife: 20 * 10,
  psychic_shredder: 240 * 5,
  stim_pack: 250 * 2,
  medkit: 75 * 5,
} as const;

/** Common supplies: smoke, flashbang, frag, incendiary, throwing knife, stim pack, medkit */
export const EQUIPMENT_MARKET_COMMON: EquipmentMarketEntry[] = [
  { item: { ...ThrowableItems.common.mk18_smoke }, price: SUPPLIES_PRICES.smoke },
  { item: { ...ThrowableItems.common.m84_flashbang }, price: SUPPLIES_PRICES.flashbang },
  { item: { ...ThrowableItems.common.m3_frag_grenade }, price: SUPPLIES_PRICES.frag },
  { item: { ...ThrowableItems.common.incendiary_grenade }, price: SUPPLIES_PRICES.incendiary },
  { item: { ...ThrowableItems.common.tk21_throwing_knife }, price: SUPPLIES_PRICES.throwing_knife },
  { item: { ...MedicalItems.common.stim_pack }, price: SUPPLIES_PRICES.stim_pack },
  { item: { ...MedicalItems.common.standard_medkit }, price: SUPPLIES_PRICES.medkit },
];

/** Rare supplies (future items) */
export const EQUIPMENT_MARKET_RARE: EquipmentMarketEntry[] = [];

/** Epic supplies: Psychic Shredder */
export const EQUIPMENT_MARKET_EPIC: EquipmentMarketEntry[] = [
  { item: { ...ThrowableItems.epic.mind_ripper }, price: SUPPLIES_PRICES.psychic_shredder },
];

/** Legacy flat list for backward compatibility (common + rare + epic) */
export const EQUIPMENT_MARKET: EquipmentMarketEntry[] = [
  ...EQUIPMENT_MARKET_COMMON,
  ...EQUIPMENT_MARKET_RARE,
  ...EQUIPMENT_MARKET_EPIC,
];
