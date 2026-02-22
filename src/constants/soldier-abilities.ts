import type { Item } from "./items/types.ts";
import { ITEM_TYPES } from "./items/types.ts";
import { TARGET_TYPES } from "./items/types.ts";

export type SoldierAbility = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  cooldown?: number;
};

export const SHIELD_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234ade80' stroke-width='2'%3E%3Cpath d='M12 2L4 7v10l8 5 8-5V7l-8-5z'/%3E%3C/svg%3E";

export const SOLDIER_ABILITIES: SoldierAbility[] = [
  {
    id: "take_cover",
    name: "Take Cover!",
    description: "Increase evasion until next turn.",
    icon: SHIELD_ICON,
    cooldown: 3,
  },
];

/** Equipped grenade/throwable shown in abilities drawer. */
export interface SoldierGrenade {
  item: Item;
  inventoryIndex: number;
}

const ENEMY_TARGETS = new Set([TARGET_TYPES.enemy, TARGET_TYPES.enemy_area]);

/** Get equipped enemy-targeting throwables from soldier inventory. */
export function getSoldierGrenades(inventory: Item[] | undefined): SoldierGrenade[] {
  if (!inventory?.length) return [];
  const out: SoldierGrenade[] = [];
  inventory.forEach((item, index) => {
    if (!item || item.type !== ITEM_TYPES.throwable || !ENEMY_TARGETS.has(item.target as "enemy" | "enemy_area")) return;
    out.push({ item: { ...item }, inventoryIndex: index });
  });
  return out;
}

/** Get base abilities every soldier has. */
export function getSoldierAbilities(): SoldierAbility[] {
  return [...SOLDIER_ABILITIES];
}
