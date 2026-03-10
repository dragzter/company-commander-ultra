import type { HandlerInitConfig } from "../../constants/types.ts";
import {
  getItemPopupBodyHtml,
  getItemPopupBodyHtmlCompact,
} from "../html-templates/inventory-template.ts";
import {
  STARTING_CREDITS,
  getArmorySlotsForCategory,
  SOLDIER_XP_BASE_SURVIVE_VICTORY,
  SOLDIER_XP_BASE_SURVIVE_DEFEAT,
  SOLDIER_XP_PER_DAMAGE,
  SOLDIER_XP_PER_DAMAGE_TAKEN,
  SOLDIER_XP_PER_KILL,
  SOLDIER_XP_PER_ABILITY_USE,
  SOLDIER_XP_PER_HEAL,
  COMPANY_XP_FROM_COMBAT_MULTIPLIER,
} from "../../constants/economy.ts";
import {
  getItemArmoryCategory,
  countArmoryByCategory,
  getItemIconUrl,
  renderItemLevelBadge,
} from "../../utils/item-utils.ts";
import {
  getActiveSlots,
  getFormationSlots,
  getSoldierById,
  isFormationReassignmentAllowed,
} from "../../constants/company-slots.ts";
import { setFormationSwapIndices } from "../html-templates/formation-template.ts";
import {
  setLastEquipMoveSoldierIds,
  setLastReadyRoomMoveSlotIndices,
} from "../html-templates/ready-room-template.ts";
import {
  type MissionsResumeStep,
  usePlayerCompanyStore,
} from "../../store/ui-store.ts";
import {
  getMaxSoldierLevel,
  getAverageCompanyLevel,
} from "../../utils/company-utils.ts";
import { disableBtn, enableBtn, s_, sa_ } from "../../utils/html-utils.ts";
import { DOM } from "../../constants/css-selectors.ts";
import { Styler } from "../../utils/styler-manager.ts";
import { UiManager } from "./ui-manager.ts";
import {
  getSoldierAbilities,
  getSoldierAbilityById,
  getSoldierGrenades,
  getSoldierMedItems,
  FLAME_ICON,
  SHIELD_ICON,
  type SoldierGrenade,
  type SoldierMedItem,
} from "../../constants/soldier-abilities.ts";
import {
  TAKE_COVER_DURATION_MS,
  isInCover,
  isStunned,
  assignTargets,
  applyBurnTicks,
  addBurnStack,
  applyBleedTicks,
  clearExpiredEffects,
  clearCombatantEffectsOnDeath,
  getIncapacitationChance,
  removeTargetsForCombatantInCover,
  resolveAttack,
  getNextAttackAt,
} from "../combat/combat-loop.ts";
import { computeFinalDamage } from "../combat/combat-damage.ts";
import type { TargetMap } from "../combat/types.ts";
import {
  weaponWieldOk,
  itemFitsSlot,
  canEquipItemLevel,
  getWeaponRestrictRole,
} from "../../utils/equip-utils.ts";
import { resolveGrenadeThrow } from "../../services/combat/grenade-resolver.ts";
import { WEAPON_EFFECTS } from "../../constants/items/weapon-effects.ts";
import type { Combatant } from "../combat/types.ts";
import { type Mission } from "../../constants/missions.ts";
import {
  MISSION_KIND_META,
  DIFFICULTY_LABELS,
} from "../../constants/missions.ts";
import {
  combatSummaryTemplate,
  buildCombatSummaryData,
} from "../html-templates/combat-summary-template.ts";
import { ThrowableItems } from "../../constants/items/throwable.ts";
import {
  getMedKitHealValues,
  getMedicAwarenessHealBonusPct,
} from "../../constants/items/medkit-scaling.ts";
import { createEnemyCombatant } from "../combat/combatant-utils.ts";
import { formatDisplayName } from "../../utils/name-utils.ts";
import { MAX_GEAR_LEVEL } from "../../constants/items/types.ts";
import type { Item } from "../../constants/items/types.ts";
import {
  getItemMarketBuyPrice,
  getItemSellPrice,
} from "../../utils/sell-pricing.ts";
import { CREDIT_SYMBOL } from "../../constants/currency.ts";
import { TRAIT_CODEX } from "../../constants/trait-codex.ts";
import { TraitProfileStats } from "../entities/soldier/soldier-traits.ts";
import {
  getEarnedTraitById,
  type EarnedTraitAward,
} from "../../constants/veterancy-traits.ts";
import type { Soldier } from "../entities/types.ts";
import {
  createCareerMission,
  isCareerUnlocked,
} from "../../services/missions/career-mode.ts";
import {
  COMPANY_ABILITY_DEFS,
  getCompanyActiveAbilities,
  getCompanyPassiveEffects,
  type CompanyAbilityId,
} from "../../constants/company-abilities.ts";

/**
 * Contains definitions for the events of all html templates.
 * Configured when the html is called and appended to the DOM.
 */
