import { ITEM_TYPES, type ItemsVolume, type MedItem, RARITY } from "./types.ts";

export const MedicalItems: ItemsVolume<MedItem> = {
  common: {
    standard_medkit: {
      id: "standard_medkit",
      name: "Standard MedKit",
      type: ITEM_TYPES.medical,
      rarity: "common",
      description:
        "Field medical kit for treating combat injuries.",
      usable: true,
      icon: "med_kit.png",
      uses: 5,
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
        "Combat stimulant that temporarily heightens reflexes and reaction speed.",
      usable: true,
      icon: "stim_pack.png",
      uses: 2,
      target: "friendly",
      tags: ["medical"],
      effect: {
        type: "buff",
        description: "+50% attack speed for 10 seconds",
        duration: 10,
        result: "attack_speed",
        effect_value: 2 / 3,
      },
    },
  },
  rare: {
    orange_stim_pack: {
      id: "orange_stim_pack",
      name: "Stim Pack Orange MQ2",
      type: ITEM_TYPES.medical,
      rarity: "common",
      description: "Concentrated healing serum. Single-use, high potency.",
      usable: true,
      uses: 1,
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
        "Hormonal stimulant that suppresses pain and boosts reaction time at the cost of accuracy.",
      usable: true,
      uses: 1,
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
        "Lost pre-war compound. Can revive the incapacitated and grant superhuman resilience. Extremely dangerous.",
      usable: true,
      uses: 1,
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
