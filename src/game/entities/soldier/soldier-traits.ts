import type { SoldierTraitProfile } from "../types.ts";

const TraitProfileStats: Record<string, SoldierTraitProfile> = {
  loyalist: {
    morale: 16,
    toughness: 10,
    dexterity: -2,
    awareness: -5,
  },
  soldier: {
    morale: 10,
    toughness: 16,
    dexterity: -2,
    awareness: 6,
  },
  sentinel: {
    awareness: 15,
    morale: 2,
    toughness: 4,
    hit_points: 5,
    dexterity: -4,
  },
  protector: {
    morale: 2,
    toughness: 15,
    awareness: 6,
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
    awareness: 13,
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

export { TraitProfileStats };
