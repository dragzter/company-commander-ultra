import type { HandlerInitConfig } from "../../constants/types.ts";
import { getItemPopupBodyHtml } from "../html-templates/inventory-template.ts";
import { STARTING_CREDITS, getArmorySlots } from "../../constants/economy.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { disableBtn, enableBtn, s_, sa_ } from "../../utils/html-utils.ts";
import { DOM } from "../../constants/css-selectors.ts";
import { Styler } from "../../utils/styler-manager.ts";
import { UiManager } from "./ui-manager.ts";
import {
  getSoldierAbilities,
  getSoldierGrenades,
  SHIELD_ICON,
  type SoldierGrenade,
} from "../../constants/soldier-abilities.ts";
import {
  TAKE_COVER_DURATION_MS,
  isInCover,
  isStunned,
  assignTargets,
  clearExpiredEffects,
  removeTargetsForCombatantInCover,
  resolveAttack,
  getNextAttackAt,
} from "../combat/combat-loop.ts";
import type { TargetMap } from "../combat/types.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import { weaponWieldOk, itemFitsSlot } from "../../utils/equip-utils.ts";
import { resolveGrenadeThrow } from "../../services/combat/grenade-resolver.ts";
import type { Combatant } from "../combat/types.ts";
import type { Mission } from "../../constants/missions.ts";

/**
 * Contains definitions for the events of all html templates.
 * Configured when the html is called and appended to the DOM.
 */
