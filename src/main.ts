import "./style/style.css";
import "./style/animate.css";
import "./utils/name-utils.ts";
import { APP_VERSION } from "./constants/version.ts";

import "./game";

function injectVersion() {
  const el = document.createElement("span");
  el.className = "app-version";
  el.setAttribute("aria-hidden", "true");
  el.textContent = `v${APP_VERSION}`;
  document.getElementById("app")?.appendChild(el);
}
injectVersion();