export function eventConfigs() {
  const store = usePlayerCompanyStore.getState();

  function parseSlotItemFromData(slotEl: HTMLElement): Item | null {
    const raw = slotEl.dataset.slotItem;
    if (!raw) return null;
    try {
      return JSON.parse(raw.replace(/&quot;/g, '"')) as Item;
    } catch {
      return null;
    }
  }

  function isWeaponItem(item: Item | null | undefined): item is Item {
    const t = item?.type as string | undefined;
    return t === "ballistic_weapon" || t === "melee_weapon";
  }

  function toTitle(raw: string): string {
    return raw
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function esc(v: string): string {
    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtSigned(n: number): string {
    return `${n > 0 ? "+" : ""}${n}`;
  }

  function traitStatBadgesHtml(
    stats: Record<string, number> | undefined,
    grenadeHitBonusPct = 0,
  ): string {
    const statAbbr: Record<string, string> = {
      hit_points: "HP",
      dexterity: "DEX",
      morale: "MOR",
      toughness: "TGH",
      awareness: "AWR",
    };
    const rows = Object.entries(stats ?? {})
      .filter(([, n]) => typeof n === "number" && n !== 0)
      .map(([k, n]) => {
        const cls = n > 0 ? "positive" : "negative";
        return `<span class="roster-trait-item-badge ${cls}">${esc(statAbbr[k] ?? k.toUpperCase())} ${esc(fmtSigned(n))}</span>`;
      });
    if (grenadeHitBonusPct > 0) {
      const pct = Math.round(grenadeHitBonusPct * 1000) / 10;
      rows.push(
        `<span class="roster-trait-item-badge positive">Chance to hit with grenades +${esc(String(pct))}%</span>`,
      );
    }
    return rows.join("");
  }

  function buildSoldierTraitEntries(soldier: Soldier): Array<{
    title: string;
    type: string;
    desc: string;
    stats?: Record<string, number>;
    grenadeHitBonusPct?: number;
    primary?: boolean;
  }> {
    const entries: Array<{
      title: string;
      type: string;
      desc: string;
      stats?: Record<string, number>;
      grenadeHitBonusPct?: number;
      primary?: boolean;
    }> = [];
    const primaryRaw = (soldier.trait_profile?.name ?? "unremarkable").trim();
    const primaryKey = primaryRaw.toLowerCase().replace(/\s+/g, "_");
    const codex = TRAIT_CODEX[primaryKey];
    entries.push({
      title: toTitle(primaryRaw),
      type: "Primary",
      desc:
        codex?.flavor ??
        codex?.description ??
        "Original trait rolled at recruitment.",
      stats:
        (TraitProfileStats[primaryKey] as Record<string, number> | undefined) ??
        undefined,
      primary: true,
    });
    for (const traitId of soldier.earnedTraitIds ?? []) {
      const def = getEarnedTraitById(traitId);
      if (!def) continue;
      entries.push({
        title: def.name,
        type:
          def.kind === "positive"
            ? "Veterancy"
            : def.kind === "severe"
              ? "Severe Scar"
              : "Scar",
        desc: def.flavor,
        stats: def.stats,
        grenadeHitBonusPct: def.grenadeHitBonusPct ?? 0,
      });
    }
    const companyOwned = new Set(
      usePlayerCompanyStore.getState().companyAbilityUnlockedIds ?? [],
    );
    if (companyOwned.has("advanced_tactical_training")) {
      entries.push({
        title: "Advanced Tactical Training",
        type: "Company",
        desc: "Company doctrine: +3 DEX, MOR, AWR, TGH.",
        stats: { dexterity: 3, morale: 3, awareness: 3, toughness: 3 },
      });
    }
    if (companyOwned.has("targeting_optics")) {
      entries.push({
        title: "Targeting Optics",
        type: "Company",
        desc: "Company doctrine: +1% chance to hit.",
      });
    }
    if (companyOwned.has("gunnery")) {
      entries.push({
        title: "Gunnery",
        type: "Company",
        desc: "Support suppress cooldown reduced by 10s.",
      });
    }
    if (companyOwned.has("fire_and_maneuver")) {
      entries.push({
        title: "Fire and Maneuver",
        type: "Company",
        desc: "Take Cover cooldown reduced by 10s.",
      });
    }
    if (companyOwned.has("entrenchment_techniques")) {
      entries.push({
        title: "Entrenchment Techniques",
        type: "Company",
        desc: "After Take Cover: +10% toughness for 6s.",
      });
    }
    if (companyOwned.has("grenadier_training")) {
      entries.push({
        title: "Grenadier Training",
        type: "Company",
        desc: "Frag/incendiary grenade damage +15%.",
      });
    }
    return entries;
  }

  function isStrictWeaponSwapAllowed(
    sourceSoldierId: string,
    sourceWeapon: Item,
    destSlotEl: HTMLElement,
  ): boolean {
    const soldiers = usePlayerCompanyStore.getState().company?.soldiers ?? [];
    const sourceSoldier = soldiers.find((s) => s.id === sourceSoldierId);
    const destSoldierId = destSlotEl.dataset.soldierId;
    const destSoldier = destSoldierId
      ? soldiers.find((s) => s.id === destSoldierId)
      : null;
    if (!sourceSoldier || !destSoldier) return false;

    if (
      !weaponWieldOk(sourceWeapon, destSoldier) ||
      !canEquipItemLevel(sourceWeapon, destSoldier)
    ) {
      return false;
    }

    const destWeapon = parseSlotItemFromData(destSlotEl);
    if (isWeaponItem(destWeapon)) {
      if (
        !weaponWieldOk(destWeapon, sourceSoldier) ||
        !canEquipItemLevel(destWeapon, sourceSoldier)
      ) {
        return false;
      }
    }

    return true;
  }

  function isInMissionUiContext(): boolean {
    return Boolean(
      document.getElementById("missions-screen") ||
        document.getElementById("career-screen") ||
        document.getElementById("ready-room-screen"),
    );
  }

  const initHelperDialogTypewriter = () => {
    const textEls = Array.from(
      document.querySelectorAll(
        ".helper-onboarding-typed-text[data-full-text]",
      ),
    ) as HTMLElement[];
    for (const textEl of textEls) {
      const fullText = textEl.dataset.fullText ?? "";
      if (fullText.length === 0) continue;
      if (textEl.dataset.typed === "true") continue;

      textEl.dataset.typed = "true";
      textEl.textContent = fullText;
      const reserveHeight = Math.ceil(textEl.getBoundingClientRect().height);
      if (reserveHeight > 0) textEl.style.minHeight = `${reserveHeight}px`;
      textEl.textContent = "";
      textEl.classList.add("helper-onboarding-text-typing");
      const durationMs = 1500;
      const start = performance.now();

      const renderTyped = (typedText: string) => {
        textEl.innerHTML = "";
        const typedSpan = document.createElement("span");
        typedSpan.textContent = typedText;
        textEl.appendChild(typedSpan);
        const caret = document.createElement("span");
        caret.className = "helper-onboarding-caret";
        caret.setAttribute("aria-hidden", "true");
        textEl.appendChild(caret);
      };

      const tick = (now: number) => {
        const elapsed = Math.max(0, now - start);
        const progress = Math.min(1, elapsed / durationMs);
        const count = Math.max(1, Math.floor(fullText.length * progress));
        renderTyped(fullText.slice(0, count));
        if (progress < 1) {
          window.requestAnimationFrame(tick);
        } else {
          textEl.textContent = fullText;
          textEl.classList.remove("helper-onboarding-text-typing");
        }
      };

      window.requestAnimationFrame(tick);
    }
  };

  const applyHomeOnboardingFocus = () => {
    const st = usePlayerCompanyStore.getState();
    const missionBtn = s_(DOM.company.missions) as HTMLElement | null;
    const marketBtn = s_(DOM.company.market) as HTMLElement | null;
    if (missionBtn) {
      missionBtn.classList.toggle(
        "onboarding-mission-focus",
        !!st.onboardingFirstMissionPending && !st.onboardingHomeIntroPending,
      );
    }
    if (marketBtn) {
      marketBtn.classList.toggle(
        "onboarding-market-focus",
        st.onboardingRecruitStep === "market",
      );
    }
  };

  const marketLevelNavHandlers = (
    containerId: string,
    render: () => void,
    maxOverride?: number,
    options?: { tierSource?: "market" | "devCatalog" },
  ): HandlerInitConfig[] => [
    {
      selector: `#${containerId} .market-level-nav-prev`,
      eventType: "click",
      callback: () => {
        const st = usePlayerCompanyStore.getState();
        const useDevTier = options?.tierSource === "devCatalog";
        const max = maxOverride ?? getMaxSoldierLevel(st.company);
        const cur =
          (useDevTier ? st.devCatalogTierLevel : st.marketTierLevel) ||
          (maxOverride ?? max);
        if (cur > 1) {
          if (useDevTier) st.setDevCatalogTierLevel(cur - 1);
          else st.setMarketTierLevel(cur - 1);
          render();
        }
      },
    },
    {
      selector: `#${containerId} .market-level-nav-next`,
      eventType: "click",
      callback: () => {
        const st = usePlayerCompanyStore.getState();
        const useDevTier = options?.tierSource === "devCatalog";
        const max = maxOverride ?? getMaxSoldierLevel(st.company);
        const cur =
          (useDevTier ? st.devCatalogTierLevel : st.marketTierLevel) ||
          (maxOverride ?? max);
        if (cur < max) {
          if (useDevTier) st.setDevCatalogTierLevel(cur + 1);
          else st.setMarketTierLevel(cur + 1);
          render();
        }
      },
    },
    {
      selector: `#${containerId} [data-market-tier-delta]`,
      eventType: "click",
      callback: (e: Event) => {
        const st = usePlayerCompanyStore.getState();
        const useDevTier = options?.tierSource === "devCatalog";
        const max = maxOverride ?? getMaxSoldierLevel(st.company);
        const cur =
          (useDevTier ? st.devCatalogTierLevel : st.marketTierLevel) ||
          (maxOverride ?? max);
        const trigger = (e.target as HTMLElement | null)?.closest(
          "[data-market-tier-delta]",
        ) as HTMLElement | null;
        const deltaRaw = Number(
          trigger?.getAttribute("data-market-tier-delta") ?? 0,
        );
        const delta = Number.isFinite(deltaRaw) ? Math.trunc(deltaRaw) : 0;
        if (delta === 0) return;
        const next = Math.max(1, Math.min(max, cur + delta));
        if (next !== cur) {
          if (useDevTier) st.setDevCatalogTierLevel(next);
          else st.setMarketTierLevel(next);
          render();
        }
      },
    },
    {
      selector: `#${containerId} [data-market-tier-go]`,
      eventType: "click",
      callback: (e: Event) => {
        const st = usePlayerCompanyStore.getState();
        const useDevTier = options?.tierSource === "devCatalog";
        const max = maxOverride ?? getMaxSoldierLevel(st.company);
        const cur =
          (useDevTier ? st.devCatalogTierLevel : st.marketTierLevel) ||
          (maxOverride ?? max);
        const trigger = (e.target as HTMLElement | null)?.closest(
          "[data-market-tier-go]",
        ) as HTMLElement | null;
        const nav = trigger?.closest(".market-level-nav");
        const input = nav?.querySelector(
          "[data-market-tier-input]",
        ) as HTMLInputElement | null;
        if (!input) return;
        const parsed = Number(input.value);
        if (!Number.isFinite(parsed)) return;
        const next = Math.max(1, Math.min(max, Math.floor(parsed)));
        if (next !== cur) {
          if (useDevTier) st.setDevCatalogTierLevel(next);
          else st.setMarketTierLevel(next);
          render();
        }
      },
    },
    {
      selector: `#${containerId} [data-market-tier-input]`,
      eventType: "keydown",
      callback: (e: Event) => {
        const ke = e as KeyboardEvent;
        if (ke.key !== "Enter") return;
        ke.preventDefault();
        const st = usePlayerCompanyStore.getState();
        const useDevTier = options?.tierSource === "devCatalog";
        const max = maxOverride ?? getMaxSoldierLevel(st.company);
        const cur =
          (useDevTier ? st.devCatalogTierLevel : st.marketTierLevel) ||
          (maxOverride ?? max);
        const input = e.currentTarget as HTMLInputElement | null;
        if (!input) return;
        const parsed = Number(input.value);
        if (!Number.isFinite(parsed)) return;
        const next = Math.max(1, Math.min(max, Math.floor(parsed)));
        if (next !== cur) {
          if (useDevTier) st.setDevCatalogTierLevel(next);
          else st.setMarketTierLevel(next);
          render();
        }
      },
    },
  ];

  // Handlers for the setup screen
  const gameSetupEventConfig: HandlerInitConfig[] = [
    {
      eventType: "click",
      selector: DOM.setupScreen.cancel,
      callback: () => {
        UiManager.reRenderMainMenu();
      },
    },
    {
      eventType: "click",
      selector: DOM.setupScreen.finish,
      callback: () => {
        usePlayerCompanyStore.getState().setCreditBalance(STARTING_CREDITS);
        UiManager.createConfirmationScreen();
      },
    },
    {
      eventType: "input",
      selector: DOM.setupScreen.commanderInput,
      callback: (e: Event) => {
        const el = e.target as HTMLInputElement;
        const proceedButton = s_(DOM.setupScreen.finish) as HTMLButtonElement;
        store.setCommanderName(el.value);

        if (store.canProceedToLaunch()) {
          enableBtn(proceedButton);
        } else {
          disableBtn(proceedButton);
        }
      },
    },
    {
      eventType: "input",
      selector: DOM.setupScreen.companyInput,
      callback: (e: Event) => {
        const el = e.target as HTMLInputElement;
        store.setCompanyName(el.value);
        const proceedButton = s_(DOM.setupScreen.finish) as HTMLButtonElement;

        if (store.canProceedToLaunch()) {
          enableBtn(proceedButton);
        } else {
          disableBtn(proceedButton);
        }
      },
    },
    {
      eventType: "click",
      selector: DOM.setupScreen.unitPatch,
      callback: (e: Event) => {
        const el = e.target as HTMLElement;
        const proceedButton = s_(DOM.setupScreen.finish) as HTMLButtonElement;

        const others: HTMLElement[] = Array.from(
          sa_(DOM.setupScreen.unitPatch),
        ) as HTMLElement[];

        others.forEach((o: HTMLElement) => {
          o.style.outline = "none";
        });

        Styler.selectedWhite5(el);
        store.setCompanyUnitPatch(el.dataset.img as string);

        if (store.canProceedToLaunch()) {
          enableBtn(proceedButton);
        } else {
          disableBtn(proceedButton);
        }

        console.log("clicking patch", el.dataset.img);
      },
    },
  ];

  // Confirmation screen
  const gameConfirmationEventConfig: HandlerInitConfig[] = [
    {
      eventType: "click",
      selector: DOM.confirmScreen.launch,
      callback: () => {
        usePlayerCompanyStore.getState().bootstrapNewCompanyIfEmpty();
        UiManager.renderCompanyHomePage();
      },
    },
    {
      eventType: "click",
      selector: DOM.confirmScreen.goBack,
      callback: () => {
        console.log("go back!");
      },
    },
  ];

  // Main Menu handlers
  const mainMenuEventConfig: HandlerInitConfig[] = [
    {
      selector: DOM.mainMenu.newGame,
      eventType: "click",
      callback: () => {
        console.log("callback new game");
        UiManager.renderSetupScreen();
      },
    },
    {
      selector: DOM.mainMenu.continue,
      eventType: "click",
      callback: () => {
        console.log("continue campaign");
      },
    },
    {
      selector: DOM.mainMenu.credits,
      eventType: "click",
      callback: () => {
        console.log("show Credits");
      },
    },
    {
      selector: DOM.mainMenu.settings,
      eventType: "click",
      callback: () => {
        console.log("Show settings");
      },
    },
  ];

  // Company home page
  const companyHomeEventConfig: HandlerInitConfig[] = [
    {
      selector: DOM.company.home,
      eventType: "click",
      callback: () => {
        console.log("clicking home");
        UiManager.selectCompanyHomeButton(DOM.company.home);
        UiManager.renderCompanyHomePage();
      },
    },
    {
      selector: DOM.company.heroes,
      eventType: "click",
      callback: () => {
        UiManager.selectCompanyHomeButton(DOM.company.heroes);
        UiManager.renderHeroesScreen();
      },
    },
    {
      selector: DOM.company.abilities,
      eventType: "click",
      callback: () => {
        UiManager.selectCompanyHomeButton(DOM.company.abilities);
        UiManager.renderAbilitiesScreen();
      },
    },
    {
      selector: DOM.company.roster,
      eventType: "click",
      callback: () => {
        UiManager.selectCompanyHomeButton(DOM.company.roster);
        UiManager.renderRosterScreen();
      },
    },
    {
      selector: DOM.company.missions,
      eventType: "click",
      callback: () => {
        UiManager.selectCompanyHomeButton(DOM.company.missions);
        if (isInMissionUiContext()) {
          UiManager.renderMissionsScreen("menu");
          return;
        }
        UiManager.renderMissionsScreen();
      },
    },
    {
      selector: DOM.company.market,
      eventType: "click",
      callback: () => {
        UiManager.selectCompanyHomeButton(DOM.company.market);
        UiManager.renderMarketScreen();
      },
    },
    {
      // This one only shows when there's no men in the company – go directly to troops
      selector: DOM.company.goToTroopsScreen,
      eventType: "click",
      callback: () => {
        UiManager.selectCompanyHomeButton(DOM.company.market);
        UiManager.renderMarketTroopsScreen();
      },
    },
    {
      selector: DOM.company.training,
      eventType: "click",
      callback: () => {
        UiManager.selectCompanyHomeButton(DOM.company.training);
        UiManager.renderTrainingScreen();
      },
    },
    {
      selector: DOM.company.inventory,
      eventType: "click",
      callback: () => {
        UiManager.selectCompanyHomeButton(DOM.company.inventory);
        UiManager.renderInventoryScreen();
      },
    },
    {
      selector: DOM.company.codex,
      eventType: "click",
      callback: () => {
        const popup = s_(DOM.company.codexPopup) as HTMLElement | null;
        if (popup) {
          popup.hidden = false;
        }
      },
    },
    {
      selector: DOM.company.settings,
      eventType: "click",
      callback: () => {
        const popup = s_(DOM.company.settingsPopup) as HTMLElement | null;
        if (popup) popup.hidden = false;
      },
    },
    {
      selector: DOM.company.settingsPopupClose,
      eventType: "click",
      callback: () => {
        const popup = s_(DOM.company.settingsPopup) as HTMLElement | null;
        if (popup) popup.hidden = true;
      },
    },
    {
      selector: DOM.company.settingsPopup,
      eventType: "click",
      callback: (e: Event) => {
        if ((e.target as HTMLElement).id === "settings-popup") {
          (e.target as HTMLElement).hidden = true;
        }
      },
    },
    {
      selector: DOM.company.settingsResetBtn,
      eventType: "click",
      callback: () => {
        const popup = s_(
          DOM.company.settingsResetConfirmPopup,
        ) as HTMLElement | null;
        if (popup) popup.hidden = false;
      },
    },
    {
      selector: DOM.company.settingsResetConfirmNo,
      eventType: "click",
      callback: () => {
        const popup = s_(
          DOM.company.settingsResetConfirmPopup,
        ) as HTMLElement | null;
        if (popup) popup.hidden = true;
      },
    },
    {
      selector: DOM.company.settingsResetConfirmPopup,
      eventType: "click",
      callback: (e: Event) => {
        if ((e.target as HTMLElement).id === "settings-reset-confirm-popup") {
          (e.target as HTMLElement).hidden = true;
        }
      },
    },
    {
      selector: DOM.company.settingsResetConfirmYes,
      eventType: "click",
      callback: () => {
        const resetBtn = s_(
          DOM.company.settingsResetConfirmYes,
        ) as HTMLButtonElement | null;
        if (resetBtn) resetBtn.disabled = true;
        try {
          (
            usePlayerCompanyStore as unknown as {
              persist?: { clearStorage?: () => void };
            }
          ).persist?.clearStorage?.();
        } catch {
          //
        }
        try {
          localStorage.removeItem("cc-company-store");
        } catch {
          //
        }
        try {
          sessionStorage.removeItem("cc-company-store");
        } catch {
          //
        }
        window.location.reload();
      },
    },
    {
      selector: DOM.company.onboardingIntroContinue,
      eventType: "click",
      callback: () => {
        usePlayerCompanyStore.getState().setOnboardingHomeIntroPending(false);
        usePlayerCompanyStore.getState().setOnboardingFirstMissionPending(true);
        const popup = s_(
          DOM.company.onboardingIntroPopup,
        ) as HTMLElement | null;
        if (popup) {
          popup.classList.add("home-onboarding-popup-hide");
          window.setTimeout(() => {
            popup.remove();
          }, 260);
        }
        const missionBtn = s_(DOM.company.missions) as HTMLElement | null;
        if (missionBtn) {
          missionBtn.classList.add("onboarding-mission-focus");
        }
      },
    },
    {
      selector: DOM.company.onboardingRecruitContinue,
      eventType: "click",
      callback: () => {
        const st = usePlayerCompanyStore.getState();
        st.setOnboardingRecruitStep("market");
        const popup = s_(
          DOM.company.onboardingRecruitPopup,
        ) as HTMLElement | null;
        if (popup) {
          popup.classList.add("home-onboarding-popup-hide");
          window.setTimeout(() => {
            popup.remove();
          }, 260);
        }
        const marketBtn = s_(DOM.company.market) as HTMLElement | null;
        if (marketBtn) {
          marketBtn.classList.add("onboarding-market-focus");
        }
      },
    },
    {
      selector: DOM.company.companyAbilityContinue,
      eventType: "click",
      callback: () => {
        const st = usePlayerCompanyStore.getState();
        st.dismissCompanyAbilityNotification();
        const popup = s_(DOM.company.companyAbilityPopup) as HTMLElement | null;
        if (popup) {
          popup.classList.add("home-onboarding-popup-hide");
          window.setTimeout(() => popup.remove(), 260);
        }
        const tacticsBtn = s_(DOM.company.abilities) as HTMLElement | null;
        if (tacticsBtn) tacticsBtn.classList.add("onboarding-market-focus");
      },
    },
    {
      selector: DOM.company.companyAbilityPopup,
      eventType: "click",
      callback: (e: Event) => {
        if ((e.target as HTMLElement).id !== "home-company-ability-popup")
          return;
        usePlayerCompanyStore.getState().dismissCompanyAbilityNotification();
        (e.currentTarget as HTMLElement).remove();
      },
    },
    {
      selector: DOM.company.statsMemorial,
      eventType: "click",
      callback: () => {
        const popup = s_(DOM.company.memorialPopup) as HTMLElement | null;
        if (popup) popup.hidden = false;
      },
    },
    {
      selector: DOM.company.memorialPopupClose,
      eventType: "click",
      callback: () => {
        const popup = s_(DOM.company.memorialPopup) as HTMLElement | null;
        if (popup) popup.hidden = true;
      },
    },
    {
      selector: DOM.company.memorialPopup,
      eventType: "click",
      callback: (e: Event) => {
        if ((e.target as HTMLElement).id === "memorial-popup") {
          (e.target as HTMLElement).hidden = true;
        }
      },
    },
    {
      selector: DOM.company.codexPopupClose,
      eventType: "click",
      callback: () => {
        const popup = s_(DOM.company.codexPopup) as HTMLElement | null;
        if (popup) popup.hidden = true;
      },
    },
    {
      selector: DOM.company.codexPopup,
      eventType: "click",
      callback: (e: Event) => {
        if ((e.target as HTMLElement).id === "codex-popup") {
          (e.target as HTMLElement).hidden = true;
        }
      },
    },
    {
      selector: ".codex-tab",
      eventType: "click",
      callback: (e: Event) => {
        const tab = e.currentTarget as HTMLElement;
        const tabName = tab.dataset.tab;
        if (!tabName) return;
        const popup = s_(DOM.company.codexPopup);
        if (!popup) return;
        popup
          .querySelectorAll(".codex-tab")
          .forEach((t) => t.classList.remove("active"));
        popup
          .querySelectorAll(".codex-tab-panel")
          .forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        const panel = popup.querySelector(`[data-panel="${tabName}"]`);
        if (panel) panel.classList.add("active");
      },
    },
  ];
  initHelperDialogTypewriter();
  applyHomeOnboardingFocus();

  const marketEventConfig: HandlerInitConfig[] = [
    {
      selector: DOM.market.marketTroopsLink,
      eventType: "click",
      callback: () => {
        const st = usePlayerCompanyStore.getState();
        if (st.onboardingRecruitStep === "market") {
          st.setOnboardingRecruitStep("troops_recruit");
        }
        UiManager.renderMarketTroopsScreen();
      },
    },
    {
      selector: DOM.market.marketArmorLink,
      eventType: "click",
      callback: () => {
        UiManager.renderArmorMarketScreen();
      },
    },
    {
      selector: DOM.market.marketWeaponsLink,
      eventType: "click",
      callback: () => {
        UiManager.renderWeaponsMarketScreen();
      },
    },
    {
      selector: DOM.market.marketSuppliesLink,
      eventType: "click",
      callback: () => {
        UiManager.renderSuppliesMarketScreen();
      },
    },
    {
      selector: DOM.market.marketDevCatalogLink,
      eventType: "click",
      callback: () => {
        UiManager.renderDevCatalogScreen();
      },
    },
  ];

  const missionsScreenEventConfig: HandlerInitConfig[] = [
    {
      selector: DOM.missions.filterChipBtn,
      eventType: "click",
      callback: (e: Event) => {
        const chip = e.currentTarget as HTMLElement;
        const group = chip.dataset.filterGroup;
        const value = chip.dataset.filterValue;

        if (!group || !value) return;
        const filtersRoot = chip.closest(
          ".missions-filters",
        ) as HTMLElement | null;
        if (!filtersRoot) return;
        if (group === "kind") filtersRoot.dataset.kindFilter = value;
        if (group === "difficulty")
          filtersRoot.dataset.difficultyFilter = value;
        filtersRoot
          .querySelectorAll(
            `.missions-filter-chip[data-filter-group="${group}"]`,
          )
          .forEach((el) => {
            el.classList.toggle("is-active", el === chip);
          });

        const kindFilter = filtersRoot.dataset.kindFilter ?? "all";
        if (group === "kind") {
          const resumeStep: MissionsResumeStep =
            value === "all" ||
            value === "defend_objective" ||
            value === "skirmish" ||
            value === "manhunt"
              ? (value as MissionsResumeStep)
              : "all";
          store.setMissionsResumeState(resumeStep, null);
        }

        const difficultyFilter = filtersRoot.dataset.difficultyFilter ?? "all";
        const sections = Array.from(
          document.querySelectorAll(".missions-section-kind"),
        ) as HTMLElement[];
        let visibleCards = 0;
        sections.forEach((section) => {
          const cards = Array.from(
            section.querySelectorAll(".mission-card"),
          ) as HTMLElement[];
          let sectionVisible = false;
          cards.forEach((card) => {
            const cardKind = card.dataset.kind ?? "";
            const cardDifficulty = card.dataset.level ?? "";
            const kindOk = kindFilter === "all" || cardKind === kindFilter;
            const diffOk =
              difficultyFilter === "all" || cardDifficulty === difficultyFilter;
            const showCard = kindOk && diffOk;
            card.hidden = !showCard;
            if (showCard) {
              visibleCards += 1;
              sectionVisible = true;
            }
          });
          section.hidden = !sectionVisible;
        });
        const empty = document.querySelector(
          ".missions-filter-empty-state",
        ) as HTMLElement | null;
        if (empty) empty.hidden = visibleCards > 0;

        const visibleAfter = Array.from(
          document.querySelectorAll(
            ".missions-section-kind:not([hidden]) .mission-card:not([hidden])",
          ),
        ) as HTMLElement[];
        visibleAfter.forEach((card, idx) => {
          card.classList.remove("mission-card-view-switch");
          card.style.setProperty(
            "--mission-switch-delay",
            `${Math.min(idx, 10) * 18}ms`,
          );
        });
        requestAnimationFrame(() => {
          visibleAfter.forEach((card) =>
            card.classList.add("mission-card-view-switch"),
          );
          window.setTimeout(() => {
            visibleAfter.forEach((card) => {
              card.classList.remove("mission-card-view-switch");
              card.style.removeProperty("--mission-switch-delay");
            });
          }, 260);
        });
      },
    },
    {
      selector: DOM.missions.modeNormalBtn,
      eventType: "click",
      callback: () => {
        UiManager.renderMissionsScreen("normal");
      },
    },
    {
      selector: DOM.missions.modeEpicBtn,
      eventType: "click",
      callback: () => {
        const level = usePlayerCompanyStore.getState().companyLevel ?? 1;
        if (level < 2) return;
        usePlayerCompanyStore.getState().setMissionsResumeState("none", null);
        UiManager.renderMissionsScreen("epic");
      },
    },
    {
      selector: DOM.missions.modeCareerBtn,
      eventType: "click",
      callback: () => {
        const st = usePlayerCompanyStore.getState();
        st.setMissionsResumeState("career", null);
        UiManager.renderMissionsScreen("career");
      },
    },
    {
      selector: DOM.missions.modeDevBtn,
      eventType: "click",
      callback: () => {
        usePlayerCompanyStore.getState().setMissionsResumeState("none", null);
        UiManager.renderMissionsScreen("dev");
      },
    },
    {
      selector: DOM.missions.launchBtn,
      eventType: "click",
      callback: (e: Event) => {
        const btn = e.currentTarget as HTMLButtonElement;
        const missionId = btn.dataset.missionId;
        if (!missionId) return;
        const card = document.querySelector(`[data-mission-id="${missionId}"]`);
        const json = card?.getAttribute("data-mission-json");
        if (!json) return;
        const mission = JSON.parse(json) as Mission;
        console.log("Launch mission", mission);
        if (mission.id?.startsWith("onboarding_")) {
          usePlayerCompanyStore
            .getState()
            .setOnboardingFirstMissionPending(false);
        }
        if (mission.isDevTest) {
          UiManager.renderCombatScreen(mission);
          return;
        }
        UiManager.renderReadyRoomScreen(mission);
      },
    },
    {
      selector: DOM.missions.readMoreBtn,
      eventType: "click",
      callback: (e: Event) => {
        const btn = e.currentTarget as HTMLButtonElement;
        const desc = btn
          .closest(".mission-card-body")
          ?.querySelector(".mission-card-desc");
        const fullText = desc?.getAttribute("data-full-text");
        const popup = s_(DOM.missions.flavorPopup);
        const titleEl = popup?.querySelector(
          "#mission-flavor-popup-title",
        ) as HTMLElement;
        const textEl = popup?.querySelector(
          "#mission-flavor-popup-text",
        ) as HTMLElement;
        if (popup && titleEl && textEl && fullText) {
          const card = btn.closest(".mission-card");
          titleEl.textContent = (
            card?.querySelector(".mission-card-name")?.textContent ??
            "Mission Brief"
          ).trim();
          textEl.textContent = fullText;
          popup.removeAttribute("hidden");
        }
      },
    },
    {
      selector: DOM.missions.flavorPopupClose,
      eventType: "click",
      callback: () => {
        const popup = s_(DOM.missions.flavorPopup);
        if (popup) popup.setAttribute("hidden", "");
      },
    },
  ];

  const careerScreenEventConfig: HandlerInitConfig[] = [
    {
      selector: "#career-back-to-missions",
      eventType: "click",
      callback: () => {
        UiManager.renderMissionsScreen("menu");
      },
    },
    {
      selector: "#career-launch-next",
      eventType: "click",
      callback: () => {
        const store = usePlayerCompanyStore.getState();
        if (
          !isCareerUnlocked(store.company, !!store.onboardingFirstMissionPending)
        )
          return;
        const mission = createCareerMission(
          store.company,
          store.careerCurrentLevel ?? 1,
        );
        store.setMissionsResumeState("ready_room", mission);
        UiManager.renderReadyRoomScreen(mission);
      },
    },
  ];

  function combatScreenEventConfig(
    players: Combatant[],
    enemies: Combatant[],
  ): HandlerInitConfig[] {
    let grenadeTargetingMode: {
      thrower: Combatant;
      grenade: SoldierGrenade;
    } | null = null;
    let medTargetingMode: { user: Combatant; medItem: SoldierMedItem } | null =
      null;
    let suppressTargetingMode: { user: Combatant } | null = null;
    let combatStarted = false;
    let combatWinner: "player" | "enemy" | null = null;
    let popupCombatantId: string | null = null;
    const targets: TargetMap = new Map();
    const nextAttackAt = new Map<string, number>();
    const playerKills = new Map<string, number>();
    const playerDamage = new Map<string, number>();
    const playerDamageTaken = new Map<string, number>();
    const playerAbilitiesUsed = new Map<string, number>();
    const playerHealing = new Map<string, number>();
    const missionStatsBySoldier = new Map<
      string,
      {
        grenadeThrows: number;
        grenadeHits: number;
        turnsBelow20Hp: number;
      }
    >();
    for (const p of players) {
      playerKills.set(p.id, 0);
      playerDamage.set(p.id, 0);
      playerDamageTaken.set(p.id, 0);
      playerAbilitiesUsed.set(p.id, 0);
      playerHealing.set(p.id, 0);
      missionStatsBySoldier.set(p.id, {
        grenadeThrows: 0,
        grenadeHits: 0,
        turnsBelow20Hp: 0,
      });
    }
    const screen = document.getElementById("combat-screen");
    const missionJson = screen?.getAttribute("data-mission-json");
    let missionForCombat: Mission | null = null;
    if (missionJson) {
      try {
        missionForCombat = JSON.parse(
          missionJson.replace(/&quot;/g, '"'),
        ) as Mission;
      } catch {
        missionForCombat = null;
      }
    }
    const isDevTestCombat = Boolean(missionForCombat?.isDevTest);
    const isDefendObjectiveMission =
      missionForCombat?.kind === "defend_objective";
    const missionEncounter = missionForCombat?.encounter;
    const DEFEND_DURATION_MS = 120_000;
    const DEFEND_REINFORCE_INTERVAL_MS = Math.max(
      0,
      missionEncounter?.reinforceIntervalMs ??
        (isDefendObjectiveMission ? 30_000 : 0),
    );
    const DEFEND_REINFORCE_SETUP_MS = Math.max(
      0,
      missionEncounter?.reinforceSetupMs ?? 2_000,
    );
    const DEFEND_MAX_ENEMIES = Math.max(
      1,
      missionEncounter?.maxConcurrentEnemies ?? 8,
    );
    const MISSION_TOTAL_ENEMY_BUDGET = Math.max(
      enemies.length,
      missionEncounter?.totalEnemyCount ?? enemies.length,
    );
    const HAS_MISSION_REINFORCEMENTS =
      MISSION_TOTAL_ENEMY_BUDGET > enemies.length;
    const DEFEND_DEATH_NOTICE_MS = 1_000;
    const companyAbilityOwned = new Set(
      usePlayerCompanyStore.getState().companyAbilityUnlockedIds ?? [],
    );
    const companyPassives = getCompanyPassiveEffects(companyAbilityOwned);
    const TAKE_COVER_COOLDOWN_MS = Math.max(
      5_000,
      60_000 - companyPassives.takeCoverCooldownReductionMs,
    );
    const SUPPRESS_COOLDOWN_MS = Math.max(
      10_000,
      60_000 - companyPassives.supportSuppressCooldownReductionMs,
    );
    const DEFEND_WAVE_STAGGER_MIN_MS = 450;
    const DEFEND_WAVE_STAGGER_MAX_MS = 750;
    const defendTimerEl = document.getElementById("combat-objective-timer");
    const enemySlotRecycleQueue: number[] = [];
    const ENEMY_SLOT_ORDER = [0, 1, 2, 3, 5, 6, 4, 7];
    let reinforcementSerial = enemies.length;
    const allCombatants = [...players, ...enemies];
    const combatRoot = document.getElementById("combat-screen");
    combatRoot?.classList.add("combat-prestart");
    let focusedFireTargetId: string | null = null;
    let focusedFireUntil = 0;
    let companyAbilityTargetingMode: {
      abilityId: CompanyAbilityId;
    } | null = null;
    const companyAbilityCooldownUntil = new Map<CompanyAbilityId, number>();
    const companyAbilityUsesLeft = new Map<CompanyAbilityId, number>();
    const companyAbilityBarEl = document.getElementById(
      "combat-company-abilities-bar",
    ) as HTMLElement | null;
    let lastCompanyAbilityActivateAt = 0;
    let nextLowHpSampleAt = Date.now() + 1000;

    type CombatantDomRefs = {
      card: HTMLElement;
      hpBar: HTMLElement | null;
      hpValue: HTMLElement | null;
      avatarWrap: HTMLElement | null;
      spdBadge: HTMLElement | null;
      statusNodeCache: Map<string, HTMLElement>;
    };
    type CombatantUiSnapshot = {
      hp: number;
      maxHp: number;
      downState: Combatant["downState"] | null;
      inCover: boolean;
      smoked: boolean;
      stunned: boolean;
      panicked: boolean;
      burning: boolean;
      bleeding: boolean;
      stimmed: boolean;
      blinded: boolean;
      suppressed: boolean;
      settingUp: boolean;
      postCoverBuff: boolean;
      focusedFire: boolean;
      effectiveIntervalMs: number;
    };
    const combatantDomCache = new Map<string, CombatantDomRefs>();
    const combatantUiSnapshotCache = new Map<string, CombatantUiSnapshot>();
    const dirtyHpCombatantIds = new Set<string>();
    const dirtyStatusCombatantIds = new Set<string>();
    const dirtySpeedCombatantIds = new Set<string>();
    let nextTimedUiUpdateAt = 0;
    let lastAttackLineSignature = "";

    function createCombatantDomRefs(card: HTMLElement): CombatantDomRefs {
      return {
        card,
        hpBar: card.querySelector(".combat-card-hp-bar") as HTMLElement | null,
        hpValue: card.querySelector(
          ".combat-card-hp-value",
        ) as HTMLElement | null,
        avatarWrap: card.querySelector(
          ".combat-card-avatar-wrap",
        ) as HTMLElement | null,
        spdBadge: card.querySelector(
          ".combat-card-spd-badge",
        ) as HTMLElement | null,
        statusNodeCache: new Map<string, HTMLElement>(),
      };
    }

    function cacheCombatantCard(card: HTMLElement | null): void {
      if (!card) return;
      const id = card.dataset.combatantId;
      if (!id) return;
      combatantDomCache.set(id, createCombatantDomRefs(card));
    }

    function removeCombatantCardFromCache(id: string): void {
      combatantDomCache.delete(id);
      combatantUiSnapshotCache.delete(id);
      dirtyHpCombatantIds.delete(id);
      dirtyStatusCombatantIds.delete(id);
      dirtySpeedCombatantIds.delete(id);
    }

    function getCombatantDomRefs(id: string): CombatantDomRefs | null {
      const cached = combatantDomCache.get(id);
      if (cached?.card.isConnected) return cached;
      const card = document.querySelector(
        `[data-combatant-id="${id}"]`,
      ) as HTMLElement | null;
      if (!card) {
        removeCombatantCardFromCache(id);
        return null;
      }
      const refs = createCombatantDomRefs(card);
      combatantDomCache.set(id, refs);
      return refs;
    }

    function getCombatantCard(id: string): HTMLElement | null {
      return getCombatantDomRefs(id)?.card ?? null;
    }

    function primeCombatantDomCache(): void {
      document
        .querySelectorAll(".combat-card[data-combatant-id]")
        .forEach((node) => {
          cacheCombatantCard(node as HTMLElement);
        });
    }

    function markCombatantsDirty(
      combatantIds: Iterable<string>,
      flags: { hp?: boolean; status?: boolean; speed?: boolean } = {},
    ): void {
      const markHp = flags.hp ?? true;
      const markStatus = flags.status ?? true;
      const markSpeed = flags.speed ?? true;
      for (const id of combatantIds) {
        if (markHp) dirtyHpCombatantIds.add(id);
        if (markStatus) dirtyStatusCombatantIds.add(id);
        if (markSpeed) dirtySpeedCombatantIds.add(id);
      }
    }

    function markCombatantDirty(
      combatantId: string,
      flags: { hp?: boolean; status?: boolean; speed?: boolean } = {},
    ): void {
      markCombatantsDirty([combatantId], flags);
    }

    function markAllCombatantsDirty(
      flags: { hp?: boolean; status?: boolean; speed?: boolean } = {},
    ): void {
      markCombatantsDirty(
        allCombatants.map((c) => c.id),
        flags,
      );
    }

    const companyCombatAbilities = getCompanyActiveAbilities(companyAbilityOwned)
      .map((def) => def.id);
    for (const abilityId of companyCombatAbilities) {
      companyAbilityCooldownUntil.set(abilityId, 0);
      if (abilityId === "artillery_barrage" || abilityId === "napalm_barrage") {
        companyAbilityUsesLeft.set(abilityId, 1);
      }
    }

    function clearCompanyAbilityTargeting(): void {
      companyAbilityTargetingMode = null;
      document
        .querySelectorAll(".combat-company-ability-selected")
        .forEach((el) => el.classList.remove("combat-company-ability-selected"));
      document
        .querySelectorAll("#combat-enemies-grid .combat-card-grenade-target")
        .forEach((el) => el.classList.remove("combat-card-grenade-target"));
      const hintEl = document.getElementById("combat-targeting-hint");
      if (hintEl && !grenadeTargetingMode && !medTargetingMode && !suppressTargetingMode) {
        hintEl.textContent = "";
        hintEl.setAttribute("aria-hidden", "true");
      }
    }

    function renderCompanyAbilityBar(force = false): void {
      if (!companyAbilityBarEl) return;
      if (companyCombatAbilities.length <= 0) {
        companyAbilityBarEl.setAttribute("hidden", "");
        return;
      }
      companyAbilityBarEl.removeAttribute("hidden");
      const now = Date.now();
      const html = companyCombatAbilities
        .map((id) => {
          const def = COMPANY_ABILITY_DEFS[id];
          if (!def) return "";
          const onCooldownUntil = companyAbilityCooldownUntil.get(id) ?? 0;
          const onCooldown = onCooldownUntil > now;
          const remaining = onCooldown
            ? Math.ceil((onCooldownUntil - now) / 1000)
            : 0;
          const usesLeft = companyAbilityUsesLeft.get(id);
          const noUsesLeft = typeof usesLeft === "number" && usesLeft <= 0;
          const disabled = !!combatWinner || onCooldown || noUsesLeft;
          const selected =
            companyAbilityTargetingMode?.abilityId === id
              ? " combat-company-ability-selected"
              : "";
          return `<button type=\"button\" class=\"combat-company-ability-btn${selected}\" data-company-ability-id=\"${id}\" title=\"${def.name}\" ${disabled ? "disabled" : ""}>
            <img src=\"${def.icon}\" alt=\"\" width=\"60\" height=\"60\">
            <span class=\"combat-company-ability-name\">${def.name}</span>
            ${onCooldown ? `<span class=\"combat-company-ability-cd\">${remaining}</span>` : ""}
            ${typeof usesLeft === "number" ? `<span class=\"combat-company-ability-uses\">${usesLeft}</span>` : ""}
          </button>`;
        })
        .join("");
      if (force || companyAbilityBarEl.innerHTML !== html) {
        companyAbilityBarEl.innerHTML = html;
      }
    }

    function applyFocusedFireTargeting(now: number): void {
      if (!focusedFireTargetId || now >= focusedFireUntil) {
        const hadFocusedTarget = !!focusedFireTargetId;
        focusedFireTargetId = null;
        if (hadFocusedTarget) {
          for (const p of players) targets.delete(p.id);
          assignTargets(players, enemies, targets, now);
        }
        return;
      }
      const focusTarget = enemies.find(
        (e) =>
          e.id === focusedFireTargetId &&
          e.hp > 0 &&
          !e.downState &&
          (e.setupUntil ?? 0) <= now,
      );
      if (!focusTarget) {
        focusedFireTargetId = null;
        for (const p of players) targets.delete(p.id);
        assignTargets(players, enemies, targets, now);
        return;
      }
      for (const p of players) {
        if (p.hp <= 0 || p.downState || isInCover(p, now) || isStunned(p, now))
          continue;
        targets.set(p.id, focusTarget.id);
      }
    }

    function isFocusedFireTargetLocked(
      target: Combatant | undefined,
      now: number,
    ): boolean {
      return (
        !!target &&
        !!focusedFireTargetId &&
        target.id === focusedFireTargetId &&
        now < focusedFireUntil
      );
    }

    function roleBadge(designation: string | undefined): string {
      const d = (designation ?? "").toUpperCase();
      if (d === "RIFLEMAN") return "R";
      if (d === "SUPPORT") return "S";
      if (d === "MEDIC") return "M";
      return d[0] ?? "";
    }

    function enemyCardHtml(c: Combatant): string {
      const pct = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));
      const isDown = c.hp <= 0 || c.downState;
      const downClass = isDown ? " combat-card-down" : "";
      const des = (c.designation ?? "rifleman").toLowerCase();
      const epicEliteClass = c.isEpicElite ? " combat-card-epic-elite" : "";
      const manhuntTargetClass = c.isManhuntTarget
        ? " combat-card-manhunt-target"
        : "";
      const slotAttr =
        c.enemySlotIndex != null
          ? ` data-enemy-slot="${c.enemySlotIndex}"`
          : "";
      const weaponIcon = c.weaponIconUrl ?? "";
      const weaponHtml = weaponIcon
        ? `<img class="combat-card-weapon" src="${weaponIcon}" alt="" width="18" height="18">`
        : '<span class="combat-card-weapon combat-card-weapon-placeholder"></span>';
      const rb = roleBadge(c.designation);
      const spdMs = c.attackIntervalMs;
      const spdText =
        spdMs != null && spdMs > 0 ? `SPD: ${(spdMs / 1000).toFixed(1)}s` : "";
      const lvl = c.level ?? 1;
      const enemyPortraitDir = c.enemyPortraitDir ?? "red-portrait";
      const imgSrcResolved = `/images/${enemyPortraitDir}/${c.avatar}`;
      return `
<div class="combat-card designation-${des}${downClass}${epicEliteClass}${manhuntTargetClass}" data-combatant-id="${c.id}" data-side="enemy"${slotAttr}>
  <div class="combat-card-inner">
    <div class="combat-card-avatar-wrap">
      <span class="combat-card-level-badge">${lvl}</span>
      <img class="combat-card-avatar" src="${imgSrcResolved}" alt="">
      ${weaponHtml}
      ${rb ? `<span class="combat-card-role-badge">${rb}</span>` : ""}
    </div>
    <div class="combat-card-hp-wrap">
      <div class="combat-card-hp-bar" style="width: ${pct}%"></div>
      <span class="combat-card-hp-value">${Math.floor(c.hp)}/${Math.floor(c.maxHp)}</span>
    </div>
    <span class="combat-card-name">${formatDisplayName(c.name)}</span>
    ${spdText ? `<span class="combat-card-spd-badge">${spdText}</span>` : ""}
  </div>
</div>`;
    }

    const combatCardLastPointerUpAt = new WeakMap<HTMLElement, number>();

    function bindCombatCardInteraction(card: HTMLElement): void {
      const onPointerUp = (e: Event) => {
        const ev = e as PointerEvent;
        if (ev.pointerType === "mouse" && ev.button !== 0) return;
        combatCardLastPointerUpAt.set(card, Date.now());
        handleCombatCardClick(e, card);
      };
      const onClickFallback = (e: Event) => {
        const lastPointerUpAt = combatCardLastPointerUpAt.get(card) ?? 0;
        if (Date.now() - lastPointerUpAt < 400) return;
        handleCombatCardClick(e, card);
      };
      card.addEventListener("pointerup", onPointerUp);
      card.addEventListener("click", onClickFallback);
    }

    function insertEnemyCardBySlot(c: Combatant, fadeIn = false): void {
      const slot = c.enemySlotIndex ?? 0;
      const slotCell = document.querySelector(
        `.combat-enemy-slot[data-enemy-slot-cell="${slot}"]`,
      ) as HTMLElement | null;
      if (!slotCell) return;
      const t = document.createElement("template");
      t.innerHTML = enemyCardHtml(c).trim();
      const card = t.content.firstElementChild as HTMLElement | null;
      if (!card) return;
      slotCell.innerHTML = "";
      slotCell.appendChild(card);
      cacheCombatantCard(card);
      markCombatantDirty(c.id);
      bindCombatCardInteraction(card);
      if (fadeIn) {
        card.classList.add("animate__animated", "animate__fadeInDown");
        card.classList.add("combat-card-reinforce-arrival");
        window.setTimeout(() => {
          card.classList.remove("combat-card-reinforce-arrival");
          card.classList.remove("animate__animated", "animate__fadeInDown");
        }, 950);
      }
    }

    function getAliveEnemyCount(): number {
      return enemies.filter(
        (e) => e.hp > 0 && !e.downState && !e.removedFromCombat,
      ).length;
    }

    function isEnemySlotOpen(slot: number): boolean {
      if (slot < 0 || slot >= DEFEND_MAX_ENEMIES) return false;
      return !enemies.some(
        (e) => e.enemySlotIndex === slot && !e.removedFromCombat,
      );
    }

    function getNextOpenEnemySlot(): number | null {
      while (enemySlotRecycleQueue.length > 0) {
        const preferred = enemySlotRecycleQueue.shift();
        if (preferred == null) continue;
        if (isEnemySlotOpen(preferred)) return preferred;
      }
      for (const slot of ENEMY_SLOT_ORDER) {
        if (isEnemySlotOpen(slot)) return slot;
      }
      return null;
    }

    function updateDefendObjectiveTimer(
      now: number,
      defendEndAt: number,
    ): void {
      if (!defendTimerEl || !isDefendObjectiveMission) return;
      const remainingMs = Math.max(0, defendEndAt - now);
      const totalSec = Math.ceil(remainingMs / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      defendTimerEl.textContent = `Hold: ${mins}:${String(secs).padStart(2, "0")}`;
      defendTimerEl.classList.toggle(
        "combat-objective-timer-urgent",
        totalSec <= 30,
      );
      defendTimerEl.hidden = false;
    }

    function getSoldierFromStore(soldierId: string) {
      const company = usePlayerCompanyStore.getState().company;
      const storeSoldier =
        company?.soldiers?.find((s) => s.id === soldierId) ?? null;
      if (storeSoldier) return storeSoldier;
      const combatant = players.find((p) => p.id === soldierId);
      return combatant?.soldierRef ?? null;
    }

    function consumeCombatantItem(
      soldierId: string,
      inventoryIndex: number,
      type: "medical" | "throwable",
    ): void {
      const store = usePlayerCompanyStore.getState();
      const storeSoldier =
        store.company?.soldiers?.find((s) => s.id === soldierId) ?? null;
      if (storeSoldier) {
        if (type === "medical")
          store.consumeSoldierMedical(soldierId, inventoryIndex);
        else store.consumeSoldierThrowable(soldierId, inventoryIndex);
        return;
      }
      const combatant = players.find((p) => p.id === soldierId);
      const inv = combatant?.soldierRef?.inventory;
      if (!inv || inventoryIndex < 0 || inventoryIndex >= inv.length) return;
      const item = inv[inventoryIndex] as
        | { uses?: number; quantity?: number }
        | undefined;
      if (!item) return;
      const current = item.uses ?? item.quantity;
      if (typeof current === "number") {
        const next = Math.max(0, current - 1);
        if (item.uses != null) item.uses = next;
        if (item.quantity != null) item.quantity = next;
        if (next <= 0) inv.splice(inventoryIndex, 1);
        return;
      }
      inv.splice(inventoryIndex, 1);
    }

    function positionPopupUnderCard(
      popup: HTMLElement,
      card: HTMLElement | null,
    ) {
      const combatScreen = document.getElementById("combat-screen");
      if (!combatScreen || !card) {
        popup.style.left = "50%";
        popup.style.top = "";
        popup.style.bottom = "12%";
        popup.style.transform = "translate(-50%, 0)";
        return;
      }
      const screenRect = combatScreen.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();
      const gap = 4;
      let leftV = (cardRect.left + cardRect.right) / 2 - popupRect.width / 2;
      leftV = Math.max(
        screenRect.left + 12,
        Math.min(screenRect.right - popupRect.width - 12, leftV),
      );
      let topV = cardRect.bottom + gap;
      const spaceAbove = cardRect.top - screenRect.top;
      const spaceBelow = screenRect.bottom - cardRect.bottom;
      if (spaceBelow < popupRect.height + gap && spaceAbove > spaceBelow) {
        topV = cardRect.top - popupRect.height - gap;
      } else if (topV + popupRect.height > screenRect.bottom - 12) {
        topV = screenRect.bottom - popupRect.height - 12;
      }
      popup.style.left = `${leftV - screenRect.left}px`;
      popup.style.top = `${topV - screenRect.top}px`;
      popup.style.bottom = "";
      popup.style.transform = "none";
    }

    function clearPopupCardSelection() {
      document
        .querySelectorAll(".combat-card-latched, .combat-card-pressing")
        .forEach((el) => {
          el.classList.remove("combat-card-latched");
          el.classList.remove("combat-card-pressing");
        });
    }

    function openAbilitiesPopup(
      combatant: Combatant,
      card?: HTMLElement | null,
    ) {
      if (combatWinner || combatant.side !== "player") return;
      grenadeTargetingMode = null;
      medTargetingMode = null;
      suppressTargetingMode = null;
      document
        .querySelectorAll(".combat-card-grenade-target")
        .forEach((el) => el.classList.remove("combat-card-grenade-target"));
      document
        .querySelectorAll(".combat-card-heal-target")
        .forEach((el) => el.classList.remove("combat-card-heal-target"));
      document
        .querySelectorAll(".combat-ability-selected")
        .forEach((el) => el.classList.remove("combat-ability-selected"));
      const th = document.getElementById("combat-targeting-hint");
      if (th) {
        th.textContent = "";
        th.setAttribute("aria-hidden", "true");
      }
      const popup = document.getElementById("combat-abilities-popup");
      const contentEl = document.getElementById(
        "combat-abilities-popup-content",
      );
      const hintEl = document.getElementById("combat-abilities-popup-hint");
      const listEl = document.getElementById("combat-abilities-list");
      const titleEl = document.getElementById("combat-abilities-popup-title");
      if (!popup || !contentEl || !hintEl || !listEl || !titleEl) return;
      const popupEl = popup;
      const listElNode = listEl;
      let lastAbilitiesMarkup = "";

      const canUseCombatant = (c: Combatant) =>
        combatStarted && !combatWinner && !isStunned(c, Date.now());
      const soldier = getSoldierFromStore(combatant.id);
      let grenades: SoldierGrenade[] = [];
      let medItems: SoldierMedItem[] = [];
      if (soldier?.inventory) {
        grenades = getSoldierGrenades(soldier.inventory);
        medItems = getSoldierMedItems(soldier.inventory);
      }
      const equipmentSlots = [
        ...grenades.map((g) => ({ type: "grenade" as const, data: g })),
        ...medItems.map((m) => ({ type: "med" as const, data: m })),
      ].slice(0, 2);

      const now = Date.now();
      const takeCoverOnCooldown = (combatant.takeCoverCooldownUntil ?? 0) > now;
      const takeCoverRemainingSec = takeCoverOnCooldown
        ? Math.ceil((combatant.takeCoverCooldownUntil! - now) / 1000)
        : 0;
      const suppressOnCooldown = (combatant.suppressCooldownUntil ?? 0) > now;
      const suppressRemainingSec = suppressOnCooldown
        ? Math.ceil((combatant.suppressCooldownUntil! - now) / 1000)
        : 0;
      const designation = (combatant.designation ?? "").toLowerCase();
      const abilities = getSoldierAbilities().filter((a) => {
        if (a.designationRestrict) return designation === a.designationRestrict;
        return true;
      });
      const abilityButtons = abilities
        .map((a) => {
          const isTakeCover = a.actionId === "take_cover";
          const isSuppress = a.actionId === "suppress";
          const canUse = canUseCombatant(combatant);
          const disabled = isTakeCover
            ? !canUse || takeCoverOnCooldown
            : isSuppress
              ? !canUse || suppressOnCooldown
              : !canUse;
          const cooldownClass =
            (isTakeCover && takeCoverOnCooldown) ||
            (isSuppress && suppressOnCooldown)
              ? " combat-ability-cooldown"
              : "";
          const slotClass = a.slotClassName ? ` ${a.slotClassName}` : "";
          const timerHtml =
            isTakeCover && takeCoverOnCooldown
              ? `<span class="combat-ability-cooldown-timer" data-ability-cooldown="take_cover">${takeCoverRemainingSec}</span>`
              : isSuppress && suppressOnCooldown
                ? `<span class="combat-ability-cooldown-timer" data-ability-cooldown="suppress">${suppressRemainingSec}</span>`
                : "";
          const labelHtml = isTakeCover
            ? ""
            : `<span class="combat-ability-label">${a.name}</span>`;
          return `<button type="button" class="combat-ability-icon-slot${slotClass}${cooldownClass}" data-ability-id="${a.id}" data-soldier-id="${combatant.id}" ${disabled ? "disabled" : ""} title="${a.name}" aria-label="${a.name}">
            <img src="${a.icon}" alt="" width="48" height="48">
            ${timerHtml}
            ${labelHtml}
          </button>`;
        })
        .join("");

      function buildEquipmentHtml(c: Combatant) {
        const canUse = canUseCombatant(c);
        const eqNow = Date.now();
        const grenadeOnCooldown = (c.grenadeCooldownUntil ?? 0) > eqNow;
        const grenadeRemainingSec = grenadeOnCooldown
          ? Math.ceil((c.grenadeCooldownUntil! - eqNow) / 1000)
          : 0;
        return equipmentSlots
          .map((slot) => {
            if (slot.type === "grenade") {
              const g = slot.data;
              const isKnife = g.item.id === "tk21_throwing_knife";
              const qty = g.item.uses ?? g.item.quantity ?? 1;
              const rarity = g.item.rarity ?? "common";
              const iconUrl = getItemIconUrl(g.item);
              const hasUses = g.item.uses != null || g.item.quantity != null;
              const btnRarity = rarity !== "common" ? ` rarity-${rarity}` : "";
              const grenadeDisabled =
                !canUse || (!isKnife && grenadeOnCooldown);
              const cooldownClass =
                !isKnife && grenadeOnCooldown ? " combat-grenade-cooldown" : "";
              const timerHtml =
                !isKnife && grenadeOnCooldown
                  ? `<span class="combat-grenade-cooldown-timer">${grenadeRemainingSec}</span>`
                  : "";
              return `<button type="button" class="combat-grenade-item${btnRarity}${cooldownClass}" data-inventory-index="${g.inventoryIndex}" data-soldier-id="${c.id}" title="${g.item.name}" aria-label="${g.item.name}" ${grenadeDisabled ? "disabled" : ""}>
            <div class="combat-grenade-icon-wrap item-icon-wrap">
              <img class="combat-grenade-icon" src="${iconUrl}" alt="" width="48" height="48">
              ${renderItemLevelBadge(g.item)}
              ${hasUses ? `<span class="inventory-item-qty inventory-uses-badge">×${qty}</span>` : ""}
            </div>
            ${timerHtml}
          </button>`;
            } else {
              const m = slot.data;
              const qty = m.item.uses ?? m.item.quantity ?? 1;
              const rarity = m.item.rarity ?? "common";
              const iconUrl = getItemIconUrl(m.item);
              const hasUses = m.item.uses != null || m.item.quantity != null;
              const btnRarity = rarity !== "common" ? ` rarity-${rarity}` : "";
              return `<button type="button" class="combat-med-item${btnRarity}" data-inventory-index="${m.inventoryIndex}" data-soldier-id="${c.id}" title="${m.item.name}" aria-label="${m.item.name}" ${!canUse ? "disabled" : ""}>
            <div class="combat-grenade-icon-wrap item-icon-wrap">
              <img class="combat-grenade-icon" src="${iconUrl}" alt="" width="48" height="48">
              ${renderItemLevelBadge(m.item)}
              ${hasUses ? `<span class="inventory-item-qty inventory-uses-badge">×${qty}</span>` : ""}
            </div>
          </button>`;
            }
          })
          .join("");
      }

      const initialMarkup = abilityButtons + buildEquipmentHtml(combatant);
      listElNode.innerHTML = initialMarkup;
      lastAbilitiesMarkup = initialMarkup;

      function refreshAbilitiesList() {
        const c = players.find((p) => p.id === combatant.id);
        if (!c || popupEl.getAttribute("aria-hidden") === "true") return;
        if (
          grenadeTargetingMode ||
          medTargetingMode ||
          suppressTargetingMode ||
          companyAbilityTargetingMode
        )
          return;
        const now = Date.now();
        const takeCoverOnCooldown = (c.takeCoverCooldownUntil ?? 0) > now;
        const takeCoverRemainingSec = takeCoverOnCooldown
          ? Math.ceil((c.takeCoverCooldownUntil! - now) / 1000)
          : 0;
        const suppressOnCooldown = (c.suppressCooldownUntil ?? 0) > now;
        const suppressRemainingSec = suppressOnCooldown
          ? Math.ceil((c.suppressCooldownUntil! - now) / 1000)
          : 0;
        const des = (c.designation ?? "").toLowerCase();
        const abils = getSoldierAbilities().filter((a) => {
          if (a.designationRestrict) return des === a.designationRestrict;
          return true;
        });
        const btns = abils
          .map((a) => {
            const isTakeCover = a.actionId === "take_cover";
            const isSuppress = a.actionId === "suppress";
            const canUse = canUseCombatant(c);
            const disabled = isTakeCover
              ? !canUse || takeCoverOnCooldown
              : isSuppress
                ? !canUse || suppressOnCooldown
                : !canUse;
            const cooldownClass =
              (isTakeCover && takeCoverOnCooldown) ||
              (isSuppress && suppressOnCooldown)
                ? " combat-ability-cooldown"
                : "";
            const slotClass = a.slotClassName ? ` ${a.slotClassName}` : "";
            const timerHtml =
              isTakeCover && takeCoverOnCooldown
                ? `<span class="combat-ability-cooldown-timer" data-ability-cooldown="take_cover">${takeCoverRemainingSec}</span>`
                : isSuppress && suppressOnCooldown
                  ? `<span class="combat-ability-cooldown-timer" data-ability-cooldown="suppress">${suppressRemainingSec}</span>`
                  : "";
            const labelHtml = isTakeCover
              ? ""
              : `<span class="combat-ability-label">${a.name}</span>`;
            return `<button type="button" class="combat-ability-icon-slot${slotClass}${cooldownClass}" data-ability-id="${a.id}" data-soldier-id="${c.id}" ${disabled ? "disabled" : ""} title="${a.name}" aria-label="${a.name}">
            <img src="${a.icon}" alt="" width="48" height="48">
            ${timerHtml}
            ${labelHtml}
          </button>`;
          })
          .join("");
        const nextMarkup = btns + buildEquipmentHtml(c);
        if (nextMarkup !== lastAbilitiesMarkup) {
          listElNode.innerHTML = nextMarkup;
          lastAbilitiesMarkup = nextMarkup;
        }
      }

      titleEl.textContent = "Abilities";
      contentEl.style.display = "";
      hintEl.classList.remove("visible");
      hintEl.textContent = "";
      popupEl.classList.remove("combat-abilities-popup-hint-only");
      clearPopupCardSelection();
      const selectedCard = (card ??
        document.querySelector(
          `[data-combatant-id="${combatant.id}"]`,
        )) as HTMLElement | null;
      if (selectedCard) {
        selectedCard.classList.remove("combat-card-pressing");
        selectedCard.classList.add("combat-card-latched");
      }
      popupCombatantId = combatant.id;
      popupEl.setAttribute("aria-hidden", "false");
      refreshAbilitiesList();
      positionPopupUnderCard(popupEl, selectedCard);

      void popupEl.offsetHeight;

      if (abilitiesPopupRefreshIntervalId != null)
        clearInterval(abilitiesPopupRefreshIntervalId);
      abilitiesPopupRefreshIntervalId = setInterval(refreshAbilitiesList, 1000);
    }

    function clearSelectedHighlight() {
      document
        .querySelectorAll(".combat-ability-selected")
        .forEach((el) => el.classList.remove("combat-ability-selected"));
    }

    function highlightSelectedAbility(
      type: "grenade" | "med" | "ability",
      soldierId: string,
      inventoryIndex?: number,
      abilityId?: string,
    ) {
      clearSelectedHighlight();
      const popup = document.getElementById("combat-abilities-popup");
      if (!popup) return;
      let btn: HTMLElement | null = null;
      if (type === "grenade" || type === "med") {
        const sel =
          type === "grenade" ? ".combat-grenade-item" : ".combat-med-item";
        btn = popup.querySelector(
          `${sel}[data-soldier-id="${soldierId}"][data-inventory-index="${String(inventoryIndex)}"]`,
        ) as HTMLElement | null;
      } else {
        btn = popup.querySelector(
          `.combat-ability-icon-slot[data-soldier-id="${soldierId}"][data-ability-id="${abilityId ?? ""}"]`,
        ) as HTMLElement | null;
      }
      if (btn) btn.classList.add("combat-ability-selected");
    }

    function showGrenadeTargetingHint(
      thrower: Combatant,
      _grenade: SoldierGrenade,
    ) {
      const hintEl = document.getElementById("combat-targeting-hint");
      if (!hintEl) return;
      hintEl.textContent = "Click an enemy to throw";
      hintEl.setAttribute("aria-hidden", "false");
      highlightSelectedAbility("grenade", thrower.id, _grenade.inventoryIndex);
    }

    function showSuppressTargetingHint(user: Combatant) {
      const hintEl = document.getElementById("combat-targeting-hint");
      if (!hintEl) return;
      hintEl.textContent = "Click an enemy to suppress";
      hintEl.setAttribute("aria-hidden", "false");
      highlightSelectedAbility("ability", user.id, undefined, "suppress");
    }

    function showMedTargetingHint(user: Combatant, medItem: SoldierMedItem) {
      const hintEl = document.getElementById("combat-targeting-hint");
      if (!hintEl) return;
      hintEl.textContent = "Click ally to heal";
      hintEl.setAttribute("aria-hidden", "false");
      highlightSelectedAbility("med", user.id, medItem.inventoryIndex);
    }

    function hideTargetingHint() {
      const hintEl = document.getElementById("combat-targeting-hint");
      if (hintEl) {
        hintEl.textContent = "";
        hintEl.setAttribute("aria-hidden", "true");
      }
    }

    let abilitiesPopupRefreshIntervalId: ReturnType<typeof setInterval> | null =
      null;

    function closeAbilitiesPopup() {
      if (abilitiesPopupRefreshIntervalId != null) {
        clearInterval(abilitiesPopupRefreshIntervalId);
        abilitiesPopupRefreshIntervalId = null;
      }
      grenadeTargetingMode = null;
      medTargetingMode = null;
      suppressTargetingMode = null;
      popupCombatantId = null;
      document
        .querySelectorAll(".combat-card-grenade-target")
        .forEach((el) => el.classList.remove("combat-card-grenade-target"));
      document
        .querySelectorAll(".combat-card-heal-target")
        .forEach((el) => el.classList.remove("combat-card-heal-target"));
      clearSelectedHighlight();
      clearPopupCardSelection();
      clearCompanyAbilityTargeting();
      const popup = document.getElementById("combat-abilities-popup");
      if (popup) {
        popup.classList.remove("combat-abilities-popup-hint-only");
        popup.setAttribute("aria-hidden", "true");
      }
      hideTargetingHint();
    }

    const BULLET_ICON =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3E%3Cellipse cx='4' cy='4' rx='3.2' ry='1.2' fill='%23ffcc44' stroke='%23fff' stroke-width='0.4'/%3E%3C/svg%3E";

    function animateProjectile(
      attackerCard: Element,
      targetCard: Element,
      iconUrl: string,
      durationMs: number,
      size = 10,
      isGrenade = false,
    ) {
      const battleArea = document.querySelector("#combat-battle-area");
      const projectilesG = document.querySelector("#combat-projectiles-g");
      if (!battleArea || !projectilesG) return;
      const areaRect = battleArea.getBoundingClientRect();
      const toArea = (r: DOMRect) => ({
        left: r.left - areaRect.left,
        top: r.top - areaRect.top,
        right: r.right - areaRect.left,
        bottom: r.bottom - areaRect.top,
      });
      const ar = toArea(attackerCard.getBoundingClientRect());
      const tr = toArea(targetCard.getBoundingClientRect());
      const ax = (ar.left + ar.right) / 2;
      const ay = (ar.top + ar.bottom) / 2;
      const tx = (tr.left + tr.right) / 2;
      const ty = (tr.top + tr.bottom) / 2;
      const angle = Math.atan2(ty - ay, tx - ax);
      const deg = (angle * 180) / Math.PI;
      const img = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "image",
      );
      img.setAttribute("href", iconUrl);
      img.setAttribute("x", String(ax - size / 2));
      img.setAttribute("y", String(ay - size / 2));
      img.setAttribute("width", String(size));
      img.setAttribute("height", String(size));
      if (!isGrenade)
        img.setAttribute("transform", `rotate(${deg} ${ax} ${ay})`);
      if (isGrenade) img.classList.add("combat-projectile-grenade");
      projectilesG.appendChild(img);
      const tStart = performance.now();

      function tick(now: number) {
        const t = Math.min(1, (now - tStart) / durationMs);
        const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        const x = ax + (tx - ax) * eased;
        const y = ay + (ty - ay) * eased;
        img.setAttribute("x", String(x - size / 2));
        img.setAttribute("y", String(y - size / 2));
        if (!isGrenade)
          img.setAttribute("transform", `rotate(${deg} ${x} ${y})`);
        if (t < 1) requestAnimationFrame(tick);
        else img.remove();
      }

      requestAnimationFrame(tick);
    }

    function animateGrenadeProjectile(
      attackerCard: Element,
      targetCard: Element,
      iconUrl: string,
      durationMs: number,
    ) {
      animateProjectile(
        attackerCard,
        targetCard,
        iconUrl,
        durationMs,
        28,
        true,
      );
    }

    function playGrenadeImpactFX(
      impactTargetId: string,
      affectedTargetIds: string[],
      variant: "frag" | "incendiary" | "stun" | "smoke",
    ) {
      const battleArea = document.querySelector(
        "#combat-battle-area",
      ) as HTMLElement | null;
      const impactCard = getCombatantCard(impactTargetId) as HTMLElement | null;
      if (!battleArea || !impactCard) return;

      const areaRect = battleArea.getBoundingClientRect();
      const impactRect = impactCard.getBoundingClientRect();
      const cx = impactRect.left - areaRect.left + impactRect.width / 2;
      const cy = impactRect.top - areaRect.top + impactRect.height / 2;

      battleArea.classList.remove("combat-battle-area-grenade-kick");
      void battleArea.offsetWidth;
      battleArea.classList.add("combat-battle-area-grenade-kick");
      window.setTimeout(
        () => battleArea.classList.remove("combat-battle-area-grenade-kick"),
        280,
      );

      const fx = document.createElement("div");
      fx.className = `combat-grenade-impact-fx combat-grenade-impact-${variant}`;
      fx.style.left = `${cx}px`;
      fx.style.top = `${cy}px`;

      const core = document.createElement("span");
      core.className = "combat-grenade-impact-core";
      fx.appendChild(core);

      const ringA = document.createElement("span");
      ringA.className = "combat-grenade-impact-ring ring-a";
      fx.appendChild(ringA);
      const ringB = document.createElement("span");
      ringB.className = "combat-grenade-impact-ring ring-b";
      fx.appendChild(ringB);

      const crack = document.createElement("span");
      crack.className = "combat-grenade-impact-crack";
      fx.appendChild(crack);

      const shardCount = variant === "frag" ? 10 : 8;
      for (let i = 0; i < shardCount; i++) {
        const shard = document.createElement("span");
        shard.className = "combat-grenade-impact-shard";
        shard.style.setProperty(
          "--shard-angle",
          `${(360 / shardCount) * i}deg`,
        );
        shard.style.setProperty(
          "--shard-dist",
          `${50 + Math.round(Math.random() * 22)}px`,
        );
        shard.style.setProperty(
          "--shard-delay",
          `${Math.round(Math.random() * 45)}ms`,
        );
        fx.appendChild(shard);
      }

      battleArea.appendChild(fx);
      window.setTimeout(() => fx.remove(), 760);

      const uniqueTargets = Array.from(new Set(affectedTargetIds));
      uniqueTargets.forEach((id, idx) => {
        if (!shouldShowCombatFeedback(id)) return;
        const card = getCombatantCard(id) as HTMLElement | null;
        if (!card) return;
        window.setTimeout(() => {
          card.classList.remove("combat-card-grenade-jolt");
          void card.offsetWidth;
          card.classList.add("combat-card-grenade-jolt");
          window.setTimeout(
            () => card.classList.remove("combat-card-grenade-jolt"),
            250,
          );
        }, 22 * idx);
      });
    }

    function getCombatantById(id: string): Combatant | undefined {
      return allCombatants.find((c) => c.id === id);
    }

    function isCombatantDownNow(id: string): boolean {
      const c = getCombatantById(id);
      return c == null || c.hp <= 0 || Boolean(c.downState);
    }

    function shouldShowCombatFeedback(id: string): boolean {
      return !isCombatantDownNow(id);
    }

    function updateCombatCardDownBadge(card: Element, c: Combatant): void {
      const existing = card.querySelector(".combat-card-down-state");
      const isDown = Boolean(c.hp <= 0 || c.downState);
      if (!isDown) {
        existing?.remove();
        return;
      }
      const label = c.downState === "incapacitated" ? "INCAP" : "KIA";
      const cls =
        c.downState === "incapacitated"
          ? "combat-card-down-incap"
          : "combat-card-down-kia";
      if (existing) {
        existing.textContent = label;
        (existing as HTMLElement).className = `combat-card-down-state ${cls}`;
        return;
      }
      const badge = document.createElement("span");
      badge.className = `combat-card-down-state ${cls}`;
      badge.textContent = label;
      const avatarWrap = card.querySelector(".combat-card-avatar-wrap");
      if (avatarWrap) avatarWrap.appendChild(badge);
      else card.appendChild(badge);
    }

    function executeMedicalUse(
      user: Combatant,
      target: Combatant,
      medItem: SoldierMedItem,
    ) {
      if (user.hp <= 0 || user.downState || isStunned(user, Date.now())) return;
      playerAbilitiesUsed.set(
        user.id,
        (playerAbilitiesUsed.get(user.id) ?? 0) + 1,
      );
      const isStimPack = medItem.item.id === "stim_pack";
      consumeCombatantItem(user.id, medItem.inventoryIndex, "medical");
      medTargetingMode = null;
      document
        .querySelectorAll(".combat-card-heal-target")
        .forEach((el) => el.classList.remove("combat-card-heal-target"));
      closeAbilitiesPopup();

      if (isStimPack) {
        const now = Date.now();
        const eff = medItem.item.effect as
          | { duration?: number; effect_value?: number }
          | undefined;
        const durationSec = eff?.duration ?? 10;
        const multiplier = eff?.effect_value ?? 2 / 3;
        target.attackSpeedBuffUntil = now + durationSec * 1000;
        target.attackSpeedBuffMultiplier = multiplier;
        const oldDue = nextAttackAt.get(target.id) ?? now;
        const remaining = Math.max(0, oldDue - now);
        nextAttackAt.set(target.id, now + remaining * multiplier);
        const card = getCombatantCard(target.id);
        if (card) {
          const popup = document.createElement("span");
          popup.className = "combat-heal-popup";
          popup.textContent = "+50% SPD";
          card.appendChild(popup);
          setTimeout(() => popup.remove(), 1500);
        }
        markCombatantDirty(target.id, { hp: false, status: true, speed: true });
      } else {
        const isMedic = (user.designation ?? "").toLowerCase() === "medic";
        const baseHeal =
          (
            medItem.item as {
              effect?: { effect_value?: number };
            }
          ).effect?.effect_value ?? 20;
        let healAmount: number;
        if (medItem.item.id === "standard_medkit") {
          const itemLevel = (medItem.item as { level?: number }).level ?? 1;
          const medkitHeals = getMedKitHealValues(itemLevel);
          healAmount = isMedic ? medkitHeals.medic : medkitHeals.nonMedic;
          if (isMedic) {
            const medicAwareness =
              user.soldierRef?.attributes?.awareness ?? 0;
            const awrBonusPct = getMedicAwarenessHealBonusPct(
              medicAwareness,
            );
            if (awrBonusPct > 0) {
              healAmount = Math.round(healAmount * (1 + awrBonusPct));
            }
          }
        } else {
          healAmount = baseHeal;
        }
        const userWeaponEffect = user.weaponEffect as
          | keyof typeof WEAPON_EFFECTS
          | undefined;
        const medkitHealPercent = userWeaponEffect
          ? (WEAPON_EFFECTS[userWeaponEffect]?.modifiers?.medkitHealPercent ??
            0)
          : 0;
        if (medkitHealPercent > 0) {
          healAmount = Math.round(healAmount * (1 + medkitHealPercent));
        }
        const newHp = Math.min(
          target.maxHp,
          Math.floor(target.hp) + healAmount,
        );
        const healedAmount = Math.max(0, newHp - Math.floor(target.hp));
        target.hp = newHp;
        if (target.downState === "incapacitated") delete target.downState;
        if (isMedic && healedAmount > 0) {
          playerHealing.set(
            user.id,
            (playerHealing.get(user.id) ?? 0) + healedAmount,
          );
        }
        const card = getCombatantCard(target.id);
        if (card) {
          spawnCombatPopup(card, "combat-heal-popup", `+${healAmount}`, 1500);
        }
        markCombatantDirty(target.id, { hp: true, status: true, speed: false });
      }
      updateCombatUI(true);
    }

    function executeEnemyMedicUse(user: Combatant, target: Combatant): boolean {
      if ((user.designation ?? "").toLowerCase() !== "medic") return false;
      if (isStunned(user, Date.now())) return false;
      const uses = user.enemyMedkitUses ?? 0;
      if (uses <= 0 || target.hp <= 0 || target.downState) return false;

      // Enemy medic uses medkit tier scaling (supports post-20 medkits too).
      const medLevel = Math.max(
        1,
        Math.min(999, user.enemyMedkitLevel ?? user.level ?? 1),
      );
      const healAmount = getMedKitHealValues(medLevel).medic;
      const newHp = Math.min(target.maxHp, Math.floor(target.hp) + healAmount);
      if (newHp <= target.hp) return false;

      target.hp = newHp;
      if (target.downState === "incapacitated") delete target.downState;
      user.enemyMedkitUses = Math.max(0, uses - 1);

      const card = getCombatantCard(target.id);
      if (card) {
        spawnCombatPopup(card, "combat-heal-popup", `+${healAmount}`, 1500);
      }
      markCombatantDirty(target.id, { hp: true, status: true, speed: false });
      return true;
    }

    function applyAutoAttackHitFlash(targetCard: Element, target: Combatant) {
      targetCard.classList.add("combat-card-weapon-hit-flash");
      setTimeout(
        () => targetCard.classList.remove("combat-card-weapon-hit-flash"),
        180,
      );

      const sideClass =
        target.side === "player"
          ? "combat-card-hit-flash-player"
          : "combat-card-hit-flash-enemy";
      targetCard.classList.add(sideClass);
      setTimeout(() => targetCard.classList.remove(sideClass), 220);
    }

    function applyCriticalHitImpact(targetCard: HTMLElement): void {
      targetCard.classList.add("combat-card-crit-shake");
      setTimeout(
        () => targetCard.classList.remove("combat-card-crit-shake"),
        260,
      );
    }

    function spawnCombatPopup(
      card: HTMLElement,
      className: string,
      text: string,
      durationMs = 1500,
    ): void {
      const popup = document.createElement("span");
      popup.className = className;
      popup.textContent = text;
      card.appendChild(popup);
      window.setTimeout(() => popup.remove(), durationMs);
    }

    function spawnCriticalPopup(
      card: HTMLElement,
      damage: number,
      durationMs = 1300,
    ): void {
      const popup = document.createElement("span");
      popup.className = "combat-damage-popup combat-critical-popup";
      popup.innerHTML = `<span class="combat-critical-label">CRIT</span><span class="combat-critical-value">${damage}</span>`;
      card.appendChild(popup);
      window.setTimeout(() => popup.remove(), durationMs);
    }

    const SUPPRESS_DURATION_MS = 8000;
    const SUPPRESS_BURST_INTERVAL_MS = 500;
    const ATTACK_PROJECTILE_MS = 220;

    function executeSuppress(
      user: Combatant,
      target: Combatant,
      opts?: { fromEnemyAi?: boolean },
    ) {
      const now = Date.now();
      if (user.hp <= 0 || user.downState || isStunned(user, now)) return;
      if (user.side === "player") {
        playerAbilitiesUsed.set(
          user.id,
          (playerAbilitiesUsed.get(user.id) ?? 0) + 1,
        );
      }
      const suppressCdMs =
        user.side === "player" ? SUPPRESS_COOLDOWN_MS : 60_000;
      user.suppressCooldownUntil = now + suppressCdMs;
      if (!opts?.fromEnemyAi) {
        suppressTargetingMode = null;
        document
          .querySelectorAll("#combat-enemies-grid .combat-card-grenade-target")
          .forEach((el) => el.classList.remove("combat-card-grenade-target"));
        closeAbilitiesPopup();
      }

      const attackerCard = getCombatantCard(user.id);
      const targetCard = getCombatantCard(target.id);
      if (!attackerCard || !targetCard) return;

      let anyHit = false;
      const doBurst = () => {
        if (target.hp <= 0 || target.downState) return;
        const burstNow = Date.now();
        const result = resolveAttack(user, target, burstNow);
        if (result.hit && !result.evaded) anyHit = true;
        animateProjectile(
          attackerCard,
          targetCard,
          BULLET_ICON,
          ATTACK_PROJECTILE_MS,
          10,
        );
        if (result.damage > 0 && shouldShowCombatFeedback(target.id)) {
          if (result.critical) {
            spawnCriticalPopup(targetCard, result.damage, 1300);
          } else {
            const popup = document.createElement("span");
            popup.className = "combat-damage-popup combat-suppress-damage-popup";
            popup.textContent = String(result.damage);
            targetCard.appendChild(popup);
            setTimeout(() => popup.remove(), 1500);
          }
          if (result.critical) {
            applyCriticalHitImpact(targetCard);
          } else {
            targetCard.classList.add("combat-card-shake");
            setTimeout(
              () => targetCard.classList.remove("combat-card-shake"),
              350,
            );
          }
        } else if (
          result.hit &&
          result.evaded &&
          shouldShowCombatFeedback(target.id)
        ) {
          const popup = document.createElement("span");
          popup.className = "combat-evade-popup";
          popup.textContent = "Evade";
          targetCard.appendChild(popup);
          setTimeout(() => popup.remove(), 1500);
        } else if (!result.hit && shouldShowCombatFeedback(target.id)) {
          const popup = document.createElement("span");
          popup.className = "combat-miss-popup";
          popup.textContent = "MISS";
          targetCard.appendChild(popup);
          setTimeout(() => popup.remove(), 2200);
        }
        if (target.hp <= 0) {
          target.downState =
            target.side === "player" &&
            Math.random() < getIncapacitationChance(target)
              ? "incapacitated"
              : "kia";
          if (target.downState === "kia") target.killedBy = user.name;
          clearCombatantEffectsOnDeath(target);
          markCombatantDirty(target.id);
        }
        markCombatantDirty(target.id);
      };

      doBurst();
      setTimeout(() => doBurst(), SUPPRESS_BURST_INTERVAL_MS);
      setTimeout(() => {
        doBurst();
        if (
          anyHit &&
          target.hp > 0 &&
          !target.downState &&
          !target.immuneToSuppression
        ) {
          const applyNow = Date.now();
          target.suppressedUntil = applyNow + SUPPRESS_DURATION_MS;
          const popup = document.createElement("span");
          popup.className = "combat-suppress-popup";
          popup.textContent = "Suppressed";
          targetCard.appendChild(popup);
          setTimeout(() => popup.remove(), 1500);
          markCombatantDirty(target.id, {
            hp: false,
            status: true,
            speed: false,
          });
        }
        if (user.side === "enemy") {
          user.enemySuppressUses = Math.max(
            0,
            (user.enemySuppressUses ?? 0) - 1,
          );
        }
        updateCombatUI();
      }, SUPPRESS_BURST_INTERVAL_MS * 2);
    }

    const GRENADE_COOLDOWN_MS = 5000;

    function executeGrenadeThrow(
      thrower: Combatant,
      target: Combatant,
      grenade: SoldierGrenade,
      options?: {
        consumeThrowable?: boolean;
        trackPlayerStats?: boolean;
        targetPool?: Combatant[];
        resetTargetingUi?: boolean;
      },
    ) {
      if (thrower.hp <= 0 || thrower.downState || isStunned(thrower, Date.now())) {
        if (options?.resetTargetingUi !== false) closeAbilitiesPopup();
        return;
      }
      const consumeThrowable = options?.consumeThrowable ?? true;
      const trackPlayerStats = options?.trackPlayerStats ?? true;
      const resetTargetingUi = options?.resetTargetingUi ?? true;
      if (trackPlayerStats) {
        const ms = missionStatsBySoldier.get(thrower.id);
        if (ms) ms.grenadeThrows += 1;
      }
      const isThrowingKnife = grenade.item.id === "tk21_throwing_knife";
      if (!isThrowingKnife)
        thrower.grenadeCooldownUntil = Date.now() + GRENADE_COOLDOWN_MS;

      const throwerCard = getCombatantCard(thrower.id);
      const targetCard = getCombatantCard(target.id);

      if (throwerCard && targetCard) {
        const iconUrl = getItemIconUrl(grenade.item);
        animateGrenadeProjectile(throwerCard, targetCard, iconUrl, 350);
      }

      const showDamage = (id: string, damage: number) => {
        if (!shouldShowCombatFeedback(id)) return;
        const card = getCombatantCard(id);
        if (card && damage > 0) {
          const popup = document.createElement("span");
          popup.className = isThrowingKnife
            ? "combat-damage-popup combat-knife-damage-popup"
            : "combat-damage-popup combat-grenade-damage-popup";
          popup.textContent = String(damage);
          card.appendChild(popup);
          setTimeout(() => popup.remove(), 1500);
          card.classList.add("combat-card-shake");
          setTimeout(() => card.classList.remove("combat-card-shake"), 350);
        }
      };

      const showEvaded = (id: string, isKnife: boolean) => {
        if (!shouldShowCombatFeedback(id)) return;
        const card = getCombatantCard(id);
        if (!card) return;
        const popup = document.createElement("span");
        popup.className = "combat-throw-evaded-popup";
        popup.textContent = isKnife ? "Knife evaded" : "Grenade evaded";
        card.appendChild(popup);
        setTimeout(() => popup.remove(), 2200);
      };

      const showThrowMiss = (id: string, isKnife: boolean) => {
        if (!shouldShowCombatFeedback(id)) return;
        const card = getCombatantCard(id);
        if (!card) return;
        const popup = document.createElement("span");
        popup.className = "combat-throw-miss-popup";
        popup.textContent = isKnife ? "Knife missed" : "Grenade missed";
        card.appendChild(popup);
        setTimeout(() => popup.remove(), 2200);
      };

      const showSmokeEffect = (id: string, pct: number) => {
        if (!shouldShowCombatFeedback(id)) return;
        const card = getCombatantCard(id);
        if (card) {
          const popup = document.createElement("span");
          popup.className = "combat-smoke-popup";
          popup.textContent = `-${pct}%`;
          card.appendChild(popup);
          setTimeout(() => popup.remove(), 1500);
        }
      };

      type GrenadeOverlayType =
        | "explosion"
        | "throwing-knife"
        | "stun"
        | "incendiary";
      const addGrenadeOverlay = (
        targetCard: Element,
        overlayType: GrenadeOverlayType,
      ) => {
        const classes: Record<GrenadeOverlayType, string> = {
          explosion: "combat-explosion-overlay",
          "throwing-knife": "combat-throwing-knife-overlay",
          stun: "combat-stun-overlay",
          incendiary: "combat-incendiary-overlay",
        };
        const el = document.createElement("div");
        el.className = classes[overlayType];
        targetCard.appendChild(el);
        setTimeout(() => el.remove(), 350);
      };

      setTimeout(() => {
        const aliveTargetPool = (options?.targetPool ?? enemies).filter(
          (c) => c.hp > 0 && !c.downState,
        );
        const impactPrimaryTarget =
          target.hp > 0 && !target.downState
            ? target
            : aliveTargetPool.length > 0
              ? aliveTargetPool[0]
              : null;
        if (!impactPrimaryTarget) {
          if (consumeThrowable) {
            consumeCombatantItem(
              thrower.id,
              grenade.inventoryIndex,
              "throwable",
            );
          }
          if (resetTargetingUi) {
            grenadeTargetingMode = null;
            document
              .querySelectorAll(".combat-card-grenade-target")
              .forEach((el) =>
                el.classList.remove("combat-card-grenade-target"),
              );
            closeAbilitiesPopup();
          }
          return;
        }
        const result = resolveGrenadeThrow(
          thrower,
          impactPrimaryTarget,
          (() => {
            const baseItem = grenade.item;
            if (thrower.side !== "player") return baseItem;
            const tags = (baseItem.tags as string[] | undefined) ?? [];
            const isFrag = tags.includes("explosive");
            const isIncendiary = baseItem.id === "incendiary_grenade";
            if (!isFrag && !isIncendiary) return baseItem;
            const boosted = { ...baseItem };
            if (typeof boosted.damage === "number") {
              boosted.damage = Math.ceil(
                boosted.damage * companyPassives.playerGrenadeDamageMultiplier,
              );
            }
            return boosted;
          })(),
          aliveTargetPool,
        );
        const impactTargetCard = getCombatantCard(result.primary.targetId);
        const isThrowingKnife = grenade.item.id === "tk21_throwing_knife";
        const isStun =
          (grenade.item.tags as string[] | undefined)?.includes("stun") ||
          grenade.item.id === "m84_flashbang";
        const isIncendiary = grenade.item.id === "incendiary_grenade";
        const isFrag = (grenade.item.tags as string[] | undefined)?.includes(
          "explosive",
        );
        const isSmoke =
          (grenade.item.tags as string[] | undefined)?.includes("smoke") ||
          grenade.item.id === "mk18_smoke";
        const overlayType: GrenadeOverlayType = isThrowingKnife
          ? "throwing-knife"
          : isStun
            ? "stun"
            : isIncendiary
              ? "incendiary"
              : "explosion";
        if (
          impactTargetCard &&
          shouldShowCombatFeedback(result.primary.targetId)
        )
          addGrenadeOverlay(impactTargetCard, overlayType);
        for (const s of result.splash) {
          if (!s.evaded && s.hit) {
            const splashCard = getCombatantCard(s.targetId);
            if (splashCard && shouldShowCombatFeedback(s.targetId))
              addGrenadeOverlay(splashCard, overlayType);
          }
        }
        const flashHit = (id: string) => {
          const card = getCombatantCard(id);
          if (!card) return;
          if (isThrowingKnife) {
            card.classList.add("combat-card-knife-hit-flash");
            setTimeout(
              () => card.classList.remove("combat-card-knife-hit-flash"),
              500,
            );
          } else {
            card.classList.add("combat-card-grenade-hit-flash");
            setTimeout(
              () => card.classList.remove("combat-card-grenade-hit-flash"),
              450,
            );
          }
        };
        const shakeTargetCard = (id: string) => {
          const card = getCombatantCard(id);
          if (card) {
            card.classList.add("combat-card-shake");
            setTimeout(() => card.classList.remove("combat-card-shake"), 400);
          }
        };
        if (result.primary.hit && !result.primary.evaded) {
          if (shouldShowCombatFeedback(result.primary.targetId)) {
            flashHit(result.primary.targetId);
            shakeTargetCard(result.primary.targetId);
          }
        }
        for (const s of result.splash) {
          if (s.hit && !s.evaded) {
            if (shouldShowCombatFeedback(s.targetId)) {
              flashHit(s.targetId);
              shakeTargetCard(s.targetId);
            }
          }
        }
        if (
          impactTargetCard &&
          isFrag &&
          result.primary.damageDealt > 0 &&
          shouldShowCombatFeedback(result.primary.targetId)
        ) {
          impactTargetCard.classList.add("combat-card-frag-flash");
          setTimeout(
            () => impactTargetCard.classList.remove("combat-card-frag-flash"),
            150,
          );
        }
        if (!isThrowingKnife) {
          const affectedForJolt: string[] = [];
          if (result.primary.hit && !result.primary.evaded)
            affectedForJolt.push(result.primary.targetId);
          for (const s of result.splash) {
            if (s.hit && !s.evaded) affectedForJolt.push(s.targetId);
          }
          const impactVariant: "frag" | "incendiary" | "stun" | "smoke" =
            isIncendiary
              ? "incendiary"
              : isStun
                ? "stun"
                : isSmoke
                  ? "smoke"
                  : "frag";
          playGrenadeImpactFX(
            result.primary.targetId,
            affectedForJolt,
            impactVariant,
          );
        }
        if (!result.primary.hit)
          showThrowMiss(result.primary.targetId, isThrowingKnife);
        else if (result.primary.evaded)
          showEvaded(result.primary.targetId, isThrowingKnife);
        else if (isSmoke && result.primary.hit)
          showSmokeEffect(result.primary.targetId, 40);
        else if (result.primary.damageDealt > 0)
          showDamage(result.primary.targetId, result.primary.damageDealt);
        for (const s of result.splash) {
          if (s.evaded) showEvaded(s.targetId, isThrowingKnife);
          else if (isSmoke && s.hit) showSmokeEffect(s.targetId, 10);
          else if (s.damageDealt > 0) showDamage(s.targetId, s.damageDealt);
        }
        if (consumeThrowable) {
          consumeCombatantItem(thrower.id, grenade.inventoryIndex, "throwable");
        }
        if (resetTargetingUi) {
          grenadeTargetingMode = null;
          document
            .querySelectorAll(".combat-card-grenade-target")
            .forEach((el) => el.classList.remove("combat-card-grenade-target"));
          closeAbilitiesPopup();
        }
        const affectedIds = new Set<string>([
          thrower.id,
          result.primary.targetId,
        ]);
        for (const s of result.splash) affectedIds.add(s.targetId);
        markCombatantsDirty(affectedIds);
        updateCombatUI(true);

        let killsFromGrenade = 0;
        if (result.primary.targetDown) killsFromGrenade++;
        for (const s of result.splash) {
          if (s.targetDown) killsFromGrenade++;
        }
        if (trackPlayerStats) {
          playerAbilitiesUsed.set(
            thrower.id,
            (playerAbilitiesUsed.get(thrower.id) ?? 0) + 1,
          );
          const hitCount =
            (result.primary.hit && !result.primary.evaded ? 1 : 0) +
            result.splash.filter((s) => s.hit && !s.evaded).length;
          if (hitCount > 0) {
            const ms = missionStatsBySoldier.get(thrower.id);
            if (ms) ms.grenadeHits += hitCount;
          }
          if (killsFromGrenade > 0) {
            playerKills.set(
              thrower.id,
              (playerKills.get(thrower.id) ?? 0) + killsFromGrenade,
            );
          }
          const grenadeDmg =
            result.primary.damageDealt +
            result.splash.reduce((a, s) => a + s.damageDealt, 0);
          if (grenadeDmg > 0) {
            playerDamage.set(
              thrower.id,
              (playerDamage.get(thrower.id) ?? 0) + grenadeDmg,
            );
          }
        }
      }, 400);
    }

    const LINE_OFFSET_PX = 3; /* 2 × 3 = 6px between parallel lines for mutual fire */

    function drawAttackLines(force = false) {
      const battleArea = document.querySelector("#combat-battle-area");
      const linesG = document.querySelector("#combat-attack-lines-g");
      if (!battleArea || !linesG) return;
      const areaRect = battleArea.getBoundingClientRect();
      const toArea = (r: DOMRect) => ({
        left: r.left - areaRect.left,
        top: r.top - areaRect.top,
        right: r.right - areaRect.left,
        bottom: r.bottom - areaRect.top,
        width: r.width,
        height: r.height,
      });
      const combatantRectCache = new Map<string, ReturnType<typeof toArea>>();
      const getRectById = (id: string) => {
        const cached = combatantRectCache.get(id);
        if (cached) return cached;
        const refs = getCombatantDomRefs(id);
        const card = refs?.card ?? null;
        if (!card) return null;
        const r = toArea(card.getBoundingClientRect());
        combatantRectCache.set(id, r);
        return r;
      };
      const getTopCenter = (id: string) => {
        const r = getRectById(id);
        if (!r) return null;
        return { x: (r.left + r.right) / 2, y: r.top };
      };
      const getBottomCenter = (id: string) => {
        const r = getRectById(id);
        if (!r) return null;
        return { x: (r.left + r.right) / 2, y: r.bottom };
      };
      const getCombatant = (id: string) =>
        allCombatants.find((c) => c.id === id);
      const isAlive = (c: Combatant) => c.hp > 0 && !c.downState;
      const isSupport = (c: Combatant) =>
        (c.designation ?? "").toLowerCase() === "support";

      const segments: {
        attackerId: string;
        targetId: string;
        attackerSide: "player" | "enemy";
      }[] = [];
      for (const [attackerId, targetId] of targets) {
        const attacker = getCombatant(attackerId);
        const target = getCombatant(targetId);
        if (!attacker || !target || !isAlive(attacker) || !isAlive(target))
          continue;
        segments.push({
          attackerId,
          targetId,
          attackerSide: attacker.side,
        });
      }
      const signature = segments
        .map((s) => `${s.attackerId}>${s.targetId}`)
        .sort()
        .join("|");
      if (!force && signature === lastAttackLineSignature) return;
      lastAttackLineSignature = signature;
      linesG.textContent = "";
      const frag = document.createDocumentFragment();

      const pairKey = (a: string, b: string) =>
        a < b ? `${a}|${b}` : `${b}|${a}`;
      const pairCounts = new Map<string, number>();
      for (const s of segments) {
        const key = pairKey(s.attackerId, s.targetId);
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
      const pairIndices = new Map<string, number>();
      for (const s of segments) {
        const key = pairKey(s.attackerId, s.targetId);
        const idx = pairIndices.get(key) ?? 0;
        pairIndices.set(key, idx + 1);
        const attacker = getCombatant(s.attackerId);
        const target = getCombatant(s.targetId);
        const ac =
          attacker?.side === "player"
            ? getTopCenter(s.attackerId)
            : getBottomCenter(s.attackerId);
        const tc =
          target?.side === "player"
            ? getTopCenter(s.targetId)
            : getBottomCenter(s.targetId);
        if (!ac || !tc) continue;
        const dx = tc.x - ac.x;
        const dy = tc.y - ac.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) continue;
        const canonical = s.attackerId < s.targetId ? 1 : -1;
        const perpX = (-dy / len) * canonical;
        const perpY = (dx / len) * canonical;
        const mutualCount = pairCounts.get(key) ?? 1;
        const myIdx = pairIndices.get(key)! - 1;
        const offset =
          mutualCount > 1
            ? myIdx === 0
              ? -LINE_OFFSET_PX
              : LINE_OFFSET_PX
            : 0;
        const x1 = ac.x + perpX * offset;
        const y1 = ac.y + perpY * offset;
        const x2 = tc.x + perpX * offset;
        const y2 = tc.y + perpY * offset;
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        line.setAttribute("x1", String(x1));
        line.setAttribute("y1", String(y1));
        line.setAttribute("x2", String(x2));
        line.setAttribute("y2", String(y2));
        const isPlayer = s.attackerSide === "player";
        const isSupportAttacker = attacker != null && isSupport(attacker);
        line.setAttribute(
          "stroke",
          isPlayer ? "rgba(100, 200, 100, 0.6)" : "rgba(220, 80, 80, 0.6)",
        );
        line.setAttribute("stroke-width", isSupportAttacker ? "3" : "1");
        if (!isSupportAttacker) line.setAttribute("stroke-dasharray", "4 6");
        line.setAttribute(
          "marker-end",
          isPlayer ? "url(#combat-arrow-player)" : "url(#combat-arrow-enemy)",
        );
        line.setAttribute("stroke-linecap", "round");
        frag.appendChild(line);
      }
      linesG.appendChild(frag);
    }

    function updateHpBarsAll(force = false) {
      const domWrites: Array<() => void> = [];
      for (const c of allCombatants) {
        if (!force && !dirtyHpCombatantIds.has(c.id)) continue;
        const refs = getCombatantDomRefs(c.id);
        if (!refs) continue;
        const pct = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));
        const hpText = `${Math.floor(c.hp)}/${Math.floor(c.maxHp)}`;
        const isDown = Boolean(c.hp <= 0 || c.downState);
        const isLowHealth =
          c.side === "player" &&
          c.hp > 0 &&
          !c.downState &&
          c.maxHp > 0 &&
          c.hp / c.maxHp < 0.2;
        domWrites.push(() => {
          if (refs.hpBar) refs.hpBar.style.width = `${pct}%`;
          if (refs.hpValue) refs.hpValue.textContent = hpText;
          refs.card.classList.toggle("combat-card-down", isDown);
          refs.card.classList.toggle("combat-card-low-health", isLowHealth);
          updateCombatCardDownBadge(refs.card, c);
        });
        dirtyHpCombatantIds.delete(c.id);
      }
      for (const write of domWrites) write();
    }

    function updateCombatUI(force = false) {
      const now = Date.now();
      const timedUpdate = force || now >= nextTimedUiUpdateAt;
      if (timedUpdate) nextTimedUiUpdateAt = now + 100;
      updateHpBarsAll(force);
      const popup = document.getElementById("combat-abilities-popup");
      if (popup?.getAttribute("aria-hidden") !== "true" && popupCombatantId) {
        const c = players.find((p) => p.id === popupCombatantId);
        if (c && (c.hp <= 0 || c.downState)) closeAbilitiesPopup();
      }
      const domWrites: Array<() => void> = [];
      for (const c of allCombatants) {
        const needsStatus =
          force || timedUpdate || dirtyStatusCombatantIds.has(c.id);
        const needsSpeed =
          force || timedUpdate || dirtySpeedCombatantIds.has(c.id);
        if (!needsStatus && !needsSpeed) continue;
        const refs = getCombatantDomRefs(c.id);
        if (!refs) continue;
        const card = refs.card;
        const prevSnapshot = combatantUiSnapshotCache.get(c.id);
        const inCover = isInCover(c, now);
        const smoked = c.smokedUntil != null && now < c.smokedUntil;
        const stunned = c.stunUntil != null && now < c.stunUntil;
        const panicked = c.panicUntil != null && now < c.panicUntil;
        const burning = c.burningUntil != null && now < c.burningUntil;
        const bleeding = c.bleedingUntil != null && now < c.bleedingUntil;
        const stimmed =
          c.attackSpeedBuffUntil != null && now < c.attackSpeedBuffUntil;
        const blinded = c.blindedUntil != null && now < c.blindedUntil;
        const suppressed = c.suppressedUntil != null && now < c.suppressedUntil;
        const settingUp =
          c.side === "enemy" && c.setupUntil != null && now < c.setupUntil;
        const postCoverBuff =
          c.postCoverToughnessUntil != null && now < c.postCoverToughnessUntil;
        const focusedFire =
          c.side === "enemy" &&
          focusedFireTargetId === c.id &&
          now < focusedFireUntil;
        const baseInterval = c.attackIntervalMs ?? 1500;
        let speedMult = 1;
        if (stimmed && c.attackSpeedBuffMultiplier != null)
          speedMult *= c.attackSpeedBuffMultiplier;
        if (panicked) speedMult *= 2;
        const effectiveInterval = baseInterval * speedMult;
        const nextSnapshot: CombatantUiSnapshot = {
          hp: c.hp,
          maxHp: c.maxHp,
          downState: c.downState ?? null,
          inCover,
          smoked,
          stunned,
          panicked,
          burning,
          bleeding,
          stimmed,
          blinded,
          suppressed,
          settingUp,
          postCoverBuff,
          focusedFire,
          effectiveIntervalMs: effectiveInterval,
        };
        const statusChanged =
          !prevSnapshot ||
          prevSnapshot.inCover !== nextSnapshot.inCover ||
          prevSnapshot.smoked !== nextSnapshot.smoked ||
          prevSnapshot.stunned !== nextSnapshot.stunned ||
          prevSnapshot.panicked !== nextSnapshot.panicked ||
          prevSnapshot.burning !== nextSnapshot.burning ||
          prevSnapshot.bleeding !== nextSnapshot.bleeding ||
          prevSnapshot.stimmed !== nextSnapshot.stimmed ||
          prevSnapshot.blinded !== nextSnapshot.blinded ||
          prevSnapshot.suppressed !== nextSnapshot.suppressed ||
          prevSnapshot.settingUp !== nextSnapshot.settingUp ||
          prevSnapshot.postCoverBuff !== nextSnapshot.postCoverBuff ||
          prevSnapshot.focusedFire !== nextSnapshot.focusedFire;
        const speedChanged =
          !prevSnapshot ||
          prevSnapshot.effectiveIntervalMs !==
            nextSnapshot.effectiveIntervalMs ||
          prevSnapshot.stimmed !== nextSnapshot.stimmed;
        combatantUiSnapshotCache.set(c.id, nextSnapshot);
        if (needsStatus && (statusChanged || timedUpdate || force)) {
          const refreshTimerText = force || timedUpdate || statusChanged;
          domWrites.push(() => {
            card.classList.toggle("combat-card-in-cover", inCover);
            card.classList.toggle("combat-card-smoked", smoked);
            card.classList.toggle("combat-card-stunned", stunned);
            card.classList.toggle("combat-card-panicked", panicked);
            card.classList.toggle("combat-card-burning", burning);
            card.classList.toggle("combat-card-bleeding", bleeding);
            card.classList.toggle("combat-card-stimmed", stimmed);
            card.classList.toggle("combat-card-blinded", blinded);
            card.classList.toggle("combat-card-suppressed", suppressed);
            card.classList.toggle("combat-card-setting-up", settingUp);
            card.classList.toggle("combat-card-post-cover-buff", postCoverBuff);
            card.classList.toggle("combat-card-focused-fire", focusedFire);
            const ensureTimer = (
              selector: string,
              cacheKey: string,
              className: string,
              parent: HTMLElement,
            ): HTMLElement => {
              const cached = refs.statusNodeCache.get(cacheKey);
              if (cached && cached.isConnected) return cached;
              const existing = parent.querySelector(selector) as HTMLElement | null;
              if (existing) {
                refs.statusNodeCache.set(cacheKey, existing);
                return existing;
              }
              const timerEl = document.createElement("span");
              timerEl.className = className;
              parent.appendChild(timerEl);
              refs.statusNodeCache.set(cacheKey, timerEl);
              return timerEl;
            };
            const ensureTimerRail = (): HTMLElement => {
              const cacheKey = "status-timer-rail";
              const cached = refs.statusNodeCache.get(cacheKey);
              if (cached && cached.isConnected) return cached;
              const existing = card.querySelector(
                ".combat-card-status-timer-rail",
              ) as HTMLElement | null;
              if (existing) {
                refs.statusNodeCache.set(cacheKey, existing);
                return existing;
              }
              const rail = document.createElement("div");
              rail.className = "combat-card-status-timer-rail";
              card.appendChild(rail);
              refs.statusNodeCache.set(cacheKey, rail);
              return rail;
            };
            const timerRail = ensureTimerRail();
            if (smoked) {
              const timerEl = ensureTimer(
                ".combat-card-smoke-timer",
                "smoke-timer",
                "combat-card-smoke-timer",
                timerRail,
              );
              if (refreshTimerText)
                timerEl.textContent = (
                  ((c.smokedUntil ?? 0) - now) /
                  1000
                ).toFixed(1);
            } else {
              card.querySelector(".combat-card-smoke-timer")?.remove();
              refs.statusNodeCache.delete("smoke-timer");
            }
            if (stunned) {
              const timerEl = ensureTimer(
                ".combat-card-stun-timer",
                "stun-timer",
                "combat-card-stun-timer",
                timerRail,
              );
              if (refreshTimerText)
                timerEl.textContent = (
                  ((c.stunUntil ?? 0) - now) /
                  1000
                ).toFixed(1);
            } else {
              card.querySelector(".combat-card-stun-timer")?.remove();
              refs.statusNodeCache.delete("stun-timer");
            }
            if (burning) {
              const timerEl = ensureTimer(
                ".combat-card-burn-timer",
                "burn-timer",
                "combat-card-burn-timer",
                timerRail,
              );
              if (refreshTimerText)
                timerEl.textContent = (
                  ((c.burningUntil ?? 0) - now) /
                  1000
                ).toFixed(1);
            } else {
              card.querySelector(".combat-card-burn-timer")?.remove();
              refs.statusNodeCache.delete("burn-timer");
            }
            const dotActive = burning || bleeding;
            if (dotActive) {
              let flameEl = card.querySelector(
                ".combat-card-dot-flame",
              ) as HTMLElement | null;
              if (!flameEl && refs.avatarWrap) {
                flameEl = document.createElement("div");
                flameEl.className = "combat-card-dot-flame";
                const img = document.createElement("img");
                img.src = FLAME_ICON;
                img.alt = "Damage over time";
                flameEl.appendChild(img);
                refs.avatarWrap.appendChild(flameEl);
              }
            } else {
              card.querySelector(".combat-card-dot-flame")?.remove();
            }
            if (stimmed) {
              const timerEl = ensureTimer(
                ".combat-card-stim-timer",
                "stim-timer",
                "combat-card-stim-timer",
                timerRail,
              );
              if (refreshTimerText)
                timerEl.textContent = (
                  ((c.attackSpeedBuffUntil ?? 0) - now) /
                  1000
                ).toFixed(1);
            } else {
              card.querySelector(".combat-card-stim-timer")?.remove();
              refs.statusNodeCache.delete("stim-timer");
            }
            if (blinded) {
              const timerEl = ensureTimer(
                ".combat-card-blind-timer",
                "blind-timer",
                "combat-card-blind-timer",
                timerRail,
              );
              if (refreshTimerText)
                timerEl.textContent = (
                  ((c.blindedUntil ?? 0) - now) /
                  1000
                ).toFixed(1);
            } else {
              card.querySelector(".combat-card-blind-timer")?.remove();
              refs.statusNodeCache.delete("blind-timer");
            }
            if (suppressed) {
              let arrowWrap = card.querySelector(
                ".combat-card-suppress-arrow-wrap",
              ) as HTMLElement | null;
              if (!arrowWrap && refs.avatarWrap) {
                arrowWrap = document.createElement("div");
                arrowWrap.className = "combat-card-suppress-arrow-wrap";
                const arrow = document.createElement("div");
                arrow.className = "combat-card-suppress-arrow";
                arrow.innerHTML = "▼";
                arrowWrap.appendChild(arrow);
                card.insertBefore(arrowWrap, card.firstChild);
              }
              const timerEl = ensureTimer(
                ".combat-card-suppress-timer",
                "suppress-timer",
                "combat-card-suppress-timer",
                timerRail,
              );
              if (refreshTimerText)
                timerEl.textContent = (
                  ((c.suppressedUntil ?? 0) - now) /
                  1000
                ).toFixed(1);
            } else {
              card.querySelector(".combat-card-suppress-arrow-wrap")?.remove();
              card.querySelector(".combat-card-suppress-timer")?.remove();
              refs.statusNodeCache.delete("suppress-timer");
            }
            if (settingUp) {
              const timerEl = ensureTimer(
                ".combat-card-setup-timer",
                "setup-timer",
                "combat-card-setup-timer",
                timerRail,
              );
              if (refreshTimerText)
                timerEl.textContent = (
                  ((c.setupUntil ?? 0) - now) /
                  1000
                ).toFixed(1);
            } else {
              card.querySelector(".combat-card-setup-timer")?.remove();
              refs.statusNodeCache.delete("setup-timer");
            }
            if (focusedFire) {
              const timerEl = ensureTimer(
                ".combat-card-focused-fire-timer",
                "focused-fire-timer",
                "combat-card-focused-fire-timer",
                timerRail,
              );
              if (refreshTimerText)
                timerEl.textContent = (
                  ((focusedFireUntil ?? 0) - now) /
                  1000
                ).toFixed(1);
            } else {
              card.querySelector(".combat-card-focused-fire-timer")?.remove();
              refs.statusNodeCache.delete("focused-fire-timer");
            }
            if (postCoverBuff) {
              const timerEl = ensureTimer(
                ".combat-card-post-cover-timer",
                "post-cover-timer",
                "combat-card-post-cover-timer",
                timerRail,
              );
              if (refreshTimerText)
                timerEl.textContent = (
                  ((c.postCoverToughnessUntil ?? 0) - now) /
                  1000
                ).toFixed(1);
              let buffShield = card.querySelector(
                ".combat-card-post-cover-shield",
              ) as HTMLElement | null;
              if (!buffShield && refs.avatarWrap) {
                buffShield = document.createElement("div");
                buffShield.className = "combat-card-post-cover-shield";
                const img = document.createElement("img");
                img.src = SHIELD_ICON;
                img.alt = "";
                buffShield.appendChild(img);
                refs.avatarWrap.appendChild(buffShield);
              }
            } else {
              card.querySelector(".combat-card-post-cover-timer")?.remove();
              card.querySelector(".combat-card-post-cover-shield")?.remove();
              refs.statusNodeCache.delete("post-cover-timer");
            }
            let shieldWrap = card.querySelector(
              ".combat-card-cover-shield",
            ) as HTMLElement | null;
            if (inCover) {
              if (!shieldWrap && refs.avatarWrap) {
                shieldWrap = document.createElement("div");
                shieldWrap.className = "combat-card-cover-shield";
                const img = document.createElement("img");
                img.src = SHIELD_ICON;
                img.alt = "";
                shieldWrap.appendChild(img);
                refs.avatarWrap.appendChild(shieldWrap);
              }
              const timerEl = ensureTimer(
                ".combat-card-cover-timer",
                "cover-timer",
                "combat-card-cover-timer",
                timerRail,
              );
              if (refreshTimerText)
                timerEl.textContent = (
                  ((c.takeCoverUntil ?? 0) - now) /
                  1000
                ).toFixed(1);
              timerEl.style.opacity = "1";
            } else {
              shieldWrap?.remove();
              const timerEl = card.querySelector(
                ".combat-card-cover-timer",
              ) as HTMLElement | null;
              if (timerEl) {
                timerEl.textContent = "0";
                timerEl.style.animation =
                  "combat-timer-fade 0.45s ease-out forwards";
                setTimeout(() => timerEl.remove(), 450);
                refs.statusNodeCache.delete("cover-timer");
              }
            }
          });
        }
        if (
          needsSpeed &&
          (speedChanged || timedUpdate || force) &&
          refs.spdBadge &&
          baseInterval > 0
        ) {
          domWrites.push(() => {
            refs.spdBadge!.textContent = `SPD: ${(effectiveInterval / 1000).toFixed(1)}s`;
            refs.spdBadge!.classList.toggle("combat-card-spd-buffed", stimmed);
          });
        }
        dirtyStatusCombatantIds.delete(c.id);
        dirtySpeedCombatantIds.delete(c.id);
      }
      for (const write of domWrites) write();
      drawAttackLines(force || timedUpdate);
      if (timedUpdate || force) renderCompanyAbilityBar();
    }

    let combatTickId: number | null = null;
    const lastBurnTickTimeRef = { current: 0 };
    const lastBleedTickTimeRef = { current: 0 };

    function startCombatLoop() {
      const now = Date.now();
      const defendEndAt = isDefendObjectiveMission
        ? now + DEFEND_DURATION_MS
        : Number.POSITIVE_INFINITY;
      let nextDefendReinforcementAt = HAS_MISSION_REINFORCEMENTS
        ? now +
          (DEFEND_REINFORCE_INTERVAL_MS > 0 ? DEFEND_REINFORCE_INTERVAL_MS : 0)
        : Number.POSITIVE_INFINITY;
      const enemyMedicState = new Map<
        string,
        { threshold: number; nextCheckAt: number }
      >();
      const enemySuppressState = new Map<string, { nextCheckAt: number }>();
      const enemyGrenadeState = new Map<string, { nextCheckAt: number }>();
      const enemyCoverState = new Map<string, { nextCheckAt: number }>();
      let nextEnemyCoverGlobalAt = now + 900 + Math.floor(Math.random() * 800);
      for (const e of enemies) {
        if ((e.designation ?? "").toLowerCase() !== "medic") continue;
        enemyMedicState.set(e.id, {
          threshold: 0.3 + Math.random() * 0.3, // 30%..60% randomized per medic
          nextCheckAt: now + 1500 + Math.floor(Math.random() * 2000),
        });
      }
      for (const e of enemies) {
        if ((e.enemySuppressUses ?? 0) <= 0) continue;
        enemySuppressState.set(e.id, {
          nextCheckAt: now + 2200 + Math.floor(Math.random() * 2600),
        });
      }
      for (const e of enemies) {
        if ((e.enemyGrenadeThrowsRemaining ?? 0) <= 0) continue;
        enemyGrenadeState.set(e.id, {
          nextCheckAt: now + 2600 + Math.floor(Math.random() * 3200),
        });
      }
      for (const e of enemies) {
        enemyCoverState.set(e.id, {
          nextCheckAt: now + 350 + Math.floor(Math.random() * 2000),
        });
      }
      lastBurnTickTimeRef.current = now;
      lastBleedTickTimeRef.current = now;
      for (const c of allCombatants) {
        if (c.hp > 0 && !c.downState)
          nextAttackAt.set(c.id, now + Math.random() * 500);
      }
      markAllCombatantsDirty();
      if (isDefendObjectiveMission)
        updateDefendObjectiveTimer(now, defendEndAt);
      const reinforcementRolesLeft = {
        rifleman: Math.max(
          0,
          missionEncounter?.rolesReinforcement?.rifleman ?? 0,
        ),
        support: Math.max(
          0,
          missionEncounter?.rolesReinforcement?.support ?? 0,
        ),
        medic: Math.max(0, missionEncounter?.rolesReinforcement?.medic ?? 0),
      };

      function pickReinforcementRole(): "rifleman" | "support" | "medic" {
        const pool: Array<"rifleman" | "support" | "medic"> = [];
        for (let i = 0; i < reinforcementRolesLeft.rifleman; i++)
          pool.push("rifleman");
        for (let i = 0; i < reinforcementRolesLeft.support; i++)
          pool.push("support");
        for (let i = 0; i < reinforcementRolesLeft.medic; i++)
          pool.push("medic");
        if (pool.length <= 0) return "rifleman";
        const picked = pool[Math.floor(Math.random() * pool.length)];
        reinforcementRolesLeft[picked] = Math.max(
          0,
          reinforcementRolesLeft[picked] - 1,
        );
        return picked;
      }

      function spawnMissionReinforcement(spawnAt: number): boolean {
        if (!HAS_MISSION_REINFORCEMENTS) return false;
        if (enemies.length >= MISSION_TOTAL_ENEMY_BUDGET) return false;
        if (getAliveEnemyCount() >= DEFEND_MAX_ENEMIES) return false;
        const slot = getNextOpenEnemySlot();
        if (slot == null) return false;
        const enemyBaseLevel = Math.max(
          1,
          Math.min(
            999,
            Math.round(
              enemies.reduce((sum, e) => sum + (e.level ?? 1), 0) /
                Math.max(1, enemies.length),
            ),
          ),
        );
        const isEpicMission = !!(
          missionForCombat?.isEpic ?? missionForCombat?.rarity === "epic"
        );
        const role = pickReinforcementRole();
        const newcomer = createEnemyCombatant(
          reinforcementSerial++,
          DEFEND_MAX_ENEMIES,
          enemyBaseLevel,
          isEpicMission,
          missionForCombat?.kind,
          undefined,
          undefined,
          {
            designation: role,
            factionId: missionForCombat?.factionId,
          },
        );
        newcomer.enemyMedkitUses =
          role === "medic" ? (missionEncounter?.medicHealsPerMedic ?? 0) : 0;
        newcomer.enemySuppressUses =
          role === "support" ? (missionEncounter?.supportSuppressUses ?? 0) : 0;
        newcomer.enemyGrenadeThrowsRemaining = 0;
        newcomer.enemySlotIndex = slot;
        newcomer.setupUntil = spawnAt + DEFEND_REINFORCE_SETUP_MS;
        enemies.push(newcomer);
        allCombatants.push(newcomer);
        if (role === "medic") {
          enemyMedicState.set(newcomer.id, {
            threshold: 0.3 + Math.random() * 0.2,
            nextCheckAt: spawnAt + 1800 + Math.floor(Math.random() * 1600),
          });
        }
        if ((newcomer.enemySuppressUses ?? 0) > 0) {
          enemySuppressState.set(newcomer.id, {
            nextCheckAt: spawnAt + 2200 + Math.floor(Math.random() * 1600),
          });
        }
        enemyCoverState.set(newcomer.id, {
          nextCheckAt: spawnAt + 1000 + Math.floor(Math.random() * 1200),
        });
        insertEnemyCardBySlot(newcomer, true);
        nextAttackAt.set(newcomer.id, newcomer.setupUntil + 120);
        markCombatantDirty(newcomer.id, {
          hp: true,
          status: true,
          speed: true,
        });
        return true;
      }

      function scheduleMissionReinforcementWave(
        spawnAt: number,
        count: number,
      ): number {
        let spawned = 0;
        for (let i = 0; i < count; i++) {
          const delay =
            i === 0
              ? 0
              : DEFEND_WAVE_STAGGER_MIN_MS +
                Math.floor(
                  Math.random() *
                    (DEFEND_WAVE_STAGGER_MAX_MS -
                      DEFEND_WAVE_STAGGER_MIN_MS +
                      1),
                );
          if (delay === 0) {
            if (spawnMissionReinforcement(spawnAt)) spawned += 1;
            continue;
          }
          window.setTimeout(() => {
            if (combatWinner) return;
            spawnMissionReinforcement(Date.now());
          }, delay);
        }
        return spawned;
      }

      function getEnemyDefeatedCount(): number {
        return enemies.filter(
          (e) => e.hp <= 0 || e.downState || e.removedFromCombat,
        ).length;
      }

      function tick() {
        const now = Date.now();
        if (now >= nextLowHpSampleAt) {
          for (const p of players) {
            if (p.hp <= 0 || p.downState || p.maxHp <= 0) continue;
            if (p.hp / p.maxHp < 0.2) {
              const ms = missionStatsBySoldier.get(p.id);
              if (ms) ms.turnsBelow20Hp += 1;
            }
          }
          nextLowHpSampleAt = now + 1000;
        }
        if (isDefendObjectiveMission)
          updateDefendObjectiveTimer(now, defendEndAt);
        const burnEvents = applyBurnTicks(
          allCombatants,
          now,
          lastBurnTickTimeRef,
        );
        const bleedEvents = applyBleedTicks(
          allCombatants,
          now,
          lastBleedTickTimeRef,
        );
        for (const ev of burnEvents) {
          if (!shouldShowCombatFeedback(ev.targetId)) continue;
          const card = getCombatantCard(ev.targetId);
          if (card) {
            spawnCombatPopup(
              card,
              "combat-damage-popup combat-burn-popup",
              String(ev.damage),
              1500,
            );
          }
          markCombatantDirty(ev.targetId, {
            hp: true,
            status: true,
            speed: false,
          });
        }
        for (const ev of bleedEvents) {
          if (!shouldShowCombatFeedback(ev.targetId)) continue;
          const card = getCombatantCard(ev.targetId);
          if (card) {
            spawnCombatPopup(
              card,
              "combat-damage-popup combat-bleed-popup",
              String(ev.damage),
              1500,
            );
          }
          markCombatantDirty(ev.targetId, {
            hp: true,
            status: true,
            speed: false,
          });
        }
        clearExpiredEffects(allCombatants, now);
        if (HAS_MISSION_REINFORCEMENTS) {
          for (const e of enemies) {
            if ((e.hp > 0 && !e.downState) || e.removedFromCombat) continue;
            if (e.deathNoticedAt == null) e.deathNoticedAt = now;
            if (now - e.deathNoticedAt < DEFEND_DEATH_NOTICE_MS) continue;
            const card = getCombatantCard(e.id);
            if (card) {
              card.classList.add("animate__animated", "animate__fadeOutDown");
              window.setTimeout(() => {
                card.remove();
                removeCombatantCardFromCache(e.id);
              }, 350);
            }
            e.removedFromCombat = true;
            if (
              e.enemySlotIndex != null &&
              !enemySlotRecycleQueue.includes(e.enemySlotIndex)
            ) {
              enemySlotRecycleQueue.push(e.enemySlotIndex);
            }
          }
          if (getAliveEnemyCount() === 0) {
            if (scheduleMissionReinforcementWave(now, 1) > 0) {
              nextDefendReinforcementAt =
                now +
                (DEFEND_REINFORCE_INTERVAL_MS > 0
                  ? DEFEND_REINFORCE_INTERVAL_MS
                  : 0);
            }
          } else if (now >= nextDefendReinforcementAt) {
            scheduleMissionReinforcementWave(now, 1);
            nextDefendReinforcementAt =
              now +
              (DEFEND_REINFORCE_INTERVAL_MS > 0
                ? DEFEND_REINFORCE_INTERVAL_MS
                : 0);
          }
        }
        assignTargets(players, enemies, targets, now);
        applyFocusedFireTargeting(now);
        const defeatedEnemies = getEnemyDefeatedCount();
        if (isDefendObjectiveMission) {
          combatWinner = players.every((p) => p.hp <= 0 || p.downState)
            ? "enemy"
            : defeatedEnemies >= MISSION_TOTAL_ENEMY_BUDGET ||
                now >= defendEndAt
              ? "player"
              : null;
        } else if (HAS_MISSION_REINFORCEMENTS) {
          combatWinner = players.every((p) => p.hp <= 0 || p.downState)
            ? "enemy"
            : defeatedEnemies >= MISSION_TOTAL_ENEMY_BUDGET
              ? "player"
              : null;
        } else {
          combatWinner = players.every((p) => p.hp <= 0 || p.downState)
            ? "enemy"
            : enemies.every((e) => e.hp <= 0 || e.downState)
              ? "player"
              : null;
        }
        if (combatWinner) {
          closeAbilitiesPopup();
          const missionDetailsPopup = document.getElementById(
            "combat-mission-details-popup",
          );
          if (missionDetailsPopup) missionDetailsPopup.hidden = true;
          const quitConfirmPopup = document.getElementById(
            "combat-quit-confirm-popup",
          );
          if (quitConfirmPopup) quitConfirmPopup.hidden = true;
          if (defendTimerEl) defendTimerEl.hidden = true;
          updateCombatUI();
          const victory = combatWinner === "player";
          const playOutcomeBannerThen = (
            isVictory: boolean,
            done: () => void,
          ) => {
            const combatMain = document.querySelector(
              "#combat-screen .combat-main",
            ) as HTMLElement | null;
            if (!combatMain) {
              done();
              return;
            }
            combatMain.querySelector(".combat-outcome-banner")?.remove();
            const banner = document.createElement("div");
            banner.className = `combat-outcome-banner ${isVictory ? "combat-outcome-victory" : "combat-outcome-failed"}`;
            banner.textContent = isVictory
              ? "MISSION COMPLETE!"
              : "MISSION FAILED!";
            combatMain.appendChild(banner);
            window.setTimeout(() => {
              banner.remove();
              done();
            }, 1050);
          };
          const showSummary = () => {
            const screen = document.getElementById("combat-screen");
            const missionJson = screen?.getAttribute("data-mission-json");
            let mission: Mission | null = null;
            if (missionJson) {
              try {
                mission = JSON.parse(missionJson.replace(/&quot;/g, '"'));
              } catch {
                //
              }
            }
            const kiaIds = players
              .filter((p) => p.downState === "kia")
              .map((p) => p.id);
            const incapIds = players
              .filter((p) => p.downState === "incapacitated")
              .map((p) => p.id);
            const missionName = mission?.name ?? "Unknown";
            const isDevTest = Boolean(mission?.isDevTest);
            const kiaKilledBy = new Map<string, string>();
            for (const p of players) {
              if (p.downState === "kia" && p.killedBy)
                kiaKilledBy.set(p.id, p.killedBy);
            }
            const participantIds = players.map((p) => p.id);
            if (!isDevTest) {
              usePlayerCompanyStore
                .getState()
                .recordSoldierCombatStats(participantIds, playerKills, true);
              usePlayerCompanyStore
                .getState()
                .processCombatKIA(
                  kiaIds,
                  missionName,
                  playerKills,
                  kiaKilledBy,
                );
            }
            const traitAwardsBySoldier = !isDevTest
              ? usePlayerCompanyStore
                  .getState()
                  .awardSoldierVeterancyTraits(
                    participantIds,
                    playerKills,
                    true,
                    victory,
                    missionStatsBySoldier,
                    incapIds,
                  )
              : new Map<string, EarnedTraitAward[]>();
            const survivorIds = players
              .filter((p) => !kiaIds.includes(p.id))
              .map((p) => p.id);
            const lowHealthSurvivorIds = players
              .filter(
                (p) =>
                  !kiaIds.includes(p.id) && p.maxHp > 0 && p.hp / p.maxHp < 0.3,
              )
              .map((p) => p.id);
            const hasCasualty = players.some(
              (p) => p.downState === "kia" || p.downState === "incapacitated",
            );
            const store = usePlayerCompanyStore.getState();
            /* Same derivation as enemy soldiers: getAverageCompanyLevel(company) - compute before XP to match combat setup */
            const missionLevel = missionForCombat?.isCareer
              ? Math.max(
                  1,
                  Math.min(999, missionForCombat.careerLevel ?? 1),
                )
              : Math.max(1, Math.min(999, getAverageCompanyLevel(store.company)));
            if (!isDevTest) {
              store.deductMissionEnergy(
                survivorIds,
                players.length,
                hasCasualty,
                !victory,
                lowHealthSurvivorIds,
              );
            }
            const oldLevels = isDevTest
              ? new Map<string, number>()
              : new Map(
                  store.company?.soldiers
                    ?.filter((s) => survivorIds.includes(s.id))
                    .map((s) => [s.id, s.level ?? 1]) ?? [],
                );
            if (!isDevTest) {
              store.grantSoldierCombatXP(
                survivorIds,
                playerDamage,
                playerDamageTaken,
                playerKills,
                playerAbilitiesUsed,
                playerHealing,
                victory,
              );
              store.syncCombatHpToSoldiers(
                players.map((p) => ({ id: p.id, hp: p.maxHp })),
              );
            }
            const kiaCount = kiaIds.length;
            const baseXp = victory
              ? SOLDIER_XP_BASE_SURVIVE_VICTORY
              : SOLDIER_XP_BASE_SURVIVE_DEFEAT;
            const xpEarnedBySoldier = new Map<string, number>();
            for (const id of participantIds) {
              const dmg = playerDamage.get(id) ?? 0;
              const dmgTaken = playerDamageTaken.get(id) ?? 0;
              const kills = playerKills.get(id) ?? 0;
              const abilitiesUsed = playerAbilitiesUsed.get(id) ?? 0;
              const healing = playerHealing.get(id) ?? 0;
              const xp =
                baseXp +
                dmg * SOLDIER_XP_PER_DAMAGE +
                dmgTaken * SOLDIER_XP_PER_DAMAGE_TAKEN +
                kills * SOLDIER_XP_PER_KILL +
                abilitiesUsed * SOLDIER_XP_PER_ABILITY_USE +
                healing * SOLDIER_XP_PER_HEAL;
              xpEarnedBySoldier.set(id, Math.round(xp * 10) / 10);
            }
            let companyXpEarned = 0;
            if (!isDevTest && victory && mission) {
              let totalSoldierXp = 0;
              xpEarnedBySoldier.forEach((xp) => {
                totalSoldierXp += Math.max(0, xp);
              });
              const companyDivisor =
                mission.kind === "defend_objective" ? 6 : 5;
              const baseCompanyXp = totalSoldierXp / companyDivisor;
              companyXpEarned = Math.max(
                1,
                Math.floor(baseCompanyXp * COMPANY_XP_FROM_COMBAT_MULTIPLIER),
              );
            }
            const { rewardItems, lootItems } =
              !isDevTest && victory && mission
                ? store.grantMissionRewards(
                    mission,
                    true,
                    kiaCount,
                    missionLevel,
                    companyXpEarned,
                  )
                : {
                    rewardItems:
                      [] as import("../../constants/items/types.ts").Item[],
                    lootItems:
                      [] as import("../../constants/items/types.ts").Item[],
                  };
            if (!isDevTest && victory && missionForCombat?.isCareer) {
              store.advanceCareerLevel();
            }
            const newLevels = isDevTest
              ? new Map<string, number>()
              : new Map(
                  usePlayerCompanyStore
                    .getState()
                    .company?.soldiers?.filter((s) =>
                      survivorIds.includes(s.id),
                    )
                    .map((s) => [s.id, s.level ?? 1]) ?? [],
                );
            const leveledUpIds = new Set<string>();
            for (const id of survivorIds) {
              if ((newLevels.get(id) ?? 1) > (oldLevels.get(id) ?? 1))
                leveledUpIds.add(id);
            }
            const soldiersAfterCombat = isDevTest
              ? new Map<string, import("../entities/types.ts").Soldier>()
              : new Map(
                  usePlayerCompanyStore
                    .getState()
                    .company?.soldiers?.filter((s) =>
                      players.some((p) => p.id === s.id),
                    )
                    .map((s) => [s.id, s]) ?? [],
                );
            const st = usePlayerCompanyStore.getState();
            const companyExpTotal =
              st.company?.experience ?? st.companyExperience ?? 0;
            const companyLvlTotal = st.company?.level ?? st.companyLevel ?? 1;
            const summaryData = buildCombatSummaryData(
              victory,
              mission,
              players,
              playerKills,
              leveledUpIds.size,
              rewardItems,
              lootItems,
              leveledUpIds,
              newLevels,
              soldiersAfterCombat,
              xpEarnedBySoldier,
              companyXpEarned,
              companyExpTotal,
              companyLvlTotal,
              traitAwardsBySoldier,
            );
            const container = document.getElementById(
              "combat-summary-container",
            );
            if (container) {
              container.innerHTML = combatSummaryTemplate(summaryData);
              const overlay = container.querySelector(
                ".combat-summary-overlay",
              ) as HTMLElement;
              if (overlay) overlay.classList.add("combat-summary-visible");
            }
          };
          playOutcomeBannerThen(victory, showSummary);
          return;
        }
        const all = allCombatants;
        let nextDue = Infinity;
        let didAttack = false;

        // Enemy medic support: heal a low-health ally with randomized trigger threshold/timing.
        if (!didAttack) {
          for (const medic of enemies) {
            if ((medic.designation ?? "").toLowerCase() !== "medic") continue;
            if ((medic.enemyMedkitUses ?? 0) <= 0) continue;
            if (
              medic.hp <= 0 ||
              medic.downState ||
              isInCover(medic, now) ||
              isStunned(medic, now)
            )
              continue;
            if (medic.setupUntil != null && now < medic.setupUntil) continue;
            const st = enemyMedicState.get(medic.id);
            if (!st || now < st.nextCheckAt) continue;

            const dynamicThreshold = Math.max(
              0.3,
              Math.min(0.6, st.threshold + (Math.random() * 0.1 - 0.05)),
            );
            const allies = enemies.filter(
              (a) =>
                a.id !== medic.id && a.hp > 0 && !a.downState && a.maxHp > 0,
            );
            const candidates = allies
              .filter((a) => a.hp / a.maxHp <= dynamicThreshold)
              .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
            if (candidates.length === 0) {
              st.nextCheckAt = now + 700 + Math.floor(Math.random() * 1100);
              continue;
            }

            // Not deterministic: second heal is intentionally less likely than the first.
            const usesLeft = medic.enemyMedkitUses ?? 0;
            const healChance = usesLeft >= 2 ? 0.55 : 0.3;
            if (Math.random() > healChance) {
              st.nextCheckAt = now + 600 + Math.floor(Math.random() * 1200);
              continue;
            }

            const healTarget = candidates[0];
            const didHeal = executeEnemyMedicUse(medic, healTarget);
            if (!didHeal) {
              st.nextCheckAt = now + 900 + Math.floor(Math.random() * 1200);
              continue;
            }
            st.nextCheckAt = now + 2200 + Math.floor(Math.random() * 2800);
            nextAttackAt.set(medic.id, getNextAttackAt(medic, now));
            didAttack = true;
            break;
          }
        }

        // Enemy support: suppress with staggered timing and limited uses.
        if (!didAttack) {
          const supports = enemies.filter(
            (e) =>
              (e.designation ?? "").toLowerCase() === "support" &&
              (e.enemySuppressUses ?? 0) > 0 &&
              e.hp > 0 &&
              !e.downState &&
              !isInCover(e, now) &&
              !isStunned(e, now) &&
              (e.setupUntil ?? 0) <= now &&
              (e.suppressCooldownUntil ?? 0) <= now,
          );
          for (const support of supports) {
            const st = enemySuppressState.get(support.id);
            if (!st || now < st.nextCheckAt) continue;
            const viableTargets = players
              .filter((p) => p.hp > 0 && !p.downState)
              .sort(
                (a, b) =>
                  a.hp / Math.max(1, a.maxHp) - b.hp / Math.max(1, b.maxHp),
              );
            const target = viableTargets[0];
            if (!target) {
              st.nextCheckAt = now + 1200 + Math.floor(Math.random() * 1200);
              continue;
            }
            if (Math.random() > 0.42) {
              st.nextCheckAt = now + 900 + Math.floor(Math.random() * 1600);
              continue;
            }
            executeSuppress(support, target, { fromEnemyAi: true });
            st.nextCheckAt = now + 2600 + Math.floor(Math.random() * 1900);
            nextAttackAt.set(support.id, getNextAttackAt(support, now));
            didAttack = true;
            break;
          }
        }

        // Enemy grenadiers: limited throws with staggered checks.
        if (!didAttack) {
          for (const thrower of enemies) {
            if ((thrower.enemyGrenadeThrowsRemaining ?? 0) <= 0) continue;
            if (
              thrower.hp <= 0 ||
              thrower.downState ||
              isInCover(thrower, now) ||
              isStunned(thrower, now)
            )
              continue;
            if ((thrower.setupUntil ?? 0) > now) continue;
            const st = enemyGrenadeState.get(thrower.id);
            if (!st || now < st.nextCheckAt) continue;
            const alivePlayers = players.filter(
              (p) => p.hp > 0 && !p.downState,
            );
            if (alivePlayers.length === 0) {
              st.nextCheckAt = now + 1200;
              continue;
            }
            if (Math.random() > 0.4) {
              st.nextCheckAt = now + 1000 + Math.floor(Math.random() * 1600);
              continue;
            }
            const target =
              alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
            const grenadePool = [
              ThrowableItems.common.m3_frag_grenade,
              ThrowableItems.common.m84_flashbang,
              ThrowableItems.common.incendiary_grenade,
            ];
            const grenadeItem = {
              ...grenadePool[Math.floor(Math.random() * grenadePool.length)],
            };
            executeGrenadeThrow(
              thrower,
              target,
              { item: grenadeItem, inventoryIndex: -1 },
              {
                consumeThrowable: false,
                trackPlayerStats: false,
                targetPool: alivePlayers,
                resetTargetingUi: false,
              },
            );
            thrower.enemyGrenadeThrowsRemaining = Math.max(
              0,
              (thrower.enemyGrenadeThrowsRemaining ?? 0) - 1,
            );
            st.nextCheckAt = now + 2400 + Math.floor(Math.random() * 2200);
            nextAttackAt.set(thrower.id, getNextAttackAt(thrower, now));
            didAttack = true;
            break;
          }
        }

        // Enemy AI: chance to use Take Cover.
        if (!didAttack) {
          const coverEvalOrder = [...enemies];
          for (let i = coverEvalOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = coverEvalOrder[i];
            coverEvalOrder[i] = coverEvalOrder[j];
            coverEvalOrder[j] = tmp;
          }
          for (const enemy of coverEvalOrder) {
            if (
              enemy.hp <= 0 ||
              enemy.downState ||
              isInCover(enemy, now) ||
              isStunned(enemy, now)
            )
              continue;
            if ((enemy.setupUntil ?? 0) > now) continue;
            if ((enemy.takeCoverCooldownUntil ?? 0) > now) continue;
            if (now < nextEnemyCoverGlobalAt) continue;
            const coverState = enemyCoverState.get(enemy.id);
            if (coverState && now < coverState.nextCheckAt) continue;
            const hpPct = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;
            const focusedByPlayers = Array.from(targets.entries()).reduce(
              (acc, [attackerId, targetId]) => {
                const attacker = players.find((p) => p.id === attackerId);
                return attacker && targetId === enemy.id ? acc + 1 : acc;
              },
              0,
            );
            if (hpPct > 0.65 && focusedByPlayers < 2) {
              if (coverState)
                coverState.nextCheckAt =
                  now + 350 + Math.floor(Math.random() * 850);
              continue;
            }
            const chance =
              hpPct <= 0.4 ? 0.32 : focusedByPlayers >= 2 ? 0.24 : 0.14;
            if (Math.random() > chance) {
              if (coverState)
                coverState.nextCheckAt =
                  now + 450 + Math.floor(Math.random() * 1200);
              continue;
            }
            if (executeTakeCover(enemy, { closePopup: false })) {
              if (coverState)
                coverState.nextCheckAt =
                  now + 1800 + Math.floor(Math.random() * 1800);
              nextEnemyCoverGlobalAt =
                now + 700 + Math.floor(Math.random() * 1100);
              nextAttackAt.set(enemy.id, getNextAttackAt(enemy, now));
              didAttack = true;
              break;
            }
            if (coverState)
              coverState.nextCheckAt =
                now + 500 + Math.floor(Math.random() * 900);
          }
        }

        for (const c of all) {
          if (
            c.hp <= 0 ||
            c.downState ||
            isInCover(c, now) ||
            isStunned(c, now)
          )
            continue;
          if (c.side === "enemy" && (c.setupUntil ?? 0) > now) continue;
          const due = nextAttackAt.get(c.id) ?? now;
          if (!didAttack && due <= now) {
            const targetId = targets.get(c.id);
            const target = all.find((x) => x.id === targetId);
            if (
              target &&
              target.hp > 0 &&
              !target.downState &&
              (!isInCover(target, now) || isFocusedFireTargetLocked(target, now))
            ) {
              const result = resolveAttack(c, target, now);
              if (c.side === "player") {
                if (
                  target.side === "enemy" &&
                  (target.hp <= 0 || target.downState === "kia")
                ) {
                  playerKills.set(c.id, (playerKills.get(c.id) ?? 0) + 1);
                }
                if (result.damage > 0) {
                  playerDamage.set(
                    c.id,
                    (playerDamage.get(c.id) ?? 0) + result.damage,
                  );
                }
              }
              if (target.side === "player" && result.damage > 0) {
                playerDamageTaken.set(
                  target.id,
                  (playerDamageTaken.get(target.id) ?? 0) + result.damage,
                );
              }
              nextAttackAt.set(c.id, getNextAttackAt(c, now));
              const attackerCard = getCombatantCard(c.id);
              const targetCard = getCombatantCard(result.targetId);
              const attackProjectileMs = result.critical ? 150 : 220;
              if (attackerCard && targetCard) {
                animateProjectile(
                  attackerCard,
                  targetCard,
                  BULLET_ICON,
                  attackProjectileMs,
                  10,
                );
              }
              const showAttackResult = () => {
                if (!targetCard) return;
                if (!shouldShowCombatFeedback(result.targetId)) return;
                if (!result.hit) {
                  spawnCombatPopup(targetCard, "combat-miss-popup", "MISS", 2200);
                } else if (result.evaded) {
                  spawnCombatPopup(
                    targetCard,
                    "combat-evade-popup",
                    "Evade",
                    2200,
                  );
                } else if (result.damage > 0) {
                  if (result.critical) {
                    spawnCriticalPopup(targetCard, result.damage, 1300);
                  } else {
                    spawnCombatPopup(
                      targetCard,
                      "combat-damage-popup",
                      String(result.damage),
                      1500,
                    );
                  }
                  if (result.critical) {
                    applyCriticalHitImpact(targetCard);
                  } else {
                    targetCard.classList.add("combat-card-shake");
                    setTimeout(
                      () => targetCard.classList.remove("combat-card-shake"),
                      350,
                    );
                  }
                  applyAutoAttackHitFlash(targetCard, target);
                }
              };
              setTimeout(showAttackResult, attackProjectileMs - 20);
              markCombatantsDirty([c.id, result.targetId]);
              didAttack = true;
            }
          }
          const due2 = nextAttackAt.get(c.id) ?? now;
          if (due2 < nextDue) nextDue = due2;
        }
        updateCombatUI();
        if (!combatWinner)
          combatTickId = window.setTimeout(
            tick,
            Math.min(50, Math.max(0, nextDue - now)),
          );
      }

      combatTickId = window.setTimeout(tick, 50);
    }

    function processQuitMissionOutcome() {
      if (!combatStarted) return;
      const screen = document.getElementById("combat-screen");
      const missionJson = screen?.getAttribute("data-mission-json");
      let mission: Mission | null = null;
      if (missionJson) {
        try {
          mission = JSON.parse(missionJson.replace(/&quot;/g, '"')) as Mission;
        } catch {
          mission = null;
        }
      }
      const kiaIds = players
        .filter((p) => p.downState === "kia")
        .map((p) => p.id);
      const missionName = mission?.name ?? "Unknown";
      const kiaKilledBy = new Map<string, string>();
      for (const p of players) {
        if (p.downState === "kia" && p.killedBy)
          kiaKilledBy.set(p.id, p.killedBy);
      }
      const survivorIds = players
        .filter((p) => !kiaIds.includes(p.id))
        .map((p) => p.id);
      const participantIds = players.map((p) => p.id);
      const store = usePlayerCompanyStore.getState();
      if (!mission?.isDevTest) {
        store.recordSoldierCombatStats(participantIds, playerKills, false);
        store.processCombatKIA(kiaIds, missionName, playerKills, kiaKilledBy);
        store.grantSoldierCombatXP(
          survivorIds,
          playerDamage,
          playerDamageTaken,
          playerKills,
          playerAbilitiesUsed,
          playerHealing,
          false,
        );
        // Survivors return to roster at full HP after mission end/quit.
        const survivors = players
          .filter((p) => !kiaIds.includes(p.id))
          .map((p) => ({
            id: p.id,
            hp: p.maxHp,
          }));
        store.syncCombatHpToSoldiers(survivors);
        store.grantMissionRewards(mission, false, kiaIds.length);
      }
    }

    function executeTakeCover(
      combatant: Combatant,
      options: { trackPlayerAbility?: boolean; closePopup?: boolean } = {},
    ): boolean {
      if (combatant.hp <= 0 || combatant.downState) return false;
      const now = Date.now();
      if (isStunned(combatant, now)) return false;
      if ((combatant.takeCoverCooldownUntil ?? 0) > now) return false;
      if ((combatant.takeCoverToughnessBonus ?? 0) <= 0) {
        combatant.toughness = Math.max(0, (combatant.toughness ?? 0) + 50);
        combatant.takeCoverToughnessBonus = 50;
      }
      combatant.takeCoverUntil = now + TAKE_COVER_DURATION_MS;
      const coverCdMs =
        combatant.side === "player" ? TAKE_COVER_COOLDOWN_MS : 60_000;
      combatant.takeCoverCooldownUntil = now + coverCdMs;
      if (combatant.side === "player" && companyPassives.postCoverToughnessPct > 0) {
        const postCoverBonus = Math.max(
          1,
          Math.round((combatant.toughness ?? 0) * companyPassives.postCoverToughnessPct),
        );
        combatant.toughness = Math.max(
          0,
          (combatant.toughness ?? 0) + postCoverBonus,
        );
        combatant.postCoverToughnessBonus = postCoverBonus;
        combatant.postCoverToughnessUntil =
          now + companyPassives.postCoverDurationMs;
      }
      removeTargetsForCombatantInCover(targets, combatant.id);
      assignTargets(players, enemies, targets, now);
      if (isFocusedFireTargetLocked(combatant, now)) {
        for (const p of players) {
          if (p.hp <= 0 || p.downState || isInCover(p, now) || isStunned(p, now))
            continue;
          targets.set(p.id, combatant.id);
        }
      }
      applyFocusedFireTargeting(now);
      markCombatantDirty(combatant.id, {
        hp: false,
        status: true,
        speed: false,
      });
      if (options.trackPlayerAbility) {
        playerAbilitiesUsed.set(
          combatant.id,
          (playerAbilitiesUsed.get(combatant.id) ?? 0) + 1,
        );
      }
      if (options.closePopup !== false) closeAbilitiesPopup();
      updateCombatUI(true);
      return true;
    }

    function handleTakeCoverAbility(combatant: Combatant): void {
      void executeTakeCover(combatant, {
        trackPlayerAbility: true,
        closePopup: true,
      });
    }

    function handleSuppressAbility(combatant: Combatant): void {
      if (isStunned(combatant, Date.now())) return;
      const onCooldown = (combatant.suppressCooldownUntil ?? 0) > Date.now();
      if (combatant.hp <= 0 || combatant.downState || onCooldown) return;
      suppressTargetingMode = { user: combatant };
      showSuppressTargetingHint(combatant);
      document
        .querySelectorAll(
          "#combat-enemies-grid .combat-card:not(.combat-card-down)",
        )
        .forEach((card) => {
          card.classList.add("combat-card-grenade-target");
        });
    }

    function showCompanyTargetingHint(abilityId: CompanyAbilityId): void {
      const hintEl = document.getElementById("combat-targeting-hint");
      if (!hintEl) return;
      const abilityName = COMPANY_ABILITY_DEFS[abilityId]?.name ?? "Ability";
      hintEl.textContent = `Select enemy target for ${abilityName}`;
      hintEl.setAttribute("aria-hidden", "false");
    }

    function startCompanyAbilityTargeting(abilityId: CompanyAbilityId): void {
      if (!combatStarted) return;
      if (combatWinner) return;
      const usesLeft = companyAbilityUsesLeft.get(abilityId);
      if (typeof usesLeft === "number" && usesLeft <= 0) return;
      if ((companyAbilityCooldownUntil.get(abilityId) ?? 0) > Date.now()) return;
      companyAbilityTargetingMode = { abilityId };
      showCompanyTargetingHint(abilityId);
      document
        .querySelectorAll(
          "#combat-enemies-grid .combat-card:not(.combat-card-down)",
        )
        .forEach((card) => card.classList.add("combat-card-grenade-target"));
      renderCompanyAbilityBar(true);
    }

    function handleCompanyAbilityBarActivate(e: Event): void {
      if (!combatStarted) return;
      const btn = (e.target as HTMLElement).closest(
        ".combat-company-ability-btn",
      ) as HTMLButtonElement | null;
      if (!btn || btn.disabled) return;
      const now = Date.now();
      if (now - lastCompanyAbilityActivateAt < 220) return;
      const abilityId = (btn.dataset.companyAbilityId ?? "") as CompanyAbilityId;
      if (!abilityId) return;
      lastCompanyAbilityActivateAt = now;
      e.preventDefault();
      e.stopPropagation();
      startCompanyAbilityTargeting(abilityId);
    }

    function applyCompanyAbilityOnTarget(
      abilityId: CompanyAbilityId,
      target: Combatant,
    ): void {
      const now = Date.now();
      if (target.hp <= 0 || target.downState) return;

      if (abilityId === "focused_fire") {
        focusedFireTargetId = target.id;
        focusedFireUntil = now + 8_000;
        companyAbilityCooldownUntil.set("focused_fire", now + 75_000);
        for (const p of players) {
          if (p.hp <= 0 || p.downState || isInCover(p, now) || isStunned(p, now))
            continue;
          targets.set(p.id, target.id);
          // Immediate retarget cadence for a "simultaneous break + engage" feel.
          nextAttackAt.set(p.id, now);
        }
        const card = getCombatantCard(target.id);
        if (card) {
          spawnCombatPopup(card, "combat-suppress-popup", "Focused!", 1300);
        }
        applyFocusedFireTargeting(now);
      } else if (abilityId === "artillery_barrage") {
        const hit = Math.random() < 0.9;
        if (hit) {
          const pct = 0.3 + Math.random() * 0.2;
          const raw = Math.max(1, Math.ceil(target.maxHp * pct));
          const damage = computeFinalDamage(raw, target);
          target.hp = Math.max(0, Math.floor(target.hp - damage));
          const card = getCombatantCard(target.id);
          if (card) {
            spawnCombatPopup(
              card,
              "combat-damage-popup combat-grenade-damage-popup",
              String(damage),
              1500,
            );
            card.classList.add("combat-card-shake");
            setTimeout(() => card.classList.remove("combat-card-shake"), 350);
          }
          if (target.hp <= 0) {
            target.downState =
              target.side === "player" &&
              Math.random() < getIncapacitationChance(target)
                ? "incapacitated"
                : "kia";
            if (target.downState === "kia") target.killedBy = "Artillery";
            clearCombatantEffectsOnDeath(target);
          }
        } else {
          const card = getCombatantCard(target.id);
          if (card) spawnCombatPopup(card, "combat-miss-popup", "MISS", 1800);
        }
        companyAbilityUsesLeft.set(
          "artillery_barrage",
          Math.max(0, (companyAbilityUsesLeft.get("artillery_barrage") ?? 1) - 1),
        );
      } else if (abilityId === "napalm_barrage") {
        const hit = Math.random() < 0.9;
        if (hit) {
          const burnPct = 0.08 + Math.random() * 0.05;
          addBurnStack(target, now, {
            damagePerTick: Math.max(1, Math.ceil(target.maxHp * burnPct)),
            ticks: 3,
            ignoresMitigation: true,
          });
          const card = getCombatantCard(target.id);
          if (card) spawnCombatPopup(card, "combat-smoke-popup", "Napalm", 1500);
        } else {
          const card = getCombatantCard(target.id);
          if (card) spawnCombatPopup(card, "combat-miss-popup", "MISS", 1800);
        }
        companyAbilityUsesLeft.set(
          "napalm_barrage",
          Math.max(0, (companyAbilityUsesLeft.get("napalm_barrage") ?? 1) - 1),
        );
      }

      markCombatantDirty(target.id);
      clearCompanyAbilityTargeting();
      renderCompanyAbilityBar(true);
      updateCombatUI(true);
    }

    function executeAbilityAction(abilityId: string, soldierId: string): void {
      const ability = getSoldierAbilityById(abilityId);
      if (!ability) return;
      const combatant = players.find((p) => p.id === soldierId);
      if (!combatant) return;
      if (isStunned(combatant, Date.now())) return;
      if (ability.actionId === "take_cover") {
        handleTakeCoverAbility(combatant);
      } else if (ability.actionId === "suppress") {
        handleSuppressAbility(combatant);
      }
    }

    function handleCombatCardClick(e: Event, card: HTMLElement | null): void {
      e.stopPropagation();
      if (companyAbilityTargetingMode) {
        if (
          !card ||
          card.dataset.side !== "enemy" ||
          card.classList.contains("combat-card-down")
        ) {
          clearCompanyAbilityTargeting();
          return;
        }
        const targetId = card.dataset.combatantId;
        if (!targetId) return;
        const target = enemies.find((c) => c.id === targetId);
        if (!target || target.hp <= 0 || target.downState) return;
        applyCompanyAbilityOnTarget(companyAbilityTargetingMode.abilityId, target);
        return;
      }
      if (medTargetingMode) {
        if (
          medTargetingMode.user.hp <= 0 ||
          medTargetingMode.user.downState ||
          isStunned(medTargetingMode.user, Date.now())
        ) {
          closeAbilitiesPopup();
          return;
        }
        if (
          !card ||
          card.dataset.side !== "player" ||
          card.classList.contains("combat-card-down")
        ) {
          closeAbilitiesPopup();
          return;
        }
        const targetId = card.dataset.combatantId;
        if (!targetId) return;
        const target = players.find((c) => c.id === targetId);
        if (!target || target.hp <= 0 || target.downState) return;
        executeMedicalUse(
          medTargetingMode.user,
          target,
          medTargetingMode.medItem,
        );
        return;
      }
      if (suppressTargetingMode) {
        if (
          suppressTargetingMode.user.hp <= 0 ||
          suppressTargetingMode.user.downState ||
          isStunned(suppressTargetingMode.user, Date.now())
        ) {
          closeAbilitiesPopup();
          return;
        }
        if (
          !card ||
          card.dataset.side !== "enemy" ||
          card.classList.contains("combat-card-down")
        ) {
          closeAbilitiesPopup();
          return;
        }
        const targetId = card.dataset.combatantId;
        if (!targetId) return;
        const target = enemies.find((c) => c.id === targetId);
        if (!target || target.hp <= 0 || target.downState) return;
        executeSuppress(suppressTargetingMode.user, target);
        return;
      }
      if (grenadeTargetingMode) {
        if (
          grenadeTargetingMode.thrower.hp <= 0 ||
          grenadeTargetingMode.thrower.downState ||
          isStunned(grenadeTargetingMode.thrower, Date.now())
        ) {
          closeAbilitiesPopup();
          return;
        }
        if (
          !card ||
          card.dataset.side !== "enemy" ||
          card.classList.contains("combat-card-down")
        ) {
          closeAbilitiesPopup();
          return;
        }
        const targetId = card.dataset.combatantId;
        if (!targetId) return;
        const target = enemies.find((c) => c.id === targetId);
        if (!target || target.hp <= 0 || target.downState) return;
        executeGrenadeThrow(
          grenadeTargetingMode.thrower,
          target,
          grenadeTargetingMode.grenade,
        );
        return;
      }

      if (!card || card.classList.contains("combat-card-down")) return;
      const id = card.dataset.combatantId;
      if (!id) return;
      const combatant = allCombatants.find((c) => c.id === id);
      if (combatant?.side !== "player" || combatWinner) return;
      card.classList.remove("combat-card-tap-flash");
      card.classList.remove("combat-card-latched");
      card.classList.remove("combat-card-pressing");
      // Force reflow so repeated taps replay the flash immediately.
      void card.offsetWidth;
      card.classList.add("combat-card-pressing");
      card.classList.add("combat-card-tap-flash");
      window.setTimeout(
        () => card.classList.remove("combat-card-pressing"),
        100,
      );
      window.setTimeout(
        () => card.classList.remove("combat-card-tap-flash"),
        180,
      );
      openAbilitiesPopup(combatant, card);
    }

    primeCombatantDomCache();
    markAllCombatantsDirty();
    const setBackButtonEnabled = (enabled: boolean) => {
      const backBtn = s_(DOM.combat.backToReadyRoomBtn) as
        | HTMLButtonElement
        | null;
      if (!backBtn) return;
      backBtn.disabled = !enabled;
      backBtn.setAttribute("aria-disabled", enabled ? "false" : "true");
    };
    setBackButtonEnabled(true);
    renderCompanyAbilityBar(true);
    const startCombatSession = () => {
      if (combatStarted) return;
      const store = usePlayerCompanyStore.getState();
      const minEnergy = 5;
      const lowEnergy = players.filter((p) => {
        const s = store.company?.soldiers?.find((x) => x.id === p.id);
        return (s?.energy ?? 100) < minEnergy;
      });
      if (lowEnergy.length > 0) {
        const names = lowEnergy
          .map((p) => formatDisplayName(p.name))
          .join(", ");
        alert(
          `Need at least ${minEnergy} energy to deploy. Soldiers low on energy: ${names}`,
        );
        return;
      }
      combatStarted = true;
      setBackButtonEnabled(false);
      const btn = s_(DOM.combat.beginBtn) as HTMLButtonElement | null;
      if (btn) btn.setAttribute("hidden", "");
      const beginOverlay = document.getElementById(
        "combat-begin-overlay",
      ) as HTMLElement | null;
      if (beginOverlay) beginOverlay.setAttribute("hidden", "");
      combatRoot?.classList.remove("combat-prestart");
      primeCombatantDomCache();
      markAllCombatantsDirty();
      renderCompanyAbilityBar(true);
      startCombatLoop();
    };
    if (isDevTestCombat) {
      window.setTimeout(() => startCombatSession(), 0);
    }

    return [
      {
        selector: DOM.combat.abilitiesPopup,
        eventType: "pointerdown",
        callback: (e: Event) => {
          const ev = e as PointerEvent;
          if (ev.pointerType === "mouse" && ev.button !== 0) return;
          const t = e.target as HTMLElement;
          const grenadeBtn = t.closest(".combat-grenade-item");
          const medBtn = t.closest(".combat-med-item");
          const abilityBtn = t.closest(".combat-ability-icon-slot");
          if (medBtn && !(medBtn as HTMLButtonElement).disabled) {
            e.preventDefault();
            e.stopPropagation();
            const soldierId = (medBtn as HTMLElement).dataset.soldierId;
            const idxStr = (medBtn as HTMLElement).dataset.inventoryIndex;
            if (!soldierId || idxStr == null) return;
            const inventoryIndex = parseInt(idxStr, 10);
            const user = players.find((p) => p.id === soldierId);
            if (!user || user.hp <= 0 || user.downState) return;
            if (isStunned(user, Date.now())) return;
            const soldier = getSoldierFromStore(soldierId);
            const medItemsList = soldier
              ? getSoldierMedItems(soldier.inventory)
              : [];
            const m = medItemsList.find(
              (mr) => mr.inventoryIndex === inventoryIndex,
            );
            if (!m) return;
            const isMedic = (user.designation ?? "").toLowerCase() === "medic";
            /* Non-medics can only use stim/medkit on themselves; medic can target allies */
            if (!isMedic) {
              executeMedicalUse(user, user, m);
              return;
            }
            medTargetingMode = { user, medItem: m };
            showMedTargetingHint(user, m);
            document
              .querySelectorAll(
                "#combat-players-grid .combat-card:not(.combat-card-down)",
              )
              .forEach((card) => {
                card.classList.add("combat-card-heal-target");
              });
            return;
          }
          if (grenadeBtn && !(grenadeBtn as HTMLButtonElement).disabled) {
            e.preventDefault();
            e.stopPropagation();
            const soldierId = (grenadeBtn as HTMLElement).dataset.soldierId;
            const idxStr = (grenadeBtn as HTMLElement).dataset.inventoryIndex;
            if (!soldierId || idxStr == null) return;
            const inventoryIndex = parseInt(idxStr, 10);
            const thrower = players.find((p) => p.id === soldierId);
            if (!thrower || thrower.hp <= 0 || thrower.downState) return;
            if (isStunned(thrower, Date.now())) return;
            const soldier = getSoldierFromStore(soldierId);
            const grenades = soldier
              ? getSoldierGrenades(soldier.inventory)
              : [];
            const g = grenades.find(
              (gr) => gr.inventoryIndex === inventoryIndex,
            );
            if (!g) return;
            const isKnife = g.item.id === "tk21_throwing_knife";
            const grenadeOnCooldown =
              !isKnife && (thrower.grenadeCooldownUntil ?? 0) > Date.now();
            if (grenadeOnCooldown) return;
            grenadeTargetingMode = { thrower, grenade: g };
            showGrenadeTargetingHint(thrower, g);
            document
              .querySelectorAll(
                "#combat-enemies-grid .combat-card:not(.combat-card-down)",
              )
              .forEach((card) => {
                card.classList.add("combat-card-grenade-target");
              });
            return;
          }
          if (abilityBtn && !(abilityBtn as HTMLButtonElement).disabled) {
            e.preventDefault();
            e.stopPropagation();
            const soldierId = (abilityBtn as HTMLElement).dataset.soldierId;
            const abilityId = (abilityBtn as HTMLElement).dataset.abilityId;
            if (!soldierId || !abilityId) return;
            executeAbilityAction(abilityId, soldierId);
            return;
          }
        },
      },
      {
        selector: "#combat-company-abilities-bar",
        eventType: "pointerdown",
        callback: (e: Event) => {
          const ev = e as PointerEvent;
          if (ev.pointerType === "mouse" && ev.button !== 0) return;
          handleCompanyAbilityBarActivate(e);
        },
      },
      {
        selector: "#combat-company-abilities-bar",
        eventType: "click",
        callback: (e: Event) => {
          handleCompanyAbilityBarActivate(e);
        },
      },
      {
        selector: DOM.combat.battleArea,
        eventType: "click",
        callback: (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.closest("#combat-company-abilities-bar")) return;
          const popup = document.getElementById("combat-abilities-popup");
          if (popup?.contains(target)) return;
          if (target.closest(".combat-card")) return;
          if (companyAbilityTargetingMode) {
            clearCompanyAbilityTargeting();
            return;
          }
          if (
            grenadeTargetingMode ||
            medTargetingMode ||
            suppressTargetingMode ||
            companyAbilityTargetingMode
          ) {
            closeAbilitiesPopup();
            return;
          }
          closeAbilitiesPopup();
        },
      },
      {
        selector: "#combat-screen",
        eventType: "click",
        callback: (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.closest("#combat-company-abilities-bar")) return;
          const popup = document.getElementById("combat-abilities-popup");
          if (popup?.getAttribute("aria-hidden") === "true") return;
          if (popup?.contains(target)) return;
          if (target.closest(".combat-card")) return;
          if (companyAbilityTargetingMode) {
            clearCompanyAbilityTargeting();
            return;
          }
          if (
            grenadeTargetingMode ||
            medTargetingMode ||
            suppressTargetingMode ||
            companyAbilityTargetingMode
          ) {
            closeAbilitiesPopup();
            return;
          }
          closeAbilitiesPopup();
        },
      },
      {
        selector: ".combat-card",
        eventType: "pointerup",
        callback: (e: Event) => {
          const ev = e as PointerEvent;
          if (ev.pointerType === "mouse" && ev.button !== 0) return;
          const card = (e.currentTarget as HTMLElement).closest(
            ".combat-card",
          ) as HTMLElement | null;
          if (!card) return;
          combatCardLastPointerUpAt.set(card, Date.now());
          handleCombatCardClick(e, card);
        },
      },
      {
        selector: ".combat-card",
        eventType: "click",
        callback: (e: Event) => {
          const card = (e.currentTarget as HTMLElement).closest(
            ".combat-card",
          ) as HTMLElement | null;
          if (!card) return;
          const lastPointerUpAt = combatCardLastPointerUpAt.get(card) ?? 0;
          if (Date.now() - lastPointerUpAt < 400) return;
          handleCombatCardClick(e, card);
        },
      },
      {
        selector: DOM.combat.beginBtn,
        eventType: "click",
        callback: () => {
          startCombatSession();
        },
      },
      {
        selector: DOM.combat.backToReadyRoomBtn,
        eventType: "click",
        callback: () => {
          if (combatStarted) return;
          if (missionForCombat) {
            UiManager.renderReadyRoomScreen(missionForCombat);
            return;
          }
          UiManager.renderMissionsScreen();
        },
      },
      {
        selector: DOM.combat.missionDetailsBtn,
        eventType: "click",
        callback: () => {
          const screen = document.getElementById("combat-screen");
          const missionJson = screen?.getAttribute("data-mission-json");
          const popup = document.getElementById("combat-mission-details-popup");
          const titleEl = document.getElementById(
            "combat-mission-details-title",
          );
          const bodyEl = document.getElementById("combat-mission-details-body");
          if (!popup || !titleEl || !bodyEl) return;
          if (missionJson) {
            try {
              const m = JSON.parse(
                missionJson.replace(/&quot;/g, '"'),
              ) as Mission;
              const meta = MISSION_KIND_META[m.kind];
              const kindName = meta?.name ?? m.kind.replace(/_/g, " ");
              const diffLabel = DIFFICULTY_LABELS[m.difficulty] ?? "Unknown";
              titleEl.textContent = m.name;
              bodyEl.innerHTML = `
                <p><strong>Type:</strong> ${kindName}</p>
                <p><strong>Difficulty:</strong> ${diffLabel}</p>
                <p><strong>Enemies:</strong> ${m.enemyCount}</p>
                <p><strong>Reward:</strong> $${m.creditReward}</p>
                ${m.flavorText ? `<p class="combat-mission-details-flavor">${m.flavorText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : ""}
              `;
            } catch {
              titleEl.textContent = "Combat";
              bodyEl.innerHTML = "<p>No mission data (Combat Test).</p>";
            }
          } else {
            titleEl.textContent = "Combat";
            bodyEl.innerHTML = "<p>No mission data (Combat Test).</p>";
          }
          popup.removeAttribute("hidden");
        },
      },
      {
        selector: "#combat-mission-details-close",
        eventType: "click",
        callback: () => {
          const popup = document.getElementById("combat-mission-details-popup");
          if (popup) popup.setAttribute("hidden", "");
        },
      },
      {
        selector: DOM.combat.quitBtn,
        eventType: "click",
        callback: () => {
          const popup = document.getElementById("combat-quit-confirm-popup");
          if (popup) popup.removeAttribute("hidden");
        },
      },
      {
        selector: DOM.combat.quitConfirmYes,
        eventType: "click",
        callback: () => {
          if (combatTickId != null) {
            clearTimeout(combatTickId);
            combatTickId = null;
          }
          closeAbilitiesPopup();
          processQuitMissionOutcome();
          if (!isDevTestCombat) {
            const store = usePlayerCompanyStore.getState();
            store.deductQuitMissionEnergy(players.map((p) => p.id));
          }
          const popup = document.getElementById("combat-quit-confirm-popup");
          if (popup) popup.setAttribute("hidden", "");
          UiManager.renderMissionsScreen();
        },
      },
      {
        selector: DOM.combat.quitConfirmNo,
        eventType: "click",
        callback: () => {
          const popup = document.getElementById("combat-quit-confirm-popup");
          if (popup) popup.setAttribute("hidden", "");
        },
      },
      {
        selector: "#combat-screen",
        eventType: "click",
        callback: (e: Event) => {
          const clicked = e.target as HTMLElement;
          const summaryInner = clicked.closest(
            ".combat-summary-inner",
          ) as HTMLElement | null;
          if (
            !clicked.closest(".combat-summary-new-trait-btn") &&
            !clicked.closest(".combat-summary-trait-popup")
          ) {
            summaryInner
              ?.querySelector(".combat-summary-trait-popup")
              ?.remove();
          }
          const traitBtn = clicked.closest(
            ".combat-summary-new-trait-btn",
          ) as HTMLButtonElement | null;
          if (traitBtn) {
            e.stopPropagation();
            const card = traitBtn.closest(".combat-card") as HTMLElement | null;
            if (!card) return;
            const hostSummaryInner = card.closest(
              ".combat-summary-inner",
            ) as HTMLElement | null;
            hostSummaryInner
              ?.querySelector(".combat-summary-trait-popup")
              ?.remove();
            let awards: EarnedTraitAward[] = [];
            try {
              const parsed = JSON.parse(
                traitBtn.dataset.traitsJson ?? "[]",
              ) as unknown;
              if (Array.isArray(parsed)) {
                awards = parsed.filter(
                  (x): x is EarnedTraitAward =>
                    typeof x === "object" && x != null && "id" in x,
                ) as EarnedTraitAward[];
              }
            } catch {
              awards = [];
            }
            if (awards.length === 0) return;
            const popup = document.createElement("div");
            popup.className = "combat-summary-trait-popup";
            popup.innerHTML = awards
              .map((a) => {
                const badges = traitStatBadgesHtml(
                  a.stats,
                  a.grenadeHitBonusPct ?? 0,
                );
                return `<div class="combat-summary-trait-popup-entry">
                <div class="combat-summary-trait-popup-title">${esc(a.name)}</div>
                <div class="combat-summary-trait-popup-text">${esc(a.flavor)}</div>
                ${badges ? `<div class="combat-summary-trait-popup-badges">${badges}</div>` : ""}
              </div>`;
              })
              .join("");
            if (hostSummaryInner) {
              const cardRect = card.getBoundingClientRect();
              const hostRect = hostSummaryInner.getBoundingClientRect();
              const popupWidth = Math.min(
                360,
                Math.max(240, hostRect.width - 20),
              );
              popup.style.width = `${popupWidth}px`;
              const maxLeft = Math.max(10, hostRect.width - popupWidth - 10);
              const left = Math.max(
                10,
                Math.min(maxLeft, cardRect.left - hostRect.left - 10),
              );
              const top = Math.max(
                56,
                Math.min(
                  hostRect.height - 120,
                  cardRect.top - hostRect.top + 10,
                ),
              );
              popup.style.left = `${left}px`;
              popup.style.top = `${top}px`;
              hostSummaryInner.appendChild(popup);
            } else {
              card.appendChild(popup);
            }
            window.setTimeout(() => popup.remove(), 3800);
            return;
          }
          const target = clicked.closest("#combat-summary-return");
          if (!target) return;
          e.stopPropagation();
          if (!isDevTestCombat) {
            const store = usePlayerCompanyStore.getState();
            store.syncCombatHpToSoldiers(
              players.map((p) => ({ id: p.id, hp: p.maxHp })),
            );
          }
          if (combatTickId != null) {
            clearTimeout(combatTickId);
            combatTickId = null;
          }
          closeAbilitiesPopup();
          const onboardingMission =
            missionForCombat?.id?.startsWith("onboarding_");
          if (onboardingMission) {
            const st = usePlayerCompanyStore.getState();
            st.setOnboardingRecruitStep("home_popup");
            UiManager.renderCompanyHomePage();
            return;
          }
          UiManager.renderMissionsScreen();
        },
      },
    ];
  }

  function hideEquipSlotTooltipAndDeselectSlots() {
    document.querySelectorAll("[id='equip-slot-tooltip']").forEach((tt) => {
      (tt as HTMLElement).hidden = true;
      tt.classList.remove("equip-slot-tooltip-visible");
    });
    document
      .querySelectorAll(".equip-slot")
      .forEach((el) =>
        el.classList.remove("equip-slot-selected", "equip-slot-highlight"),
      );
  }

  function openAvailableSuppliesPopup(
    picker: HTMLElement,
    soldierId: string,
    slotType: "weapon" | "armor" | "equipment",
    eqIndex: number,
  ) {
    const store = usePlayerCompanyStore.getState();
    const armory = store.company?.inventory ?? [];
    const soldier = store.company?.soldiers?.find((s) => s.id === soldierId);
    if (!soldier) return;
    const itemsWithMeta = armory
      .map((item, idx) => ({ item, armoryIndex: idx }))
      .filter(({ item }) => itemFitsSlot(item, slotType))
      .map(({ item, armoryIndex }) => {
        const canEquip =
          canEquipItemLevel(item, soldier) &&
          (slotType !== "weapon" || weaponWieldOk(item, soldier));
        return { item, armoryIndex, canEquip };
      });
    const grid = document.getElementById("equip-supplies-grid");
    const popup = document.getElementById("equip-supplies-popup");
    const titleEl = document.getElementById("equip-supplies-title");
    if (!grid || !popup) return;
    const titleByType = {
      weapon: "Weapons",
      armor: "Armor",
      equipment: "Supplies",
    };
    if (titleEl) titleEl.textContent = titleByType[slotType] ?? "Armory";
    const esc = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const WEAPON_ROLE_LABELS: Record<string, string> = {
      rifleman: "Rifleman",
      support: "Gunner",
      medic: "Medic",
      any: "Any",
    };
    grid.innerHTML =
      itemsWithMeta.length === 0
        ? '<div class="equip-supplies-empty">No items in armory for this slot.</div>'
        : itemsWithMeta
            .map(({ item, armoryIndex, canEquip }) => {
              const iconUrl = getItemIconUrl(item);
              const uses = item.uses ?? item.quantity;
              const rarity = item.rarity ?? "common";
              const json = JSON.stringify(item).replace(/"/g, "&quot;");
              const unusableClass = canEquip
                ? ""
                : " equip-supplies-item-unusable";
              const weaponRole =
                slotType === "weapon"
                  ? (getWeaponRestrictRole(item) ??
                    (
                      item as {
                        restrictRole?: string;
                      }
                    ).restrictRole ??
                    "any")
                  : null;
              const roleLabelHtml = weaponRole
                ? `<span class="equip-supplies-role-label role-${weaponRole}">${WEAPON_ROLE_LABELS[weaponRole] ?? weaponRole}</span>`
                : "";
              return `
<button type="button" class="equip-supplies-item equip-slot equip-slot-filled${rarity !== "common" ? ` rarity-${rarity}` : ""}${unusableClass}" data-armory-index="${armoryIndex}" data-item-json="${json}" data-can-equip="${canEquip}" title="${esc(item.name ?? "")}">
  <div class="equip-slot-inner">
    <img src="${iconUrl}" alt="${item.name}" width="48" height="48">
    ${renderItemLevelBadge(item, "equip-slot-level")}
    ${uses != null ? `<span class="equip-slot-uses-badge">×${uses}</span>` : ""}
    ${roleLabelHtml}
  </div>
</button>`;
            })
            .join("");
    (picker as HTMLElement).dataset.suppliesTargetSoldierId = soldierId;
    (picker as HTMLElement).dataset.suppliesTargetSlotType = slotType;
    (picker as HTMLElement).dataset.suppliesTargetEqIndex = String(eqIndex);
    popup.removeAttribute("hidden");
  }

  const equipPickerEventConfig: HandlerInitConfig[] = [
    {
      selector: ".item-stats-popup-unequip-btn",
      eventType: "click",
      callback: (e: Event) => {
        const btn = (e.target as HTMLElement).closest(
          ".item-stats-popup-unequip-btn",
        ) as HTMLElement | null;
        if (!btn) return;
        e.preventDefault();
        const soldierId = btn.dataset.unequipSoldierId;
        const slotType = btn.dataset.unequipSlotType as
          | "weapon"
          | "armor"
          | "equipment";
        const eqIdxStr = btn.dataset.unequipEqIndex;
        if (!soldierId || !slotType) return;
        const eqIndex =
          slotType === "equipment" && eqIdxStr != null
            ? parseInt(eqIdxStr, 10)
            : 0;
        const result = usePlayerCompanyStore
          .getState()
          .unequipItemToArmory(
            soldierId,
            slotType,
            slotType === "equipment" ? eqIndex : undefined,
          );
        if (result.success) {
          const popup = document.getElementById("item-stats-popup");
          const picker = document.getElementById("equip-picker-popup");
          const tt = document.getElementById("equip-slot-tooltip");
          if (popup) {
            (popup as HTMLElement).classList.remove("item-stats-popup-popover");
            delete (popup as HTMLElement).dataset.popoverPlacement;
            (popup as HTMLElement).style.cssText = "";
            popup.hidden = true;
          }
          if (tt) {
            tt.hidden = true;
            tt.classList.remove("equip-slot-tooltip-visible");
          }
          document
            .querySelectorAll(".equip-slot")
            .forEach((el) =>
              el.classList.remove(
                "equip-slot-selected",
                "equip-slot-highlight",
              ),
            );
          if (picker) {
            picker
              .querySelectorAll(".equip-slot-unequip-wrap")
              .forEach((el) => el.remove());
            UiManager.refreshEquipPickerContent?.();
            openAvailableSuppliesPopup(
              picker as HTMLElement,
              soldierId,
              slotType,
              eqIndex,
            );
          }
        }
      },
    },
    {
      selector: "#equip-picker-close",
      eventType: "click",
      callback: () => {
        const picker = document.getElementById("equip-picker-popup");
        if (!picker) return;
        const tt = document.getElementById("equip-slot-tooltip");
        if (tt) {
          tt.hidden = true;
          tt.classList.remove("equip-slot-tooltip-visible");
        }
        const supplies = document.getElementById("equip-supplies-popup");
        if (supplies) supplies.setAttribute("hidden", "");
        picker
          .querySelectorAll(".equip-slot-unequip-wrap")
          .forEach((el) => el.remove());
        const openedFrom = (picker as HTMLElement).dataset.openedFrom;
        picker.setAttribute("hidden", "");
        if (openedFrom === "roster") UiManager.renderRosterScreen();
        else if (openedFrom === "inventory") UiManager.renderInventoryScreen();
      },
    },
    {
      selector: "#equip-supplies-close",
      eventType: "click",
      callback: () => {
        const supplies = document.getElementById("equip-supplies-popup");
        const picker = document.getElementById("equip-picker-popup");
        const tt = document.getElementById("equip-slot-tooltip");
        if (tt) {
          tt.hidden = true;
          tt.classList.remove("equip-slot-tooltip-visible");
        }
        if (supplies) supplies.setAttribute("hidden", "");
        document
          .querySelectorAll(".equip-slot")
          .forEach((el) =>
            el.classList.remove("equip-slot-selected", "equip-slot-highlight"),
          );
        document
          .querySelectorAll(".equip-supplies-item")
          .forEach((el) => el.classList.remove("equip-supplies-item-selected"));
        if (picker) {
          (picker as HTMLElement).dataset.preselectedItem = "";
          (picker as HTMLElement).dataset.preselectedArmoryIndex = "";
        }
      },
    },
    {
      selector: "#equip-picker-popup",
      eventType: "click",
      callback: (e: Event) => {
        const target = e.target as HTMLElement;
        const picker = document.getElementById("equip-picker-popup");
        const supplies = document.getElementById("equip-supplies-popup");
        if (!picker || picker.hasAttribute("hidden")) return;
        if (target.closest("#equip-picker-close")) return;
        if (target.closest("#equip-supplies-close")) return;

        /* Dismiss unequip wrap when clicking outside slots/unequip */
        const existingUnequip = picker.querySelector(
          ".equip-slot-unequip-wrap",
        );
        if (
          existingUnequip &&
          !target.closest(".equip-slot-unequip-wrap") &&
          !target.closest(".equip-slot")
        ) {
          existingUnequip.remove();
          hideEquipSlotTooltipAndDeselectSlots();
        }
        /* Close supplies popup when clicking outside slots/armory items */
        if (
          supplies &&
          !supplies.hasAttribute("hidden") &&
          !target.closest(".equip-slot") &&
          !target.closest(".equip-supplies-item") &&
          !target.closest(".equip-slot-unequip-wrap") &&
          !target.closest("#equip-slot-tooltip") &&
          !target.closest("#item-stats-popup")
        ) {
          hideEquipSlotTooltipAndDeselectSlots();
          supplies.setAttribute("hidden", "");
          picker
            .querySelectorAll(".equip-slot-unequip-wrap")
            .forEach((el) => el.remove());
        }

        const unequipPopBtn = target.closest(".equip-slot-unequip-btn");
        if (unequipPopBtn) {
          e.preventDefault();
          const btn = unequipPopBtn as HTMLElement;
          const soldierId = btn.dataset.unequipSoldierId;
          const slotType = btn.dataset.unequipSlotType as
            | "weapon"
            | "armor"
            | "equipment";
          const eqIdxStr = btn.dataset.unequipEqIndex;
          if (soldierId && slotType) {
            const eqIndex =
              slotType === "equipment" && eqIdxStr != null
                ? parseInt(eqIdxStr, 10)
                : 0;
            const result = usePlayerCompanyStore
              .getState()
              .unequipItemToArmory(
                soldierId,
                slotType,
                slotType === "equipment" ? eqIndex : undefined,
              );
            if (result.success) {
              btn.closest(".equip-slot-unequip-wrap")?.remove();
              document
                .querySelectorAll(".equip-slot")
                .forEach((el) =>
                  el.classList.remove(
                    "equip-slot-selected",
                    "equip-slot-highlight",
                  ),
                );
              UiManager.refreshEquipPickerContent?.();
              openAvailableSuppliesPopup(
                picker as HTMLElement,
                soldierId,
                slotType,
                eqIndex,
              );
            }
          }
          return;
        }

        const suppliesItem = target.closest(
          ".equip-supplies-item",
        ) as HTMLElement | null;
        if (suppliesItem) {
          e.preventDefault();
          const soldierId = (picker as HTMLElement).dataset
            .suppliesTargetSoldierId;
          const slotType = (picker as HTMLElement).dataset
            .suppliesTargetSlotType as "weapon" | "armor" | "equipment";
          const eqIdxStr = (picker as HTMLElement).dataset
            .suppliesTargetEqIndex;
          const armoryIdxStr = suppliesItem.dataset.armoryIndex;
          const itemJson = suppliesItem.dataset.itemJson;

          /* Item-first: no slot selected – allow clicking any item to select and highlight valid slots */
          if (!soldierId && armoryIdxStr != null && itemJson) {
            const item = JSON.parse(itemJson.replace(/&quot;/g, '"'));
            (picker as HTMLElement).dataset.preselectedItem = itemJson;
            (picker as HTMLElement).dataset.preselectedArmoryIndex =
              armoryIdxStr;
            document
              .querySelectorAll(".equip-slot")
              .forEach((el) =>
                el.classList.remove(
                  "equip-slot-selected",
                  "equip-slot-highlight",
                ),
              );
            picker
              .querySelectorAll(".equip-slot-unequip-wrap")
              .forEach((el) => el.remove());
            const soldiers =
              usePlayerCompanyStore.getState().company?.soldiers ?? [];
            soldiers.forEach((s) => {
              const slotsToCheck: {
                type: "weapon" | "armor" | "equipment";
                eqIndex: number;
              }[] = itemFitsSlot(item, "weapon")
                ? [{ type: "weapon", eqIndex: 0 }]
                : itemFitsSlot(item, "armor")
                  ? [{ type: "armor", eqIndex: 0 }]
                  : itemFitsSlot(item, "equipment")
                    ? [
                        {
                          type: "equipment",
                          eqIndex: 0,
                        },
                        { type: "equipment", eqIndex: 1 },
                      ]
                    : [];
              for (const { type, eqIndex } of slotsToCheck) {
                const canReceive =
                  canEquipItemLevel(item, s) &&
                  (type !== "weapon" || weaponWieldOk(item, s));
                if (canReceive) {
                  const sel = `.equip-slot[data-soldier-id="${s.id}"][data-slot-type="${type}"]${type === "equipment" ? `[data-eq-index="${eqIndex}"]` : ""}`;
                  picker
                    .querySelectorAll(sel)
                    .forEach((destSlot) =>
                      (destSlot as HTMLElement).classList.add(
                        "equip-slot-highlight",
                      ),
                    );
                }
              }
            });
            document
              .querySelectorAll(".equip-supplies-item")
              .forEach((el) =>
                el.classList.remove("equip-supplies-item-selected"),
              );
            suppliesItem.classList.add("equip-supplies-item-selected");
            return;
          }

          /* Slot-first: block unusable items (e.g. medic weapon for rifleman slot) */
          if (soldierId && suppliesItem.dataset.canEquip === "false") return;

          if (
            soldierId &&
            slotType &&
            eqIdxStr != null &&
            armoryIdxStr != null &&
            itemJson
          ) {
            const eqIndex = parseInt(eqIdxStr, 10);
            const slotSelector = `.equip-slot[data-soldier-id="${soldierId}"][data-slot-type="${slotType}"]${slotType === "equipment" ? `[data-eq-index="${eqIndex}"]` : ""}`;
            const slotEl = picker.querySelector(
              slotSelector,
            ) as HTMLElement | null;
            const item = JSON.parse(itemJson.replace(/&quot;/g, '"'));
            const armoryIndex = parseInt(armoryIdxStr, 10);
            const slot = slotType === "equipment" ? "equipment" : slotType;

            const runEquipAndRefresh = () => {
              const result = usePlayerCompanyStore
                .getState()
                .equipItemToSoldier(soldierId!, slot, item, {
                  fromArmoryIndex: armoryIndex,
                  equipmentIndex:
                    slotType === "equipment" ? eqIndex : undefined,
                });
              if (result.success) {
                UiManager.refreshEquipPickerContent?.();
                document
                  .querySelectorAll(".equip-slot")
                  .forEach((el) =>
                    el.classList.remove(
                      "equip-slot-selected",
                      "equip-slot-highlight",
                    ),
                  );
                picker
                  .querySelectorAll(".equip-slot-unequip-wrap")
                  .forEach((el) => el.remove());
                document
                  .querySelectorAll(".equip-supplies-item")
                  .forEach((el) =>
                    el.classList.remove("equip-supplies-item-selected"),
                  );
                openAvailableSuppliesPopup(
                  picker as HTMLElement,
                  soldierId,
                  slotType,
                  eqIndex,
                );
                (picker as HTMLElement).dataset.suppliesTargetSoldierId = "";
                requestAnimationFrame(() => {
                  const newSlot = picker.querySelector(
                    slotSelector,
                  ) as HTMLElement | null;
                  if (newSlot) {
                    newSlot.classList.add("equip-slot-plop");
                    setTimeout(
                      () => newSlot.classList.remove("equip-slot-plop"),
                      450,
                    );
                  }
                });
              }
            };

            if (slotEl) {
              const img = suppliesItem.querySelector("img");
              const clone = document.createElement("div");
              clone.className = "equip-fly-clone";
              if (img) {
                const cloneImg = img.cloneNode(true) as HTMLImageElement;
                cloneImg.style.width = "40px";
                cloneImg.style.height = "40px";
                clone.appendChild(cloneImg);
              }
              document.body.appendChild(clone);
              const startRect = suppliesItem.getBoundingClientRect();
              const endRect = slotEl.getBoundingClientRect();
              const startX = startRect.left + (startRect.width - 44) / 2;
              const startY = startRect.top + (startRect.height - 44) / 2;
              const endX = endRect.left + (endRect.width - 44) / 2;
              const endY = endRect.top + (endRect.height - 44) / 2;
              clone.style.left = `${startX}px`;
              clone.style.top = `${startY}px`;
              const dx = endX - startX;
              const dy = endY - startY;
              clone
                .animate(
                  [
                    { transform: "translate(0, 0) scale(1)" },
                    { transform: `translate(${dx}px, ${dy}px) scale(1.15)` },
                  ],
                  {
                    duration: 280,
                    easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  },
                )
                .finished.then(() => {
                  clone.remove();
                  runEquipAndRefresh();
                });
            } else {
              runEquipAndRefresh();
            }
          }
          return;
        }

        const unequipBtn = target.closest(
          ".equip-unequip-all-btn",
        ) as HTMLElement | null;
        if (unequipBtn) {
          const soldierId = unequipBtn.dataset.soldierId;
          if (soldierId) {
            const store = usePlayerCompanyStore.getState();
            const slots: {
              type: "weapon" | "armor" | "equipment";
              eqIndex?: number;
            }[] = [
              { type: "weapon" },
              { type: "armor" },
              { type: "equipment", eqIndex: 0 },
              { type: "equipment", eqIndex: 1 },
            ];
            for (const { type, eqIndex } of slots) {
              const r = store.unequipItemToArmory(soldierId, type, eqIndex);
              if (!r.success) break;
            }
            UiManager.refreshEquipPickerContent?.();
          }
          return;
        }

        if (!target.closest(".equip-picker-inner")) {
          const tt = document.getElementById("equip-slot-tooltip");
          if (tt) {
            tt.hidden = true;
            tt.classList.remove("equip-slot-tooltip-visible");
          }
          picker.setAttribute("hidden", "");
          const openedFrom = (picker as HTMLElement).dataset.openedFrom;
          if (openedFrom === "roster") UiManager.renderRosterScreen();
          else if (openedFrom === "inventory")
            UiManager.renderInventoryScreen();
          return;
        }

        const preselectedJson = (picker as HTMLElement).dataset.preselectedItem;
        const preselectedIdxStr = (picker as HTMLElement).dataset
          .preselectedArmoryIndex;
        /* Only match slots in soldier cards, not supplies grid items */
        const slotEl = target.closest(
          ".equip-picker-soldiers-list .equip-slot[data-soldier-id]",
        ) as HTMLElement | null;

        /* Click outside slots (header, empty area, armory popup): hide tooltip and deselect */
        if (!slotEl) {
          hideEquipSlotTooltipAndDeselectSlots();
          picker
            .querySelectorAll(".equip-slot-unequip-wrap")
            .forEach((el) => el.remove());
          return;
        }

        const soldiers =
          usePlayerCompanyStore.getState().company?.soldiers ?? [];

        if (slotEl) {
          e.preventDefault();
          const soldierId = slotEl.dataset.soldierId;
          if (!soldierId) return;
          const slotType = slotEl.dataset.slotType as
            | "weapon"
            | "armor"
            | "equipment";
          const slotItemJson = slotEl.dataset.slotItem;
          const eqIndex =
            slotEl.dataset.eqIndex !== undefined
              ? parseInt(slotEl.dataset.eqIndex, 10)
              : 0;
          const selectedSlot = picker.querySelector(
            ".equip-picker-soldiers-list .equip-slot-selected",
          ) as HTMLElement | null;

          /* Move between soldiers: click highlighted destination to move */
          if (
            selectedSlot &&
            slotEl.classList.contains("equip-slot-highlight")
          ) {
            const tt = document.getElementById("equip-slot-tooltip");
            if (tt) {
              tt.hidden = true;
              tt.classList.remove("equip-slot-tooltip-visible");
            }
            const srcSoldierId = selectedSlot.dataset.soldierId!;
            const srcSlotType = selectedSlot.dataset.slotType as
              | "weapon"
              | "armor"
              | "equipment";
            const srcEqIdx =
              selectedSlot.dataset.eqIndex != null
                ? parseInt(selectedSlot.dataset.eqIndex, 10)
                : undefined;
            const destSoldierId = slotEl.dataset.soldierId!;
            const destSlotType = slotEl.dataset.slotType as
              | "weapon"
              | "armor"
              | "equipment";
            const destEqIdx =
              slotEl.dataset.eqIndex != null
                ? parseInt(slotEl.dataset.eqIndex, 10)
                : undefined;
            selectedSlot.classList.add("equip-slot-swap-source");
            slotEl.classList.add("equip-slot-swap-dest");
            document
              .querySelectorAll(".equip-slot")
              .forEach((el) =>
                el.classList.remove(
                  "equip-slot-selected",
                  "equip-slot-highlight",
                ),
              );
            setTimeout(() => {
              const result = usePlayerCompanyStore
                .getState()
                .moveItemBetweenSlots({
                  sourceSoldierId: srcSoldierId,
                  sourceSlotType: srcSlotType,
                  sourceEqIndex:
                    srcSlotType === "equipment" ? srcEqIdx : undefined,
                  destSoldierId,
                  destSlotType,
                  destEqIndex:
                    destSlotType === "equipment" ? destEqIdx : undefined,
                });
              if (result.success) {
                UiManager.refreshEquipPickerContent?.();
                openAvailableSuppliesPopup(
                  picker as HTMLElement,
                  srcSoldierId,
                  srcSlotType,
                  srcEqIdx ?? 0,
                );
              }
            }, 280);
            return;
          }

          /* Deselect: click same selected slot again */
          if (selectedSlot === slotEl) {
            const tt = document.getElementById("equip-slot-tooltip");
            if (tt) {
              tt.hidden = true;
              tt.classList.remove("equip-slot-tooltip-visible");
            }
            slotEl.classList.remove("equip-slot-selected");
            document
              .querySelectorAll(".equip-slot")
              .forEach((el) => el.classList.remove("equip-slot-highlight"));
            picker
              .querySelectorAll(".equip-slot-unequip-wrap")
              .forEach((el) => el.remove());
            return;
          }

          /* Preselected from inventory/armory: equip to this slot if valid, with fly animation */
          if (preselectedJson && preselectedIdxStr != null) {
            const item = JSON.parse(preselectedJson.replace(/&quot;/g, '"'));
            const soldier = soldiers.find((s) => s.id === soldierId);
            if (soldier) {
              let valid = false;
              if (
                slotType === "weapon" &&
                itemFitsSlot(item, "weapon") &&
                weaponWieldOk(item, soldier)
              )
                valid = true;
              else if (slotType === "armor" && item.type === "armor")
                valid = true;
              else if (
                slotType === "equipment" &&
                itemFitsSlot(item, "equipment")
              )
                valid = true;
              if (valid) {
                const armoryIndex = parseInt(preselectedIdxStr, 10);
                const slot = slotType === "equipment" ? "equipment" : slotType;
                const eqIdx =
                  slotType === "equipment" &&
                  slotEl.dataset.eqIndex !== undefined
                    ? parseInt(slotEl.dataset.eqIndex, 10)
                    : undefined;
                const suppliesItem = document.querySelector(
                  ".equip-supplies-item.equip-supplies-item-selected",
                ) as HTMLElement | null;
                const slotSelector = `.equip-slot[data-soldier-id="${soldierId}"][data-slot-type="${slotType}"]${slotType === "equipment" ? `[data-eq-index="${eqIdx ?? 0}"]` : ""}`;

                const runEquipAndRefresh = () => {
                  const result = usePlayerCompanyStore
                    .getState()
                    .equipItemToSoldier(soldierId, slot, item, {
                      fromArmoryIndex: armoryIndex,
                      equipmentIndex: eqIdx,
                    });
                  if (result.success) {
                    (picker as HTMLElement).dataset.preselectedItem = "";
                    (picker as HTMLElement).dataset.preselectedArmoryIndex = "";
                    document
                      .querySelectorAll(".equip-slot")
                      .forEach((el) =>
                        el.classList.remove("equip-slot-highlight"),
                      );
                    document
                      .querySelectorAll(".equip-supplies-item")
                      .forEach((el) =>
                        el.classList.remove("equip-supplies-item-selected"),
                      );
                    UiManager.refreshEquipPickerContent?.();
                    const suppliesPopup = document.getElementById(
                      "equip-supplies-popup",
                    );
                    if (
                      suppliesPopup &&
                      !suppliesPopup.hasAttribute("hidden")
                    ) {
                      openAvailableSuppliesPopup(
                        picker as HTMLElement,
                        soldierId,
                        slotType,
                        eqIdx ?? 0,
                      );
                      (picker as HTMLElement).dataset.suppliesTargetSoldierId =
                        "";
                    }
                    requestAnimationFrame(() => {
                      const newSlot = picker.querySelector(
                        slotSelector,
                      ) as HTMLElement | null;
                      if (newSlot) {
                        newSlot.classList.add("equip-slot-plop");
                        setTimeout(
                          () => newSlot.classList.remove("equip-slot-plop"),
                          450,
                        );
                      }
                    });
                  }
                };

                if (suppliesItem) {
                  const img = suppliesItem.querySelector("img");
                  const clone = document.createElement("div");
                  clone.className = "equip-fly-clone";
                  if (img) {
                    const cloneImg = img.cloneNode(true) as HTMLImageElement;
                    cloneImg.style.width = "40px";
                    cloneImg.style.height = "40px";
                    clone.appendChild(cloneImg);
                  }
                  document.body.appendChild(clone);
                  const startRect = suppliesItem.getBoundingClientRect();
                  const endRect = slotEl.getBoundingClientRect();
                  const startX = startRect.left + (startRect.width - 44) / 2;
                  const startY = startRect.top + (startRect.height - 44) / 2;
                  const endX = endRect.left + (endRect.width - 44) / 2;
                  const endY = endRect.top + (endRect.height - 44) / 2;
                  clone.style.left = `${startX}px`;
                  clone.style.top = `${startY}px`;
                  const dx = endX - startX;
                  const dy = endY - startY;
                  clone
                    .animate(
                      [
                        { transform: "translate(0, 0) scale(1)" },
                        {
                          transform: `translate(${dx}px, ${dy}px) scale(1.15)`,
                        },
                      ],
                      {
                        duration: 280,
                        easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                      },
                    )
                    .finished.then(() => {
                      clone.remove();
                      runEquipAndRefresh();
                    });
                } else {
                  runEquipAndRefresh();
                }
                return;
              }
            }
            /* When preselected item doesn't fit this slot, fall through to open armory so user can pick another */
          }

          /* Click any slot (empty or filled): select, highlight if filled, and open armory popup */
          const slotTooltip = document.getElementById("equip-slot-tooltip");
          if (slotTooltip) {
            slotTooltip.hidden = true;
            slotTooltip.classList.remove("equip-slot-tooltip-visible");
          }
          document
            .querySelectorAll(".equip-slot")
            .forEach((el) =>
              el.classList.remove(
                "equip-slot-selected",
                "equip-slot-highlight",
              ),
            );
          picker
            .querySelectorAll(".equip-slot-unequip-wrap")
            .forEach((el) => el.remove());
          slotEl.classList.add("equip-slot-selected");
          if (slotItemJson) {
            const slotItem = JSON.parse(slotItemJson.replace(/&quot;/g, '"'));
            soldiers.forEach((s) => {
              document
                .querySelectorAll(`.equip-slot[data-soldier-id="${s.id}"]`)
                .forEach((destSlot) => {
                  const destType = (destSlot as HTMLElement).dataset
                    .slotType as "weapon" | "armor" | "equipment";
                  if (destSlot === slotEl) return;
                  let canMove = false;
                  if (destType === "weapon" && isWeaponItem(slotItem)) {
                    canMove = isStrictWeaponSwapAllowed(
                      soldierId,
                      slotItem,
                      destSlot as HTMLElement,
                    );
                  } else if (destType === "armor" && slotItem.type === "armor")
                    canMove = true;
                  else if (
                    destType === "equipment" &&
                    itemFitsSlot(slotItem, "equipment")
                  )
                    canMove = true;
                  if (canMove)
                    (destSlot as HTMLElement).classList.add(
                      "equip-slot-highlight",
                    );
                });
            });
            /* Show tooltip on click: append to body (no clipping), position above slot, left-aligned with icon */
            let tooltip =
              picker.querySelector("#equip-slot-tooltip") ??
              document.querySelector("body > [id='equip-slot-tooltip']");
            if (tooltip && tooltip.parentElement === document.body) {
              /* Tooltip already in body (re-opening): remove any *other* tooltips in body (orphans from a different screen) */
              document
                .querySelectorAll("body > [id='equip-slot-tooltip']")
                .forEach((el) => {
                  if (el !== tooltip) el.remove();
                });
            } else if (picker.querySelector("#equip-slot-tooltip")) {
              /* Tooltip in picker: remove orphans from body so we don't have duplicates */
              document
                .querySelectorAll("body > [id='equip-slot-tooltip']")
                .forEach((el) => el.remove());
              tooltip = picker.querySelector("#equip-slot-tooltip");
            }
            const tooltipContent =
              tooltip?.querySelector("#equip-slot-tooltip-content") ??
              document.getElementById("equip-slot-tooltip-content");
            if (tooltip && tooltipContent) {
              const eqIdx = slotType === "equipment" ? eqIndex : 0;
              const unequipHtml = `<div class="item-popup-unequip-wrap"><button type="button" class="item-stats-popup-unequip-btn" data-unequip-soldier-id="${soldierId}" data-unequip-slot-type="${slotType}" data-unequip-eq-index="${eqIdx}"><span class="item-stats-popup-unequip-label">Unequip</span> <span aria-hidden="true">⏏</span></button></div>`;
              tooltipContent.innerHTML =
                getItemPopupBodyHtmlCompact(slotItem) + unequipHtml;
              (tooltip as HTMLElement).dataset.rarity =
                (slotItem.rarity as string) ?? "common";
              document.body.appendChild(tooltip as HTMLElement);
              const popupWidth = 240;
              const gameRect = document
                .querySelector("#game")
                ?.getBoundingClientRect();
              const top = gameRect ? gameRect.top + 10 : 10;
              const rightOffset = gameRect
                ? window.innerWidth - gameRect.right + 10
                : 10;
              (tooltip as HTMLElement).style.cssText =
                `position:fixed;top:${top}px;right:${rightOffset}px;left:auto;width:${popupWidth}px;z-index:2500;`;
              tooltip.classList.add("equip-slot-tooltip-visible");
              (tooltip as HTMLElement).hidden = false;
            }
          }
          openAvailableSuppliesPopup(
            picker as HTMLElement,
            soldierId,
            slotType,
            eqIndex,
          );
        }
      },
    },
    {
      /* Click on tooltip (not unequip btn) – dismiss tooltip */
      selector: "#equip-slot-tooltip",
      eventType: "click",
      callback: (e: Event) => {
        if ((e.target as HTMLElement).closest(".item-stats-popup-unequip-btn"))
          return;
        hideEquipSlotTooltipAndDeselectSlots();
      },
    },
    {
      /* Fallback: click outside picker – hide tooltip and deselect (roster/inventory background) */
      selector: "body",
      eventType: "click",
      callback: (e: Event) => {
        const target = e.target as HTMLElement;
        const picker = document.getElementById("equip-picker-popup");
        if (!picker || picker.hasAttribute("hidden")) return;
        if (target.closest("#equip-picker-popup")) return;
        hideEquipSlotTooltipAndDeselectSlots();
      },
    },
  ];

  const rosterScreenEventConfig: HandlerInitConfig[] = [
    {
      selector: "#roster-empty-recruit-btn",
      eventType: "click",
      callback: () => {
        UiManager.renderMarketTroopsScreen();
      },
    },
    {
      selector: ".roster-traits-chip",
      eventType: "click",
      callback: (e: Event) => {
        const btn = e.currentTarget as HTMLButtonElement | null;
        const popup = document.getElementById("roster-traits-popup");
        if (!btn || !popup) return;

        const rawName = btn.dataset.soldierName ?? "Soldier";
        const soldierId = btn.dataset.soldierId ?? "";
        const soldier = usePlayerCompanyStore
          .getState()
          .company?.soldiers?.find((s) => s.id === soldierId);
        const titleEl = document.getElementById("roster-traits-popup-title");
        const listEl = document.getElementById("roster-traits-popup-list");
        if (!titleEl || !listEl) return;

        titleEl.textContent = `${rawName} Traits`;
        if (!soldier) {
          listEl.innerHTML = `<li class="roster-traits-popup-empty">No traits recorded yet.</li>`;
        } else {
          const entries = buildSoldierTraitEntries(soldier);
          listEl.innerHTML = entries
            .map((entry, idx) => {
              const statBadges = traitStatBadgesHtml(
                entry.stats,
                entry.grenadeHitBonusPct ?? 0,
              );
              return `<li class="roster-traits-popup-item${entry.primary ? " roster-traits-popup-primary" : ""}">
                <div class="roster-trait-item-head">
                  <span class="roster-trait-item-title">${esc(entry.title)}</span>
                  <span class="roster-trait-item-type">${esc(entry.type)}</span>
                </div>
                ${statBadges ? `<div class="roster-trait-item-badges">${statBadges}</div>` : ""}
                <div class="roster-trait-item-desc">${esc(entry.desc)}</div>
              </li>${idx < entries.length - 1 ? '<li class="roster-traits-popup-sep" aria-hidden="true"></li>' : ""}`;
            })
            .join("");
        }
        popup.removeAttribute("hidden");
      },
    },
    {
      selector: "#roster-traits-popup-close",
      eventType: "click",
      callback: () => {
        const popup = document.getElementById("roster-traits-popup");
        if (popup) popup.setAttribute("hidden", "");
      },
    },
    {
      selector: "#roster-traits-popup",
      eventType: "click",
      callback: (e: Event) => {
        if (e.target !== e.currentTarget) return;
        const popup = e.currentTarget as HTMLElement;
        popup.setAttribute("hidden", "");
      },
    },
    {
      selector: "#roster-rest-btn",
      eventType: "click",
      callback: () => {
        const popup = document.getElementById("roster-rest-popup");
        if (!popup) return;
        const feedback = popup.querySelector(
          "#rest-popup-feedback",
        ) as HTMLElement | null;
        const progressWrap = popup.querySelector(
          "#rest-popup-progress-wrap",
        ) as HTMLElement | null;
        const progressFill = popup.querySelector(
          "#rest-popup-progress-fill",
        ) as HTMLElement | null;
        popup.removeAttribute("hidden");
        popup.classList.remove("rest-popup-running");
        popup.setAttribute("aria-busy", "false");
        popup
          .querySelectorAll(".rest-soldier-pill.selected")
          .forEach((el) => el.classList.remove("selected"));
        popup
          .querySelectorAll(".rest-soldier-pill.rest-soldier-resting")
          .forEach((el) => el.classList.remove("rest-soldier-resting"));
        if (feedback) feedback.textContent = "";
        if (progressWrap) progressWrap.hidden = true;
        if (progressFill) {
          progressFill.style.transition = "none";
          progressFill.style.width = "0%";
        }
        const themeEl = popup.querySelector("#rest-popup-theme") as HTMLElement | null;
        if (themeEl) {
          const picked = REST_THEME_LINES[Math.floor(Math.random() * REST_THEME_LINES.length)];
          themeEl.textContent = picked;
        }
        popup
          .querySelectorAll(".rest-filter-chip")
          .forEach((chip) =>
            chip.classList.toggle(
              "is-active",
              (chip as HTMLElement).dataset.restFilter === "all",
            ),
          );
        applyRestFilter(popup, "all");
        updateRestPopupSummary(popup);
      },
    },
    {
      selector: "#roster-rest-popup .rest-filter-chip",
      eventType: "click",
      callback: (e: Event) => {
        const chip = e.currentTarget as HTMLElement | null;
        const popup = document.getElementById("roster-rest-popup");
        if (!chip || !popup || popup.classList.contains("rest-popup-running"))
          return;
        const filter = chip.dataset.restFilter ?? "all";
        popup
          .querySelectorAll(".rest-filter-chip")
          .forEach((el) => el.classList.toggle("is-active", el === chip));
        applyRestFilter(popup, filter);
        updateRestPopupSummary(popup);
      },
    },
    {
      selector: "#rest-popup-close",
      eventType: "click",
      callback: () => {
        const popup = document.getElementById("roster-rest-popup");
        if (!popup || popup.classList.contains("rest-popup-running")) return;
        UiManager.renderRosterScreen();
      },
    },
    {
      selector: "#roster-rest-popup",
      eventType: "click",
      callback: (e: Event) => {
        const popup = e.currentTarget as HTMLElement;
        if (!popup || popup.classList.contains("rest-popup-running")) return;
        if (e.target === popup) UiManager.renderRosterScreen();
      },
    },
    {
      selector: "#roster-rest-popup .rest-soldier-pill",
      eventType: "click",
      callback: (e: Event) => {
        const card = e.currentTarget as HTMLButtonElement;
        const popup = document.getElementById("roster-rest-popup");
        if (!popup || popup.classList.contains("rest-popup-running")) return;
        if (card.disabled || card.classList.contains("disabled")) return;
        card.classList.toggle("selected");
        card.classList.remove("rest-soldier-select-pop");
        void card.offsetWidth;
        card.classList.add("rest-soldier-select-pop");
        window.setTimeout(
          () => card.classList.remove("rest-soldier-select-pop"),
          260,
        );
        updateRestPopupSummary(popup);
      },
    },
    {
      selector: "#rest-popup-send-btn",
      eventType: "click",
      callback: () => {
        const popup = document.getElementById("roster-rest-popup");
        if (!popup || popup.classList.contains("rest-popup-running")) return;

        const selectedCards = Array.from(
          popup.querySelectorAll(".rest-soldier-pill.selected"),
        ) as HTMLButtonElement[];
        if (selectedCards.length === 0) return;

        const selectedIds = selectedCards
          .map((card) => card.dataset.restSoldierId ?? "")
          .filter((id) => id.length > 0);
        if (selectedIds.length === 0) return;

        const sendBtn = popup.querySelector(
          "#rest-popup-send-btn",
        ) as HTMLButtonElement | null;
        const closeBtn = popup.querySelector(
          "#rest-popup-close",
        ) as HTMLButtonElement | null;
        const progressWrap = popup.querySelector(
          "#rest-popup-progress-wrap",
        ) as HTMLElement | null;
        const progressFill = popup.querySelector(
          "#rest-popup-progress-fill",
        ) as HTMLElement | null;
        const feedback = popup.querySelector(
          "#rest-popup-feedback",
        ) as HTMLElement | null;

        popup.classList.add("rest-popup-running");
        popup.setAttribute("aria-busy", "true");
        if (sendBtn) sendBtn.disabled = true;
        if (closeBtn) closeBtn.disabled = true;
        if (feedback) feedback.textContent = "Transporting troops...";
        selectedCards.forEach((card) => card.classList.add("rest-soldier-resting"));
        if (progressWrap) progressWrap.hidden = false;
        if (progressFill) {
          progressFill.style.transition = "none";
          progressFill.style.width = "0%";
          requestAnimationFrame(() => {
            if (!progressFill) return;
            progressFill.style.transition = "width 2000ms linear";
            progressFill.style.width = "100%";
          });
        }
        window.setTimeout(() => {
          if (
            feedback &&
            popup.classList.contains("rest-popup-running")
          )
            feedback.textContent = "Recovering morale and stamina...";
        }, 650);
        window.setTimeout(() => {
          if (
            feedback &&
            popup.classList.contains("rest-popup-running")
          )
            feedback.textContent = "Returning to duty...";
        }, 1350);

        window.setTimeout(() => {
          const result = usePlayerCompanyStore
            .getState()
            .runRestRound(selectedIds);
          if (!result.success) {
            if (feedback) {
              if (result.reason === "credits")
                feedback.textContent = "Not enough credits.";
              else if (result.reason === "no_recovery")
                feedback.textContent =
                  "Selected troops are already fully rested.";
              else feedback.textContent = "No troops selected.";
            }
          } else {
            let hitMaxCount = 0;
            selectedCards.forEach((card) => {
              const id = card.dataset.restSoldierId ?? "";
              const gained = result.recoveredById[id] ?? 0;
              const oldEnergy = Number(card.dataset.restEnergy ?? 100);
              const nextEnergy = Math.max(0, Math.min(100, oldEnergy + gained));
              card.dataset.restEnergy = String(nextEnergy);
              const recover = Math.max(0, Math.min(30, 100 - nextEnergy));
              const cost =
                recover <= 0 ? 0 : Math.max(1, Math.round((recover / 30) * 50));
              card.dataset.restRecover = String(recover);
              card.dataset.restCost = String(cost);

              const energyText = card.querySelector(
                ".rest-soldier-energy",
              ) as HTMLElement | null;
              const energyFill = card.querySelector(
                ".rest-soldier-energyfill",
              ) as HTMLElement | null;
              if (energyText) energyText.textContent = `EN ${nextEnergy}`;
              if (energyFill) energyFill.style.width = `${nextEnergy}%`;

              if (gained > 0) {
                const gain = document.createElement("span");
                gain.className = "rest-soldier-gain";
                gain.textContent = `+${gained}`;
                card.appendChild(gain);
                window.setTimeout(() => gain.remove(), 1000);
              }

              if (nextEnergy >= 100) {
                hitMaxCount += 1;
                card.classList.add("disabled", "rest-soldier-maxed");
                card.classList.remove("selected");
                card.disabled = true;
                window.setTimeout(
                  () => card.classList.remove("rest-soldier-maxed"),
                  900,
                );
              }
            });

            updateRestPopupSummary(popup);

            if (feedback) {
              const creditLeft =
                usePlayerCompanyStore.getState().creditBalance ?? 0;
              const maxMsg = hitMaxCount > 0 ? ` ${hitMaxCount} maxed.` : "";
              feedback.textContent = `Recovered +${result.totalRecovered} energy for ${CREDIT_SYMBOL}${result.totalCost}.${maxMsg} Credits: ${CREDIT_SYMBOL}${creditLeft}`;
            }
          }

          selectedCards.forEach((card) =>
            card.classList.remove("rest-soldier-resting"),
          );
          popup.classList.remove("rest-popup-running");
          popup.setAttribute("aria-busy", "false");
          if (closeBtn) closeBtn.disabled = false;
          if (progressFill) {
            progressFill.style.transition = "none";
            progressFill.style.width = "0%";
          }
          if (progressWrap) progressWrap.hidden = true;
        }, 2000);
      },
    },
    {
      selector: "#roster-formation-btn",
      eventType: "click",
      callback: () => {
        UiManager.renderFormationScreen();
      },
    },
    {
      selector: DOM.roster.releaseBtn,
      eventType: "click",
      callback: (e: Event) => {
        const btn = e.currentTarget as HTMLButtonElement;
        const soldierId = btn.dataset.soldierId;
        if (!soldierId) return;
        const store = usePlayerCompanyStore.getState();
        const moved = store.emptySoldierToCompanyInventory(soldierId);
        if (!moved.success) store.releaseSoldier(soldierId);
        UiManager.renderRosterScreen();
      },
    },
    {
      selector: DOM.roster.inventoryBtn,
      eventType: "click",
      callback: (e: Event) => {
        const btn = e.currentTarget as HTMLButtonElement;
        const soldierId = btn.dataset.soldierId;
        if (!soldierId) return;
        const picker = document.getElementById("equip-picker-popup");
        if (!picker) return;
        const tt = document.getElementById("equip-slot-tooltip");
        if (tt) {
          tt.hidden = true;
          tt.classList.remove("equip-slot-tooltip-visible");
        }
        (picker as HTMLElement).dataset.focusSoldierId = soldierId;
        (picker as HTMLElement).dataset.openedFrom = "roster";
        (
          document.getElementById("equip-picker-title") as HTMLElement
        ).textContent = "Inventory";
        picker.removeAttribute("hidden");
        UiManager.refreshEquipPickerContent?.();
        const soldierEl = picker.querySelector(
          `.equip-picker-soldier[data-soldier-id="${soldierId}"]`,
        );
        if (soldierEl)
          soldierEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      },
    },
  ];

  const inventoryScreenEventConfig: HandlerInitConfig[] = [
    {
      selector: "#claim-holding-inventory-btn",
      eventType: "pointerdown",
      callback: () => {
        usePlayerCompanyStore.getState().claimHoldingInventory();
        UiManager.renderInventoryScreen();
      },
    },
    {
      selector: "#equip-troops-btn",
      eventType: "click",
      callback: () => {
        const picker = document.getElementById("equip-picker-popup");
        if (!picker) return;
        const tt = document.getElementById("equip-slot-tooltip");
        if (tt) {
          tt.hidden = true;
          tt.classList.remove("equip-slot-tooltip-visible");
        }
        (picker as HTMLElement).dataset.openedFrom = "inventory";
        picker.dataset.preselectedItem = "";
        picker.dataset.preselectedArmoryIndex = "";
        (
          document.getElementById("equip-picker-title") as HTMLElement
        ).textContent = "Equip Troops";
        picker.removeAttribute("hidden");
        UiManager.refreshEquipPickerContent?.();
      },
    },
    {
      selector: DOM.inventory.destroyBtn,
      eventType: "click",
      callback: (e: Event) => {
        e.stopPropagation();
        const btn = e.currentTarget as HTMLButtonElement;
        const indexStr = btn.dataset.itemIndex;
        if (indexStr == null) return;
        const index = parseInt(indexStr, 10);
        usePlayerCompanyStore.getState().destroyCompanyItem(index);
        UiManager.renderInventoryScreen();
      },
    },
    {
      selector: DOM.inventory.itemCard,
      eventType: "click",
      callback: (e: Event) => {
        const card = (e.target as HTMLElement).closest(".inventory-item-card");
        if (
          !card ||
          (e.target as HTMLElement).closest(".inventory-destroy-btn")
        )
          return;
        const json = (card as HTMLElement).getAttribute("data-item-json");
        const indexStr = (card as HTMLElement).dataset.itemIndex;
        if (!json) return;
        const item = JSON.parse(json.replace(/&quot;/g, '"'));
        const popup = document.getElementById("item-stats-popup");
        const titleEl = document.getElementById("item-stats-popup-title");
        const bodyEl = document.getElementById("item-stats-popup-body");
        const equipBtn = document.getElementById("item-stats-popup-equip");
        const sellBtn = document.getElementById("item-stats-popup-sell");
        if (popup && titleEl && bodyEl) {
          (popup as HTMLElement).classList.remove("item-stats-popup-popover");
          (popup as HTMLElement).style.cssText = "";
          (popup as HTMLElement).dataset.itemJson = json;
          (popup as HTMLElement).dataset.itemIndex = indexStr ?? "";
          (popup as HTMLElement).dataset.itemSource = "inventory";
          (popup as HTMLElement).dataset.rarity =
            (item.rarity as string) ?? "common";
          delete (popup as HTMLElement).dataset.unequipSoldierId;
          delete (popup as HTMLElement).dataset.unequipSlotType;
          delete (popup as HTMLElement).dataset.unequipEqIndex;
          titleEl.textContent = "";
          bodyEl.innerHTML = getItemPopupBodyHtml(item);
          const isEquippable =
            (item.type as string) === "ballistic_weapon" ||
            (item.type as string) === "armor" ||
            (item.type as string) === "throwable" ||
            (item.type as string) === "medical" ||
            (item.type as string) === "gear";
          if (equipBtn) {
            (equipBtn as HTMLElement).style.display = isEquippable
              ? ""
              : "none";
          }
          if (sellBtn) {
            const inArmory = indexStr != null && indexStr !== "";
            if (inArmory) {
              const companyLevel =
                usePlayerCompanyStore.getState().company?.level ??
                usePlayerCompanyStore.getState().companyLevel ??
                1;
              const sellValue = getItemSellPrice(item, companyLevel);
              sellBtn.innerHTML = `<span class="sell-btn-coin">${CREDIT_SYMBOL}</span><span class="sell-btn-text">Sell</span><span class="sell-btn-amount">${sellValue.toLocaleString()}</span>`;
              (sellBtn as HTMLElement).style.display = "";
            } else {
              (sellBtn as HTMLElement).style.display = "none";
            }
          }
          const actionsWrap = popup.querySelector(".item-popup-actions");
          if (actionsWrap) (actionsWrap as HTMLElement).style.display = "";
          const gameEl = document.querySelector(DOM.game) as HTMLElement;
          if (gameEl) {
            gameEl.querySelectorAll("[id=item-stats-popup]").forEach((el) => {
              if (el !== popup) el.remove();
            });
            gameEl.appendChild(popup as HTMLElement);
          }
          popup.hidden = false;
        }
      },
    },
    {
      selector: "#item-stats-popup-equip",
      eventType: "click",
      callback: () => {
        const popup = document.getElementById("item-stats-popup");
        const picker = document.getElementById("equip-picker-popup");
        if (!popup || !picker) return;
        const tt = document.getElementById("equip-slot-tooltip");
        if (tt) {
          tt.hidden = true;
          tt.classList.remove("equip-slot-tooltip-visible");
        }
        const json = (popup as HTMLElement).dataset.itemJson;
        const idxStr = (popup as HTMLElement).dataset.itemIndex;
        if (!json) return;
        const item = JSON.parse(json.replace(/&quot;/g, '"'));
        (picker as HTMLElement).dataset.openedFrom = "inventory";
        (picker as HTMLElement).dataset.preselectedItem = json;
        (picker as HTMLElement).dataset.preselectedArmoryIndex = idxStr ?? "";
        (
          document.getElementById("equip-picker-title") as HTMLElement
        ).textContent = `Equip: ${item.name}`;
        picker.removeAttribute("hidden");
        popup.hidden = true;
        UiManager.refreshEquipPickerContent?.();
        /* Highlight slots that can receive this item (same as item-first armory click) */
        document
          .querySelectorAll(".equip-slot")
          .forEach((el) =>
            el.classList.remove("equip-slot-selected", "equip-slot-highlight"),
          );
        picker
          .querySelectorAll(".equip-slot-unequip-wrap")
          .forEach((el) => el.remove());
        const soldiers =
          usePlayerCompanyStore.getState().company?.soldiers ?? [];
        soldiers.forEach((s) => {
          const slotsToCheck: {
            type: "weapon" | "armor" | "equipment";
            eqIndex: number;
          }[] = itemFitsSlot(item, "weapon")
            ? [{ type: "weapon", eqIndex: 0 }]
            : itemFitsSlot(item, "armor")
              ? [{ type: "armor", eqIndex: 0 }]
              : itemFitsSlot(item, "equipment")
                ? [
                    {
                      type: "equipment",
                      eqIndex: 0,
                    },
                    { type: "equipment", eqIndex: 1 },
                  ]
                : [];
          for (const { type, eqIndex } of slotsToCheck) {
            const canReceive =
              canEquipItemLevel(item, s) &&
              (type !== "weapon" || weaponWieldOk(item, s));
            if (canReceive) {
              const sel = `.equip-slot[data-soldier-id="${s.id}"][data-slot-type="${type}"]${type === "equipment" ? `[data-eq-index="${eqIndex}"]` : ""}`;
              picker
                .querySelectorAll(sel)
                .forEach((destSlot) =>
                  (destSlot as HTMLElement).classList.add(
                    "equip-slot-highlight",
                  ),
                );
            }
          }
        });
        /* Open armory popup so user sees items and can tap highlighted slots or pick different item */
        const slotType = itemFitsSlot(item, "weapon")
          ? "weapon"
          : itemFitsSlot(item, "armor")
            ? "armor"
            : "equipment";
        const firstRecipient = soldiers.find((s) => {
          if (slotType === "weapon")
            return weaponWieldOk(item, s) && canEquipItemLevel(item, s);
          if (slotType === "armor")
            return item.type === "armor" && canEquipItemLevel(item, s);
          return itemFitsSlot(item, "equipment") && canEquipItemLevel(item, s);
        });
        if (firstRecipient) {
          openAvailableSuppliesPopup(
            picker as HTMLElement,
            firstRecipient.id,
            slotType,
            0,
          );
          (picker as HTMLElement).dataset.suppliesTargetSoldierId = "";
        }
      },
    },
    {
      selector: "#item-stats-popup-sell",
      eventType: "click",
      callback: () => {
        const popup = document.getElementById("item-stats-popup");
        if (!popup) return;
        const itemSource = (popup as HTMLElement).dataset.itemSource;
        if (itemSource !== "inventory") return;
        const idxStr = (popup as HTMLElement).dataset.itemIndex;
        const json = (popup as HTMLElement).dataset.itemJson;
        if (idxStr == null || !json) return;
        const index = parseInt(idxStr, 10);
        if (!Number.isFinite(index) || index < 0) return;
        let item: Item | null = null;
        try {
          item = JSON.parse(json.replace(/&quot;/g, '"')) as Item;
        } catch {
          item = null;
        }
        if (!item) return;
        const companyLevel =
          usePlayerCompanyStore.getState().company?.level ??
          usePlayerCompanyStore.getState().companyLevel ??
          1;
        const marketPrice = getItemMarketBuyPrice(item, companyLevel);
        const sellValue = getItemSellPrice(item, companyLevel);
        const rarity = (item.rarity ?? "common").toLowerCase();
        if (rarity === "rare" || rarity === "epic") {
          const ok = window.confirm(
            `Sell ${item.name} for ${CREDIT_SYMBOL}${sellValue}?\n(Market ${CREDIT_SYMBOL}${marketPrice} -> 50% sell value${item.uses != null ? ", prorated by uses" : ""})`,
          );
          if (!ok) return;
        }
        const result = usePlayerCompanyStore.getState().sellCompanyItem(index);
        if (!result.success) return;
        popup.setAttribute("hidden", "");
        UiManager.renderInventoryScreen();
      },
    },
    {
      selector: DOM.inventory.itemStatsPopupClose,
      eventType: "click",
      callback: () => {
        const popup = document.getElementById("item-stats-popup");
        if (popup) popup.hidden = true;
      },
    },
    {
      selector: "#item-stats-popup",
      eventType: "click",
      callback: (e: Event) => {
        if (e.target === e.currentTarget) {
          (e.currentTarget as HTMLElement).setAttribute("hidden", "");
        }
      },
    },
  ];

  const REST_THEME_LINES = [
    "Mess Hall rotation scheduled.",
    "Field maintenance break underway.",
    "Barracks quiet hours approved.",
    "Shore leave shuttle standing by.",
  ];

  function computeRestSelectionTotals(popup: HTMLElement): {
    selectedCount: number;
    totalRecover: number;
    totalCost: number;
  } {
    const selected = Array.from(
      popup.querySelectorAll(".rest-soldier-pill.selected"),
    ) as HTMLElement[];
    let totalRecover = 0;
    let totalCost = 0;
    selected.forEach((card) => {
      totalRecover += Number(card.dataset.restRecover ?? 0);
      totalCost += Number(card.dataset.restCost ?? 0);
    });
    return { selectedCount: selected.length, totalRecover, totalCost };
  }

  function applyRestFilter(popup: HTMLElement, filter: string): void {
    const cards = Array.from(
      popup.querySelectorAll(".rest-soldier-pill"),
    ) as HTMLElement[];
    cards.forEach((card) => {
      const status = card.dataset.restStatus ?? "reserve";
      const energy = Number(card.dataset.restEnergy ?? 100);
      const matches =
        filter === "all" ||
        (filter === "active" && status === "active") ||
        (filter === "reserve" && status === "reserve") ||
        (filter === "needs_rest" && energy < 70);
      card.hidden = !matches;
    });
  }

  function updateRestPopupSummary(popup: HTMLElement): void {
    const { selectedCount, totalRecover, totalCost } =
      computeRestSelectionTotals(popup);
    const selectedEl = popup.querySelector(
      "#rest-popup-selected-count",
    ) as HTMLElement | null;
    const previewEl = popup.querySelector(
      "#rest-popup-preview",
    ) as HTMLElement | null;
    const manifestCountEl = popup.querySelector(
      "#rest-popup-manifest-count",
    ) as HTMLElement | null;
    const manifestRecoveryEl = popup.querySelector(
      "#rest-popup-manifest-recovery",
    ) as HTMLElement | null;
    const manifestCostEl = popup.querySelector(
      "#rest-popup-manifest-cost",
    ) as HTMLElement | null;
    const sendBtn = popup.querySelector(
      "#rest-popup-send-btn",
    ) as HTMLButtonElement | null;

    if (selectedEl) selectedEl.textContent = `${selectedCount} selected`;
    if (previewEl)
      previewEl.textContent = `Recovery +${totalRecover} | Cost ${CREDIT_SYMBOL}${totalCost}`;
    if (manifestCountEl)
      manifestCountEl.textContent = `${selectedCount} ${selectedCount === 1 ? "troop" : "troops"}`;
    if (manifestRecoveryEl)
      manifestRecoveryEl.textContent = `+${totalRecover} EN`;
    if (manifestCostEl)
      manifestCostEl.textContent = `${CREDIT_SYMBOL}${totalCost}`;
    if (sendBtn) {
      sendBtn.disabled = selectedCount === 0 || totalRecover <= 0;
      sendBtn.textContent =
        selectedCount > 0
          ? `Send on Leave (${selectedCount})`
          : "Send on Leave";
    }
  }

  function clearFormationSelection() {
    const screen = document.getElementById("formation-screen");
    screen?.setAttribute("data-selected-index", "-1");
    screen
      ?.querySelectorAll(".formation-slot-selected")
      .forEach((el) => el.classList.remove("formation-slot-selected"));
    screen
      ?.querySelectorAll(".formation-drop-zone")
      .forEach((el) => el.classList.remove("formation-drop-zone"));
  }

  function clearFormationEquipSelection() {
    const screen = document.getElementById("formation-screen");
    screen
      ?.querySelectorAll(".formation-equip-slot-selected")
      .forEach((el) => el.classList.remove("formation-equip-slot-selected"));
    screen
      ?.querySelectorAll(".formation-equip-slot-highlight")
      .forEach((el) => el.classList.remove("formation-equip-slot-highlight"));
  }

  function applyFormationEquipDropZones(selectedSlot: HTMLElement) {
    const slotType = selectedSlot.dataset.slotType as
      | "weapon"
      | "armor"
      | "equipment";
    const screen = document.getElementById("formation-screen");
    if (!screen || !slotType) return;
    if (slotType !== "weapon") {
      screen
        .querySelectorAll(`.formation-equip-slot[data-slot-type="${slotType}"]`)
        .forEach((el) => {
          if (el !== selectedSlot)
            (el as HTMLElement).classList.add("formation-equip-slot-highlight");
        });
      return;
    }
    const sourceSoldierId = selectedSlot.dataset.soldierId;
    const sourceWeapon = parseSlotItemFromData(selectedSlot);
    if (!sourceSoldierId || !isWeaponItem(sourceWeapon)) return;
    screen
      .querySelectorAll(`.formation-equip-slot[data-slot-type="${slotType}"]`)
      .forEach((el) => {
        if (el === selectedSlot) return;
        if (
          isStrictWeaponSwapAllowed(
            sourceSoldierId,
            sourceWeapon,
            el as HTMLElement,
          )
        ) {
          (el as HTMLElement).classList.add("formation-equip-slot-highlight");
        }
      });
  }

  function applyFormationDropZones(selectedIndex: number) {
    const screen = document.getElementById("formation-screen");
    if (!screen) return;
    const store = usePlayerCompanyStore.getState();
    screen.querySelectorAll(".formation-soldier-card").forEach((el) => {
      const card = el as HTMLElement;
      const idxStr = card.dataset.slotIndex;
      if (idxStr == null) return;
      const idx = parseInt(idxStr, 10);
      if (idx === selectedIndex) return;
      if (!isFormationReassignmentAllowed(store.company, selectedIndex, idx))
        return;
      card.classList.add("formation-drop-zone");
    });
  }

  const formationScreenEventConfig: HandlerInitConfig[] = [
    {
      selector: "#formation-back-btn",
      eventType: "click",
      callback: () => UiManager.renderRosterScreen(),
    },
    {
      selector: "#formation-screen",
      eventType: "click",
      callback: (e: Event) => {
        const equipSlot = (e.target as HTMLElement).closest(
          ".formation-equip-slot",
        ) as HTMLElement | null;
        if (equipSlot) {
          e.stopPropagation();
          clearFormationSelection();
          const screen = document.getElementById("formation-screen");
          const selectedSlot = screen?.querySelector(
            ".formation-equip-slot-selected",
          ) as HTMLElement | null;
          const soldierId = equipSlot.dataset.soldierId;
          const slotType = equipSlot.dataset.slotType as
            | "weapon"
            | "armor"
            | "equipment";
          const eqIndexStr = equipSlot.dataset.eqIndex;

          if (selectedSlot) {
            if (selectedSlot === equipSlot) {
              clearFormationEquipSelection();
              return;
            }
            const srcSoldierId = selectedSlot.dataset.soldierId!;
            const srcSlotType = selectedSlot.dataset.slotType as
              | "weapon"
              | "armor"
              | "equipment";
            const srcEqIdx =
              selectedSlot.dataset.eqIndex != null
                ? parseInt(selectedSlot.dataset.eqIndex, 10)
                : undefined;
            if (
              equipSlot.classList.contains("formation-equip-slot-highlight") &&
              soldierId &&
              slotType
            ) {
              const destEqIdx =
                slotType === "equipment"
                  ? eqIndexStr != null
                    ? parseInt(eqIndexStr, 10)
                    : undefined
                  : undefined;
              const result = usePlayerCompanyStore
                .getState()
                .moveItemBetweenSlots({
                  sourceSoldierId: srcSoldierId,
                  sourceSlotType: srcSlotType,
                  sourceEqIndex:
                    srcSlotType === "equipment" ? srcEqIdx : undefined,
                  destSoldierId: soldierId,
                  destSlotType: slotType,
                  destEqIndex: slotType === "equipment" ? destEqIdx : undefined,
                });
              if (result.success) {
                UiManager.renderFormationScreen();
              }
            }
            clearFormationEquipSelection();
            return;
          }

          if (equipSlot.dataset.slotItem) {
            clearFormationEquipSelection();
            equipSlot.classList.add("formation-equip-slot-selected");
            applyFormationEquipDropZones(equipSlot);
          }
          return;
        }

        const card = (e.target as HTMLElement).closest(
          ".formation-soldier-card",
        ) as HTMLElement | null;
        if (!card) {
          clearFormationEquipSelection();
          return;
        }
        clearFormationEquipSelection();
        const slotIndexStr = card.dataset.slotIndex;
        if (slotIndexStr == null) return;
        const slotIndex = parseInt(slotIndexStr, 10);
        const hasSoldier = card.dataset.hasSoldier === "true";
        const screen = document.getElementById("formation-screen");
        const selectedStr = screen?.getAttribute("data-selected-index");
        const selected = selectedStr != null ? parseInt(selectedStr, 10) : -1;

        // Clear previous swap highlight when user interacts again
        setFormationSwapIndices(null);

        const store = usePlayerCompanyStore.getState();
        const formationSlots = getFormationSlots(store.company);

        if (selected >= 0 && selected !== slotIndex) {
          if (selected < 0 || selected >= formationSlots.length) {
            clearFormationSelection();
            return;
          }
          const targetFilled = hasSoldier;
          const legalMove =
            card.classList.contains("formation-drop-zone") &&
            isFormationReassignmentAllowed(store.company, selected, slotIndex);
          if (targetFilled && legalMove) {
            setFormationSwapIndices([selected, slotIndex]);
            store.swapSoldierPositions(selected, slotIndex);
            UiManager.renderFormationScreen();
            setTimeout(() => setFormationSwapIndices(null), 450);
          } else if (!targetFilled && legalMove) {
            setFormationSwapIndices([selected, slotIndex]);
            store.moveSoldierToPosition(selected, slotIndex);
            UiManager.renderFormationScreen();
            setTimeout(() => setFormationSwapIndices(null), 450);
          }
          clearFormationSelection();
          return;
        }

        if (selected === slotIndex) {
          clearFormationSelection();
          return;
        }

        if (!hasSoldier) return;

        // Select this soldier and highlight drop zones
        clearFormationSelection();
        card.classList.add("formation-slot-selected");
        screen?.setAttribute("data-selected-index", String(slotIndex));
        applyFormationDropZones(slotIndex);
      },
    },
  ];

  function clearReadyRoomSelection() {
    const screen = document.getElementById("ready-room-screen");
    screen?.setAttribute("data-selected-index", "-1");
    screen
      ?.querySelectorAll(".ready-room-slot-selected")
      .forEach((el) => el.classList.remove("ready-room-slot-selected"));
    screen
      ?.querySelectorAll(".ready-room-drop-zone")
      .forEach((el) => el.classList.remove("ready-room-drop-zone"));
  }

  function clearReadyRoomEquipSelection() {
    const screen = document.getElementById("ready-room-screen");
    screen
      ?.querySelectorAll(".ready-room-equip-slot-selected")
      .forEach((el) => el.classList.remove("ready-room-equip-slot-selected"));
    screen
      ?.querySelectorAll(".ready-room-equip-slot-highlight")
      .forEach((el) => el.classList.remove("ready-room-equip-slot-highlight"));
  }

  function applyReadyRoomEquipDropZones(selectedSlot: HTMLElement) {
    const slotType = selectedSlot.dataset.slotType as
      | "weapon"
      | "armor"
      | "equipment";
    const screen = document.getElementById("ready-room-screen");
    if (!screen || !slotType) return;
    if (slotType !== "weapon") {
      screen
        .querySelectorAll(
          `.ready-room-equip-slot[data-slot-type="${slotType}"]`,
        )
        .forEach((el) => {
          if (el !== selectedSlot)
            (el as HTMLElement).classList.add(
              "ready-room-equip-slot-highlight",
            );
        });
      return;
    }
    const sourceSoldierId = selectedSlot.dataset.soldierId;
    const sourceWeapon = parseSlotItemFromData(selectedSlot);
    if (!sourceSoldierId || !isWeaponItem(sourceWeapon)) return;
    screen
      .querySelectorAll(`.ready-room-equip-slot[data-slot-type="${slotType}"]`)
      .forEach((el) => {
        if (el === selectedSlot) return;
        if (
          isStrictWeaponSwapAllowed(
            sourceSoldierId,
            sourceWeapon,
            el as HTMLElement,
          )
        ) {
          (el as HTMLElement).classList.add("ready-room-equip-slot-highlight");
        }
      });
  }

  function applyReadyRoomDropZones(selectedIndex: number) {
    const screen = document.getElementById("ready-room-screen");
    if (!screen) return;
    const store = usePlayerCompanyStore.getState();
    screen.querySelectorAll(".ready-room-soldier-card").forEach((el) => {
      const card = el as HTMLElement;
      const idxStr = card.dataset.slotIndex;
      if (idxStr == null) return;
      const idx = parseInt(idxStr, 10);
      if (idx === selectedIndex) return;
      if (!isFormationReassignmentAllowed(store.company, selectedIndex, idx))
        return;
      card.classList.add("ready-room-drop-zone");
    });
  }

  const readyRoomScreenEventConfig: HandlerInitConfig[] = [
    {
      selector: DOM.readyRoom.onboardingContinue,
      eventType: "click",
      callback: () => {
        usePlayerCompanyStore
          .getState()
          .setOnboardingReadyRoomIntroPending(false);
        const popup = s_(DOM.readyRoom.onboardingPopup) as HTMLElement | null;
        if (!popup) return;
        popup.classList.add("ready-room-onboarding-popup-hide");
        window.setTimeout(() => popup.remove(), 220);
      },
    },
    {
      selector: DOM.readyRoom.onboardingPopup,
      eventType: "click",
      callback: (e: Event) => {
        if ((e.target as HTMLElement).id !== "ready-room-onboarding-popup")
          return;
        usePlayerCompanyStore
          .getState()
          .setOnboardingReadyRoomIntroPending(false);
        const popup = e.currentTarget as HTMLElement;
        popup.classList.add("ready-room-onboarding-popup-hide");
        window.setTimeout(() => popup.remove(), 220);
      },
    },
    {
      selector: DOM.readyRoom.proceedBtn,
      eventType: "click",
      callback: () => {
        const screen = document.getElementById("ready-room-screen");
        const json = screen?.getAttribute("data-mission-json");
        const mission = json ? JSON.parse(json) : null;
        if (!mission) return;
        const btn = s_(DOM.readyRoom.proceedBtn);
        if (
          btn?.classList.contains("disabled") ||
          (btn as HTMLButtonElement | null)?.disabled
        )
          return;
        usePlayerCompanyStore.getState().setMissionsResumeState("none", null);
        if (!mission?.isDevTest) {
          const store = usePlayerCompanyStore.getState();
          const company = store.company;
          const activeCount = getActiveSlots(company);
          const formationSlots = getFormationSlots(company);
          const activeSoldiers = formationSlots
            .slice(0, activeCount)
            .map((id) => (id ? getSoldierById(company, id) : null))
            .filter((s): s is NonNullable<typeof s> => s != null);
          const minEnergy = 5;
          const lowEnergy = activeSoldiers.filter(
            (s) => (s.energy ?? 100) < minEnergy,
          );
          if (lowEnergy.length > 0) return;
          store.syncCombatHpToSoldiers(
            activeSoldiers.map((s) => ({
              id: s.id,
              hp: s.attributes?.hit_points ?? 0,
            })),
          );
        }
        console.log("Proceed to combat", mission);
        UiManager.renderCombatScreen(mission);
      },
    },
    {
      selector: DOM.readyRoom.missionsBtn,
      eventType: "click",
      callback: () => {
        const st = usePlayerCompanyStore.getState();
        st.setMissionsResumeState("none", null);
        UiManager.renderMissionsScreen("menu");
      },
    },
    {
      selector: DOM.readyRoom.restBtn,
      eventType: "click",
      callback: () => {
        UiManager.renderRosterScreen();
        window.setTimeout(() => {
          const btn = document.getElementById(
            "roster-rest-btn",
          ) as HTMLButtonElement | null;
          if (btn) btn.click();
        }, 0);
      },
    },
    {
      selector: "#ready-room-screen",
      eventType: "click",
      callback: (e: Event) => {
        const equipSlot = (e.target as HTMLElement).closest(
          ".ready-room-equip-slot",
        ) as HTMLElement | null;
        if (equipSlot) {
          e.stopPropagation();
          clearReadyRoomSelection();
          const screen = document.getElementById("ready-room-screen");
          const selectedSlot = screen?.querySelector(
            ".ready-room-equip-slot-selected",
          ) as HTMLElement | null;
          const soldierId = equipSlot.dataset.soldierId;
          const slotType = equipSlot.dataset.slotType as
            | "weapon"
            | "armor"
            | "equipment";
          const eqIndexStr = equipSlot.dataset.eqIndex;
          if (selectedSlot) {
            if (selectedSlot === equipSlot) {
              clearReadyRoomEquipSelection();
              return;
            }
            const srcSoldierId = selectedSlot.dataset.soldierId!;
            const srcSlotType = selectedSlot.dataset.slotType as
              | "weapon"
              | "armor"
              | "equipment";
            const srcEqIdx =
              selectedSlot.dataset.eqIndex != null
                ? parseInt(selectedSlot.dataset.eqIndex, 10)
                : undefined;
            if (
              equipSlot.classList.contains("ready-room-equip-slot-highlight") &&
              soldierId &&
              slotType
            ) {
              const destEqIdx =
                slotType === "equipment"
                  ? eqIndexStr != null
                    ? parseInt(eqIndexStr, 10)
                    : undefined
                  : undefined;
              const result = usePlayerCompanyStore
                .getState()
                .moveItemBetweenSlots({
                  sourceSoldierId: srcSoldierId,
                  sourceSlotType: srcSlotType,
                  sourceEqIndex:
                    srcSlotType === "equipment" ? srcEqIdx : undefined,
                  destSoldierId: soldierId,
                  destSlotType: slotType,
                  destEqIndex: slotType === "equipment" ? destEqIdx : undefined,
                });
              if (result.success) {
                setLastEquipMoveSoldierIds(
                  [srcSoldierId, soldierId].filter(
                    (v, i, a) => a.indexOf(v) === i,
                  ),
                );
                const json = screen?.getAttribute("data-mission-json");
                const mission = json && json !== "" ? JSON.parse(json) : null;
                UiManager.renderReadyRoomScreen(mission);
              }
            }
            clearReadyRoomEquipSelection();
            return;
          }

          if (equipSlot.dataset.slotItem) {
            clearReadyRoomEquipSelection();
            equipSlot.classList.add("ready-room-equip-slot-selected");
            applyReadyRoomEquipDropZones(equipSlot);
          }
          return;
        }

        const card = (e.target as HTMLElement).closest(
          ".ready-room-soldier-card",
        ) as HTMLElement | null;
        if (!card) {
          clearReadyRoomEquipSelection();
          return;
        }
        clearReadyRoomEquipSelection();
        const slotIndexStr = card.dataset.slotIndex;
        if (slotIndexStr == null) return;
        const slotIndex = parseInt(slotIndexStr, 10);
        const hasSoldier = card.dataset.hasSoldier === "true";
        const screen = document.getElementById("ready-room-screen");
        const selectedStr = screen?.getAttribute("data-selected-index");
        const selected = selectedStr != null ? parseInt(selectedStr, 10) : -1;

        const store = usePlayerCompanyStore.getState();
        const formationSlots = getFormationSlots(store.company);

        if (selected >= 0 && selected !== slotIndex) {
          if (selected < 0 || selected >= formationSlots.length) {
            clearReadyRoomSelection();
            return;
          }
          const json = screen?.getAttribute("data-mission-json");
          const mission = json && json !== "" ? JSON.parse(json) : null;
          const legalMove =
            card.classList.contains("ready-room-drop-zone") &&
            isFormationReassignmentAllowed(store.company, selected, slotIndex);
          if (hasSoldier && legalMove) {
            setLastReadyRoomMoveSlotIndices([selected, slotIndex]);
            store.swapSoldierPositions(selected, slotIndex);
            UiManager.renderReadyRoomScreen(mission);
            setTimeout(() => setLastReadyRoomMoveSlotIndices([]), 450);
          } else if (!hasSoldier && legalMove) {
            setLastReadyRoomMoveSlotIndices([selected, slotIndex]);
            store.moveSoldierToPosition(selected, slotIndex);
            UiManager.renderReadyRoomScreen(mission);
            setTimeout(() => setLastReadyRoomMoveSlotIndices([]), 450);
          }
          clearReadyRoomSelection();
          return;
        }

        if (selected === slotIndex) {
          clearReadyRoomSelection();
          return;
        }

        if (!hasSoldier) return;

        clearReadyRoomSelection();
        card.classList.add("ready-room-slot-selected");
        screen?.setAttribute("data-selected-index", String(slotIndex));
        applyReadyRoomDropZones(slotIndex);
      },
    },
  ];

  const troopsScreenEventConfig: HandlerInitConfig[] = [
    {
      selector: "#troops-market",
      eventType: "click",
      callback: (e: Event) => {
        const st = usePlayerCompanyStore.getState();
        const guided =
          st.onboardingRecruitStep === "troops_recruit" ||
          st.onboardingRecruitStep === "troops_confirm";
        const target = e.target as HTMLElement;
        const recruitBtn = target.closest(".recruit-soldier");
        if (recruitBtn) {
          const btn = recruitBtn as HTMLButtonElement;
          if (btn.getAttribute("aria-disabled") === "true") return;
          const trooperId = btn.dataset.trooperId;
          if (!trooperId) return;
          const soldier =
            st.marketAvailableTroops.find((s) => s.id === trooperId) ??
            (st.onboardingRecruitSoldier?.id === trooperId
              ? st.onboardingRecruitSoldier
              : null);
          if (!soldier) return;
          const result = st.tryAddToRecruitStaging(soldier);
          if (result.success) {
            if (st.onboardingRecruitStep === "troops_recruit")
              st.setOnboardingRecruitStep("troops_confirm");
            UiManager.renderMarketTroopsScreen();
          } else {
            UiManager.showTroopsRecruitError(result.reason ?? "capacity");
          }
          return;
        }
        const removeBtn = target.closest(".remove-from-staging");
        if (removeBtn) {
          const soldierId = (removeBtn as HTMLElement).dataset.soldierId;
          if (soldierId) {
            st.removeFromRecruitStaging(soldierId);
            if (st.onboardingRecruitStep === "troops_confirm")
              st.setOnboardingRecruitStep("troops_recruit");
            UiManager.renderMarketTroopsScreen();
          }
          return;
        }
        const confirmBtn = target.closest("#confirm-recruitment");
        if (confirmBtn && !(confirmBtn as HTMLButtonElement).disabled) {
          st.confirmRecruitment();
          if (guided) {
            st.setOnboardingRecruitStep("none");
            st.setOnboardingRecruitSoldier(null);
            UiManager.renderRosterScreen();
          } else {
            UiManager.renderMarketTroopsScreen();
          }
          return;
        }
        const rerollBtn = target.closest(".reroll-soldier");
        if (rerollBtn) {
          if (guided) return;
          const id = (rerollBtn as HTMLElement).dataset.trooperid;
          if (id) st.rerollSoldier(id);
        }
      },
    },
  ];

  function updateMarketCreditsDisplay() {
    const credits = usePlayerCompanyStore.getState().creditBalance ?? 0;
    document.querySelectorAll(".market-credits-value").forEach((el) => {
      (el as HTMLElement).textContent = credits.toLocaleString();
    });
  }

  function playMarketBuyToArmoryAnimation(popupBodyId: string, qty: number) {
    const body = document.getElementById(popupBodyId);
    const armoryBtn = document.getElementById("company-go-inventory");
    if (!body || !armoryBtn) return;
    const iconEl = body.querySelector(
      ".item-popup-icon",
    ) as HTMLImageElement | null;
    if (!iconEl) return;

    const startRect = iconEl.getBoundingClientRect();
    const endRect = armoryBtn.getBoundingClientRect();
    if (!startRect.width || !endRect.width) return;

    const clone = document.createElement("div");
    clone.className = "market-buy-fly-clone";
    const cloneImg = iconEl.cloneNode(true) as HTMLImageElement;
    clone.appendChild(cloneImg);
    if (qty > 1) {
      const qtyTag = document.createElement("span");
      qtyTag.className = "market-buy-fly-qty";
      qtyTag.textContent = `x${qty}`;
      clone.appendChild(qtyTag);
    }
    document.body.appendChild(clone);

    const startX = startRect.left + startRect.width / 2 - 22;
    const startY = startRect.top + startRect.height / 2 - 22;
    const endX = endRect.left + endRect.width / 2 - 22;
    const endY = endRect.top + endRect.height / 2 - 22;
    clone.style.left = `${startX}px`;
    clone.style.top = `${startY}px`;
    const dx = endX - startX;
    const dy = endY - startY;

    clone
      .animate(
        [
          { transform: "translate(0, 0) scale(1)", opacity: 1 },
          {
            transform: `translate(${dx * 0.5}px, ${dy * 0.45 - 28}px) scale(1.08)`,
            opacity: 1,
            offset: 0.58,
          },
          {
            transform: `translate(${dx}px, ${dy}px) scale(0.5)`,
            opacity: 0.12,
          },
        ],
        { duration: 420, easing: "cubic-bezier(0.22, 0.8, 0.25, 1)" },
      )
      .finished.finally(() => {
        clone.remove();
      });

    armoryBtn.classList.remove("market-armory-hit");
    void armoryBtn.offsetWidth;
    armoryBtn.classList.add("market-armory-hit");
    window.setTimeout(
      () => armoryBtn.classList.remove("market-armory-hit"),
      380,
    );
  }

  const suppliesScreenEventConfig: HandlerInitConfig[] = [
    ...marketLevelNavHandlers("supplies-market", () =>
      UiManager.renderSuppliesMarketScreen(),
    ),
    ...marketSellPopupHandlers(() => UiManager.renderSuppliesMarketScreen()),
    {
      selector: DOM.supplies.item,
      eventType: "click",
      callback: (e: Event) => {
        const el = (e.target as HTMLElement).closest(".supplies-market-item");
        if (!el) return;
        const idxStr = (el as HTMLElement).dataset.suppliesIndex;
        const priceStr = (el as HTMLElement).dataset.suppliesPrice;
        const itemJson = (el as HTMLElement).dataset.suppliesItem;
        if (idxStr == null || priceStr == null || !itemJson) return;
        let item: import("../../constants/items/types.ts").Item;
        try {
          item = JSON.parse(itemJson.replace(/&quot;/g, '"'));
        } catch {
          return;
        }
        const price = parseInt(priceStr, 10);
        const popup = document.getElementById("supplies-buy-popup");
        const titleEl = document.getElementById("supplies-buy-title");
        const bodyEl = document.getElementById("supplies-buy-body");
        const qtyInput = document.getElementById(
          "supplies-qty-input",
        ) as HTMLInputElement;
        const errorEl = document.getElementById("supplies-buy-error");
        const buyBtn = document.getElementById("supplies-buy-btn");
        if (!popup || !titleEl || !bodyEl || !qtyInput || !errorEl || !buyBtn)
          return;
        (popup as HTMLElement).dataset.suppliesItem = itemJson;
        (popup as HTMLElement).dataset.suppliesPrice = priceStr;
        (popup as HTMLElement).dataset.rarity =
          (item.rarity as string) ?? "common";
        titleEl.textContent = "";
        bodyEl.innerHTML =
          getItemPopupBodyHtml(item) +
          `<p class="item-popup-price" style="margin-top:12px;font-weight:700"><strong>$${price.toLocaleString()}</strong> each</p>`;
        const st = usePlayerCompanyStore.getState();
        const level = st.company?.level ?? st.companyLevel ?? 1;
        const inv = st.company?.inventory ?? [];
        const cat = getItemArmoryCategory(item);
        const count = countArmoryByCategory(inv)[cat];
        const cap = getArmorySlotsForCategory(level, cat);
        const slotsFree = Math.max(0, cap - count);
        qtyInput.value = "1";
        qtyInput.max = String(Math.max(1, slotsFree));
        errorEl.textContent = "";
        errorEl.classList.remove("visible");
        popup.removeAttribute("hidden");
        buyBtn.removeAttribute("disabled");
        (buyBtn as HTMLElement).innerHTML =
          `Buy <span class="buy-btn-price">$${price.toLocaleString()}</span>`;
      },
    },
    {
      selector: DOM.supplies.qtyMinus,
      eventType: "click",
      callback: () => {
        const input = document.getElementById(
          "supplies-qty-input",
        ) as HTMLInputElement;
        const popup = document.getElementById("supplies-buy-popup");
        const buyBtn = document.getElementById("supplies-buy-btn");
        if (!input || !popup || !buyBtn) return;
        const v = Math.max(1, parseInt(input.value || "1", 10) - 1);
        input.value = String(v);
        const price = parseInt(
          (popup as HTMLElement).dataset.suppliesPrice ?? "0",
          10,
        );
        (buyBtn as HTMLElement).innerHTML =
          `Buy <span class="buy-btn-price">$${(price * v).toLocaleString()}</span>`;
      },
    },
    {
      selector: DOM.supplies.qtyPlus,
      eventType: "click",
      callback: () => {
        const input = document.getElementById(
          "supplies-qty-input",
        ) as HTMLInputElement;
        const popup = document.getElementById("supplies-buy-popup");
        const buyBtn = document.getElementById("supplies-buy-btn");
        if (!input || !popup || !buyBtn) return;
        const max = parseInt(input.max || "1", 10);
        const v = Math.min(max, parseInt(input.value || "1", 10) + 1);
        input.value = String(v);
        const price = parseInt(
          (popup as HTMLElement).dataset.suppliesPrice ?? "0",
          10,
        );
        (buyBtn as HTMLElement).innerHTML =
          `Buy <span class="buy-btn-price">$${(price * v).toLocaleString()}</span>`;
      },
    },
    {
      selector: DOM.supplies.buyBtn,
      eventType: "click",
      callback: () => {
        const popup = document.getElementById("supplies-buy-popup");
        const qtyInput = document.getElementById(
          "supplies-qty-input",
        ) as HTMLInputElement;
        const errorEl = document.getElementById("supplies-buy-error");
        if (!popup || !qtyInput || !errorEl) return;
        const itemJson = (popup as HTMLElement).dataset.suppliesItem;
        const priceStr = (popup as HTMLElement).dataset.suppliesPrice;
        if (!itemJson || !priceStr) return;
        let item: import("../../constants/items/types.ts").Item;
        try {
          item = JSON.parse(itemJson.replace(/&quot;/g, '"'));
        } catch {
          return;
        }
        const price = parseInt(priceStr, 10);
        const qty = parseInt(qtyInput.value || "1", 10);
        if (qty < 1) return;
        const totalCost = price * qty;
        const items = Array.from({ length: qty }, () => ({ ...item }));
        const result = usePlayerCompanyStore
          .getState()
          .addItemsToCompanyInventory(items, totalCost);
        if (!result.success) {
          if (result.reason === "capacity") {
            errorEl.textContent = "You don't have enough room";
          } else {
            errorEl.textContent = "Not enough credits";
          }
          errorEl.classList.add("visible");
          return;
        }
        errorEl.textContent = "";
        errorEl.classList.remove("visible");
        playMarketBuyToArmoryAnimation("supplies-buy-body", qty);
        updateMarketCreditsDisplay();

        const st = usePlayerCompanyStore.getState();
        const level = st.company?.level ?? st.companyLevel ?? 1;
        const inv = st.company?.inventory ?? [];
        const cat = getItemArmoryCategory(item);
        const count = countArmoryByCategory(inv)[cat];
        const cap = getArmorySlotsForCategory(level, cat);
        const slotsFree = Math.max(0, cap - count);
        qtyInput.max = String(Math.max(1, slotsFree));
        const nextQty = Math.max(
          1,
          Math.min(parseInt(qtyInput.value || "1", 10), Math.max(1, slotsFree)),
        );
        qtyInput.value = String(nextQty);
        const buyBtn = document.getElementById("supplies-buy-btn");
        if (buyBtn) {
          (buyBtn as HTMLButtonElement).innerHTML =
            `Buy <span class="buy-btn-price">$${(price * nextQty).toLocaleString()}</span>`;
          (buyBtn as HTMLButtonElement).disabled = slotsFree <= 0;
        }
        if (slotsFree <= 0) {
          errorEl.textContent = "Armory full";
          errorEl.classList.add("visible");
        }
      },
    },
    {
      selector: DOM.supplies.buyClose,
      eventType: "click",
      callback: () => {
        const popup = document.getElementById("supplies-buy-popup");
        if (popup) popup.setAttribute("hidden", "");
      },
    },
    {
      selector: "#supplies-buy-popup",
      eventType: "click",
      callback: (e: Event) => {
        if ((e.target as HTMLElement).id === "supplies-buy-popup") {
          (e.target as HTMLElement).setAttribute("hidden", "");
        }
      },
    },
  ];

  function gearBuyHandlers(
    ids: {
      popup: string;
      title: string;
      body: string;
      qtyInput: string;
      error: string;
      buyBtn: string;
      qtyMinus: string;
      qtyPlus: string;
      buyClose: string;
    },
    // ids use element id (no #) for getElementById; selectors need # for querySelector
    itemSelector: string,
    _onSuccess: () => void,
  ): HandlerInitConfig[] {
    return [
      {
        selector: itemSelector,
        eventType: "click",
        callback: (e: Event) => {
          const el = (e.target as HTMLElement).closest(".gear-market-item");
          if (!el) return;
          const priceStr = (el as HTMLElement).dataset.gearPrice;
          const itemJson = (el as HTMLElement).dataset.gearItem;
          if (!priceStr || !itemJson) return;
          let item: import("../../constants/items/types.ts").Item;
          try {
            item = JSON.parse(itemJson.replace(/&quot;/g, '"'));
          } catch {
            return;
          }
          const price = parseInt(priceStr, 10);
          const popup = document.getElementById(ids.popup);
          const titleEl = document.getElementById(ids.title);
          const bodyEl = document.getElementById(ids.body);
          const qtyInput = document.getElementById(
            ids.qtyInput,
          ) as HTMLInputElement;
          const errorEl = document.getElementById(ids.error);
          const buyBtn = document.getElementById(ids.buyBtn);
          if (!popup || !titleEl || !bodyEl || !qtyInput || !errorEl || !buyBtn)
            return;
          (popup as HTMLElement).dataset.gearItem = itemJson;
          (popup as HTMLElement).dataset.gearPrice = priceStr;
          (popup as HTMLElement).dataset.rarity =
            (item.rarity as string) ?? "common";
          titleEl.textContent = "";
          bodyEl.innerHTML = getItemPopupBodyHtml(item);
          const st = usePlayerCompanyStore.getState();
          const level = st.company?.level ?? st.companyLevel ?? 1;
          const inv = st.company?.inventory ?? [];
          const cat = getItemArmoryCategory(item);
          const count = countArmoryByCategory(inv)[cat];
          const cap = getArmorySlotsForCategory(level, cat);
          const slotsFree = Math.max(0, cap - count);
          qtyInput.value = "1";
          qtyInput.max = String(Math.max(1, Math.min(slotsFree, 10)));
          errorEl.textContent = "";
          errorEl.classList.remove("visible");
          popup.removeAttribute("hidden");
          (buyBtn as HTMLElement).innerHTML =
            `Buy <span class="buy-btn-price">$${price.toLocaleString()}</span>`;
        },
      },
      {
        selector: `#${ids.qtyMinus}`,
        eventType: "click",
        callback: () => {
          const input = document.getElementById(
            ids.qtyInput,
          ) as HTMLInputElement;
          const popup = document.getElementById(ids.popup);
          const buyBtn = document.getElementById(ids.buyBtn);
          if (!input || !popup || !buyBtn) return;
          const v = Math.max(1, parseInt(input.value || "1", 10) - 1);
          input.value = String(v);
          const price = parseInt(
            (popup as HTMLElement).dataset.gearPrice ?? "0",
            10,
          );
          (buyBtn as HTMLElement).innerHTML =
            `Buy <span class="buy-btn-price">$${(price * v).toLocaleString()}</span>`;
        },
      },
      {
        selector: `#${ids.qtyPlus}`,
        eventType: "click",
        callback: () => {
          const input = document.getElementById(
            ids.qtyInput,
          ) as HTMLInputElement;
          const popup = document.getElementById(ids.popup);
          const buyBtn = document.getElementById(ids.buyBtn);
          if (!input || !popup || !buyBtn) return;
          const max = parseInt(input.max || "1", 10);
          const v = Math.min(max, parseInt(input.value || "1", 10) + 1);
          input.value = String(v);
          const price = parseInt(
            (popup as HTMLElement).dataset.gearPrice ?? "0",
            10,
          );
          (buyBtn as HTMLElement).innerHTML =
            `Buy <span class="buy-btn-price">$${(price * v).toLocaleString()}</span>`;
        },
      },
      {
        selector: `#${ids.buyBtn}`,
        eventType: "click",
        callback: () => {
          const popup = document.getElementById(ids.popup);
          const qtyInput = document.getElementById(
            ids.qtyInput,
          ) as HTMLInputElement;
          const errorEl = document.getElementById(ids.error);
          if (!popup || !qtyInput || !errorEl) return;
          const itemJson = (popup as HTMLElement).dataset.gearItem;
          const priceStr = (popup as HTMLElement).dataset.gearPrice;
          if (!itemJson || !priceStr) return;
          let item: import("../../constants/items/types.ts").Item;
          try {
            item = JSON.parse(itemJson.replace(/&quot;/g, '"'));
          } catch {
            return;
          }
          const price = parseInt(priceStr, 10);
          const qty = parseInt(qtyInput.value || "1", 10);
          if (qty < 1) return;
          const totalCost = price * qty;
          const st = usePlayerCompanyStore.getState();
          const level = st.company?.level ?? st.companyLevel ?? 1;
          const inv = st.company?.inventory ?? [];
          const cat = getItemArmoryCategory(item);
          const count = countArmoryByCategory(inv)[cat];
          const cap = getArmorySlotsForCategory(level, cat);
          const slotsFree = Math.max(0, cap - count);
          if (qty > slotsFree) {
            errorEl.textContent = "Not enough room";
            errorEl.classList.add("visible");
            return;
          }
          const items = Array.from({ length: qty }, () => ({ ...item }));
          const result = usePlayerCompanyStore
            .getState()
            .addItemsToCompanyInventory(items, totalCost);
          if (!result.success) {
            errorEl.textContent =
              result.reason === "capacity"
                ? "Not enough room"
                : "Not enough credits";
            errorEl.classList.add("visible");
            return;
          }
          errorEl.textContent = "";
          errorEl.classList.remove("visible");
          playMarketBuyToArmoryAnimation(ids.body, qty);
          updateMarketCreditsDisplay();

          const nextStore = usePlayerCompanyStore.getState();
          const nextLevel =
            nextStore.company?.level ?? nextStore.companyLevel ?? 1;
          const nextInv = nextStore.company?.inventory ?? [];
          const nextCat = getItemArmoryCategory(item);
          const nextCount = countArmoryByCategory(nextInv)[nextCat];
          const nextCap = getArmorySlotsForCategory(nextLevel, nextCat);
          const nextSlotsFree = Math.max(0, nextCap - nextCount);
          const nextMax = Math.max(1, Math.min(nextSlotsFree, 10));
          qtyInput.max = String(nextMax);
          const nextQty = Math.max(
            1,
            Math.min(parseInt(qtyInput.value || "1", 10), nextMax),
          );
          qtyInput.value = String(nextQty);
          const buyBtn = document.getElementById(
            ids.buyBtn,
          ) as HTMLButtonElement | null;
          if (buyBtn) {
            buyBtn.innerHTML = `Buy <span class="buy-btn-price">$${(price * nextQty).toLocaleString()}</span>`;
            buyBtn.disabled = nextSlotsFree <= 0;
          }
          if (nextSlotsFree <= 0) {
            errorEl.textContent = "Armory full";
            errorEl.classList.add("visible");
          }
        },
      },
      {
        selector: `#${ids.buyClose}`,
        eventType: "click",
        callback: () => {
          const popup = document.getElementById(ids.popup);
          if (popup) popup.setAttribute("hidden", "");
        },
      },
      {
        selector: `#${ids.popup}`,
        eventType: "click",
        callback: (e: Event) => {
          if ((e.target as HTMLElement).id === ids.popup) {
            document.getElementById(ids.popup)?.setAttribute("hidden", "");
          }
        },
      },
    ];
  }

  function marketSellPopupHandlers(onDone: () => void): HandlerInitConfig[] {
    function updateSummary() {
      const popup = document.getElementById("market-sell-popup");
      const btn = document.getElementById(
        "market-sell-confirm",
      ) as HTMLButtonElement | null;
      if (!popup || !btn) return;
      const selected = Array.from(
        popup.querySelectorAll(".market-sell-item.selected"),
      ) as HTMLElement[];
      const count = selected.length;
      const total = selected.reduce(
        (sum, el) => sum + (parseInt(el.dataset.sellValue ?? "0", 10) || 0),
        0,
      );
      btn.disabled = count <= 0;
      btn.textContent = `${CREDIT_SYMBOL} Sell ${count} Item${count === 1 ? "" : "s"} • ${CREDIT_SYMBOL}${total.toLocaleString()}`;
    }

    return [
      {
        selector: "#market-sell-open",
        eventType: "click",
        callback: () => {
          const popup = document.getElementById("market-sell-popup");
          if (!popup) return;
          popup
            .querySelectorAll(".market-sell-item.selected")
            .forEach((el) => el.classList.remove("selected"));
          popup.removeAttribute("hidden");
          updateSummary();
        },
      },
      {
        selector: "#market-sell-grid",
        eventType: "click",
        callback: (e: Event) => {
          const target = (e.target as HTMLElement).closest(
            ".market-sell-item",
          ) as HTMLElement | null;
          if (!target) return;
          target.classList.toggle("selected");
          updateSummary();
        },
      },
      {
        selector: "#market-sell-close",
        eventType: "click",
        callback: () => {
          const popup = document.getElementById("market-sell-popup");
          if (popup) popup.setAttribute("hidden", "");
        },
      },
      {
        selector: "#market-sell-confirm",
        eventType: "click",
        callback: () => {
          const popup = document.getElementById("market-sell-popup");
          if (!popup) return;
          const selected = Array.from(
            popup.querySelectorAll(".market-sell-item.selected"),
          ) as HTMLElement[];
          const indices = selected
            .map((el) => parseInt(el.dataset.itemIndex ?? "-1", 10))
            .filter((n) => Number.isFinite(n) && n >= 0);
          if (indices.length === 0) return;
          const hasRareOrEpic = selected.some((el) => {
            const rarity = (el.dataset.itemRarity ?? "common").toLowerCase();
            return rarity === "rare" || rarity === "epic";
          });
          if (hasRareOrEpic) {
            const total = selected.reduce(
              (sum, el) =>
                sum + (parseInt(el.dataset.sellValue ?? "0", 10) || 0),
              0,
            );
            const ok = window.confirm(
              `Sell ${indices.length} selected item(s) for ${CREDIT_SYMBOL}${total.toLocaleString()}?`,
            );
            if (!ok) return;
          }
          const result = usePlayerCompanyStore
            .getState()
            .sellCompanyItems(indices);
          if (!result.success) return;
          popup.setAttribute("hidden", "");
          onDone();
        },
      },
      {
        selector: "#market-sell-popup",
        eventType: "click",
        callback: (e: Event) => {
          if (e.target !== e.currentTarget) return;
          (e.currentTarget as HTMLElement).setAttribute("hidden", "");
        },
      },
    ];
  }

  const weaponsScreenEventConfig: HandlerInitConfig[] = [
    ...marketLevelNavHandlers("weapons-market", () =>
      UiManager.renderWeaponsMarketScreen(),
    ),
    ...marketSellPopupHandlers(() => UiManager.renderWeaponsMarketScreen()),
    ...gearBuyHandlers(
      {
        popup: "weapons-buy-popup",
        title: "weapons-buy-title",
        body: "weapons-buy-body",
        qtyInput: "weapons-qty-input",
        error: "weapons-buy-error",
        buyBtn: "weapons-buy-btn",
        qtyMinus: "weapons-qty-minus",
        qtyPlus: "weapons-qty-plus",
        buyClose: "weapons-buy-close",
      },
      DOM.weapons.item,
      () => UiManager.renderWeaponsMarketScreen(),
    ),
  ];

  const devCatalogScreenEventConfig: HandlerInitConfig[] = [
    ...marketLevelNavHandlers(
      "dev-catalog-market",
      () => UiManager.renderDevCatalogScreen(),
      MAX_GEAR_LEVEL,
      { tierSource: "devCatalog" },
    ),
    {
      selector: "#dev-catalog-market .dev-catalog-item",
      eventType: "click",
      callback: (e: Event) => {
        const card = (e.target as HTMLElement).closest(".dev-catalog-item");
        const itemJson = card?.getAttribute("data-gear-item");
        if (!itemJson) return;
        const item = JSON.parse(itemJson) as Item;
        const popup = document.getElementById("dev-catalog-popup");
        const bodyEl = document.getElementById("dev-catalog-popup-body");
        if (popup && bodyEl) {
          (popup as HTMLElement).dataset.devCatalogItem = itemJson;
          bodyEl.innerHTML = getItemPopupBodyHtml(item);
          popup.removeAttribute("hidden");
        }
      },
    },
    {
      selector: "#dev-catalog-grant-btn",
      eventType: "click",
      callback: () => {
        const popup = document.getElementById("dev-catalog-popup");
        const itemJson = (popup as HTMLElement)?.dataset?.devCatalogItem;
        if (!itemJson) return;
        let item: Item;
        try {
          item = JSON.parse(itemJson.replace(/&quot;/g, '"'));
        } catch {
          return;
        }
        const copy = { ...item };
        if (
          copy.uses == null &&
          (copy.type === "throwable" || copy.type === "medical")
        )
          copy.uses = 5;
        const result = usePlayerCompanyStore
          .getState()
          .addItemsToCompanyInventory([copy], 0);
        if (result.success) {
          popup?.setAttribute("hidden", "");
        }
      },
    },
    {
      selector: "#dev-catalog-popup-close",
      eventType: "click",
      callback: () => {
        const popup = document.getElementById("dev-catalog-popup");
        if (popup) popup.setAttribute("hidden", "");
      },
    },
    {
      selector: "#dev-catalog-popup",
      eventType: "click",
      callback: (e: Event) => {
        if ((e.target as HTMLElement).id === "dev-catalog-popup") {
          (e.target as HTMLElement).setAttribute("hidden", "");
        }
      },
    },
  ];

  const armorScreenEventConfig: HandlerInitConfig[] = [
    ...marketLevelNavHandlers("armor-market", () =>
      UiManager.renderArmorMarketScreen(),
    ),
    ...marketSellPopupHandlers(() => UiManager.renderArmorMarketScreen()),
    ...gearBuyHandlers(
      {
        popup: "armor-buy-popup",
        title: "armor-buy-title",
        body: "armor-buy-body",
        qtyInput: "armor-qty-input",
        error: "armor-buy-error",
        buyBtn: "armor-buy-btn",
        qtyMinus: "armor-qty-minus",
        qtyPlus: "armor-qty-plus",
        buyClose: "armor-buy-close",
      },
      DOM.armor.item,
      () => UiManager.renderArmorMarketScreen(),
    ),
  ];

  const abilitiesScreenEventConfig: HandlerInitConfig[] = [
    {
      selector: ".company-talent-node[data-ability-id]",
      eventType: "click",
      callback: (e: Event) => {
        const node = e.currentTarget as HTMLElement;
        const abilityId = (node.dataset.abilityId ??
          "") as import("../../constants/company-abilities.ts").CompanyAbilityId;
        if (!abilityId) return;
        const popup = document.getElementById("company-ability-detail-popup");
        const titleEl = document.getElementById("company-ability-detail-title");
        const descEl = document.getElementById(
          "company-ability-detail-description",
        );
        const learnBtn = document.getElementById(
          "company-ability-detail-learn",
        ) as HTMLButtonElement | null;
        if (
          !popup ||
          !titleEl ||
          !descEl ||
          !learnBtn
        )
          return;

        const lvl = Math.max(1, Math.floor(Number(node.dataset.level ?? 0)));
        const owned = node.dataset.owned === "1";
        const selected = node.dataset.selected === "1";
        const selectable = node.dataset.selectable === "1";
        const name = node.dataset.name ?? abilityId;
        const description = node.dataset.description ?? "";

        titleEl.textContent = name;
        descEl.textContent = description;
        learnBtn.dataset.level = String(lvl);
        learnBtn.dataset.abilityId = abilityId;
        if (selectable) {
          learnBtn.hidden = false;
          learnBtn.disabled = false;
          learnBtn.textContent = "Learn Ability";
        } else if (selected) {
          learnBtn.hidden = false;
          learnBtn.disabled = true;
          learnBtn.textContent = "Learned";
        } else if (owned) {
          learnBtn.hidden = false;
          learnBtn.disabled = true;
          learnBtn.textContent = "Learned";
        } else {
          learnBtn.hidden = false;
          learnBtn.disabled = true;
          learnBtn.textContent = "Locked";
        }
        popup.removeAttribute("hidden");
      },
    },
    {
      selector: "#company-ability-detail-learn",
      eventType: "click",
      callback: (e: Event) => {
        const btn = e.currentTarget as HTMLButtonElement;
        if (btn.disabled) return;
        const lvl = Math.max(1, Math.floor(Number(btn.dataset.level ?? 0)));
        const abilityId = (btn.dataset.abilityId ??
          "") as import("../../constants/company-abilities.ts").CompanyAbilityId;
        if (!abilityId) return;
        const result = usePlayerCompanyStore
          .getState()
          .chooseCompanyAbilityAtLevel(lvl, abilityId);
        if (!result.success) return;
        const popup = document.getElementById("company-ability-detail-popup");
        if (popup) popup.setAttribute("hidden", "");
        UiManager.renderAbilitiesScreen();
      },
    },
    {
      selector: "#company-ability-detail-close",
      eventType: "click",
      callback: () => {
        const popup = document.getElementById("company-ability-detail-popup");
        if (popup) popup.setAttribute("hidden", "");
      },
    },
    {
      selector: "#company-ability-detail-popup",
      eventType: "click",
      callback: (e: Event) => {
        if ((e.target as HTMLElement).id !== "company-ability-detail-popup")
          return;
        (e.currentTarget as HTMLElement).setAttribute("hidden", "");
      },
    },
    {
      selector: "#abilities-screen",
      eventType: "click",
      callback: (e: Event) => {
        const popup = document.getElementById("company-ability-detail-popup");
        if (!popup || popup.hasAttribute("hidden")) return;
        const target = e.target as HTMLElement;
        if (target.closest(".company-talent-popup-inner")) return;
        if (target.closest(".company-talent-node[data-ability-id]")) return;
        popup.setAttribute("hidden", "");
      },
    },
    {
      selector: "#company-abilities-notify-continue",
      eventType: "click",
      callback: () => {
        const st = usePlayerCompanyStore.getState();
        st.dismissCompanyAbilityNotification();
        const popup = document.getElementById("company-abilities-notify-popup");
        if (popup) {
          popup.classList.add("home-onboarding-popup-hide");
          window.setTimeout(() => popup.remove(), 220);
        }
      },
    },
    {
      selector: "#company-abilities-notify-popup",
      eventType: "click",
      callback: (e: Event) => {
        if ((e.target as HTMLElement).id !== "company-abilities-notify-popup")
          return;
        const st = usePlayerCompanyStore.getState();
        st.dismissCompanyAbilityNotification();
        (e.currentTarget as HTMLElement).remove();
      },
    },
  ];

  function alignTalentTreeConnectors(): void {
    const tree = document.getElementById("company-talent-tree");
    if (!tree) return;
    const rows = Array.from(
      tree.querySelectorAll(":scope > .company-talent-row"),
    ) as HTMLElement[];
    const connectors = Array.from(
      tree.querySelectorAll(":scope > .company-talent-connector"),
    ) as HTMLElement[];
    connectors.forEach((connector, idx) => {
      const fromRow = rows[idx];
      const toRow = rows[idx + 1];
      if (!fromRow || !toRow) return;
      const svg = connector.querySelector("svg");
      if (!svg) return;
      const lines = Array.from(svg.querySelectorAll("line"));
      if (!lines.length) return;

      const fromNodes = Array.from(
        fromRow.querySelectorAll(".company-talent-node"),
      ) as HTMLElement[];
      const toNodes = Array.from(
        toRow.querySelectorAll(".company-talent-node"),
      ) as HTMLElement[];
      if (!fromNodes.length || !toNodes.length) return;

      const connectorRect = connector.getBoundingClientRect();
      const toPoint = (el: HTMLElement, edge: "top" | "bottom") => {
        const r = el.getBoundingClientRect();
        return {
          x: r.left + r.width / 2 - connectorRect.left,
          y: (edge === "top" ? r.top : r.bottom) - connectorRect.top,
        };
      };

      if (lines.length >= 2 && fromNodes.length === 1 && toNodes.length >= 2) {
        const from = toPoint(fromNodes[0], "bottom");
        const leftTo = toPoint(toNodes[0], "top");
        const rightTo = toPoint(toNodes[toNodes.length - 1], "top");
        lines[0].setAttribute("x1", String(from.x));
        lines[0].setAttribute("y1", String(from.y));
        lines[0].setAttribute("x2", String(leftTo.x));
        lines[0].setAttribute("y2", String(leftTo.y));
        lines[1].setAttribute("x1", String(from.x));
        lines[1].setAttribute("y1", String(from.y));
        lines[1].setAttribute("x2", String(rightTo.x));
        lines[1].setAttribute("y2", String(rightTo.y));
      } else if (
        lines.length >= 2 &&
        fromNodes.length >= 2 &&
        toNodes.length === 1
      ) {
        const leftFrom = toPoint(fromNodes[0], "bottom");
        const rightFrom = toPoint(fromNodes[fromNodes.length - 1], "bottom");
        const to = toPoint(toNodes[0], "top");
        lines[0].setAttribute("x1", String(leftFrom.x));
        lines[0].setAttribute("y1", String(leftFrom.y));
        lines[0].setAttribute("x2", String(to.x));
        lines[0].setAttribute("y2", String(to.y));
        lines[1].setAttribute("x1", String(rightFrom.x));
        lines[1].setAttribute("y1", String(rightFrom.y));
        lines[1].setAttribute("x2", String(to.x));
        lines[1].setAttribute("y2", String(to.y));
      } else {
        const from = toPoint(fromNodes[0], "bottom");
        const to = toPoint(toNodes[0], "top");
        lines[0].setAttribute("x1", String(from.x));
        lines[0].setAttribute("y1", String(from.y));
        lines[0].setAttribute("x2", String(to.x));
        lines[0].setAttribute("y2", String(to.y));
      }
    });
  }

  if (document.getElementById("abilities-screen")) {
    const w = window as Window & {
      __talentTreeConnectorResizeHandler?: () => void;
    };
    if (w.__talentTreeConnectorResizeHandler) {
      window.removeEventListener("resize", w.__talentTreeConnectorResizeHandler);
    }
    const handler = () => alignTalentTreeConnectors();
    w.__talentTreeConnectorResizeHandler = handler;
    window.requestAnimationFrame(() => alignTalentTreeConnectors());
    window.setTimeout(() => alignTalentTreeConnectors(), 0);
    window.addEventListener("resize", handler);
  }

  return {
    gameSetup: () => gameSetupEventConfig,
    confirmationScreen: () => gameConfirmationEventConfig,
    mainMenu: () => mainMenuEventConfig,
    companyHome: () => companyHomeEventConfig,
    market: () => marketEventConfig,
    troopsScreen: () => troopsScreenEventConfig,
    missionsScreen: () => missionsScreenEventConfig,
    careerScreen: () => careerScreenEventConfig,
    rosterScreen: () => rosterScreenEventConfig,
    inventoryScreen: () => inventoryScreenEventConfig,
    equipPicker: () => equipPickerEventConfig,
    suppliesScreen: () => suppliesScreenEventConfig,
    weaponsScreen: () => weaponsScreenEventConfig,
    armorScreen: () => armorScreenEventConfig,
    devCatalogScreen: () => devCatalogScreenEventConfig,
    memorialScreen: () => [],
    trainingScreen: () => [],
    abilitiesScreen: () => abilitiesScreenEventConfig,
    readyRoomScreen: () => readyRoomScreenEventConfig,
    formationScreen: () => formationScreenEventConfig,
    combatScreen: combatScreenEventConfig,
  };
}
