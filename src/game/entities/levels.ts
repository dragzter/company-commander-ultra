import type { Attributes } from "./types.ts";

const LEVEL_EXPERIENCE: Record<string, number> = {};

const base = 100;
const multiplier = 1.45;
const startLevel = 2;
const lastLevel = 11; // Level 10

for (let i = startLevel; i < lastLevel; i++) {
  LEVEL_EXPERIENCE["level_" + i] = Math.floor(base * multiplier);
}

const LEVEL_GAINS: Record<string, Attributes> = {
  two: {
    hit_points: 5,
    dexterity: 1,
    morale: 1,
    toughness: 2,
    awareness: 2,
  },
  three: {
    hit_points: 5,
    dexterity: 1,
    morale: 1,
    toughness: 3,
    awareness: 4,
  },
  four: {
    hit_points: 10,
    dexterity: 1,
    morale: 1,
    toughness: 3,
    awareness: 4,
  },
  five: {
    hit_points: 5,
    dexterity: 1,
    morale: 1,
    toughness: 3,
    awareness: 5,
  },
  six: {
    hit_points: 20,
    dexterity: 0,
    morale: 1,
    toughness: 4,
    awareness: 4,
  },
  seven: {
    hit_points: 10,
    dexterity: 0,
    morale: 1,
    toughness: 2,
    awareness: 5,
  },
  eight: {
    hit_points: 10,
    dexterity: 0,
    morale: 3,
    toughness: 3,
    awareness: 3,
  },
  nine: {
    hit_points: 10,
    dexterity: 0,
    morale: 2,
    toughness: 4,
    awareness: 5,
  },
  ten: {
    hit_points: 20,
    dexterity: 0,
    morale: 4,
    toughness: 10,
    awareness: 10,
  },
};

export { LEVEL_EXPERIENCE, LEVEL_GAINS };
