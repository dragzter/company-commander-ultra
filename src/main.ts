import "./style/style.css";
import "./style/animate.css";
import "./utils/name-utils.ts";

import "./game";
import { URLReader } from "./utils/url-reader.ts";
import { Images } from "./constants/images.ts";
import { GetItem } from "./constants/items/item-manager.ts";

console.log(Images);

const params = URLReader(document.location.search);

console.log(params);
console.log(GetItem.common.ranged_weapon());
