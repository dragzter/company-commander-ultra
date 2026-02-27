import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { URLReader } from "../utils/url-reader.ts";
import type { Company } from "../game/entities/company/company.ts";
import { getFormationSlots } from "../constants/company-slots.ts";
import type { Soldier } from "../game/entities/types.ts";
import type { MemorialEntry } from "../game/entities/memorial-types.ts";
import { StoreActions } from "./action.ts";
import { STARTING_CREDITS } from "../constants/economy.ts";

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

export type CompanyStore = {
  // State
  companyName: string;
  companyUnitPatchURL: string;
  marketAvailableTroops: Soldier[];
  recruitStaging: Soldier[];
  creditBalance: number;
  commanderName: string;
  gameStep: GameStep;
  totalMenInCompany: number;
  totalMenLostAllTime: number;
  /** Fallen soldiers for memorial display */
  memorialFallen: MemorialEntry[];
  totalEnemiesKilledAllTime: number;
  totalMissionsCompleted: number;
  totalMissionsFailed: number;
  companyLevel: number;
  totalItemsInInventory: number;
  totalInventoryCapacity: number;
  companyExperience: number;
  company: Company;
  rerollCounter: number;
  /** Selected gear tier (1–20) for market browsing. 0 = unset, defaults to max soldier level on first open. */
  marketTierLevel: number;

  // Setters
  setMarketAvailableTroops: (soldiers: Soldier[]) => void;
  addCredits: (n: number) => void;
  subtractCredits: (n: number) => void;
  setCommanderName: (n: string) => void;
  setCreditBalance: (amount: number) => void;
  setCompanyUnitPatch: (patchImgUrl: string) => void;
  setCompanyName: (companyName: string) => void;
  setGameStep: (step: GameStep) => void;
  setMarketTierLevel: (n: number) => void;
  addSoldierToCompany: (soldier: Soldier) => void;
  addToRecruitStaging: (soldier: Soldier) => void;
  tryAddToRecruitStaging: (soldier: Soldier) => { success: boolean; reason?: "capacity" | "afford" };
  removeFromRecruitStaging: (soldierId: string) => void;
  confirmRecruitment: () => void;
  rerollSoldier: (id: string) => Promise<void>;
  filterMarketTroops: (id: string) => void;
  useRerollCounter: () => void;

  initializeCompany: () => void;
  addInitialTroopsIfEmpty: () => void;
  addInitialArmoryIfEmpty: () => void;
  onCompanyLevelUp: () => void;
  releaseSoldier: (soldierId: string) => void;
  destroyCompanyItem: (index: number) => void;
  consumeSoldierMedical: (soldierId: string, inventoryIndex: number) => boolean;
  addItemsToCompanyInventory: (
    items: import("../constants/items/types.ts").Item[],
    totalCost: number,
  ) => { success: boolean; reason?: "capacity" | "credits" };
  consumeSoldierThrowable: (soldierId: string, inventoryIndex: number) => boolean;
  equipItemToSoldier: (
    soldierId: string,
    slotType: "weapon" | "armor" | "equipment",
    item: import("../constants/items/types.ts").Item,
    options?: { fromArmoryIndex?: number; equipmentIndex?: number },
  ) => { success: boolean; reason?: string };
  unequipItemToArmory: (
    soldierId: string,
    slotType: "weapon" | "armor" | "equipment",
    equipmentIndex?: number,
  ) => { success: boolean; reason?: string };
  emptySoldierToCompanyInventory: (soldierId: string) => { success: boolean; reason?: string };
  grantMissionRewards: (mission: import("../constants/missions.ts").Mission | null, victory: boolean, kiaCount?: number, missionLevel?: number) => { rewardItems: import("../constants/items/types.ts").Item[]; lootItems: import("../constants/items/types.ts").Item[] };
  syncSoldierLevelsFromExperience: () => void;
  grantSoldierCombatXP: (
    survivorIds: string[],
    damageBySoldier: Map<string, number>,
    damageTakenBySoldier: Map<string, number>,
    killsBySoldier: Map<string, number>,
    abilitiesUsedBySoldier: Map<string, number>,
    victory: boolean,
  ) => void;
  processCombatKIA: (
    kiaSoldierIds: string[],
    missionName?: string,
    playerKills?: Map<string, number>,
    kiaKilledBy?: Map<string, string>,
  ) => void;
  deductMissionEnergy: (survivorIds: string[], participantCount: number, hasCasualty: boolean, failed: boolean) => void;
  syncCombatHpToSoldiers: (playerCombatants: { id: string; hp: number }[]) => void;
  claimHoldingInventory: () => void;
  moveItemBetweenSlots: (op: {
    sourceSoldierId: string;
    sourceSlotType: "weapon" | "armor" | "equipment";
    sourceEqIndex?: number;
    destSoldierId: string;
    destSlotType: "weapon" | "armor" | "equipment";
    destEqIndex?: number;
  }) => { success: boolean; reason?: string };
  swapSoldierPositions: (indexA: number, indexB: number) => void;
  moveSoldierToPosition: (fromIndex: number, toIndex: number) => void;

  // Booleans
  canProceedToLaunch: () => boolean;
};

