import { SoldierManager } from "../game/entities/soldier/soldier-manager.ts";
import { animateHTMLRemove, animateHTMLReplace } from "../utils/html-utils.ts";
import { Partial } from "../game/html-templates/partials/partial.ts";
import { DomEventManager } from "../game/ui/event-handlers/dom-event-manager.ts";
import { eventConfigs } from "../game/ui/event-configs.ts";
import { type CompanyStore, GAME_STEPS, type GameStep } from "./ui-store.ts";
import {
  type Company,
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
} from "../constants/economy.ts";
import {
  getItemArmoryCategory,
  countArmoryByCategory,
  canItemStackInArmory,
} from "../utils/item-utils.ts";
import {
  getMaxCompanySize,
} from "../game/entities/company/company.ts";
import { TARGET_TYPES } from "../constants/items/types.ts";
import { MAX_EQUIPMENT_SLOTS } from "../constants/inventory-slots.ts";
import { weaponWieldOk } from "../utils/equip-utils.ts";
import { getRewardItemById } from "../utils/reward-utils.ts";
import type { Mission } from "../constants/missions.ts";
import type { MemorialEntry } from "../game/entities/memorial-types.ts";
import { getStarterArmoryItems } from "../constants/starter-armory.ts";

export const StoreActions = (set: any, get: () => CompanyStore) => ({
  companyName: "",
  commanderName: "",
  companyUnitPatchURL: "",
  gameStep: GAME_STEPS.at_intro_0,
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
  company: {} as Company,

  // Actions
  rerollSoldier: async (id: string) => {
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

    await animateHTMLReplace(
      trooperCard,
      Partial.render.parsedTrooper(newSoldier, canAddOneMore),
    ).then(() => {
      DomEventManager.initEventArray(eventConfigs().troopsScreen());

      const rerollCounterDiv = document.querySelector(".reroll-counter");
      if (rerollCounterDiv) {
        rerollCounterDiv.replaceWith(
          Partial.render.parsedRerollCounter(get().rerollCounter) as HTMLElement,
        );
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
      return {
        creditBalance: state.creditBalance - totalCost,
        recruitStaging: returned,
        totalMenInCompany: newSoldiers.length,
        company: {
          ...state.company,
          soldiers: newSoldiers,
        },
        marketAvailableTroops: [...state.marketAvailableTroops, ...returned],
      };
    }),
  onCompanyLevelUp: () => {
    const soldiers = SoldierManager.generateTroopList(
      get().companyLevel ?? 1,
    );
    get().setMarketAvailableTroops(soldiers);
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
      return {
        company: {
          ...state.company,
          soldiers: initial,
        },
        totalMenInCompany: initial.length,
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
      return {
        company: { ...state.company, soldiers: filtered },
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
      if (soldier.armor) {
        toAddToArmory.push({ ...soldier.armor, target: (soldier.armor as any).target ?? TARGET_TYPES.none } as any);
      }
    } else {
      const inv = soldier.inventory ?? [];
      const eqIdx = options?.equipmentIndex ?? inv.length;
      if (eqIdx >= inv.length && inv.length >= MAX_EQUIPMENT_SLOTS) {
        return { success: false, reason: "equipment slots full" };
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
        } else if (newInv.length < MAX_EQUIPMENT_SLOTS) {
          newInv.push({ ...item });
        }
        return { ...sol, inventory: newInv };
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
          inv.splice(equipmentIndex, 1);
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

    const destInv = dest.inventory ?? [];
    const destItem = getItem(dest, op.destSlotType, op.destEqIndex);
    if (
      op.destSlotType === "equipment" &&
      !destItem &&
      destInv.length >= MAX_EQUIPMENT_SLOTS
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
            else inv.splice(op.sourceEqIndex, 1);
          }
          return { ...sol, inventory: inv.filter(Boolean).slice(0, MAX_EQUIPMENT_SLOTS) };
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
          if (idx < inv.length && destItem) {
            inv[idx] = srcWithTarget as any;
          } else if (idx < inv.length) {
            inv.splice(idx, 0, srcWithTarget as any);
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

  /** Grant mission rewards: credits on victory, items (armory or holding if full). Respects per-category caps. Updates mission stats. */
  grantMissionRewards: (mission: Mission | null, victory: boolean) => {
    set((s: CompanyStore) => ({
      totalMissionsCompleted: (s.totalMissionsCompleted ?? 0) + (victory ? 1 : 0),
      totalMissionsFailed: (s.totalMissionsFailed ?? 0) + (victory ? 0 : 1),
    }));
    if (!victory || !mission) return;
    const state = get();
    const credits = mission.creditReward ?? 0;
    set((s: CompanyStore) => ({ creditBalance: s.creditBalance + credits }));
    const rewardIds = mission.rewardItems ?? [];
    if (rewardIds.length === 0) return;
    const level = state.company?.level ?? state.companyLevel ?? 1;
    const caps = {
      weapon: getWeaponArmorySlots(level),
      armor: getArmorArmorySlots(level),
      equipment: getEquipmentArmorySlots(level),
    };
    let inv = [...(state.company?.inventory ?? [])];
    let holding = [...(state.company?.holding_inventory ?? [])];
    for (const id of rewardIds) {
      const item = getRewardItemById(id);
      if (!item) continue;
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
          holding = [...holding, copy];
        }
      }
    }
    set((s: CompanyStore) => ({
      company: {
        ...s.company,
        inventory: inv,
        holding_inventory: holding,
      },
    }));
  },

  /** Sync combatant HP back to store soldiers after combat. */
  syncCombatHpToSoldiers: (playerCombatants: { id: string; hp: number }[]) => {
    set((state: CompanyStore) => {
      const soldiers = state.company?.soldiers ?? [];
      const byId = new Map(playerCombatants.map((c) => [c.id, c.hp]));
      const newSoldiers = soldiers.map((s) => {
        const hp = byId.get(s.id);
        if (hp == null) return s;
        return {
          ...s,
          attributes: { ...s.attributes, hit_points: Math.max(0, Math.floor(hp)) },
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
        level: s.level,
        missionName: mission,
        enemiesKilled: playerKills?.get(s.id) ?? 0,
      }));
      const memorialFallen = [...(state.memorialFallen ?? []), ...entries];
      return {
        company: { ...state.company, soldiers: remaining },
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
