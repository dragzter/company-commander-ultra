import type { Item } from "./items/types.ts";
import { ITEM_TYPES } from "./items/types.ts";
import { TARGET_TYPES } from "./items/types.ts";

export type SoldierAbility = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  cooldown?: number;
  /** Restrict to specific designation (e.g. "support" for Suppress) */
  designationRestrict?: "rifleman" | "support" | "medic";
};

/** Flame icon for burning effect (incendiary) */
export const FLAME_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ff6633' d='M12 23c1.4 0 2.5-1.1 2.5-2.5 0-1.1-.7-2.1-1.7-2.6-.3-.2-.5-.5-.5-.9 0-.6.5-1 1-1 .2 0 .4.1.6.2 1 .5 1.6 1.5 1.6 2.6 0 1.4-1.1 2.5-2.5 2.5S9.5 21.4 9.5 20c0-.9.5-1.7 1.2-2.2.2-.1.3-.4.3-.6 0-.5-.4-1-.9-1-.1 0-.3 0-.4.1C8.2 17.3 7.5 18.3 7.5 19.5 7.5 21 8.6 22 10 22c.5 0 1-.1 1.4-.3.1.4.5.8 1 1 .4.2.9.3 1.6.3z'/%3E%3Cpath fill='%23ff9933' d='M14.5 2.2C13.4 1 12 0 10.5 0 7 0 4 3.5 4 8c0 2.2 1.1 4.2 2.8 5.4.5.4 1.2.2 1.2-.5V12c0-.8.6-1.4 1.4-1.4.5 0 .9.2 1.2.5.7.6 1.1 1.4 1.1 2.4 0 1-.4 1.9-1.1 2.5-.3.3-.5.7-.5 1.2v1.2c0 .7.7 1 1.2.5 1.7-1.2 2.8-3.2 2.8-5.4 0-2.5-1.2-4.6-3-6.1-.3-.2-.6-.5-.8-.8z'/%3E%3C/svg%3E";

/** Shield icon for Take Cover ability - tactical ballistic shield style */
export const SHIELD_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='sh' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%234ade80'/%3E%3Cstop offset='100%25' style='stop-color:%2316a34a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23sh)' stroke='%230ea54b' stroke-width='1.5' stroke-linejoin='round' d='M12 2L4 6v7c0 4.5 3.5 7 8 9s8-4.5 8-9V6l-8-4z'/%3E%3Cpath fill='none' stroke='%23fff' stroke-width='1' stroke-linecap='round' opacity='0.6' d='M12 6v10M8 9l4-2 4 2M8 14l4 2 4-2'/%3E%3C/svg%3E";

/** Machine gun icon for Suppress ability */
export const SUPPRESS_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fbbf24' stroke='%23d97706' stroke-width='1.2' d='M4 10h2v8H4zM8 8h2v12H8zM12 6h2v16h-2zM16 8h2v12h-2zM20 10h2v8h-2z'/%3E%3Cpath fill='%238b5a2b' d='M2 12h20v2H2z'/%3E%3C/svg%3E";

export const SOLDIER_ABILITIES: SoldierAbility[] = [
  {
    id: "take_cover",
    name: "Take Cover!",
    description: "Increase evasion until next turn.",
    icon: SHIELD_ICON,
    cooldown: 3,
  },
  {
    id: "suppress",
    name: "Suppress",
    description: "Fire 3 quick bursts with machine gun suppressing enemies.",
    icon: SUPPRESS_ICON,
    designationRestrict: "support",
    cooldown: 60,
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

/** Equipped medical item shown in abilities drawer. */
export interface SoldierMedItem {
  item: Item;
  inventoryIndex: number;
}

const FRIENDLY_TARGETS = new Set([TARGET_TYPES.friendly, TARGET_TYPES.self, TARGET_TYPES.friendly_area]);

/** Get equipped friendly-targeting medical items from soldier inventory. */
export function getSoldierMedItems(inventory: Item[] | undefined): SoldierMedItem[] {
  if (!inventory?.length) return [];
  const out: SoldierMedItem[] = [];
  inventory.forEach((item, index) => {
    if (!item || item.type !== ITEM_TYPES.medical || !FRIENDLY_TARGETS.has(item.target as "friendly" | "self" | "friendly_area")) return;
    out.push({ item: { ...item }, inventoryIndex: index });
  });
  return out;
}

/** Get base abilities every soldier has. */
export function getSoldierAbilities(): SoldierAbility[] {
  return [...SOLDIER_ABILITIES];
}
