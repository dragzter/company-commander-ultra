import type {
  BtnOptions,
  ElOptions,
  MBtnOptions,
} from "../../constants/types.ts";
import { s_ } from "../../utils/html-utils.ts";

type GameElements = {
  upper: HTMLElement;
  lower: HTMLElement;
  left: HTMLElement;
  right: HTMLElement;
  board: HTMLElement;
  g_menu: HTMLElement;
  center: HTMLElement;
  hide: {
    upper: () => void;
    lower: () => void;
    left: () => void;
    right: () => void;
    center: () => void;
    menu: () => void;
    board: () => void;
  };
  show: {
    upper: () => void;
    lower: () => void;
    left: () => void;
    right: () => void;
    center: () => void;
    menu: () => void;
    board: () => void;
  };
  dom_insert: (el: HTMLElement, html: Element) => void;
};

function UiServiceManager() {
  function buildMenu(
    buttonDefs: MBtnOptions[],
    before?: HTMLElement,
    after?: HTMLElement,
  ) {
    const menu = document.createElement("div");
    menu.classList.add(
      "game-menu",
      "flex",
      "column",
      "align-center",
      "justify-center",
      "gap-3",
      "h-100",
    );
    const buttons: HTMLElement[] = [];

    for (let i = 0; i < buttonDefs.length; i++) {
      const b = mbtn(buttonDefs[i]);
      if (b) buttons.push(b as HTMLElement);
    }

    menu.append(...buttons);

    if (before) {
      menu.prepend(before);
    }

    if (after) {
      menu.append(after);
    }

    return menu;
  }

  function create(element: string, options: ElOptions = {}) {
    const allowedTypes = [
      "div",
      "img",
      "span",
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ];

    if (!allowedTypes.includes(element)) {
      console.warn(element + " is not an allowed element type.");
      return;
    }

    const el = document.createElement(element);
    const { classes, id, attributes } = options;

    if (classes?.length) {
      el.classList.add(...classes);
    }

    if (!options.src && element === "img") {
      console.log("Img elements require a src option.");
      (el as HTMLImageElement).alt = "No Image src provided";
      return el;
    }

    if (id) {
      el.id = id;
    }

    if (options.src) {
      (el as HTMLImageElement).src = options.src;
    }

    if (attributes && Object.keys(attributes)?.length) {
      for (const a in attributes) {
        el.setAttribute(a, attributes[a]);
      }
    }

    return el;
  }

  function parseHTML(template: string) {
    const fragment = document.createRange().createContextualFragment(template);
    return fragment.firstElementChild;
  }

  function btn(options: BtnOptions) {
    const btnString = `<button class="${options?.classes?.join(" ") ?? ""}" id="${options?.id ?? ""}">${options.text}</button>`;

    const parsed = document
      .createRange()
      .createContextualFragment(btnString).firstElementChild;

    if (options?.cb && options?.event && parsed) {
      parsed.addEventListener(options.event, options.cb);
    }

    if (options?.sound && parsed) {
      const audio = new Audio(options.sound);
      audio.preload = "auto";
      audio.volume = 0.5;
      parsed.addEventListener("mouseover", () => {
        audio.currentTime = 0; // Reset to start
        audio.play().catch((e) => console.error("Audio playback failed:", e));
      });
      audio.addEventListener("ended", () => {
        audio.currentTime = 0;
      });
    }

    return parsed;
  }

  function mbtn(options: MBtnOptions) {
    const up_options: BtnOptions = {
      text: options.text,
      classes: [options.color, "mbtn", ...(options.classes ?? [])],
      event: options?.event ?? undefined,
      cb: options?.cb ?? undefined,
      id: options?.id ?? undefined,
    };

    return btn(up_options);
  }

  function gameBoard(): GameElements {
    const board = document.querySelector("#game") as HTMLElement;

    if (!board) throw new Error("#game is not defined.");

    const upper = s_("#g-upper");
    const lower = s_("#g-lower");
    const center = s_("#g-center");
    const left = s_("#g-left");
    const right = s_("#g-right");
    const g_menu = s_("#g-menu");

    function ins(element: HTMLElement, html: Element) {
      if (element) {
        element.appendChild(html);
      }
    }

    function hideElement(element: HTMLElement) {
      element.classList.remove("visible");
      element.classList.add("hidden");
      element.style.zIndex = "var(--prio-low)";
    }

    function showElement(element: HTMLElement) {
      element.classList.add("visible");
      element.classList.remove("hidden");
      element.style.zIndex = "var(--prio-highest)";
    }

    return {
      upper,
      lower,
      left,
      right,
      board,
      center,
      g_menu,
      hide: {
        upper: () => hideElement(upper),
        lower: () => hideElement(lower),
        left: () => hideElement(left),
        right: () => hideElement(right),
        center: () => hideElement(center),
        menu: () => hideElement(g_menu),
        board: () => hideElement(board),
      },
      show: {
        upper: () => showElement(upper),
        lower: () => showElement(lower),
        left: () => showElement(left),
        right: () => showElement(right),
        center: () => showElement(center),
        menu: () => showElement(g_menu),
        board: () => showElement(board),
      },
      dom_insert: (el: HTMLElement, html: Element) => ins(el, html),
    } as GameElements;
  }

  return {
    create,
    btn,
    mbtn,
    parseHTML,
    buildMenu,
    gameBoard,
  };
}

const singleton = UiServiceManager();
export { singleton as UiServiceManager };
