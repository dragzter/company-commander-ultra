import "./style/style.css";
import "./style/animate.css";

import "./game";
import { URLReader } from "./utils/url-reader.ts";

const params = URLReader(document.location.search);

console.log(params);
