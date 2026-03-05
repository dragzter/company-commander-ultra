import { UiServiceManager } from "../services/ui/ui-service.ts";

/**
 * The style function provides utilities for common stying tasks.
 * __styler__ is a utility
 */
function styler() {
  const _UiServiceManager = UiServiceManager;

  const { gameBoard } = _UiServiceManager;
  const { center } = gameBoard();

  function selectedWhite5(el: HTMLElement) {
    el.style.outline = "5px solid white";
    el.style.borderRadius = "8px";
  }

  function setCenterBG(img: string, applyOverlay = false) {
    const source = img.startsWith("/")
      ? img
      : img.includes("/")
        ? `/images/${img}`
        : `/images/bg/${img}`;
    center.style.backgroundImage = `url(${source})`;
    center.style.backgroundRepeat = "no-repeat";
    center.style.backgroundSize = "cover";

    if (applyOverlay) {
      center.classList.add("overlay");
    }
  }

  return { selectedWhite5, setCenterBG };
}

const singleton = styler();

export { singleton as Styler };