export const usePlayerCompanyStore = createStore<CompanyStore>()(
  !skipPersistence
    ? persist((set, get) => StoreActions(set, get), {
        name: "cc-company-store",
        merge: (persisted, current) => {
          const merged = { ...current, ...(persisted as object) } as CompanyStore;
          const bal = merged.creditBalance as number | string;
          if (bal === 1000 || String(bal) === "1000") {
            merged.creditBalance = STARTING_CREDITS;
          }
          if (!Array.isArray(merged.memorialFallen)) merged.memorialFallen = [];
          merged.memorialFallen = merged.memorialFallen.map((item: unknown) => {
            if (item && typeof item === "object" && "missionName" in item) return item as MemorialEntry;
            const s = item as { name?: string; level?: number };
            return { name: s?.name ?? "Unknown", level: s?.level ?? 1, missionName: "Unknown", enemiesKilled: 0 };
          });
          if (!Array.isArray(merged.company?.holding_inventory)) merged.company = { ...merged.company, holding_inventory: [] };
          /* Sync totalMenInCompany with company.soldiers - avoid showing count when soldiers array is missing */
          const soldierCount = merged.company?.soldiers?.length ?? 0;
          if ((merged.totalMenInCompany as number) > 0 && soldierCount === 0) {
            merged.totalMenInCompany = 0;
          }
          const fs = getFormationSlots(merged.company);
          if (fs.length > 0 && (!Array.isArray(merged.company?.formationSlots) || merged.company.formationSlots.length !== fs.length)) {
            merged.company = { ...merged.company, formationSlots: fs };
          }
          /* Ensure soldiers have energy for old saves */
          if (Array.isArray(merged.company?.soldiers)) {
            merged.company = {
              ...merged.company,
              soldiers: merged.company!.soldiers!.map((s: { energy?: number }) =>
                typeof s.energy !== "number" ? { ...s, energy: 100 } : s,
              ),
            };
          }
          const mtl = merged.marketTierLevel as number | undefined;
          if (typeof mtl !== "number" || mtl < 0) merged.marketTierLevel = 0;
          /* Sync companyExperience with company.experience (avoid drift from old saves or partial updates) */
          const companyExp = merged.company?.experience ?? merged.companyExperience ?? 0;
          if (typeof merged.company === "object") {
            merged.company = { ...merged.company, experience: companyExp };
          }
          merged.companyExperience = companyExp;
          if (typeof merged.companyLevel !== "number" || merged.companyLevel < 1) {
            merged.companyLevel = merged.company?.level ?? 1;
          }
          return merged;
        },
      })
    : (set, get) => StoreActions(set, get),
);
