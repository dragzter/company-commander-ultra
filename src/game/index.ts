import { UiManager } from "./ui/ui-manager.ts";

let bootstrapped = false;

function bootGame() {
  if (bootstrapped) return;
  bootstrapped = true;
  UiManager.getGameProgressFromState()
    .then((gameStep) => {
      UiManager.handleGameStep(gameStep);
    })
    .catch(() => {});

  //UiManager.initMainMenu();

  UiManager.enterGame();
}

if (document.readyState === "interactive" || document.readyState === "complete") {
  window.setTimeout(() => bootGame(), 0);
}

window.addEventListener("DOMContentLoaded", () => bootGame(), { once: true });
window.addEventListener("load", () => bootGame(), { once: true });
