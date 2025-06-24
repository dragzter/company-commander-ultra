import "./style/style.css";
import "./style/animate.css";
import "./utils/name-utils.ts";

import "./game";
// import { GetItem } from "./constants/items/item-manager.ts";
import { Images } from "./constants/images.ts";
import { SoldierManager } from "./game/entities/soldier-manager.ts";

console.log(SoldierManager.generateFirstList());

console.log(SoldierManager.getSoldierTraitProfile());

// const params = URLReader(document.location.search);

console.log(Images);
