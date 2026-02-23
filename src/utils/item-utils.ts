import type { Item, ItemType } from "../constants/items/types.ts";
import { ITEM_TYPES } from "../constants/items/types.ts";

/** Items never stack in the armory—each occupies its own slot. */
export function canItemStackInArmory(_item: Item): boolean {
  return false;
}

export type ArmoryCategory = "weapon" | "armor" | "equipment";

/** Armory category for an item (weapons, armor, equipment). */
export function getItemArmoryCategory(item: Item): ArmoryCategory {
  const t = item.type as string;
  if (t === ITEM_TYPES.ballistic_weapon || t === ITEM_TYPES.melee_weapon) return "weapon";
  if (t === ITEM_TYPES.armor) return "armor";
  if (t === ITEM_TYPES.throwable || t === ITEM_TYPES.medical || t === ITEM_TYPES.gear) return "equipment";
  return "equipment"; // fallback for unknown types
}

/** Count items by armory category (each stacked item counts as 1 slot for cap purposes). */
export function countArmoryByCategory(items: Item[]): Record<ArmoryCategory, number> {
  const counts: Record<ArmoryCategory, number> = { weapon: 0, armor: 0, equipment: 0 };
  for (const item of items) {
    const cat = getItemArmoryCategory(item);
    counts[cat] += 1;
  }
  return counts;
}

const ITEMS_IMAGE_BASE = "/images/items";

const ITEM_TYPE_SUBPATHS: Partial<Record<ItemType, string>> = {
  [ITEM_TYPES.ballistic_weapon]: "weapons/ballistic",
  [ITEM_TYPES.armor]: "armor",
  [ITEM_TYPES.throwable]: "weapons/throwable",
  [ITEM_TYPES.medical]: "general",
};

/** Medical icons live at /images/ (root), not /images/items/general/ */
const MEDICAL_ICON_BASE = "/images";

/** Fallback icon by item id when icon prop is missing (e.g. from JSON/serialization) */
const MEDICAL_ICON_BY_ID: Record<string, string> = {
  standard_medkit: "med_kit.png",
  stim_pack: "stim_pack.png",
};

/**
 * Resolves item icon path. Items store icon as filename (e.g. throwable_0.png).
 */
export function getItemIconUrl(item: Item | undefined): string {
  if (!item) return "";
  if (item.type === ITEM_TYPES.medical) {
    const filename = item.icon ?? MEDICAL_ICON_BY_ID[item.id ?? ""];
    if (filename) return `${MEDICAL_ICON_BASE}/${filename}`;
    return "";
  }
  if (!item.icon) return "";
  const subpath = item.type ? (ITEM_TYPE_SUBPATHS[item.type as ItemType] ?? "general") : "general";
  return `${ITEMS_IMAGE_BASE}/${subpath}/${item.icon}`;
}
