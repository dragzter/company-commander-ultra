import type { HandlerInitConfig } from "../../constants/types.ts";
import { getItemPopupBodyHtml } from "../html-templates/inventory-template.ts";
import {
  STARTING_CREDITS,
  getArmorySlotsForCategory,
} from "../../constants/economy.ts";
import {
  getItemArmoryCategory,
  countArmoryByCategory,
} from "../../utils/item-utils.ts";
import { getActiveSlots, getFormationSlots } from "../../constants/company-slots.ts";
import { setFormationSwapIndices } from "../html-templates/formation-template.ts";
import { setLastEquipMoveSoldierIds, setLastReadyRoomMoveSlotIndices } from "../html-templates/ready-room-template.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { getMaxSoldierLevel } from "../../utils/company-utils.ts";
import { disableBtn, enableBtn, s_, sa_ } from "../../utils/html-utils.ts";
import { DOM } from "../../constants/css-selectors.ts";
import { Styler } from "../../utils/styler-manager.ts";
import { UiManager } from "./ui-manager.ts";
import {
  getSoldierAbilities,
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
  clearExpiredEffects,
  removeTargetsForCombatantInCover,
  resolveAttack,
  getNextAttackAt,
} from "../combat/combat-loop.ts";
import type { TargetMap } from "../combat/types.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import { weaponWieldOk, itemFitsSlot, canEquipItemLevel } from "../../utils/equip-utils.ts";
import { resolveGrenadeThrow } from "../../services/combat/grenade-resolver.ts";
import type { Combatant } from "../combat/types.ts";
import type { Mission } from "../../constants/missions.ts";
import { MISSION_KIND_META, DIFFICULTY_LABELS } from "../../constants/missions.ts";
import {
  combatSummaryTemplate,
  buildCombatSummaryData,
} from "../html-templates/combat-summary-template.ts";

/**
 * Contains definitions for the events of all html templates.
 * Configured when the html is called and appended to the DOM.
 */
