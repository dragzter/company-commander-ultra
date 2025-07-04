import type { SoldierTraitProfile } from "../types.ts";

const TraitProfileStats: Record<string, SoldierTraitProfile> = {
  loyalist: {
    morale: 16,
    toughness: 12,
    dexterity: -4,
    awareness: -5,
  },
  soldier: {
    morale: 10,
    toughness: 18,
    dexterity: -2,
    awareness: 6,
  },
  reckless: {
    toughness: 10,
    morale: 5,
    awareness: -10,
  },
  unhinged: {
    awareness: -15,
    morale: 6,
    toughness: 8,
  },
  model_soldier: {
    morale: 12,
    toughness: 12,
    awareness: 4,
  },
  scoundrel: {
    awareness: 18,
    morale: -8,
    toughness: -6,
    dexterity: 9,
  },
  sentinel: {
    awareness: 15,
    morale: 2,
    toughness: 5,
    hit_points: 5,
    dexterity: 4,
  },
  protector: {
    morale: 2,
    toughness: 15,
    awareness: 6,
    hit_points: 25,
  },
  balanced: {
    morale: 5,
    toughness: 5,
    dexterity: 5,
    awareness: 5,
    hit_points: 5,
  },
  easy_going: {
    morale: 5,
    toughness: 5,
  },
  wiry: {
    toughness: 15,
    dexterity: 6,
  },
  trail_blazer: {
    toughness: 5,
    awareness: 16,
    dexterity: 8,
  },
  crusader: {
    morale: 12,
    toughness: 10,
    awareness: -12,
    hit_points: 20,
  },
  drifter: {
    dexterity: 5,
    awareness: 8,
    morale: -8,
    hit_points: -4,
    toughness: -10,
  },
  defector: {
    awareness: 15,
    morale: 3,
    hit_points: -20,
  },
  fanatic: {
    morale: 22,
    toughness: 7,
    awareness: -15,
  },
  opportunist: {
    dexterity: 8,
    awareness: 14,
  },
  cynic: {
    morale: -8,
    dexterity: -6,
    awareness: 8,
  },
  idealist: {
    morale: 12,
    toughness: 12,
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
    toughness: 20,
    awareness: 2,
    hit_points: 10,
  },
  zealot: {
    morale: 20,
    toughness: -15,
    hit_points: 10,
    awareness: -10,
  },
  skeptic: {
    morale: -4,
    toughness: -5,
    awareness: -1,
  },
  lunatic: {
    awareness: -25,
    toughness: 20,
    morale: 20,
  },
  war_hero: {
    awareness: 18,
    hit_points: 10,
    toughness: 8,
  },
  sharpshooter: {
    dexterity: 10,
    awareness: 28,
    morale: 2,
    hit_points: -3,
  },
  joker: {
    awareness: 20,
    toughness: -3,
  },
  brutal: {
    hit_points: 8,
    morale: 5,
    toughness: 6,
  },
  bulldog: {
    toughness: 27,
    dexterity: -2,
    awareness: -3,
    hit_points: 9,
  },
  burly: {
    toughness: 15,
    hit_points: 4,
    dexterity: -4,
  },
  thoughtful: {
    awareness: 10,
  },
  grunt: {
    toughness: 23,
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
  stoic: {
    toughness: 25,
    hit_points: 10,
    dexterity: -4,
  },

  veteran: {
    awareness: 15,
    toughness: 4,
    morale: 4,
    hit_points: 3,
  },
  rebel: {
    morale: 10,
    awareness: -13,
    dexterity: -4,
  },
  rookie: {
    morale: 4,
    dexterity: 2,
    awareness: -9,
    hit_points: -6,
  },
  brawler: {
    morale: 10,
    awareness: -11,
    toughness: 4,
    hit_points: 14,
  },
  bruiser: {
    hit_points: 10,
    toughness: 15,
    awareness: -5,
  },
  douchy: {
    dexterity: -5,
    awareness: 5,
    morale: -4,
  },
  alpha_dog: {
    morale: 20,
    hit_points: 5,
    awareness: 10,
  },
  psycho: {
    morale: 30,
    awareness: -20,
    hit_points: -10,
    dexterity: 5,
  },
  kind_of_a_dick: {
    dexterity: -5,
    morale: -5,
    hit_points: 5,
    awareness: 5,
  },
  smartass: {
    morale: -10,
    awareness: 20,
  },
};

export { TraitProfileStats };
