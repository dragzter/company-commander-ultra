import { UiManager } from "./ui/ui-manager.ts";

window.onload = () => {
  UiManager.getGameProgressFromState()
    .then((gameStep) => {
      UiManager.handleGameStep(gameStep);
    })
    .catch(() => {});

  //UiManager.initMainMenu();

  UiManager.enterGame();
};
