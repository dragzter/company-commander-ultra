import { SoldierManager } from "../game/entities/soldier/soldier-manager.ts";
import { animateHTMLReplace } from "../utils/html-utils.ts";
import { Partial } from "../game/html-templates/partials/partial.ts";
import { DomEventManager } from "../game/event-handlers/dom-event-manager.ts";
import { eventConfigs } from "../game/ui/event-configs.ts";
import { type CompanyStore, GAME_STEPS, type GameStep } from "./ui-store.ts";
import type { Company } from "../game/entities/company/company.ts";
import type { Soldier } from "../game/entities/types.ts";

export const StoreActions = (set: any, get: () => CompanyStore) => ({
  companyName: "",
  commanderName: "",
  companyUnitPatchURL: "",
  gameStep: GAME_STEPS.at_intro_0,
  rerollCounter: 6,

  marketAvailableTroops: [] as Soldier[],
  creditBalance: 1000,
  totalMenInCompany: 0,
  totalMenLostAllTime: 0,
  totalEnemiesKilledAllTime: 0,
  totalMissionsCompleted: 0,
  totalMissionsFailed: 0,
  companyLevel: 0,
  totalInventoryCapacity: 0,
  totalItemsInInventory: 0,
  inventory: [],
  companyExperience: 0,
  company: {} as Company,

  // Actions
  rerollSoldier: async (id: string) => {
    const rerollIndex = get().marketAvailableTroops.findIndex(
      (soldier) => soldier.id === id,
    );

    const soldierBeingRerolled = get().marketAvailableTroops[rerollIndex];

    const { armor, weapon, designation, level, inventory } =
      soldierBeingRerolled;

    const newSoldier = SoldierManager.generateSoldierAtLevel(
      level,
      designation,
      armor,
      weapon,
      inventory,
    );

    set((state: CompanyStore) => ({
      marketAvailableTroops: state.marketAvailableTroops.map((troop, index) => {
        if (index === rerollIndex) {
          return newSoldier;
        }

        return troop;
      }),
    }));
    const trooperCard = document.querySelector(
      `[data-troopercard='${id}']`,
    ) as HTMLElement;

    await animateHTMLReplace(
      trooperCard,
      Partial.render.parsedTrooper(newSoldier),
    ).then(() => {
      DomEventManager.initEventArray(eventConfigs().troopsScreen());
      get().useRerollCounter();

      const rerollCounterDiv = document.querySelector(
        ".reroll-counter",
      ) as HTMLElement;

      rerollCounterDiv.replaceWith(
        Partial.render.parsedRerollCounter(get().rerollCounter) as HTMLElement,
      );
    });
  },
  useRerollCounter: () =>
    set((state: CompanyStore) => {
      if (state.rerollCounter - 1 <= 0) {
        return {
          rerollCounter: 0,
        };
      }

      return {
        rerollCounter: state.rerollCounter - 1,
      };
    }),
  initializeCompany: () => {
    set({
      company: {
        level: 0,
        experience: 0,
        name: "",
        soldiers: [],
        companyName: "",
        commander: "",
        inventory: [],
      },
    });
  },

  setMarketAvailableTroops: (soldiers: Soldier[]) =>
    set({
      marketAvailableTroops: soldiers,
    }),
  addCredits: (creds: number) =>
    set((state: CompanyStore) => ({
      creditBalance: state.creditBalance + creds,
    })),
  subtractCredits: (creds: number) =>
    set((state: CompanyStore) => ({
      creditBalance: state.creditBalance - creds,
    })),
  setGameStep: (step: GameStep) => set({ gameStep: step }),
  setCompanyUnitPatch: (url: string) => set({ companyUnitPatchURL: url }),
  setCompanyName: (n: string) =>
    set((state: CompanyStore) => ({
      companyName: n,
      company: {
        ...state.company,
        name: n,
      },
    })),
  setCommanderName: (n: string) =>
    set((state: CompanyStore) => ({
      commanderName: n,
      company: {
        ...state.company,
        commander: n,
      },
    })),
  addSoldierToCompany: (soldier: Soldier) =>
    set((state: CompanyStore) => ({
      company: {
        ...state.company,
        soldiers: [...state.company.soldiers, soldier],
      },
    })),
  canProceedToLaunch: () => {
    const state = get();
    return (
      state.companyName.length > 4 &&
      state.companyName.length < 16 &&
      state.commanderName.length > 2 &&
      state.commanderName.length < 16 &&
      state.companyUnitPatchURL !== ""
    );
  },
});
