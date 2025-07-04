import {
  companyHomePageTemplate,
  gameSetupTemplate,
  mainMenuTemplate,
  setupConfirmationTemplate,
} from "../html-templates/game-setup-template.ts";
import { eventConfigs as ec } from "./event-configs.ts";
import { AudioManager } from "../audio/audio-manager.ts";
import { UiServiceManager } from "../../services/ui/ui-service.ts";
// import { UiAnimationManager } from "../../services/ui/ui-animation-manager.ts";
import { DomEventManager } from "../event-handlers/dom-event-manager.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { UiManager } from "./ui-manager.ts";
import { DOM } from "../../constants/css-selectors.ts";
import {
  marketTemplate,
  troopsMarketTemplate,
} from "../html-templates/market-templates.ts";
import { Styler } from "../../utils/styler-manager.ts";
import { SoldierManager } from "../entities/soldier/soldier-manager.ts";
import type { Soldier } from "../entities/types.ts";

/**
 * Manager which templates are displayed.  Orchestrates all the things that need to happen when
 * a screen is changed or a page is loaded.
 * @constructor
 */
function ScreenManager() {
  const _AudioManager = AudioManager;
  const _UiServiceManager = UiServiceManager;
  //const _UiAnim = UiAnimationManager;

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

    DomEventManager.initEventArray(ec().gameSetup());
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

    DomEventManager.initEventArray(ec().confirmationScreen());

    show.center();
  }

  function createMainMenu() {
    UiManager.clear.center();

    const content = parseHTML(mainMenuTemplate());
    g_menu.appendChild(content as Element);

    DomEventManager.initEventArray(ec().mainMenu());
  }

  function createCompanyHomePage() {
    UiManager.clear.center();

    const content = parseHTML(companyHomePageTemplate());
    center.appendChild(content as Element);

    // Set home button as selected
    UiManager.selectCompanyHomeButton(DOM.company.home);

    DomEventManager.initEventArray(ec().companyHome());

    Styler.setCenterBG("bg_81.jpg", true);

    show.center();
  }

  function createMarketPage() {
    UiManager.clear.center();

    const content = parseHTML(marketTemplate());
    center.appendChild(content as Element);

    DomEventManager.initEventArray(ec().companyHome().concat(ec().market()));

    Styler.setCenterBG("bg_store_88.jpg", true);
  }

  function createTroopsPage() {
    UiManager.clear.center();
    const { marketAvailableTroops, setMarketAvailableTroops } =
      usePlayerCompanyStore.getState();

    let soldiers: Soldier[];

    if (!marketAvailableTroops.length) {
      soldiers = SoldierManager.generateTroopList();
      setMarketAvailableTroops(soldiers);
    } else {
      soldiers = marketAvailableTroops;
    }

    const content = parseHTML(troopsMarketTemplate(soldiers));
    center.appendChild(content as Element);

    DomEventManager.initEventArray(
      ec().companyHome().concat(ec().troopsScreen()),
    );

    UiManager.selectCompanyHomeButton(DOM.company.market);
    Styler.setCenterBG("bg_76.jpg", true);
  }

  return {
    generate: {
      setupScreen: () => createSetupScreen(),
      confirmScreen: () => createConfirmationScreen(),
      mainMenu: () => createMainMenu(),
      companyHomePage: () => createCompanyHomePage(),
      createMarketPage,
      createTroopsPage,
    },
  };
}

const singleton = ScreenManager();

export { singleton as ScreenManager };