export function eventConfigs() {
  const store = usePlayerCompanyStore.getState();

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
        console.log("clicking roster");
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
        UiManager.selectCompanyHomeButton(DOM.company.heroes);
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
        // TODO: open ready room then combat
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
    let combatStarted = false;
    let combatWinner: "player" | "enemy" | null = null;
    let popupCombatantId: string | null = null;
    const targets: TargetMap = new Map();
    const nextAttackAt = new Map<string, number>();

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
      const gap = 8;
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
      if (!combatStarted || combatWinner || combatant.side !== "player") return;
      const popup = document.getElementById("combat-abilities-popup");
      const contentEl = document.getElementById("combat-abilities-popup-content");
      const hintEl = document.getElementById("combat-abilities-popup-hint");
      const listEl = document.getElementById("combat-abilities-list");
      const titleEl = document.getElementById("combat-abilities-popup-title");
      if (!popup || !contentEl || !hintEl || !listEl || !titleEl) return;

      const abilities = getSoldierAbilities();
      let grenades: SoldierGrenade[] = [];
      const soldier = getSoldierFromStore(combatant.id);
      if (soldier?.inventory) grenades = getSoldierGrenades(soldier.inventory);

      const used = combatant.takeCoverUsed;
      const abilityHtml = abilities.map((a) => {
        if (a.id === "take_cover") {
          return `<button type="button" class="combat-ability-icon-slot combat-ability-take-cover-wrap ${used ? "combat-ability-used" : ""}" data-ability-id="take_cover" data-soldier-id="${combatant.id}" ${used ? "disabled" : ""} title="Take Cover" aria-label="Take Cover">
            <img src="${a.icon}" alt="" width="48" height="48">
            <span class="combat-ability-take-cover-label">Take Cover</span>
          </button>`;
        }
        return `<button type="button" class="combat-ability-icon-slot" data-ability-id="${a.id}" data-soldier-id="${combatant.id}" title="${a.name}" aria-label="${a.name}"><img src="${a.icon}" alt="" width="48" height="48"></button>`;
      }).join("");

      const grenadeHtml = grenades.map((g) => {
        const qty = g.item.uses ?? g.item.quantity ?? 1;
        const iconUrl = getItemIconUrl(g.item);
        return `<button type="button" class="combat-grenade-item" data-inventory-index="${g.inventoryIndex}" data-soldier-id="${combatant.id}" title="${g.item.name}" aria-label="${g.item.name}">
          <div class="combat-grenade-icon-wrap">
            <img class="combat-grenade-icon" src="${iconUrl}" alt="" width="48" height="48">
            ${qty > 1 ? `<span class="combat-grenade-qty">${qty}</span>` : ""}
          </div>
        </button>`;
      }).join("");

      titleEl.textContent = `${combatant.name} — Abilities`;
      listEl.innerHTML = abilityHtml + grenadeHtml;
      contentEl.style.display = "";
      hintEl.classList.remove("visible");
      hintEl.textContent = "";
      popupCombatantId = combatant.id;
      popup.setAttribute("aria-hidden", "false");
      positionPopupUnderCard(popup, card ?? document.querySelector(`[data-combatant-id="${combatant.id}"]`) as HTMLElement);
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

    function showGrenadeTargetingHint(_thrower: Combatant, grenade: SoldierGrenade) {
      const popup = document.getElementById("combat-abilities-popup");
      const contentEl = document.getElementById("combat-abilities-popup-content");
      const hintEl = document.getElementById("combat-abilities-popup-hint");
      if (!popup || !contentEl || !hintEl) return;
      contentEl.style.display = "none";
      hintEl.textContent = `Select an enemy to throw ${grenade.item.name} at`;
      hintEl.classList.add("visible");
      requestAnimationFrame(() => positionPopupCentered(popup));
    }

    function closeAbilitiesPopup() {
      grenadeTargetingMode = null;
      popupCombatantId = null;
      document.querySelectorAll(".combat-card-grenade-target").forEach((el) => el.classList.remove("combat-card-grenade-target"));
      const popup = document.getElementById("combat-abilities-popup");
      if (popup) popup.setAttribute("aria-hidden", "true");
    }

    function animateGrenadeProjectile(attackerCard: Element, targetCard: Element, iconUrl: string, durationMs: number) {
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
      const SIZE = 20;
      const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
      img.setAttribute("href", iconUrl);
      img.setAttribute("x", String(ax - SIZE / 2));
      img.setAttribute("y", String(ay - SIZE / 2));
      img.setAttribute("width", String(SIZE));
      img.setAttribute("height", String(SIZE));
      img.classList.add("combat-projectile-grenade");
      projectilesG.appendChild(img);
      const tStart = performance.now();
      function tick(now: number) {
        const t = Math.min(1, (now - tStart) / durationMs);
        const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        const x = ax + (tx - ax) * eased;
        const y = ay + (ty - ay) * eased;
        img.setAttribute("x", String(x - SIZE / 2));
        img.setAttribute("y", String(y - SIZE / 2));
        if (t < 1) requestAnimationFrame(tick);
        else img.remove();
      }
      requestAnimationFrame(tick);
    }

    function executeGrenadeThrow(thrower: Combatant, target: Combatant, grenade: SoldierGrenade) {
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

      const showEvaded = (id: string, effectEvaded = false) => {
        const card = document.querySelector(`[data-combatant-id="${id}"]`);
        if (!card) return;
        const popup = document.createElement("span");
        popup.className = effectEvaded ? "combat-effect-evaded-popup" : "combat-evade-popup";
        popup.textContent = effectEvaded ? "Effect Evaded!" : "Evade";
        card.appendChild(popup);
        setTimeout(() => popup.remove(), 1500);
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

      const addExplosionOverlay = (targetCard: Element, isThrowingKnife = false) => {
        const el = document.createElement("div");
        el.className = isThrowingKnife ? "combat-throwing-knife-overlay" : "combat-explosion-overlay";
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
        const isFrag = (grenade.item.tags as string[] | undefined)?.includes("explosive");
        if (targetCard) addExplosionOverlay(targetCard, isThrowingKnife);
        if (targetCard && isFrag && result.primary.damageDealt > 0) {
          targetCard.classList.add("combat-card-frag-flash");
          setTimeout(() => targetCard.classList.remove("combat-card-frag-flash"), 150);
        }
        const isSmoke = (grenade.item.tags as string[] | undefined)?.includes("smoke") || grenade.item.id === "mk18_smoke";
        if (result.primary.evaded) showEvaded(result.primary.targetId, result.primary.hit);
        else if (isSmoke && result.primary.hit) showSmokeEffect(result.primary.targetId, 40);
        else if (result.primary.damageDealt > 0) showDamage(result.primary.targetId, result.primary.damageDealt);
        for (const s of result.splash) {
          if (s.evaded) showEvaded(s.targetId, s.hit);
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
        /* Kill credit for grenade KOs - add addKillToSoldier to store when implemented */
      }, 400);
    }

    const allCombatants = [...players, ...enemies];

    function updateCombatUI() {
      const now = Date.now();
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
        card.classList.toggle("combat-card-in-cover", inCover);
        card.classList.toggle("combat-card-smoked", smoked);
        card.classList.toggle("combat-card-stunned", stunned);
        card.classList.toggle("combat-card-panicked", panicked);
        card.classList.toggle("combat-card-burning", burning);
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
    }

    let combatTickId: number | null = null;
    function startCombatLoop() {
      const now = Date.now();
      for (const c of [...players, ...enemies]) {
        if (c.hp > 0 && !c.downState) nextAttackAt.set(c.id, now + Math.random() * 500);
      }
      function tick() {
        const now = Date.now();
        clearExpiredEffects([...players, ...enemies], now);
        assignTargets(players, enemies, targets, now);
        combatWinner = players.every((p) => p.hp <= 0 || p.downState) ? "enemy" : enemies.every((e) => e.hp <= 0 || e.downState) ? "player" : null;
        if (combatWinner) {
          updateCombatUI();
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
              const result = resolveAttack(c, target);
              nextAttackAt.set(c.id, getNextAttackAt(c, now));
              const card = document.querySelector(`[data-combatant-id="${result.targetId}"]`);
              if (card) {
                if (result.evaded) {
                  const popup = document.createElement("span");
                  popup.className = "combat-evade-popup";
                  popup.textContent = "Evade";
                  card.appendChild(popup);
                  setTimeout(() => popup.remove(), 1500);
                } else if (result.damage > 0) {
                  const popup = document.createElement("span");
                  popup.className = "combat-damage-popup";
                  popup.textContent = String(result.damage);
                  card.appendChild(popup);
                  setTimeout(() => popup.remove(), 1500);
                  card.classList.add("combat-card-shake");
                  setTimeout(() => card.classList.remove("combat-card-shake"), 350);
                }
              }
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
          const abilityBtn = t.closest(".combat-ability-icon-slot");
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
            const now = Date.now();
            combatant.takeCoverUntil = now + TAKE_COVER_DURATION_MS;
            combatant.takeCoverUsed = true;
            removeTargetsForCombatantInCover(targets, combatant.id);
            closeAbilitiesPopup();
            updateCombatUI();
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
        selector: ".combat-card",
        eventType: "click",
        callback: (e: Event) => {
          e.stopPropagation();
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
          if (btn) {
            btn.classList.add("disabled");
            btn.disabled = true;
            btn.textContent = "Combat in progress";
          }
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
          console.log("Mission details");
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
    ];
  }

  const equipPickerEventConfig: HandlerInitConfig[] = [
    {
      selector: "#equip-picker-close",
      eventType: "click",
      callback: () => {
        const picker = document.getElementById("equip-picker-popup");
        if (!picker) return;
        const openedFrom = (picker as HTMLElement).dataset.openedFrom;
        picker.setAttribute("hidden", "");
        if (openedFrom === "roster") UiManager.renderRosterScreen();
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

        const preselectedJson = (picker as HTMLElement).dataset.preselectedItem;
        const preselectedIdxStr = (picker as HTMLElement).dataset.preselectedArmoryIndex;
        const slotEl = target.closest(".equip-slot") as HTMLElement | null;
        const armoryEl = target.closest(".equip-picker-armory-item") as HTMLElement | null;

        const soldiers = usePlayerCompanyStore.getState().company?.soldiers ?? [];

        if (armoryEl) {
          const json = armoryEl.dataset.armoryItem;
          const idxStr = armoryEl.dataset.armoryIndex;
          if (json && idxStr != null) {
            (picker as HTMLElement).dataset.preselectedItem = json;
            (picker as HTMLElement).dataset.preselectedArmoryIndex = idxStr;
            (document.getElementById("equip-picker-title") as HTMLElement).textContent = `Equip: ${JSON.parse(json.replace(/&quot;/g, '"')).name}`;
            document.querySelectorAll(".equip-slot").forEach((el) => el.classList.remove("equip-slot-highlight", "equip-slot-selected"));
            soldiers.forEach((s) => {
              document.querySelectorAll(`.equip-slot[data-soldier-id="${s.id}"]`).forEach((slot) => {
                const slotType = (slot as HTMLElement).dataset.slotType as "weapon" | "armor" | "equipment";
                const item = JSON.parse((json as string).replace(/&quot;/g, '"'));
                if (slotType === "weapon" && item.type === "ballistic_weapon" && weaponWieldOk(item, s)) (slot as HTMLElement).classList.add("equip-slot-highlight");
                else if (slotType === "armor" && item.type === "armor") (slot as HTMLElement).classList.add("equip-slot-highlight");
                else if (slotType === "equipment" && itemFitsSlot(item, "equipment")) (slot as HTMLElement).classList.add("equip-slot-highlight");
              });
            });
          }
          return;
        }

        if (slotEl) {
          const soldierId = slotEl.dataset.soldierId;
          if (!soldierId) return;
          const slotType = slotEl.dataset.slotType as "weapon" | "armor" | "equipment";

          if (preselectedJson && preselectedIdxStr != null) {
            const item = JSON.parse(preselectedJson.replace(/&quot;/g, '"'));
            const soldier = soldiers.find((s) => s.id === soldierId);
            if (!soldier) return;
            let valid = false;
            if (slotType === "weapon" && item.type === "ballistic_weapon" && weaponWieldOk(item, soldier)) valid = true;
            else if (slotType === "armor" && item.type === "armor") valid = true;
            else if (slotType === "equipment" && itemFitsSlot(item, "equipment")) valid = true;
            if (valid) {
              const armoryIndex = parseInt(preselectedIdxStr, 10);
              const slot = slotType === "equipment" ? "equipment" : slotType;
              const eqIndex = slotType === "equipment" && slotEl.dataset.eqIndex !== undefined
                ? parseInt(slotEl.dataset.eqIndex, 10)
                : undefined;
              const result = usePlayerCompanyStore.getState().equipItemToSoldier(soldierId, slot, item, { fromArmoryIndex: armoryIndex, equipmentIndex: eqIndex });
              if (result.success) {
                (picker as HTMLElement).dataset.preselectedItem = "";
                (picker as HTMLElement).dataset.preselectedArmoryIndex = "";
                document.querySelectorAll(".equip-slot").forEach((el) => el.classList.remove("equip-slot-highlight"));
                UiManager.refreshEquipPickerContent?.();
              }
            }
            return;
          }

          const selectedSlot = picker.querySelector(".equip-slot-selected") as HTMLElement | null;
          const slotItemJson = slotEl.dataset.slotItem;
          if (selectedSlot === slotEl) {
            slotEl.classList.remove("equip-slot-selected");
            document.querySelectorAll(".equip-slot").forEach((el) => el.classList.remove("equip-slot-highlight"));
            return;
          }
          if (selectedSlot && slotEl.classList.contains("equip-slot-highlight")) {
            const srcSoldierId = selectedSlot.dataset.soldierId!;
            const srcSlotType = selectedSlot.dataset.slotType as "weapon" | "armor" | "equipment";
            const srcEqIdx = selectedSlot.dataset.eqIndex != null ? parseInt(selectedSlot.dataset.eqIndex, 10) : undefined;
            const destSoldierId = slotEl.dataset.soldierId!;
            const destSlotType = slotEl.dataset.slotType as "weapon" | "armor" | "equipment";
            const destEqIdx = slotEl.dataset.eqIndex != null ? parseInt(slotEl.dataset.eqIndex, 10) : undefined;
            const result = usePlayerCompanyStore.getState().moveItemBetweenSlots({
              sourceSoldierId: srcSoldierId,
              sourceSlotType: srcSlotType,
              sourceEqIndex: srcSlotType === "equipment" ? srcEqIdx : undefined,
              destSoldierId,
              destSlotType,
              destEqIndex: destSlotType === "equipment" ? destEqIdx : undefined,
            });
            if (result.success) {
              document.querySelectorAll(".equip-slot").forEach((el) => el.classList.remove("equip-slot-selected", "equip-slot-highlight"));
              UiManager.refreshEquipPickerContent?.();
            }
            return;
          }
          if (slotItemJson) {
            document.querySelectorAll(".equip-slot").forEach((el) => el.classList.remove("equip-slot-selected", "equip-slot-highlight"));
            slotEl.classList.add("equip-slot-selected");
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
          }
        }
      },
    },
  ];

  const rosterScreenEventConfig: HandlerInitConfig[] = [
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
          titleEl.textContent = item.name;
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
  ];

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
        titleEl.textContent = item.name;
        bodyEl.innerHTML = `<p>${item.description ?? ""}</p><p><strong>$${price} each</strong></p>`;
        const st = usePlayerCompanyStore.getState();
        const level = st.company?.level ?? st.companyLevel ?? 1;
        const slotsFree = getArmorySlots(level) - (st.company?.inventory?.length ?? 0);
        qtyInput.value = "1";
        qtyInput.max = String(Math.max(1, slotsFree));
        errorEl.textContent = "";
        errorEl.classList.remove("visible");
        popup.removeAttribute("hidden");
        buyBtn.removeAttribute("disabled");
      },
    },
    {
      selector: DOM.supplies.qtyMinus,
      eventType: "click",
      callback: () => {
        const input = document.getElementById("supplies-qty-input") as HTMLInputElement;
        if (!input) return;
        const v = Math.max(1, parseInt(input.value || "1", 10) - 1);
        input.value = String(v);
      },
    },
    {
      selector: DOM.supplies.qtyPlus,
      eventType: "click",
      callback: () => {
        const input = document.getElementById("supplies-qty-input") as HTMLInputElement;
        const popup = document.getElementById("supplies-buy-popup");
        if (!input || !popup) return;
        const max = parseInt(input.max || "1", 10);
        const v = Math.min(max, parseInt(input.value || "1", 10) + 1);
        input.value = String(v);
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
          titleEl.textContent = item.name;
          bodyEl.innerHTML = `<p>${item.description ?? ""}</p><p><strong>$${price} each</strong></p>`;
          const st = usePlayerCompanyStore.getState();
          const level = st.company?.level ?? st.companyLevel ?? 1;
          const slotsFree = getArmorySlots(level) - (st.company?.inventory?.length ?? 0);
          qtyInput.value = "1";
          qtyInput.max = String(Math.max(1, Math.min(slotsFree, 10)));
          errorEl.textContent = "";
          errorEl.classList.remove("visible");
          popup.removeAttribute("hidden");
          buyBtn.textContent = `Buy $${price}`;
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
          buyBtn.textContent = `Buy $${price * v}`;
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
          buyBtn.textContent = `Buy $${price * v}`;
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
          const slotsFree = getArmorySlots(level) - (st.company?.inventory?.length ?? 0);
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
    ];
  }

  const weaponsScreenEventConfig: HandlerInitConfig[] = gearBuyHandlers(
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
  );

  const armorScreenEventConfig: HandlerInitConfig[] = gearBuyHandlers(
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
  );

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
    combatScreen: combatScreenEventConfig,
  };
}
