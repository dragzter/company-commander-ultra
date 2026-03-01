import {
  companyActionsTemplate,
  companyHeaderPartial,
  companyHomePageTemplate,
  gameSetupTemplate,
  mainMenuTemplate,
  setupConfirmationTemplate,
} from "../html-templates/game-setup-template.ts";
import { eventConfigs as ec } from "./event-configs.ts";
import { AudioManager } from "../audio/audio-manager.ts";
import { UiServiceManager } from "../../services/ui/ui-service.ts";
// import { UiAnimationManager } from "../../services/ui/ui-animation-manager.ts";
import { DomEventManager } from "./event-handlers/dom-event-manager.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { UiManager } from "./ui-manager.ts";
import { DOM } from "../../constants/css-selectors.ts";
import {
  marketTemplate,
  troopsMarketTemplate,
  weaponsMarketTemplate,
  armorMarketTemplate,
  suppliesMarketTemplate,
  devCatalogMarketTemplate,
} from "../html-templates/market-templates.ts";
import { missionsTemplate } from "../html-templates/missions-template.ts";
import {
  readyRoomTemplate,
  clearLastEquipMoveSoldierIds,
} from "../html-templates/ready-room-template.ts";
import { rosterTemplate } from "../html-templates/roster-template.ts";
import { formationTemplate } from "../html-templates/formation-template.ts";
import { inventoryTemplate } from "../html-templates/inventory-template.ts";
import { memorialTemplate } from "../html-templates/memorial-template.ts";
import { trainingTemplate } from "../html-templates/training-template.ts";
import { abilitiesTemplate } from "../html-templates/abilities-template.ts";
import { combatTemplate } from "../html-templates/combat-template.ts";
import { soldierToCombatant, createEnemyCombatant } from "../combat/combatant-utils.ts";
import { getActiveSlots, getFormationSlots, getSoldierById } from "../../constants/company-slots.ts";
import { getMaxSoldierLevel } from "../../utils/company-utils.ts";
import { Styler } from "../../utils/styler-manager.ts";
import { SoldierManager } from "../entities/soldier/soldier-manager.ts";
import type { Designation, Soldier } from "../entities/types.ts";
import type { Mission } from "../../constants/missions.ts";
import { generateDevTestMissions } from "../../services/missions/mission-generator.ts";
import { RARE_WEAPON_BASES, createRareWeapon } from "../../constants/items/rare-weapon-bases.ts";
import { RARE_ARMOR_BASES, createRareArmor } from "../../constants/items/rare-armor-bases.ts";
import { MedicalItems } from "../../constants/items/medical-items.ts";
import { ThrowableItems } from "../../constants/items/throwable.ts";
import { getScaledThrowableDamage } from "../../constants/items/throwable-scaling.ts";
import { Images } from "../../constants/images.ts";

/**
 * Manager which templates are displayed.  Orchestrates all the things that need to happen when
 * a screen is changed or a page is loaded.
 * @constructor
 */
