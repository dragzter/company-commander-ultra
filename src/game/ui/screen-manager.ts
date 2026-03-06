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
import { careerTemplate } from "../html-templates/career-template.ts";
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
import {
  buildCombatSummaryData,
  combatSummaryTemplate,
} from "../html-templates/combat-summary-template.ts";
import {
  soldierToCombatant,
  createEnemyCombatant,
} from "../combat/combatant-utils.ts";
import {
  getActiveSlots,
  getFormationSlots,
  getSoldierById,
} from "../../constants/company-slots.ts";
import { getMaxSoldierLevel } from "../../utils/company-utils.ts";
import { getAverageCompanyLevel } from "../../utils/company-utils.ts";
import { Styler } from "../../utils/styler-manager.ts";
import { SoldierManager } from "../entities/soldier/soldier-manager.ts";
import type { Designation, Soldier } from "../entities/types.ts";
import type { Mission } from "../../constants/missions.ts";
import { generateDevTestMissions } from "../../services/missions/mission-generator.ts";
import {
  getStandardMissionEncounter,
  normalizeEncounterForMission,
} from "../../services/missions/mission-scenarios.ts";
import {
  createCareerMission,
  getCareerActiveSoldiers,
  isCareerUnlocked,
} from "../../services/missions/career-mode.ts";
import {
  RARE_WEAPON_BASES,
  createRareWeapon,
} from "../../constants/items/rare-weapon-bases.ts";
import {
  RARE_ARMOR_BASES,
  createRareArmor,
} from "../../constants/items/rare-armor-bases.ts";
import { MedicalItems } from "../../constants/items/medical-items.ts";
import { ThrowableItems } from "../../constants/items/throwable.ts";
import { getScaledThrowableDamage } from "../../constants/items/throwable-scaling.ts";
import { Images } from "../../constants/images.ts";
import type { EarnedTraitAward } from "../../constants/veterancy-traits.ts";

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

  function alignCareerCompanyArrowToMission(): void {
    const ladder = center.querySelector(".career-ladder") as HTMLElement | null;
    const missionCard = ladder?.querySelector(
      ".career-mission-card-current",
    ) as HTMLElement | null;
    const companyCard = ladder?.querySelector(
      ".career-company-card",
    ) as HTMLElement | null;
    if (!ladder || !missionCard || !companyCard) return;

    const missionRect = missionCard.getBoundingClientRect();
    const companyRect = companyCard.getBoundingClientRect();
    if (missionRect.height <= 0 || companyRect.height <= 0) return;

    // Mission connector is centered vertically on the mission card.
    const missionConnectorY = missionRect.top + missionRect.height / 2;
    const relativeY = missionConnectorY - companyRect.top;
    const clampedY = Math.max(10, Math.min(companyRect.height - 10, relativeY));
    companyCard.style.setProperty(
      "--career-company-arrow-y",
      `${Math.round(clampedY)}px`,
    );
  }

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

  function getRecruitLevelFromCompany(
    company:
      | import("../entities/company/company.ts").Company
      | null
      | undefined,
  ): number {
    const companyRef = company ?? null;
    const slots = getFormationSlots(companyRef);
    const activeCount = getActiveSlots(company ?? null);
    const activeSoldiers = slots
      .slice(0, activeCount)
      .map((id) => (id ? getSoldierById(companyRef, id) : null))
      .filter((s): s is Soldier => s != null);
    const source =
      activeSoldiers.length > 0 ? activeSoldiers : (company?.soldiers ?? []);
    const enemyBase = getEnemyLevelFromActiveSquad(source);
    return Math.max(1, Math.min(999, enemyBase - 1));
  }

  function hasValidRecruitMarketComposition(soldiers: Soldier[]): boolean {
    if (soldiers.length !== 10) return false;
    const rifle = soldiers.filter((s) => s.designation === "rifleman").length;
    const medic = soldiers.filter((s) => s.designation === "medic").length;
    const support = soldiers.filter((s) => s.designation === "support").length;
    return rifle === 6 && medic === 2 && support === 2;
  }

  function hasExpectedRecruitLevel(
    soldiers: Soldier[],
    expectedLevel: number,
  ): boolean {
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
    Styler.setCenterBG("home_2.png", true);
    show.center();
  }

  function createMarketPage() {
    UiManager.clear.center();

    const content = parseHTML(marketTemplate());
    center.appendChild(content as Element);

    DomEventManager.initEventArray(ec().companyHome().concat(ec().market()));

    Styler.setCenterBG("bg_store_88.jpg", true);
  }

  function createMissionsPage(mode?: "menu" | "normal" | "epic" | "career" | "dev") {
    UiManager.clear.center();
    const store = usePlayerCompanyStore.getState();
    const onboardingFirstMission = !!store.onboardingFirstMissionPending;
    if (
      mode &&
      mode !== "career" &&
      store.missionsResumeStep === "career"
    ) {
      store.setMissionsResumeState("all", null);
    }
    store.setMissionsViewMode(
      onboardingFirstMission ? "normal" : (mode ?? "menu"),
    );
    store.ensureMissionBoard();
    const createOnboardingSkirmish = (): Mission => ({
      id: "onboarding_skirmish_1",
      kind: "skirmish",
      factionId: "desert_wolves",
      environmentId: "city",
      battleBackground: "city_1.png",
      name: "Urban Skirmish",
      difficulty: 1,
      enemyCount: 3,
      creditReward: 120,
      xpReward: 40,
      flavorText:
        "Hostile scouts have entered the sector. Engage and eliminate all enemy soldiers.",
      rarity: "normal",
      encounter: {
        initialEnemyCount: 3,
        totalEnemyCount: 3,
        maxConcurrentEnemies: 8,
        reinforceIntervalMs: 0,
        reinforceSetupMs: 2000,
        rolesInitial: { rifleman: 3, medic: 0, support: 0 },
        rolesReinforcement: { rifleman: 0, medic: 0, support: 0 },
        medicHealsPerMedic: 0,
        supportSuppressUses: 0,
        eliteCount: 0,
        grenadeThrowers: 0,
      },
      rewardItems: [],
    });
    const missions = onboardingFirstMission
      ? [normalizeEncounterForMission(createOnboardingSkirmish())]
      : (usePlayerCompanyStore.getState().missionBoard ?? []);
    const companyLevel = usePlayerCompanyStore.getState().companyLevel ?? 1;
    const activeMode =
      usePlayerCompanyStore.getState().missionsViewMode ?? "menu";
    const resumeStep = usePlayerCompanyStore.getState().missionsResumeStep;
    const initialKindFilter =
      activeMode === "normal" &&
      (resumeStep === "all" ||
        resumeStep === "defend_objective" ||
        resumeStep === "skirmish" ||
        resumeStep === "manhunt")
        ? resumeStep
        : "all";
    const devMissions = activeMode === "dev" ? generateDevTestMissions() : [];
    const content = parseHTML(
      missionsTemplate(
        missions,
        companyLevel,
        activeMode,
        devMissions,
        initialKindFilter,
      ),
    );
    center.appendChild(content as Element);
    DomEventManager.initEventArray(
      ec().companyHome().concat(ec().missionsScreen()),
    );
    UiManager.selectCompanyHomeButton(DOM.company.missions);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createCareerPage() {
    UiManager.clear.center();
    const store = usePlayerCompanyStore.getState();
    store.setMissionsViewMode("career");
    store.setMissionsResumeState("career", null);
    const company = store.company;
    const unlocked = isCareerUnlocked(
      company,
      !!store.onboardingFirstMissionPending,
    );
    const level = Math.max(1, Math.floor(store.careerCurrentLevel ?? 1));
    const mission = createCareerMission(company, level);
    const nextMission = createCareerMission(company, level + 1);
    const activeSoldiers = getCareerActiveSoldiers(company);
    const companyName = (store.companyName || company?.name || "Unnamed Company").trim();
    const companyLvl = company?.level ?? store.companyLevel ?? 1;
    const avgSoldierLevel = getAverageCompanyLevel(company);
    const content = parseHTML(
      careerTemplate({
        mission,
        nextMission,
        unlocked,
        activeSoldierCount: activeSoldiers.length,
        companyName,
        companyLevel: companyLvl,
        averageSoldierLevel: avgSoldierLevel,
        careerLevel: level,
        bestLevel: Math.max(store.careerBestLevel ?? 1, level),
        totalCareerWins: store.totalCareerMissionsCompleted ?? 0,
        animateAdvance: !!store.careerAdvanceAnimationPending,
        companyPatchUrl: store.companyUnitPatchURL,
      }),
    );
    center.appendChild(content as Element);
    DomEventManager.initEventArray(
      ec().companyHome().concat(ec().careerScreen()),
    );
    window.requestAnimationFrame(() => {
      alignCareerCompanyArrowToMission();
      window.setTimeout(alignCareerCompanyArrowToMission, 120);
    });
    UiManager.selectCompanyHomeButton(DOM.company.missions);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
    if (store.careerAdvanceAnimationPending) {
      window.setTimeout(
        () => usePlayerCompanyStore.getState().setCareerAdvanceAnimationPending(false),
        760,
      );
    }
  }

  function createReadyRoomPage(mission?: Mission | null) {
    const resolvedMission =
      mission?.isCareer
        ? createCareerMission(
            usePlayerCompanyStore.getState().company,
            mission.careerLevel ?? usePlayerCompanyStore.getState().careerCurrentLevel ?? 1,
          )
        : mission;
    if (resolvedMission?.isDevTest) {
      createCombatPage(resolvedMission);
      return;
    }
    if (resolvedMission) {
      usePlayerCompanyStore
        .getState()
        .setMissionsResumeState("ready_room", resolvedMission);
    }
    const isRefresh = document.getElementById("ready-room-screen") != null;
    UiManager.clear.center();
    // Only auto-normalize zero-energy soldiers on first entry from missions.
    // Do not run on in-screen re-renders (swap/move), or it can undo user moves.
    if (!isRefresh) {
      usePlayerCompanyStore.getState().moveZeroEnergySoldiersToReserve();
    }
    const content = parseHTML(readyRoomTemplate(resolvedMission ?? null));
    center.appendChild(content as Element);
    setTimeout(clearLastEquipMoveSoldierIds, 450);
    DomEventManager.initEventArray(
      ec().companyHome().concat(ec().readyRoomScreen()),
    );
    UiManager.selectCompanyHomeButton(DOM.company.missions);
    const missionBattleBg = resolvedMission?.battleBackground;
    if (missionBattleBg) {
      Styler.setCenterBG(`battle_bg/${missionBattleBg}`, true);
    } else {
      Styler.setCenterBG("bg_81.jpg", true);
    }
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
      const normalizedMission = mission
        ? normalizeEncounterForMission(mission)
        : null;
      const store = usePlayerCompanyStore.getState();
      const company = store.company;
      const activeCount = getActiveSlots(company);
      const formationSlots = getFormationSlots(company);
      const activeSoldiers = formationSlots
        .slice(0, activeCount)
        .map((id) => (id ? getSoldierById(company, id) : null))
        .filter((s): s is NonNullable<typeof s> => s != null);
      players = activeSoldiers.map((s) => soldierToCombatant(s));
      const isCareerMission = !!normalizedMission?.isCareer;
      const encounter = normalizedMission?.encounter ??
        (normalizedMission
          ? getStandardMissionEncounter(
              normalizedMission.kind,
              normalizedMission.difficulty,
            )
          : undefined);
      const careerEncounter =
        isCareerMission && normalizedMission
          ? createCareerMission(company, normalizedMission.careerLevel ?? 1)
              .encounter
          : undefined;
      const finalEncounter = careerEncounter ?? encounter;
      const mirroredCareerRoles: Designation[] = isCareerMission
        ? players.map((p) =>
            p.designation === "medic" || p.designation === "support"
              ? p.designation
              : "rifleman",
          )
        : [];
      const enemyCount = isCareerMission
        ? Math.max(1, mirroredCareerRoles.length)
        : (finalEncounter?.initialEnemyCount ?? normalizedMission?.enemyCount ?? 4);
      const enemyBaseLevel =
        isCareerMission && normalizedMission
          ? Math.max(1, Math.min(999, normalizedMission.careerLevel ?? 1))
          : getEnemyLevelFromActiveSquad(activeSoldiers);
      const isEpicMission = !!(normalizedMission?.isEpic ?? normalizedMission?.rarity === "epic");
      const roles: Designation[] = [];
      if (isCareerMission) {
        roles.push(...mirroredCareerRoles);
      } else if (finalEncounter) {
        for (let i = 0; i < finalEncounter.rolesInitial.rifleman; i++)
          roles.push("rifleman");
        for (let i = 0; i < finalEncounter.rolesInitial.support; i++)
          roles.push("support");
        for (let i = 0; i < finalEncounter.rolesInitial.medic; i++)
          roles.push("medic");
      }
      while (roles.length < enemyCount) roles.push("rifleman");
      roles.length = enemyCount;
      for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = roles[i];
        roles[i] = roles[j];
        roles[j] = t;
      }
      const eliteCount = Math.max(0, finalEncounter?.eliteCount ?? 0);
      const eliteIndices = new Set<number>();
      if (eliteCount > 0) {
        const idxPool = Array.from({ length: enemyCount }, (_, i) => i);
        for (let i = 0; i < eliteCount && idxPool.length > 0; i++) {
          const pickAt = Math.floor(Math.random() * idxPool.length);
          eliteIndices.add(idxPool[pickAt]);
          idxPool.splice(pickAt, 1);
        }
      }
      const ENEMY_SLOT_ORDER = [0, 1, 2, 3, 5, 6, 4, 7];
      enemies = Array.from({ length: enemyCount }, (_, i) => {
        const role = roles[i] ?? "rifleman";
        const isManhuntElite =
          normalizedMission?.kind === "manhunt" && eliteIndices.has(i);
        const c = createEnemyCombatant(
          i,
          enemyCount,
          enemyBaseLevel,
          isEpicMission,
          normalizedMission?.kind,
          isManhuntElite ? i : undefined,
          undefined,
          {
            designation: role,
            isManhuntTarget: isManhuntElite,
            factionId: normalizedMission?.factionId,
          },
        );
        const isMedic = role === "medic";
        const isSupport = role === "support";
        c.enemyMedkitUses = isMedic
          ? (finalEncounter?.medicHealsPerMedic ?? c.enemyMedkitUses ?? 0)
          : 0;
        c.enemySuppressUses = isSupport
          ? (finalEncounter?.supportSuppressUses ?? 0)
          : 0;
        c.enemyGrenadeThrowsRemaining = 0;
        c.enemySlotIndex = ENEMY_SLOT_ORDER[i] ?? i % 8;
        return c;
      });
      if (finalEncounter && finalEncounter.grenadeThrowers > 0 && enemyCount > 0) {
        const grenadeCandidates =
          normalizedMission?.kind === "manhunt"
            ? enemies.filter((e) => e.isManhuntTarget)
            : enemies.filter((e) => e.hp > 0 && !e.downState);
        const pool = grenadeCandidates.length > 0 ? grenadeCandidates : enemies;
        for (
          let i = 0;
            i < Math.min(finalEncounter.grenadeThrowers, pool.length);
          i++
        ) {
          const idx = Math.floor(Math.random() * pool.length);
          const selected = pool[idx];
          selected.enemyGrenadeThrowsRemaining = Math.max(
            1,
            selected.enemyGrenadeThrowsRemaining ?? 0,
          );
          pool.splice(idx, 1);
        }
      }
    }
    const content = parseHTML(
      combatTemplate(mission ?? null, players, enemies),
    );
    center.appendChild(content as Element);
    DomEventManager.initEventArray(
      ec().companyHome().concat(ec().combatScreen(players, enemies)),
    );
    if (mission?.id?.startsWith("dev-trait-summary-preview-")) {
      const beginBtn = document.getElementById("combat-begin");
      const beginOverlay = document.getElementById("combat-begin-overlay");
      if (beginBtn) (beginBtn as HTMLElement).style.display = "none";
      if (beginOverlay) (beginOverlay as HTMLElement).style.display = "none";

      const playerKills = new Map<string, number>();
      const newLevels = new Map<string, number>();
      const xpEarnedBySoldier = new Map<string, number>();
      const soldiersAfterCombat = new Map<string, Soldier>();
      const newTraitAwardsBySoldier = new Map<string, EarnedTraitAward[]>();

      for (let i = 0; i < players.length; i++) {
        const p = players[i];
        playerKills.set(p.id, i === 0 ? 3 : i === 1 ? 2 : 1);
        newLevels.set(p.id, p.level ?? 1);
        xpEarnedBySoldier.set(p.id, i === 0 ? 72 : i === 1 ? 48 : 31);
        if (p.soldierRef) {
          soldiersAfterCombat.set(p.id, {
            ...p.soldierRef,
            experience:
              (p.soldierRef.experience ?? 0) +
              (xpEarnedBySoldier.get(p.id) ?? 0),
          });
        }
      }

      if (players[0]) {
        newTraitAwardsBySoldier.set(players[0].id, [
          {
            id: "hard_to_kill",
            name: "Hard To Kill",
            kind: "positive",
            flavor: "Refuses to go down clean.",
            description: "Hard To Kill",
            stats: { toughness: 4 },
            grenadeHitBonusPct: 0,
          },
        ]);
      }
      if (players[1]) {
        newTraitAwardsBySoldier.set(players[1].id, [
          {
            id: "shattered_kneecap",
            name: "Shattered Kneecap",
            kind: "mixed",
            flavor: "The knee healed wrong, the grit didn't.",
            description: "Shattered Kneecap",
            stats: { dexterity: -4, toughness: 1 },
            grenadeHitBonusPct: 0,
          },
          {
            id: "grenadier",
            name: "Grenadier",
            kind: "positive",
            flavor: "Knows exactly where to place the blast.",
            description: "Grenadier",
            stats: {},
            grenadeHitBonusPct: 0.02,
          },
        ]);
      }

      const summaryData = buildCombatSummaryData(
        true,
        mission,
        players,
        playerKills,
        0,
        [{ ...MedicalItems.common.standard_medkit, level: 20 }],
        [{ ...ThrowableItems.common.incendiary_grenade, level: 20 }],
        new Set<string>(),
        newLevels,
        soldiersAfterCombat,
        xpEarnedBySoldier,
        86,
        1280,
        2,
        newTraitAwardsBySoldier,
      );
      const container = document.getElementById("combat-summary-container");
      if (container) {
        container.innerHTML = combatSummaryTemplate(summaryData);
        const overlay = container.querySelector(
          ".combat-summary-overlay",
        ) as HTMLElement | null;
        if (overlay) overlay.classList.add("combat-summary-visible");
      }
    }
    const missionBattleBg = mission?.battleBackground;
    if (missionBattleBg) {
      Styler.setCenterBG(`battle_bg/${missionBattleBg}`, true);
    } else {
      Styler.setCenterBG("bg_81.jpg", true);
    }
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
      onboardingRecruitStep,
      onboardingRecruitSoldier,
      setOnboardingRecruitSoldier,
    } = usePlayerCompanyStore.getState();

    let soldiers: Soldier[];
    const guidedRecruit =
      onboardingRecruitStep === "troops_recruit" ||
      onboardingRecruitStep === "troops_confirm";
    const computedRecruitLevel = getRecruitLevelFromCompany(company);
    const recruitLevel = Math.max(
      highestRecruitLevelAchieved ?? 1,
      computedRecruitLevel,
    );
    if (recruitLevel > (highestRecruitLevelAchieved ?? 1)) {
      setHighestRecruitLevelAchieved(recruitLevel);
    }

    if (guidedRecruit) {
      let guided = onboardingRecruitSoldier;
      if (!guided) {
        const trait =
          SoldierManager.getSoldierTraitProfileByName("sharpshooter");
        guided = SoldierManager.getNewSupportMan(recruitLevel, trait);
        setOnboardingRecruitSoldier(guided);
      }
      soldiers = [guided];
    } else {
      if (
        !marketAvailableTroops.length ||
        !hasValidRecruitMarketComposition(marketAvailableTroops) ||
        !hasExpectedRecruitLevel(marketAvailableTroops, recruitLevel)
      ) {
        soldiers = SoldierManager.generateTroopList(recruitLevel);
        setMarketAvailableTroops(soldiers);
      } else {
        soldiers = marketAvailableTroops;
      }
    }

    const content = parseHTML(troopsMarketTemplate(soldiers));
    center.appendChild(content as Element);

    DomEventManager.initEventArray(
      ec().companyHome().concat(ec().troopsScreen()),
    );

    UiManager.selectCompanyHomeButton(DOM.company.market);
    Styler.setCenterBG("bg_76.jpg", true);
  }

  function ensureMarketTierInitialized() {
    const store = usePlayerCompanyStore.getState();
    const max = Math.max(1, getMaxSoldierLevel(store.company));
    const current = store.marketTierLevel || 0;
    if (current < 1 || current > max) {
      store.setMarketTierLevel(max);
    }
  }

  function ensureDevCatalogTierInitialized() {
    const store = usePlayerCompanyStore.getState();
    if (!store.devCatalogTierLevel) {
      store.setDevCatalogTierLevel(1);
    }
  }

  function createWeaponsMarketPage() {
    UiManager.clear.center();
    ensureMarketTierInitialized();
    const content = parseHTML(weaponsMarketTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().market()));
    DomEventManager.initDelegatedEventArray(
      center as HTMLElement,
      ec().weaponsScreen(),
      "weapons-screen",
    );
    UiManager.selectCompanyHomeButton(DOM.company.market);
    Styler.setCenterBG("weapons_market.png", true);
    show.center();
  }

  function createArmorMarketPage() {
    UiManager.clear.center();
    ensureMarketTierInitialized();
    const content = parseHTML(armorMarketTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().market()));
    DomEventManager.initDelegatedEventArray(
      center as HTMLElement,
      ec().armorScreen(),
      "armor-screen",
    );
    UiManager.selectCompanyHomeButton(DOM.company.market);
    Styler.setCenterBG("armor_market.png", true);
    show.center();
  }

  function createDevCatalogPage() {
    UiManager.clear.center();
    ensureDevCatalogTierInitialized();
    const content = parseHTML(devCatalogMarketTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(ec().companyHome().concat(ec().market()));
    DomEventManager.initDelegatedEventArray(
      center as HTMLElement,
      ec().devCatalogScreen(),
      "dev-catalog-screen",
    );
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
    DomEventManager.initDelegatedEventArray(
      center as HTMLElement,
      ec().suppliesScreen(),
      "supplies-screen",
    );
    UiManager.selectCompanyHomeButton(DOM.company.market);
    Styler.setCenterBG("equipment_market.png", true);
    show.center();
  }

  function createFormationPage() {
    UiManager.clear.center();
    const content = parseHTML(formationTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(
      ec().companyHome().concat(ec().formationScreen()),
    );
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
        html =
          '<div id="roster-screen" style="padding:20px;color:white;"><p>Roster error.</p></div>';
      }
    }
    if (!html || !html.trim()) {
      html =
        '<div id="roster-screen" style="padding:20px;color:white;"><p>Roster empty.</p></div>';
    }
    target.innerHTML = html;
    DomEventManager.initEventArray(
      ec().companyHome().concat(ec().rosterScreen()),
    );
    DomEventManager.initDelegatedEventArray(
      document,
      ec().equipPicker(),
      "equip-picker",
    );
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
    DomEventManager.initEventArray(
      ec().companyHome().concat(ec().inventoryScreen()),
    );
    DomEventManager.initDelegatedEventArray(
      document,
      ec().equipPicker(),
      "equip-picker",
    );
    DomEventManager.initEquipSlotTooltipHideOnClick();
    UiManager.selectCompanyHomeButton(DOM.company.inventory);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createMemorialPage() {
    UiManager.clear.center();
    const content = parseHTML(memorialTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(
      ec().companyHome().concat(ec().memorialScreen()),
    );
    UiManager.selectCompanyHomeButton(DOM.company.heroes);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createTrainingPage() {
    UiManager.clear.center();
    const content = parseHTML(trainingTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(
      ec().companyHome().concat(ec().trainingScreen()),
    );
    UiManager.selectCompanyHomeButton(DOM.company.training);
    Styler.setCenterBG("bg_81.jpg", true);
    show.center();
  }

  function createAbilitiesPage() {
    UiManager.clear.center();
    const content = parseHTML(abilitiesTemplate());
    center.appendChild(content as Element);
    DomEventManager.initEventArray(
      ec().companyHome().concat(ec().abilitiesScreen()),
    );
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
      createCareerPage,
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
const DEV_TEST_GEAR_LEVEL =
  999 as import("../../constants/items/types.ts").GearLevel;
const DEV_TEST_SQUAD: Designation[] = [
  "rifleman",
  "rifleman",
  "support",
  "medic",
];

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

function createDevSoldier(
  designation: Designation,
  index: number,
  side: "player" | "enemy",
): Soldier {
  const weaponBaseId = getDevWeaponBaseId(designation);
  const armorBaseId = getDevArmorBaseId(designation);
  const weaponBase =
    RARE_WEAPON_BASES.find((b) => b.baseId === weaponBaseId) ??
    RARE_WEAPON_BASES[0];
  const armorBase =
    RARE_ARMOR_BASES.find((b) => b.baseId === armorBaseId) ??
    RARE_ARMOR_BASES[0];
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
  soldier.weapon = {
    ...(soldier.weapon ?? {}),
    ...weapon,
    level: DEV_TEST_GEAR_LEVEL,
  };
  soldier.armor = {
    ...(soldier.armor ?? {}),
    ...armor,
    level: DEV_TEST_GEAR_LEVEL,
  };
  const frag = {
    ...ThrowableItems.common.m3_frag_grenade,
    level: DEV_TEST_GEAR_LEVEL,
    damage: getScaledThrowableDamage(
      ThrowableItems.common.m3_frag_grenade.damage ?? 30,
      DEV_TEST_LEVEL,
    ),
  };
  const smoke = {
    ...ThrowableItems.common.mk18_smoke,
    level: DEV_TEST_GEAR_LEVEL,
  };
  const medkit = {
    ...MedicalItems.common.standard_medkit,
    level: DEV_TEST_GEAR_LEVEL,
  };
  soldier.inventory =
    designation === "medic" ? [medkit, frag, smoke] : [frag, smoke];
  return soldier;
}

function createDevCombatants(mission: Mission): {
  players: ReturnType<typeof soldierToCombatant>[];
  enemies: ReturnType<typeof soldierToCombatant>[];
} {
  const squadSize = Math.max(1, Math.min(4, mission.forcedSquadSize ?? 4));
  const playerSoldiers = DEV_TEST_SQUAD.slice(0, squadSize).map((d, i) =>
    createDevSoldier(d, i, "player"),
  );
  const enemySoldiers = DEV_TEST_SQUAD.slice(0, squadSize).map((d, i) =>
    createDevSoldier(d, i, "enemy"),
  );
  const players = playerSoldiers.map((s) => soldierToCombatant(s));
  const redKeys = Object.keys(Images.red_portrait);
  const enemies = enemySoldiers.map((s, i) => {
    const c = soldierToCombatant(s);
    c.side = "enemy";
    c.id = `dev-enemy-${i}-${Date.now()}`;
    c.enemySlotIndex = i;
    c.soldierRef = undefined;
    c.avatar =
      Images.red_portrait[
        redKeys[i % redKeys.length] as keyof typeof Images.red_portrait
      ];
    const isEnemyMedic = (c.designation ?? "").toLowerCase() === "medic";
    if (isEnemyMedic) {
      const medkit = (s.inventory ?? []).find(
        (item) => item.id === "standard_medkit",
      );
      c.enemyMedkitUses = medkit
        ? Math.min(2, medkit.uses ?? medkit.quantity ?? 1)
        : 0;
      c.enemyMedkitLevel = Math.max(1, Math.min(999, medkit?.level ?? 20));
    } else {
      c.enemyMedkitUses = 0;
      c.enemyMedkitLevel = undefined;
    }
    return c;
  });
  return { players, enemies };
}
