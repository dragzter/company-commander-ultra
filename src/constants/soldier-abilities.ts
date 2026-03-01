import type { Item } from "./items/types.ts";
import { ITEM_TYPES } from "./items/types.ts";
import { TARGET_TYPES } from "./items/types.ts";

export type SoldierAbility = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  cooldown?: number;
  /** Maps ability action to combat handler lookup. */
  actionId: "take_cover" | "suppress";
  /** Additional CSS class for specific visual treatment. */
  slotClassName?: string;
  /** Restrict to specific designation (e.g. "support" for Suppress) */
  designationRestrict?: "rifleman" | "support" | "medic";
};

/** Flame icon for burning effect (incendiary) */
export const FLAME_ICON = "/images/on_fire.png";

/** Take Cover ability icon - image asset (combat abilities popup) */
export const TAKE_COVER_ICON = "/images/take_cover.png";

/** Shield icon for Take Cover overlay on combat cards (soldier in cover state) */
export const SHIELD_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='wall' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2398a4b7'/%3E%3Cstop offset='100%25' stop-color='%2367768d'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='2.5' y='5' width='19' height='14' rx='2' fill='url(%23wall)' stroke='%23d4deed' stroke-width='1.1'/%3E%3Cpath d='M2.8 9.6h18.4M2.8 14.2h18.4M7 5.2v4.2M12 9.6v4.6M17 5.2v4.2M9.5 14.2V19M14.5 14.2V19' stroke='%23e9eef8' stroke-opacity='.92' stroke-width='1'/%3E%3C/svg%3E";

/** Machine gun icon for Suppress ability */
export const SUPPRESS_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fbbf24' stroke='%23d97706' stroke-width='1.2' d='M4 10h2v8H4zM8 8h2v12H8zM12 6h2v16h-2zM16 8h2v12h-2zM20 10h2v8h-2z'/%3E%3Cpath fill='%238b5a2b' d='M2 12h20v2H2z'/%3E%3C/svg%3E";

export const SOLDIER_ABILITIES: SoldierAbility[] = [
  {
    id: "take_cover",
    name: "Take Cover!",
    description: "Increase evasion until next turn.",
    icon: TAKE_COVER_ICON,
    cooldown: 60,
    actionId: "take_cover",
    slotClassName: "combat-ability-take-cover-wrap",
  },
  {
    id: "suppress",
    name: "Suppress",
    description: "Fire 3 quick bursts with machine gun suppressing enemies.",
    icon: SUPPRESS_ICON,
    designationRestrict: "support",
    cooldown: 60,
    actionId: "suppress",
    slotClassName: "combat-ability-suppress-wrap",
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

export function getSoldierAbilityById(id: string): SoldierAbility | undefined {
  return SOLDIER_ABILITIES.find((ability) => ability.id === id);
}
