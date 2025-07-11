import {
  type Attributes,
  type CombatProfile,
  type Soldier,
  SOLDIER_DESIGNATION,
  SOLDIER_STATUS,
  type StandardLoadout,
  type TraitDict,
} from "./types.ts";
import { BallisticItems } from "../../constants/items/ballistic.ts";
import { ArmorItems } from "../../constants/items/armor.ts";
import { MedicalItems } from "../../constants/items/medical-items.ts";
import { ThrowableItems } from "../../constants/items/throwable.ts";

/**
 * Starting gear for new recruits (Level Agnostic equipment)
 */
const StandardEquipmentLoadouts: StandardLoadout = {
  rifleman: {
    weapon: BallisticItems.common.m5_assault_rifle,
    armor: ArmorItems.common.s3_flak_jacket,
    inventory: [
      ThrowableItems.common.m3_frag_grenade,
      ThrowableItems.common.m3_frag_grenade,
    ],
  },
  support: {
    weapon: BallisticItems.common.fasw_machine_gun,
    armor: ArmorItems.common.m108_flak_jacket,
    inventory: [ThrowableItems.common.mk18_smoke],
  }, // Machine gunner
  medic: {
    weapon: BallisticItems.common.m5_assault_rifle,
    armor: ArmorItems.common.s3_flak_jacket,
    inventory: [
      MedicalItems.common.standard_medkit,
      MedicalItems.common.standard_medkit,
      MedicalItems.common.stim_pack,
    ],
  },
};

const ATTRIBUTES_INCREASES_BY_LEVEL: Attributes[] = [
  {
    hit_points: 100,
    morale: 50,
    dexterity: 50,
    toughness: 50,
    awareness: 30,
    level: 1,
  },
  {
    hit_points: 10,
    dexterity: 1,
    morale: 1,
    toughness: 2,
    awareness: 2,
    level: 2,
  },
  {
    hit_points: 10,
    dexterity: 1,
    morale: 1,
    toughness: 3,
    awareness: 4,
    level: 3,
  },
  {
    hit_points: 15,
    dexterity: 1,
    morale: 1,
    toughness: 3,
    awareness: 4,
    level: 4,
  },
  {
    hit_points: 10,
    dexterity: 1,
    morale: 1,
    toughness: 3,
    awareness: 5,
    level: 5,
  },
  {
    hit_points: 30,
    dexterity: 0,
    morale: 1,
    toughness: 4,
    awareness: 4,
    level: 6,
  },
  {
    hit_points: 15,
    dexterity: 0,
    morale: 1,
    toughness: 2,
    awareness: 5,
    level: 7,
  },
  {
    hit_points: 15,
    dexterity: 1,
    morale: 3,
    toughness: 3,
    awareness: 3,
    level: 8,
  },
  {
    hit_points: 15,
    dexterity: 0,
    morale: 2,
    toughness: 5,
    awareness: 5,
    level: 9,
  },
  {
    hit_points: 20,
    dexterity: 0,
    morale: 4,
    toughness: 10,
    awareness: 10,
    level: 10,
  },
];

function getStatsForLevel(lvl: number) {
  if (lvl < 0 || lvl > 10) return;
  return ATTRIBUTES_INCREASES_BY_LEVEL[lvl - 1];
}

const SOLDIER_BASE: Soldier = {
  id: "",
  name: "",
  attributes: ATTRIBUTES_INCREASES_BY_LEVEL[0],
  experience: 0,
  level: 1,
  avatar: "",
  designation: SOLDIER_DESIGNATION.rifleman,
  status: SOLDIER_STATUS.inactive,
  combatProfile: {
    chanceToEvade: 0.01,
    chanceToHit: 0.6,
    suppression: 0.3,
    mitigateDamage: 0.02,
  } as CombatProfile,
  trait_profile: {} as TraitDict,
  inventory: [],
  events: [],
};

export {
  getStatsForLevel,
  SOLDIER_BASE,
  ATTRIBUTES_INCREASES_BY_LEVEL,
  StandardEquipmentLoadouts,
};
