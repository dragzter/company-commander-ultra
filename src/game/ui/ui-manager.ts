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
import { DomEventManager } from "./event-handlers/dom-event-manager.ts";
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
  const _DomEventManager = DomEventManager;

  const { gameBoard, create, parseHTML } = _UiServiceManager;
  const { g_menu, dom_insert, show, board, center, left, right, lower, upper } =
    gameBoard();

  function getGameProgressFromState(): Promise<string> {
    return new Promise((resolve) => {
      const store = usePlayerCompanyStore.getState();
      resolve(store.gameStep);
    });
  }

  function handleGameStep(gameStep: string) {
    Styler.setCenterBG("bg_1.jpg", true);
    const loadGameAt = {
      [GAME_STEPS.at_intro_0]: () => initMainMenu(),
      [GAME_STEPS.at_main_menu_1]: () => initMainMenu(),
      [GAME_STEPS.at_setup_screen_2]: () => renderSetupScreen(),
      [GAME_STEPS.at_confirmation_screen_3]: () => createConfirmationScreen(),
      [GAME_STEPS.at_company_homepage_4]: () => renderCompanyHomePage(),
    };

    const load =
      loadGameAt[gameStep as keyof typeof loadGameAt] ??
      loadGameAt[GAME_STEPS.at_intro_0];
    load();
  }

  function _setStep(step: GameStep) {
    const store = usePlayerCompanyStore.getState();
    store.setGameStep(step);
  }

  function enterGame() {
    const gameEnter = s_(DOM.enterGame) as HTMLButtonElement | null;
    if (!gameEnter) {
      throw new Error("Element '#game-enter' is undefined, does it exist?");
    }
    if (gameEnter.dataset.bound === "1") return;
    gameEnter.dataset.bound = "1";

    const state = usePlayerCompanyStore.getState();

    state.initializeCompany();
    _DomEventManager.initGlobalButtonClickAudio();
    _DomEventManager.initTutorialInteractionLock();
    _AudioManager.Settings().bindGestureUnlock();
    const ua = navigator.userAgent || "";
    const iosTouchMac =
      navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    const isIosMobile = /iPhone|iPad|iPod/i.test(ua) || iosTouchMac;
    if (isIosMobile) {
      document.documentElement.classList.add("ios-mobile-perf");
      document.body?.classList.add("ios-mobile-perf");
    }

    let launched = false;
    const launch = () => {
      if (launched) return;
      launched = true;
      startScreenLoading();
      gameEnter.setAttribute("disabled", "true");
      try {
        _AudioManager
          .Settings()
          .setMusicEnabled(
            usePlayerCompanyStore.getState().musicEnabled !== false,
          );
        _AudioManager
          .Settings()
          .setSfxEnabled(usePlayerCompanyStore.getState().sfxEnabled !== false);
        _AudioManager
          .Intro()
          .play()
          .catch((e) => {
            console.error("Failed to play intro:", e);
          });
        _UiAnim.animate(gameEnter, Animations.pulse[1]);
      } catch (e) {
        console.error("Enter game pre-launch hook failed:", e);
      }

      setTimeout(() => {
        const wrapper = s_(DOM.enterGameWrapper);
        wrapper?.remove();
      }, 1000);
    };

    gameEnter.addEventListener("click", () => launch());
    gameEnter.addEventListener("pointerup", () => launch());
    gameEnter.addEventListener("touchend", (e) => {
      e.preventDefault();
      launch();
    });
    gameEnter.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      launch();
    });
  }

  function startScreenLoading() {
    const button = s_("#game-enter");
    if (button) button.textContent = "...Loading";
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
    usePlayerCompanyStore.getState().clearMarketFlareOffer();
    usePlayerCompanyStore.getState().bootstrapNewCompanyIfEmpty();
    _ScreenManager.generate.companyHomePage();
  }

  function renderRosterScreen() {
    const st = usePlayerCompanyStore.getState();
    st.clearMarketFlareOffer();
    st.tryTriggerFlareEvent("roster");
    _ScreenManager.generate.createRosterPage();
  }

  function renderFormationScreen() {
    usePlayerCompanyStore.getState().clearMarketFlareOffer();
    _ScreenManager.generate.createFormationPage();
  }

  function renderMarketScreen() {
    usePlayerCompanyStore.getState().tryTriggerFlareEvent("market");
    _ScreenManager.generate.createMarketPage();
  }

  function renderMarketTroopsScreen() {
    _ScreenManager.generate.createTroopsPage();
  }

  function showTroopsRecruitError(reason: "capacity" | "afford") {
    const el = document.getElementById("troops-recruit-error");
    if (!el) return;
    el.textContent =
      reason === "afford"
        ? "Not enough credits to recruit this soldier."
        : "Company is at full capacity.";
    el.classList.add("visible");
    setTimeout(() => el.classList.remove("visible"), 3500);
  }

  function renderWeaponsMarketScreen() {
    _ScreenManager.generate.createWeaponsMarketPage();
  }

  function renderArmorMarketScreen() {
    _ScreenManager.generate.createArmorMarketPage();
  }

  function renderDevCatalogScreen() {
    _ScreenManager.generate.createDevCatalogPage();
  }

  function renderSuppliesMarketScreen() {
    _ScreenManager.generate.createSuppliesMarketPage();
  }

  function renderStratagemsMarketScreen() {
    _ScreenManager.generate.createStratagemsMarketPage();
  }

  function renderInventoryScreen() {
    usePlayerCompanyStore.getState().clearMarketFlareOffer();
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
    usePlayerCompanyStore.getState().clearMarketFlareOffer();
    _ScreenManager.generate.createAbilitiesPage();
  }

  function renderMissionsScreen(mode?: "menu" | "normal" | "epic" | "career" | "dev") {
    usePlayerCompanyStore.getState().clearMarketFlareOffer();
    const store = usePlayerCompanyStore.getState();

    if (mode == null) {
      if (
        store.missionsResumeStep === "ready_room" &&
        store.missionsResumeMission &&
        store.missionsViewMode !== "menu"
      ) {
        _ScreenManager.generate.createReadyRoomPage(
          store.missionsResumeMission,
        );
        return;
      }

      if (store.missionsViewMode === "career") {
        _ScreenManager.generate.createCareerPage();
        return;
      }

      if (
        store.missionsViewMode === "normal" ||
        store.missionsViewMode === "epic" ||
        store.missionsViewMode === "dev"
      ) {
        _ScreenManager.generate.createMissionsPage(store.missionsViewMode);
        return;
      }

      if (
        ["all", "manhunt", "skirmish", "defend_objective"].includes(
          store.missionsResumeStep,
        )
      ) {
        _ScreenManager.generate.createMissionsPage("normal");
        return;
      }
      _ScreenManager.generate.createMissionsPage("menu");
      return;
    }

    if (mode === "career") {
      _ScreenManager.generate.createCareerPage();
      return;
    }
    _ScreenManager.generate.createMissionsPage(mode);
  }

  function renderReadyRoomScreen(mission?: Mission | null) {
    usePlayerCompanyStore.getState().clearMarketFlareOffer();
    _AudioManager.Intro().fadeOutAll(240);
    _ScreenManager.generate.createReadyRoomPage(mission);
  }

  function renderCombatScreen(mission?: Mission | null) {
    usePlayerCompanyStore.getState().clearMarketFlareOffer();
    _ScreenManager.generate.createCombatPage(mission);
  }

  function renderHeroesScreen() {
    usePlayerCompanyStore.getState().clearMarketFlareOffer();
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
    renderDevCatalogScreen,
    renderSuppliesMarketScreen,
    renderStratagemsMarketScreen,
    renderInventoryScreen,
    refreshEquipPickerContent,
    renderAbilitiesScreen,
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
