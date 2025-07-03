import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { URLReader } from "../utils/url-reader.ts";
import type { Company } from "../game/entities/company/company.ts";
import type { Soldier } from "../game/entities/types.ts";
import { SoldierManager } from "../game/entities/soldier/soldier-manager.ts";
import { Partial } from "../game/html-templates/partials/partial.ts";
import { eventConfigs } from "../game/ui/event-configs.ts";
import { DomEventManager } from "../game/event-handlers/dom-event-manager.ts";
import { animateHTMLReplace } from "../utils/html-utils.ts";

const { nocache } = URLReader(document.location.search);
const skipPersistence = nocache === "true";

export const GAME_STEPS = {
  at_intro_0: "at_intro_0",
  at_main_menu_1: "at_main_menu_1",
  at_setup_screen_2: "at_setup_screen_2",
  at_confirmation_screen_3: "at_confirmation_screen_3",
  at_company_homepage_4: "at_company_homepage_4", // Game started - load in at this stage
};

export type GameStep = (typeof GAME_STEPS)[keyof typeof GAME_STEPS];

type CompanyStore = {
  // State
  companyName: string;
  companyUnitPatchURL: string;
  companyMembers: [];
  marketAvailableTroops: Soldier[];
  creditBalance: number;
  commanderName: string;
  gameStep: GameStep;
  totalMenInCompany: number;
  totalMenLostAllTime: number;
  totalEnemiesKilledAllTime: number;
  totalMissionsCompleted: number;
  totalMissionsFailed: number;
  companyLevel: number;
  totalItemsInInventory: number;
  totalInventoryCapacity: number;
  companyExperience: number;
  inventory: [];
  company: Company;
  recruitReroll: number;

  // Setters
  setMarketAvailableTroops: (soldiers: Soldier[]) => void;
  addCredits: (n: number) => void;
  subtractCredits: (n: number) => void;
  setCommanderName: (n: string) => void;
  setCompanyUnitPatch: (patchImgUrl: string) => void;
  setCompanyName: (companyName: string) => void;
  setGameStep: (step: GameStep) => void;
  addSoldierToCompany: (soldier: Soldier) => void;
  rerollSoldier: (id: string) => Promise<void>;
  useRecruitReroll: () => void;

  initializeCompany: () => void;

  // Booleans
  canProceedToLaunch: () => boolean;
};

