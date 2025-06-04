export type Trait = {
  morale: {
    positive: number;
    negative: number;
  };
  initiative: {
    positive: number;
    negative: number;
  };
  defense: {
    positive: number;
    negative: number;
  };
  offense: {
    positive: number;
    negative: number;
  };
  logistics: {
    positive: number;
    negative: number;
  };
};

export type Unit = {
  name: string;
  motto: string;
  nickname: string;
  allegiance: string;
  id: string;
  traits: Trait[];
};

export type FactionAttribute = {
  key: string;
  affected_by: {
    positive: string[];
    negative: string[];
  };
};

export type ElOptions = {
  classes?: string[];
  id?: string;
  src?: string;
  attributes?: {
    [key: string]: string;
  };
};

export type BtnOptions = {
  text: string;
  cb?: (e: Event) => void;
  event?: string;
  classes?: string[];
  id?: string;
  sound?: string;
};

// Menu buttons
export type MBtnOptions = {
  text: string;
  cb?: (e: Event) => void;
  event?: string;
  color: string;
  classes?: string[];
  id?: string;
  sound?: string;
};

export type HandlerInitConfig = {
  eventType: keyof HTMLElementEventMap;
  selector: string;
  callback: EventListener;
};

// DAMAGE
export const DAMAGE_TYPES = {
  ballistic: "ballistic",
  explosive: "explosive",
  chemical: "chemical",
  kinetic: "kinetic",
  radiation: "radiation",
  psychological: "psychological",
} as const;

export type DamageType = keyof typeof DAMAGE_TYPES;

// Inventory
export const RARITY = {
  common: "common",
  rare: "rare",
  epic: "epic",
} as const;

export const ITEM_TYPES = {
  melee_weapon: "melee_weapon",
  ranged_weapon: "ranged_weapon",
  medical: "medical",
  food: "food",
  tool: "tool",
  gear: "gear",
  ammo: "ammo",
  junk: "junk",
  throwable: "throwable",
} as const;

export const EFFECT_TYPES = {
  heal: "heal",
  damage: "damage",
  buff: "buff",
  debuff: "debuff",
} as const;

export const EFFECT_RESULTS = {
  panic: "panic",
  suppression: "suppression",
  confusion: "confusion",
  adrenaline_boost: "adrenaline_boost",
  healing: "healing",
  recovery: "recovery",
  focus: "focus",
  fatigue: "fatigue",
  bleed: "bleed",
  burn: "burn",
  poison: "poison",
  cleansing: "cleansing",
  concealment: "concealment",
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

export type EffectType = keyof typeof EFFECT_TYPES;

export type Rarity = keyof typeof RARITY;

export type TargetType = keyof typeof TARGET_TYPES;

export type EffectResult = keyof typeof EFFECT_RESULTS;

export type EffectSeverity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type WeaponBaseSpeed = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10; // Lower is slower

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description?: string;
  quantity?: number;
  icon?: string;
  usable?: boolean;
  rarity?: Rarity;
  tags?: string[];
  damage?: number;
  damage_type: DamageType;
  size?: number;
  target: TargetType;
  effect?: ItemEffect;
  price?: number;
  speed_base?: WeaponBaseSpeed;
}

export type ThrowableItem = Partial<Item>;
export type BallisticWeapon = Partial<Item>;
export type MeleeWeapon = Partial<Item>;
export type JunkItem = Partial<Item>;
export type MedItem = Partial<Item>;
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
