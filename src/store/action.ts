import { SoldierManager } from "../game/entities/soldier/soldier-manager.ts";
import { animateHTMLRemove, animateHTMLReplace } from "../utils/html-utils.ts";
import { Partial } from "../game/html-templates/partials/partial.ts";
import { DomEventManager } from "../game/ui/event-handlers/dom-event-manager.ts";
import { eventConfigs } from "../game/ui/event-configs.ts";
import { type CompanyStore, GAME_STEPS, type GameStep } from "./ui-store.ts";
import {
  type Company,
  getMaxCompanySize,
  COMPANY_RESOURCES_BY_LEVEL,
} from "../game/entities/company/company.ts";
import type { Soldier } from "../game/entities/types.ts";
import {
  STARTING_CREDITS,
  getRecruitCost,
  DEFAULT_INVENTORY_CAPACITY,
  getWeaponArmorySlots,
  getArmorArmorySlots,
  getEquipmentArmorySlots,
  getLevelFromExperience,
  getXpRequiredForLevel,
  getSoldierXpRequiredForLevel,
  SOLDIER_XP_BASE_SURVIVE_VICTORY,
  SOLDIER_XP_BASE_SURVIVE_DEFEAT,
  SOLDIER_XP_PER_DAMAGE,
  SOLDIER_XP_PER_DAMAGE_TAKEN,
  SOLDIER_XP_PER_KILL,
  SOLDIER_XP_PER_ABILITY_USE,
  MAX_SOLDIER_LEVEL,
  ENERGY_MAX,
  ENERGY_COST_BASE,
  ENERGY_COST_CASUALTY,
  ENERGY_COST_FAIL,
  ENERGY_COST_QUIT,
  ENERGY_RECOVERY_REST,
} from "../constants/economy.ts";
import {
  getItemArmoryCategory,
  countArmoryByCategory,
  canItemStackInArmory,
} from "../utils/item-utils.ts";
import { getFormationSlots, getActiveSlots, getReserveSlots } from "../constants/company-slots.ts";
import type { Item } from "../constants/items/types.ts";
import { TARGET_TYPES } from "../constants/items/types.ts";
import { MAX_EQUIPMENT_SLOTS } from "../constants/inventory-slots.ts";
import { weaponWieldOk, canEquipItemLevel } from "../utils/equip-utils.ts";
import { getRewardItemById, pickRandomCommonSupply } from "../utils/reward-utils.ts";
import {
  createWeaponByBaseId,
  createArmorByBaseId,
  EPIC_WEAPON_BASE_IDS,
  getEpicArmorBaseIdsForLevel,
  getRareArmorBaseIdsForLevel,
  RARE_WEAPON_BASE_IDS,
  pickRandomFrom,
} from "../constants/gear-catalog.ts";
import type { Mission } from "../constants/missions.ts";
import {
  LOOT_EPIC_CHANCE,
  LOOT_RARE_CHANCE,
  LOOT_COMMON_SUPPLY_CHANCE,
} from "../constants/missions.ts";
import type { MemorialEntry } from "../game/entities/memorial-types.ts";
import { getStarterArmoryItems } from "../constants/starter-armory.ts";
import { generateMissions, MISSION_BOARD_SCHEMA_VERSION } from "../services/missions/mission-generator.ts";
import { SOLDIER_DESIGNATION, type Designation } from "../game/entities/types.ts";

function pickReplacementMission(
  completed: Mission,
  companyLevel: number,
  existingBoard: Mission[],
): Mission | null {
  const wantedEpic = !!(completed.isEpic ?? completed.rarity === "epic");
  const wantedRarity = wantedEpic ? "epic" : "normal";
  const wantedKind = completed.kind;
  const usedTitles = new Set(existingBoard.filter((m) => m.id !== completed.id).map((m) => m.name));

  for (let attempt = 0; attempt < 8; attempt++) {
    const pool = generateMissions(companyLevel);
    const candidate = pool.find((m) => {
      const isEpic = !!(m.isEpic ?? m.rarity === "epic");
      const rarity = isEpic ? "epic" : (m.rarity ?? "normal");
      return m.kind === wantedKind && isEpic === wantedEpic && rarity === wantedRarity && !usedTitles.has(m.name);
    }) ?? pool.find((m) => {
      const isEpic = !!(m.isEpic ?? m.rarity === "epic");
      const rarity = isEpic ? "epic" : (m.rarity ?? "normal");
      return m.kind === wantedKind && isEpic === wantedEpic && rarity === wantedRarity;
    });
    if (candidate) return candidate;
  }

  return null;
}

const RECRUIT_ROLE_TARGETS: Record<Designation, number> = {
  [SOLDIER_DESIGNATION.rifleman]: 6,
  [SOLDIER_DESIGNATION.medic]: 2,
  [SOLDIER_DESIGNATION.support]: 2,
};

const RECRUIT_ROLE_ORDER: Designation[] = [
  SOLDIER_DESIGNATION.rifleman,
  SOLDIER_DESIGNATION.medic,
  SOLDIER_DESIGNATION.support,
];