export const usePlayerCompanyStore = createStore<CompanyStore>()(
  skipPersistence
    ? (set, get) => ({
        companyName: "",
        commanderName: "",
        companyUnitPatchURL: "",
        companyMembers: [],
        gameStep: GAME_STEPS.at_intro_0,
        recruitReroll: 6,

        marketAvailableTroops: [],
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
          const state = get();
          const rerollIndex = state.marketAvailableTroops.findIndex(
            (soldier) => soldier.id === id,
          );

          const soldierBeingRerolled = state.marketAvailableTroops[rerollIndex];

          const { armor, weapon, designation, level, inventory } =
            soldierBeingRerolled;

          const newSoldier = SoldierManager.generateSoldierAtLevel(
            level,
            designation,
            armor,
            weapon,
            inventory,
          );

          set((state) => ({
            marketAvailableTroops: state.marketAvailableTroops.map(
              (troop, index) => {
                if (index === rerollIndex) {
                  return newSoldier;
                }

                return troop;
              },
            ),
          }));
          const trooperCard = document.querySelector(
            `[data-troopercard='${id}']`,
          ) as HTMLElement;

          await animateHTMLReplace(
            trooperCard,
            Partial.parsedTrooper(newSoldier),
          ).then(() => {
            DomEventManager.initEventArray(eventConfigs().troopsScreen());

            const rerollCounterDiv = document.querySelector(
              ".reroll-counter",
            ) as HTMLElement;

            rerollCounterDiv.textContent = `Rerolls: ${state.recruitReroll}`;
          });
          state.useRecruitReroll();
        },
        useRecruitReroll: () =>
          set((state) => {
            if (state.recruitReroll - 1 <= 0) {
              return {
                recruitReroll: 0,
              };
            }

            return {
              recruitReroll: state.recruitReroll - 1,
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
          set((state) => ({
            creditBalance: state.creditBalance + creds,
          })),
        subtractCredits: (creds: number) =>
          set((state) => ({
            creditBalance: state.creditBalance - creds,
          })),
        setGameStep: (step: GameStep) => set({ gameStep: step }),
        setCompanyUnitPatch: (url: string) => set({ companyUnitPatchURL: url }),
        setCompanyName: (n: string) =>
          set((state) => ({
            companyName: n,
            company: {
              ...state.company,
              name: n,
            },
          })),
        setCommanderName: (n: string) =>
          set((state) => ({
            commanderName: n,
            company: {
              ...state.company,
              commander: n,
            },
          })),
        addSoldierToCompany: (soldier: Soldier) =>
          set((state) => ({
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
      })
    : persist(
        (set, get) => ({
          companyName: "",
          commanderName: "",
          companyUnitPatchURL: "",
          gameStep: GAME_STEPS.at_intro_0,
          companyMembers: [],
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
          creditBalance: 1000,
          company: {} as Company,
          marketAvailableTroops: [],
          recruitReroll: 6,

          setMarketAvailableTroops: (soldiers: Soldier[]) =>
            set({
              marketAvailableTroops: soldiers,
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

          // Actions
          rerollSoldier: async (id: string) => {
            const state = get();
            const rerollIndex = state.marketAvailableTroops.findIndex(
              (soldier) => soldier.id === id,
            );

            const soldierBeingRerolled =
              state.marketAvailableTroops[rerollIndex];

            const { armor, weapon, designation, level, inventory } =
              soldierBeingRerolled;

            const newSoldier = SoldierManager.generateSoldierAtLevel(
              level,
              designation,
              armor,
              weapon,
              inventory,
            );

            set((state) => ({
              marketAvailableTroops: state.marketAvailableTroops.map(
                (troop, index) => {
                  if (index === rerollIndex) {
                    return newSoldier;
                  }

                  return troop;
                },
              ),
            }));

            const trooperCard = document.querySelector(
              `[data-troopercard='${id}']`,
            ) as HTMLElement;

            await animateHTMLReplace(
              trooperCard,
              Partial.parsedTrooper(newSoldier),
            ).then(() => {
              DomEventManager.initEventArray(eventConfigs().troopsScreen());

              const rerollCounterDiv = document.querySelector(
                ".reroll-counter",
              ) as HTMLElement;

              setTimeout(() => {
                rerollCounterDiv.textContent = `Rerolls: ${state.recruitReroll}`;
              }, 50);
            });

            state.useRecruitReroll();
          },
          useRecruitReroll: () =>
            set((state) => {
              if (state.recruitReroll - 1 <= 0) {
                return {
                  recruitReroll: 0,
                };
              }

              return {
                recruitReroll: state.recruitReroll - 1,
              };
            }),
          addCredits: (creds: number) =>
            set((state) => ({
              creditBalance: state.creditBalance + creds,
            })),
          subtractCredits: (creds: number) =>
            set((state) => ({
              creditBalance: state.creditBalance - creds,
            })),
          setCompanyName: (n: string) =>
            set((state) => ({
              companyName: n,
              company: {
                ...state.company,
                name: n,
              },
            })),
          setGameStep: (step: GameStep) => set({ gameStep: step }),
          setCompanyUnitPatch: (url: string) =>
            set({ companyUnitPatchURL: url }),
          setCommanderName: (n: string) =>
            set((state) => ({
              commanderName: n,
              company: {
                ...state.company,
                commander: n,
              },
            })),
          addSoldierToCompany: (soldier: Soldier) =>
            set((state) => ({
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
        }),
        {
          name: "cc-company-store",
        },
      ),
);
