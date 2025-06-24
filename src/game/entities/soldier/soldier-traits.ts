import { getRandomValueFromStringArray } from "../../../utils/random.ts";

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

const TraitKeys = Object.keys(SOLDIER_TRAIT);

/**
 * protector:
 * toughness: 6
 * hitpoints: 13
 * awareness: 8
 * morale: 2
 */

const TraitProfile: Record<string, string[]> = {
  loyalist: [
    SOLDIER_TRAIT.loyal,
    SOLDIER_TRAIT.obedient,
    SOLDIER_TRAIT.resilient,
  ],
  sentinel: [
    SOLDIER_TRAIT.vigilant, // +8 Awareness, +2 Morale
    SOLDIER_TRAIT.sturdy, // +4 Toughness, +5 Hitpoints
    SOLDIER_TRAIT.clumsy, // -4 Dexterity
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
  drifter: [
    SOLDIER_TRAIT.agile, // +3 Dexterity, -1 Hitpoints
    SOLDIER_TRAIT.skittish, // -6 Morale, +4 Awareness
    SOLDIER_TRAIT.needy, // -5 Toughness
  ],
  sharpshooter: [
    SOLDIER_TRAIT.competent,
    SOLDIER_TRAIT.vigilant,
    SOLDIER_TRAIT.agile,
  ],
  defector: [
    SOLDIER_TRAIT.intelligent, // +9 Awareness, -2 Morale
    SOLDIER_TRAIT.brazen, // +5 Morale, -1 Awareness
    SOLDIER_TRAIT.frail, // -20 Hitpoints, +3 Awareness
  ],
  bulldog: [
    SOLDIER_TRAIT.tenacious,
    SOLDIER_TRAIT.resilient,
    SOLDIER_TRAIT.ferocious,
  ],
  grunt: [
    SOLDIER_TRAIT.resilient,
    SOLDIER_TRAIT.tenacious,
    SOLDIER_TRAIT.scrappy,
  ],
  ghost: [SOLDIER_TRAIT.agile, SOLDIER_TRAIT.impulsive, SOLDIER_TRAIT.skittish],
  veteran: [
    SOLDIER_TRAIT.focused,
    SOLDIER_TRAIT.intelligent,
    SOLDIER_TRAIT.hardliner,
  ],
  rebel: [SOLDIER_TRAIT.brazen, SOLDIER_TRAIT.reckless, SOLDIER_TRAIT.clumsy],
  rookie: [
    SOLDIER_TRAIT.scrawny,
    SOLDIER_TRAIT.forgetful,
    SOLDIER_TRAIT.obedient,
  ],

  brawler: [
    SOLDIER_TRAIT.ferocious,
    SOLDIER_TRAIT.sturdy,
    SOLDIER_TRAIT.reckless,
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

  warhero: [
    SOLDIER_TRAIT.vigilant,
    SOLDIER_TRAIT.durable,
    SOLDIER_TRAIT.intelligent,
  ],
};

const TraitProfileStats: Record<string, Record<string, number>> = {
  loyalist: {
    morale: 12,
    toughness: 10,
    dexterity: -2,
  },
  soldier: {
    morale: 10,
    toughness: 12,
    dexterity: -2,
    awareness: 6,
  },
  sentinel: {
    awareness: 8,
    morale: 2,
    toughness: 4,
    hit_points: 5,
    dexterity: -4,
  },
  protector: {
    morale: 2,
    toughness: 6,
    awareness: 8,
    hit_points: 13,
  },
  drifter: {
    dexterity: 3,
    awareness: 4,
    morale: -6,
    hit_points: -1,
    toughness: -5,
  },
  defector: {
    awareness: 11, // 9 + (-1) + 3
    morale: 3, // -2 + 5
    hit_points: -20,
  },
  fanatic: {
    morale: 18,
    toughness: 7,
    awareness: -13,
  },
  opportunist: {
    morale: 5,
    toughness: 2,
    dexterity: 8,
    awareness: -5,
  },
  cynic: {
    morale: -2,
    dexterity: -5,
    awareness: 4,
  },
  idealist: {
    morale: 10,
    toughness: 2,
    awareness: 6,
    hit_points: -20,
  },
  enforcer: {
    morale: 20,
    toughness: 15,
    awareness: -4,
    hit_points: 3,
  },
  survivor: {
    toughness: 2,
    awareness: 2,
    hit_points: 6,
  },
  zealot: {
    morale: 20,
    toughness: -15,
    awareness: -4,
  },
  skeptic: {
    morale: -4,
    toughness: -5,
    awareness: -1,
  },
  warhero: {
    awareness: 17,
    hit_points: 8,
    toughness: 2,
  },
  sharpshooter: {
    dexterity: 8, // 5 (competent) + 3 (agile)
    awareness: 17, // 3 (competent) + 8 (vigilant) + 6 (agile)
    morale: 2,
    hit_points: -1,
  },
  bulldog: {
    toughness: 27, // 7 + 10 + 10 (resilient)
    dexterity: -2,
    awareness: -3,
    hit_points: 9,
  },
  grunt: {
    toughness: 23, // 10 + 7 + 6
    dexterity: -2,
    awareness: 2,
    hit_points: 6,
  },
  ghost: {
    dexterity: 5, // 3 (agile) + 2 (impulsive)
    awareness: 4, // 4 (skittish)
    morale: -6,
    hit_points: -1,
  },
  veteran: {
    awareness: 15, // 6 (focused) + 9 (intelligent)
    toughness: 4,
    morale: 4, // -2 (intelligent) + 6 (hardliner)
    hit_points: 3,
  },
  rebel: {
    morale: 10, // 5 (brazen) + 5 (reckless)
    awareness: -13, // -1 -8 (reckless) -4 (clumsy)
    dexterity: -4,
  },
  rookie: {
    morale: 4,
    dexterity: 2,
    awareness: -9,
    hit_points: -6,
  },
  brawler: {
    morale: 10, // 5 (reckless) + 5 (ferocious)
    awareness: -11, // -3 (ferocious) -8 (reckless)
    toughness: 4,
    hit_points: 14, // 9 + 5
  },
};

function getRandomTrait() {
  const trait = getRandomValueFromStringArray(TraitKeys);
  return TraitProfileStats[trait];
}

export { SOLDIER_TRAIT, TraitProfile, TraitProfileStats, getRandomTrait };
