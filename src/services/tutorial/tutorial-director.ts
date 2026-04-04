import type { CompanyStore } from "../../store/ui-store.ts";

export type TutorialStepId =
  | "home_open_missions"
  | "missions_launch_intro"
  | "ready_room_proceed"
  | "combat_tap_soldier"
  | "combat_tap_grenade"
  | "combat_tap_enemy"
  | "combat_tap_company_ability"
  | "combat_tap_company_target"
  | "recruit_open_market"
  | "recruit_market_credits"
  | "recruit_open_troops"
  | "recruit_roles_intro"
  | "recruit_select"
  | "recruit_confirm"
  | "formation_open"
  | "formation_market_prompt"
  | "formation_open_market"
  | "market_briefing"
  | "formation_move"
  | "armory_buy_armor"
  | "armory_equip_prompt"
  | "armory_equip_armor"
  | "tactics_inspect"
  | "tactics_use_in_combat"
  | "completed";

export type TutorialMilestones = {
  formationMoved: boolean;
  armorBought: boolean;
  armorEquipped: boolean;
  abilityInspected: boolean;
  abilityUsedInCombat: boolean;
};

export type TutorialDirectorState = {
  enabled: boolean;
  completed: boolean;
  step: TutorialStepId;
  enforceLock: boolean;
  resumeRequested: boolean;
  milestones: TutorialMilestones;
};

type TutorialScreenRoute =
  | "home"
  | "missions"
  | "market"
  | "troops"
  | "roster"
  | "formation"
  | "inventory"
  | "abilities";

type TutorialStepSpec = {
  index: number;
  total: number;
  title: string;
  instruction: string;
  screen: TutorialScreenRoute | null;
  allowedSelectors: string[];
  spotlightSelectors: string[];
};

export const DEFAULT_TUTORIAL_MILESTONES: TutorialMilestones = {
  formationMoved: false,
  armorBought: false,
  armorEquipped: false,
  abilityInspected: false,
  abilityUsedInCombat: false,
};

export const DEFAULT_TUTORIAL_DIRECTOR: TutorialDirectorState = {
  enabled: true,
  completed: false,
  step: "home_open_missions",
  enforceLock: true,
  resumeRequested: false,
  milestones: { ...DEFAULT_TUTORIAL_MILESTONES },
};

const STEP_TOTAL = 24;

