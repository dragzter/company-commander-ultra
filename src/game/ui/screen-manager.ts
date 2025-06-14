import {
  companyHomePageTemplate,
  gameSetupTemplate,
  mainMenuTemplate,
  setupConfirmationTemplate,
} from "../html-templates/game-setup-template.ts";
import { eventConfigs } from "./event-configs.ts";
import { AudioManager } from "../audio/audio-manager.ts";
import { UiServiceManager } from "../../services/ui/ui-service.ts";
// import { UiAnimationManager } from "../../services/ui/ui-animation-manager.ts";
import { DomEventManager } from "../event-handlers/dom-event-manager.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { UiManager } from "./ui-manager.ts";
import { DOM } from "../../constants/css-selectors.ts";

/**
 * Manager which templates are displayed.  Orchestrates all the things that need to happen when
 * a screen is changed or a page is loaded.
 * @constructor
 */
function ScreenManager() {
  const _AudioManager = AudioManager;
  const _UiServiceManager = UiServiceManager;
  //const _UiAnim = UiAnimationManager;
  const _DomHandlers = DomEventManager;

  const { gameBoard, parseHTML } = _UiServiceManager;
  const { show, hide, center, g_menu } = gameBoard();

  function createSetupScreen() {
    const steps = parseHTML(gameSetupTemplate);
    center.appendChild(steps as Element);
    hide.menu();
    show.center();

    _AudioManager.Intro().stop();
    _AudioManager
      .Setup()
      .play()
      .catch((e) => {
        console.error("Failed to play setup:", e);
      });

    const eventsConfig = eventConfigs().gameSetup();

    eventsConfig.forEach((config) => {
      // Bind event handlers to HTML elements
      _DomHandlers.initHandlers(
        config.eventType,
        config.selector,
        config.callback,
      );
    });
  }

  function createConfirmationScreen() {
    const store = usePlayerCompanyStore.getState();

    const companyName = store.companyName;
    const commanderName = store.commanderName;
    const companyUnitPatchURL = store.companyUnitPatchURL;

    const content = parseHTML(
      setupConfirmationTemplate(
        commanderName,
        companyName,
        companyUnitPatchURL,
      ),
    );

    UiManager.clear.center();
    center.appendChild(content as Element);

    const eventsConfig = eventConfigs().confirmationScreen();

    eventsConfig.forEach((config) => {
      _DomHandlers.initHandlers(
        config.eventType,
        config.selector,
        config.callback,
      );
    });

    show.center();
  }

  function createMainMenu() {
    UiManager.clear.center();

    const content = parseHTML(mainMenuTemplate());
    g_menu.appendChild(content as Element);
    const eventsConfig = eventConfigs().mainMenu();

    eventsConfig.forEach((config) => {
      _DomHandlers.initHandlers(
        config.eventType,
        config.selector,
        config.callback,
      );
    });
  }

  function createCompanyHomePage() {
    UiManager.clear.center();
    const { companyName, commanderName, companyUnitPatchURL } =
      usePlayerCompanyStore.getState();

    const content = parseHTML(
      companyHomePageTemplate(companyName, commanderName, companyUnitPatchURL),
    );
    center.appendChild(content as Element);

    // Set home button as selected
    UiManager.selectCompanyHomeButton(DOM.company.home);

    const eventsConfig = eventConfigs().companyHome();

    eventsConfig.forEach((config) => {
      _DomHandlers.initHandlers(
        config.eventType,
        config.selector,
        config.callback,
      );
    });

    console.log(center);
    show.center();
  }

  return {
    generate: {
      setupScreen: () => createSetupScreen(),
      confirmScreen: () => createConfirmationScreen(),
      mainMenu: () => createMainMenu(),
      companyHomePage: () => createCompanyHomePage(),
    },
  };
}

const singleton = ScreenManager();

export { singleton as ScreenManager };
