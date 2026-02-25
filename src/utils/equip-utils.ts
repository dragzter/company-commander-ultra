import type { Item } from "../constants/items/types.ts";
import { ITEM_TYPES } from "../constants/items/types.ts";
import type { Soldier } from "../game/entities/types.ts";
import { WEAPON_BASES } from "../constants/items/weapon-bases.ts";

export type EquipSlotType = "weapon" | "armor" | "equipment";

/** Resolve weapon restrictRole from item or by looking up base by id */
export function getWeaponRestrictRole(weapon: Item): "support" | "rifleman" | "medic" | "any" | undefined {
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

/** Check if a weapon can be wielded by a soldier (restrictRole vs designation, level restriction) */
export function weaponWieldOk(weapon: Item, soldier: Soldier): boolean {
  const role = getWeaponRestrictRole(weapon);
  if (!role || role === "any") {
    // role ok
  } else {
    const des = (soldier.designation ?? "").toLowerCase();
    if (role === "support" && des !== "support") return false;
    if (role === "rifleman" && des !== "rifleman") return false;
    if (role === "medic" && des !== "medic") return false;
  }
  const itemLevel = (weapon.level as number) ?? 1;
  const soldierLevel = soldier.level ?? 1;
  return itemLevel <= soldierLevel;
}

/** Check if a soldier can equip an item (level restriction: item.level <= soldier.level) */
export function canEquipItemLevel(item: Item, soldier: Soldier): boolean {
  const itemLevel = (item.level as number) ?? 1;
  const soldierLevel = soldier.level ?? 1;
  return itemLevel <= soldierLevel;
}

/** Check if an item can go in a given slot type */
export function itemFitsSlot(item: Item, slotType: EquipSlotType): boolean {
  const t = item.type as string;
  if (slotType === "weapon") return t === ITEM_TYPES.ballistic_weapon || t === ITEM_TYPES.melee_weapon;
  if (slotType === "armor") return t === ITEM_TYPES.armor;
  if (slotType === "equipment") return t === ITEM_TYPES.throwable || t === ITEM_TYPES.medical || t === ITEM_TYPES.gear;
  return false;
}