function ScreenManager() {
  const _AudioManager = AudioManager;
  const _UiServiceManager = UiServiceManager;
  //const _UiAnim = UiAnimationManager;

  const { gameBoard, parseHTML } = _UiServiceManager;
  const { show, hide, center, g_menu } = gameBoard();

  function getEnemyLevelFromActiveSquad(activeSoldiers: Soldier[]): number {
    if (activeSoldiers.length === 0) return 1;

    const levelCounts = new Map<number, number>();
    for (const s of activeSoldiers) {
      const lvl = Math.max(1, Math.floor(s.level ?? 1));
      levelCounts.set(lvl, (levelCounts.get(lvl) ?? 0) + 1);
    }

    let majorityLevel = -1;
    let majorityCount = 0;
    for (const [lvl, count] of levelCounts) {
      if (count > majorityCount) {
        majorityCount = count;
        majorityLevel = lvl;
      }
    }

    // Clear majority: more than half the active squad shares one level.
    if (majorityCount > activeSoldiers.length / 2) return majorityLevel;

    const sum = activeSoldiers.reduce((a, s) => a + (s.level ?? 1), 0);
    return Math.max(1, Math.ceil(sum / activeSoldiers.length));
  }

  function getRecruitLevelFromCompany(company: import("../entities/company/company.ts").Company | null | undefined): number {
    const companyRef = company ?? null;
    const slots = getFormationSlots(companyRef);
    const activeCount = getActiveSlots(company ?? null);
    const activeSoldiers = slots
      .slice(0, activeCount)
      .map((id) => (id ? getSoldierById(companyRef, id) : null))
      .filter((s): s is Soldier => s != null);
    const source = activeSoldiers.length > 0 ? activeSoldiers : (company?.soldiers ?? []);
    const enemyBase = getEnemyLevelFromActiveSquad(source);
    return Math.max(1, Math.min(20, enemyBase - 1));
  }

  function hasValidRecruitMarketComposition(soldiers: Soldier[]): boolean {
    if (soldiers.length !== 10) return false;
    const rifle = soldiers.filter((s) => s.designation === "rifleman").length;
    const medic = soldiers.filter((s) => s.designation === "medic").length;
    const support = soldiers.filter((s) => s.designation === "support").length;
    return rifle === 6 && medic === 2 && support === 2;
  }

  function hasExpectedRecruitLevel(soldiers: Soldier[], expectedLevel: number): boolean {
    return soldiers.every((s) => (s.level ?? 1) === expectedLevel);
  }

  function createSetupScreen() {
    const steps = parseHTML(gameSetupTemplate);
    center.appendChild(steps as Element);
    hide.menu();
    show.center();

    _AudioManager.Intro().stop();
    _AudioManager
      .Setup()
      .play()
      .catch((e) => {
        console.error("Failed to play setup:", e);
      });

    DomEventManager.initEventArray(ec().gameSetup());
  }

  function createConfirmationScreen() {
    const store = usePlayerCompanyStore.getState();

    const companyName = store.companyName;
    const commanderName = store.commanderName;
    const companyUnitPatchURL = store.companyUnitPatchURL;

    const content = parseHTML(
      setupConfirmationTemplate(
        commanderName,
        companyName,
        companyUnitPatchURL,
      ),
    );

    UiManager.clear.center();
    center.appendChild(content as Element);

    DomEventManager.initEventArray(ec().confirmationScreen());

    show.center();
  }

  function createMainMenu() {
    UiManager.clear.center();

    const content = parseHTML(mainMenuTemplate());
    g_menu.appendChild(content as Element);

    DomEventManager.initEventArray(ec().mainMenu());
  }

  function createCompanyHomePage() {
    UiManager.clear.center();

    const content = parseHTML(companyHomePageTemplate());
    center.appendChild(content as Element);

    UiManager.selectCompanyHomeButton(DOM.company.home);
    DomEventManager.initEventArray(ec().companyHome());
    DomEventManager.initEquipSlotTooltipHideOnClick();
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createMarketPage() {
    UiManager.clear.center();

    const content = parseHTML(marketTemplate());
    center.appendChild(content as Element);

    DomEventManager.initEventArray(ec().companyHome().concat(ec().market()));

    Styler.setCenterBG("bg_store_88.jpg", true);
  }

  function createMissionsPage(mode?: "menu" | "normal" | "epic" | "dev") {
    UiManager.clear.center();
    const store = usePlayerCompanyStore.getState();
    store.setMissionsViewMode(mode ?? "menu");
    store.ensureMissionBoard();
    const missions = usePlayerCompanyStore.getState().missionBoard ?? [];
    const companyLevel = usePlayerCompanyStore.getState().companyLevel ?? 1;
    const activeMode = usePlayerCompanyStore.getState().missionsViewMode ?? "menu";
    const devMissions = activeMode === "dev" ? generateDevTestMissions() : [];
    const content = parseHTML(missionsTemplate(missions, companyLevel, activeMode, devMissions));
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().missionsScreen()));
    UiManager.selectCompanyHomeButton(DOM.company.missions);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createReadyRoomPage(mission?: Mission | null) {
    if (mission?.isDevTest) {
      createCombatPage(mission);
      return;
    }
    UiManager.clear.center();
    usePlayerCompanyStore.getState().moveZeroEnergySoldiersToReserve();
    const content = parseHTML(readyRoomTemplate(mission ?? null));
    center.appendChild(content as Element);
    setTimeout(clearLastEquipMoveSoldierIds, 450);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().readyRoomScreen()));
    UiManager.selectCompanyHomeButton(DOM.company.missions);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createCombatPage(mission?: Mission | null) {
    UiManager.clear.center();
    let players: ReturnType<typeof soldierToCombatant>[] = [];
    let enemies: ReturnType<typeof soldierToCombatant>[] = [];
    if (mission?.isDevTest) {
      const dev = createDevCombatants(mission);
      players = dev.players;
      enemies = dev.enemies;
    } else {
      const store = usePlayerCompanyStore.getState();
      const company = store.company;
      const activeCount = getActiveSlots(company);
      const formationSlots = getFormationSlots(company);
      const activeSoldiers = formationSlots
        .slice(0, activeCount)
        .map((id) => (id ? getSoldierById(company, id) : null))
        .filter((s): s is NonNullable<typeof s> => s != null);
      players = activeSoldiers.map((s) => soldierToCombatant(s));
      const enemyCount = mission?.enemyCount ?? 4;
      const enemyBaseLevel = getEnemyLevelFromActiveSquad(activeSoldiers);
      const isEpicMission = !!(mission?.isEpic ?? mission?.rarity === "epic");
      const manhuntTargetIndex =
        mission?.kind === "manhunt" && enemyCount > 0
          ? Math.floor(Math.random() * enemyCount)
          : undefined;
      const shuffledEnemyIndices = Array.from({ length: enemyCount }, (_, i) => i);
      for (let i = shuffledEnemyIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = shuffledEnemyIndices[i];
        shuffledEnemyIndices[i] = shuffledEnemyIndices[j];
        shuffledEnemyIndices[j] = t;
      }
      const supportIndex = shuffledEnemyIndices[0] ?? 0;
      const medicIndex = enemyCount >= 2 ? (shuffledEnemyIndices[1] ?? 1) : -1;
      const ENEMY_SLOT_ORDER = [0, 1, 2, 3, 5, 6, 4, 7];
      enemies = Array.from({ length: enemyCount }, (_, i) => {
        const c = createEnemyCombatant(
          i,
          enemyCount,
          enemyBaseLevel,
          isEpicMission,
          mission?.kind,
          manhuntTargetIndex,
          { supportIndex, medicIndex },
        );
        c.enemySlotIndex = ENEMY_SLOT_ORDER[i] ?? (i % 8);
        return c;
      });
    }
    const content = parseHTML(combatTemplate(mission ?? null, players, enemies));
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().combatScreen(players, enemies)));
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createTroopsPage() {
    UiManager.clear.center();
    const {
      marketAvailableTroops,
      setMarketAvailableTroops,
      company,
      highestRecruitLevelAchieved,
      setHighestRecruitLevelAchieved,
    } =
      usePlayerCompanyStore.getState();

    let soldiers: Soldier[];
    const computedRecruitLevel = getRecruitLevelFromCompany(company);
    const recruitLevel = Math.max(highestRecruitLevelAchieved ?? 1, computedRecruitLevel);
    if (recruitLevel > (highestRecruitLevelAchieved ?? 1)) {
      setHighestRecruitLevelAchieved(recruitLevel);
    }

    if (
      !marketAvailableTroops.length
      || !hasValidRecruitMarketComposition(marketAvailableTroops)
      || !hasExpectedRecruitLevel(marketAvailableTroops, recruitLevel)
    ) {
      soldiers = SoldierManager.generateTroopList(recruitLevel);
      setMarketAvailableTroops(soldiers);
    } else {
      soldiers = marketAvailableTroops;
    }

    const content = parseHTML(troopsMarketTemplate(soldiers));
    center.appendChild(content as Element);

    DomEventManager.initEventArray(ec().companyHome().concat(ec().troopsScreen()));

    UiManager.selectCompanyHomeButton(DOM.company.market);
    Styler.setCenterBG("bg_76.jpg", true);
  }

  function ensureMarketTierInitialized() {
    const store = usePlayerCompanyStore.getState();
    if (!store.marketTierLevel) {
      const max = getMaxSoldierLevel(store.company);
      store.setMarketTierLevel(max);
    }
  }

  function createWeaponsMarketPage() {
    UiManager.clear.center();
    ensureMarketTierInitialized();
    const content = parseHTML(weaponsMarketTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().market()));
    DomEventManager.initDelegatedEventArray(center as HTMLElement, ec().weaponsScreen(), "weapons-screen");
    UiManager.selectCompanyHomeButton(DOM.company.market);
    Styler.setCenterBG("bg_76.jpg", true);
    show.center();
  }

  function createArmorMarketPage() {
    UiManager.clear.center();
    ensureMarketTierInitialized();
    const content = parseHTML(armorMarketTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().market()));
    DomEventManager.initDelegatedEventArray(center as HTMLElement, ec().armorScreen(), "armor-screen");
    UiManager.selectCompanyHomeButton(DOM.company.market);
    Styler.setCenterBG("bg_76.jpg", true);
    show.center();
  }

  function createDevCatalogPage() {
    UiManager.clear.center();
    ensureMarketTierInitialized();
    const content = parseHTML(devCatalogMarketTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().market()));
    DomEventManager.initDelegatedEventArray(center as HTMLElement, ec().devCatalogScreen(), "dev-catalog-screen");
    UiManager.selectCompanyHomeButton(DOM.company.market);
    Styler.setCenterBG("bg_76.jpg", true);
    show.center();
  }

  function createSuppliesMarketPage() {
    UiManager.clear.center();
    ensureMarketTierInitialized();
    const content = parseHTML(suppliesMarketTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().market()));
    DomEventManager.initDelegatedEventArray(center as HTMLElement, ec().suppliesScreen(), "supplies-screen");
    UiManager.selectCompanyHomeButton(DOM.company.market);
    Styler.setCenterBG("bg_76.jpg", true);
    show.center();
  }

  function createFormationPage() {
    UiManager.clear.center();
    const content = parseHTML(formationTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().formationScreen()));
    UiManager.selectCompanyHomeButton(DOM.company.roster);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createRosterPage() {
    usePlayerCompanyStore.getState().syncSoldierLevelsFromExperience?.();
    const target = document.getElementById("g-center");
    if (!target) {
      console.error("[Roster] #g-center not found");
      return;
    }
    target.innerHTML = "";
    let html: string;
    try {
      html = rosterTemplate();
    } catch (err) {
      console.error("[Roster] rosterTemplate() threw:", err);
      try {
        html = `<div id="roster-screen" class="roster-root troops-market-root">
          ${companyHeaderPartial("Company Roster")}
          <div class="roster-main"><p>Roster failed to load.</p></div>
          ${companyActionsTemplate()}
        </div>`;
      } catch (innerErr) {
        console.error("[Roster] Fallback also threw:", innerErr);
        html = '<div id="roster-screen" style="padding:20px;color:white;"><p>Roster error.</p></div>';
      }
    }
    if (!html || !html.trim()) {
      html = '<div id="roster-screen" style="padding:20px;color:white;"><p>Roster empty.</p></div>';
    }
    target.innerHTML = html;
    DomEventManager.initEventArray(ec().companyHome().concat(ec().rosterScreen()));
    DomEventManager.initDelegatedEventArray(document, ec().equipPicker(), "equip-picker");
    DomEventManager.initEquipSlotTooltipHideOnClick();
    UiManager.selectCompanyHomeButton(DOM.company.roster);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createInventoryPage() {
    usePlayerCompanyStore.getState().syncSoldierLevelsFromExperience?.();
    UiManager.clear.center();
    const content = parseHTML(inventoryTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().inventoryScreen()));
    DomEventManager.initDelegatedEventArray(document, ec().equipPicker(), "equip-picker");
    DomEventManager.initEquipSlotTooltipHideOnClick();
    UiManager.selectCompanyHomeButton(DOM.company.inventory);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createMemorialPage() {
    UiManager.clear.center();
    const content = parseHTML(memorialTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().memorialScreen()));
    UiManager.selectCompanyHomeButton(DOM.company.heroes);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createTrainingPage() {
    UiManager.clear.center();
    const content = parseHTML(trainingTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().trainingScreen()));
    UiManager.selectCompanyHomeButton(DOM.company.training);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createAbilitiesPage() {
    UiManager.clear.center();
    const content = parseHTML(abilitiesTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().abilitiesScreen()));
    UiManager.selectCompanyHomeButton(DOM.company.abilities);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  return {
    generate: {
      setupScreen: () => createSetupScreen(),
      confirmScreen: () => createConfirmationScreen(),
      mainMenu: () => createMainMenu(),
      companyHomePage: () => createCompanyHomePage(),
      createMarketPage,
      createTroopsPage,
      createWeaponsMarketPage,
      createArmorMarketPage,
      createDevCatalogPage,
      createSuppliesMarketPage,
      createMissionsPage,
      createReadyRoomPage,
      createCombatPage,
      createRosterPage,
      createFormationPage,
      createInventoryPage,
      createMemorialPage,
      createTrainingPage,
      createAbilitiesPage,
    },
  };
}

