import type {
  Armor,
  BallisticWeapon,
  Item,
} from "../../constants/items/types.ts";

const SOLDIER_DESIGNATION = {
  rifleman: "rifleman",
  support: "support",
  medic: "medic",
} as const;

const SOLDIER_TRAIT = {
  survivalist: "survivalist", // +6 Hitpoints, +3 Toughness
  durable: "durable", // +8 Hitpoints, +2 Toughness
  ferocious: "ferocious", // +9 Hitpoints, -3 Awareness
  resilient: "resilient", // +10 Toughness, -2 Dexterity
  scrappy: "scrappy", // +6 Toughness, +2 Awareness
  tenacious: "tenacious", // + 7 toughness
  sturdy: "sturdy", // +4 Toughness, +5 Hitpoints
  fearless: "fearless", // +15 Morale, -3 Awareness
  disciplined: "disciplined", // +10 morale
  implacable: "implacable", // +9 Morale, +2 Toughness, -1 Awareness
  loyal: "loyal", // +8 Morale
  hardliner: "hardliner", // +6 Morale, +3 Hitpoints
  brazen: "brazen", // +5 Morale, -1 Awareness
  obedient: "obedient", // +4 Morale
  competent: "competent", // +5 Dexterity, +3 Awareness
  athletic: "athletic", // + 6 Dexterity, +2 Toughness
  agile: "agile", // +3 dexterity, -1 Hitpoints
  vigilant: "vigilant", // +8 Awareness, +2 Morale
  focused: "focused", // +6 Awareness, +2 Toughness
  intelligent: "intelligent", // +9 Awareness, -2 Morale
  stubborn: "stubborn", // +5 Toughness, -4 Awareness, +4 Morale
  frail: "frail", // -20 Hitpoints, +3 Awareness
  fragile: "fragile", // -12 Hitpoints
  scrawny: "scrawny", // -6 Hitpoints, +2 Dexterity
  vulnerable: "vulnerable", // -15 Toughness
  wimpy: "wimpy", // -7 Toughness
  needy: "needy", // -5 Toughness
  clumsy: "clumsy", // -4 Dexterity
  sluggish: "sluggish", // -5 dexterity
  skittish: "skittish", // -6 Morale, +4 Awareness
  reckless: "reckless", // -8 Awareness, +5 Morale
  forgetful: "forgetful", // -9 Awareness
  arrogant: "arrogant", // -5 awareness
  impulsive: "impulsive", // -4 awareness, +2 Dexterity
} as const;

const TraitProfile: Record<string, string[]> = {
  loyalist: [
    SOLDIER_TRAIT.loyal,
    SOLDIER_TRAIT.obedient,
    SOLDIER_TRAIT.resilient,
  ],

  soldier: [
    SOLDIER_TRAIT.resilient,
    SOLDIER_TRAIT.disciplined,
    SOLDIER_TRAIT.focused,
  ],

  protector: [
    SOLDIER_TRAIT.durable,
    SOLDIER_TRAIT.sturdy,
    SOLDIER_TRAIT.vigilant,
  ],

  fanatic: [
    SOLDIER_TRAIT.implacable,
    SOLDIER_TRAIT.stubborn,
    SOLDIER_TRAIT.reckless,
  ],

  opportunist: [
    SOLDIER_TRAIT.athletic,
    SOLDIER_TRAIT.impulsive,
    SOLDIER_TRAIT.brazen,
  ],

  cynic: [
    SOLDIER_TRAIT.intelligent,
    SOLDIER_TRAIT.arrogant,
    SOLDIER_TRAIT.sluggish,
  ],

  idealist: [SOLDIER_TRAIT.loyal, SOLDIER_TRAIT.focused, SOLDIER_TRAIT.frail],

  enforcer: [
    SOLDIER_TRAIT.hardliner,
    SOLDIER_TRAIT.disciplined,
    SOLDIER_TRAIT.stubborn,
  ],

  survivor: [
    SOLDIER_TRAIT.survivalist,
    SOLDIER_TRAIT.scrappy,
    SOLDIER_TRAIT.wimpy,
  ],

  zealot: [
    SOLDIER_TRAIT.fearless,
    SOLDIER_TRAIT.brazen,
    SOLDIER_TRAIT.vulnerable,
  ],

  skeptic: [
    SOLDIER_TRAIT.vigilant,
    SOLDIER_TRAIT.forgetful,
    SOLDIER_TRAIT.needy,
  ],
};

export type Designation = keyof typeof SOLDIER_DESIGNATION;

export interface Soldier {
  id: string; // guid
  name: string;
  level: number; // increases all attributes according to a scale
  experience: number;
  active: boolean;

  armor?: Armor;
  weapon?: BallisticWeapon;

  // Attributes
  attributes: Attributes;
  designation: Designation;
  traits: string[];

  // History
  inventory: Item[];
  events: []; // a way to track history, wounded, killed, record battles.
}

export interface Attributes {
  hit_points: number; // Health bar
  dexterity: number; // Accuracy - chance to hit, initiative
  morale: number; // affects how easy it is to suppress, affect with psychic weapons, run away
  toughness: number; // Mitigation - flat reduction in damage
  awareness: number;
  level?: number;
}

export type StandardLoadout = Record<
  keyof typeof SOLDIER_DESIGNATION,
  {
    weapon: BallisticWeapon;
    armor: Armor;
    inventory: Item[];
  }
>;

export interface Company {
  soldiers: Soldier[];
  name: string;
  level: number;
  experience: number;
  companyName: string;
  commander: string;
}

export { SOLDIER_TRAIT, SOLDIER_DESIGNATION, TraitProfile };