const STEP_SPECS: Record<TutorialStepId, TutorialStepSpec> = {
  home_open_missions: {
    index: 1,
    total: STEP_TOTAL,
    title: "First Deployment",
    instruction: "Open Missions.",
    screen: "home",
    allowedSelectors: ["#home-onboarding-continue", "#company-go-missions"],
    spotlightSelectors: ["#company-go-missions"],
  },
  missions_launch_intro: {
    index: 2,
    total: STEP_TOTAL,
    title: "Launch Intro Mission",
    instruction: "Launch the Intro Skirmish.",
    screen: "missions",
    allowedSelectors: [
      "#missions-mode-normal",
      ".mission-launch-btn[data-mission-id^=\"onboarding_\"]",
      ".mission-card[data-mission-id^=\"onboarding_\"] .mission-launch-btn",
    ],
    spotlightSelectors: [".mission-card[data-mission-id^=\"onboarding_\"] .mission-launch-btn"],
  },
  ready_room_proceed: {
    index: 3,
    total: STEP_TOTAL,
    title: "Ready Room",
    instruction: "Tap Proceed to Mission.",
    screen: "missions",
    allowedSelectors: [
      ".mission-launch-btn[data-mission-id^=\"onboarding_\"]",
      ".mission-card[data-mission-id^=\"onboarding_\"] .mission-launch-btn",
      "#ready-room-proceed",
      "#ready-room-missions",
      "#combat-begin",
    ],
    spotlightSelectors: [
      "#ready-room-proceed",
      ".mission-card[data-mission-id^=\"onboarding_\"] .mission-launch-btn",
    ],
  },
  combat_tap_soldier: {
    index: 4,
    total: STEP_TOTAL,
    title: "Combat Basics",
    instruction: "Select a soldier.",
    screen: "missions",
    allowedSelectors: [
      "#combat-onboarding-continue",
      ".mission-launch-btn",
      "#ready-room-proceed",
      "#ready-room-missions",
      "#combat-begin",
      "#combat-players-grid .combat-card[data-side=\"player\"]",
      ".combat-card[data-side=\"player\"]",
    ],
    spotlightSelectors: ["#combat-players-grid .combat-card[data-side=\"player\"]"],
  },
  combat_tap_grenade: {
    index: 5,
    total: STEP_TOTAL,
    title: "Use Grenades",
    instruction: "Tap a grenade.",
    screen: "missions",
    allowedSelectors: [
      "#combat-onboarding-continue",
      ".mission-launch-btn",
      "#ready-room-proceed",
      "#ready-room-missions",
      "#combat-begin",
      "#combat-players-grid .combat-card[data-side=\"player\"]",
      ".combat-card[data-side=\"player\"]",
      "#combat-abilities-popup .combat-grenade-item",
    ],
    spotlightSelectors: ["#combat-abilities-popup .combat-grenade-item"],
  },
  combat_tap_enemy: {
    index: 6,
    total: STEP_TOTAL,
    title: "Select Target",
    instruction: "Tap any enemy target.",
    screen: "missions",
    allowedSelectors: [
      ".mission-launch-btn",
      "#ready-room-proceed",
      "#ready-room-missions",
      "#combat-begin",
      "#combat-abilities-popup .combat-grenade-item",
      "#combat-abilities-popup .combat-med-item",
      "#combat-abilities-popup .combat-ability-icon-slot",
      "#combat-players-grid .combat-card[data-side=\"player\"]",
      ".combat-card[data-side=\"player\"]",
      "#combat-enemies-grid .combat-card[data-side=\"enemy\"]",
      ".combat-card[data-side=\"enemy\"]",
    ],
    // Keep native red grenade targeting reticules as the only enemy highlight.
    spotlightSelectors: [],
  },
  combat_tap_company_ability: {
    index: 7,
    total: STEP_TOTAL,
    title: "Squad Ability",
    instruction: "Tap Focused Fire.",
    screen: "missions",
    allowedSelectors: [
      "#combat-onboarding-continue",
      ".mission-launch-btn",
      "#ready-room-proceed",
      "#ready-room-missions",
      "#combat-begin",
      "#combat-company-abilities-bar .combat-company-ability-btn[data-company-ability-id=\"focused_fire\"]",
      "#combat-company-abilities-bar .combat-company-ability-btn[data-company-ability-id]",
    ],
    spotlightSelectors: [
      "#combat-company-abilities-bar .combat-company-ability-btn[data-company-ability-id=\"focused_fire\"]",
      "#combat-company-abilities-bar .combat-company-ability-btn[data-company-ability-id]",
    ],
  },
  combat_tap_company_target: {
    index: 8,
    total: STEP_TOTAL,
    title: "Focused Fire Target",
    instruction: "Pick an enemy target.",
    screen: "missions",
    allowedSelectors: [
      ".mission-launch-btn",
      "#ready-room-proceed",
      "#ready-room-missions",
      "#combat-begin",
      "#combat-company-abilities-bar .combat-company-ability-btn[data-company-ability-id=\"focused_fire\"]",
      "#combat-company-abilities-bar .combat-company-ability-btn[data-company-ability-id]",
      "#combat-enemies-grid .combat-card[data-side=\"enemy\"]",
      ".combat-card[data-side=\"enemy\"]",
    ],
    // Keep native targeting reticules as the main enemy target cue.
    spotlightSelectors: [],
  },
  recruit_open_market: {
    index: 9,
    total: STEP_TOTAL,
    title: "Expand Squad",
    instruction: "Open Market.",
    screen: "home",
    allowedSelectors: ["#home-recruit-onboarding-continue", "#company-go-market"],
    spotlightSelectors: ["#company-go-market"],
  },
  recruit_market_credits: {
    index: 10,
    total: STEP_TOTAL,
    title: "Credits",
    instruction: "These are Credits. Earn in missions. Spend in Market.",
    screen: "market",
    allowedSelectors: [
      "#market-credits-onboarding-continue",
      "#cc-market .market-credits-inline .market-credits-display",
    ],
    spotlightSelectors: ["#cc-market .market-credits-inline .market-credits-display"],
  },
  recruit_open_troops: {
    index: 11,
    total: STEP_TOTAL,
    title: "Recruitment",
    instruction: "Open Troops.",
    screen: "market",
    allowedSelectors: ["#market-troops"],
    spotlightSelectors: ["#market-troops"],
  },
  recruit_roles_intro: {
    index: 12,
    total: STEP_TOTAL,
    title: "Soldier Roles",
    instruction: "Review roles, then tap Continue.",
    screen: "troops",
    allowedSelectors: [
      "#troops-roles-onboarding-continue",
      "#troops-roles-onboarding-popup",
      "#troops-roles-onboarding-popup *",
    ],
    spotlightSelectors: ["#troops-roles-onboarding-continue"],
  },
  recruit_select: {
    index: 13,
    total: STEP_TOTAL,
    title: "Recruitment",
    instruction: "Select the highlighted recruit.",
    screen: "troops",
    allowedSelectors: [".recruit-soldier", ".remove-from-staging", "#confirm-recruitment"],
    spotlightSelectors: [".recruit-soldier"],
  },
  recruit_confirm: {
    index: 14,
    total: STEP_TOTAL,
    title: "Recruitment",
    instruction: "Tap Confirm.",
    screen: "troops",
    allowedSelectors: ["#confirm-recruitment", ".remove-from-staging"],
    spotlightSelectors: ["#confirm-recruitment"],
  },
  formation_open: {
    index: 15,
    total: STEP_TOTAL,
    title: "Formation",
    instruction: "Open Formation.",
    screen: "roster",
    allowedSelectors: ["#company-go-roster", "#roster-formation-btn"],
    spotlightSelectors: ["#roster-formation-btn"],
  },
  formation_move: {
    index: 16,
    total: STEP_TOTAL,
    title: "Formation",
    instruction: "Move your Gunner from Reserve to Active.",
    screen: "formation",
    allowedSelectors: [
      ".formation-soldier-card[data-has-soldier=\"true\"]",
      ".formation-soldier-card[data-has-soldier=\"false\"]",
    ],
    spotlightSelectors: [
      ".formation-reserve-slot.designation-support",
      ".formation-reserve-slot.formation-soldier-card[data-has-soldier=\"true\"]",
      ".formation-soldier-card[data-has-soldier=\"true\"]",
    ],
  },
  formation_market_prompt: {
    index: 17,
    total: STEP_TOTAL,
    title: "Next Objective",
    instruction: "Tap Continue.",
    screen: "formation",
    allowedSelectors: ["#formation-market-onboarding-continue"],
    spotlightSelectors: ["#formation-market-onboarding-continue"],
  },
  formation_open_market: {
    index: 18,
    total: STEP_TOTAL,
    title: "Market",
    instruction: "Open Market.",
    screen: "formation",
    allowedSelectors: ["#company-go-market"],
    spotlightSelectors: ["#company-go-market"],
  },
  market_briefing: {
    index: 19,
    total: STEP_TOTAL,
    title: "Market Briefing",
    instruction: "Continue to armor purchase.",
    screen: "market",
    allowedSelectors: ["#market-sections-onboarding-continue"],
    spotlightSelectors: ["#market-sections-onboarding-continue"],
  },
  armory_buy_armor: {
    index: 20,
    total: STEP_TOTAL,
    title: "Armory Setup",
    instruction: "Buy one armor item.",
    screen: "market",
    allowedSelectors: [
      "#company-go-market",
      "#market-armor",
      ".gear-market-item[data-gear-context=\"armor\"]",
      "#armor-buy-btn",
      "#armor-buy-close",
    ],
    spotlightSelectors: [
      ".gear-market-item[data-gear-context=\"armor\"]",
      "#armor-buy-btn",
      "#market-armor",
    ],
  },
  armory_equip_prompt: {
    index: 21,
    total: STEP_TOTAL,
    title: "Armory Setup",
    instruction: "Open Armory.",
    screen: "market",
    allowedSelectors: [
      "#company-go-inventory",
      "#armory-equip-onboarding-continue",
    ],
    spotlightSelectors: [
      "#company-go-inventory",
      "#armory-equip-onboarding-continue",
    ],
  },
  armory_equip_armor: {
    index: 22,
    total: STEP_TOTAL,
    title: "Armory Setup",
    instruction: "Select armor, tap Equip, then choose a soldier.",
    screen: "inventory",
    allowedSelectors: [
      "#company-go-inventory",
      ".inventory-item-card[data-item-type=\"armor\"]",
      "#item-stats-popup-equip",
      "#armory-equip-picker-onboarding-continue",
      ".equip-slot[data-slot-type=\"armor\"]",
      ".equip-picker-soldier .equip-slot[data-slot-type=\"armor\"]",
      "#equip-picker-close",
    ],
    spotlightSelectors: [
      ".inventory-item-card[data-item-type=\"armor\"]",
      "#item-stats-popup-equip",
      ".equip-picker-soldier .equip-slot[data-slot-type=\"armor\"]",
    ],
  },
  tactics_inspect: {
    index: 23,
    total: STEP_TOTAL,
    title: "Tactics",
    instruction: "Open Tactics and inspect one ability.",
    screen: "abilities",
    allowedSelectors: ["#company-go-abilities", ".company-talent-node[data-ability-id]"],
    spotlightSelectors: ["#company-go-abilities", ".company-talent-node[data-ability-id]"],
  },
  tactics_use_in_combat: {
    index: 24,
    total: STEP_TOTAL,
    title: "Use Abilities",
    instruction: "Start a mission and use one ability.",
    screen: "missions",
    allowedSelectors: [
      "#company-go-missions",
      ".mission-launch-btn",
      "#ready-room-proceed",
      "#combat-begin",
      ".combat-ability-icon-slot",
      "#combat-company-abilities-bar .combat-company-ability-btn",
    ],
    spotlightSelectors: [".combat-ability-icon-slot", "#combat-company-abilities-bar .combat-company-ability-btn"],
  },
  completed: {
    index: STEP_TOTAL,
    total: STEP_TOTAL,
    title: "Tutorial Complete",
    instruction: "Tutorial complete. All systems unlocked.",
    screen: null,
    allowedSelectors: [],
    spotlightSelectors: [],
  },
};

