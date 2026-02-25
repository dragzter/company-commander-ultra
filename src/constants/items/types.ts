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

/** Level/tier of gear (1-20). Same base item at higher level = better stats. */
export type GearLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;

/** Armor bonus: flat stats (TGH, HP, etc) or percent (MIT, AVD). Percent bonuses don't scale with tier. */
export type ArmorBonus =
  | { type: "flat"; stat: "toughness" | "hp" | "dex" | "awareness" | "morale"; value: number }
  | { type: "percent"; stat: "mitigation" | "avoidance"; value: number };

/** Weapon stat bonus (rare/epic). Flat stats only. Maps to attributes: dex→dexterity, hp→hit_points. */
export type WeaponBonus = {
  type: "flat";
  stat: "toughness" | "hp" | "dex" | "awareness" | "morale";
  value: number;
};

/** Epic weapon effect: passive combat modifiers. Values are additive (e.g. 0.02 = +2%). */
export type WeaponEffectModifiers = {
  chanceToHit?: number;
  chanceToEvade?: number;
  mitigateDamage?: number;
  damagePercent?: number;
  /** Multiplier for attack interval (0.95 = 5% faster). */
  attackIntervalMultiplier?: number;
};

export type WeaponEffectId =
  | "calibrated"
  | "balanced"
  | "lethal"
  | "heavy_caliber"
  | "steady_grip"
  | "quick_cycle"
  | "firebreaker"
  | "eye_for_an_eye"
  | "stormhammer"
  | "eagle_eye";

export interface Item {
  damage?: number;
  damage_min?: number;
  damage_max?: number;
  damage_type?: DamageType;
  description?: string;
  effect?: ItemEffect;
  icon?: string;
  id: string;
  level?: GearLevel; // Gear tier 1-10
  name: string;
  uses?: number;
  price?: number;
  quantity?: number;
  rarity?: Rarity;
  restrictRole?: "support" | "rifleman" | "medic" | "any"; // Weapon role restriction
  size?: number;
  speed_base?: WeaponBaseSpeed;
  tags?: string[];
  target: TargetType;
  toughness?: number; // Armor only
  type: ItemType;
  usable?: boolean;
  passiveEffect?: string; // Epic armor: display-only passive description
  bonuses?: WeaponBonus[]; // Rare/epic weapons: flat stat bonuses
  weaponEffect?: WeaponEffectId; // Epic weapons: passive combat trait
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
  | "level"
> & { bonuses?: ArmorBonus[]; passiveEffect?: string };

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
