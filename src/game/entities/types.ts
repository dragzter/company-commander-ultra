import type {
  Armor,
  BallisticWeapon,
  Item,
} from "../../constants/items/types.ts";

export const SOLDIER_DESIGNATION = {
  rifleman: "rifleman",
  support: "support",
  medic: "medic",
} as const;

export type Designation = keyof typeof SOLDIER_DESIGNATION;

export interface Soldier {
  id: string; // guid
  name: string;
  level: number; // increases all attributes according to a scale
  experience: number;
  active: boolean;

  armor?: Armor;
  weapon?: BallisticWeapon;

  // Attributes
  attributes: Attributes;

  designation: Designation;

  // History
  inventory: Item[];
  events: []; // a way to track history, wounded, killed, record battles.
}

export interface Attributes {
  hit_points: number; // Health bar
  dexterity: number; // Accuracy - chance to hit, initiative
  morale: number; // affects how easy it is to suppress, affect with psychic weapons, run away
  toughness: number; // Mitigation - flat reduction in damage
  awareness: number;
  level?: number;
}

export type StandardLoadout = Record<
  keyof typeof SOLDIER_DESIGNATION,
  {
    weapon: BallisticWeapon;
    armor: Armor;
    inventory: Item[];
  }
>;

export interface Company {
  soldiers: Soldier[];
  name: string;
  level: number;
  experience: number;
  companyName: string;
  commander: string;
}
