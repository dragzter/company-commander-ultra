import type { Item } from "./items/types.ts";
import { MedicalItems } from "./items/medical-items.ts";
import { ThrowableItems } from "./items/throwable.ts";

/** Starter armory: minimal consumables only. */
export function getStarterArmoryItems(): Item[] {
  return [
    { ...MedicalItems.common.standard_medkit, level: 1 },
    { ...ThrowableItems.common.tk21_throwing_knife, level: 1 },
    { ...ThrowableItems.common.m3_frag_grenade, level: 1 },
  ];
}

