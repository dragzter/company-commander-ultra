import {
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

    console.log(companyUnitPatchURL, "Creating with this");
    const content = parseHTML(
      setupConfirmationTemplate(
        commanderName,
        companyName,
        companyUnitPatchURL,
      ),
    );

    center.innerHTML = "";
    center.appendChild(content as Element);

    const eventsConfig = eventConfigs().confirmationScreen();

    eventsConfig.forEach((config) => {
      _DomHandlers.initHandlers(
        config.eventType,
        config.selector,
        config.callback,
      );
    });
  }

  function createMainMenu() {
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

  return {
    generate: {
      setupScreen: () => createSetupScreen(),
      confirmScreen: () => createConfirmationScreen(),
      mainMenu: () => createMainMenu(),
    },
  };
}

const singleton = ScreenManager();

export { singleton as ScreenManager };
