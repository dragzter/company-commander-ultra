import type { HandlerInitConfig } from "../../constants/types.ts";
import { UiServiceManager } from "../../services/ui/ui-service.ts";
import { usePlayerCompanyStore, usePlayerStore } from "../../store/ui-store.ts";

export function eventConfigs(UiService: typeof UiServiceManager) {
  const { gameBoard } = UiService;
  const { hide, show } = gameBoard();
  const store = usePlayerCompanyStore.getState();

  const gameSetupEventConfig: HandlerInitConfig[] = [
    {
      eventType: "click",
      selector: "#cancel-game-setup",
      callback: () => {
        hide.center();
        show.menu();
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
      selector: "#user-name",
      callback: () => {
        // hide.center();
        // show.menu();
        console.log("changing name");
      },
    },
    {
      eventType: "input",
      selector: "#company-name",
      callback: () => {
        // hide.center();
        // show.menu();
        console.log("changing company name");
      },
    },
    {
      eventType: "input",
      selector: "#company-name",
      callback: () => {
        // hide.center();
        // show.menu();
        console.log("changing company name");
      },
    },
    {
      eventType: "click",
      selector: ".setup-game-wrapper .grid img",
      callback: (e: Event) => {
        const el = e.target as HTMLElement;
        const others: HTMLElement[] = Array.from(
          document.querySelectorAll(".setup-game-wrapper .grid img"),
        );

        others.forEach((o: HTMLElement) => {
          o.style.outline = "none";
        });

        el.style.outline = "5px solid white";
        el.style.borderRadius = "8px";
        store.setCompanyUnitPatch(el.dataset.img as string);

        console.log("clicking patch", el.dataset.img);
      },
    },
  ];

  return {
    gameSetup: () => gameSetupEventConfig,
  };
}
