export const FACTION_IDENTIFIERS = {
  desert_wolves: "desert_wolves",
  iron_corps: "iron_corps",
  liberties_vanguard: "liberties_vanguard",
  scarlet_accord: "scarlet_accord",
};

export const FACTION_IDENTIFIERS_SECONDARY = {
  steppes_raiders: "steppes_raiders",
  coronados_chosen: "coronados_chosen",
  oldburg_brigade: "oldburg_brigade",
  tanduk_conglomerate: "tanduk_conglomerate",
  serpent_scythe: "serpent_scythe",
  essex_workers_group: "essex_workers_group",
  rogue_guard: "rogue_guard",
};

export const ATTR_KEYS = {
  morale: "morale",
  initiative: "initiative",
  defense: "defense",
  offense: "offense",
  logistics: "logistics",
};

export const TRAITS = {
  stubborn: "stubborn",
  aggressive: "aggressive",
  relentless: "relentless",
  flexible: "flexible",
  disciplined: "disciplined",
  stealthy: "stealthy",
  impatient: "impatient",
  fortified: "fortified",
  cautious: "cautious",
};

export const PLAYER_ATTRIBUTE_PROFILES = {
  offensive: {
    [ATTR_KEYS.defense]: 50,
    [ATTR_KEYS.offense]: 100,
    [ATTR_KEYS.logistics]: 70,
    [ATTR_KEYS.initiative]: 90,
    [ATTR_KEYS.morale]: 80,
  },
  defensive: {
    [ATTR_KEYS.defense]: 90,
    [ATTR_KEYS.offense]: 60,
    [ATTR_KEYS.logistics]: 90,
    [ATTR_KEYS.initiative]: 60,
    [ATTR_KEYS.morale]: 90,
  },
  balanced: {
    [ATTR_KEYS.defense]: 80,
    [ATTR_KEYS.offense]: 80,
    [ATTR_KEYS.logistics]: 70,
    [ATTR_KEYS.initiative]: 80,
    [ATTR_KEYS.morale]: 80,
  },
};

export const IMAGE_PATH = {
  base: "/images/",
  green: "/images/green-portrait/",
  black: "/images/black-portrait/",
  blue: "/images/blue-portrait/",
  red: "/images/red-portrait/",
  ui: "/images/ui/",
  bg: "/images/bg/",
};
