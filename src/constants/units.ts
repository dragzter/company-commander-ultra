import type { Unit } from "./types.ts";
import { FACTION_IDENTIFIERS as FID, TRAITS } from "./identifiers.ts";
import { TRAIT_EFFECT_CONFIGURATION } from "./traits.ts";

export const UNITS: Record<string, Record<string, Unit>> = {
  desert_wolves: {
    ashcroft_infantry_brigade_42: {
      name: "42nd Ashcroft Infantry Brigade",
      id: "f226c95f-c931-4ea9-8395-eb74707e0aef",
      motto: "First to fight",
      nickname: "The Pack",
      allegiance: FID.desert_wolves,
      traits: [
        TRAIT_EFFECT_CONFIGURATION[TRAITS.aggressive],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.stubborn],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.relentless],
      ],
    },
    light_brigade_369: {
      name: "369th Light Brigade",
      id: "9b07ccaa-4063-4c92-9e35-8aeae4a55d87",
      motto: "Swift and sure",
      nickname: "Foxhounds",
      allegiance: FID.desert_wolves,
      traits: [
        TRAIT_EFFECT_CONFIGURATION[TRAITS.impatient],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.stealthy],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.cautious],
      ],
    },
    light_scouts_9: {
      name: "9th Light Scouts",
      id: "810697ea-ebd1-45c8-bd03-a7bb3cf59eff",
      motto: "Eyes in the dark",
      nickname: "Night blades",
      allegiance: FID.desert_wolves,
      traits: [
        TRAIT_EFFECT_CONFIGURATION[TRAITS.stealthy],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.aggressive],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.flexible],
      ],
    },
    light_brigade_31: {
      name: "31st Light Brigade",
      id: "4cb28d9a-70a2-4ad6-a6c9-3638cb10aa1c",
      motto: "Strike first, unseen",
      nickname: "Dune Stalkers",
      allegiance: FID.desert_wolves,
      traits: [
        TRAIT_EFFECT_CONFIGURATION[TRAITS.cautious],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.disciplined],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.stubborn],
      ],
    },
    guards_rifle_brigade_67: {
      name: "67th Guards Rifle Brigade",
      id: "e3585339-66cf-4db2-9d4b-67e352e7d229",
      motto: "Unyielding Resolve",
      nickname: "Stonewallers",
      allegiance: FID.desert_wolves,
      traits: [
        TRAIT_EFFECT_CONFIGURATION[TRAITS.disciplined],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.fortified],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.cautious],
      ],
    },
  },
  iron_corps: {
    mechanized_scouts_5: {
      name: "5th Mechanized Scouts",
      id: "e748b03c-64b0-4b6c-ae14-67e935a5a821",
      motto: "Fast and fearless",
      nickname: "Chargers",
      allegiance: FID.iron_corps,
      traits: [
        TRAIT_EFFECT_CONFIGURATION[TRAITS.aggressive],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.impatient],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.relentless],
      ],
    },
    mechanized_scouts_8: {
      name: "5th Mechanized Scouts",
      id: "de46e151-3e33-4f21-b33e-23a6ac16a0e3",
      motto: "Eyes everywhere",
      nickname: "Night hunters",
      allegiance: FID.iron_corps,
      traits: [
        TRAIT_EFFECT_CONFIGURATION[TRAITS.stealthy],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.cautious],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.aggressive],
      ],
    },
    infantry_regiment_402: {
      name: "402nd Infantry Regiment",
      id: "7c62a5e2-21bd-4459-b8ef-19275cfb5ec9",
      motto: "Strength in unity",
      nickname: "Warhounds",
      allegiance: FID.iron_corps,
      traits: [
        TRAIT_EFFECT_CONFIGURATION[TRAITS.fortified],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.stubborn],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.relentless],
      ],
    },
    assault_recon_battalion_177: {
      name: "177th Assault Recon Battalion",
      id: "05981f9c-ee88-4d8a-8cc2-81e4394b34fc",
      motto: "Through fire and fury",
      nickname: "Steel Falcons",
      allegiance: FID.iron_corps,
      traits: [
        TRAIT_EFFECT_CONFIGURATION[TRAITS.fortified],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.flexible],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.aggressive],
      ],
    },
  },
  liberties_vanguard: {
    infantry_regiment_4: {
      name: "4th Infantry Regiment",
      id: "ba97b29e-432f-40a5-8a3e-f7e8e3ab29ab",
      motto: "For the Fallen, We Rise",
      nickname: "Sons of Valor",
      allegiance: FID.liberties_vanguard,
      traits: [
        TRAIT_EFFECT_CONFIGURATION[TRAITS.flexible],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.aggressive],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.cautious],
      ],
    },
    assault_infantry_regiment_88: {
      name: "88th Assault Inf. Regiment",
      id: "1ca84a55-5121-4976-a04b-3912f1280ef9",
      motto: "Courage in the Fire",
      nickname: "Liberty’s Spear",
      allegiance: FID.liberties_vanguard,
      traits: [
        TRAIT_EFFECT_CONFIGURATION[TRAITS.aggressive],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.disciplined],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.relentless],
      ],
    },
    militia_regiment_5: {
      name: "5th Militia Regiment",
      id: "b97a0abf-dcf1-44d3-8a3b-ca7b21ac5985",
      motto: "Freedom Through Resistance",
      nickname: "Vindicators",
      allegiance: FID.liberties_vanguard,
      traits: [
        TRAIT_EFFECT_CONFIGURATION[TRAITS.cautious],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.flexible],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.fortified],
      ],
    },
  },
  scarlet_accord: {
    infantry_regiment_19: {
      name: "19th Infantry Regiment",
      id: "14d6f3e6-8371-41f3-8236-50bbdfabe841",
      motto: "Tempered By The Storm",
      nickname: "Warriors",
      allegiance: FID.scarlet_accord,
      traits: [
        TRAIT_EFFECT_CONFIGURATION[TRAITS.aggressive],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.fortified],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.relentless],
      ],
    },
    scouts_38: {
      name: "38th Scouts",
      id: "14d6f3e6-8371-41f3-8236-50bbdfabe841",
      motto: "Vigilance and Preparedness",
      nickname: "Stalkers",
      allegiance: FID.scarlet_accord,
      traits: [
        TRAIT_EFFECT_CONFIGURATION[TRAITS.stealthy],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.stubborn],
        TRAIT_EFFECT_CONFIGURATION[TRAITS.relentless],
      ],
    },
  },
};
