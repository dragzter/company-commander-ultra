/**
 * Starter armory items given when a new company is created.
 * Good sampling across weapons, armor, throwables, and medical.
 */
import type { Item } from "./items/types.ts";
import { TARGET_TYPES } from "./items/types.ts";
import { WEAPON_BASES } from "./items/weapon-bases.ts";
import { createWeapon } from "./items/weapon-bases.ts";
import { ARMOR_BASES } from "./items/armor-bases.ts";
import { createArmor } from "./items/armor-bases.ts";
import { ThrowableItems } from "./items/throwable.ts";
import { MedicalItems } from "./items/medical-items.ts";

function weapon(baseId: string, tier: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10): Item {
  const base = WEAPON_BASES.find((b) => b.baseId === baseId);
  if (!base) throw new Error(`Unknown weapon base: ${baseId}`);
  return createWeapon(base, tier);
}

function armor(baseId: string, tier: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10): Item {
  const base = ARMOR_BASES.find((b) => b.baseId === baseId);
  if (!base) throw new Error(`Unknown armor base: ${baseId}`);
  return createArmor(base, tier);
}

/** Starter armory: weapons, armor, throwables, medical. Free items for new companies. */
export function getStarterArmoryItems(): Item[] {
  return [
    // Weapons (4) - rifleman, support, medic, any
    weapon("m5_assault_rifle", 1),
    weapon("s44_galt", 1),
    weapon("m240_delta", 1),
    weapon("compact_smg", 1),
    // Armor (4)
    armor("s3_flak", 1),
    armor("rokkar_vest", 1),
    armor("light_tactical_vest", 1),
    armor("urban_defender", 1),
    // Throwables
    { ...ThrowableItems.common.m3_frag_grenade, target: TARGET_TYPES.enemy_area },
    { ...ThrowableItems.common.m84_flashbang, target: TARGET_TYPES.enemy_area },
    { ...ThrowableItems.common.mk18_smoke, target: TARGET_TYPES.enemy_area },
    { ...ThrowableItems.common.tk21_throwing_knife, target: TARGET_TYPES.enemy },
    { ...ThrowableItems.common.incendiary_grenade, target: TARGET_TYPES.enemy_area },
    // Medical
    { ...MedicalItems.common.standard_medkit, target: TARGET_TYPES.friendly },
    { ...MedicalItems.common.stim_pack, target: TARGET_TYPES.friendly },
  ];
}
