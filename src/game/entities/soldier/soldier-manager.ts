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
  getEquipmentLoadoutForLevel,
  getStatsForLevel,
  SOLDIER_BASE,
} from "../levels.ts";
import { getSoldierXpRequiredForLevel } from "../../../constants/economy.ts";
import { generateName } from "../../../utils/name-utils.ts";
import type {
  Armor,
  ArmorBonus,
  BallisticWeapon,
  Item,
  WeaponBonus,
  WeaponEffectId,
} from "../../../constants/items/types.ts";
import { WEAPON_EFFECTS } from "../../../constants/items/weapon-effects.ts";
import {
  getRandomPortraitImage,
  getRandomValueFromStringArray,
  toFNum,
} from "../../../utils/math.ts";
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
    traitOverride?: TraitDict,
  ) {
    const soldier: Soldier = JSON.parse(
      JSON.stringify(SOLDIER_BASE),
    ) as Soldier;

    soldier.weapon = weapon;
    soldier.armor = armor;

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

    soldier.attributes.toughness += armor.toughness ?? 0;

    applyEquipmentBonuses(soldier, armor, weapon);

    soldier.name = generateName();
    soldier.avatar = getSoldierAvatar(designation);
    soldier.inventory = inventory;
    soldier.level = lvl;
    soldier.id = uuidv4();
    soldier.designation = designation;
    soldier.trait_profile = traitOverride ?? getSoldierTraitProfile();
    soldier.experience = getSoldierXpRequiredForLevel(lvl);

    applyTraitProfileStats(soldier);
    initializeCombatProfile(soldier);
    applyArmorPercentToCombatProfile(soldier, armor);
    applyWeaponPercentToCombatProfile(soldier, weapon);
    applyWeaponEffectToCombatProfile(soldier, weapon);

    return soldier;
  }

  function levelUpSoldier(soldier: Soldier, lvl: number) {
    const atts = getStatsForLevel(lvl) as Attributes;
    addUpAttributes(soldier, atts);
    soldier.level = lvl;
  }

  /** Recompute combat profile from current attributes, armor, weapon, trait. Call after level-up. */
  function refreshCombatProfile(soldier: Soldier) {
    const base = JSON.parse(JSON.stringify(SOLDIER_BASE.combatProfile)) as Soldier["combatProfile"];
    soldier.combatProfile = base;
    applyTraitProfileStats(soldier);
    initializeCombatProfile(soldier);
    if (soldier.armor) applyArmorPercentToCombatProfile(soldier, soldier.armor);
    if (soldier.weapon) {
      applyWeaponPercentToCombatProfile(soldier, soldier.weapon);
      applyWeaponEffectToCombatProfile(soldier, soldier.weapon);
    }
  }

  function addUpAttributes(soldier: Soldier, attributes: Attributes) {
    const atts = attributes;
    soldier.attributes = {
      hit_points: soldier.attributes.hit_points + atts.hit_points,
      level: atts.level,
      dexterity: soldier.attributes.dexterity + atts.dexterity,
      morale: soldier.attributes.morale + atts.morale,
      toughness: soldier.attributes.toughness + atts.toughness,
      awareness: soldier.attributes.awareness + atts.awareness,
    };
  }

  function getNewSoldier(level = 1, designation: Designation, traitOverride?: TraitDict) {
    const { weapon, armor, inventory } = getEquipmentLoadoutForLevel(level, designation);
    return gs(level, designation, armor, weapon, inventory, traitOverride);
  }

  const BONUS_STAT_TO_ATTR: Record<string, keyof Attributes> = {
    dex: "dexterity",
    hp: "hit_points",
    awareness: "awareness",
    morale: "morale",
    toughness: "toughness",
  };

  function applyEquipmentBonuses(
    soldier: Soldier,
    armor: Armor,
    weapon: BallisticWeapon,
  ) {
    const atts = soldier.attributes;
    const flatBonus = (b: ArmorBonus | WeaponBonus, attr: keyof Attributes) => {
      atts[attr] = (atts[attr] ?? 0) + b.value;
    };
    const armorBonuses = (armor as Armor & { bonuses?: ArmorBonus[] }).bonuses ?? [];
    const weaponBonuses = (weapon as BallisticWeapon & { bonuses?: WeaponBonus[] }).bonuses ?? [];
    for (const b of armorBonuses) {
      if (b.type === "flat") {
        const attr = BONUS_STAT_TO_ATTR[b.stat];
        if (attr) flatBonus(b, attr);
      }
    }
    for (const b of weaponBonuses) {
      if (b.type === "flat") {
        const attr = BONUS_STAT_TO_ATTR[b.stat];
        if (attr) flatBonus(b, attr);
      }
    }
    // Armor percent bonuses (mitigation, avoidance) applied in initializeCombatProfile via attributes
    // — actually they're not; toughness/dex/awareness feed into the formula. Percent bonuses
    // are direct combat profile modifiers. Apply them after initializeCombatProfile.
  }

  function applyWeaponPercentToCombatProfile(soldier: Soldier, weapon: BallisticWeapon) {
    const bonuses = (weapon as BallisticWeapon & { bonuses?: WeaponBonus[] }).bonuses ?? [];
    const cp = soldier.combatProfile;
    for (const b of bonuses) {
      if (b.type === "percent" && b.stat === "chanceToHit") {
        cp.chanceToHit = toFNum(Math.min(MAX_HIT_CHANCE, cp.chanceToHit + b.value / 100), PRECISION);
      }
    }
  }

  function applyArmorPercentToCombatProfile(soldier: Soldier, armor: Armor) {
    const bonuses = (armor as Armor & { bonuses?: ArmorBonus[] }).bonuses ?? [];
    const cp = soldier.combatProfile;
    for (const b of bonuses) {
      if (b.type === "percent") {
        const v = b.value / 100;
        if (b.stat === "mitigation") cp.mitigateDamage = toFNum(Math.min(MAX_MITIGATION, cp.mitigateDamage + v), PRECISION);
        if (b.stat === "avoidance") cp.chanceToEvade = toFNum(Math.min(MAX_AVOIDANCE, cp.chanceToEvade + v), PRECISION);
        if (b.stat === "chanceToHit") cp.chanceToHit = toFNum(Math.min(MAX_HIT_CHANCE, cp.chanceToHit + v), PRECISION);
      }
    }
  }

  function applyWeaponEffectToCombatProfile(soldier: Soldier, weapon: BallisticWeapon) {
    const effectId = (weapon as BallisticWeapon & { weaponEffect?: WeaponEffectId }).weaponEffect;
    if (!effectId) return;
    const effect = WEAPON_EFFECTS[effectId];
    if (!effect?.modifiers) return;
    const cp = soldier.combatProfile;
    const m = effect.modifiers;
    if (m.chanceToHit != null) cp.chanceToHit = toFNum(Math.min(MAX_HIT_CHANCE, cp.chanceToHit + m.chanceToHit), PRECISION);
    if (m.chanceToEvade != null) cp.chanceToEvade = toFNum(Math.min(MAX_AVOIDANCE, cp.chanceToEvade + m.chanceToEvade), PRECISION);
    if (m.mitigateDamage != null) cp.mitigateDamage = toFNum(Math.min(MAX_MITIGATION, cp.mitigateDamage + m.mitigateDamage), PRECISION);
  }

  function applyTraitProfileStats(soldier: Soldier) {
    const traitKeys = Object.keys(soldier.trait_profile.stats);
    const soldierAtts = soldier.attributes;

    for (const key of traitKeys) {
      soldierAtts[key as keyof Attributes] =
        soldierAtts[key as keyof Attributes] + soldier.trait_profile.stats[key];
    }
  }

  function getSoldierAvatar(designation?: Designation) {
    const des = String(designation ?? "").toLowerCase();
    if (des === SOLDIER_DESIGNATION.medic) {
      const key = getRandomPortraitImage(Images.medic_portrait);
      return Images.medic_portrait[key];
    }
    const key = getRandomPortraitImage(Images.portrait);
    return Images.portrait[key];
  }

  const MAX_MITIGATION = 0.6;
  const MAX_HIT_CHANCE = 0.98;
  const MAX_AVOIDANCE = 0.3;
  const PRECISION = 3;

  /** Level bonus: +1% CTH at 4,8,12,16; +2% at 20. Total 6% at max level. */
  function getLevelBonusChanceToHit(level: number): number {
    if (level >= 20) return 0.06;
    if (level >= 16) return 0.04;
    if (level >= 12) return 0.03;
    if (level >= 8) return 0.02;
    if (level >= 4) return 0.01;
    return 0;
  }

  function initializeCombatProfile(soldier: Soldier) {
    const atts = soldier.attributes;
    const cp = soldier.combatProfile;
    const calc = attrToCombatProfileValue();
    const precision = (n: number) => toFNum(n, PRECISION);
    const level = soldier.level ?? 1;

    const fromTough = calc.toughness(atts.toughness);
    const fromDexHit = calc.dexterityHit(atts.dexterity);
    const fromAwareHit = calc.awarenessHit(atts.awareness);
    const fromDexAvd = calc.dexterityAvd(atts.dexterity);
    const fromAwareAvd = calc.awarenessAvd(atts.awareness);
    const fromLevelHit = getLevelBonusChanceToHit(level);

    cp.mitigateDamage = precision(Math.min(MAX_MITIGATION, cp.mitigateDamage + fromTough));
    cp.chanceToHit = precision(Math.min(MAX_HIT_CHANCE, cp.chanceToHit + fromAwareHit + fromDexHit + fromLevelHit));
    cp.chanceToEvade = precision(Math.min(MAX_AVOIDANCE, cp.chanceToEvade + fromAwareAvd + fromDexAvd));
  }

  function attrToCombatProfileValue() {
    const toughnessDivisor = 9;
    const moraleDivisor = 8;
    const dexHitDivisor = 12;  // 12 DEX per 1% CTH
    const awareHitDivisor = 18; // 18 AWR per 1% CTH
    const dexAvdDivisor = 30;   // 30 DEX per 1% AVD (reduced effectiveness for gear headroom)
    const awareAvdDivisor = 24; // 24 AWR per 1% AVD

    return {
      morale: (m: number) => toFNum(m / moraleDivisor / 100, PRECISION),
      toughness: (m: number) => toFNum(m / toughnessDivisor / 100, PRECISION),
      dexterityHit: (m: number) => toFNum(m / dexHitDivisor / 100, PRECISION),
      awarenessHit: (m: number) => toFNum(m / awareHitDivisor / 100, PRECISION),
      dexterityAvd: (m: number) => toFNum(m / dexAvdDivisor / 100, PRECISION),
      awarenessAvd: (m: number) => toFNum(m / awareAvdDivisor / 100, PRECISION),
    };
  }

  function getExperienceBaseAtLevel(lvl: number): {
    experience: number;
    level: number;
  } {
    const levelExperience: { level: number; experience: number }[] = [];
    for (let i = 1; i <= 20; i++) {
      levelExperience.push({
        level: i,
        experience: Math.floor(
          experienceIncreaseBase * Math.pow(experienceMultiplier, i - 1),
        ),
      });
    }
    const found = levelExperience.find((l) => l.level === lvl);
    return (found ?? levelExperience[Math.min(lvl - 1, 19)]) as { experience: number; level: number };
  }

  function getSoldierTraitProfile(): TraitDict {
    const profiles = Object.keys(TraitProfileStats);
    const selectedProfile: string = getRandomValueFromStringArray(profiles);

    return {
      name: selectedProfile,
      stats: TraitProfileStats[selectedProfile],
    };
  }

  function getSoldierTraitProfileByName(traitName: string): TraitDict {
    const stats = TraitProfileStats[traitName as keyof typeof TraitProfileStats];
    if (!stats) throw new Error(`Unknown trait: ${traitName}`);
    return { name: traitName, stats };
  }

  function generateTroopList(lvl = 1): Soldier[] {
    return [
      getNewSoldier(lvl, SOLDIER_DESIGNATION.rifleman),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.rifleman),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.rifleman),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.rifleman),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.rifleman),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.rifleman),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.rifleman),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.rifleman),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.support),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.support),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.support),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.support),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.medic),
      getNewSoldier(lvl, SOLDIER_DESIGNATION.medic),
    ];
  }

  return {
    generateSoldierAtLevel: gs,
    getExperienceBaseAtLevel,
    getNewRifleman: (lvl = 1, traitOverride?: TraitDict) =>
      getNewSoldier(lvl, SOLDIER_DESIGNATION.rifleman, traitOverride),
    getNewSupportMan: (lvl = 1, traitOverride?: TraitDict) =>
      getNewSoldier(lvl, SOLDIER_DESIGNATION.support, traitOverride),
    getNewMedic: (lvl = 1, traitOverride?: TraitDict) =>
      getNewSoldier(lvl, SOLDIER_DESIGNATION.medic, traitOverride),
    getNewSoldier,
    generateTroopList,
    getSoldierTraitProfile,
    getSoldierTraitProfileByName,
    levelUpSoldier,
    refreshCombatProfile,
  };
}

const singleton = SoldierManager();

export { singleton as SoldierManager };
