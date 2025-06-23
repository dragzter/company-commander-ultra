import { type Armor, ITEM_TYPES, type ItemsVolume, RARITY } from "./types.ts";

export const ArmorItems: ItemsVolume<Armor> = {
  common: {
    s3_flak_jacket: {
      id: "s3_flak_jacket",
      name: "S3 Flak Jacket",
      type: ITEM_TYPES.armor,
      rarity: RARITY.common,
      description: "Standard Issue for the Intrepid Infantryman",
      usable: true,
      toughness: 20,
      icon: "armor_17.png",
    },
    rokkar_combat_vest: {
      id: "rokkar_combat_vest",
      name: "Rokkar Combat Vest",
      type: ITEM_TYPES.armor,
      rarity: RARITY.common,
      description: "Hardened with ceramic plates. Now with extra ammo pouches.",
      usable: true,
      toughness: 25,
      icon: "armor_19.png",
    },
    m108_flak_jacket: {
      id: "m108_flak_jacket",
      name: "M108 Flak Jacket",
      type: ITEM_TYPES.armor,
      rarity: RARITY.common,
      description:
        "Durable and heavy, provides excellent protection against counter fire.",
      usable: true,
      toughness: 45,
      icon: "armor_8.png",
    },
  },
  rare: {},
  epic: {},
};
