import type { MBtnOptions } from "../../constants/types.ts";
import { UiServiceManager } from "../../services/ui/ui-service.ts";
import { AudioManager } from "../audio/audio-manager.ts";
import { gameSetupTemplate } from "../html-templates/game-setup-template.ts";
//import { usePlayerStore } from "../../store/ui-store.ts";
import { UiAnimationManager } from "../../services/ui/ui-animation-manager.ts";
import { ANIMATIONS } from "../../constants/identifiers.ts";
import { DomEventManager } from "../event-handlers/dom-event-manager.ts";
import { eventConfigs } from "./event-configs.ts";

function UiManager() {
  const _AudioManager = AudioManager;
  const _UiServiceManager = UiServiceManager;
  const _UiAnim = UiAnimationManager;
  const _DomHandlers = DomEventManager;

  //const store = usePlayerStore;

  const { gameBoard, create, buildMenu, parseHTML } = _UiServiceManager;
  const { g_menu, dom_insert, board, show, hide, center } = gameBoard();

  const mainMenuButtonConfig = (): MBtnOptions[] => {
    return [
      {
        text: "New Game",
        color: "green",
        event: "click",
        cb: () => {
          createSetupScreen();
        },
      },
      {
        text: "Continue",
        color: "green",
        cb: () => {
          console.log("continue campaign");
        },
      },
      {
        text: "Credits",
        color: "blue",
        event: "click",
        cb: () => {
          console.log("show Credits");
        },
      },
      {
        text: "Settings",
        color: "black",
        event: "click",
        cb: () => {
          console.log("Show settings");
        },
      },
    ];
  };

  function enterGame() {
    if (!document.querySelector("#game-enter")) {
      throw new Error("Element undefined");
    }

    const gameEnter = document.querySelector("#game-enter") as HTMLElement;

    gameEnter.addEventListener("click", () => {
      _AudioManager
        .Intro()
        .play()
        .catch((e) => {
          console.error("Failed to play intro:", e);
        });

      startScreenLoading();
      gameEnter.setAttribute("disabled", "true");

      _UiAnim.animate(gameEnter, ANIMATIONS.pulse);

      setTimeout(() => {
        document.getElementById("game-enter-wrapper")?.remove();
      }, 1000);
    });
  }

  function startScreenLoading() {
    document.getElementById("game-enter")!.textContent = "...Loading";
  }

  /**
   * Start Game setup, collect name, company name etc.
   */
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

    const eventsConfig = eventConfigs(UiServiceManager).gameSetup();

    eventsConfig.forEach((config) => {
      _DomHandlers.initHandlers(
        config.eventType,
        config.selector,
        config.callback,
      );
    });
  }

  function initMainMenu() {
    board.style.background = "url('images/bg/bg_2.jpg')";
    board.style.backgroundSize = "cover";
    board.style.backgroundRepeat = "no-repeat";

    const logo = create("img", { src: "/images/ui/cc_logo_sm.png" });
    const menu = buildMenu(mainMenuButtonConfig(), logo);

    dom_insert(g_menu, menu);
  }

  return {
    initMainMenu,
    enterGame,
    createSetupScreen,
    gameBoard,
    create,
    board,
    center,
    g_menu,
    dom_insert,
    parseHTML,
  };
}

const singleton = UiManager();
export { singleton as UiManager };
