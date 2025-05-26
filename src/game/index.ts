import { UiManager } from "./ui/ui-manager.ts";

window.onload = () => {
  UiManager.getGameProgressFromState()
    .then((gameStep) => {
      UiManager.handleGameStep(gameStep);
    })
    .catch(() => console.log("Whoops"));

  //UiManager.initMainMenu();

  UiManager.enterGame();
};
