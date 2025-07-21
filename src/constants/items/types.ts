// Inventory
import type { DamageType } from "../types.ts";
import type {
  EffectResult,
  EffectType,
} from "../../game/entities/effects/effect.ts";

export const RARITY = {
  common: "common",
  rare: "rare",
  epic: "epic",
} as const;

export const ITEM_TYPES = {
  melee_weapon: "melee_weapon",
  ballistic_weapon: "ballistic_weapon",
  medical: "medical",
  food: "food",
  tool: "tool",
  gear: "gear",
  ammo: "ammo",
  junk: "junk",
  armor: "armor",
  throwable: "throwable",
} as const;

export const TARGET_TYPES = {
  none: "none",
  self: "self",
  friendly: "friendly",
  friendly_area: "friendly_area",
  enemy: "enemy",
  enemy_area: "enemy_area",
} as const;

export type ItemType = keyof typeof ITEM_TYPES;

export type Rarity = keyof typeof RARITY;

export type TargetType = keyof typeof TARGET_TYPES;

export type EffectSeverity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type WeaponBaseSpeed = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10; // Lower is slower

export interface Item {
  damage?: number;
  damage_type?: DamageType;
  description?: string;
  effect?: ItemEffect;
  icon?: string;
  id: string;
  name: string;
  uses?: number;
  price?: number;
  quantity?: number;
  rarity?: Rarity; // Weapons only
  size?: number; // Weapons only
  speed_base?: WeaponBaseSpeed;
  tags?: string[];
  target: TargetType;
  toughness?: number; // Armor only
  type: ItemType;
  usable?: boolean;
}

export type ThrowableItem = Pick<
  Item,
  | "damage"
  | "damage_type"
  | "id"
  | "name"
  | "type"
  | "rarity"
  | "description"
  | "usable"
  | "quantity"
  | "uses"
  | "target"
  | "tags"
  | "effect"
  | "icon"
>;

export type Armor = Pick<
  Item,
  | "id"
  | "name"
  | "type"
  | "rarity"
  | "description"
  | "usable"
  | "tags"
  | "effect"
  | "icon"
  | "toughness"
>;

export type MedItem = Pick<
  Item,
  | "id"
  | "name"
  | "type"
  | "rarity"
  | "description"
  | "usable"
  | "tags"
  | "uses"
  | "target"
  | "effect"
  | "icon"
>;

export type BallisticWeapon = Partial<Item>;
export type MeleeWeapon = Partial<Item>;
export type JunkItem = Partial<Item>;
export type EnhancementItem = Partial<Item>;

export interface ItemEffect {
  type: EffectType;
  effect_value?: number;
  duration: number; // turns
  description?: string;
  effectiveness: EffectSeverity;
  result: EffectResult;
}

export type ItemsVolume<T> = Record<Rarity, Record<string, T>>;
