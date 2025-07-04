import { getRandomValueFromStringArray } from "../../../utils/random.ts";

const PERMANENT_ENHANCEMENT: Record<string, Record<string, number>> = {
  hardened: {
    toughness: 5,
    hit_points: 6,
  },
  calm_under_fire: {
    morale: 6,
    awareness: 9,
  },
  battle_tested: {
    hit_points: 8,
    toughness: 2,
  },
  brave: {
    morale: 8,
  },
  tactician: {
    awareness: 10,
  },
  scout: {
    dexterity: 5,
    awareness: 3,
  },
  warrior: {
    toughness: 9,
    dexterity: 4,
  },
  stoic: {
    toughness: 7,
    hit_points: 7,
  },
};

const PERMANENT_INJURY: Record<string, Record<string, number>> = {
  one_eyed: {
    awareness: -10,
  },
  crippled_leg: {
    dexterity: -30,
    toughness: -4,
    hit_points: -5,
  },
  shattered_rib: {
    hit_points: -16,
    toughness: -3,
    dexterity: -3,
  },
  shell_shocked: {
    morale: -30,
    awareness: -6,
  },
  mangled_arm: {
    dexterity: -22,
    morale: -5,
  },
  nerve_damage: {
    dexterity: -8,
    awareness: -6,
    toughness: -5,
  },
  mangled_nose: {
    morale: -5,
  },
  body_burns: {
    morale: -4,
    toughness: 5,
  },
  missing_toe: {
    dexterity: -1,
  },
  missing_ear: {
    morale: -2,
    awareness: -2,
  },
  shattered_knee: {
    dexterity: -20,
    morale: -3,
  },
  herniated_disc: {
    dexterity: -6,
  },
  facial_scars: {
    toughness: 3,
    morale: 4,
  },
  mangled_foot: {
    dexterity: -18,
  },
  chronic_headache: {
    morale: -3,
    awareness: -4,
    toughness: -2,
  },
  chronic_joint_pain: {
    morale: -3,
    toughness: -2,
    dexterity: -4,
  },
  partially_deaf: {
    awareness: -9,
    morale: -2,
  },
  deaf: {
    awareness: -30,
    morale: -8,
  },
  crushed_shoulder: {
    dexterity: -15,
    hit_points: -8,
  },
  missing_leg: {
    dexterity: -44,
    morale: -16,
    hit_points: -25,
  },
  chronic_pain: {
    morale: -5,
    toughness: -2,
    dexterity: -3,
  },
  lung_scarring: {
    hit_points: -15,
    toughness: -6,
  },
  missing_finger: {
    dexterity: -4,
  },
  missing_fingers: {
    dexterity: -15,
    morale: -2,
  },
  missing_hand: {
    dexterity: -40,
    morale: -8,
  },
  scarring: {
    toughness: 2,
    dexterity: -1,
  },
  chronic_neck_injury: {
    dexterity: -8,
    awareness: -7,
  },
  missing_teeth: {
    morale: -1,
  },
};

function getRandomPermanentInjury() {
  const injuries = Object.keys(PERMANENT_INJURY);
  const injury = getRandomValueFromStringArray(injuries);
  return PERMANENT_INJURY[injury];
}

function getRandomPermanentEnhancement() {
  const enhancements = Object.keys(PERMANENT_ENHANCEMENT);
  const enhancement = getRandomValueFromStringArray(enhancements);
  return PERMANENT_ENHANCEMENT[enhancement];
}

export {
  PERMANENT_ENHANCEMENT,
  PERMANENT_INJURY,
  getRandomPermanentInjury,
  getRandomPermanentEnhancement,
};
