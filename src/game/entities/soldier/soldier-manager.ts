import {
  type Attributes,
  type Designation,
  type Soldier,
  SOLDIER_DESIGNATION,
  type TraitDict,
} from "../types.ts";
import { TraitProfileStats } from "./soldier-traits.ts";
import { v4 as uuidv4 } from "uuid";

import {
  ATTRIBUTES_INCREASES_BY_LEVEL,
  SOLDIER_BASE,
  STANDARD_LOADOUTS,
} from "../levels.ts";
import { generateName } from "../../../utils/name-utils.ts";
import type {
  Armor,
  BallisticWeapon,
  Item,
} from "../../../constants/items/types.ts";
import {
  getRandomPortraitImage,
  getRandomValueFromStringArray,
} from "../../../utils/random.ts";
import { toFNum } from "../../../utils/number-utils.ts";
import { Images } from "../../../constants/images.ts";

function SoldierManager() {
  const experienceIncreaseBase = 100;
  const experienceMultiplier = 1.52;

  /**
   * Generate a soldier
   */
  function gs(
    lvl: number,
    designation: Designation,
    armor = {} as Armor,
    weapon = {} as BallisticWeapon,
    inventory = [] as Item[],
  ) {
    const soldier: Soldier = JSON.parse(
      JSON.stringify(SOLDIER_BASE),
    ) as Soldier;

    for (let i = 1; lvl > i; i++) {
      const definition = ATTRIBUTES_INCREASES_BY_LEVEL[i];
      soldier.attributes = {
        hit_points: soldier.attributes.hit_points + definition.hit_points,
        level: definition.level,
        dexterity: soldier.attributes.dexterity + definition.dexterity,
        morale: soldier.attributes.morale + definition.morale,
        toughness: soldier.attributes.toughness + definition.toughness,
        awareness: soldier.attributes.awareness + definition.awareness,
      };
    }

    soldier.name = generateName();
    soldier.avatar = getSoldierAvatar();
    soldier.inventory = inventory;
    soldier.weapon = weapon;
    soldier.armor = armor;
    soldier.level = lvl;
    soldier.id = uuidv4();
    soldier.designation = designation;
    soldier.trait_profile = getSoldierTraitProfile();
    soldier.experience = getExperienceBaseAtLevel(lvl).experience;

    applyTraitProfileStats(soldier);
    initializeCombatProfile(soldier);

    return soldier;
  }

  function getNewSoldier(level = 1, designation: Designation) {
    const { weapon, armor, inventory } = STANDARD_LOADOUTS[designation];
    return gs(level, designation, armor, weapon, inventory);
  }

  function applyTraitProfileStats(soldier: Soldier) {
    const traitKeys = Object.keys(soldier.trait_profile.stats);
    const soldierAtts = soldier.attributes;

    for (const key of traitKeys) {
      soldierAtts[key as keyof Attributes] =
        soldierAtts[key as keyof Attributes] + soldier.trait_profile.stats[key];
    }
  }

  function getSoldierAvatar() {
    const key = getRandomPortraitImage(Images.portrait);
    return Images.portrait[key];
  }

  function initializeCombatProfile(soldier: Soldier) {
    const atts = soldier.attributes;
    const cp = soldier.combatProfile;
    const calculator = attrToCombatProfileValue();

    const fromDex = calculator.dexterity(atts.dexterity);
    const fromTough = calculator.toughness(atts.toughness);
    const fromAware = calculator.awareness(atts.awareness);
    //const fromMorale = calculator.morale(atts.morale)

    cp.mitigateDamage = toFNum(cp.mitigateDamage + fromTough);
    cp.chanceToHit = toFNum(cp.chanceToHit + fromAware + fromDex);
    cp.chanceToEvade = toFNum(cp.chanceToEvade + fromAware + fromDex);
  }

  function attrToCombatProfileValue() {
    const dexterityDivisor = 12;
    const toughnessDivisor = 8;
    const moraleDivisor = 8;
    const awarenessDivisor = 14;

    return {
      morale: (m: number) => toFNum(m / moraleDivisor / 100),
      dexterity: (m: number) => toFNum(m / dexterityDivisor / 100),
      awareness: (m: number) => toFNum(m / awarenessDivisor / 100),
      toughness: (m: number) => toFNum(m / toughnessDivisor / 100),
    };
  }

  function getExperienceBaseAtLevel(lvl: number): {
    experience: number;
    level: number;
  } {
    const levelExperience: { level: number; experience: number }[] = [];

    for (let i = 1; i < 11; i++) {
      levelExperience.push({
        level: i,
        experience: Math.floor(
          experienceIncreaseBase * Math.pow(experienceMultiplier, i - 1),
        ),
      });
    }

    return levelExperience.find((l) => l.level === lvl) as {
      experience: number;
      level: number;
    };
  }

  function getSoldierTraitProfile(): TraitDict {
    const profiles = Object.keys(TraitProfileStats);
    const selectedProfile: string = getRandomValueFromStringArray(profiles);

    return {
      name: selectedProfile,
      stats: TraitProfileStats[selectedProfile],
    };
  }

  function generateTroopList(lvl = 1): Soldier[] {
    return [
      getNewSoldier(lvl, SOLDIER_DESIGNATION.rifleman),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.rifleman),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.rifleman),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.rifleman),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.support),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.support),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.medic),
    ];
  }

  return {
    generateSoldierAtLevel: gs,
    getExperienceBaseAtLevel,
    getNewRifleman: (lvl = 1) =>
      getNewSoldier(lvl, SOLDIER_DESIGNATION.rifleman),
    getNewSupportMan: (lvl = 1) =>
      getNewSoldier(lvl, SOLDIER_DESIGNATION.support),
    getNewMedic: (lvl = 1) => getNewSoldier(lvl, SOLDIER_DESIGNATION.medic),
    generateTroopList,
    getSoldierTraitProfile,
  };
}

const singleton = SoldierManager();

export { singleton as SoldierManager };
