import {
  companyActionsTemplate,
  companyHeaderPartial,
  companyHomePageTemplate,
  gameSetupTemplate,
  mainMenuTemplate,
  setupConfirmationTemplate,
} from "../html-templates/game-setup-template.ts";
import { eventConfigs as ec } from "./event-configs.ts";
import { AudioManager } from "../audio/audio-manager.ts";
import { UiServiceManager } from "../../services/ui/ui-service.ts";
// import { UiAnimationManager } from "../../services/ui/ui-animation-manager.ts";
import { DomEventManager } from "./event-handlers/dom-event-manager.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { UiManager } from "./ui-manager.ts";
import { DOM } from "../../constants/css-selectors.ts";
import {
  marketTemplate,
  troopsMarketTemplate,
  weaponsMarketTemplate,
  armorMarketTemplate,
  suppliesMarketTemplate,
  devCatalogMarketTemplate,
} from "../html-templates/market-templates.ts";
import { missionsTemplate } from "../html-templates/missions-template.ts";
import {
  readyRoomTemplate,
  clearLastEquipMoveSoldierIds,
} from "../html-templates/ready-room-template.ts";
import { rosterTemplate } from "../html-templates/roster-template.ts";
import { formationTemplate } from "../html-templates/formation-template.ts";
import { inventoryTemplate } from "../html-templates/inventory-template.ts";
import { memorialTemplate } from "../html-templates/memorial-template.ts";
import { trainingTemplate } from "../html-templates/training-template.ts";
import { abilitiesTemplate } from "../html-templates/abilities-template.ts";
import { combatTemplate } from "../html-templates/combat-template.ts";
import { soldierToCombatant, createEnemyCombatant } from "../combat/combatant-utils.ts";
import { getActiveSlots, getFormationSlots, getSoldierById } from "../../constants/company-slots.ts";
import { getAverageCompanyLevel, getMaxSoldierLevel } from "../../utils/company-utils.ts";
import { Styler } from "../../utils/styler-manager.ts";
import { SoldierManager } from "../entities/soldier/soldier-manager.ts";
import type { Soldier } from "../entities/types.ts";
import type { Mission } from "../../constants/missions.ts";

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

    UiManager.selectCompanyHomeButton(DOM.company.home);
    DomEventManager.initEventArray(ec().companyHome());
    DomEventManager.initEquipSlotTooltipHideOnClick();
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

  function createMissionsPage(mode?: "menu" | "normal" | "epic") {
    UiManager.clear.center();
    const store = usePlayerCompanyStore.getState();
    store.setMissionsViewMode(mode ?? "menu");
    store.ensureMissionBoard();
    const missions = usePlayerCompanyStore.getState().missionBoard ?? [];
    const companyLevel = usePlayerCompanyStore.getState().companyLevel ?? 1;
    const activeMode = usePlayerCompanyStore.getState().missionsViewMode ?? "menu";
    const content = parseHTML(missionsTemplate(missions, companyLevel, activeMode));
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().missionsScreen()));
    UiManager.selectCompanyHomeButton(DOM.company.missions);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createReadyRoomPage(mission?: Mission | null) {
    UiManager.clear.center();
    usePlayerCompanyStore.getState().moveZeroEnergySoldiersToReserve();
    const content = parseHTML(readyRoomTemplate(mission ?? null));
    center.appendChild(content as Element);
    setTimeout(clearLastEquipMoveSoldierIds, 450);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().readyRoomScreen()));
    UiManager.selectCompanyHomeButton(DOM.company.missions);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createCombatPage(mission?: Mission | null) {
    UiManager.clear.center();
    const store = usePlayerCompanyStore.getState();
    const company = store.company;
    const activeCount = getActiveSlots(company);
    const formationSlots = getFormationSlots(company);
    const activeSoldiers = formationSlots
      .slice(0, activeCount)
      .map((id) => (id ? getSoldierById(company, id) : null))
      .filter((s): s is NonNullable<typeof s> => s != null);
    const players = activeSoldiers.map((s) => soldierToCombatant(s));
    const enemyCount = mission?.enemyCount ?? 3;
    const avgSoldierLevel = getAverageCompanyLevel(company);
    const isEpicMission = !!(mission?.isEpic ?? mission?.rarity === "epic");
    const enemies = Array.from({ length: enemyCount }, (_, i) =>
      createEnemyCombatant(i, enemyCount, avgSoldierLevel, isEpicMission, mission?.kind),
    );
    const content = parseHTML(combatTemplate(mission ?? null, players, enemies));
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().combatScreen(players, enemies)));
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
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

    DomEventManager.initEventArray(ec().companyHome().concat(ec().troopsScreen()));

    UiManager.selectCompanyHomeButton(DOM.company.market);
    Styler.setCenterBG("bg_76.jpg", true);
  }

  function ensureMarketTierInitialized() {
    const store = usePlayerCompanyStore.getState();
    if (!store.marketTierLevel) {
      const max = getMaxSoldierLevel(store.company);
      store.setMarketTierLevel(max);
    }
  }

  function createWeaponsMarketPage() {
    UiManager.clear.center();
    ensureMarketTierInitialized();
    const content = parseHTML(weaponsMarketTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().market()));
    DomEventManager.initDelegatedEventArray(center as HTMLElement, ec().weaponsScreen(), "weapons-screen");
    UiManager.selectCompanyHomeButton(DOM.company.market);
    Styler.setCenterBG("bg_76.jpg", true);
    show.center();
  }

  function createArmorMarketPage() {
    UiManager.clear.center();
    ensureMarketTierInitialized();
    const content = parseHTML(armorMarketTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().market()));
    DomEventManager.initDelegatedEventArray(center as HTMLElement, ec().armorScreen(), "armor-screen");
    UiManager.selectCompanyHomeButton(DOM.company.market);
    Styler.setCenterBG("bg_76.jpg", true);
    show.center();
  }

  function createDevCatalogPage() {
    UiManager.clear.center();
    ensureMarketTierInitialized();
    const content = parseHTML(devCatalogMarketTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().market()));
    DomEventManager.initDelegatedEventArray(center as HTMLElement, ec().devCatalogScreen(), "dev-catalog-screen");
    UiManager.selectCompanyHomeButton(DOM.company.market);
    Styler.setCenterBG("bg_76.jpg", true);
    show.center();
  }

  function createSuppliesMarketPage() {
    UiManager.clear.center();
    ensureMarketTierInitialized();
    const content = parseHTML(suppliesMarketTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().market()));
    DomEventManager.initDelegatedEventArray(center as HTMLElement, ec().suppliesScreen(), "supplies-screen");
    UiManager.selectCompanyHomeButton(DOM.company.market);
    Styler.setCenterBG("bg_76.jpg", true);
    show.center();
  }

  function createFormationPage() {
    UiManager.clear.center();
    const content = parseHTML(formationTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().formationScreen()));
    UiManager.selectCompanyHomeButton(DOM.company.roster);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createRosterPage() {
    usePlayerCompanyStore.getState().syncSoldierLevelsFromExperience?.();
    const target = document.getElementById("g-center");
    if (!target) {
      console.error("[Roster] #g-center not found");
      return;
    }
    target.innerHTML = "";
    let html: string;
    try {
      html = rosterTemplate();
    } catch (err) {
      console.error("[Roster] rosterTemplate() threw:", err);
      try {
        html = `<div id="roster-screen" class="roster-root troops-market-root">
          ${companyHeaderPartial("Company Roster")}
          <div class="roster-main"><p>Roster failed to load.</p></div>
          ${companyActionsTemplate()}
        </div>`;
      } catch (innerErr) {
        console.error("[Roster] Fallback also threw:", innerErr);
        html = '<div id="roster-screen" style="padding:20px;color:white;"><p>Roster error.</p></div>';
      }
    }
    if (!html || !html.trim()) {
      html = '<div id="roster-screen" style="padding:20px;color:white;"><p>Roster empty.</p></div>';
    }
    target.innerHTML = html;
    DomEventManager.initEventArray(ec().companyHome().concat(ec().rosterScreen()));
    DomEventManager.initDelegatedEventArray(document, ec().equipPicker(), "equip-picker");
    DomEventManager.initEquipSlotTooltipHideOnClick();
    UiManager.selectCompanyHomeButton(DOM.company.roster);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createInventoryPage() {
    usePlayerCompanyStore.getState().syncSoldierLevelsFromExperience?.();
    UiManager.clear.center();
    const content = parseHTML(inventoryTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().inventoryScreen()));
    DomEventManager.initDelegatedEventArray(document, ec().equipPicker(), "equip-picker");
    DomEventManager.initEquipSlotTooltipHideOnClick();
    UiManager.selectCompanyHomeButton(DOM.company.inventory);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createMemorialPage() {
    UiManager.clear.center();
    const content = parseHTML(memorialTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().memorialScreen()));
    UiManager.selectCompanyHomeButton(DOM.company.heroes);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createTrainingPage() {
    UiManager.clear.center();
    const content = parseHTML(trainingTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().trainingScreen()));
    UiManager.selectCompanyHomeButton(DOM.company.training);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createAbilitiesPage() {
    UiManager.clear.center();
    const content = parseHTML(abilitiesTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().abilitiesScreen()));
    UiManager.selectCompanyHomeButton(DOM.company.abilities);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  return {
    generate: {
      setupScreen: () => createSetupScreen(),
      confirmScreen: () => createConfirmationScreen(),
      mainMenu: () => createMainMenu(),
      companyHomePage: () => createCompanyHomePage(),
      createMarketPage,
      createTroopsPage,
      createWeaponsMarketPage,
      createArmorMarketPage,
      createDevCatalogPage,
      createSuppliesMarketPage,
      createMissionsPage,
      createReadyRoomPage,
      createCombatPage,
      createRosterPage,
      createFormationPage,
      createInventoryPage,
      createMemorialPage,
      createTrainingPage,
      createAbilitiesPage,
    },
  };
}

const singleton = ScreenManager();

export { singleton as ScreenManager };
