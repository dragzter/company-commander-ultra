import type { Item, ItemType } from "../constants/items/types.ts";
import { ITEM_TYPES } from "../constants/items/types.ts";

const ITEMS_IMAGE_BASE = "/images/items";

const ITEM_TYPE_SUBPATHS: Partial<Record<ItemType, string>> = {
  [ITEM_TYPES.ballistic_weapon]: "weapons/ballistic",
  [ITEM_TYPES.armor]: "armor",
  [ITEM_TYPES.throwable]: "weapons/throwable",
  [ITEM_TYPES.medical]: "general",
};

/**
 * Resolves item icon path. Items store icon as filename (e.g. throwable_0.png).
 */
export function getItemIconUrl(item: Item | undefined): string {
  if (!item?.icon) return "";
  const subpath = item.type ? (ITEM_TYPE_SUBPATHS[item.type as ItemType] ?? "general") : "general";
  return `${ITEMS_IMAGE_BASE}/${subpath}/${item.icon}`;
}
