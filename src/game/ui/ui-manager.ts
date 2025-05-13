import type { MBtnOptions } from "../../constants/types.ts";
import UiServiceManager from "../../services/ui/ui-service.ts";
import { AudioManager } from "../audio/audio-manager.ts";

const { gameBoard, create, buildMenu } = UiServiceManager();
const { g_menu, dom_insert, board, clear_game_menu, show_game_menu } =
  gameBoard();

function UiManager() {
  const mainMenuButtonConfig = (): MBtnOptions[] => {
    return [
      {
        text: "New Game",
        color: "green",
        event: "click",
        cb: () => {
          //beginGame();
        },
      },
      {
        text: "Continue",
        color: "green",
      },
      {
        text: "Credits",
        color: "blue",
        event: "click",
        cb: () => {
          clear_game_menu();
        },
      },
      {
        text: "Settings",
        color: "black",
        event: "click",
        cb: () => {
          show_game_menu();
        },
      },
    ];
  };

  function enterGame() {
    const gameEnter = document.querySelector("#game-enter")!;
    gameEnter.addEventListener("click", () => {
      AudioManager()
        .Intro()
        .catch((e) => {
          console.error("Failed to play intro:", e);
        });

      document.getElementById("game-enter-wrapper")?.remove();
    });
  }

  function createSetupScreen() {
    const wrapper = create("div", { id: "setup-stage-screen" });

    console.log(wrapper);
  }

  function initGameMenu() {
    board.style.background = "url('images/bg/bg2.jpg')";
    board.style.backgroundSize = "cover";
    board.style.backgroundRepeat = "no-repeat";

    const logo = create("img", { src: "/images/ui/cc_logo_sm.png" });
    const menu = buildMenu(mainMenuButtonConfig(), logo);

    dom_insert(g_menu, menu);
  }

  return { initGameMenu, enterGame, createSetupScreen };
}

export { UiManager };