export function eventConfigs() {
  const store = usePlayerCompanyStore.getState();

  const marketLevelNavHandlers = (
    containerId: string,
    render: () => void,
  ): HandlerInitConfig[] => [
    {
      selector: `#${containerId} .market-level-nav-prev`,
      eventType: "click",
      callback: () => {
        const st = usePlayerCompanyStore.getState();
        const max = getMaxSoldierLevel(st.company);
        const cur = st.marketTierLevel || max;
        if (cur > 1) {
          st.setMarketTierLevel(cur - 1);
          render();
        }
      },
    },
    {
      selector: `#${containerId} .market-level-nav-next`,
      eventType: "click",
      callback: () => {
        const st = usePlayerCompanyStore.getState();
        const max = getMaxSoldierLevel(st.company);
        const cur = st.marketTierLevel || max;
        if (cur < max) {
          st.setMarketTierLevel(cur + 1);
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
        usePlayerCompanyStore.getState().addInitialTroopsIfEmpty();
        usePlayerCompanyStore.getState().addInitialArmoryIfEmpty();
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
        const tab = (e.currentTarget as HTMLElement);
        const tabName = tab.dataset.tab;
        if (!tabName) return;
        const popup = s_(DOM.company.codexPopup);
        if (!popup) return;
        popup.querySelectorAll(".codex-tab").forEach((t) => t.classList.remove("active"));
        popup.querySelectorAll(".codex-tab-panel").forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        const panel = popup.querySelector(`[data-panel="${tabName}"]`);
        if (panel) panel.classList.add("active");
      },
    },
  ];

  const marketEventConfig: HandlerInitConfig[] = [
    {
      selector: DOM.market.marketTroopsLink,
      eventType: "click",
      callback: () => {
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
  ];

  const missionsScreenEventConfig: HandlerInitConfig[] = [
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
        const mission = JSON.parse(json);
        console.log("Launch mission", mission);
        UiManager.renderReadyRoomScreen(mission);
      },
    },
    {
      selector: DOM.missions.readMoreBtn,
      eventType: "click",
      callback: (e: Event) => {
        const btn = e.currentTarget as HTMLButtonElement;
        const desc = btn.closest(".mission-card-body")?.querySelector(".mission-card-desc");
        const fullText = desc?.getAttribute("data-full-text");
        const popup = s_(DOM.missions.flavorPopup);
        const titleEl = popup?.querySelector("#mission-flavor-popup-title") as HTMLElement;
        const textEl = popup?.querySelector("#mission-flavor-popup-text") as HTMLElement;
        if (popup && titleEl && textEl && fullText) {
          const card = btn.closest(".mission-card");
          titleEl.textContent = (card?.querySelector(".mission-card-name")?.textContent ?? "Mission Brief").trim();
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

  function combatScreenEventConfig(
    players: Combatant[],
    enemies: Combatant[],
  ): HandlerInitConfig[] {
    let grenadeTargetingMode: { thrower: Combatant; grenade: SoldierGrenade } | null = null;
    let medTargetingMode: { user: Combatant; medItem: SoldierMedItem } | null = null;
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
    for (const p of players) {
      playerKills.set(p.id, 0);
      playerDamage.set(p.id, 0);
      playerDamageTaken.set(p.id, 0);
      playerAbilitiesUsed.set(p.id, 0);
    }

    function getSoldierFromStore(soldierId: string) {
      const company = usePlayerCompanyStore.getState().company;
      return company?.soldiers?.find((s) => s.id === soldierId) ?? null;
    }

    function positionPopupUnderCard(popup: HTMLElement, card: HTMLElement | null) {
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
      leftV = Math.max(screenRect.left + 12, Math.min(screenRect.right - popupRect.width - 12, leftV));
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

    function openAbilitiesPopup(combatant: Combatant, card?: HTMLElement | null) {
      if (combatWinner || combatant.side !== "player") return;
      const popup = document.getElementById("combat-abilities-popup");
      const contentEl = document.getElementById("combat-abilities-popup-content");
      const hintEl = document.getElementById("combat-abilities-popup-hint");
      const listEl = document.getElementById("combat-abilities-list");
      const titleEl = document.getElementById("combat-abilities-popup-title");
      if (!popup || !contentEl || !hintEl || !listEl || !titleEl) return;

      const canUse = combatStarted && !combatWinner;
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

      const used = combatant.takeCoverUsed;
      const now = Date.now();
      const suppressOnCooldown = (combatant.suppressCooldownUntil ?? 0) > now;
      const suppressRemainingSec = suppressOnCooldown ? Math.ceil((combatant.suppressCooldownUntil! - now) / 1000) : 0;
      const designation = (combatant.designation ?? "").toLowerCase();
      const abilities = getSoldierAbilities().filter((a) => {
        if (a.designationRestrict) return designation === a.designationRestrict;
        return true;
      });
      const abilityButtons = abilities.map((a) => {
        const isTakeCover = a.id === "take_cover";
        const isSuppress = a.id === "suppress";
        const suppressDisabled = isSuppress && suppressOnCooldown;
        const disabled = isTakeCover ? (used || !canUse) : isSuppress ? (!canUse || suppressOnCooldown) : !canUse;
        const usedClass = isTakeCover && used ? " combat-ability-used" : "";
        const cooldownClass = suppressOnCooldown ? " combat-ability-cooldown" : "";
        const wrapClass = isTakeCover ? "combat-ability-take-cover-wrap" : isSuppress ? "combat-ability-suppress-wrap" : "";
        const timerHtml = isSuppress && suppressOnCooldown
          ? `<span class="combat-ability-cooldown-timer" data-ability-cooldown="suppress">${suppressRemainingSec}</span>`
          : "";
        return `<button type="button" class="combat-ability-icon-slot ${wrapClass}${usedClass}${cooldownClass}" data-ability-id="${a.id}" data-soldier-id="${combatant.id}" ${disabled ? "disabled" : ""} title="${a.name}" aria-label="${a.name}">
            <img src="${a.icon}" alt="" width="48" height="48">
            ${timerHtml}
            <span class="combat-ability-label">${a.name}</span>
          </button>`;
      }).join("");

      function buildEquipmentHtml(c: Combatant) {
        const eqNow = Date.now();
        const grenadeOnCooldown = (c.grenadeCooldownUntil ?? 0) > eqNow;
        const grenadeRemainingSec = grenadeOnCooldown ? Math.ceil((c.grenadeCooldownUntil! - eqNow) / 1000) : 0;
        return equipmentSlots.map((slot) => {
          if (slot.type === "grenade") {
            const g = slot.data;
            const isKnife = g.item.id === "tk21_throwing_knife";
            const qty = g.item.uses ?? g.item.quantity ?? 1;
            const level = g.item.level ?? 1;
            const rarity = g.item.rarity ?? "common";
            const iconUrl = getItemIconUrl(g.item);
            const hasUses = g.item.uses != null || g.item.quantity != null;
            const btnRarity = rarity !== "common" ? ` rarity-${rarity}` : "";
            const grenadeDisabled = !canUse || (!isKnife && grenadeOnCooldown);
            const cooldownClass = !isKnife && grenadeOnCooldown ? " combat-grenade-cooldown" : "";
            const timerHtml = !isKnife && grenadeOnCooldown
              ? `<span class="combat-grenade-cooldown-timer">${grenadeRemainingSec}</span>`
              : "";
            return `<button type="button" class="combat-grenade-item${btnRarity}${cooldownClass}" data-inventory-index="${g.inventoryIndex}" data-soldier-id="${c.id}" title="${g.item.name}" aria-label="${g.item.name}" ${grenadeDisabled ? "disabled" : ""}>
            <div class="combat-grenade-icon-wrap item-icon-wrap">
              <img class="combat-grenade-icon" src="${iconUrl}" alt="" width="48" height="48">
              <span class="item-level-badge rarity-${rarity}">Lv${level}</span>
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
              ${hasUses ? `<span class="inventory-item-qty inventory-uses-badge">×${qty}</span>` : ""}
            </div>
          </button>`;
          }
        }).join("");
      }

      listEl.innerHTML = abilityButtons + buildEquipmentHtml(combatant);

      function refreshAbilitiesList() {
        const c = players.find((p) => p.id === combatant.id);
        if (!c || popup.getAttribute("aria-hidden") === "true") return;
        const now = Date.now();
        const suppressOnCooldown = (c.suppressCooldownUntil ?? 0) > now;
        const suppressRemainingSec = suppressOnCooldown ? Math.ceil((c.suppressCooldownUntil! - now) / 1000) : 0;
        const used = c.takeCoverUsed;
        const des = (c.designation ?? "").toLowerCase();
        const abils = getSoldierAbilities().filter((a) => {
          if (a.designationRestrict) return des === a.designationRestrict;
          return true;
        });
        const btns = abils.map((a) => {
          const isTakeCover = a.id === "take_cover";
          const isSuppress = a.id === "suppress";
          const disabled = isTakeCover ? (used || !canUse) : isSuppress ? (!canUse || suppressOnCooldown) : !canUse;
          const usedClass = isTakeCover && used ? " combat-ability-used" : "";
          const cooldownClass = suppressOnCooldown ? " combat-ability-cooldown" : "";
          const wrapClass = isTakeCover ? "combat-ability-take-cover-wrap" : isSuppress ? "combat-ability-suppress-wrap" : "";
          const timerHtml = isSuppress && suppressOnCooldown
            ? `<span class="combat-ability-cooldown-timer" data-ability-cooldown="suppress">${suppressRemainingSec}</span>`
            : "";
          return `<button type="button" class="combat-ability-icon-slot ${wrapClass}${usedClass}${cooldownClass}" data-ability-id="${a.id}" data-soldier-id="${c.id}" ${disabled ? "disabled" : ""} title="${a.name}" aria-label="${a.name}">
            <img src="${a.icon}" alt="" width="48" height="48">
            ${timerHtml}
            <span class="combat-ability-label">${a.name}</span>
          </button>`;
        }).join("");
        listEl.innerHTML = btns + buildEquipmentHtml(c);
      }

      titleEl.textContent = "Abilities";
      contentEl.style.display = "";
      hintEl.classList.remove("visible");
      hintEl.textContent = "";
      popup.classList.remove("combat-abilities-popup-hint-only");
      popupCombatantId = combatant.id;
      popup.setAttribute("aria-hidden", "false");
      refreshAbilitiesList();
      positionPopupUnderCard(popup, card ?? document.querySelector(`[data-combatant-id="${combatant.id}"]`) as HTMLElement);

      void popup.offsetHeight;

      if (abilitiesPopupRefreshIntervalId != null) clearInterval(abilitiesPopupRefreshIntervalId);
      abilitiesPopupRefreshIntervalId = setInterval(refreshAbilitiesList, 1000);
    }

    function positionPopupCentered(popup: HTMLElement) {
      const combatScreen = document.getElementById("combat-screen");
      if (!combatScreen) return;
      const screenRect = combatScreen.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();
      const left = (screenRect.width - popupRect.width) / 2;
      const top = screenRect.height * 0.6 - popupRect.height / 2;
      popup.style.left = `${left}px`;
      popup.style.top = `${top}px`;
      popup.style.bottom = "";
      popup.style.transform = "none";
    }

    /** Position hint popup at top of screen, just below header */
    function positionPopupAtTop(popup: HTMLElement) {
      const combatScreen = document.getElementById("combat-screen");
      if (!combatScreen) return;
      const screenRect = combatScreen.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();
      const header = combatScreen.querySelector(".company-header");
      const headerBottom = header ? header.getBoundingClientRect().bottom - screenRect.top : 60;
      const left = (screenRect.width - popupRect.width) / 2;
      const top = headerBottom + 6;
      popup.style.left = `${left}px`;
      popup.style.top = `${top}px`;
      popup.style.bottom = "";
      popup.style.transform = "none";
    }

    function showGrenadeTargetingHint(_thrower: Combatant, grenade: SoldierGrenade) {
      const popup = document.getElementById("combat-abilities-popup");
      const contentEl = document.getElementById("combat-abilities-popup-content");
      const hintEl = document.getElementById("combat-abilities-popup-hint");
      if (!popup || !contentEl || !hintEl) return;
      contentEl.style.display = "none";
      hintEl.textContent = "Click an enemy to throw";
      hintEl.classList.add("visible");
      popup.classList.add("combat-abilities-popup-hint-only");
      requestAnimationFrame(() => positionPopupAtTop(popup));
    }

    function showSuppressTargetingHint(_user: Combatant) {
      const popup = document.getElementById("combat-abilities-popup");
      const contentEl = document.getElementById("combat-abilities-popup-content");
      const hintEl = document.getElementById("combat-abilities-popup-hint");
      if (!popup || !contentEl || !hintEl) return;
      contentEl.style.display = "none";
      hintEl.textContent = "Click an enemy to suppress";
      hintEl.classList.add("visible");
      popup.classList.add("combat-abilities-popup-hint-only");
      requestAnimationFrame(() => positionPopupAtTop(popup));
    }

    function showMedTargetingHint(_user: Combatant, medItem: SoldierMedItem) {
      const popup = document.getElementById("combat-abilities-popup");
      const contentEl = document.getElementById("combat-abilities-popup-content");
      const hintEl = document.getElementById("combat-abilities-popup-hint");
      if (!popup || !contentEl || !hintEl) return;
      contentEl.style.display = "none";
      hintEl.textContent = "Click ally to heal";
      hintEl.classList.add("visible");
      popup.classList.add("combat-abilities-popup-hint-only");
      requestAnimationFrame(() => positionPopupAtTop(popup));
    }

    let abilitiesPopupRefreshIntervalId: ReturnType<typeof setInterval> | null = null;

    function closeAbilitiesPopup() {
      if (abilitiesPopupRefreshIntervalId != null) {
        clearInterval(abilitiesPopupRefreshIntervalId);
        abilitiesPopupRefreshIntervalId = null;
      }
      grenadeTargetingMode = null;
      medTargetingMode = null;
      suppressTargetingMode = null;
      popupCombatantId = null;
      document.querySelectorAll(".combat-card-grenade-target").forEach((el) => el.classList.remove("combat-card-grenade-target"));
      document.querySelectorAll(".combat-card-heal-target").forEach((el) => el.classList.remove("combat-card-heal-target"));
      const popup = document.getElementById("combat-abilities-popup");
      if (popup) {
        popup.classList.remove("combat-abilities-popup-hint-only");
        popup.setAttribute("aria-hidden", "true");
      }
    }

    const BULLET_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3E%3Cellipse cx='4' cy='4' rx='3.2' ry='1.2' fill='%23ffcc44' stroke='%23fff' stroke-width='0.4'/%3E%3C/svg%3E";

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
      const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
      img.setAttribute("href", iconUrl);
      img.setAttribute("x", String(ax - size / 2));
      img.setAttribute("y", String(ay - size / 2));
      img.setAttribute("width", String(size));
      img.setAttribute("height", String(size));
      if (!isGrenade) img.setAttribute("transform", `rotate(${deg} ${ax} ${ay})`);
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
        if (!isGrenade) img.setAttribute("transform", `rotate(${deg} ${x} ${y})`);
        if (t < 1) requestAnimationFrame(tick);
        else img.remove();
      }
      requestAnimationFrame(tick);
    }

    function animateGrenadeProjectile(attackerCard: Element, targetCard: Element, iconUrl: string, durationMs: number) {
      animateProjectile(attackerCard, targetCard, iconUrl, durationMs, 28, true);
    }

    function executeMedicalUse(user: Combatant, target: Combatant, medItem: SoldierMedItem) {
      playerAbilitiesUsed.set(user.id, (playerAbilitiesUsed.get(user.id) ?? 0) + 1);
      const isStimPack = medItem.item.id === "stim_pack";
      usePlayerCompanyStore.getState().consumeSoldierMedical(user.id, medItem.inventoryIndex);
      medTargetingMode = null;
      document.querySelectorAll(".combat-card-heal-target").forEach((el) => el.classList.remove("combat-card-heal-target"));
      closeAbilitiesPopup();

      if (isStimPack) {
        const now = Date.now();
        const eff = medItem.item.effect as { duration?: number; effect_value?: number } | undefined;
        const durationSec = eff?.duration ?? 10;
        const multiplier = eff?.effect_value ?? 2 / 3;
        target.attackSpeedBuffUntil = now + durationSec * 1000;
        target.attackSpeedBuffMultiplier = multiplier;
        const oldDue = nextAttackAt.get(target.id) ?? now;
        const remaining = Math.max(0, oldDue - now);
        nextAttackAt.set(target.id, now + remaining * multiplier);
        const card = document.querySelector(`[data-combatant-id="${target.id}"]`);
        if (card) {
          const popup = document.createElement("span");
          popup.className = "combat-heal-popup";
          popup.textContent = "+50% SPD";
          card.appendChild(popup);
          setTimeout(() => popup.remove(), 1500);
        }
      } else {
        const isMedic = (user.designation ?? "").toLowerCase() === "medic";
        const baseHeal = (medItem.item as { effect?: { effect_value?: number } }).effect?.effect_value ?? 20;
        const healAmount = isMedic ? 50 : baseHeal;
        const newHp = Math.min(target.maxHp, Math.floor(target.hp) + healAmount);
        target.hp = newHp;
        if (target.downState === "incapacitated") delete target.downState;
        const card = document.querySelector(`[data-combatant-id="${target.id}"]`);
        if (card) {
          const popup = document.createElement("span");
          popup.className = "combat-heal-popup";
          popup.textContent = `+${healAmount}`;
          card.appendChild(popup);
          setTimeout(() => popup.remove(), 1500);
        }
        const all = [...players, ...enemies];
        for (const c of all) {
          const cardEl = document.querySelector(`[data-combatant-id="${c.id}"]`);
          if (!cardEl) continue;
          const pct = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));
          const hpBar = cardEl.querySelector(".combat-card-hp-bar") as HTMLElement;
          if (hpBar) hpBar.style.width = `${pct}%`;
          const hpValue = cardEl.querySelector(".combat-card-hp-value");
          if (hpValue) hpValue.textContent = `${Math.floor(c.hp)}/${Math.floor(c.maxHp)}`;
          const isDown = Boolean(c.hp <= 0 || c.downState);
          cardEl.classList.toggle("combat-card-down", isDown);
        }
      }
    }

    const SUPPRESS_DURATION_MS = 8000;
    const SUPPRESS_BURST_COUNT = 3;
    const SUPPRESS_BURST_INTERVAL_MS = 500;
    const ATTACK_PROJECTILE_MS = 220;

    const SUPPRESS_COOLDOWN_MS = 60_000;

    function executeSuppress(user: Combatant, target: Combatant) {
      playerAbilitiesUsed.set(user.id, (playerAbilitiesUsed.get(user.id) ?? 0) + 1);
      user.suppressCooldownUntil = Date.now() + SUPPRESS_COOLDOWN_MS;
      suppressTargetingMode = null;
      document.querySelectorAll("#combat-enemies-grid .combat-card-grenade-target").forEach((el) => el.classList.remove("combat-card-grenade-target"));
      closeAbilitiesPopup();

      const attackerCard = document.querySelector(`[data-combatant-id="${user.id}"]`);
      const targetCard = document.querySelector(`[data-combatant-id="${target.id}"]`);
      if (!attackerCard || !targetCard) return;

      let anyHit = false;
      const now = Date.now();

      const doBurst = (burstIndex: number) => {
        if (target.hp <= 0 || target.downState) return;
        const result = resolveAttack(user, target, now);
        if (result.hit && !result.evaded) anyHit = true;
        animateProjectile(attackerCard, targetCard, BULLET_ICON, ATTACK_PROJECTILE_MS, 10);
        if (result.damage > 0) {
          const popup = document.createElement("span");
          popup.className = "combat-damage-popup";
          popup.textContent = String(result.damage);
          targetCard.appendChild(popup);
          setTimeout(() => popup.remove(), 1500);
          targetCard.classList.add("combat-card-shake");
          setTimeout(() => targetCard.classList.remove("combat-card-shake"), 350);
        } else if (result.hit && result.evaded) {
          const popup = document.createElement("span");
          popup.className = "combat-evade-popup";
          popup.textContent = "Evade";
          targetCard.appendChild(popup);
          setTimeout(() => popup.remove(), 1500);
        } else if (!result.hit) {
          const popup = document.createElement("span");
          popup.className = "combat-miss-popup";
          popup.textContent = "MISS";
          targetCard.appendChild(popup);
          setTimeout(() => popup.remove(), 2200);
        }
        if (target.hp <= 0) {
          target.downState = target.side === "player" && Math.random() < 0.3 ? "incapacitated" : "kia";
        }
      };

      doBurst(0);
      setTimeout(() => doBurst(1), SUPPRESS_BURST_INTERVAL_MS);
      setTimeout(() => {
        doBurst(2);
        if (anyHit && target.hp > 0 && !target.downState) {
          const applyNow = Date.now();
          target.suppressedUntil = applyNow + SUPPRESS_DURATION_MS;
          const popup = document.createElement("span");
          popup.className = "combat-suppress-popup";
          popup.textContent = "Suppressed";
          targetCard.appendChild(popup);
          setTimeout(() => popup.remove(), 1500);
        }
        updateHpBarsAll();
        updateCombatUI();
      }, SUPPRESS_BURST_INTERVAL_MS * 2);
    }

    const GRENADE_COOLDOWN_MS = 5000;

    function executeGrenadeThrow(thrower: Combatant, target: Combatant, grenade: SoldierGrenade) {
      const isThrowingKnife = grenade.item.id === "tk21_throwing_knife";
      if (!isThrowingKnife) thrower.grenadeCooldownUntil = Date.now() + GRENADE_COOLDOWN_MS;
      const aliveEnemies = enemies.filter((e) => e.hp > 0 && !e.downState);
      const result = resolveGrenadeThrow(thrower, target, grenade.item, aliveEnemies);

      const throwerCard = document.querySelector(`[data-combatant-id="${thrower.id}"]`);
      const targetCard = document.querySelector(`[data-combatant-id="${target.id}"]`);

      if (throwerCard && targetCard) {
        const iconUrl = getItemIconUrl(grenade.item);
        animateGrenadeProjectile(throwerCard, targetCard, iconUrl, 350);
      }

      const showDamage = (id: string, damage: number) => {
        const card = document.querySelector(`[data-combatant-id="${id}"]`);
        if (card && damage > 0) {
          const popup = document.createElement("span");
          popup.className = "combat-damage-popup";
          popup.textContent = String(damage);
          card.appendChild(popup);
          setTimeout(() => popup.remove(), 1500);
          card.classList.add("combat-card-shake");
          setTimeout(() => card.classList.remove("combat-card-shake"), 350);
        }
      };

      const showEvaded = (id: string, isKnife: boolean) => {
        const card = document.querySelector(`[data-combatant-id="${id}"]`);
        if (!card) return;
        const popup = document.createElement("span");
        popup.className = "combat-throw-evaded-popup";
        popup.textContent = isKnife ? "Knife evaded" : "Grenade evaded";
        card.appendChild(popup);
        setTimeout(() => popup.remove(), 2200);
      };

      const showThrowMiss = (id: string, isKnife: boolean) => {
        const card = document.querySelector(`[data-combatant-id="${id}"]`);
        if (!card) return;
        const popup = document.createElement("span");
        popup.className = "combat-throw-miss-popup";
        popup.textContent = isKnife ? "Knife missed" : "Grenade missed";
        card.appendChild(popup);
        setTimeout(() => popup.remove(), 2200);
      };

      const showSmokeEffect = (id: string, pct: number) => {
        const card = document.querySelector(`[data-combatant-id="${id}"]`);
        if (card) {
          const popup = document.createElement("span");
          popup.className = "combat-smoke-popup";
          popup.textContent = `-${pct}%`;
          card.appendChild(popup);
          setTimeout(() => popup.remove(), 1500);
        }
      };

      type GrenadeOverlayType = "explosion" | "throwing-knife" | "stun" | "incendiary";
      const addGrenadeOverlay = (targetCard: Element, overlayType: GrenadeOverlayType) => {
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

      const updateHpBars = () => {
        const all = [...players, ...enemies];
        for (const c of all) {
          const card = document.querySelector(`[data-combatant-id="${c.id}"]`);
          if (!card) continue;
          const pct = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));
          const hpBar = card.querySelector(".combat-card-hp-bar") as HTMLElement;
          if (hpBar) hpBar.style.width = `${pct}%`;
          const hpValue = card.querySelector(".combat-card-hp-value");
          if (hpValue) hpValue.textContent = `${Math.floor(c.hp)}/${Math.floor(c.maxHp)}`;
          const isDown = Boolean(c.hp <= 0 || c.downState);
          card.classList.toggle("combat-card-down", isDown);
        }
      };

      setTimeout(() => {
        const isThrowingKnife = grenade.item.id === "tk21_throwing_knife";
        const isStun = (grenade.item.tags as string[] | undefined)?.includes("stun") || grenade.item.id === "m84_flashbang";
        const isIncendiary = grenade.item.id === "incendiary_grenade";
        const isFrag = (grenade.item.tags as string[] | undefined)?.includes("explosive");
        const overlayType: GrenadeOverlayType =
          isThrowingKnife ? "throwing-knife"
          : isStun ? "stun"
          : isIncendiary ? "incendiary"
          : "explosion";
        if (targetCard) addGrenadeOverlay(targetCard, overlayType);
        for (const s of result.splash) {
          if (!s.evaded && s.hit) {
            const splashCard = document.querySelector(`[data-combatant-id="${s.targetId}"]`);
            if (splashCard) addGrenadeOverlay(splashCard, overlayType);
          }
        }
        const flashHit = (id: string) => {
          const card = document.querySelector(`[data-combatant-id="${id}"]`);
          if (!card) return;
          if (isThrowingKnife) {
            card.classList.add("combat-card-knife-hit-flash");
            setTimeout(() => card.classList.remove("combat-card-knife-hit-flash"), 500);
          } else {
            card.classList.add("combat-card-grenade-hit-flash");
            setTimeout(() => card.classList.remove("combat-card-grenade-hit-flash"), 450);
          }
        };
        const shakeEnemy = (id: string) => {
          const c = allCombatants.find((x) => x.id === id);
          if (c?.side !== "enemy") return;
          const card = document.querySelector(`[data-combatant-id="${id}"]`);
          if (card) {
            card.classList.add("combat-card-shake");
            setTimeout(() => card.classList.remove("combat-card-shake"), 400);
          }
        };
        if (result.primary.hit && !result.primary.evaded) {
          flashHit(result.primary.targetId);
          shakeEnemy(result.primary.targetId);
        }
        for (const s of result.splash) {
          if (s.hit && !s.evaded) {
            flashHit(s.targetId);
            shakeEnemy(s.targetId);
          }
        }
        if (targetCard && isFrag && result.primary.damageDealt > 0) {
          targetCard.classList.add("combat-card-frag-flash");
          setTimeout(() => targetCard.classList.remove("combat-card-frag-flash"), 150);
        }
        const isSmoke = (grenade.item.tags as string[] | undefined)?.includes("smoke") || grenade.item.id === "mk18_smoke";
        if (!result.primary.hit) showThrowMiss(result.primary.targetId, isThrowingKnife);
        else if (result.primary.evaded) showEvaded(result.primary.targetId, isThrowingKnife);
        else if (isSmoke && result.primary.hit) showSmokeEffect(result.primary.targetId, 40);
        else if (result.primary.damageDealt > 0) showDamage(result.primary.targetId, result.primary.damageDealt);
        for (const s of result.splash) {
          if (s.evaded) showEvaded(s.targetId, isThrowingKnife);
          else if (isSmoke && s.hit) showSmokeEffect(s.targetId, 10);
          else if (s.damageDealt > 0) showDamage(s.targetId, s.damageDealt);
        }
        usePlayerCompanyStore.getState().consumeSoldierThrowable(thrower.id, grenade.inventoryIndex);
        grenadeTargetingMode = null;
        document.querySelectorAll(".combat-card-grenade-target").forEach((el) => el.classList.remove("combat-card-grenade-target"));
        closeAbilitiesPopup();
        updateHpBars();

        let killsFromGrenade = 0;
        if (result.primary.targetDown) killsFromGrenade++;
        for (const s of result.splash) {
          if (s.targetDown) killsFromGrenade++;
        }
        playerAbilitiesUsed.set(thrower.id, (playerAbilitiesUsed.get(thrower.id) ?? 0) + 1);
        if (killsFromGrenade > 0) {
          playerKills.set(thrower.id, (playerKills.get(thrower.id) ?? 0) + killsFromGrenade);
        }
        const grenadeDmg = result.primary.damageDealt + result.splash.reduce((a, s) => a + s.damageDealt, 0);
        if (grenadeDmg > 0) {
          playerDamage.set(thrower.id, (playerDamage.get(thrower.id) ?? 0) + grenadeDmg);
        }
      }, 400);
    }

    const allCombatants = [...players, ...enemies];

    const LINE_OFFSET_PX = 3; /* 2 × 3 = 6px between parallel lines for mutual fire */

    function drawAttackLines() {
      const battleArea = document.querySelector("#combat-battle-area");
      const linesG = document.querySelector("#combat-attack-lines-g");
      if (!battleArea || !linesG) return;
      linesG.innerHTML = "";
      const areaRect = battleArea.getBoundingClientRect();
      const toArea = (r: DOMRect) => ({
        left: r.left - areaRect.left,
        top: r.top - areaRect.top,
        right: r.right - areaRect.left,
        bottom: r.bottom - areaRect.top,
        width: r.width,
        height: r.height,
      });
      const getTopCenter = (id: string) => {
        const card = document.querySelector(`[data-combatant-id="${id}"]`);
        if (!card) return null;
        const r = toArea(card.getBoundingClientRect());
        return { x: (r.left + r.right) / 2, y: r.top };
      };
      const getBottomCenter = (id: string) => {
        const card = document.querySelector(`[data-combatant-id="${id}"]`);
        if (!card) return null;
        const r = toArea(card.getBoundingClientRect());
        return { x: (r.left + r.right) / 2, y: r.bottom };
      };
      const getCombatant = (id: string) => allCombatants.find((c) => c.id === id);
      const isAlive = (c: Combatant) => c.hp > 0 && !c.downState;
      const isSupport = (c: Combatant) => (c.designation ?? "").toLowerCase() === "support";

      const segments: { attackerId: string; targetId: string; attackerSide: "player" | "enemy" }[] = [];
      for (const [attackerId, targetId] of targets) {
        const attacker = getCombatant(attackerId);
        const target = getCombatant(targetId);
        if (!attacker || !target || !isAlive(attacker) || !isAlive(target)) continue;
        segments.push({
          attackerId,
          targetId,
          attackerSide: attacker.side,
        });
      }

      const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
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
        const ac = attacker?.side === "player"
          ? getTopCenter(s.attackerId)
          : getBottomCenter(s.attackerId);
        const tc = target?.side === "player"
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
        const offset = mutualCount > 1 ? (myIdx === 0 ? -LINE_OFFSET_PX : LINE_OFFSET_PX) : 0;
        const x1 = ac.x + perpX * offset;
        const y1 = ac.y + perpY * offset;
        const x2 = tc.x + perpX * offset;
        const y2 = tc.y + perpY * offset;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(x1));
        line.setAttribute("y1", String(y1));
        line.setAttribute("x2", String(x2));
        line.setAttribute("y2", String(y2));
        const isPlayer = s.attackerSide === "player";
        line.setAttribute("stroke", isPlayer ? "rgba(100, 200, 100, 0.6)" : "rgba(220, 80, 80, 0.6)");
        line.setAttribute("stroke-width", isSupport(attacker) ? "3" : "1");
        if (!isSupport(attacker)) line.setAttribute("stroke-dasharray", "4 6");
        line.setAttribute("marker-end", isPlayer ? "url(#combat-arrow-player)" : "url(#combat-arrow-enemy)");
        line.setAttribute("stroke-linecap", "round");
        linesG.appendChild(line);
      }
    }

    function updateHpBarsAll() {
      for (const c of [...players, ...enemies]) {
        const card = document.querySelector(`[data-combatant-id="${c.id}"]`);
        if (!card) continue;
        const pct = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));
        const hpBar = card.querySelector(".combat-card-hp-bar") as HTMLElement;
        if (hpBar) hpBar.style.width = `${pct}%`;
        const hpValue = card.querySelector(".combat-card-hp-value");
        if (hpValue) hpValue.textContent = `${Math.floor(c.hp)}/${Math.floor(c.maxHp)}`;
        const isDown = Boolean(c.hp <= 0 || c.downState);
        card.classList.toggle("combat-card-down", isDown);
      }
    }

    function updateCombatUI() {
      const now = Date.now();
      updateHpBarsAll();
      const popup = document.getElementById("combat-abilities-popup");
      if (popup?.getAttribute("aria-hidden") !== "true" && popupCombatantId) {
        const c = players.find((p) => p.id === popupCombatantId);
        if (c && (c.hp <= 0 || c.downState)) closeAbilitiesPopup();
      }
      for (const c of [...players, ...enemies]) {
        const card = document.querySelector(`[data-combatant-id="${c.id}"]`);
        if (!card) continue;
        const inCover = isInCover(c, now);
        const smoked = c.smokedUntil != null && now < c.smokedUntil;
        const stunned = c.stunUntil != null && now < c.stunUntil;
        const panicked = c.panicUntil != null && now < c.panicUntil;
        const burning = c.burningUntil != null && now < c.burningUntil;
        const stimmed = c.attackSpeedBuffUntil != null && now < c.attackSpeedBuffUntil;
        const blinded = c.blindedUntil != null && now < c.blindedUntil;
        const suppressed = c.suppressedUntil != null && now < c.suppressedUntil;
        card.classList.toggle("combat-card-in-cover", inCover);
        card.classList.toggle("combat-card-smoked", smoked);
        card.classList.toggle("combat-card-stunned", stunned);
        card.classList.toggle("combat-card-panicked", panicked);
        card.classList.toggle("combat-card-burning", burning);
        card.classList.toggle("combat-card-stimmed", stimmed);
        card.classList.toggle("combat-card-blinded", blinded);
        card.classList.toggle("combat-card-suppressed", suppressed);
        if (smoked) {
          let timerEl = card.querySelector(".combat-card-smoke-timer") as HTMLElement;
          if (!timerEl) {
            timerEl = document.createElement("span");
            timerEl.className = "combat-card-smoke-timer";
            card.appendChild(timerEl);
          }
          const remaining = (c.smokedUntil ?? 0) - now;
          timerEl.textContent = (remaining / 1000).toFixed(1);
        } else {
          card.querySelector(".combat-card-smoke-timer")?.remove();
        }
        if (stunned) {
          let timerEl = card.querySelector(".combat-card-stun-timer") as HTMLElement;
          if (!timerEl) {
            timerEl = document.createElement("span");
            timerEl.className = "combat-card-stun-timer";
            card.appendChild(timerEl);
          }
          const remaining = (c.stunUntil ?? 0) - now;
          timerEl.textContent = (remaining / 1000).toFixed(1);
        } else {
          card.querySelector(".combat-card-stun-timer")?.remove();
        }
        if (burning) {
          let timerEl = card.querySelector(".combat-card-burn-timer") as HTMLElement;
          if (!timerEl) {
            timerEl = document.createElement("span");
            timerEl.className = "combat-card-burn-timer";
            card.appendChild(timerEl);
          }
          const remaining = (c.burningUntil ?? 0) - now;
          timerEl.textContent = (remaining / 1000).toFixed(1);
          let flameEl = card.querySelector(".combat-card-burn-flame") as HTMLElement;
          if (!flameEl) {
            flameEl = document.createElement("div");
            flameEl.className = "combat-card-burn-flame";
            const img = document.createElement("img");
            img.src = FLAME_ICON;
            img.alt = "Burning";
            flameEl.appendChild(img);
            card.querySelector(".combat-card-avatar-wrap")?.appendChild(flameEl);
          }
        } else {
          card.querySelector(".combat-card-burn-timer")?.remove();
          card.querySelector(".combat-card-burn-flame")?.remove();
        }
        if (stimmed) {
          let timerEl = card.querySelector(".combat-card-stim-timer") as HTMLElement;
          const avatarWrap = card.querySelector(".combat-card-avatar-wrap");
          if (!timerEl && avatarWrap) {
            timerEl = document.createElement("span");
            timerEl.className = "combat-card-stim-timer";
            avatarWrap.appendChild(timerEl);
          }
          if (timerEl) {
            const remaining = (c.attackSpeedBuffUntil ?? 0) - now;
            timerEl.textContent = (remaining / 1000).toFixed(1);
          }
        } else {
          card.querySelector(".combat-card-stim-timer")?.remove();
        }
        if (blinded) {
          let timerEl = card.querySelector(".combat-card-blind-timer") as HTMLElement;
          if (!timerEl) {
            timerEl = document.createElement("span");
            timerEl.className = "combat-card-blind-timer";
            card.appendChild(timerEl);
          }
          const remaining = (c.blindedUntil ?? 0) - now;
          timerEl.textContent = (remaining / 1000).toFixed(1);
        } else {
          card.querySelector(".combat-card-blind-timer")?.remove();
        }
        if (suppressed) {
          let arrowWrap = card.querySelector(".combat-card-suppress-arrow-wrap") as HTMLElement;
          const avatarWrap = card.querySelector(".combat-card-avatar-wrap");
          if (!arrowWrap && avatarWrap) {
            arrowWrap = document.createElement("div");
            arrowWrap.className = "combat-card-suppress-arrow-wrap";
            const arrow = document.createElement("div");
            arrow.className = "combat-card-suppress-arrow";
            arrow.innerHTML = "▼";
            arrowWrap.appendChild(arrow);
            card.insertBefore(arrowWrap, card.firstChild);
          }
          let timerEl = card.querySelector(".combat-card-suppress-timer") as HTMLElement;
          if (!timerEl) {
            timerEl = document.createElement("span");
            timerEl.className = "combat-card-suppress-timer";
            card.appendChild(timerEl);
          }
          const remaining = (c.suppressedUntil ?? 0) - now;
          timerEl.textContent = (remaining / 1000).toFixed(1);
        } else {
          card.querySelector(".combat-card-suppress-arrow-wrap")?.remove();
          card.querySelector(".combat-card-suppress-timer")?.remove();
        }
        const baseInterval = c.attackIntervalMs ?? 1500;
        let speedMult = 1;
        if (stimmed && c.attackSpeedBuffMultiplier != null) speedMult *= c.attackSpeedBuffMultiplier;
        if (panicked) speedMult *= 2;
        const effectiveInterval = baseInterval * speedMult;
        const spdBadge = card.querySelector(".combat-card-spd-badge");
        if (spdBadge && baseInterval > 0) {
          spdBadge.textContent = `SPD: ${(effectiveInterval / 1000).toFixed(1)}s`;
          spdBadge.classList.toggle("combat-card-spd-buffed", stimmed);
        }
        let shieldWrap = card.querySelector(".combat-card-cover-shield");
        if (inCover) {
          if (!shieldWrap) {
            shieldWrap = document.createElement("div");
            shieldWrap.className = "combat-card-cover-shield";
            const img = document.createElement("img");
            img.src = SHIELD_ICON;
            img.alt = "";
            shieldWrap.appendChild(img);
            card.querySelector(".combat-card-avatar-wrap")?.appendChild(shieldWrap);
          }
          let timerEl = card.querySelector(".combat-card-cover-timer") as HTMLElement;
          if (!timerEl) {
            timerEl = document.createElement("span");
            timerEl.className = "combat-card-cover-timer";
            card.appendChild(timerEl);
          }
          const remaining = (c.takeCoverUntil ?? 0) - now;
          timerEl.textContent = (remaining / 1000).toFixed(1);
          timerEl.style.opacity = "1";
        } else {
          shieldWrap?.remove();
          const timerEl = card.querySelector(".combat-card-cover-timer") as HTMLElement;
          if (timerEl) {
            timerEl.textContent = "0";
            timerEl.style.animation = "combat-timer-fade 0.45s ease-out forwards";
            setTimeout(() => timerEl.remove(), 450);
          }
        }
      }
      drawAttackLines();
    }

    let combatTickId: number | null = null;
    const lastBurnTickTimeRef = { current: 0 };
    function startCombatLoop() {
      const now = Date.now();
      lastBurnTickTimeRef.current = now;
      for (const c of [...players, ...enemies]) {
        if (c.hp > 0 && !c.downState) nextAttackAt.set(c.id, now + Math.random() * 500);
      }
      function tick() {
        const now = Date.now();
        const burnEvents = applyBurnTicks([...players, ...enemies], now, lastBurnTickTimeRef);
        for (const ev of burnEvents) {
          const card = document.querySelector(`[data-combatant-id="${ev.targetId}"]`);
          if (card) {
            const popup = document.createElement("span");
            popup.className = "combat-damage-popup combat-burn-popup";
            popup.textContent = String(ev.damage);
            card.appendChild(popup);
            setTimeout(() => popup.remove(), 1500);
          }
        }
        clearExpiredEffects([...players, ...enemies], now);
        assignTargets(players, enemies, targets, now);
        combatWinner = players.every((p) => p.hp <= 0 || p.downState) ? "enemy" : enemies.every((e) => e.hp <= 0 || e.downState) ? "player" : null;
        if (combatWinner) {
          updateCombatUI();
          const victory = combatWinner === "player";
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
            const kiaIds = players.filter((p) => p.downState === "kia").map((p) => p.id);
            const missionName = mission?.name ?? "Unknown";
            const kiaKilledBy = new Map<string, string>();
            for (const p of players) {
              if (p.downState === "kia" && p.killedBy) kiaKilledBy.set(p.id, p.killedBy);
            }
            usePlayerCompanyStore.getState().processCombatKIA(kiaIds, missionName, playerKills, kiaKilledBy);
            const survivorIds = players.filter((p) => !kiaIds.includes(p.id)).map((p) => p.id);
            const store = usePlayerCompanyStore.getState();
            const oldLevels = new Map(store.company?.soldiers?.filter((s) => survivorIds.includes(s.id)).map((s) => [s.id, s.level ?? 1]) ?? []);
            store.grantSoldierCombatXP(survivorIds, playerDamage, playerDamageTaken, playerKills, playerAbilitiesUsed, victory);
            store.syncCombatHpToSoldiers(players.map((p) => ({ id: p.id, hp: p.maxHp })));
            const newLevels = new Map(usePlayerCompanyStore.getState().company?.soldiers?.filter((s) => survivorIds.includes(s.id)).map((s) => [s.id, s.level ?? 1]) ?? []);
            let leveledUpCount = 0;
            for (const id of survivorIds) {
              if ((newLevels.get(id) ?? 1) > (oldLevels.get(id) ?? 1)) leveledUpCount++;
            }
            const summaryData = buildCombatSummaryData(victory, mission, players, playerKills, leveledUpCount);
            const container = document.getElementById("combat-summary-container");
            if (container) {
              container.innerHTML = combatSummaryTemplate(summaryData);
              const overlay = container.querySelector(".combat-summary-overlay") as HTMLElement;
              if (overlay) overlay.classList.add("combat-summary-visible");
            }
          };
          if (victory) {
            window.setTimeout(showSummary, 2000);
          } else {
            showSummary();
          }
          return;
        }
        const all = [...players, ...enemies];
        let nextDue = Infinity;
        let didAttack = false;
        for (const c of all) {
          if (c.hp <= 0 || c.downState || isInCover(c, now) || isStunned(c, now)) continue;
          const due = nextAttackAt.get(c.id) ?? now;
          if (!didAttack && due <= now) {
            const targetId = targets.get(c.id);
            const target = all.find((x) => x.id === targetId);
            if (target && target.hp > 0 && !target.downState) {
              const result = resolveAttack(c, target, now);
              if (c.side === "player") {
                if (target.side === "enemy" && (target.hp <= 0 || target.downState === "kia")) {
                  playerKills.set(c.id, (playerKills.get(c.id) ?? 0) + 1);
                }
                if (result.damage > 0) {
                  playerDamage.set(c.id, (playerDamage.get(c.id) ?? 0) + result.damage);
                }
              }
              if (target.side === "player" && result.damage > 0) {
                playerDamageTaken.set(target.id, (playerDamageTaken.get(target.id) ?? 0) + result.damage);
              }
              nextAttackAt.set(c.id, getNextAttackAt(c, now));
              const attackerCard = document.querySelector(`[data-combatant-id="${c.id}"]`);
              const targetCard = document.querySelector(`[data-combatant-id="${result.targetId}"]`);
              const ATTACK_PROJECTILE_MS = 220;
              if (attackerCard && targetCard) {
                animateProjectile(attackerCard, targetCard, BULLET_ICON, ATTACK_PROJECTILE_MS, 10);
              }
              const showAttackResult = () => {
                if (!targetCard) return;
                if (!result.hit) {
                  const popup = document.createElement("span");
                  popup.className = "combat-miss-popup";
                  popup.textContent = "MISS";
                  targetCard.appendChild(popup);
                  setTimeout(() => popup.remove(), 2200);
                } else if (result.evaded) {
                  const popup = document.createElement("span");
                  popup.className = "combat-evade-popup";
                  popup.textContent = "Evade";
                  targetCard.appendChild(popup);
                  setTimeout(() => popup.remove(), 2200);
                } else if (result.damage > 0) {
                  const popup = document.createElement("span");
                  popup.className = "combat-damage-popup";
                  popup.textContent = String(result.damage);
                  targetCard.appendChild(popup);
                  setTimeout(() => popup.remove(), 1500);
                  targetCard.classList.add("combat-card-shake");
                  setTimeout(() => targetCard.classList.remove("combat-card-shake"), 350);
                  targetCard.classList.add("combat-card-weapon-hit-flash");
                  setTimeout(() => targetCard.classList.remove("combat-card-weapon-hit-flash"), 200);
                }
              };
              setTimeout(showAttackResult, ATTACK_PROJECTILE_MS - 20);
              didAttack = true;
            }
          }
          const due2 = nextAttackAt.get(c.id) ?? now;
          if (due2 < nextDue) nextDue = due2;
        }
        updateCombatUI();
        if (!combatWinner) combatTickId = window.setTimeout(tick, Math.min(50, Math.max(0, nextDue - now)));
      }
      combatTickId = window.setTimeout(tick, 50);
    }

    return [
      {
        selector: DOM.combat.abilitiesPopup,
        eventType: "click",
        callback: (e: Event) => {
          const t = e.target as HTMLElement;
          const grenadeBtn = t.closest(".combat-grenade-item");
          const medBtn = t.closest(".combat-med-item");
          const abilityBtn = t.closest(".combat-ability-icon-slot");
          if (medBtn && !(medBtn as HTMLButtonElement).disabled) {
            e.stopPropagation();
            const soldierId = (medBtn as HTMLElement).dataset.soldierId;
            const idxStr = (medBtn as HTMLElement).dataset.inventoryIndex;
            if (!soldierId || idxStr == null) return;
            const inventoryIndex = parseInt(idxStr, 10);
            const user = players.find((p) => p.id === soldierId);
            if (!user || user.hp <= 0 || user.downState) return;
            const soldier = getSoldierFromStore(soldierId);
            const medItemsList = soldier ? getSoldierMedItems(soldier.inventory) : [];
            const m = medItemsList.find((mr) => mr.inventoryIndex === inventoryIndex);
            if (!m) return;
            const isMedic = (user.designation ?? "").toLowerCase() === "medic";
            const isStimPack = m.item.id === "stim_pack";
            if (isStimPack && !isMedic) {
              executeMedicalUse(user, user, m);
              return;
            }
            medTargetingMode = { user, medItem: m };
            showMedTargetingHint(user, m);
            document.querySelectorAll("#combat-players-grid .combat-card:not(.combat-card-down)").forEach((card) => {
              card.classList.add("combat-card-heal-target");
            });
            return;
          }
          if (grenadeBtn && !(grenadeBtn as HTMLButtonElement).disabled) {
            e.stopPropagation();
            const soldierId = (grenadeBtn as HTMLElement).dataset.soldierId;
            const idxStr = (grenadeBtn as HTMLElement).dataset.inventoryIndex;
            if (!soldierId || idxStr == null) return;
            const inventoryIndex = parseInt(idxStr, 10);
            const thrower = players.find((p) => p.id === soldierId);
            if (!thrower || thrower.hp <= 0 || thrower.downState) return;
            const soldier = getSoldierFromStore(soldierId);
            const grenades = soldier ? getSoldierGrenades(soldier.inventory) : [];
            const g = grenades.find((gr) => gr.inventoryIndex === inventoryIndex);
            if (!g) return;
            const isKnife = g.item.id === "tk21_throwing_knife";
            const grenadeOnCooldown = !isKnife && (thrower.grenadeCooldownUntil ?? 0) > Date.now();
            if (grenadeOnCooldown) return;
            grenadeTargetingMode = { thrower, grenade: g };
            showGrenadeTargetingHint(thrower, g);
            document.querySelectorAll("#combat-enemies-grid .combat-card:not(.combat-card-down)").forEach((card) => {
              card.classList.add("combat-card-grenade-target");
            });
            return;
          }
          if (abilityBtn?.classList.contains("combat-ability-take-cover-wrap") && !(abilityBtn as HTMLButtonElement).disabled) {
            e.stopPropagation();
            const soldierId = (abilityBtn as HTMLElement).dataset.soldierId;
            if (!soldierId) return;
            const combatant = players.find((p) => p.id === soldierId);
            if (!combatant || combatant.takeCoverUsed || combatant.hp <= 0 || combatant.downState) return;
            playerAbilitiesUsed.set(combatant.id, (playerAbilitiesUsed.get(combatant.id) ?? 0) + 1);
            const now = Date.now();
            combatant.takeCoverUntil = now + TAKE_COVER_DURATION_MS;
            combatant.takeCoverUsed = true;
            removeTargetsForCombatantInCover(targets, combatant.id);
            closeAbilitiesPopup();
            updateCombatUI();
            return;
          }
          if (abilityBtn?.classList.contains("combat-ability-suppress-wrap") && !(abilityBtn as HTMLButtonElement).disabled) {
            e.stopPropagation();
            const soldierId = (abilityBtn as HTMLElement).dataset.soldierId;
            if (!soldierId) return;
            const combatant = players.find((p) => p.id === soldierId);
            const onCooldown = combatant && (combatant.suppressCooldownUntil ?? 0) > Date.now();
            if (!combatant || combatant.hp <= 0 || combatant.downState || onCooldown) return;
            suppressTargetingMode = { user: combatant };
            showSuppressTargetingHint(combatant);
            document.querySelectorAll("#combat-enemies-grid .combat-card:not(.combat-card-down)").forEach((card) => {
              card.classList.add("combat-card-grenade-target");
            });
            return;
          }
        },
      },
      {
        selector: DOM.combat.battleArea,
        eventType: "click",
        callback: (e: Event) => {
          const popup = document.getElementById("combat-abilities-popup");
          const target = e.target as HTMLElement;
          if (popup?.contains(target)) return;
          if (target.closest(".combat-card")) return;
          closeAbilitiesPopup();
        },
      },
      {
        selector: "#combat-screen",
        eventType: "click",
        callback: (e: Event) => {
          const popup = document.getElementById("combat-abilities-popup");
          if (popup?.getAttribute("aria-hidden") === "true") return;
          const target = e.target as HTMLElement;
          if (popup?.contains(target)) return;
          if (target.closest(".combat-card")) return;
          closeAbilitiesPopup();
        },
      },
      {
        selector: ".combat-card",
        eventType: "click",
        callback: (e: Event) => {
          e.stopPropagation();
          if (medTargetingMode) {
            const card = (e.currentTarget as HTMLElement).closest(".combat-card") as HTMLElement | null;
            if (!card || card.dataset.side !== "player" || card.classList.contains("combat-card-down")) return;
            const targetId = card.dataset.combatantId;
            if (!targetId) return;
            const target = players.find((c) => c.id === targetId);
            if (!target || target.hp <= 0 || target.downState) return;
            executeMedicalUse(medTargetingMode.user, target, medTargetingMode.medItem);
            return;
          }
          if (suppressTargetingMode) {
            const card = (e.currentTarget as HTMLElement).closest(".combat-card") as HTMLElement | null;
            if (!card || card.dataset.side !== "enemy" || card.classList.contains("combat-card-down")) return;
            const targetId = card.dataset.combatantId;
            if (!targetId) return;
            const target = enemies.find((c) => c.id === targetId);
            if (!target || target.hp <= 0 || target.downState) return;
            executeSuppress(suppressTargetingMode.user, target);
            return;
          }
          if (grenadeTargetingMode) {
            const card = (e.currentTarget as HTMLElement).closest(".combat-card") as HTMLElement | null;
            if (!card || card.dataset.side !== "enemy" || card.classList.contains("combat-card-down")) return;
            const targetId = card.dataset.combatantId;
            if (!targetId) return;
            const target = enemies.find((c) => c.id === targetId);
            if (!target || target.hp <= 0 || target.downState) return;
            executeGrenadeThrow(grenadeTargetingMode.thrower, target, grenadeTargetingMode.grenade);
            return;
          }

          const card = (e.currentTarget as HTMLElement).closest(".combat-card") as HTMLElement | null;
          if (!card || card.classList.contains("combat-card-down")) return;
          const id = card.dataset.combatantId;
          if (!id) return;
          const combatant = allCombatants.find((c) => c.id === id);
          if (combatant?.side !== "player" || combatWinner) return;
          openAbilitiesPopup(combatant, card);
        },
      },
      {
        selector: DOM.combat.beginBtn,
        eventType: "click",
        callback: () => {
          combatStarted = true;
          const btn = s_(DOM.combat.beginBtn) as HTMLButtonElement | null;
          if (btn) btn.setAttribute("hidden", "");
          startCombatLoop();
        },
      },
      {
        selector: DOM.combat.resetBtn,
        eventType: "click",
        callback: () => {
          if (combatTickId != null) {
            clearTimeout(combatTickId);
            combatTickId = null;
          }
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
          UiManager.renderCombatScreen(mission);
        },
      },
      {
        selector: DOM.combat.missionDetailsBtn,
        eventType: "click",
        callback: () => {
          const screen = document.getElementById("combat-screen");
          const missionJson = screen?.getAttribute("data-mission-json");
          const popup = document.getElementById("combat-mission-details-popup");
          const titleEl = document.getElementById("combat-mission-details-title");
          const bodyEl = document.getElementById("combat-mission-details-body");
          if (!popup || !titleEl || !bodyEl) return;
          if (missionJson) {
            try {
              const m = JSON.parse(missionJson.replace(/&quot;/g, '"')) as Mission;
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
          const target = (e.target as HTMLElement).closest("#combat-summary-return");
          if (!target) return;
          e.stopPropagation();
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
          const victory = combatWinner === "player";
          const store = usePlayerCompanyStore.getState();
          store.grantMissionRewards(mission, victory);
          store.syncCombatHpToSoldiers(players.map((p) => ({ id: p.id, hp: p.maxHp })));
          if (combatTickId != null) {
            clearTimeout(combatTickId);
            combatTickId = null;
          }
          closeAbilitiesPopup();
          UiManager.renderMissionsScreen();
        },
      },
    ];
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
    const filtered = armory
      .map((item, idx) => ({ item, armoryIndex: idx }))
      .filter(({ item }) => {
        if (!itemFitsSlot(item, slotType)) return false;
        if (!canEquipItemLevel(item, soldier)) return false;
        if (slotType === "weapon" && !weaponWieldOk(item, soldier)) return false;
        return true;
      });
    const grid = document.getElementById("equip-supplies-grid");
    const popup = document.getElementById("equip-supplies-popup");
    const titleEl = document.getElementById("equip-supplies-title");
    if (!grid || !popup) return;
    const titleByType = { weapon: "Weapons", armor: "Armor", equipment: "Supplies" };
    if (titleEl) titleEl.textContent = titleByType[slotType] ?? "Armory";
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    grid.innerHTML = filtered.length === 0
      ? '<div class="equip-supplies-empty">No items in armory for this slot.</div>'
      : filtered
          .map(
            ({ item, armoryIndex }) => {
              const iconUrl = getItemIconUrl(item);
              const uses = item.uses ?? item.quantity;
              const level = item.level ?? 1;
              const rarity = item.rarity ?? "common";
              const json = JSON.stringify(item).replace(/"/g, "&quot;");
              return `
<button type="button" class="equip-supplies-item equip-slot equip-slot-filled${rarity !== "common" ? ` rarity-${rarity}` : ""}" data-armory-index="${armoryIndex}" data-item-json="${json}" title="${esc(item.name ?? "")}">
  <div class="equip-slot-inner">
    <img src="${iconUrl}" alt="${item.name}" width="48" height="48">
    <span class="equip-slot-level rarity-${rarity}">Lv${level}</span>
    ${uses != null ? `<span class="equip-slot-uses-badge">×${uses}</span>` : ""}
  </div>
</button>`;
            },
          )
          .join("");
    (picker as HTMLElement).dataset.suppliesTargetSoldierId = soldierId;
    (picker as HTMLElement).dataset.suppliesTargetSlotType = slotType;
    (picker as HTMLElement).dataset.suppliesTargetEqIndex = String(eqIndex);
    popup.removeAttribute("hidden");
  }

  const equipPickerEventConfig: HandlerInitConfig[] = [
    {
      selector: "#equip-picker-close",
      eventType: "click",
      callback: () => {
        const picker = document.getElementById("equip-picker-popup");
        if (!picker) return;
        const supplies = document.getElementById("equip-supplies-popup");
        if (supplies) supplies.setAttribute("hidden", "");
        picker.querySelectorAll(".equip-slot-unequip-wrap").forEach((el) => el.remove());
        const openedFrom = (picker as HTMLElement).dataset.openedFrom;
        picker.setAttribute("hidden", "");
        if (openedFrom === "roster") UiManager.renderRosterScreen();
      },
    },
    {
      selector: "#equip-supplies-close",
      eventType: "click",
      callback: () => {
        const supplies = document.getElementById("equip-supplies-popup");
        if (supplies) supplies.setAttribute("hidden", "");
        document.querySelectorAll(".equip-slot").forEach((el) => el.classList.remove("equip-slot-selected", "equip-slot-highlight"));
      },
    },
    {
      selector: "#equip-picker-popup",
      eventType: "click",
      callback: (e: Event) => {
        const target = e.target as HTMLElement;
        const picker = document.getElementById("equip-picker-popup");
        if (!picker || picker.hasAttribute("hidden")) return;
        if (target.closest("#equip-picker-close")) return;
        if (target.closest("#equip-supplies-close")) return;

        const unequipPopBtn = target.closest(".equip-slot-unequip-btn");
        if (unequipPopBtn) {
          const btn = unequipPopBtn as HTMLElement;
          const soldierId = btn.dataset.unequipSoldierId;
          const slotType = btn.dataset.unequipSlotType as "weapon" | "armor" | "equipment";
          const eqIdxStr = btn.dataset.unequipEqIndex;
          if (soldierId && slotType) {
            const eqIndex = slotType === "equipment" && eqIdxStr != null ? parseInt(eqIdxStr, 10) : 0;
            const result = usePlayerCompanyStore.getState().unequipItemToArmory(soldierId, slotType, slotType === "equipment" ? eqIndex : undefined);
            if (result.success) {
              btn.closest(".equip-slot-unequip-wrap")?.remove();
              document.querySelectorAll(".equip-slot").forEach((el) => el.classList.remove("equip-slot-selected", "equip-slot-highlight"));
              UiManager.refreshEquipPickerContent?.();
              openAvailableSuppliesPopup(picker as HTMLElement, soldierId, slotType, eqIndex);
            }
          }
          return;
        }

        /* Dismiss unequip only when clicking outside equip slots; slot clicks handle swap/select themselves */
        const existingUnequip = picker.querySelector(".equip-slot-unequip-wrap");
        if (existingUnequip && !target.closest(".equip-slot-unequip-wrap") && !target.closest(".equip-slot")) {
          existingUnequip.remove();
          document.querySelectorAll(".equip-slot").forEach((el) => el.classList.remove("equip-slot-selected", "equip-slot-highlight"));
        }

        const suppliesItem = target.closest(".equip-supplies-item") as HTMLElement | null;
        if (suppliesItem) {
          const soldierId = (picker as HTMLElement).dataset.suppliesTargetSoldierId;
          const slotType = (picker as HTMLElement).dataset.suppliesTargetSlotType as "weapon" | "armor" | "equipment";
          const eqIdxStr = (picker as HTMLElement).dataset.suppliesTargetEqIndex;
          const armoryIdxStr = suppliesItem.dataset.armoryIndex;
          const itemJson = suppliesItem.dataset.itemJson;
          if (soldierId && slotType && eqIdxStr != null && armoryIdxStr != null && itemJson) {
            const eqIndex = parseInt(eqIdxStr, 10);
            const slotSelector = `.equip-slot[data-soldier-id="${soldierId}"][data-slot-type="${slotType}"]${slotType === "equipment" ? `[data-eq-index="${eqIndex}"]` : ""}`;
            const slotEl = picker.querySelector(slotSelector) as HTMLElement | null;
            const item = JSON.parse(itemJson.replace(/&quot;/g, '"'));
            const armoryIndex = parseInt(armoryIdxStr, 10);
            const slot = slotType === "equipment" ? "equipment" : slotType;

            const runEquipAndRefresh = () => {
              const result = usePlayerCompanyStore.getState().equipItemToSoldier(soldierId!, slot, item, {
                fromArmoryIndex: armoryIndex,
                equipmentIndex: slotType === "equipment" ? eqIndex : undefined,
              });
              if (result.success) {
                UiManager.refreshEquipPickerContent?.();
                openAvailableSuppliesPopup(picker as HTMLElement, soldierId!, slotType, eqIndex);
                requestAnimationFrame(() => {
                  const newSlot = picker.querySelector(slotSelector) as HTMLElement | null;
                  if (newSlot) {
                    newSlot.classList.add("equip-slot-plop");
                    setTimeout(() => newSlot.classList.remove("equip-slot-plop"), 450);
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
              clone.animate(
                [
                  { transform: "translate(0, 0) scale(1)" },
                  { transform: `translate(${dx}px, ${dy}px) scale(1.15)` },
                ],
                { duration: 280, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" },
              ).finished.then(() => {
                clone.remove();
                runEquipAndRefresh();
              });
            } else {
              runEquipAndRefresh();
            }
          }
          return;
        }

        const unequipBtn = target.closest(".equip-unequip-all-btn") as HTMLElement | null;
        if (unequipBtn) {
          const soldierId = unequipBtn.dataset.soldierId;
          if (soldierId) {
            const store = usePlayerCompanyStore.getState();
            const slots: { type: "weapon" | "armor" | "equipment"; eqIndex?: number }[] = [
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

        /* Close supplies popup when clicking outside movable items (slots, armory items) */
        if (
          !target.closest(".equip-slot") &&
          !target.closest(".equip-supplies-item") &&
          !target.closest(".equip-slot-unequip-wrap")
        ) {
          const supplies = document.getElementById("equip-supplies-popup");
          if (supplies && !supplies.hasAttribute("hidden")) {
            supplies.setAttribute("hidden", "");
            document.querySelectorAll(".equip-slot").forEach((el) => el.classList.remove("equip-slot-selected", "equip-slot-highlight"));
            picker.querySelectorAll(".equip-slot-unequip-wrap").forEach((el) => el.remove());
            return;
          }
        }

        if (!target.closest(".equip-picker-inner")) {
          picker.setAttribute("hidden", "");
          const openedFrom = (picker as HTMLElement).dataset.openedFrom;
          if (openedFrom === "roster") UiManager.renderRosterScreen();
          return;
        }

        const preselectedJson = (picker as HTMLElement).dataset.preselectedItem;
        const preselectedIdxStr = (picker as HTMLElement).dataset.preselectedArmoryIndex;
        const slotEl = target.closest(".equip-slot") as HTMLElement | null;

        const soldiers = usePlayerCompanyStore.getState().company?.soldiers ?? [];

        if (slotEl) {
          const soldierId = slotEl.dataset.soldierId;
          if (!soldierId) return;
          const slotType = slotEl.dataset.slotType as "weapon" | "armor" | "equipment";
          const slotItemJson = slotEl.dataset.slotItem;
          const eqIndex = slotEl.dataset.eqIndex !== undefined ? parseInt(slotEl.dataset.eqIndex, 10) : 0;
          const selectedSlot = picker.querySelector(".equip-picker-soldiers-list .equip-slot-selected") as HTMLElement | null;

          /* Move between soldiers: click highlighted destination to move */
          if (selectedSlot && slotEl.classList.contains("equip-slot-highlight")) {
            const srcSoldierId = selectedSlot.dataset.soldierId!;
            const srcSlotType = selectedSlot.dataset.slotType as "weapon" | "armor" | "equipment";
            const srcEqIdx = selectedSlot.dataset.eqIndex != null ? parseInt(selectedSlot.dataset.eqIndex, 10) : undefined;
            const destSoldierId = slotEl.dataset.soldierId!;
            const destSlotType = slotEl.dataset.slotType as "weapon" | "armor" | "equipment";
            const destEqIdx = slotEl.dataset.eqIndex != null ? parseInt(slotEl.dataset.eqIndex, 10) : undefined;
            selectedSlot.classList.add("equip-slot-swap-source");
            slotEl.classList.add("equip-slot-swap-dest");
            document.querySelectorAll(".equip-slot").forEach((el) => el.classList.remove("equip-slot-selected", "equip-slot-highlight"));
            setTimeout(() => {
              const result = usePlayerCompanyStore.getState().moveItemBetweenSlots({
                sourceSoldierId: srcSoldierId,
                sourceSlotType: srcSlotType,
                sourceEqIndex: srcSlotType === "equipment" ? srcEqIdx : undefined,
                destSoldierId,
                destSlotType,
                destEqIndex: destSlotType === "equipment" ? destEqIdx : undefined,
              });
              if (result.success) {
                UiManager.refreshEquipPickerContent?.();
                openAvailableSuppliesPopup(picker as HTMLElement, srcSoldierId, srcSlotType, srcEqIdx ?? 0);
              }
            }, 280);
            return;
          }

          /* Deselect: click same selected slot again */
          if (selectedSlot === slotEl) {
            slotEl.classList.remove("equip-slot-selected");
            document.querySelectorAll(".equip-slot").forEach((el) => el.classList.remove("equip-slot-highlight"));
            picker.querySelectorAll(".equip-slot-unequip-wrap").forEach((el) => el.remove());
            return;
          }

          /* Preselected from inventory screen: equip to this slot if valid */
          if (preselectedJson && preselectedIdxStr != null) {
            const item = JSON.parse(preselectedJson.replace(/&quot;/g, '"'));
            const soldier = soldiers.find((s) => s.id === soldierId);
            if (soldier) {
              let valid = false;
              if (slotType === "weapon" && item.type === "ballistic_weapon" && weaponWieldOk(item, soldier)) valid = true;
              else if (slotType === "armor" && item.type === "armor") valid = true;
              else if (slotType === "equipment" && itemFitsSlot(item, "equipment")) valid = true;
              if (valid) {
                const armoryIndex = parseInt(preselectedIdxStr, 10);
                const slot = slotType === "equipment" ? "equipment" : slotType;
                const eqIdx = slotType === "equipment" && slotEl.dataset.eqIndex !== undefined
                  ? parseInt(slotEl.dataset.eqIndex, 10)
                  : undefined;
                const result = usePlayerCompanyStore.getState().equipItemToSoldier(soldierId, slot, item, { fromArmoryIndex: armoryIndex, equipmentIndex: eqIdx });
                if (result.success) {
                  (picker as HTMLElement).dataset.preselectedItem = "";
                  (picker as HTMLElement).dataset.preselectedArmoryIndex = "";
                  UiManager.refreshEquipPickerContent?.();
                }
              }
            }
            return;
          }

          /* Click any slot (empty or filled): select, highlight if filled, and open armory popup */
          document.querySelectorAll(".equip-slot").forEach((el) => el.classList.remove("equip-slot-selected", "equip-slot-highlight"));
          picker.querySelectorAll(".equip-slot-unequip-wrap").forEach((el) => el.remove());
          slotEl.classList.add("equip-slot-selected");
          if (slotItemJson) {
            const slotItem = JSON.parse(slotItemJson.replace(/&quot;/g, '"'));
            soldiers.forEach((s) => {
              document.querySelectorAll(`.equip-slot[data-soldier-id="${s.id}"]`).forEach((destSlot) => {
                const destType = (destSlot as HTMLElement).dataset.slotType as "weapon" | "armor" | "equipment";
                if (destSlot === slotEl) return;
                let canMove = false;
                if (destType === "weapon" && (slotItem.type === "ballistic_weapon" || slotItem.type === "melee_weapon") && weaponWieldOk(slotItem, s)) canMove = true;
                else if (destType === "armor" && slotItem.type === "armor") canMove = true;
                else if (destType === "equipment" && itemFitsSlot(slotItem, "equipment")) canMove = true;
                if (canMove) (destSlot as HTMLElement).classList.add("equip-slot-highlight");
              });
            });
            const soldierCard = slotEl.closest(".equip-picker-soldier") as HTMLElement;
            if (soldierCard) {
              const slotRect = slotEl.getBoundingClientRect();
              const cardRect = soldierCard.getBoundingClientRect();
              const gap = 4;
              const wrap = document.createElement("div");
              wrap.className = "equip-slot-unequip-wrap";
              wrap.style.left = `${slotRect.left - cardRect.left}px`;
              wrap.style.top = `${slotRect.top - cardRect.top - 48 - gap}px`;
              wrap.innerHTML = `<button type="button" class="equip-slot-unequip-btn" data-unequip-soldier-id="${soldierId}" data-unequip-slot-type="${slotType}" data-unequip-eq-index="${eqIndex}"><span class="equip-slot-unequip-label">Unequip</span><span class="equip-slot-unequip-icon" aria-hidden="true">⏏</span></button>`;
              soldierCard.appendChild(wrap);
            }
          }
          openAvailableSuppliesPopup(picker as HTMLElement, soldierId, slotType, eqIndex);
        }
      },
    },
  ];

  const rosterScreenEventConfig: HandlerInitConfig[] = [
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
        (picker as HTMLElement).dataset.focusSoldierId = soldierId;
        (picker as HTMLElement).dataset.openedFrom = "roster";
        (document.getElementById("equip-picker-title") as HTMLElement).textContent = "Inventory";
        picker.removeAttribute("hidden");
        UiManager.refreshEquipPickerContent?.();
        const soldierEl = picker.querySelector(`.equip-picker-soldier[data-soldier-id="${soldierId}"]`);
        if (soldierEl) soldierEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      },
    },
  ];

  const inventoryScreenEventConfig: HandlerInitConfig[] = [
    {
      selector: "#claim-holding-inventory-btn",
      eventType: "click",
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
        picker.dataset.preselectedItem = "";
        picker.dataset.preselectedArmoryIndex = "";
        (document.getElementById("equip-picker-title") as HTMLElement).textContent = "Equip Troops";
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
        if (!card || (e.target as HTMLElement).closest(".inventory-destroy-btn")) return;
        const json = (card as HTMLElement).getAttribute("data-item-json");
        const indexStr = (card as HTMLElement).dataset.itemIndex;
        if (!json) return;
        const item = JSON.parse(json.replace(/&quot;/g, '"'));
        const popup = document.getElementById("item-stats-popup");
        const titleEl = document.getElementById("item-stats-popup-title");
        const bodyEl = document.getElementById("item-stats-popup-body");
        const equipBtn = document.getElementById("item-stats-popup-equip");
        if (popup && titleEl && bodyEl) {
          (popup as HTMLElement).dataset.itemJson = json;
          (popup as HTMLElement).dataset.itemIndex = indexStr ?? "";
          (popup as HTMLElement).dataset.rarity = (item.rarity as string) ?? "common";
          titleEl.textContent = "";
          bodyEl.innerHTML = getItemPopupBodyHtml(item);
          const isEquippable =
            (item.type as string) === "ballistic_weapon" ||
            (item.type as string) === "armor" ||
            (item.type as string) === "throwable" ||
            (item.type as string) === "medical" ||
            (item.type as string) === "gear";
          if (equipBtn) {
            (equipBtn as HTMLElement).style.display = isEquippable ? "" : "none";
          }
          const gameEl = document.querySelector(DOM.game) as HTMLElement;
          if (gameEl) {
            gameEl.querySelectorAll("[id=item-stats-popup]").forEach((el) => { if (el !== popup) el.remove(); });
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
        const json = (popup as HTMLElement).dataset.itemJson;
        const idxStr = (popup as HTMLElement).dataset.itemIndex;
        if (!json) return;
        const item = JSON.parse(json.replace(/&quot;/g, '"'));
        (picker as HTMLElement).dataset.preselectedItem = json;
        (picker as HTMLElement).dataset.preselectedArmoryIndex = idxStr ?? "";
        (document.getElementById("equip-picker-title") as HTMLElement).textContent = `Equip: ${item.name}`;
        picker.removeAttribute("hidden");
        popup.hidden = true;
        UiManager.refreshEquipPickerContent?.();
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

  function clearFormationSelection() {
    const screen = document.getElementById("formation-screen");
    screen?.setAttribute("data-selected-index", "-1");
    screen?.querySelectorAll(".formation-slot-selected").forEach((el) => el.classList.remove("formation-slot-selected"));
    screen?.querySelectorAll(".formation-drop-zone").forEach((el) => el.classList.remove("formation-drop-zone"));
  }

  function clearFormationEquipSelection() {
    const screen = document.getElementById("formation-screen");
    screen?.querySelectorAll(".formation-equip-slot-selected").forEach((el) => el.classList.remove("formation-equip-slot-selected"));
    screen?.querySelectorAll(".formation-equip-slot-highlight").forEach((el) => el.classList.remove("formation-equip-slot-highlight"));
  }

  function applyFormationEquipDropZones(selectedSlot: HTMLElement) {
    const slotType = selectedSlot.dataset.slotType as "weapon" | "armor" | "equipment";
    const screen = document.getElementById("formation-screen");
    if (!screen || !slotType) return;
    screen.querySelectorAll(`.formation-equip-slot[data-slot-type="${slotType}"]`).forEach((el) => {
      if (el !== selectedSlot) (el as HTMLElement).classList.add("formation-equip-slot-highlight");
    });
  }

  function applyFormationDropZones(selectedIndex: number) {
    const screen = document.getElementById("formation-screen");
    if (!screen) return;
    screen.querySelectorAll(".formation-soldier-card").forEach((el) => {
      const card = el as HTMLElement;
      const idxStr = card.dataset.slotIndex;
      if (idxStr == null) return;
      const idx = parseInt(idxStr, 10);
      if (idx !== selectedIndex) card.classList.add("formation-drop-zone");
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
        const equipSlot = (e.target as HTMLElement).closest(".formation-equip-slot") as HTMLElement | null;
        if (equipSlot) {
          e.stopPropagation();
          clearFormationSelection();
          const screen = document.getElementById("formation-screen");
          const selectedSlot = screen?.querySelector(".formation-equip-slot-selected") as HTMLElement | null;
          const soldierId = equipSlot.dataset.soldierId;
          const slotType = equipSlot.dataset.slotType as "weapon" | "armor" | "equipment";
          const eqIndexStr = equipSlot.dataset.eqIndex;

          if (selectedSlot) {
            if (selectedSlot === equipSlot) {
              clearFormationEquipSelection();
              return;
            }
            const srcSoldierId = selectedSlot.dataset.soldierId!;
            const srcSlotType = selectedSlot.dataset.slotType as "weapon" | "armor" | "equipment";
            const srcEqIdx = selectedSlot.dataset.eqIndex != null ? parseInt(selectedSlot.dataset.eqIndex, 10) : undefined;
            if (equipSlot.classList.contains("formation-equip-slot-highlight") && soldierId && slotType) {
              const destEqIdx = slotType === "equipment" ? (eqIndexStr != null ? parseInt(eqIndexStr, 10) : undefined) : undefined;
              const result = usePlayerCompanyStore.getState().moveItemBetweenSlots({
                sourceSoldierId: srcSoldierId,
                sourceSlotType: srcSlotType,
                sourceEqIndex: srcSlotType === "equipment" ? srcEqIdx : undefined,
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

        const card = (e.target as HTMLElement).closest(".formation-soldier-card") as HTMLElement | null;
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
          if (targetFilled) {
            setFormationSwapIndices([selected, slotIndex]);
            store.swapSoldierPositions(selected, slotIndex);
            UiManager.renderFormationScreen();
            setTimeout(() => setFormationSwapIndices(null), 450);
          } else if (card.classList.contains("formation-drop-zone")) {
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
    screen?.querySelectorAll(".ready-room-slot-selected").forEach((el) => el.classList.remove("ready-room-slot-selected"));
    screen?.querySelectorAll(".ready-room-drop-zone").forEach((el) => el.classList.remove("ready-room-drop-zone"));
  }

  function clearReadyRoomEquipSelection() {
    const screen = document.getElementById("ready-room-screen");
    screen?.querySelectorAll(".ready-room-equip-slot-selected").forEach((el) => el.classList.remove("ready-room-equip-slot-selected"));
    screen?.querySelectorAll(".ready-room-equip-slot-highlight").forEach((el) => el.classList.remove("ready-room-equip-slot-highlight"));
  }

  function applyReadyRoomEquipDropZones(selectedSlot: HTMLElement) {
    const slotType = selectedSlot.dataset.slotType as "weapon" | "armor" | "equipment";
    const screen = document.getElementById("ready-room-screen");
    if (!screen || !slotType) return;
    screen.querySelectorAll(`.ready-room-equip-slot[data-slot-type="${slotType}"]`).forEach((el) => {
      if (el !== selectedSlot) (el as HTMLElement).classList.add("ready-room-equip-slot-highlight");
    });
  }

  function applyReadyRoomDropZones(selectedIndex: number) {
    const screen = document.getElementById("ready-room-screen");
    if (!screen) return;
    screen.querySelectorAll(".ready-room-soldier-card").forEach((el) => {
      const card = el as HTMLElement;
      const idxStr = card.dataset.slotIndex;
      if (idxStr == null) return;
      const idx = parseInt(idxStr, 10);
      if (idx !== selectedIndex) card.classList.add("ready-room-drop-zone");
    });
  }

  const readyRoomScreenEventConfig: HandlerInitConfig[] = [
    {
      selector: DOM.readyRoom.proceedBtn,
      eventType: "click",
      callback: () => {
        const screen = document.getElementById("ready-room-screen");
        const json = screen?.getAttribute("data-mission-json");
        const mission = json ? JSON.parse(json) : null;
        if (!mission) return;
        const btn = s_(DOM.readyRoom.proceedBtn);
        if (btn?.classList.contains("disabled")) return;
        console.log("Proceed to combat", mission);
        UiManager.renderCombatScreen(mission);
      },
    },
    {
      selector: "#ready-room-screen",
      eventType: "click",
      callback: (e: Event) => {
        const equipSlot = (e.target as HTMLElement).closest(".ready-room-equip-slot") as HTMLElement | null;
        if (equipSlot) {
          e.stopPropagation();
          clearReadyRoomSelection();
          const screen = document.getElementById("ready-room-screen");
          const selectedSlot = screen?.querySelector(".ready-room-equip-slot-selected") as HTMLElement | null;
          const soldierId = equipSlot.dataset.soldierId;
          const slotType = equipSlot.dataset.slotType as "weapon" | "armor" | "equipment";
          const eqIndexStr = equipSlot.dataset.eqIndex;
          const eqIndex = eqIndexStr != null ? parseInt(eqIndexStr, 10) : undefined;

          if (selectedSlot) {
            if (selectedSlot === equipSlot) {
              clearReadyRoomEquipSelection();
              return;
            }
            const srcSoldierId = selectedSlot.dataset.soldierId!;
            const srcSlotType = selectedSlot.dataset.slotType as "weapon" | "armor" | "equipment";
            const srcEqIdx = selectedSlot.dataset.eqIndex != null ? parseInt(selectedSlot.dataset.eqIndex, 10) : undefined;
            if (equipSlot.classList.contains("ready-room-equip-slot-highlight") && soldierId && slotType) {
              const destEqIdx = slotType === "equipment" ? (eqIndexStr != null ? parseInt(eqIndexStr, 10) : undefined) : undefined;
              const result = usePlayerCompanyStore.getState().moveItemBetweenSlots({
                sourceSoldierId: srcSoldierId,
                sourceSlotType: srcSlotType,
                sourceEqIndex: srcSlotType === "equipment" ? srcEqIdx : undefined,
                destSoldierId: soldierId,
                destSlotType: slotType,
                destEqIndex: slotType === "equipment" ? destEqIdx : undefined,
              });
              if (result.success) {
                setLastEquipMoveSoldierIds(
                  [srcSoldierId, soldierId].filter((v, i, a) => a.indexOf(v) === i),
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

        const card = (e.target as HTMLElement).closest(".ready-room-soldier-card") as HTMLElement | null;
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
          if (hasSoldier) {
            setLastReadyRoomMoveSlotIndices([selected, slotIndex]);
            store.swapSoldierPositions(selected, slotIndex);
            UiManager.renderReadyRoomScreen(mission);
            setTimeout(() => setLastReadyRoomMoveSlotIndices([]), 450);
          } else if (card.classList.contains("ready-room-drop-zone")) {
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
        const target = e.target as HTMLElement;
        const recruitBtn = target.closest(".recruit-soldier");
        if (recruitBtn) {
          const btn = recruitBtn as HTMLButtonElement;
          if (btn.getAttribute("aria-disabled") === "true") return;
          const trooperId = btn.dataset.trooperId;
          if (!trooperId) return;
          const soldier = usePlayerCompanyStore.getState().marketAvailableTroops.find((s) => s.id === trooperId);
          if (!soldier) return;
          const result = usePlayerCompanyStore.getState().tryAddToRecruitStaging(soldier);
          if (result.success) {
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
            usePlayerCompanyStore.getState().removeFromRecruitStaging(soldierId);
            UiManager.renderMarketTroopsScreen();
          }
          return;
        }
        const confirmBtn = target.closest("#confirm-recruitment");
        if (confirmBtn && !(confirmBtn as HTMLButtonElement).disabled) {
          usePlayerCompanyStore.getState().confirmRecruitment();
          UiManager.renderMarketTroopsScreen();
          return;
        }
        const rerollBtn = target.closest(".reroll-soldier");
        if (rerollBtn) {
          const id = (rerollBtn as HTMLElement).dataset.trooperid;
          if (id) usePlayerCompanyStore.getState().rerollSoldier(id);
        }
      },
    },
  ];

  const suppliesScreenEventConfig: HandlerInitConfig[] = [
    ...marketLevelNavHandlers("supplies-market", () => UiManager.renderSuppliesMarketScreen()),
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
        const qtyInput = document.getElementById("supplies-qty-input") as HTMLInputElement;
        const errorEl = document.getElementById("supplies-buy-error");
        const buyBtn = document.getElementById("supplies-buy-btn");
        if (!popup || !titleEl || !bodyEl || !qtyInput || !errorEl || !buyBtn) return;
        (popup as HTMLElement).dataset.suppliesItem = itemJson;
        (popup as HTMLElement).dataset.suppliesPrice = priceStr;
        (popup as HTMLElement).dataset.rarity = (item.rarity as string) ?? "common";
        titleEl.textContent = "";
        bodyEl.innerHTML = getItemPopupBodyHtml(item) + `<p class="item-popup-price" style="margin-top:12px;font-weight:700"><strong>$${price.toLocaleString()}</strong> each</p>`;
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
        (buyBtn as HTMLElement).innerHTML = `Buy <span class="buy-btn-price">$${price.toLocaleString()}</span>`;
      },
    },
    {
      selector: DOM.supplies.qtyMinus,
      eventType: "click",
      callback: () => {
        const input = document.getElementById("supplies-qty-input") as HTMLInputElement;
        const popup = document.getElementById("supplies-buy-popup");
        const buyBtn = document.getElementById("supplies-buy-btn");
        if (!input || !popup || !buyBtn) return;
        const v = Math.max(1, parseInt(input.value || "1", 10) - 1);
        input.value = String(v);
        const price = parseInt((popup as HTMLElement).dataset.suppliesPrice ?? "0", 10);
        (buyBtn as HTMLElement).innerHTML = `Buy <span class="buy-btn-price">$${(price * v).toLocaleString()}</span>`;
      },
    },
    {
      selector: DOM.supplies.qtyPlus,
      eventType: "click",
      callback: () => {
        const input = document.getElementById("supplies-qty-input") as HTMLInputElement;
        const popup = document.getElementById("supplies-buy-popup");
        const buyBtn = document.getElementById("supplies-buy-btn");
        if (!input || !popup || !buyBtn) return;
        const max = parseInt(input.max || "1", 10);
        const v = Math.min(max, parseInt(input.value || "1", 10) + 1);
        input.value = String(v);
        const price = parseInt((popup as HTMLElement).dataset.suppliesPrice ?? "0", 10);
        (buyBtn as HTMLElement).innerHTML = `Buy <span class="buy-btn-price">$${(price * v).toLocaleString()}</span>`;
      },
    },
    {
      selector: DOM.supplies.buyBtn,
      eventType: "click",
      callback: () => {
        const popup = document.getElementById("supplies-buy-popup");
        const qtyInput = document.getElementById("supplies-qty-input") as HTMLInputElement;
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
        const result = usePlayerCompanyStore.getState().addItemsToCompanyInventory(items, totalCost);
        if (!result.success) {
          if (result.reason === "capacity") {
            errorEl.textContent = "You don't have enough room";
          } else {
            errorEl.textContent = "Not enough credits";
          }
          errorEl.classList.add("visible");
          return;
        }
        popup.setAttribute("hidden", "");
        UiManager.renderSuppliesMarketScreen();
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
        if (e.target === e.currentTarget) {
          (e.currentTarget as HTMLElement).setAttribute("hidden", "");
        }
      },
    },
  ];

  function gearBuyHandlers(
    ids: { popup: string; title: string; body: string; qtyInput: string; error: string; buyBtn: string; qtyMinus: string; qtyPlus: string; buyClose: string },
    // ids use element id (no #) for getElementById; selectors need # for querySelector
    itemSelector: string,
    onSuccess: () => void,
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
          const qtyInput = document.getElementById(ids.qtyInput) as HTMLInputElement;
          const errorEl = document.getElementById(ids.error);
          const buyBtn = document.getElementById(ids.buyBtn);
          if (!popup || !titleEl || !bodyEl || !qtyInput || !errorEl || !buyBtn) return;
          (popup as HTMLElement).dataset.gearItem = itemJson;
          (popup as HTMLElement).dataset.gearPrice = priceStr;
          (popup as HTMLElement).dataset.rarity = (item.rarity as string) ?? "common";
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
          (buyBtn as HTMLElement).innerHTML = `Buy <span class="buy-btn-price">$${price.toLocaleString()}</span>`;
        },
      },
      {
        selector: `#${ids.qtyMinus}`,
        eventType: "click",
        callback: () => {
          const input = document.getElementById(ids.qtyInput) as HTMLInputElement;
          const popup = document.getElementById(ids.popup);
          const buyBtn = document.getElementById(ids.buyBtn);
          if (!input || !popup || !buyBtn) return;
          const v = Math.max(1, parseInt(input.value || "1", 10) - 1);
          input.value = String(v);
          const price = parseInt((popup as HTMLElement).dataset.gearPrice ?? "0", 10);
          (buyBtn as HTMLElement).innerHTML = `Buy <span class="buy-btn-price">$${(price * v).toLocaleString()}</span>`;
        },
      },
      {
        selector: `#${ids.qtyPlus}`,
        eventType: "click",
        callback: () => {
          const input = document.getElementById(ids.qtyInput) as HTMLInputElement;
          const popup = document.getElementById(ids.popup);
          const buyBtn = document.getElementById(ids.buyBtn);
          if (!input || !popup || !buyBtn) return;
          const max = parseInt(input.max || "1", 10);
          const v = Math.min(max, parseInt(input.value || "1", 10) + 1);
          input.value = String(v);
          const price = parseInt((popup as HTMLElement).dataset.gearPrice ?? "0", 10);
          (buyBtn as HTMLElement).innerHTML = `Buy <span class="buy-btn-price">$${(price * v).toLocaleString()}</span>`;
        },
      },
      {
        selector: `#${ids.buyBtn}`,
        eventType: "click",
        callback: () => {
          const popup = document.getElementById(ids.popup);
          const qtyInput = document.getElementById(ids.qtyInput) as HTMLInputElement;
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
          const result = usePlayerCompanyStore.getState().addItemsToCompanyInventory(items, totalCost);
          if (!result.success) {
            errorEl.textContent = result.reason === "capacity" ? "Not enough room" : "Not enough credits";
            errorEl.classList.add("visible");
            return;
          }
          popup.setAttribute("hidden", "");
          onSuccess();
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
          if (e.target === e.currentTarget) {
            (e.currentTarget as HTMLElement).setAttribute("hidden", "");
          }
        },
      },
    ];
  }

  const weaponsScreenEventConfig: HandlerInitConfig[] = [
    ...marketLevelNavHandlers("weapons-market", () => UiManager.renderWeaponsMarketScreen()),
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

  const armorScreenEventConfig: HandlerInitConfig[] = [
    ...marketLevelNavHandlers("armor-market", () => UiManager.renderArmorMarketScreen()),
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

  return {
    gameSetup: () => gameSetupEventConfig,
    confirmationScreen: () => gameConfirmationEventConfig,
    mainMenu: () => mainMenuEventConfig,
    companyHome: () => companyHomeEventConfig,
    market: () => marketEventConfig,
    troopsScreen: () => troopsScreenEventConfig,
    missionsScreen: () => missionsScreenEventConfig,
    rosterScreen: () => rosterScreenEventConfig.concat(equipPickerEventConfig),
    inventoryScreen: () => inventoryScreenEventConfig.concat(equipPickerEventConfig),
    suppliesScreen: () => suppliesScreenEventConfig,
    weaponsScreen: () => weaponsScreenEventConfig,
    armorScreen: () => armorScreenEventConfig,
    memorialScreen: () => [],
    trainingScreen: () => [],
    abilitiesScreen: () => [],
    readyRoomScreen: () => readyRoomScreenEventConfig,
    formationScreen: () => formationScreenEventConfig,
    combatScreen: combatScreenEventConfig,
  };
}
