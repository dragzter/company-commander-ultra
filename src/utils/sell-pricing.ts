import { getSuppliesMarketItems } from "../constants/equipment-market.ts";
import { getArmorPrice, getWeaponPrice } from "../constants/item-pricing.ts";
import { MedicalItems } from "../constants/items/medical-items.ts";
import { ThrowableItems } from "../constants/items/throwable.ts";
import type { Item } from "../constants/items/types.ts";

type SupplyTemplate = {
  id: string;
  name?: string;
  rarity?: string;
  uses?: number;
};

const SUPPLY_TEMPLATES: SupplyTemplate[] = [
  ...Object.values(ThrowableItems.common),
  ...Object.values(ThrowableItems.rare),
  ...Object.values(ThrowableItems.epic),
  ...Object.values(MedicalItems.common),
  ...Object.values(MedicalItems.rare),
  ...Object.values(MedicalItems.epic),
];

function findSupplyTemplate(item: Item): SupplyTemplate | null {
  const rarity = item.rarity ?? "common";
  const byIdAndRarity = SUPPLY_TEMPLATES.find((t) => t.id === item.id && (t.rarity ?? "common") === rarity);
  if (byIdAndRarity) return byIdAndRarity;
  const byIdAndName = SUPPLY_TEMPLATES.find((t) => t.id === item.id && (t.name ?? "") === (item.name ?? ""));
  if (byIdAndName) return byIdAndName;
  return SUPPLY_TEMPLATES.find((t) => t.id === item.id) ?? null;
}

function getSupplyBuyPrice(item: Item, companyLevel = 20): number {
  const level = Math.max(1, Math.floor(item.level ?? 1));
  const pool = getSuppliesMarketItems(level, Math.max(4, companyLevel), { allowPost20: true });
  const all = [...pool.common, ...pool.rare, ...pool.epic];
  const rarity = item.rarity ?? "common";
  const byIdAndRarity = all.find((e) => e.item.id === item.id && (e.item.rarity ?? "common") === rarity);
  if (byIdAndRarity) return byIdAndRarity.price;
  const byIdAndName = all.find((e) => e.item.id === item.id && e.item.name === item.name);
  if (byIdAndName) return byIdAndName.price;
  const byId = all.find((e) => e.item.id === item.id);
  if (byId) return byId.price;
  return Math.max(0, Math.round(item.price ?? 0));
}

export function getItemMarketBuyPrice(item: Item, companyLevel = 20): number {
  if (item.type === "ballistic_weapon" || item.type === "melee_weapon") return getWeaponPrice(item);
  if (item.type === "armor") return getArmorPrice(item);
  if (item.type === "throwable" || item.type === "medical" || item.type === "gear") {
    return getSupplyBuyPrice(item, companyLevel);
  }
  return Math.max(0, Math.round(item.price ?? 0));
}

function getItemUseRatio(item: Item): number {
  const currentUses = item.uses ?? item.quantity;
  if (currentUses == null) return 1;
  const template = findSupplyTemplate(item);
  const maxUses = template?.uses ?? currentUses;
  if (maxUses <= 0) return 1;
  return Math.max(0, Math.min(1, currentUses / maxUses));
}

export function getItemSellPrice(item: Item, companyLevel = 20): number {
  const buyPrice = getItemMarketBuyPrice(item, companyLevel);
  const half = Math.round(buyPrice * 0.5);
  const ratio = getItemUseRatio(item);
  return Math.max(0, Math.round(half * ratio));
}

