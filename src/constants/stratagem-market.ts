import { ITEM_TYPES, TARGET_TYPES, type Item } from "./items/types.ts";

export type StratagemDef = {
  item: Item;
  unlockLevel: number;
};

export const STRATAGEM_DEFS: readonly StratagemDef[] = [
  {
    unlockLevel: 3,
    item: {
      id: "fortify_stratagem",
      name: "Fortify",
      type: ITEM_TYPES.tool,
      rarity: "rare",
      target: TARGET_TYPES.none,
      noLevel: true,
      uses: 1,
      price: 1000,
      icon: "fortify.png",
      description:
        "Squad-wide: increases toughness by 5% for 10 seconds.",
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
