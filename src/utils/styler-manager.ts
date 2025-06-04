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

  function setCenterBG(img: string) {
    center.style.backgroundImage = "url(images/bg/" + img + ")";
    center.style.backgroundRepeat = "no-repeat";
    center.style.backgroundSize = "cover";
  }

  return { selectedWhite5, setCenterBG };
}

const singleton = styler();

export { singleton as Styler };
