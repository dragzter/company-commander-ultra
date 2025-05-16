import type { HandlerInitConfig } from "../../constants/types.ts";
import { UiServiceManager } from "../../services/ui/ui-service.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { disableBtn, enableBtn } from "../../utils/html-utils.ts";

export function eventConfigs(UiService: typeof UiServiceManager) {
  const { gameBoard } = UiService;
  const { hide, show } = gameBoard();
  const store = usePlayerCompanyStore.getState();

  const gameSetupEventConfig: HandlerInitConfig[] = [
    {
      eventType: "click",
      selector: "#cancel-game-setup",
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
      },
    },
    {
      eventType: "input",
      selector: "#commander-name",
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

        console.log("changing commander name");
      },
    },
    {
      eventType: "input",
      selector: "#company-name",
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
      selector: ".setup-game-wrapper .grid img",
      callback: (e: Event) => {
        const el = e.target as HTMLElement;
        const proceedButton = document.querySelector(
          "#finish-game-setup",
        ) as HTMLButtonElement;

        const others: HTMLElement[] = Array.from(
          document.querySelectorAll(".setup-game-wrapper .grid img"),
        );

        others.forEach((o: HTMLElement) => {
          o.style.outline = "none";
        });

        el.style.outline = "5px solid white";
        el.style.borderRadius = "8px";
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

  return {
    gameSetup: () => gameSetupEventConfig,
  };
}
