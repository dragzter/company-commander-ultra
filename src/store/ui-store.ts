import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { URLReader } from "../utils/url-reader.ts";

const { nocache } = URLReader(document.location.search);
const skipPersistence = nocache === "true";

// type PlayerStore = {
//   gameStarted: boolean;
//   playerName: string;
//   playerCompanyName: string;
//   startGame: () => void;
//   setPlayerName: (n: string) => void;
// };

type CompanyStore = {
  companyName: string;
  companyUnitPatchURL: string;
  companyMembers: [];
  commanderName: string;
  setCommanderName: (n: string) => void;
  setCompanyUnitPatch: (patchImgUrl: string) => void;
  setCompanyName: (companyName: string) => void;
  canProceedToLaunch: () => boolean;
};

// export const usePlayerStore = createStore<PlayerStore>()(
//   persist(
//     (set) => ({
//       // Initial State
//       gameStarted: false,
//       playerName: "Commander",
//       playerCompanyName: "PlayerCompany",
//
//       // Actions
//       startGame: () => set({ gameStarted: true }),
//       setPlayerName: (n: string) => set({ playerName: n }),
//     }),
//     {
//       name: "cc-ui-store",
//     },
//   ),
// );

export const usePlayerCompanyStore = createStore<CompanyStore>()(
  skipPersistence
    ? (set, get) => ({
        companyName: "",
        commanderName: "",
        companyUnitPatchURL: "",
        companyMembers: [],
        setCompanyName: (n: string) => set({ companyName: n }),
        setCompanyUnitPatch: (url: string) => set({ companyUnitPatchURL: url }),
        setCommanderName: (n: string) => set({ commanderName: n }),
        canProceedToLaunch: () => {
          console.log(
            get().companyName.length,
            get().commanderName.length,
            get().companyUnitPatchURL,
          );
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
          companyMembers: [],
          setCompanyName: (n: string) => set({ companyName: n }),
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
