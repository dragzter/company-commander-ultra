import { getRandomValueFromStringArray } from "../../../utils/random.ts";

const PERMANENT_INJURY: Record<string, Record<string, number>> = {
  one_eyed: {
    awareness: -8,
  },
  crippled_leg: {
    dexterity: -10,
    toughness: -2,
    hit_points: -5,
  },
  shattered_rib: {
    hit_points: -12,
    toughness: -3,
    dexterity: -3,
  },
  shell_shocked: {
    morale: -20,
    awareness: -6,
  },
  mangled_arm: {
    dexterity: -12,
    morale: -5,
  },
  nerve_damage: {
    dexterity: -8,
    awareness: -6,
    toughness: -5,
  },
  mangled_nose: {
    morale: -6,
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
    dexterity: -10,
    morale: -3,
  },
  herniated_disc: {
    dexterity: -5,
  },
  facial_scars: {
    toughness: 3,
    morale: 4,
  },
  mangled_foot: {
    dexterity: -13,
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
    dexterity: -8,
    hit_points: -3,
  },
  missing_leg: {
    dexterity: -34,
    morale: -16,
    hit_points: -15,
  },
  chronic_pain: {
    morale: -4,
    toughness: -2,
    dexterity: -3,
  },
  lung_scarring: {
    hit_points: -12,
    toughness: -6,
  },
  missing_finger: {
    dexterity: -4,
  },
  missing_fingers: {
    dexterity: -9,
    morale: -2,
  },
  missing_hand: {
    dexterity: -30,
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

export { PERMANENT_INJURY, getRandomPermanentInjury };
