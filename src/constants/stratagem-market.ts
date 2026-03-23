import { ITEM_TYPES, TARGET_TYPES, type Item } from "./items/types.ts";

export type StratagemDef = {
  item: Item;
  unlockLevel: number;
};

/** Dedicated armory capacity for stratagem items (fixed, not level-scaled). */
export const STRATAGEM_ARMORY_SLOTS = 8;

export const STRATAGEM_DEFS: readonly StratagemDef[] = [
  {
    unlockLevel: 2,
    item: {
      id: "fortify_stratagem",
      name: "Fortify",
      type: ITEM_TYPES.tool,
      rarity: "rare",
      target: TARGET_TYPES.none,
      noLevel: true,
      uses: 1,
      price: 1500,
      icon: "fortify.png",
      description:
        "Squad-wide: increases mitigation by 20% for 10 seconds.",
      tags: ["stratagem", "squad_wide"],
      usable: true,
    },
  },
  {
    unlockLevel: 3,
    item: {
      id: "grenades_first_stratagem",
      name: "Grenades First",
      type: ITEM_TYPES.tool,
      rarity: "rare",
      target: TARGET_TYPES.none,
      noLevel: true,
      uses: 1,
      price: 1500,
      icon: "grenades_first.png",
      description:
        "Squad-wide: fills all empty equipment slots with level-appropriate frag grenades.",
      tags: ["stratagem", "squad_wide"],
      usable: true,
    },
  },
  {
    unlockLevel: 3,
    item: {
      id: "adrenal_surge_stratagem",
      name: "Adrenal Surge",
      type: ITEM_TYPES.tool,
      rarity: "rare",
      target: TARGET_TYPES.none,
      noLevel: true,
      uses: 1,
      price: 1500,
      icon: "surge.png",
      description:
        "Squad-wide: increases attack speed by 20% for 8 seconds.",
      tags: ["stratagem", "squad_wide"],
      usable: true,
    },
  },
  {
    unlockLevel: 4,
    item: {
      id: "armor_piercing_ammo_stratagem",
      name: "Armor Piercing Ammo",
      type: ITEM_TYPES.tool,
      rarity: "rare",
      target: TARGET_TYPES.none,
      noLevel: true,
      uses: 1,
      price: 1500,
      icon: "pierce.png",
      description:
        "Squad-wide: for 10 seconds, auto attacks ignore all mitigation.",
      tags: ["stratagem", "squad_wide"],
      usable: true,
    },
  },
  {
    unlockLevel: 5,
    item: {
      id: "resuscitate_stratagem",
      name: "Resuscitate",
      type: ITEM_TYPES.tool,
      rarity: "epic",
      target: TARGET_TYPES.none,
      noLevel: true,
      uses: 1,
      price: 5000,
      icon: "resus.png",
      description:
        "Target a fallen ally: 50% chance to revive at 80% HP. Revived soldiers recover for 5s (+20% mitigation, can still be attacked).",
      tags: ["stratagem", "squad_wide"],
      usable: true,
    },
  },
] as const;

export function getUnlockedStratagemDefs(companyLevel: number): StratagemDef[] {
  const lvl = Math.max(1, Math.floor(companyLevel || 1));
  return STRATAGEM_DEFS.filter((d) => d.unlockLevel <= lvl);
}

export function isStratagemItem(item: Item | null | undefined): boolean {
  if (!item) return false;
  return !!(item.tags ?? []).includes("stratagem");
}
