export interface Soldier {
  id: string; // guid
  name: string;
  level: number; // increases all attributes according to a scale
  experience: number;

  // Attributes
  attributes: Attributes;

  // History
  inventory: [];
  events: []; // a way to track history, wounded, killed, record battles.
}

export interface Attributes {
  hit_points: number; // Health bar
  dexterity: number; // Accuracy - chance to hit, initiative
  morale: number; // affects how easy it is to suppress, affect with psychic weapons, run away
  toughness: number; // Mitigation - flat reduction in damage
  awareness: number;
}
