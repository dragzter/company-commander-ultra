import { UNITS } from "./units.ts";
import { FACTION_IDENTIFIERS, ATTR_KEYS } from "./identifiers.ts";

export const FACTIONS = {
  [FACTION_IDENTIFIERS.desert_wolves]: {
    name: "Desert Wolves",
    id: "ca87718d-9ba6-4fd0-90fc-99204dc4081a",
    identifier: FACTION_IDENTIFIERS.desert_wolves,
    prefix: "dw_",
    portrait_path: "sand-portraits",
    description:
      "The Desert Wolves are an elite infantry force renowned for their discipline, ingenuity, and survival skills in harsh desert conditions. These soldiers are masters of long-range patrols, ambush tactics, and rapid strikes. Fiercely loyal to their unit and commanders, they embody a spirit of endurance and precision, thriving where others would falter. Their tactics rely on stealth, marksmanship, and mobility to outwit and outmaneuver larger, less agile forces. The Desert Wolves are as relentless as the desert sun and as cunning as their namesake.",
    units: UNITS[FACTION_IDENTIFIERS.desert_wolves],
    attributes: {
      [ATTR_KEYS.defense]: 60,
      [ATTR_KEYS.offense]: 80,
      [ATTR_KEYS.logistics]: 90,
      [ATTR_KEYS.initiative]: 80,
      [ATTR_KEYS.morale]: 80,
    },
  },
  [FACTION_IDENTIFIERS.liberties_vanguard]: {
    name: "Liberties Vanguard",
    id: "b6abbe29-602b-4d24-9cba-77cb3ea4f747",
    identifier: FACTION_IDENTIFIERS.liberties_vanguard,
    prefix: "lv_",
    portrait_path: "",
    description:
      "Liberties Vanguard represents the unyielding spirit of freedom fighters. This infantry-centric faction thrives on guerrilla warfare and unconventional tactics. Known for their resourcefulness and adaptability, they excel in ambushes, sabotage, and exploiting weaknesses in larger, more rigid forces. Their soldiers are fiercely independent yet united by an unwavering belief in their cause. Despite their often ragtag appearance, they fight with unparalleled determination, leveraging terrain, intelligence, and improvisation to outwit their enemies.",
    units: UNITS[FACTION_IDENTIFIERS.liberties_vanguard],
    attributes: {
      [ATTR_KEYS.defense]: 80,
      [ATTR_KEYS.offense]: 80,
      [ATTR_KEYS.logistics]: 60,
      [ATTR_KEYS.initiative]: 80,
      [ATTR_KEYS.morale]: 90,
    },
  },
  [FACTION_IDENTIFIERS.iron_corps]: {
    name: "Iron Corps",
    id: "006c9408-78dd-4455-bc06-9f638f05d341",
    identifier: FACTION_IDENTIFIERS.iron_corps,
    prefix: "ic_",
    portrait_path: "",
    description:
      "The Iron CORPS is a disciplined and relentless infantry force, embodying the perfect fusion of tactical precision and brute force. Renowned for their ability to hold the line or advance under heavy fire, their infantry units are the backbone of mechanized warfare, supported by very rare armored vehicles rather than relying on them entirely. Every soldier is trained to operate autonomously but thrives in coordination with their squad, making them adaptable to any battlefield scenario. They pride themselves on their unshakable resolve and cold, efficient tactics.",
    units: UNITS[FACTION_IDENTIFIERS.iron_corps],
    attributes: {
      [ATTR_KEYS.defense]: 50,
      [ATTR_KEYS.offense]: 100,
      [ATTR_KEYS.logistics]: 70,
      [ATTR_KEYS.initiative]: 90,
      [ATTR_KEYS.morale]: 80,
    },
  },
  [FACTION_IDENTIFIERS.scarlet_accord]: {
    name: "Scarlet Accord",
    id: "60e9db79-f4d9-4381-be15-20edff034fe1",
    identifier: FACTION_IDENTIFIERS.scarlet_accord,
    prefix: "sa_",
    portrait_path: "",
    description:
      "The Scarlet Accord is a shadowy conglomerate of opportunists bound by mutual interests" +
      " rather than loyalty or ideology. Composed of disbanded military units, criminal" +
      " syndicates, and disillusioned soldiers, they view themselves not as villains, but as pragmatic survivors in a chaotic world. Their sole focus is economic dominance—hoarding wealth, resources, and strategic leverage through raids, theft, and calculated alliances. They fight only when necessary, preferring to manipulate others into exhausting their strength first. Despite their disparate origins, they function with surprising cohesion, guided by a code of efficiency, survival, and cold calculation.  The Scarlet Accord is a melting pot of recruits from various backgrounds, united by shared ruthlessness and ambition. Their structure blends military precision with the loose hierarchy of a criminal syndicate, making them adaptable and deadly in equal measure.",
    units: UNITS[FACTION_IDENTIFIERS.scarlet_accord],
    attributes: {
      [ATTR_KEYS.defense]: 70,
      [ATTR_KEYS.offense]: 60,
      [ATTR_KEYS.logistics]: 80,
      [ATTR_KEYS.initiative]: 100,
      [ATTR_KEYS.morale]: 80,
    },
  },
};
