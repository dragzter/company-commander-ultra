import type { Item } from "../constants/items/types.ts";
import { ThrowableItems } from "../constants/items/throwable.ts";
import { MedicalItems } from "../constants/items/medical-items.ts";

function collectById(
  volumes: Record<string, Record<string, unknown>>[],
  defaultTarget: string,
): Record<string, Item> {
  const out: Record<string, Item> = {};
  for (const vol of volumes) {
    for (const def of Object.values(vol ?? {})) {
      if (def && typeof def === "object" && "id" in def) {
        const item = def as unknown as Item & { target?: string };
        const id = item.id as string;
        out[id] = { ...item, target: item.target ?? defaultTarget };
      }
    }
  }
  return out;
}

const THROWABLES = collectById(
  [ThrowableItems.common, ThrowableItems.rare ?? {}, ThrowableItems.epic ?? {}],
  "enemy_area",
);
const MEDICAL = collectById(
  [MedicalItems.common, MedicalItems.rare ?? {}, MedicalItems.epic ?? {}],
  "friendly",
);
const ALL_ITEMS = { ...THROWABLES, ...MEDICAL };

/** Resolve reward item id (e.g. m84_flashbang, standard_medkit) to a full item copy. */
export function getRewardItemById(id: string): Item | null {
  const def = ALL_ITEMS[id];
  if (!def) return null;
  const item = { ...def };
  if (item.uses == null) item.uses = 5;
  return item;
}

/** Common supply item ids for loot drops (throwables + medical). */
export const COMMON_SUPPLY_IDS = [
  "m84_flashbang",
  "m3_frag_grenade",
  "mk18_smoke",
  "incendiary_grenade",
  "tk21_throwing_knife",
  "standard_medkit",
  "stim_pack",
] as const;

export function pickRandomCommonSupply(): Item | null {
  const id = COMMON_SUPPLY_IDS[Math.floor(Math.random() * COMMON_SUPPLY_IDS.length)];
  return getRewardItemById(id);
}
