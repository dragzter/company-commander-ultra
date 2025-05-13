import type {
  BtnOptions,
  ElOptions,
  MBtnOptions,
} from "../../constants/types.ts";

type GameElements = {
  upper: HTMLElement;
  lower: HTMLElement;
  left: HTMLElement;
  right: HTMLElement;
  board: HTMLElement;
  g_menu: HTMLElement;
  center: HTMLElement;
  clear_game_menu: () => void;
  show_game_menu: () => void;
  dom_insert: (
    el: HTMLElement,
    html: Element,
  ) => (
    el: HTMLElement,
    html: Element,
  ) => (el: HTMLElement, html: Element) => void;
};

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
    console.error(element + " is not an allowed element type.");
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

function gameBoard(): GameElements {
  const board = document.querySelector("#game")!;
  const upper = board.querySelector("#g-upper") as HTMLElement;
  const lower = board.querySelector("#g-lower") as HTMLElement;
  const center = board.querySelector("#g-center") as HTMLElement;
  const left = board.querySelector("#g-left") as HTMLElement;
  const right = board.querySelector("#g-right") as HTMLElement;
  const g_menu = board.querySelector("#g-menu") as HTMLElement;

  function ins(element: HTMLElement, html: Element) {
    if (element) {
      element.appendChild(html);
    }
  }

  function cgm() {
    g_menu.innerHTML = "";
    g_menu.style.visibility = "hidden";
  }

  function sgm() {
    g_menu.style.visibility = "visible";
  }

  return {
    upper,
    lower,
    left,
    right,
    board,
    center,
    g_menu,
    clear_game_menu: () => cgm(),
    show_game_menu: () => sgm(),
    dom_insert: (el: HTMLElement, html: Element) => ins(el, html),
  } as GameElements;
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
    classes: [options.color, "mbtn", ...(options.classes ?? "")],
    event: options?.event ?? undefined,
    cb: options?.cb ?? undefined,
    id: options?.id ?? undefined,
  };

  return btn(up_options);
}

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
  const buttons = [];

  for (let i = 0; i < buttonDefs.length; i++) {
    buttons.push(mbtn(buttonDefs[i]));
  }

  menu.append(...(buttons as HTMLElement[]));

  if (before) {
    menu.prepend(before);
  }

  if (after) {
    menu.append(after);
  }

  return menu;
}

export default function UiServiceManager() {
  return {
    create,
    btn,
    mbtn,
    buildMenu,
    gameBoard,
  };
}
