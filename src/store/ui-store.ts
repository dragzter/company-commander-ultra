import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";

type PlayerStore = {
  gameStarted: boolean;
  playerName: string;
  playerCompanyName: string;
  startGame: () => void;
  setPlayerName: (n: string) => void;
};

type CompanyStore = {
  companyName: string;
  companyUnitPatchURL: string;
  companyMembers: [];
  commanderName: string;
  setCommanderName: (n: string) => void;
  setCompanyUnitPatch: (patchImgUrl: string) => void;
  setCompanyName: (companyName: string) => void;
};

export const usePlayerStore = createStore<PlayerStore>()(
  persist(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    (set, get) => ({
      // Initial State
      gameStarted: false,
      playerName: "Commander",
      playerCompanyName: "PlayerCompany",

      // Actions
      startGame: () => set({ gameStarted: true }),
      setPlayerName: (n: string) => set({ playerName: n }),
    }),
    {
      name: "cc-ui-store",
    },
  ),
);

export const usePlayerCompanyStore = createStore<CompanyStore>()(
  persist(
    (set, get) => ({
      // Initial State
      companyName: "PlayerCompany",
      commanderName: "Commander",
      companyUnitPatchURL: "",
      companyMembers: [],

      // Actions
      setCompanyName: (n: string) => set({ companyName: n }),
      setCompanyUnitPatch: (url: string) => set({ companyUnitPatchURL: url }),
      setCommanderName: (n: string) => set({ commanderName: n }),
    }),
    {
      name: "cc-company-store",
    },
  ),
);
