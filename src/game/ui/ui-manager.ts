import { UiServiceManager } from "../../services/ui/ui-service.ts";
import { AudioManager } from "../audio/audio-manager.ts";

import { UiAnimationManager } from "../../services/ui/ui-animation-manager.ts";
import { ANIMATIONS } from "../../constants/identifiers.ts";
import { ScreenManager } from "./screen-manager.ts";
import { DOM } from "../../constants/css-selectors.ts";
import { s_, sa_ } from "../../utils/html-utils.ts";
import { Styler } from "../../utils/styler-manager.ts";
import {
  GAME_STEPS,
  type GameStep,
  usePlayerCompanyStore,
} from "../../store/ui-store.ts";

/**
 * The most high level UI controller of the game.  UiManager is able to consume and initiate all UI
 * utils and game flow tasks.
 * @constructor
 */
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
    Styler.setCenterBG("bg_1.jpg", true);
    const loadGameAt = {
      [GAME_STEPS.at_intro_0]: () => initMainMenu(),
      [GAME_STEPS.at_main_menu_1]: () => initMainMenu(),
      [GAME_STEPS.at_setup_screen_2]: () => renderSetupScreen(),
      [GAME_STEPS.at_confirmation_screen_3]: () => createConfirmationScreen(),
      [GAME_STEPS.at_company_homepage_4]: () => renderCompanyHomePage(),
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

    const state = usePlayerCompanyStore.getState();

    state.initializeCompany();

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
      }, 1000);
    });
  }

  function startScreenLoading() {
    s_("#game-enter").textContent = "...Loading";
  }

  function unselectCompanyHomeButtons() {
    sa_(DOM.company.all).forEach((b) => b.classList.remove("active"));
  }

  function selectCompanyHomeButton(cssSelector: string) {
    unselectCompanyHomeButtons();
    setTimeout(() => {
      s_(cssSelector).classList.add("active");
    }, 0);
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

  function renderSetupScreen() {
    _setStep(GAME_STEPS.at_setup_screen_2);
    _ScreenManager.generate.setupScreen();
  }

  function createConfirmationScreen() {
    _setStep(GAME_STEPS.at_confirmation_screen_3);
    _ScreenManager.generate.confirmScreen();
  }

  function renderCompanyHomePage() {
    _setStep(GAME_STEPS.at_company_homepage_4);
    _ScreenManager.generate.companyHomePage();
  }

  function renderRosterScreen() {
    console.log("rendering rtoster screen");
  }

  function renderMarketScreen() {
    console.log("rendering market screen");
    _ScreenManager.generate.createMarketPage();
  }

  function renderMarketTroopsScreen() {
    console.log("rendering the troops for hire");
    _ScreenManager.generate.createTroopsPage();
  }

  function renderInventoryScreen() {
    console.log("render Inventory Screen");
  }

  function renderAbilitiesScreen() {
    console.log("render Abilities Screen");
  }

  function renderTrainingScreen() {
    console.log("render Training Screen");
  }

  function renderMissionsScreen() {
    console.log("render Missions Screen");
  }

  function renderHeroesScreen() {
    console.log("render Heroes Screen");
  }

  return {
    createConfirmationScreen,
    renderCompanyHomePage,
    renderSetupScreen,
    renderRosterScreen,
    renderMarketScreen,
    renderMarketTroopsScreen,
    renderInventoryScreen,
    renderAbilitiesScreen,
    renderTrainingScreen,
    renderMissionsScreen,
    renderHeroesScreen,
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
    selectCompanyHomeButton,
    handleGameStep,
    getGameProgressFromState,
  };
}

const singleton = UiManager();
export { singleton as UiManager };