const COMBAT_LOCKED_TUTORIAL_STEPS = new Set<TutorialStepId>([
  "combat_tap_soldier",
  "combat_tap_grenade",
  "combat_tap_enemy",
  "combat_tap_company_ability",
  "combat_tap_company_target",
  "tactics_use_in_combat",
]);

export function getTutorialStepSpec(step: TutorialStepId): TutorialStepSpec {
  return STEP_SPECS[step];
}

export function isTutorialActive(store: CompanyStore): boolean {
  const d = store.tutorialDirector;
  return !!(d?.enabled && !d.completed && d.step !== "completed");
}

export function getTutorialAllowedSelectors(store: CompanyStore): string[] {
  if (!isTutorialActive(store) || !store.tutorialDirector.enforceLock) return [];
  const spec = getTutorialStepSpec(store.tutorialDirector.step);
  return [
    ...spec.allowedSelectors,
    "#company-go-settings",
    "#settings-popup",
    "#settings-popup *",
    "#settings-reset-confirm-popup",
    "#settings-reset-confirm-popup *",
    "#company-resume-tutorial",
    "#tutorial-progress-dismiss",
    "#ready-room-onboarding-continue",
    "#combat-onboarding-continue",
    "#combat-summary-return",
  ];
}

export function getTutorialSpotlightSelectors(store: CompanyStore): string[] {
  if (!isTutorialActive(store)) return [];
  return getTutorialStepSpec(store.tutorialDirector.step).spotlightSelectors;
}

