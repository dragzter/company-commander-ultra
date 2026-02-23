import type { Mission } from "../../constants/missions.ts";
import { UiServiceManager } from "../../services/ui/ui-service.ts";
import { AudioManager } from "../audio/audio-manager.ts";
import { getEquipPickerBodyHtml } from "../html-templates/equip-picker-template.ts";

import { UiAnimationManager } from "../../services/ui/ui-animation-manager.ts";
import { Animations } from "../../constants/animations.ts";
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

      _UiAnim.animate(gameEnter, Animations.pulse[1]);

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
      const el = s_(cssSelector);
      if (el) el.classList.add("active");
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
    _ScreenManager.generate.createRosterPage();
  }

  function renderFormationScreen() {
    _ScreenManager.generate.createFormationPage();
  }

  function renderMarketScreen() {
    console.log("rendering market screen");
    _ScreenManager.generate.createMarketPage();
  }

  function renderMarketTroopsScreen() {
    _ScreenManager.generate.createTroopsPage();
  }

  function showTroopsRecruitError(reason: "capacity" | "afford") {
    const el = document.getElementById("troops-recruit-error");
    if (!el) return;
    el.textContent = reason === "afford" ? "Not enough credits to recruit this soldier." : "Company is at full capacity.";
    el.classList.add("visible");
    setTimeout(() => el.classList.remove("visible"), 3500);
  }

  function renderWeaponsMarketScreen() {
    _ScreenManager.generate.createWeaponsMarketPage();
  }

  function renderArmorMarketScreen() {
    _ScreenManager.generate.createArmorMarketPage();
  }

  function renderSuppliesMarketScreen() {
    _ScreenManager.generate.createSuppliesMarketPage();
  }

  function renderInventoryScreen() {
    _ScreenManager.generate.createInventoryPage();
  }

  function refreshEquipPickerContent() {
    const picker = document.getElementById("equip-picker-popup");
    if (!picker || picker.hasAttribute("hidden")) return;
    const { soldiers } = getEquipPickerBodyHtml();
    const soldiersEl = picker.querySelector(".equip-picker-soldiers-list");
    if (soldiersEl) (soldiersEl as HTMLElement).innerHTML = soldiers;
  }

  function renderAbilitiesScreen() {
    _ScreenManager.generate.createAbilitiesPage();
  }

  function renderTrainingScreen() {
    _ScreenManager.generate.createTrainingPage();
  }

  function renderMissionsScreen() {
    _ScreenManager.generate.createMissionsPage();
  }

  function renderReadyRoomScreen(mission?: Mission | null) {
    _ScreenManager.generate.createReadyRoomPage(mission);
  }

  function renderCombatScreen(mission?: Mission | null) {
    _ScreenManager.generate.createCombatPage(mission);
  }

  function renderHeroesScreen() {
    _ScreenManager.generate.createMemorialPage();
  }

  return {
    createConfirmationScreen,
    renderCompanyHomePage,
    renderSetupScreen,
    renderRosterScreen,
    renderFormationScreen,
    renderMarketScreen,
    renderMarketTroopsScreen,
    showTroopsRecruitError,
    renderWeaponsMarketScreen,
    renderArmorMarketScreen,
    renderSuppliesMarketScreen,
    renderInventoryScreen,
    refreshEquipPickerContent,
    renderAbilitiesScreen,
    renderTrainingScreen,
    renderMissionsScreen,
    renderReadyRoomScreen,
    renderCombatScreen,
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
