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

/** Gear level bounds. */
export const MIN_GEAR_LEVEL = 1;
export const BASE_GEAR_LEVEL_CAP = 20;
export const MAX_GEAR_LEVEL = 999;

/** Level/tier of gear (1-999). Same base item at higher level = better stats. */
export type GearLevel = number;

/** Armor bonus: flat stats (TGH, HP, etc) or percent (MIT, AVD, CTH). Percent bonuses don't scale with tier. */
export type ArmorBonus =
  | { type: "flat"; stat: "toughness" | "hp" | "dex" | "awareness" | "morale"; value: number }
  | { type: "percent"; stat: "mitigation" | "avoidance" | "chanceToHit"; value: number };

/** Weapon stat bonus (rare/epic). Flat stats map to attributes; percent stats to combat profile. */
export type WeaponBonus =
  | { type: "flat"; stat: "toughness" | "hp" | "dex" | "awareness" | "morale"; value: number }
  | { type: "percent"; stat: "chanceToHit"; value: number };

/** Epic weapon effect: passive combat modifiers. Values are additive (e.g. 0.02 = +2%). */
export type WeaponEffectModifiers = {
  chanceToHit?: number;
  chanceToEvade?: number;
  mitigateDamage?: number;
  damagePercent?: number;
  /** Increases medkit healing effectiveness (0.1 = +10%). */
  medkitHealPercent?: number;
  /** Multiplier for attack interval (0.95 = 5% faster). */
  attackIntervalMultiplier?: number;
  /** Ignores this fraction of target's avoidance (0.6 = ignores 60% of it). */
  ignoreAvoidancePercent?: number;
};

export type WeaponEffectId =
  | "calibrated"
  | "balanced"
  | "lethal"
  | "heavy_caliber"
  | "steady_grip"
  | "quick_cycle"
  | "trauma_surgeon"
  | "firebreaker"
  | "eye_for_an_eye"
  | "stormhammer"
  | "eagle_eye"
  | "target_acquired"
  | "carnage"
  | "overwhelm"
  | "focused"
  | "eviscerate";

export interface Item {
  /** Base ID for gear (e.g. infantry_harness). Used for immunities, minLevel checks. */
  baseId?: string;
  damage?: number;
  damage_min?: number;
  damage_max?: number;
  damage_type?: DamageType;
  description?: string;
  /** Flavor text shown above mechanics (lore, personality). */
  flavor?: string;
  effect?: ItemEffect;
  icon?: string;
  id: string;
  level?: GearLevel; // Gear tier 1-999
  /** If true, item has no level scaling (e.g. stim pack, flashbang, smoke). No Lv badge, fixed price. */
  noLevel?: boolean;
  /** Armor only: immunities granted (e.g. stun, panic). Shown in effect box. */
  immunities?: ("stun" | "panic" | "suppression" | "burning")[];
  /** Armor only: named special effect (Infantry Grunt, Unshakeable, Relentless). */
  specialEffect?: string;
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
  passiveEffectName?: string; // Epic armor: effect box label (replaces generic "Effect")
  bonuses?: WeaponBonus[] | ArmorBonus[]; // Rare/epic weapons: flat stat bonuses; armor: flat or percent
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
  | "flavor"
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
  | "baseId"
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
