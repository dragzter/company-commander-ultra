import type { Item } from "../constants/items/types.ts";
import { ITEM_TYPES } from "../constants/items/types.ts";
import type { Soldier } from "../game/entities/types.ts";
import { WEAPON_BASES } from "../constants/items/weapon-bases.ts";

export type EquipSlotType = "weapon" | "armor" | "equipment";

/** Resolve weapon restrictRole from item or by looking up base by id */
function getWeaponRestrictRole(weapon: Item): "support" | "rifleman" | "medic" | "any" | undefined {
  if (weapon.restrictRole && weapon.restrictRole !== "any") return weapon.restrictRole;
  const id = (weapon.id ?? "") as string;
  for (const base of WEAPON_BASES) {
    if (id === base.baseId || id.startsWith(base.baseId + "_")) {
      if (base.restrictRole !== "any") return base.restrictRole;
      return undefined;
    }
  }
  return undefined;
}

/** Check if a weapon can be wielded by a soldier (restrictRole vs designation) */
export function weaponWieldOk(weapon: Item, soldier: Soldier): boolean {
  const role = getWeaponRestrictRole(weapon);
  if (!role || role === "any") return true;
  const des = (soldier.designation ?? "").toLowerCase();
  if (role === "support") return des === "support";
  if (role === "rifleman") return des === "rifleman";
  if (role === "medic") return des === "medic";
  return false;
}

/** Check if an item can go in a given slot type */
export function itemFitsSlot(item: Item, slotType: EquipSlotType): boolean {
  const t = item.type as string;
  if (slotType === "weapon") return t === ITEM_TYPES.ballistic_weapon || t === ITEM_TYPES.melee_weapon;
  if (slotType === "armor") return t === ITEM_TYPES.armor;
  if (slotType === "equipment") return t === ITEM_TYPES.throwable || t === ITEM_TYPES.medical || t === ITEM_TYPES.gear;
  return false;
}
