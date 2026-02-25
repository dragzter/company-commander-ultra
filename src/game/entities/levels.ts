import {
  type Attributes,
  type CombatProfile,
  type Designation,
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
import { ARMOR_BASES, createArmor } from "../../constants/items/armor-bases.ts";
import { WEAPON_BASES, createWeapon } from "../../constants/items/weapon-bases.ts";

/**
 * Starting gear for new recruits (used as fallback / higher-level reference).
 * Level 1 recruits use getEquipmentLoadoutForLevel instead (tier 1 basic gear).
 */
const StandardEquipmentLoadouts: StandardLoadout = {
  rifleman: {
    weapon: BallisticItems.common.m5_assault_rifle,
    armor: ArmorItems.common.s3_flak_jacket,
    inventory: [ThrowableItems.common.m3_frag_grenade],
  },
  support: {
    weapon: BallisticItems.common.fasw_machine_gun,
    armor: ArmorItems.common.m108_flak_jacket,
    inventory: [ThrowableItems.common.mk18_smoke],
  }, // Machine gunner
  medic: {
    weapon: BallisticItems.common.m5_assault_rifle,
    armor: ArmorItems.common.s3_flak_jacket,
    inventory: [MedicalItems.common.standard_medkit],
  },
};

/** Weapon base IDs per designation for tier-scaled loadouts. */
const LOADOUT_WEAPON_BASES: Record<Designation, string> = {
  rifleman: "m5_assault_rifle",
  support: "m240_delta", // Lighter than fasw; tier 1 = 26 dmg vs 35
  medic: "compact_smg",
};

/** Armor base IDs per designation for tier-scaled loadouts. */
const LOADOUT_ARMOR_BASES: Record<Designation, string> = {
  rifleman: "s3_flak",
  support: "m108_flak",
  medic: "s3_flak",
};

/** Level-based loadout: tier 1 = basic gear for recruits, tier scales with level (1-20). */
export function getEquipmentLoadoutForLevel(level: number, designation: Designation) {
  const tier = Math.max(1, Math.min(20, level)) as import("../../constants/items/types.ts").GearLevel;
  const weaponBase = WEAPON_BASES.find((b) => b.baseId === LOADOUT_WEAPON_BASES[designation]);
  const armorBase = ARMOR_BASES.find((b) => b.baseId === LOADOUT_ARMOR_BASES[designation]);
  if (!weaponBase || !armorBase) {
    return StandardEquipmentLoadouts[designation];
  }
  const weapon = createWeapon(weaponBase, tier);
  const armor = createArmor(armorBase, tier);
  const inventory =
    designation === "medic"
      ? [MedicalItems.common.standard_medkit]
      : designation === "support"
        ? [ThrowableItems.common.mk18_smoke]
        : [ThrowableItems.common.m3_frag_grenade];
  return { weapon, armor, inventory };
}

const ATTRIBUTES_INCREASES_BY_LEVEL: Attributes[] = [
  {
    hit_points: 100,
    morale: 50,
    dexterity: 50,
    toughness: 35,
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
  { hit_points: 20, dexterity: 0, morale: 4, toughness: 10, awareness: 10, level: 10 },
  { hit_points: 20, dexterity: 1, morale: 2, toughness: 4, awareness: 4, level: 11 },
  { hit_points: 25, dexterity: 0, morale: 2, toughness: 5, awareness: 5, level: 12 },
  { hit_points: 20, dexterity: 1, morale: 3, toughness: 5, awareness: 5, level: 13 },
  { hit_points: 25, dexterity: 0, morale: 2, toughness: 6, awareness: 6, level: 14 },
  { hit_points: 25, dexterity: 1, morale: 3, toughness: 5, awareness: 6, level: 15 },
  { hit_points: 30, dexterity: 0, morale: 3, toughness: 6, awareness: 6, level: 16 },
  { hit_points: 25, dexterity: 1, morale: 4, toughness: 6, awareness: 6, level: 17 },
  { hit_points: 30, dexterity: 0, morale: 3, toughness: 7, awareness: 7, level: 18 },
  { hit_points: 30, dexterity: 1, morale: 4, toughness: 7, awareness: 7, level: 19 },
  { hit_points: 35, dexterity: 0, morale: 5, toughness: 10, awareness: 10, level: 20 },
];

function getStatsForLevel(lvl: number) {
  if (lvl < 1 || lvl > 20) return;
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

/** Level benefits for codex: stat gains and special bonuses per level. */
export function getLevelBenefitsForCodex(): { level: number; gains: string; gainsBadges: string[]; special?: string }[] {
  const rows: { level: number; gains: string; gainsBadges: string[]; special?: string }[] = [];
  for (let i = 0; i < ATTRIBUTES_INCREASES_BY_LEVEL.length; i++) {
    const def = ATTRIBUTES_INCREASES_BY_LEVEL[i];
    const lvl = def.level;
    const parts: string[] = [];
    const gainsBadges: string[] = [];
    if (def.hit_points > 0) {
      parts.push(`+${def.hit_points} HP`);
      gainsBadges.push(`+${def.hit_points} HP`);
    }
    if (def.dexterity > 0) {
      parts.push(`+${def.dexterity} DEX`);
      gainsBadges.push(`+${def.dexterity} DEX`);
    }
    if (def.morale > 0) {
      parts.push(`+${def.morale} MOR`);
      gainsBadges.push(`+${def.morale} MOR`);
    }
    if (def.toughness > 0) {
      parts.push(`+${def.toughness} TGH`);
      gainsBadges.push(`+${def.toughness} TGH`);
    }
    if (def.awareness > 0) {
      parts.push(`+${def.awareness} AWR`);
      gainsBadges.push(`+${def.awareness} AWR`);
    }
    let special: string | undefined;
    if (lvl === 4 || lvl === 8 || lvl === 12 || lvl === 16) special = "+1% CTH";
    else if (lvl === 20) special = "+2% CTH";
    rows.push({
      level: lvl,
      gains: parts.length > 0 ? parts.join(", ") : "—",
      gainsBadges,
      special,
    });
  }
  return rows;
}

export {
  getStatsForLevel,
  SOLDIER_BASE,
  ATTRIBUTES_INCREASES_BY_LEVEL,
  StandardEquipmentLoadouts,
};
