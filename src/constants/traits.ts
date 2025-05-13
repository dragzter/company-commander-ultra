import type { FactionAttribute } from "./types.ts";
import { ATTR_KEYS, TRAITS } from "./identifiers.ts";

/**
 * Attributes are key factors that affect a factions fighting units.  These values directly
 * affect the individual units in that faction.  For example firepower if a factor that increase
 * all the soldiers damage and has global effect on all the units and individual soldiers damage.
 *
 * Range is 1-100
 */
export const FACTION_ATTRIBUTES: Record<string, FactionAttribute> = {
  [ATTR_KEYS.morale]: {
    key: ATTR_KEYS.morale,
    affected_by: {
      positive: [
        TRAITS.stubborn,
        TRAITS.aggressive,
        TRAITS.disciplined,
        TRAITS.relentless,
        TRAITS.fortified,
      ],
      negative: [
        TRAITS.cautious,
        TRAITS.impatient,
        TRAITS.flexible,
        TRAITS.stealthy,
      ],
    },
  }, // How long units stay in the fight after suffering losses
  [ATTR_KEYS.initiative]: {
    key: ATTR_KEYS.initiative,
    affected_by: {
      positive: [TRAITS.impatient, TRAITS.aggressive, TRAITS.stealthy],
      negative: [TRAITS.cautious, TRAITS.fortified, TRAITS.disciplined],
    },
  }, // How quickly units attack
  [ATTR_KEYS.defense]: {
    key: ATTR_KEYS.defense,
    affected_by: {
      positive: [
        TRAITS.flexible,
        TRAITS.fortified,
        TRAITS.disciplined,
        TRAITS.stubborn,
        TRAITS.cautious,
        TRAITS.stealthy,
      ],
      negative: [TRAITS.aggressive, TRAITS.relentless, TRAITS.impatient],
    },
  }, // Overall ability to mitigate damage
  [ATTR_KEYS.offense]: {
    key: ATTR_KEYS.offense,
    affected_by: {
      positive: [
        TRAITS.aggressive,
        TRAITS.flexible,
        TRAITS.impatient,
        TRAITS.relentless,
      ],
      negative: [TRAITS.fortified, TRAITS.stubborn, TRAITS.stealthy],
    },
  }, // Overall increase in firepower
  [ATTR_KEYS.logistics]: {
    key: ATTR_KEYS.logistics,
    affected_by: {
      positive: [
        TRAITS.flexible,
        TRAITS.disciplined,
        TRAITS.cautious,
        TRAITS.stealthy,
      ],
      negative: [TRAITS.impatient, TRAITS.relentless, TRAITS.stubborn],
    },
  }, // How many support actions a faction has
};

/**
 * Affects attributes up or down from 1-100
 */
export const TRAIT_EFFECT_CONFIGURATION = {
  [TRAITS.cautious]: {
    morale: {
      positive: 0,
      negative: 20,
    },
    initiative: {
      positive: 0,
      negative: 30,
    },
    defense: {
      positive: 30,
      negative: 0,
    },
    offense: {
      positive: 0,
      negative: 0,
    },
    logistics: {
      positive: 10,
      negative: 0,
    },
  },
  [TRAITS.fortified]: {
    morale: {
      positive: 10,
      negative: 0,
    },
    initiative: {
      positive: 0,
      negative: 30,
    },
    defense: {
      positive: 30,
      negative: 0,
    },
    offense: {
      positive: 0,
      negative: 20,
    },
    logistics: {
      positive: 0,
      negative: 0,
    },
  },
  [TRAITS.relentless]: {
    morale: {
      positive: 20,
      negative: 0,
    },
    initiative: {
      positive: 0,
      negative: 0,
    },
    defense: {
      positive: 0,
      negative: 20,
    },
    offense: {
      positive: 30,
      negative: 0,
    },
    logistics: {
      positive: 0,
      negative: 20,
    },
  },
  [TRAITS.disciplined]: {
    morale: {
      positive: 40,
      negative: 0,
    },
    initiative: {
      positive: 0,
      negative: 30,
    },
    defense: {
      positive: 15,
      negative: 0,
    },
    offense: {
      positive: 0,
      negative: 0,
    },
    logistics: {
      positive: 10,
      negative: 0,
    },
  },
  [TRAITS.flexible]: {
    morale: {
      positive: 0,
      negative: 10,
    },
    initiative: {
      positive: 0,
      negative: 0,
    },
    defense: {
      positive: 20,
      negative: 0,
    },
    offense: {
      positive: 20,
      negative: 0,
    },
    logistics: {
      positive: 20,
      negative: 0,
    },
  },
  [TRAITS.aggressive]: {
    morale: {
      positive: 20,
      negative: 0,
    },
    initiative: {
      positive: 10,
      negative: 0,
    },
    defense: {
      positive: 0,
      negative: 20,
    },
    offense: {
      positive: 30,
      negative: 0,
    },
    logistics: {
      positive: 0,
      negative: 0,
    },
  },
  [TRAITS.stealthy]: {
    morale: {
      positive: 0,
      negative: 10,
    },
    initiative: {
      positive: 40,
      negative: 0,
    },
    defense: {
      positive: 0,
      negative: 0,
    },
    offense: {
      positive: 0,
      negative: 20,
    },
    logistics: {
      positive: 10,
      negative: 0,
    },
  },
  [TRAITS.impatient]: {
    morale: {
      positive: 0,
      negative: 10,
    },
    initiative: {
      positive: 20,
      negative: 0,
    },
    defense: {
      positive: 0,
      negative: 20,
    },
    offense: {
      positive: 10,
      negative: 0,
    },
    logistics: {
      positive: 0,
      negative: 30,
    },
  },
  [TRAITS.stubborn]: {
    morale: {
      positive: 10,
      negative: 0,
    },
    initiative: {
      positive: 0,
      negative: 0,
    },
    defense: {
      positive: 30,
      negative: 0,
    },
    offense: {
      positive: 0,
      negative: 10,
    },
    logistics: {
      positive: 0,
      negative: 20,
    },
  },
};
