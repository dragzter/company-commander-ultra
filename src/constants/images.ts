const bg = {
  bg_1: "bg_1.jpg",
  bg_2: "bg_2.jpg",
  bg_76: "bg_76.jpg",
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
  camo_1_84x84: "camo_1_84x84.jpg",
  camo_1_800x800: "camo_1_800x800.jpg",
  camo_2_84x84: "camo_2_84x84.jpg",
  camo_2_800x800: "camo_2_800x800.jpg",
  camo_3_84x84: "camo_3_84x84.jpg",
  camo_3_800x800: "camo_3_800x800.jpg",
  camo_4_84x84: "camo_4_84x84.jpg",
  camo_4_800x800: "camo_4_800x800.jpg",
};

const junk = {
  junk_0: "junk_0.png",
};

const btn = {
  btn_black: "btn-black.png",
  btn_blue: "btn-blue.png",
  btn_green: "btn-green.png",
  btn_red: "btn-red.png",
  sq_btn_redo: "btn-redo.png",
  sq_add: "btn-add.png",
  sq_add_blue: "btn-add-blue.png",
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
  cc_title_dark: "cc_title_dark.png",
  cc_title_lite: "cc_title_lite.png",
};

const icon = {
  star_active: "star_active.png",
  star_inactive: "star_inactive.png",
};

const player_patch = {
  patch_1: "patch_1.png",
  patch_2: "patch_2.png",
  patch_3: "patch_3.png",
  patch_4: "patch_4.png",
  patch_5: "patch_5.png",
  patch_6: "patch_6.png",
  patch_7: "patch_7.png",
  patch_8: "patch_8.png",
};

const cpu_patch = {
  patch_0: "patch_0.png",
  patch_9: "patch_9.png",
  patch_10: "patch_10.png",
  patch_11: "patch_11.png",
  patch_12: "patch_12.png",
  patch_13: "patch_13.png",
  patch_14: "patch_14.png",
  patch_15: "patch_15.png",
  patch_16: "patch_16.png",
  patch_17: "patch_17.png",
  patch_18: "patch_18.png",
  patch_19: "patch_19.png",
};

/**
 * Weapon & Armor Items
 */
const armorCount = 20;
const ballisticWeaponsCount = 61;
const throwableCount = 11;

const armor: Record<string, string> = {};
for (let i = 0; i < armorCount; i++) {
  armor["armor_" + i] = `armor_${i}.png`;
}

const ballistic_weapon: Record<string, string> = {};
for (let i = 0; i < ballisticWeaponsCount; i++) {
  ballistic_weapon["weapon_" + i] = `weapon_${i}.png`;
}

const throwable: Record<string, string> = {};
for (let i = 0; i < throwableCount; i++) {
  throwable["throwable_" + i] = `throwable_${i}.png`;
}

/**
 * Portrait Avatar
 */
const playerFactionPortraitCount = 168;

// Major factions
const sandPortraitCount = 75;
const redPortraitCount = 48;
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
  logo,
  icon,
  player_patch,
  cpu_patch,
  portrait,
  red_portrait,
  sand_portrait,
  blue_portrait,
  black_portrait,
  junk,
  Items: { armor, ballistic_weapon, throwable },
};