function shuffleSoldiers(soldiers: Soldier[]): Soldier[] {
  const arr = soldiers.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

function getEnemyBaseLevelFromCompany(company: Company | null | undefined): number {
  const soldiers = company?.soldiers ?? [];
  if (soldiers.length === 0) return 1;

  const companyRef = company ?? null;
  const slots = getFormationSlots(companyRef);
  const activeCount = getActiveSlots(companyRef);
  const soldierById = new Map(soldiers.map((s) => [s.id, s]));
  let activeSoldiers = slots
    .slice(0, activeCount)
    .map((id) => (id ? soldierById.get(id) ?? null : null))
    .filter((s): s is Soldier => s != null);
  if (activeSoldiers.length === 0) activeSoldiers = soldiers;

  const levelCounts = new Map<number, number>();
  for (const s of activeSoldiers) {
    const lvl = Math.max(1, Math.floor(s.level ?? 1));
    levelCounts.set(lvl, (levelCounts.get(lvl) ?? 0) + 1);
  }

  let majorityLevel = 1;
  let majorityCount = 0;
  for (const [lvl, count] of levelCounts) {
    if (count > majorityCount) {
      majorityCount = count;
      majorityLevel = lvl;
    }
  }
  if (majorityCount > activeSoldiers.length / 2) return Math.max(1, Math.min(20, majorityLevel));

  const sum = activeSoldiers.reduce((a, s) => a + (s.level ?? 1), 0);
  return Math.max(1, Math.min(20, Math.ceil(sum / activeSoldiers.length)));
}

function getRecruitLevelFromCompany(company: Company | null | undefined): number {
  const enemyBaseLevel = getEnemyBaseLevelFromCompany(company);
  return Math.max(1, Math.min(20, enemyBaseLevel - 1));
}

function resolveRecruitLevel(company: Company | null | undefined, highestAchieved = 1): number {
  return Math.max(Math.max(1, highestAchieved), getRecruitLevelFromCompany(company));
}

function generateRecruitByRole(role: Designation, level: number): Soldier {
  if (role === SOLDIER_DESIGNATION.medic) return SoldierManager.getNewMedic(level);
  if (role === SOLDIER_DESIGNATION.support) return SoldierManager.getNewSupportMan(level);
  return SoldierManager.getNewRifleman(level);
}

function normalizeRecruitMarketPool(pool: Soldier[], recruitLevel: number): Soldier[] {
  const normalized: Soldier[] = [];
  for (const role of RECRUIT_ROLE_ORDER) {
    const target = RECRUIT_ROLE_TARGETS[role];
    const existing = pool.filter((s) => s.designation === role).slice(0, target);
    normalized.push(...existing);
    for (let i = existing.length; i < target; i++) {
      normalized.push(generateRecruitByRole(role, recruitLevel));
    }
  }
  return shuffleSoldiers(normalized);
}

export const StoreActions = (set: any, get: () => CompanyStore) => ({
  companyName: "",
  commanderName: "",
  companyUnitPatchURL: "",
  gameStep: GAME_STEPS.at_intro_0 as GameStep,
  rerollCounter: 6,

  marketAvailableTroops: [],
  recruitStaging: [],
  creditBalance: STARTING_CREDITS,
  totalMenInCompany: 0,
  totalMenLostAllTime: 0,
  memorialFallen: [],
  totalEnemiesKilledAllTime: 0,
  totalMissionsCompleted: 0,
  totalMissionsFailed: 0,
  companyLevel: 0,
  totalInventoryCapacity: 0,
  totalItemsInInventory: 0,
  inventory: [],
  companyExperience: 0,
  highestRecruitLevelAchieved: 1,
  company: {} as Company,
  marketTierLevel: 0,
  missionBoard: [],
  missionBoardSchemaVersion: MISSION_BOARD_SCHEMA_VERSION,
  missionsViewMode: "menu" as CompanyStore["missionsViewMode"],

  // Actions
  rerollSoldier: async (id: string) => {
    if ((get().rerollCounter ?? 0) <= 0) return;

    const rerollIndex = get().marketAvailableTroops.findIndex(
      (soldier) => soldier.id === id,
    );

    const soldierBeingRerolled = get().marketAvailableTroops[rerollIndex];

    if (!soldierBeingRerolled) return;

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

    const state = get();
    const staging = state.recruitStaging ?? [];
    const maxSize = getMaxCompanySize(state.companyLevel ?? 1);
    const currentCount = state.company.soldiers?.length ?? state.totalMenInCompany ?? 0;
    const slotsLeft = maxSize - currentCount;
    const stagingCost = staging.reduce((s, x) => s + getRecruitCost(x.trait_profile?.stats), 0);
    const newSoldierCost = getRecruitCost(soldierBeingRerolled.trait_profile?.stats);
    const remaining = state.creditBalance - stagingCost;
    const canAddOneMore = slotsLeft > staging.length && remaining >= newSoldierCost;

    get().useRerollCounter();

    const canRerollAfter = (get().rerollCounter ?? 0) > 0;
    await animateHTMLReplace(
      trooperCard,
      Partial.render.parsedTrooper(newSoldier, canAddOneMore, canRerollAfter),
    ).then(() => {
      DomEventManager.initEventArray(eventConfigs().troopsScreen());

      const rerollCounterDiv = document.querySelector(".reroll-counter");
      if (rerollCounterDiv) {
        rerollCounterDiv.replaceWith(
          Partial.render.parsedRerollCounter(get().rerollCounter) as HTMLElement,
        );
      }
      const rc = get().rerollCounter ?? 0;
      if (rc <= 0) {
        document.querySelectorAll(".reroll-soldier").forEach((btn) => {
          (btn as HTMLButtonElement).disabled = true;
          btn.classList.add("reroll-disabled");
        });
      }
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
  setCreditBalance: (amount: number) =>
    set({ creditBalance: amount }),
  initializeCompany: () => {
    set((state) => {
      if (
        state.company.soldiers?.length ||
        (state.company.name && state.company.commander)
      ) {
        return {};
      }

      return {
        creditBalance: STARTING_CREDITS,
        totalMenInCompany: 0,
        totalInventoryCapacity: DEFAULT_INVENTORY_CAPACITY,
        companyLevel: 1,
        companyExperience: 0,
        missionBoard: [],
        missionBoardSchemaVersion: MISSION_BOARD_SCHEMA_VERSION,
        missionsViewMode: "menu",
        company: {
          level: 1,
          experience: 0,
          name: "",
          soldiers: [],
          commander: "",
          inventory: [],
          holding_inventory: [],
          resourceProfile: COMPANY_RESOURCES_BY_LEVEL[0],
        },
      };
    });
  },

  setMarketAvailableTroops: (soldiers: Soldier[]) =>
    set({
      marketAvailableTroops: soldiers,
    }),
  filterMarketTroops: async (id: string) => {
    set((state: CompanyStore) => ({
      marketAvailableTroops: state.marketAvailableTroops?.filter(
        (s) => s.id !== id,
      ),
    }));

    const trooperCard = document.querySelector(
      `[data-troopercard='${id}']`,
    ) as HTMLElement;

    await animateHTMLRemove(trooperCard, 800);
  },
  addCredits: (creds: number) =>
    set((state: CompanyStore) => ({
      creditBalance: state.creditBalance + creds,
    })),
  subtractCredits: (creds: number) =>
    set((state: CompanyStore) => ({
      creditBalance: state.creditBalance - creds,
    })),
  setGameStep: (step: GameStep) => set({ gameStep: step }),
  setMarketTierLevel: (n: number) => set({ marketTierLevel: n }),
  setMissionsViewMode: (mode: "menu" | "normal" | "epic" | "dev") => set({ missionsViewMode: mode }),
  ensureMissionBoard: () => {
    const state = get();
    const existing = state.missionBoard ?? [];
    const schemaMismatch = (state.missionBoardSchemaVersion ?? 0) !== MISSION_BOARD_SCHEMA_VERSION;
    if (existing.length > 0) {
      const hasRare = existing.some((m) => (m.rarity ?? (m.isEpic ? "epic" : "normal")) === "rare");
      const hasLegacyTitles = existing.some((m) => /#\d+\s*$/.test(m.name ?? "") || /^Epic:\s+/i.test(m.name ?? ""));
      if (!hasRare && !hasLegacyTitles && !schemaMismatch) return;
    }
    const companyLevel = state.company?.level ?? state.companyLevel ?? 1;
    set({
      missionBoard: generateMissions(companyLevel),
      missionBoardSchemaVersion: MISSION_BOARD_SCHEMA_VERSION,
    });
  },
  refreshMissionBoard: () => {
    const state = get();
    const companyLevel = state.company?.level ?? state.companyLevel ?? 1;
    set({
      missionBoard: generateMissions(companyLevel),
      missionBoardSchemaVersion: MISSION_BOARD_SCHEMA_VERSION,
    });
  },
  setCompanyUnitPatch: (url: string) => set({ companyUnitPatchURL: url }),
  setCompanyName: (n: string) =>
    set((state: CompanyStore) => ({
      companyName: n,
      company: {
        ...state.company,
        name: n,
      },
    })),
  setHighestRecruitLevelAchieved: (level: number) =>
    set((state: CompanyStore) => ({
      highestRecruitLevelAchieved: Math.max(state.highestRecruitLevelAchieved ?? 1, Math.max(1, Math.floor(level || 1))),
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
  addToRecruitStaging: (soldier: Soldier) =>
    set((state: CompanyStore) => {
      const staging = state.recruitStaging ?? [];
      const maxSize = getMaxCompanySize(state.companyLevel ?? 1);
      const currentCount = state.company.soldiers?.length ?? state.totalMenInCompany ?? 0;
      const slotsLeft = maxSize - currentCount;
      if (staging.length >= slotsLeft) return {};
      const stagingCost = staging.reduce((s, x) => s + getRecruitCost(x.trait_profile?.stats), 0);
      const newCost = stagingCost + getRecruitCost(soldier.trait_profile?.stats);
      if (state.creditBalance < newCost) return {};
      return {
        recruitStaging: [...staging, soldier],
        marketAvailableTroops: state.marketAvailableTroops.filter((s) => s.id !== soldier.id),
      };
    }),
  /** Returns { success, reason? }. Only adds when success. */
  tryAddToRecruitStaging: (soldier: Soldier): { success: boolean; reason?: "capacity" | "afford" } => {
    const state = get();
    const staging = state.recruitStaging ?? [];
    const maxSize = getMaxCompanySize(state.companyLevel ?? 1);
    const currentCount = state.company.soldiers?.length ?? state.totalMenInCompany ?? 0;
    const slotsLeft = maxSize - currentCount;
    if (staging.length >= slotsLeft) return { success: false, reason: "capacity" };
    const stagingCost = staging.reduce((s, x) => s + getRecruitCost(x.trait_profile?.stats), 0);
    const newCost = stagingCost + getRecruitCost(soldier.trait_profile?.stats);
    if (state.creditBalance < newCost) return { success: false, reason: "afford" };
    get().addToRecruitStaging(soldier);
    return { success: true };
  },
  removeFromRecruitStaging: (soldierId: string) =>
    set((state: CompanyStore) => {
      const staging = state.recruitStaging ?? [];
      const soldier = staging.find((s) => s.id === soldierId);
      if (!soldier) return {};
      return {
        recruitStaging: staging.filter((s) => s.id !== soldierId),
        marketAvailableTroops: [...state.marketAvailableTroops, soldier],
      };
    }),
  confirmRecruitment: () =>
    set((state: CompanyStore) => {
      const staging = state.recruitStaging ?? [];
      if (staging.length === 0) return {};
      const maxSize = getMaxCompanySize(state.companyLevel ?? 1);
      const currentCount = state.company.soldiers?.length ?? state.totalMenInCompany ?? 0;
      const toAdd = Math.min(staging.length, maxSize - currentCount);
      if (toAdd <= 0) return {};
      const added = staging.slice(0, toAdd);
      const totalCost = added.reduce((s, x) => s + getRecruitCost(x.trait_profile?.stats), 0);
      if (state.creditBalance < totalCost) return {};
      const newSoldiers = [...state.company.soldiers, ...added];
      const newMarketIds = new Set(added.map((s) => s.id));
      const returned = staging.filter((s) => !newMarketIds.has(s.id));
      const currentSlots = getFormationSlots(state.company);
      const idsToPlace = [...added.map((s) => s.id)];
      const newFormationSlots = currentSlots.map((slot) => (slot != null ? slot : idsToPlace.shift() ?? null));
      const nextCompany = {
        ...state.company,
        soldiers: newSoldiers,
        formationSlots: newFormationSlots,
      };
      const resolvedRecruitLevel = resolveRecruitLevel(nextCompany, state.highestRecruitLevelAchieved);
      const replacements = added.map((s) => generateRecruitByRole(s.designation, resolvedRecruitLevel));
      const nextMarket = normalizeRecruitMarketPool(
        [...state.marketAvailableTroops, ...returned, ...replacements],
        resolvedRecruitLevel,
      );
      return {
        creditBalance: state.creditBalance - totalCost,
        recruitStaging: returned,
        totalMenInCompany: newSoldiers.length,
        company: nextCompany,
        marketAvailableTroops: nextMarket,
        highestRecruitLevelAchieved: resolvedRecruitLevel,
      };
    }),
  onCompanyLevelUp: () => {
    const state = get();
    const recruitLevel = resolveRecruitLevel(state.company, state.highestRecruitLevelAchieved);
    const nextMarket = normalizeRecruitMarketPool(state.marketAvailableTroops ?? [], recruitLevel);
    set((s: CompanyStore) => ({
      rerollCounter: (s.rerollCounter ?? 0) + 6,
      marketAvailableTroops: nextMarket,
      highestRecruitLevelAchieved: recruitLevel,
    }));
  },
  addInitialTroopsIfEmpty: () =>
    set((state: CompanyStore) => {
      const soldiers = state.company?.soldiers ?? [];
      if (soldiers.length > 0) return {};
      const modelTrait = SoldierManager.getSoldierTraitProfileByName("model_soldier");
      const initial = [
        SoldierManager.getNewRifleman(1, modelTrait),
        SoldierManager.getNewRifleman(1, modelTrait),
        SoldierManager.getNewSupportMan(1, modelTrait),
        SoldierManager.getNewMedic(1, modelTrait),
      ];
      /* Ensure company has required fields (level, resourceProfile) for new-game flow */
      const companyBase = {
        ...state.company,
        level: state.company?.level ?? 1,
        experience: state.company?.experience ?? 0,
        inventory: state.company?.inventory ?? [],
        holding_inventory: state.company?.holding_inventory ?? [],
        resourceProfile: state.company?.resourceProfile ?? COMPANY_RESOURCES_BY_LEVEL[0],
      };
      const companyWithSoldiers = { ...companyBase, soldiers: initial };
      const formationSlots = getFormationSlots(companyWithSoldiers);
      return {
        company: {
          ...companyBase,
          soldiers: initial,
          formationSlots,
        },
        totalMenInCompany: initial.length,
        companyLevel: companyBase.level,
        companyExperience: companyBase.experience ?? 0,
        highestRecruitLevelAchieved: 1,
      };
    }),
  /** Add starter armory items when inventory is empty (new game). */
  addInitialArmoryIfEmpty: () =>
    set((state: CompanyStore) => {
      const inv = state.company?.inventory ?? [];
      if (inv.length > 0) return {};
      const starter = getStarterArmoryItems();
      return {
        company: {
          ...state.company,
          inventory: [...starter],
        },
      };
    }),
  releaseSoldier: (soldierId: string) =>
    set((state: CompanyStore) => {
      const soldiers = state.company?.soldiers ?? [];
      const filtered = soldiers.filter((s) => s.id !== soldierId);
      if (filtered.length === soldiers.length) return {};
      const slots = getFormationSlots(state.company);
      const newSlots = slots.map((id) => (id === soldierId ? null : id));
      return {
        company: { ...state.company, soldiers: filtered, formationSlots: newSlots },
        totalMenInCompany: filtered.length,
      };
    }),
  destroyCompanyItem: (index: number) =>
    set((state: CompanyStore) => {
      const inventory = state.company?.inventory ?? [];
      if (index < 0 || index >= inventory.length) return {};
      const newInv = inventory.slice();
      newInv.splice(index, 1);
      return {
        company: { ...state.company, inventory: newInv },
      };
    }),

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

  /** Add items to company inventory. Add to existing stacks of same id first, then new. Respects per-category caps. Returns { success, reason? }. */
  addItemsToCompanyInventory: (
    items: import("../constants/items/types.ts").Item[],
    totalCost: number,
  ): { success: boolean; reason?: "capacity" | "credits" } => {
    const state = get();
    const level = state.company?.level ?? state.companyLevel ?? 1;
    const caps = {
      weapon: getWeaponArmorySlots(level),
      armor: getArmorArmorySlots(level),
      equipment: getEquipmentArmorySlots(level),
    };
    if (state.creditBalance < totalCost) return { success: false, reason: "credits" };
    let inv = [...(state.company?.inventory ?? [])];
    for (const it of items) {
      const item = { ...it };
      const canStack = canItemStackInArmory(item);
      const existingIdx = canStack ? inv.findIndex((x) => x.id === item.id && (x.uses != null || x.quantity != null)) : -1;
      if (existingIdx >= 0) {
        const ex = inv[existingIdx];
        const exUses = ex.uses ?? ex.quantity ?? 1;
        const addUses = item.uses ?? item.quantity ?? 1;
        inv = inv.slice();
        inv[existingIdx] = { ...ex, uses: exUses + addUses };
      } else {
        const counts = countArmoryByCategory(inv);
        const cat = getItemArmoryCategory(item);
        if (counts[cat] >= caps[cat]) return { success: false, reason: "capacity" };
        inv = [...inv, item];
      }
    }
    set((s: CompanyStore) => ({
      creditBalance: s.creditBalance - totalCost,
      company: { ...s.company, inventory: inv },
    }));
    return { success: true };
  },
  consumeSoldierMedical: (soldierId: string, inventoryIndex: number) => {
    let consumed = false;
    set((state: CompanyStore) => {
      const company = state.company;
      const soldiers = company?.soldiers ?? [];
      const idx = soldiers.findIndex((s) => s.id === soldierId);
      if (idx < 0) return {};
      const soldier = soldiers[idx];
      const inv = soldier.inventory ?? [];
      if (inventoryIndex < 0 || inventoryIndex >= inv.length) return {};
      const item = inv[inventoryIndex];
      if (!item || (item.type as string) !== "medical") return {};
      const uses = item.uses ?? item.quantity ?? 1;
      const newInv = inv.slice();
      if (uses > 1) {
        newInv[inventoryIndex] = { ...item, uses: uses - 1 };
      } else {
        newInv.splice(inventoryIndex, 1);
      }
      const newSoldiers = soldiers.map((s) =>
        s.id === soldierId ? { ...s, inventory: newInv } : s,
      );
      consumed = true;
      return {
        company: { ...company, soldiers: newSoldiers },
      };
    });
    return consumed;
  },
  consumeSoldierThrowable: (soldierId: string, inventoryIndex: number) => {
    let consumed = false;
    set((state: CompanyStore) => {
      const company = state.company;
      const soldiers = company?.soldiers ?? [];
      const idx = soldiers.findIndex((s) => s.id === soldierId);
      if (idx < 0) return {};
      const soldier = soldiers[idx];
      const inv = soldier.inventory ?? [];
      if (inventoryIndex < 0 || inventoryIndex >= inv.length) return {};
      const item = inv[inventoryIndex];
      if (!item || (item.type as string) !== "throwable") return {};
      const uses = item.uses ?? item.quantity ?? 1;
      const newInv = inv.slice();
      if (uses > 1) {
        newInv[inventoryIndex] = { ...item, uses: uses - 1 };
      } else {
        newInv.splice(inventoryIndex, 1);
      }
      const newSoldiers = soldiers.map((s) =>
        s.id === soldierId ? { ...s, inventory: newInv } : s,
      );
      consumed = true;
      return {
        company: { ...company, soldiers: newSoldiers },
      };
    });
    return consumed;
  },

  /** Equip item to soldier slot. If from armory, remove from armory. If slot occupied, return old to armory. Respects per-category caps. */
  equipItemToSoldier: (
    soldierId: string,
    slotType: "weapon" | "armor" | "equipment",
    item: import("../constants/items/types.ts").Item,
    options?: { fromArmoryIndex?: number; equipmentIndex?: number },
  ) => {
    const state = get();
    const level = state.company?.level ?? state.companyLevel ?? 1;
    const caps = {
      weapon: getWeaponArmorySlots(level),
      armor: getArmorArmorySlots(level),
      equipment: getEquipmentArmorySlots(level),
    };
    const armory = state.company?.inventory ?? [];
    const soldiers = state.company?.soldiers ?? [];
    const soldierIdx = soldiers.findIndex((s) => s.id === soldierId);
    if (soldierIdx < 0) return { success: false, reason: "soldier not found" };

    const soldier = soldiers[soldierIdx];
    let toAddToArmory: import("../constants/items/types.ts").Item[] = [];
    let newArmory = armory.slice();

    if (slotType === "weapon") {
      if (!canEquipItemLevel(item, soldier)) {
        return { success: false, reason: "soldier level too low for item" };
      }
      if (
        (item.type === "ballistic_weapon" || item.type === "melee_weapon") &&
        !weaponWieldOk(item, soldier)
      ) {
        return { success: false, reason: "weapon restricted to role" };
      }
      if (soldier.weapon) {
        toAddToArmory.push({ ...soldier.weapon, target: (soldier.weapon as any).target ?? TARGET_TYPES.none } as any);
      }
    } else if (slotType === "armor") {
      if (!canEquipItemLevel(item, soldier)) {
        return { success: false, reason: "soldier level too low for item" };
      }
      if (soldier.armor) {
        toAddToArmory.push({ ...soldier.armor, target: (soldier.armor as any).target ?? TARGET_TYPES.none } as any);
      }
    } else {
      const inv = soldier.inventory ?? [];
      const eqIdx = options?.equipmentIndex ?? inv.length;
      if (eqIdx >= inv.length && inv.length >= MAX_EQUIPMENT_SLOTS) {
        return { success: false, reason: "equipment slots full" };
      }
      if (!canEquipItemLevel(item, soldier)) {
        return { success: false, reason: "soldier level too low for item" };
      }
      if (eqIdx < inv.length && inv[eqIdx]) {
        toAddToArmory.push({ ...inv[eqIdx], target: (inv[eqIdx] as any).target ?? TARGET_TYPES.none } as any);
      }
    }

    if (options?.fromArmoryIndex != null) {
      if (options.fromArmoryIndex < 0 || options.fromArmoryIndex >= armory.length) {
        return { success: false, reason: "invalid armory index" };
      }
      newArmory = armory.slice();
      newArmory.splice(options.fromArmoryIndex, 1);
    }

    const armoryAfter = [...newArmory, ...toAddToArmory];
    const countsAfter = countArmoryByCategory(armoryAfter);
    if (countsAfter.weapon > caps.weapon || countsAfter.armor > caps.armor || countsAfter.equipment > caps.equipment) {
      return { success: false, reason: "armory full" };
    }

    set((s: CompanyStore) => {
      const newSoldiers = s.company?.soldiers?.map((sol) => {
        if (sol.id !== soldierId) return sol;
        const inv = sol.inventory ?? [];
        if (slotType === "weapon") {
          return { ...sol, weapon: { ...item } };
        }
        if (slotType === "armor") {
          return { ...sol, armor: { ...item } };
        }
        const eqIdx = options?.equipmentIndex ?? inv.length;
        const newInv = inv.slice();
        if (eqIdx < newInv.length) {
          newInv[eqIdx] = { ...item };
        } else if (eqIdx < MAX_EQUIPMENT_SLOTS) {
          while (newInv.length <= eqIdx) newInv.push(undefined as any);
          newInv[eqIdx] = { ...item };
        } else if (newInv.length < MAX_EQUIPMENT_SLOTS) {
          newInv.push({ ...item });
        }
        return { ...sol, inventory: newInv.slice(0, MAX_EQUIPMENT_SLOTS) };
      }) ?? [];
      return {
        company: {
          ...s.company,
          soldiers: newSoldiers,
          inventory: armoryAfter,
        },
      };
    });
    return { success: true };
  },

  /** Unequip item from soldier to armory. Returns success. Respects per-category caps. */
  unequipItemToArmory: (
    soldierId: string,
    slotType: "weapon" | "armor" | "equipment",
    equipmentIndex?: number,
  ) => {
    const state = get();
    const level = state.company?.level ?? state.companyLevel ?? 1;
    const caps = {
      weapon: getWeaponArmorySlots(level),
      armor: getArmorArmorySlots(level),
      equipment: getEquipmentArmorySlots(level),
    };
    const armory = state.company?.inventory ?? [];
    const counts = countArmoryByCategory(armory);
    const cat = slotType;
    if (counts[cat] >= caps[cat]) return { success: false, reason: "armory full" };

    let itemToAdd: import("../constants/items/types.ts").Item | null = null;

    set((s: CompanyStore) => {
      const soldiers = s.company?.soldiers ?? [];
      const soldier = soldiers.find((sol) => sol.id === soldierId);
      if (!soldier) return {};

      if (slotType === "weapon" && soldier.weapon) {
        itemToAdd = { ...soldier.weapon, target: (soldier.weapon as any).target ?? TARGET_TYPES.none } as any;
      } else if (slotType === "armor" && soldier.armor) {
        itemToAdd = { ...soldier.armor, target: (soldier.armor as any).target ?? TARGET_TYPES.none } as any;
      } else if (slotType === "equipment" && equipmentIndex != null) {
        const inv = soldier.inventory ?? [];
        if (equipmentIndex >= 0 && equipmentIndex < inv.length) {
          const it = inv[equipmentIndex];
          itemToAdd = { ...it, target: (it as any).target ?? TARGET_TYPES.none } as any;
        }
      }
      if (!itemToAdd) return {};

      const newSoldiers = soldiers.map((sol) => {
        if (sol.id !== soldierId) return sol;
        if (slotType === "weapon") return { ...sol, weapon: undefined };
        if (slotType === "armor") return { ...sol, armor: undefined };
        const inv = (sol.inventory ?? []).slice();
        if (equipmentIndex != null && equipmentIndex >= 0 && equipmentIndex < inv.length) {
          inv[equipmentIndex] = undefined as any; /* Leave hole, don't shift slot 4 → 3 */
        }
        return { ...sol, inventory: inv };
      });

      const armory = s.company?.inventory ?? [];
      return {
        company: {
          ...s.company,
          soldiers: newSoldiers,
          inventory: [...armory, itemToAdd!],
        },
      };
    });
    return { success: !!itemToAdd };
  },

  /** Move item between two soldier slots (organize mode). Supports swap. */
  moveItemBetweenSlots: (op: {
    sourceSoldierId: string;
    sourceSlotType: "weapon" | "armor" | "equipment";
    sourceEqIndex?: number;
    destSoldierId: string;
    destSlotType: "weapon" | "armor" | "equipment";
    destEqIndex?: number;
  }) => {
    const state = get();
    const soldiers = state.company?.soldiers ?? [];
    const src = soldiers.find((s) => s.id === op.sourceSoldierId);
    const dest = soldiers.find((s) => s.id === op.destSoldierId);
    if (!src || !dest) return { success: false, reason: "soldier not found" };

    const getItem = (s: typeof src, slot: string, eqIdx?: number) => {
      if (slot === "weapon") return s.weapon;
      if (slot === "armor") return s.armor;
      const inv = s.inventory ?? [];
      if (eqIdx != null && eqIdx < inv.length) return inv[eqIdx];
      return undefined;
    };

    const srcItem = getItem(src, op.sourceSlotType, op.sourceEqIndex);
    if (!srcItem) return { success: false, reason: "no item in source" };

    if (op.destSlotType === "weapon") {
      if (
        (srcItem.type === "ballistic_weapon" || srcItem.type === "melee_weapon") &&
        !weaponWieldOk(srcItem as import("../constants/items/types.ts").Item, dest)
      ) {
        return { success: false, reason: "weapon restricted to role" };
      }
    }
    if (!canEquipItemLevel(srcItem as import("../constants/items/types.ts").Item, dest)) {
      return { success: false, reason: "soldier level too low for item" };
    }

    const destInv = dest.inventory ?? [];
    const destItem = getItem(dest, op.destSlotType, op.destEqIndex);
    const isSameSoldierReorder =
      op.sourceSoldierId === op.destSoldierId &&
      op.sourceSlotType === "equipment" &&
      op.destSlotType === "equipment";
    const destEquipCount = destInv.filter(Boolean).length;
    if (
      op.destSlotType === "equipment" &&
      !destItem &&
      destEquipCount >= MAX_EQUIPMENT_SLOTS &&
      !isSameSoldierReorder
    ) {
      return { success: false, reason: "equipment slots full" };
    }

    set((s: CompanyStore) => {
      const ss = s.company?.soldiers ?? [];
      const destItem = getItem(
        ss.find((x) => x.id === op.destSoldierId)!,
        op.destSlotType,
        op.destEqIndex,
      );

      const ensureTarget = (i: any) => i ? { ...i, target: i.target ?? TARGET_TYPES.none } : undefined;
      const destWithTarget = destItem ? ensureTarget(destItem) : undefined;
      const newSoldiers = ss.map((sol) => {
        const isSameSoldier = op.sourceSoldierId === op.destSoldierId;
        if (isSameSoldier && op.sourceSlotType === "equipment" && op.destSlotType === "equipment" && op.sourceEqIndex != null && op.destEqIndex != null && sol.id === op.sourceSoldierId) {
          const inv = (sol.inventory ?? []).slice();
          const srcIdx = op.sourceEqIndex;
          const destIdx = op.destEqIndex;
          while (inv.length <= Math.max(srcIdx, destIdx)) inv.push(undefined as any);
          [inv[srcIdx], inv[destIdx]] = [inv[destIdx], inv[srcIdx]];
          return { ...sol, inventory: inv.slice(0, MAX_EQUIPMENT_SLOTS) };
        }
        if (sol.id === op.sourceSoldierId) {
          if (op.sourceSlotType === "weapon") {
            return { ...sol, weapon: destWithTarget };
          }
          if (op.sourceSlotType === "armor") {
            return { ...sol, armor: destWithTarget };
          }
          const inv = (sol.inventory ?? []).slice();
          if (op.sourceEqIndex != null && op.sourceEqIndex < inv.length) {
            if (destWithTarget) inv[op.sourceEqIndex] = destWithTarget as any;
            else inv[op.sourceEqIndex] = undefined as any; /* Leave hole, don't shift slot 4 → 3 */
          }
          return { ...sol, inventory: inv.slice(0, MAX_EQUIPMENT_SLOTS) };
        }
        if (sol.id === op.destSoldierId) {
          const srcWithTarget = { ...srcItem, target: (srcItem as any).target ?? TARGET_TYPES.none };
          if (op.destSlotType === "weapon") {
            return { ...sol, weapon: srcWithTarget };
          }
          if (op.destSlotType === "armor") {
            return { ...sol, armor: srcWithTarget };
          }
          const inv = (sol.inventory ?? []).slice();
          const idx = op.destEqIndex ?? inv.length;
          if (idx < inv.length) {
            inv[idx] = srcWithTarget as any; /* Replace slot (swap or fill empty), never splice/insert */
          } else if (op.destEqIndex != null && op.destEqIndex >= inv.length && op.destEqIndex < MAX_EQUIPMENT_SLOTS) {
            /* Place in the selected slot index even when inv is empty or shorter */
            while (inv.length <= op.destEqIndex) inv.push(undefined as any);
            inv[op.destEqIndex] = srcWithTarget as any;
          } else if (inv.length < MAX_EQUIPMENT_SLOTS) {
            inv.push(srcWithTarget as any);
          }
          return { ...sol, inventory: inv.slice(0, MAX_EQUIPMENT_SLOTS) };
        }
        return sol;
      });

      return { company: { ...s.company, soldiers: newSoldiers } };
    });
    return { success: true };
  },

  /** Swap two soldiers by slot index. Used for Formation/Ready Room to move between active/reserve. */
  swapSoldierPositions: (slotA: number, slotB: number) => {
    set((s: CompanyStore) => {
      const slots = getFormationSlots(s.company);
      if (slotA < 0 || slotA >= slots.length || slotB < 0 || slotB >= slots.length) return {};
      const copy = slots.slice();
      [copy[slotA], copy[slotB]] = [copy[slotB], copy[slotA]];
      return { company: { ...s.company, formationSlots: copy } };
    });
  },

  /** Move a soldier from one slot to an empty slot. Target must be empty. */
  moveSoldierToPosition: (fromSlot: number, toSlot: number) => {
    set((s: CompanyStore) => {
      const slots = getFormationSlots(s.company);
      if (fromSlot < 0 || fromSlot >= slots.length || toSlot < 0 || toSlot >= slots.length) return {};
      if (slots[toSlot] != null) return {}; // target must be empty, use swap for filled
      const copy = slots.slice();
      copy[toSlot] = copy[fromSlot];
      copy[fromSlot] = null;
      return { company: { ...s.company, formationSlots: copy } };
    });
  },

  /** Move soldiers with 0 energy from active slots to reserve; fill active with soldiers who have energy. */
  moveZeroEnergySoldiersToReserve: () => {
    set((s: CompanyStore) => {
      const company = s.company;
      const slots = getFormationSlots(company);
      const activeCount = getActiveSlots(company);
      const reserveCount = getReserveSlots(company);
      const total = activeCount + reserveCount;
      if (slots.length !== total) return {};
      const soldierById = new Map((company?.soldiers ?? []).map((s) => [s.id, s]));
      const eligible: (string | null)[] = [];
      const ineligible: (string | null)[] = [];
      for (const id of slots) {
        if (id == null) continue;
        const soldier = soldierById.get(id);
        const energy = Math.max(0, soldier?.energy ?? ENERGY_MAX);
        if (energy > 0) eligible.push(id);
        else ineligible.push(id);
      }
      const newSlots: (string | null)[] = [];
      let ei = 0;
      let ii = 0;
      for (let i = 0; i < activeCount; i++) {
        newSlots[i] = ei < eligible.length ? eligible[ei++] : null;
      }
      for (let i = 0; i < reserveCount; i++) {
        newSlots[activeCount + i] = ii < ineligible.length ? ineligible[ii++] : ei < eligible.length ? eligible[ei++] : null;
      }
      return { company: { ...company, formationSlots: newSlots } };
    });
  },

  /** Grant mission rewards: credits on victory, XP/level-up, items (armory or holding if full). Respects per-category caps. Updates mission stats. Applies ~10% XP penalty when soldiers died. Returns reward items (guaranteed) and loot items (random drops) for summary display. Uses missionLevel (same derivation as enemy soldiers) for item tiers when provided. */
  grantMissionRewards: (mission: Mission | null, victory: boolean, kiaCount?: number, missionLevel?: number): { rewardItems: Item[]; lootItems: Item[] } => {
    set((s: CompanyStore) => ({
      totalMissionsCompleted: (s.totalMissionsCompleted ?? 0) + (victory ? 1 : 0),
      totalMissionsFailed: (s.totalMissionsFailed ?? 0) + (victory ? 0 : 1),
    }));
    if (!victory || !mission) return { rewardItems: [], lootItems: [] };
    const credits = mission.creditReward ?? 0;
    set((s: CompanyStore) => ({ creditBalance: s.creditBalance + credits }));

    /* Add XP and level up. Apply ~10% penalty if soldiers died. */
    const difficulty = typeof mission.difficulty === "number" && !Number.isNaN(mission.difficulty) ? Math.max(1, mission.difficulty) : 1;
    let xpGain = mission.xpReward ?? 20 * difficulty;
    if ((kiaCount ?? 0) > 0) xpGain = Math.max(1, Math.floor(xpGain * 0.9));
    const stateAfterCredits = get();
    const oldLevel = stateAfterCredits.company?.level ?? stateAfterCredits.companyLevel ?? 1;
    let exp = (stateAfterCredits.company?.experience ?? stateAfterCredits.companyExperience ?? 0) + xpGain;
    let lvl = oldLevel;
    const maxLevel = 20;
    while (lvl < maxLevel && exp >= getXpRequiredForLevel(lvl + 1)) {
      lvl += 1;
    }
    const profile = COMPANY_RESOURCES_BY_LEVEL[Math.min(lvl, 20) - 1] ?? COMPANY_RESOURCES_BY_LEVEL[0];
    set((s: CompanyStore) => ({
      company: {
        ...s.company,
        level: lvl,
        experience: exp,
        resourceProfile: profile,
      },
      companyLevel: lvl,
      companyExperience: exp,
    }));
    if (lvl > oldLevel) {
      for (let i = oldLevel + 1; i <= lvl; i++) {
        get().onCompanyLevelUp();
      }
    }

    const rewardIds = mission.rewardItems ?? [];
    const level = lvl; // Company level for armory caps
    const itemLevel = missionLevel != null ? Math.max(1, Math.min(20, missionLevel)) : level; // Mission level (same derivation as enemy soldiers) for item tiers
    const caps = {
      weapon: getWeaponArmorySlots(level),
      armor: getArmorArmorySlots(level),
      equipment: getEquipmentArmorySlots(level),
    };
    let inv = [...(get().company?.inventory ?? [])];
    let holding = [...(get().company?.holding_inventory ?? [])];
    const rewardItems: Item[] = [];
    const lootItems: Item[] = [];

    const addItemToInventory = (copy: Item, isLoot: boolean) => {
      if (isLoot) lootItems.push(copy);
      else rewardItems.push(copy);
      const canStack = canItemStackInArmory(copy);
      const existingIdx = canStack ? inv.findIndex((x) => x.id === copy.id && (x.uses != null || x.quantity != null)) : -1;
      if (existingIdx >= 0) {
        const ex = inv[existingIdx];
        const exUses = ex.uses ?? ex.quantity ?? 1;
        const addUses = copy.uses ?? copy.quantity ?? 1;
        inv = inv.slice();
        inv[existingIdx] = { ...ex, uses: exUses + addUses };
      } else {
        const counts = countArmoryByCategory(inv);
        const cat = getItemArmoryCategory(copy);
        if (counts[cat] < caps[cat]) {
          inv = [...inv, copy];
        } else {
          holding = [...holding, copy];
        }
      }
    };

    for (const id of rewardIds) {
      const item = getRewardItemById(id);
      if (!item) continue;
      const copy = { ...item, level: itemLevel as import("../constants/items/types.ts").GearLevel };
      addItemToInventory(copy, false);
    }

    /* Loot rolls: each rolled independently on any successful mission */
    const tier = Math.max(1, Math.min(20, itemLevel)) as import("../constants/items/types.ts").GearLevel;
    if (Math.random() < LOOT_EPIC_CHANCE) {
      const isWeapon = Math.random() < 0.5;
      const epicArmorIds = getEpicArmorBaseIdsForLevel(itemLevel);
      const baseId = isWeapon
        ? pickRandomFrom(EPIC_WEAPON_BASE_IDS)
        : pickRandomFrom(epicArmorIds);
      if (baseId) {
        const drop = isWeapon
          ? createWeaponByBaseId(baseId, tier)
          : createArmorByBaseId(baseId, tier);
        if (drop) addItemToInventory(drop, true);
      }
    }
    if (Math.random() < LOOT_RARE_CHANCE) {
      const isWeapon = Math.random() < 0.5;
      const rareArmorIds = getRareArmorBaseIdsForLevel(itemLevel);
      const baseId = isWeapon
        ? pickRandomFrom(RARE_WEAPON_BASE_IDS)
        : pickRandomFrom(rareArmorIds);
      if (baseId) {
        const drop = isWeapon
          ? createWeaponByBaseId(baseId, tier)
          : createArmorByBaseId(baseId, tier);
        if (drop) addItemToInventory(drop, true);
      }
    }
    if (Math.random() < LOOT_COMMON_SUPPLY_CHANCE) {
      const supply = pickRandomCommonSupply();
      if (supply) addItemToInventory({ ...supply, level: itemLevel as import("../constants/items/types.ts").GearLevel }, true);
    }

    set((s: CompanyStore) => ({
      company: {
        ...s.company,
        inventory: inv,
        holding_inventory: holding,
      },
    }));

    // Replace only the completed mission with a fresh one; keep all others unchanged.
    set((s: CompanyStore) => {
      if (!mission) return {};
      const board = s.missionBoard ?? [];
      const idx = board.findIndex((m) => m.id === mission.id);
      if (idx < 0) return {};
      const replacement = pickReplacementMission(mission, lvl, board);
      if (!replacement) return {};
      const next = board.slice();
      next[idx] = replacement;
      return {
        missionBoard: next,
        missionBoardSchemaVersion: MISSION_BOARD_SCHEMA_VERSION,
      };
    });

    return { rewardItems, lootItems };
  },

  /** Sync stored soldier.level with level derived from experience. Fixes drift from bugs/old saves. Sanitizes float XP (e.g. 20.599999994 → 20.6). */
  syncSoldierLevelsFromExperience: () => {
    set((state: CompanyStore) => {
      const soldiers = state.company?.soldiers ?? [];
      const newSoldiers = soldiers.map((s) => {
        const rawExp = s.experience ?? 0;
        const exp = Math.round(rawExp * 10) / 10;
        let base = exp !== rawExp ? { ...s, experience: exp } : s;
        const correctLvl = getLevelFromExperience(exp);
        const storedLvl = base.level ?? 1;
        if (correctLvl === storedLvl) return base;
        let soldier: Soldier = { ...base, level: correctLvl };
        if (correctLvl > storedLvl) {
          for (let i = storedLvl + 1; i <= correctLvl; i++) {
            SoldierManager.levelUpSoldier(soldier, i);
          }
          SoldierManager.refreshCombatProfile(soldier);
        }
        return soldier;
      });
      return { company: { ...state.company, soldiers: newSoldiers } };
    });
  },

  /** Grant soldier XP from combat: base (survive + victory/defeat), damage dealt, damage taken, kills, ability use. Levels up when thresholds crossed. */
  grantSoldierCombatXP: (
    survivorIds: string[],
    damageBySoldier: Map<string, number>,
    damageTakenBySoldier: Map<string, number>,
    killsBySoldier: Map<string, number>,
    abilitiesUsedBySoldier: Map<string, number>,
    victory: boolean,
  ) => {
    const baseXp = victory ? SOLDIER_XP_BASE_SURVIVE_VICTORY : SOLDIER_XP_BASE_SURVIVE_DEFEAT;
    let totalKillsThisMission = 0;
    killsBySoldier.forEach((kills) => {
      totalKillsThisMission += Math.max(0, Math.floor(kills || 0));
    });
    set((state: CompanyStore) => {
      const soldiers = state.company?.soldiers ?? [];
      const newSoldiers = soldiers.map((s) => {
        if (!survivorIds.includes(s.id)) return s;
        const dmg = damageBySoldier.get(s.id) ?? 0;
        const dmgTaken = damageTakenBySoldier.get(s.id) ?? 0;
        const kills = killsBySoldier.get(s.id) ?? 0;
        const abilitiesUsed = abilitiesUsedBySoldier.get(s.id) ?? 0;
        const xpGain = baseXp + dmg * SOLDIER_XP_PER_DAMAGE + dmgTaken * SOLDIER_XP_PER_DAMAGE_TAKEN + kills * SOLDIER_XP_PER_KILL + abilitiesUsed * SOLDIER_XP_PER_ABILITY_USE;
        let exp = Math.round(((s.experience ?? 0) + xpGain) * 10) / 10;
        let lvl = s.level ?? 1;
        const maxLevel = MAX_SOLDIER_LEVEL;
        while (lvl < maxLevel && exp >= getSoldierXpRequiredForLevel(lvl + 1)) {
          lvl += 1;
        }
        const oldLevel = s.level ?? 1;
        let soldier: Soldier = { ...s, experience: exp, level: lvl };
        if (lvl > oldLevel) {
          for (let i = oldLevel + 1; i <= lvl; i++) {
            SoldierManager.levelUpSoldier(soldier, i);
          }
          SoldierManager.refreshCombatProfile(soldier);
        }
        return soldier;
      });
      return {
        company: { ...state.company, soldiers: newSoldiers },
        totalEnemiesKilledAllTime: (state.totalEnemiesKilledAllTime ?? 0) + totalKillsThisMission,
      };
    });
  },

  /** Deduct 50 energy from each participant when quitting a mission (min 0). */
  deductQuitMissionEnergy: (participantIds: string[]) => {
    if (participantIds.length === 0) return;
    set((state: CompanyStore) => {
      const soldiers = state.company?.soldiers ?? [];
      const participantSet = new Set(participantIds);
      const newSoldiers = soldiers.map((s) => {
        if (!participantSet.has(s.id)) return s;
        const current = Math.max(0, Math.min(ENERGY_MAX, s.energy ?? ENERGY_MAX));
        return { ...s, energy: Math.max(0, current - ENERGY_COST_QUIT) };
      });
      return { company: { ...state.company, soldiers: newSoldiers } };
    });
  },

  /** Deduct energy from mission participants (survivors); recover energy for soldiers who rested. */
  deductMissionEnergy: (
    survivorIds: string[],
    participantCount: number,
    hasCasualty: boolean,
    failed: boolean,
    lowHealthIds: string[] = [],
  ) => {
    set((state: CompanyStore) => {
      const soldiers = state.company?.soldiers ?? [];
      const n = survivorIds.length;
      if (n === 0) return state;
      const totalCost =
        participantCount * ENERGY_COST_BASE +
        (hasCasualty ? ENERGY_COST_CASUALTY : 0) +
        (failed ? ENERGY_COST_FAIL : 0);
      const baseDeduction = Math.floor(totalCost / n);
      const remainder = totalCost - baseDeduction * n;
      const participantSet = new Set(survivorIds);
      const lowHealthSet = new Set(lowHealthIds);
      const newSoldiers = soldiers.map((s) => {
        const current = Math.max(0, Math.min(ENERGY_MAX, s.energy ?? ENERGY_MAX));
        if (participantSet.has(s.id)) {
          const extra = survivorIds.indexOf(s.id) === 0 ? remainder : 0;
          const randomizedExtra = 5 + Math.floor(Math.random() * 4); // 5-8
          const lowHealthPenalty = lowHealthSet.has(s.id) ? 4 : 0;
          const deduct = baseDeduction + extra + randomizedExtra + lowHealthPenalty;
          return { ...s, energy: Math.max(0, current - deduct) };
        }
        return { ...s, energy: Math.min(ENERGY_MAX, current + ENERGY_RECOVERY_REST) };
      });
      return { company: { ...state.company, soldiers: newSoldiers } };
    });
  },

  /** Run one R&R round (+up to 30 energy each selected soldier, prorated cost). */
  runRestRound: (soldierIds: string[]) => {
    const ids = Array.from(new Set(soldierIds.filter(Boolean)));
    if (ids.length === 0) {
      return { success: false, totalCost: 0, totalRecovered: 0, recoveredById: {}, reason: "no_selection" as const };
    }
    const state = get();
    const soldiers = state.company?.soldiers ?? [];
    const byId = new Map(soldiers.map((s) => [s.id, s]));
    const recoverById: Record<string, number> = {};
    let totalRecovered = 0;
    for (const id of ids) {
      const s = byId.get(id);
      if (!s) continue;
      const cur = Math.max(0, Math.min(ENERGY_MAX, s.energy ?? ENERGY_MAX));
      const recover = Math.max(0, Math.min(30, ENERGY_MAX - cur));
      if (recover <= 0) continue;
      recoverById[id] = recover;
      totalRecovered += recover;
    }
    if (totalRecovered <= 0) {
      return { success: false, totalCost: 0, totalRecovered: 0, recoveredById: {}, reason: "no_recovery" as const };
    }
    const totalCost = Math.max(1, Math.round((totalRecovered / 30) * 50));
    if ((state.creditBalance ?? 0) < totalCost) {
      return { success: false, totalCost, totalRecovered: 0, recoveredById: {}, reason: "credits" as const };
    }

    set((s: CompanyStore) => {
      const nextSoldiers = (s.company?.soldiers ?? []).map((sol) => {
        const gain = recoverById[sol.id] ?? 0;
        if (gain <= 0) return sol;
        const cur = Math.max(0, Math.min(ENERGY_MAX, sol.energy ?? ENERGY_MAX));
        return { ...sol, energy: Math.min(ENERGY_MAX, cur + gain) };
      });
      return {
        creditBalance: (s.creditBalance ?? 0) - totalCost,
        company: { ...s.company, soldiers: nextSoldiers },
      };
    });

    return { success: true, totalCost, totalRecovered, recoveredById: recoverById };
  },

  /** Sync combatant HP back to store soldiers after combat. Never overwrite with a lower value—soldiers may have gained HP from leveling up during grantSoldierCombatXP. */
  syncCombatHpToSoldiers: (playerCombatants: { id: string; hp: number }[]) => {
    set((state: CompanyStore) => {
      const soldiers = state.company?.soldiers ?? [];
      const byId = new Map(playerCombatants.map((c) => [c.id, c.hp]));
      const newSoldiers = soldiers.map((s) => {
        const hp = byId.get(s.id);
        if (hp == null) return s;
        const currentMax = s.attributes?.hit_points ?? 0;
        const synced = Math.max(0, Math.floor(hp));
        const hitPoints = Math.max(currentMax, synced);
        return {
          ...s,
          attributes: { ...s.attributes, hit_points: hitPoints },
        };
      });
      return { company: { ...state.company, soldiers: newSoldiers } };
    });
  },

  /** Remove KIA soldiers from company, add to memorial, increment totalMenLostAllTime. */
  processCombatKIA: (
    kiaSoldierIds: string[],
    missionName?: string,
    playerKills?: Map<string, number>,
    kiaKilledBy?: Map<string, string>,
  ) => {
    if (kiaSoldierIds.length === 0) return;
    const mission = missionName ?? "Unknown";
    set((state: CompanyStore) => {
      const soldiers = state.company?.soldiers ?? [];
      const toRemove = new Set(kiaSoldierIds);
      const fallen = soldiers.filter((s) => toRemove.has(s.id));
      const remaining = soldiers.filter((s) => !toRemove.has(s.id));
      const entries: MemorialEntry[] = fallen.map((s) => ({
        name: s.name,
        level: s.level ?? 1,
        role: (s.designation ?? "Rifleman") as string,
        missionName: mission,
        enemiesKilled: playerKills?.get(s.id) ?? 0,
        killedBy: kiaKilledBy?.get(s.id),
      }));
      const memorialFallen = [...(state.memorialFallen ?? []), ...entries];
      const formationSlots = getFormationSlots(state.company).map((id) =>
        id != null && toRemove.has(id) ? null : id,
      );
      return {
        company: { ...state.company, soldiers: remaining, formationSlots },
        totalMenInCompany: remaining.length,
        totalMenLostAllTime: (state.totalMenLostAllTime ?? 0) + fallen.length,
        memorialFallen,
      };
    });
  },

  /** Move all holding_inventory items to armory when space available. Respects per-category caps. */
  claimHoldingInventory: () => {
    const state = get();
    const holding = state.company?.holding_inventory ?? [];
    if (holding.length === 0) return;
    const level = state.company?.level ?? state.companyLevel ?? 1;
    const caps = {
      weapon: getWeaponArmorySlots(level),
      armor: getArmorArmorySlots(level),
      equipment: getEquipmentArmorySlots(level),
    };
    let inv = [...(state.company?.inventory ?? [])];
    const remaining: typeof holding = [];
    for (const item of holding) {
      const copy = { ...item };
      const canStack = canItemStackInArmory(copy);
      const existingIdx = canStack ? inv.findIndex((x) => x.id === copy.id && (x.uses != null || x.quantity != null)) : -1;
      if (existingIdx >= 0) {
        const ex = inv[existingIdx];
        const exUses = ex.uses ?? ex.quantity ?? 1;
        const addUses = copy.uses ?? copy.quantity ?? 1;
        inv = inv.slice();
        inv[existingIdx] = { ...ex, uses: exUses + addUses };
      } else {
        const counts = countArmoryByCategory(inv);
        const cat = getItemArmoryCategory(copy);
        if (counts[cat] < caps[cat]) {
          inv = [...inv, copy];
        } else {
          remaining.push(copy);
        }
      }
    }
    set((s: CompanyStore) => ({
      company: {
        ...s.company,
        inventory: inv,
        holding_inventory: remaining,
      },
    }));
  },

  /** When releasing a soldier, put their weapon/armor/inventory into armory if room. Add to existing stacks first. Respects per-category caps. */
  emptySoldierToCompanyInventory: (soldierId: string) => {
    const state = get();
    const level = state.company?.level ?? state.companyLevel ?? 1;
    const caps = {
      weapon: getWeaponArmorySlots(level),
      armor: getArmorArmorySlots(level),
      equipment: getEquipmentArmorySlots(level),
    };
    const soldier = state.company?.soldiers?.find((s) => s.id === soldierId);
    if (!soldier) return { success: false, reason: "soldier not found" };

    const toAdd: import("../constants/items/types.ts").Item[] = [];
    const ensureTarget = (i: any) => ({ ...i, target: i.target ?? TARGET_TYPES.none });
    if (soldier.weapon) toAdd.push(ensureTarget(soldier.weapon) as any);
    if (soldier.armor) toAdd.push(ensureTarget(soldier.armor) as any);
    (soldier.inventory ?? []).forEach((i) => toAdd.push(ensureTarget(i) as any));

    let inv = [...(state.company?.inventory ?? [])];
    for (const it of toAdd) {
      const item = { ...it };
      const canStack = canItemStackInArmory(item);
      const existingIdx = canStack ? inv.findIndex((x) => x.id === item.id && (x.uses != null || x.quantity != null)) : -1;
      if (existingIdx >= 0) {
        const ex = inv[existingIdx];
        const exUses = ex.uses ?? ex.quantity ?? 1;
        const addUses = item.uses ?? item.quantity ?? 1;
        inv = inv.slice();
        inv[existingIdx] = { ...ex, uses: exUses + addUses };
      } else {
        const counts = countArmoryByCategory(inv);
        const cat = getItemArmoryCategory(item);
        if (counts[cat] >= caps[cat]) return { success: false, reason: "armory full" };
        inv = [...inv, item];
      }
    }

    const newSoldiers = (state.company?.soldiers ?? []).filter((sol) => sol.id !== soldierId);
    set((s: CompanyStore) => ({
      company: {
        ...s.company,
        soldiers: newSoldiers,
        inventory: inv,
      },
      totalMenInCompany: newSoldiers.length,
    }));
    return { success: true };
  },
});
