export const MAX_WEAPON_SLOTS = 1;
export const MAX_ARMOR_SLOTS = 1;
export const MAX_EQUIPMENT_SLOTS = 2;

export function getMaxWeaponSlots(_level: number): number {
  return MAX_WEAPON_SLOTS;
}

export function getMaxArmorSlots(_level: number): number {
  return MAX_ARMOR_SLOTS;
}

export function getMaxEquipmentSlots(_level: number): number {
  return MAX_EQUIPMENT_SLOTS;
}
