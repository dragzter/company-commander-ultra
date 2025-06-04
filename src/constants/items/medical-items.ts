import {
  ITEM_TYPES,
  type ItemsVolume,
  type MedItem,
  RARITY,
} from "../types.ts";

export const MedicalItems: ItemsVolume<MedItem> = {
  common: {
    standard_medkit: {
      id: "standard_medkit",
      name: "Standard MedKit",
      type: ITEM_TYPES.medical,
      rarity: "common",
      description:
        "Standard-issue Combat MedKit.  Used for treating battlefield injuries",
      usable: true,
      quantity: 1,
      target: "friendly",
      tags: ["medical"],
      effect: {
        type: "heal",
        description: "Recovers HP",
        effectiveness: 3,
        effect_value: 20,
        duration: 1,
        result: "healing",
      },
    },
    stim_pack: {
      id: "stim_pack",
      name: "Standard Stim Pack",
      type: ITEM_TYPES.medical,
      rarity: "common",
      description:
        "Standard-issue Stim Pack.  No addictive properties whatsoever.",
      usable: true,
      quantity: 1,
      target: "friendly",
      tags: ["medical"],
      effect: {
        type: "heal",
        description: "Recovers HP",
        effectiveness: 3,
        effect_value: 20,
        duration: 1,
        result: "healing",
      },
    },
  },
  rare: {
    orange_stim_pack: {
      id: "orange_stim_pack",
      name: "Stim Pack Orange MQ2",
      type: ITEM_TYPES.medical,
      rarity: "common",
      description: "A Highly potent stimulant manufactured in former Colombia.",
      usable: true,
      quantity: 1,
      target: "friendly",
      tags: ["medical"],
      effect: {
        type: "heal",
        description: "Recovers HP",
        effectiveness: 5,
        effect_value: 40,
        duration: 1,
        result: "healing",
      },
    },
    adrenaline_injection: {
      id: "adrenaline_injection",
      name: "Synthetic Adrenaline Delivery System (SADS)",
      type: ITEM_TYPES.medical,
      rarity: "common",
      description:
        "A hormonal stimulant that acts on the pain receptors as well as increasing aggression" +
        " and response time.",
      usable: true,
      quantity: 1,
      target: "friendly",
      tags: ["medical"],
      effect: {
        type: "heal",
        description:
          "Recovers HP over a period of time.  While active, increases initiative and" +
          " evasion, and reduces accuracy",
        effectiveness: 7,
        effect_value: 12,
        duration: 3,
        result: "adrenaline_boost",
      },
    },
  },
  epic: {
    substance_m: {
      id: "substance_m",
      name: "Substance M",
      type: ITEM_TYPES.medical,
      rarity: RARITY.epic,
      description:
        "A chemical substance capable of clotting severe open wounds and stimulating the heart to" +
        " keep beating beyond what should be medically possible. As the knowledge to manufacture" +
        " this substance has been lost in time, all existing units can be traced to a hidden" +
        " Iron Corps facility in what used to be New Mexico.",
      usable: true,
      quantity: 1,
      target: "friendly",
      tags: ["medical"],
      effect: {
        type: "heal",
        description:
          "Revives an incapacitated character and gives them superhuman capabilities" +
          " for a short amount of time and makes them incredibly resistant to injury.  Death is" +
          " highly likely.",
        effectiveness: 10,
        effect_value: 30,
        duration: 4,
        result: "adrenaline_boost",
      },
    },
  },
};
