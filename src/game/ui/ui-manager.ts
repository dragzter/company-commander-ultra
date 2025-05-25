import { UiServiceManager } from "../../services/ui/ui-service.ts";
import { AudioManager } from "../audio/audio-manager.ts";

import { UiAnimationManager } from "../../services/ui/ui-animation-manager.ts";
import { ANIMATIONS } from "../../constants/identifiers.ts";
import { ScreenManager } from "./screen-manager.ts";
import { DOM } from "../../constants/css-selectors.ts";
import { clrHash } from "../../utils/html-utils.ts";
import { Styler } from "./styler-manager.ts";

function UiManager() {
  const _AudioManager = AudioManager;
  const _UiServiceManager = UiServiceManager;
  const _UiAnim = UiAnimationManager;
  const _ScreenManager = ScreenManager;

  const { gameBoard, create, parseHTML } = _UiServiceManager;
  const { g_menu, dom_insert, board, center } = gameBoard();

  function enterGame() {
    if (!document.querySelector("#game-enter")) {
      throw new Error("Element undefined");
    }

    const gameEnter = document.querySelector("#game-enter") as HTMLElement;

    gameEnter.addEventListener("click", () => {
      _AudioManager
        .Intro()
        .play()
        .catch((e) => {
          console.error("Failed to play intro:", e);
        });

      startScreenLoading();
      gameEnter.setAttribute("disabled", "true");

      _UiAnim.animate(gameEnter, ANIMATIONS.pulse);

      setTimeout(() => {
        document.getElementById(clrHash(DOM.enterGameWrapper))?.remove();

        Styler.setCenterBG("bg_2.jpg");
      }, 1000);
    });
  }

  function startScreenLoading() {
    document.getElementById("game-enter")!.textContent = "...Loading";
  }

  function initMainMenu() {
    _ScreenManager.generate.mainMenu();
  }

  function createConfirmationScreen() {
    _ScreenManager.generate.confirmScreen();
  }

  return {
    createConfirmationScreen,
    initMainMenu,
    enterGame,
    gameBoard,
    create,
    board,
    center,
    g_menu,
    dom_insert,
    parseHTML,
  };
}

const singleton = UiManager();
export { singleton as UiManager };
