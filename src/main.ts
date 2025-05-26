import "./style/style.css";
import "./style/animate.css";

import "./game";
import { URLReader } from "./utils/url-reader.ts";
import { Images } from "./constants/images.ts";

console.log(Images);

const params = URLReader(document.location.search);

console.log(params);