export function getTutorialProgressText(
  store: CompanyStore,
): { step: string; title: string; instruction: string } | null {
  if (!isTutorialActive(store)) return null;
  const spec = getTutorialStepSpec(store.tutorialDirector.step);
  return {
    step: `Step ${spec.index}/${spec.total}`,
    title: spec.title,
    instruction: spec.instruction,
  };
}

export function getTutorialExpectedScreen(
  store: CompanyStore,
): TutorialScreenRoute | null {
  if (!isTutorialActive(store)) return null;
  return getTutorialStepSpec(store.tutorialDirector.step).screen;
}

export function shouldBlockTutorialInteraction(
  store: CompanyStore,
  target: HTMLElement | null,
): boolean {
  if (!target) return false;
  // Never block launch overlay controls; persisted gameStep can be "at_company_homepage_4"
  // before the user taps Enter Game.
  if (target.closest("#game-enter-wrapper") || target.closest("#game-enter")) {
    return false;
  }
  // Do not lock pre-game UI (intro/main menu/setup/confirmation); this can
  // otherwise block critical boot actions like "Enter Game".
  if ((store.gameStep ?? "") !== "at_company_homepage_4") return false;
  if (!isTutorialActive(store) || !store.tutorialDirector.enforceLock) return false;
  if (target.closest("#combat-screen")) {
    const step = store.tutorialDirector.step;
    // Keep combat fully playable when tutorial has already advanced to a
    // non-combat objective while the current mission is still running.
    if (!COMBAT_LOCKED_TUTORIAL_STEPS.has(step)) return false;
  }
  const allow = getTutorialAllowedSelectors(store);
  if (allow.length <= 0) return false;
  for (const selector of allow) {
    if (!selector) continue;
    if (target.closest(selector)) return false;
  }
  return true;
}

const STEP_ORDER: TutorialStepId[] = [
  "home_open_missions",
  "missions_launch_intro",
  "ready_room_proceed",
  "combat_tap_soldier",
  "combat_tap_grenade",
  "combat_tap_enemy",
  "combat_tap_company_ability",
  "combat_tap_company_target",
  "recruit_open_market",
  "recruit_market_credits",
  "recruit_open_troops",
  "recruit_roles_intro",
  "recruit_select",
  "recruit_confirm",
  "formation_open",
  "formation_move",
  "formation_market_prompt",
  "formation_open_market",
  "market_briefing",
  "armory_buy_armor",
  "armory_equip_prompt",
  "armory_equip_armor",
  "tactics_inspect",
  "tactics_use_in_combat",
  "completed",
];

export function getNextTutorialStep(current: TutorialStepId): TutorialStepId {
  const idx = STEP_ORDER.indexOf(current);
  if (idx < 0) return "completed";
  return STEP_ORDER[Math.min(STEP_ORDER.length - 1, idx + 1)] ?? "completed";
}
