import { UiManager } from "./ui/ui-manager.ts";
import { GameStageManager } from "./stage/game-stage-manager.ts";

window.onload = () => {
  // 0. Enter Game
  GameStageManager().enterGameStage();

  // 1. Initialize Game Menu
  UiManager().initGameMenu();

  GameStageManager().beginGameSetupStage();
};
