import type { Soldier } from "../types.ts";
import type { Item } from "../../../constants/items/types.ts";

export interface Company {
  soldiers: Soldier[];
  name: string;
  level: number;
  experience: number;
  companyName: string;
  commander: string;
  inventory: Item[];
}
