import { UiServiceManager } from "../../services/ui/ui-service.ts";
import { AudioManager } from "../audio/audio-manager.ts";

import { UiAnimationManager } from "../../services/ui/ui-animation-manager.ts";
import { ANIMATIONS } from "../../constants/identifiers.ts";
import { ScreenManager } from "./screen-manager.ts";
import { DOM } from "../../constants/css-selectors.ts";
import { s_ } from "../../utils/html-utils.ts";
import { Styler } from "./styler-manager.ts";
import {
  GAME_STEPS,
  type GameStep,
  usePlayerCompanyStore,
} from "../../store/ui-store.ts";
import { Images } from "../../constants/images.ts";

function UiManager() {
  const _AudioManager = AudioManager;
  const _UiServiceManager = UiServiceManager;
  const _UiAnim = UiAnimationManager;
  const _ScreenManager = ScreenManager;

  const { gameBoard, create, parseHTML } = _UiServiceManager;
  const { g_menu, dom_insert, show, board, center, left, right, lower, upper } =
    gameBoard();

  function getGameProgressFromState(): Promise<string> {
    return new Promise((resolve) => {
      const store = usePlayerCompanyStore.getState();
      console.log("check the step", store.gameStep);
      resolve(store.gameStep);
    });
  }

  function handleGameStep(gameStep: string) {
    console.log("we are at ", gameStep);
    const loadGameAt = {
      [GAME_STEPS.at_intro_0]: () => initMainMenu(),
      [GAME_STEPS.at_main_menu_1]: () => initMainMenu(),
    };

    loadGameAt[gameStep]();
  }

  function _setStep(step: GameStep) {
    const store = usePlayerCompanyStore.getState();
    store.setGameStep(step);
  }

  function enterGame() {
    if (!s_(DOM.enterGame)) {
      throw new Error("Element '#game-enter' is undefined, does it exist?");
    }

    const gameEnter = s_(DOM.enterGame);

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
        s_(DOM.enterGameWrapper).remove();

        Styler.setCenterBG(Images.bg.bg_2);
      }, 1000);
    });
  }

  function startScreenLoading() {
    s_("#game-enter").textContent = "...Loading";
  }

  // --------------
  // Render SCREENS
  // --------------
  function initMainMenu() {
    _setStep(GAME_STEPS.at_main_menu_1);

    g_menu.innerHTML = "";
    _ScreenManager.generate.mainMenu();
  }

  function reRenderMainMenu() {
    show.menu();
    Styler.setCenterBG("bg_2.jpg");
    s_(".setup-game-wrapper")?.remove();
  }

  function createConfirmationScreen() {
    _setStep(GAME_STEPS.at_confirmation_screen_3);
    _ScreenManager.generate.confirmScreen();
  }

  function renderCompanyHomePage() {
    _setStep(GAME_STEPS.at_confirmation_screen_3);
    _ScreenManager.generate.companyHomePage();
  }

  function renderSetupScreen() {
    _setStep(GAME_STEPS.at_setup_screen_2);
    _ScreenManager.generate.setupScreen();
  }

  return {
    createConfirmationScreen,
    renderCompanyHomePage,
    renderSetupScreen,
    initMainMenu,
    enterGame,
    gameBoard,
    clear: {
      right: () => (right.innerHTML = ""),
      left: () => (left.innerHTML = ""),
      center: () => (center.innerHTML = ""),
      upper: () => (upper.innerHTML = ""),
      lower: () => (lower.innerHTML = ""),
      menu: () => (g_menu.innerHTML = ""),
    },
    create,
    board,
    center,
    g_menu,
    reRenderMainMenu,
    dom_insert,
    parseHTML,
    handleGameStep,
    getGameProgressFromState,
  };
}

const singleton = UiManager();
export { singleton as UiManager };
