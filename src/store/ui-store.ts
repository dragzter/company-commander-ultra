import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { URLReader } from "../utils/url-reader.ts";

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
  inventory: [];

  // Setters
  setCommanderName: (n: string) => void;
  setCompanyUnitPatch: (patchImgUrl: string) => void;
  setCompanyName: (companyName: string) => void;
  setGameStep: (step: GameStep) => void;

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
        setGameStep: (step: GameStep) => set({ gameStep: step }),
        setCompanyName: (n: string) => set({ companyName: n }),
        setCompanyUnitPatch: (url: string) => set({ companyUnitPatchURL: url }),
        setCommanderName: (n: string) => set({ commanderName: n }),
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
          setCompanyName: (n: string) => set({ companyName: n }),
          setGameStep: (step: GameStep) => set({ gameStep: step }),
          setCompanyUnitPatch: (url: string) =>
            set({ companyUnitPatchURL: url }),
          setCommanderName: (n: string) => set({ commanderName: n }),
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
