import type { Soldier } from "../types.ts";

export interface Company {
  soldiers: Soldier[];
  name: string;
  level: number;
  experience: number;
  companyName: string;
  commander: string;
}
