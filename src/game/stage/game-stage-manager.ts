import { UiManager } from "../ui/ui-manager.ts";

function GameStageManager() {
  function beginGameSetupStage() {
    // 1. Build player input screen using the UiManager
    UiManager().createSetupScreen();
  }

  /**
   * Force the first user interaction - this allows us to play audio
   */
  function enterGameStage() {
    UiManager().enterGame();
  }

  return {
    beginGameSetupStage,
    enterGameStage,
  };
}

export { GameStageManager };
