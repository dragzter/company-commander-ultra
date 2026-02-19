import type { HandlerInitConfig } from "../../constants/types.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { disableBtn, enableBtn, s_, sa_ } from "../../utils/html-utils.ts";
import { DOM } from "../../constants/css-selectors.ts";
import { Styler } from "../../utils/styler-manager.ts";
import { UiManager } from "./ui-manager.ts";
import { Partial } from "../html-templates/partials/partial.ts";

/**
 * Contains definitions for the events of all html templates.
 * Configured when the html is called and appended to the DOM.
 */
export function eventConfigs() {
  const store = usePlayerCompanyStore.getState();

  // Handlers for the setup screen
  const gameSetupEventConfig: HandlerInitConfig[] = [
    {
      eventType: "click",
      selector: DOM.setupScreen.cancel,
      callback: () => {
        UiManager.reRenderMainMenu();
      },
    },
    {
      eventType: "click",
      selector: DOM.setupScreen.finish,
      callback: () => {
        console.log("clicking finish");
        UiManager.createConfirmationScreen();
      },
    },
    {
      eventType: "input",
      selector: DOM.setupScreen.commanderInput,
      callback: (e: Event) => {
        const el = e.target as HTMLInputElement;
        const proceedButton = s_(DOM.setupScreen.finish) as HTMLButtonElement;
        store.setCommanderName(el.value);

        if (store.canProceedToLaunch()) {
          enableBtn(proceedButton);
        } else {
          disableBtn(proceedButton);
        }
      },
    },
    {
      eventType: "input",
      selector: DOM.setupScreen.companyInput,
      callback: (e: Event) => {
        const el = e.target as HTMLInputElement;
        store.setCompanyName(el.value);
        const proceedButton = s_(DOM.setupScreen.finish) as HTMLButtonElement;

        if (store.canProceedToLaunch()) {
          enableBtn(proceedButton);
        } else {
          disableBtn(proceedButton);
        }
      },
    },
    {
      eventType: "click",
      selector: DOM.setupScreen.unitPatch,
      callback: (e: Event) => {
        const el = e.target as HTMLElement;
        const proceedButton = s_(DOM.setupScreen.finish) as HTMLButtonElement;

        const others: HTMLElement[] = Array.from(
          sa_(DOM.setupScreen.unitPatch),
        ) as HTMLElement[];

        others.forEach((o: HTMLElement) => {
          o.style.outline = "none";
        });

        Styler.selectedWhite5(el);
        store.setCompanyUnitPatch(el.dataset.img as string);

        if (store.canProceedToLaunch()) {
          enableBtn(proceedButton);
        } else {
          disableBtn(proceedButton);
        }

        console.log("clicking patch", el.dataset.img);
      },
    },
  ];

  // Confirmation screen
  const gameConfirmationEventConfig: HandlerInitConfig[] = [
    {
      eventType: "click",
      selector: DOM.confirmScreen.launch,
      callback: () => {
        console.log("BEGIN GAME!");
        UiManager.renderCompanyHomePage();
      },
    },
    {
      eventType: "click",
      selector: DOM.confirmScreen.goBack,
      callback: () => {
        console.log("go back!");
      },
    },
  ];

  // Main Menu handlers
  const mainMenuEventConfig: HandlerInitConfig[] = [
    {
      selector: DOM.mainMenu.newGame,
      eventType: "click",
      callback: () => {
        console.log("callback new game");
        UiManager.renderSetupScreen();
      },
    },
    {
      selector: DOM.mainMenu.continue,
      eventType: "click",
      callback: () => {
        console.log("continue campaign");
      },
    },
    {
      selector: DOM.mainMenu.credits,
      eventType: "click",
      callback: () => {
        console.log("show Credits");
      },
    },
    {
      selector: DOM.mainMenu.settings,
      eventType: "click",
      callback: () => {
        console.log("Show settings");
      },
    },
  ];

  // Company home page
  const companyHomeEventConfig: HandlerInitConfig[] = [
    {
      selector: DOM.company.home,
      eventType: "click",
      callback: () => {
        console.log("clicking home");
        UiManager.selectCompanyHomeButton(DOM.company.home);
        UiManager.renderCompanyHomePage();
      },
    },
    {
      selector: DOM.company.heroes,
      eventType: "click",
      callback: () => {
        console.log("clicking heroes");
        UiManager.selectCompanyHomeButton(DOM.company.heroes);
      },
    },
    {
      selector: DOM.company.abilities,
      eventType: "click",
      callback: () => {
        console.log("clicking abilities");
        UiManager.selectCompanyHomeButton(DOM.company.abilities);
      },
    },
    {
      selector: DOM.company.roster,
      eventType: "click",
      callback: () => {
        console.log("clicking roster");
        UiManager.selectCompanyHomeButton(DOM.company.roster);
        UiManager.renderRosterScreen();
      },
    },
    {
      selector: DOM.company.missions,
      eventType: "click",
      callback: () => {
        console.log("clicking missions");
        UiManager.selectCompanyHomeButton(DOM.company.missions);
      },
    },
    {
      selector: DOM.company.market,
      eventType: "click",
      callback: () => {
        console.log("clicking market");
        UiManager.selectCompanyHomeButton(DOM.company.market);
        UiManager.renderMarketScreen();
      },
    },
    {
      // This one only shows when there's no men in the company
      selector: DOM.company.goToTroopsScreen,
      eventType: "click",
      callback: () => {
        console.log("clicking market");
        UiManager.selectCompanyHomeButton(DOM.company.market);
        UiManager.renderMarketScreen();
      },
    },
    {
      selector: DOM.company.training,
      eventType: "click",
      callback: () => {
        console.log("clicking training");
        UiManager.selectCompanyHomeButton(DOM.company.training);
      },
    },
    {
      selector: DOM.company.inventory,
      eventType: "click",
      callback: () => {
        console.log("clicking inventory");
        UiManager.selectCompanyHomeButton(DOM.company.inventory);
      },
    },
  ];

  const marketEventConfig: HandlerInitConfig[] = [
    {
      selector: DOM.market.marketTroopsLink,
      eventType: "click",
      callback: () => {
        UiManager.renderMarketTroopsScreen();
      },
    },
  ];

  const troopsScreenEventConfig: HandlerInitConfig[] = [
    {
      selector: DOM.market.pages.recruitTroops.recruitSoldier,
      eventType: "click",
      callback: (e: Event) => {
        const { recruitStagingDiv } = DOM.market.pages.recruitTroops;
        e.stopPropagation();
        const { addToRecruitStaging, filterMarketTroops } =
          usePlayerCompanyStore.getState();
        const _this = e.target as HTMLButtonElement;
        const soldier = JSON.parse(_this.dataset.trooperjson as string);
        addToRecruitStaging(soldier);
        filterMarketTroops(soldier.id);
        const newSoldierHTML = Partial.render.parsedStagedTrooperCard(soldier);
        s_(recruitStagingDiv).append(newSoldierHTML);
      },
    },
    {
      selector: DOM.market.pages.recruitTroops.removeFromStaging,
      eventType: "click",
      callback: (e: Event) => {
        e.stopPropagation();
        const _this = e.target as HTMLButtonElement;
        const soldierId = _this.dataset.soldierId;
        if (!soldierId) return;
        usePlayerCompanyStore.getState().removeFromRecruitStaging(soldierId);
        UiManager.renderMarketTroopsScreen();
      },
    },
    {
      selector: DOM.market.pages.recruitTroops.confirmRecruitment,
      eventType: "click",
      callback: () => {
        usePlayerCompanyStore.getState().confirmRecruitment();
        UiManager.renderMarketTroopsScreen();
      },
    },
    {
      selector: DOM.market.pages.recruitTroops.rerollSoldier,
      eventType: "click",
      callback: (e: Event) => {
        e.stopPropagation();
        const { rerollSoldier } = usePlayerCompanyStore.getState();
        const _this = e.target as HTMLButtonElement;
        const id = _this.dataset.trooperid as string;
        rerollSoldier(id);
      },
    },
  ];

  return {
    gameSetup: () => gameSetupEventConfig,
    confirmationScreen: () => gameConfirmationEventConfig,
    mainMenu: () => mainMenuEventConfig,
    companyHome: () => companyHomeEventConfig,
    market: () => marketEventConfig,
    troopsScreen: () => troopsScreenEventConfig,
  };
}
