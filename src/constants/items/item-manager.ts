import { ThrowableItems } from "./throwable.ts";
import { Junk } from "./junk.ts";
import { MedicalItems } from "./medical-items.ts";
import { type Item, ITEM_TYPES, type ItemType } from "./types.ts";
import {
  //getRandomIndex,
  getRandomNumberFromRange,
} from "../../utils/random.ts";
import { BallisticItems } from "./ballistic.ts";

const CommonItemMap: Record<string, Record<string, Partial<Item>>> = {
  throwable: ThrowableItems.common,
  junk: Junk.common,
  medical: MedicalItems.common,
  ballistic_weapon: BallisticItems.common,
};

//const ItemKeys = [...Object.keys(CommonItemMap)];

// This randomizes the item key as well, not sure if there's value in that.  Maybe if we want a
// completely random item.
// --------------------------
// function getRandomCommonItem() {
//   const key = getRandomIndex(ItemKeys);
//   const itemCountInSelection = Object.keys(CommonItemMap[key]).length;
//   const listOfItems = Object.keys(CommonItemMap[key]);
//   const randomNumber = getRandomNumberFromRange(itemCountInSelection);
//
//   return CommonItemMap[key][listOfItems[randomNumber]];
// }

function getRandom_CommonItem(key: ItemType) {
  const itemCountInSelection = Object.keys(CommonItemMap[key]).length;
  const listOfItems = Object.keys(CommonItemMap[key]);
  const randomNumber = getRandomNumberFromRange(itemCountInSelection);

  return CommonItemMap[key][listOfItems[randomNumber]];
}

export const GetItem = {
  common: {
    throwable: () => getRandom_CommonItem(ITEM_TYPES.throwable),
    medical: () => getRandom_CommonItem(ITEM_TYPES.medical),
    junk: () => getRandom_CommonItem(ITEM_TYPES.junk),
    ballistic_weapon: () => getRandom_CommonItem(ITEM_TYPES.ballistic_weapon),
  },
};
