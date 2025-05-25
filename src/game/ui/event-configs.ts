import type { HandlerInitConfig } from "../../constants/types.ts";
import { UiServiceManager } from "../../services/ui/ui-service.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { disableBtn, enableBtn } from "../../utils/html-utils.ts";
import { DOM } from "../../constants/css-selectors.ts";
import { Styler } from "./styler-manager.ts";
import { UiManager } from "./ui-manager.ts";

export function eventConfigs() {
  const { gameBoard } = UiServiceManager;
  const { hide, show } = gameBoard();
  const store = usePlayerCompanyStore.getState();

  const gameSetupEventConfig: HandlerInitConfig[] = [
    {
      eventType: "click",
      selector: DOM.setupScreen.cancel,
      callback: () => {
        show.menu();
        hide.center();
      },
    },
    {
      eventType: "click",
      selector: "#finish-game-setup",
      callback: () => {
        // hide.center();
        // show.menu();
        console.log("clicking finish");
        UiManager.createConfirmationScreen();
      },
    },
    {
      eventType: "input",
      selector: DOM.setupScreen.commanderInput,
      callback: (e: Event) => {
        const el = e.target as HTMLInputElement;
        const proceedButton = document.querySelector(
          "#finish-game-setup",
        ) as HTMLButtonElement;
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
        const proceedButton = document.querySelector(
          "#finish-game-setup",
        ) as HTMLButtonElement;

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
        const proceedButton = document.querySelector(
          "#finish-game-setup",
        ) as HTMLButtonElement;

        const others: HTMLElement[] = Array.from(
          document.querySelectorAll(DOM.setupScreen.unitPatch),
        );

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

  const gameConfirmationEventConfig: HandlerInitConfig[] = [
    {
      eventType: "click",
      selector: DOM.confirmScreen.launch,
      callback: () => {
        console.log("BEGIN GAME!");
      },
    },
  ];

  const mainMenuEventConfig: HandlerInitConfig[] = [
    {
      selector: DOM.mainMenu.newGame,
      eventType: "click",
      callback: () => {
        console.log("callback new game");
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

  return {
    gameSetup: () => gameSetupEventConfig,
    confirmationScreen: () => gameConfirmationEventConfig,
    mainMenu: () => mainMenuEventConfig,
  };
}
