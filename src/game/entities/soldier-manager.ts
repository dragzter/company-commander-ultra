import {
  type Designation,
  type Soldier,
  SOLDIER_DESIGNATION,
} from "./types.ts";
import { v4 as uuidv4 } from "uuid";

import {
  ATTRIBUTES_BY_LEVEL,
  SOLDIER_BASE,
  STANDARD_LOADOUTS,
} from "./levels.ts";
import { generateName } from "../../utils/name-utils.ts";
import type {
  Armor,
  BallisticWeapon,
  Item,
} from "../../constants/items/types.ts";

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
      const definition = ATTRIBUTES_BY_LEVEL[i];
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
    soldier.inventory = inventory;
    soldier.weapon = weapon;
    soldier.armor = armor;
    soldier.level = lvl;
    soldier.id = uuidv4();
    soldier.designation = designation;
    soldier.active = false;
    soldier.experience = getExperienceBaseAtLevel(lvl).experience;

    return soldier;
  }

  function getNewSoldier(level = 1, designation: Designation) {
    const { weapon, armor, inventory } = STANDARD_LOADOUTS[designation];
    return gs(level, designation, armor, weapon, inventory);
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

  function generateFirstList(): Soldier[] {
    return [
      getNewSoldier(1, SOLDIER_DESIGNATION.rifleman),
      getNewSoldier(1, SOLDIER_DESIGNATION.rifleman),
      getNewSoldier(1, SOLDIER_DESIGNATION.rifleman),
      getNewSoldier(1, SOLDIER_DESIGNATION.rifleman),
      getNewSoldier(1, SOLDIER_DESIGNATION.support),
      getNewSoldier(1, SOLDIER_DESIGNATION.support),
      getNewSoldier(1, SOLDIER_DESIGNATION.medic),
    ];
  }

  return {
    generateSoldierAtLevel: gs,
    getExperienceBaseAtLevel,
    getNewRifleman: () => getNewSoldier(1, SOLDIER_DESIGNATION.rifleman),
    getNewSupportMan: () => getNewSoldier(1, SOLDIER_DESIGNATION.support),
    getNewMedic: () => getNewSoldier(1, SOLDIER_DESIGNATION.medic),
    generateRiflemanAtLevel: (lvl: number) =>
      getNewSoldier(lvl, SOLDIER_DESIGNATION.rifleman),
    generateMedicAtLevel: (lvl: number) =>
      getNewSoldier(lvl, SOLDIER_DESIGNATION.medic),
    generateSupportManAtLevel: (lvl: number) =>
      getNewSoldier(lvl, SOLDIER_DESIGNATION.support),
    generateFirstList,
  };
}

const singleton = SoldierManager();

export { singleton as SoldierManager };