const singleton = ScreenManager();

export { singleton as ScreenManager };
  const DEV_TEST_LEVEL = 999;
  const DEV_TEST_GEAR_LEVEL = 999 as import("../../constants/items/types.ts").GearLevel;
  const DEV_TEST_SQUAD: Designation[] = ["rifleman", "rifleman", "support", "medic"];

  function getDevWeaponBaseId(designation: Designation): string {
    if (designation === "support") return "suppressor_mg";
    if (designation === "medic") return "field_medic_smg";
    return "stinger_smg";
  }

  function getDevArmorBaseId(designation: Designation): string {
    if (designation === "support") return "ironclad_resolve";
    if (designation === "medic") return "revenant_shell";
    return "vipers_embrace";
  }

  function createDevSoldier(designation: Designation, index: number, side: "player" | "enemy"): Soldier {
    const weaponBaseId = getDevWeaponBaseId(designation);
    const armorBaseId = getDevArmorBaseId(designation);
    const weaponBase = RARE_WEAPON_BASES.find((b) => b.baseId === weaponBaseId) ?? RARE_WEAPON_BASES[0];
    const armorBase = RARE_ARMOR_BASES.find((b) => b.baseId === armorBaseId) ?? RARE_ARMOR_BASES[0];
    const weapon = createRareWeapon(weaponBase, DEV_TEST_GEAR_LEVEL);
    const armor = createRareArmor(armorBase, DEV_TEST_GEAR_LEVEL);
    const soldier = SoldierManager.generateSoldierAtLevel(
      20,
      designation,
      armor as import("../../constants/items/types.ts").Armor,
      weapon as import("../../constants/items/types.ts").BallisticWeapon,
      [],
    );
    for (let lvl = 21; lvl <= DEV_TEST_LEVEL; lvl++) {
      SoldierManager.levelUpSoldier(soldier, lvl);
    }
    SoldierManager.refreshCombatProfile(soldier);
    soldier.level = DEV_TEST_LEVEL;
    soldier.name = `${side === "player" ? "Dev" : "Enemy"} ${designation.charAt(0).toUpperCase() + designation.slice(1)} ${index + 1}`;
    soldier.weapon = { ...(soldier.weapon ?? {}), ...weapon, level: DEV_TEST_GEAR_LEVEL };
    soldier.armor = { ...(soldier.armor ?? {}), ...armor, level: DEV_TEST_GEAR_LEVEL };
    const frag = {
      ...ThrowableItems.common.m3_frag_grenade,
      level: DEV_TEST_GEAR_LEVEL,
      damage: getScaledThrowableDamage(ThrowableItems.common.m3_frag_grenade.damage ?? 30, DEV_TEST_LEVEL),
    };
    const smoke = { ...ThrowableItems.common.mk18_smoke, level: DEV_TEST_GEAR_LEVEL };
    const medkit = { ...MedicalItems.common.standard_medkit, level: DEV_TEST_GEAR_LEVEL };
    soldier.inventory = designation === "medic"
      ? [medkit, frag, smoke]
      : [frag, smoke];
    return soldier;
  }

  function createDevCombatants(mission: Mission): { players: ReturnType<typeof soldierToCombatant>[]; enemies: ReturnType<typeof soldierToCombatant>[] } {
    const squadSize = Math.max(1, Math.min(4, mission.forcedSquadSize ?? 4));
    const playerSoldiers = DEV_TEST_SQUAD.slice(0, squadSize).map((d, i) => createDevSoldier(d, i, "player"));
    const enemySoldiers = DEV_TEST_SQUAD.slice(0, squadSize).map((d, i) => createDevSoldier(d, i, "enemy"));
    const players = playerSoldiers.map((s) => soldierToCombatant(s));
    const redKeys = Object.keys(Images.red_portrait);
    const enemies = enemySoldiers.map((s, i) => {
      const c = soldierToCombatant(s);
      c.side = "enemy";
      c.id = `dev-enemy-${i}-${Date.now()}`;
      c.enemySlotIndex = i;
      c.soldierRef = undefined;
      c.avatar = Images.red_portrait[redKeys[i % redKeys.length] as keyof typeof Images.red_portrait];
      const isEnemyMedic = (c.designation ?? "").toLowerCase() === "medic";
      if (isEnemyMedic) {
        const medkit = (s.inventory ?? []).find((item) => item.id === "standard_medkit");
        c.enemyMedkitUses = medkit ? Math.min(2, (medkit.uses ?? medkit.quantity ?? 1)) : 0;
        c.enemyMedkitLevel = Math.max(1, Math.min(20, medkit?.level ?? 20));
      } else {
        c.enemyMedkitUses = 0;
        c.enemyMedkitLevel = undefined;
      }
      return c;
    });
    return { players, enemies };
  }
