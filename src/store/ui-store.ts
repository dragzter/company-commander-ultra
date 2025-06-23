import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { URLReader } from "../utils/url-reader.ts";
import type { Company, Soldier } from "../game/entities/types.ts";

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

  // Setters
  addCredits: (n: number) => void;
  subtractCredits: (n: number) => void;
  setCommanderName: (n: string) => void;
  setCompanyUnitPatch: (patchImgUrl: string) => void;
  setCompanyName: (companyName: string) => void;
  setGameStep: (step: GameStep) => void;
  addSoldierToCompany: (soldier: Soldier) => void;

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

        creditBalance: 0,
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

        addSoldierToCompany: (soldier: Soldier) => {
          const currentCompany = get().company;
          currentCompany.soldiers.push(soldier);
          set({ company: { ...currentCompany } });
        },

        initializeCompany: () => {
          set({
            company: {
              level: 0,
              experience: 0,
              name: "",
              soldiers: [],
              companyName: "",
              commander: "",
            },
          });
        },

        // Actions
        addCredits: (creds: number) => ({
          creditBalance: get().creditBalance + creds,
        }),
        subtractCredits: (creds: number) => ({
          creditBalance: get().creditBalance - creds,
        }),
        setGameStep: (step: GameStep) => set({ gameStep: step }),
        setCompanyName: (n: string) => {
          set({ companyName: n });

          const currentCompany = { ...get().company };
          currentCompany.companyName = n;
          set({ company: { ...currentCompany } });
        },
        setCompanyUnitPatch: (url: string) => set({ companyUnitPatchURL: url }),
        setCommanderName: (n: string) => {
          set({ commanderName: n });

          const currentCompany = { ...get().company };
          currentCompany.commander = n;
          set({ company: { ...currentCompany } });
        },
        canProceedToLaunch: () => {
          return (
            get().companyName.length > 4 &&
            get().companyName.length < 16 &&
            get().commanderName.length > 2 &&
            get().commanderName.length < 16 &&
            get().companyUnitPatchURL !== ""
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
          creditBalance: 0,
          company: {} as Company,

          initializeCompany: () => {
            set({
              company: {
                level: 0,
                experience: 0,
                name: "",
                soldiers: [],
                companyName: "",
                commander: "",
              },
            });
          },

          // Actions
          addCredits: (creds: number) => ({
            creditBalance: get().creditBalance + creds,
          }),
          subtractCredits: (creds: number) => ({
            creditBalance: get().creditBalance - creds,
          }),
          setCompanyName: (n: string) => {
            set({ companyName: n });

            const currentCompany = { ...get().company };
            currentCompany.companyName = n;
            set({ company: { ...currentCompany } });
          },
          setGameStep: (step: GameStep) => set({ gameStep: step }),
          setCompanyUnitPatch: (url: string) =>
            set({ companyUnitPatchURL: url }),
          setCommanderName: (n: string) => {
            set({ commanderName: n });

            const currentCompany = { ...get().company };
            currentCompany.commander = n;
            set({ company: { ...currentCompany } });
          },
          addSoldierToCompany: (soldier: Soldier) => {
            const currentCompany = get().company;
            currentCompany.soldiers.push(soldier);
            set({ company: { ...currentCompany } });
          },
          canProceedToLaunch: () => {
            return (
              get().companyName.length > 4 &&
              get().companyName.length < 16 &&
              get().commanderName.length > 2 &&
              get().commanderName.length < 16 &&
              get().companyUnitPatchURL !== ""
            );
          },
        }),
        {
          name: "cc-company-store",
        },
      ),
);
