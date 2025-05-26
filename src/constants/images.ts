const bg = {
  bg_1: "bg_1.jpg",
  bg_2: "bg_2.jpg",
  bg_77: "bg_77.jpg",
  bg_78: "bg_78.jpg",
  bg_79: "bg_79.jpg",
  bg_80: "bg_80.jpg",
  bg_81: "bg_81.jpg",
  bg_82: "bg_82.jpg",
  bg_83: "bg_83.jpg",
  bg_84: "bg_84.jpg",
  bg_85: "bg_85.jpg",
  bg_86: "bg_86.jpg",
  bg_87: "bg_87.jpg",
  bg_88: "bg_88.jpg",
  bg_89: "bg_89.jpg",
  bg_90: "bg_90.jpg",
  bg_store_85: "bg_store_85.jpg",
  bg_store_88: "bg_store_88.jpg",
};

const btn = {
  btn_black: "btn-black.png",
  btn_blue: "btn-blue.png",
  btn_green: "btn-green.png",
  btn_red: "btn-red.png",
  sq_backwards: "backwards_button.png",
  sq_calendar: "calendar_button.png",
  sq_forward: "forward_button.png",
  sq_inventory: "inventory_button.png",
  sq_home: "home_button.png",
  sq_left: "left_button.png",
  sq_right: "right_button.png",
  sq_list_1: "list_1_button.png",
  sq_list_2: "list_2_button.png",
  sq_market: "market_button.png",
  sq_heroes: "heroes_button.png",
  sq_mission: "missions_button.png",
  sq_star: "star_button.png",
  sq_training: "training_button.png",
};

const logo = {
  cc_logo: "cc_logo.png",
  cc_logo_sm: "cc_logo_sm.png",
};

const icon = {
  star_active: "star_active.png",
  star_inactive: "star_inactive.png",
};

const patch = {
  patch_1: "patch_1.png",
  patch_2: "patch_2.png",
  patch_3: "patch_3.png",
  patch_4: "patch_4.png",
  patch_5: "patch_5.png",
  patch_6: "patch_6.png",
  patch_7: "patch_7.png",
  patch_8: "patch_8.png",
};

/**
 * Portrait Avatar
 */
const sandPortraitCount = 75;
const redPortraitCount = 48;
const playerFactionPortraitCount = 168;
const bluePortraitCount = 61;
const blackPortraitCount = 76;

const sand_portrait: Record<string, string> = {};
for (let i = 0; i < sandPortraitCount; i++) {
  sand_portrait["p_" + i] = `sand_portrait_${i}.png`;
}

const red_portrait: Record<string, string> = {};
for (let i = 0; i < redPortraitCount; i++) {
  red_portrait["p_" + i] = `red_portrait_${i}.png`;
}

const portrait: Record<string, string> = {};
for (let i = 0; i < playerFactionPortraitCount; i++) {
  portrait["p_" + i] = `portrait_${i}.png`;
}

const blue_portrait: Record<string, string> = {};
for (let i = 0; i < bluePortraitCount; i++) {
  blue_portrait["p_" + i] = `blue_portrait_${i}.png`;
}

const black_portrait: Record<string, string> = {};
for (let i = 0; i < blackPortraitCount; i++) {
  black_portrait["p_" + i] = `black_portrait_${i}.png`;
}

export const Images = {
  bg,
  btn,
  patch,
  logo,
  icon,
  sand_portrait,
  portrait,
  red_portrait,
  blue_portrait,
  black_portrait,
};
