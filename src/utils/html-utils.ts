export function enableBtn(btn: HTMLButtonElement) {
  if (!btn) throw new Error("No button element provided");

  btn.classList.remove("disabled");
  btn.disabled = false;
}

export function disableBtn(btn: HTMLButtonElement) {
  if (!btn) throw new Error("No button element provided");
  btn.classList.add("disabled");
  btn.disabled = true;
}

/**
 *  Remove hash from a string to make it suitable for inclusion on HTML
 * @param selector
 */
export function clrHash(selector: string) {
  return selector.replace("#", "");
}

/**
 * Wrapper for querySelector or getElementById
 * @param selector
 */
export function s_(selector: string) {
  if (selector.includes("#")) {
    return document.getElementById(clrHash(selector)) as HTMLElement;
  }
  return document.querySelector(selector) as HTMLElement;
}

/**
 * Wrapper for querySelectorAll
 * @param selector
 */
export function sa_(selector: string) {
  return document.querySelectorAll(selector);
}
