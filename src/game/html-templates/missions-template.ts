import {
  companyHeaderPartial,
  companyActionsTemplate,
} from "./game-setup-template.ts";
import type { Mission, MissionKind } from "../../constants/missions.ts";
import {
  DIFFICULTY_LABELS,
  MISSION_FACTION_META,
  MISSION_KIND_META,
  MISSION_KIND_ORDER,
} from "../../constants/missions.ts";
import { getRewardItemById } from "../../utils/reward-utils.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import { getDisplayEnemyCount } from "../../services/missions/mission-scenarios.ts";
import {
  isCareerUnlocked,
} from "../../services/missions/career-mode.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";

const ENEMY_COUNT_ICON = `<img src="/images/soldier_count.png" alt="" class="mission-enemies-icon" aria-hidden="true" width="20" height="24">`;
const MISSION_CARD_INSTRUCTION: Partial<Record<MissionKind, string>> = {
  skirmish: "Eliminate all hostile targets.",
  manhunt: "Neutralize the high-value target and clear remaining hostiles.",
  defend_objective: "Hold the objective until time expires or enemy forces break.",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type RewardEntry =
  | { type: "credits"; amount: number }
  | { type: "xp"; amount: number }
  | { type: "item"; id: string; iconUrl: string; quantity: number };

function buildRewardsEntries(m: Mission): RewardEntry[] {
  const entries: RewardEntry[] = [];
  entries.push({ type: "credits", amount: m.creditReward ?? 0 });
  const xp = m.xpReward ?? 20 * (m.difficulty ?? 1);
  entries.push({ type: "xp", amount: xp });
  const rewardIds = m.rewardItems ?? [];
  for (const id of rewardIds) {
    const item = getRewardItemById(id);
    if (item) {
      entries.push({
        type: "item",
        id,
        iconUrl: getItemIconUrl(item),
        quantity: 1,
      });
    }
  }
  return entries;
}

function missionCard(m: Mission): string {
  const meta = MISSION_KIND_META[m.kind] ?? {
    name: m.kind.replace(/_/g, " "),
    description: "",
  };
  const diffLabel = DIFFICULTY_LABELS[m.difficulty] ?? "Unknown";
  const rarity = m.rarity ?? (m.isEpic ? "epic" : "normal");
  const epicClass = rarity === "epic" ? " mission-card-epic" : "";
  const onboardingClass = m.id?.startsWith("onboarding_")
    ? " mission-card-onboarding-target"
    : "";
  const totalEnemies = getDisplayEnemyCount(m);
  const initialEnemies = m.encounter?.initialEnemyCount ?? m.enemyCount;
  const hasReinforcements = totalEnemies > initialEnemies;
  const reinforcements = Math.max(0, totalEnemies - initialEnemies);
  const instruction =
    MISSION_CARD_INSTRUCTION[m.kind] ?? "Complete mission objectives and survive.";
  const factionMeta = m.factionId ? MISSION_FACTION_META[m.factionId] : null;
  const factionName = factionMeta?.name ?? "Unknown Faction";
  const factionEmblem = factionMeta?.emblem ?? "/images/desert_wolves.png";
  const enemyPrimary = hasReinforcements
    ? `${initialEnemies} deployed`
    : `${initialEnemies} deployed`;
  const enemySecondary = hasReinforcements
    ? `+${reinforcements} reinforcing · ${totalEnemies} max`
    : "No reinforcements expected";
  const rewards = buildRewardsEntries(m);
  const rewardsHtml = rewards
    .map((e) => {
      if (e.type === "credits")
        return `<span class="mission-reward-chip mission-reward-credits"><span class="mission-reward-icon">$</span><span class="mission-reward-amount">${e.amount}</span></span>`;
      if (e.type === "xp")
        return `<span class="mission-reward-chip mission-reward-xp"><span class="mission-reward-icon">+</span><span class="mission-reward-amount">${e.amount} XP</span></span>`;
      return `<span class="mission-reward-chip mission-reward-item"><img src="${escapeAttr(e.iconUrl)}" alt="" class="mission-reward-item-icon" width="20" height="20"><span class="mission-reward-amount">×${e.quantity}</span></span>`;
    })
    .join("");

  return `
<div class="mission-card${epicClass}${onboardingClass}" data-mission-id="${m.id}" data-kind="${m.kind}" data-level="${m.difficulty}" data-rarity="${rarity}" data-faction="${escapeAttr(m.factionId ?? "unknown")}" data-mission-json="${escapeAttr(JSON.stringify(m))}">
  <span class="mission-card-rarity-badge mission-card-rarity-badge-${rarity}">${rarity === "epic" ? "Epic" : rarity === "rare" ? "Rare" : "Normal"}</span>
  <div class="mission-card-head">
    <div class="mission-card-branding">
      <img src="${escapeAttr(factionEmblem)}" alt="${escapeAttr(factionName)} emblem" class="mission-faction-emblem" width="64" height="64">
      <div class="mission-card-branding-copy">
        <div class="mission-card-branding-row">
          <span class="mission-card-kind-badge">${meta.name}</span>
          <span class="mission-card-faction-tag">${escapeHtml(factionName)}</span>
        </div>
        <h4 class="mission-card-name">${escapeHtml(m.name)}</h4>
      </div>
    </div>
  </div>
  <div class="mission-card-threat-block">
    <p class="mission-card-instruction">${escapeHtml(instruction)}</p>
    <div class="mission-card-threat-label">Enemy Force</div>
    <div class="mission-card-enemies" data-kind="${m.kind}">
      ${ENEMY_COUNT_ICON}
      <span class="mission-enemies-count">${enemyPrimary}</span>
    </div>
    <div class="mission-card-threat-sub">${enemySecondary}</div>
  </div>
  <div class="mission-card-difficulty" title="${diffLabel}" aria-label="${diffLabel}">
    <div class="mission-card-difficulty-row">
      <span class="mission-diff-bars"><span class="mission-diff-fill" style="width: ${(m.difficulty / 4) * 100}%"></span></span>
    </div>
    <span class="mission-diff-label">${diffLabel}</span>
  </div>
  <div class="mission-card-footer">
    <div class="mission-card-rewards" aria-label="Rewards">
      <span class="mission-rewards-label">Rewards:</span>
      <span class="mission-rewards-list">${rewardsHtml}</span>
    </div>
    <button type="button" class="game-btn game-btn-sm game-btn-red mission-launch-btn" data-mission-id="${m.id}">Launch</button>
  </div>
</div>`;
}

function sortMissionsByDifficulty(ms: Mission[]): Mission[] {
  return [...ms].sort((a, b) => a.difficulty - b.difficulty);
}

function missionSectionByKind(
  missions: Mission[],
  kind: MissionKind,
  activeKindFilter: MissionKind | "all" = "all",
): string {
  const meta = MISSION_KIND_META[kind];
  const kindMissions = sortMissionsByDifficulty(
    missions.filter((m) => m.kind === kind),
  );
  if (kindMissions.length === 0) return "";
  const sectionHidden =
    activeKindFilter !== "all" && activeKindFilter !== kind ? " hidden" : "";
  return `
    <div class="missions-section missions-section-kind" data-kind="${kind}"${sectionHidden}>
      <div class="missions-kind-banner">${meta.name}</div>
      <div class="missions-grid">
        ${kindMissions.map((m) => missionCard(m)).join("")}
      </div>
    </div>`;
}

function buildMissionFilters(
  missions: Mission[],
  activeKindFilter: MissionKind | "all",
): string {
  const kindsPresent = MISSION_KIND_ORDER.filter((k) =>
    missions.some((m) => {
      return m.kind === k;
    }),
  );
  const difficultiesPresent = [1, 2, 3, 4].filter((d) =>
    missions.some((m) => m.difficulty === d),
  );
  if (kindsPresent.length === 0) return "";
  return `
  <div class="missions-filters" data-kind-filter="${activeKindFilter}" data-difficulty-filter="all">
    <div class="missions-filter-row">
      <button type="button" class="missions-filter-chip  blue${activeKindFilter === "all" ? " is-active" : ""}" data-filter-group="kind" data-filter-value="all">All</button>
      ${kindsPresent.map((k) => `<button type="button" class="missions-filter-chip  blue${activeKindFilter === k ? " is-active" : ""}" data-filter-group="kind" data-filter-value="${k}">${MISSION_KIND_META[k].name}</button>`).join("")}
    </div>
   <!-- <div class="missions-filter-row mission-difficulties">
      <button type="button" class="missions-filter-chip is-active" data-filter-group="difficulty" data-filter-value="all">All</button>
      ${difficultiesPresent.map((d) => `<button type="button" class="missions-filter-chip" data-filter-group="difficulty" data-filter-value="${d}">${DIFFICULTY_LABELS[d]}</button>`).join("")}
    </div> -->
  </div>`;
}

export function missionsTemplate(
  missions: Mission[],
  companyLevel = 1,
  activeMode: "menu" | "normal" | "epic" | "career" | "dev" = "menu",
  initialKindFilter: MissionKind | "all" = "all",
): string {
  const store = usePlayerCompanyStore.getState();
  const careerUnlocked = isCareerUnlocked(
    store.company,
    !!store.onboardingFirstMissionPending,
  );
  const regular = missions.filter(
    (m) => (m.rarity ?? (m.isEpic ? "epic" : "normal")) !== "epic",
  );
  const epic = missions.filter(
    (m) => (m.rarity ?? (m.isEpic ? "epic" : "normal")) === "epic",
  );
  const mode = activeMode;
  const showEpic = companyLevel >= 2;
  const mainClass =
    mode === "menu" ? "missions-main missions-main-menu" : "missions-main";
  const regularSections = MISSION_KIND_ORDER.map((k) =>
    missionSectionByKind(regular, k, initialKindFilter),
  )
    .filter(Boolean)
    .join("");
  const regularFilters = buildMissionFilters(regular, initialKindFilter);
  const epicSection = `
    <div class="missions-section missions-section-epic">
      <div class="missions-kind-banner missions-kind-banner-epic">Epic Missions</div>
      <div class="missions-grid missions-grid-epic">
        ${sortMissionsByDifficulty(epic)
          .map((m) => missionCard(m))
          .join("")}
      </div>
    </div>`;
  const emptyState =
    mode === "epic"
      ? '<div class="missions-empty-state">No epic missions available.</div>'
      : '<div class="missions-empty-state">No normal missions available.</div>';
  const modeContent =
    mode === "epic"
      ? showEpic
        ? epic.length > 0
          ? epicSection
          : emptyState
        : '<div class="missions-empty-state">Epic missions unlock at Company Level 2.</div>'
      : mode === "normal"
          ? regularSections
            ? `${regularFilters}<div class="missions-filter-empty-state" hidden>No missions match these filters.</div>${regularSections}`
            : emptyState
          : `
      <div class="missions-mode-menu">
        <button id="missions-mode-normal" class="game-btn game-btn-lg game-btn-green missions-mode-menu-btn missions-mode-menu-btn-normal" type="button">
          <span class="missions-mode-icon-block">
            <img src="/images/normal_m.png" alt="" width="56" height="56" aria-hidden="true">
          </span>
          <span class="missions-mode-divider" aria-hidden="true"></span>
          <span class="missions-mode-label">Normal Missions</span>
        </button>
        <button id="missions-mode-epic" class="game-btn game-btn-lg game-btn-red missions-mode-menu-btn missions-mode-menu-btn-elite" type="button" ${showEpic ? "" : "disabled"}>
          <span class="missions-mode-icon-block">
            <img src="/images/elite_m.png" alt="" width="56" height="56" aria-hidden="true">
          </span>
          <span class="missions-mode-divider" aria-hidden="true"></span>
          <span class="missions-mode-label">Elite Missions</span>
          ${showEpic ? "" : `<span class="missions-mode-lock-hint">Unlocks at Company Lv 2 (Current: Lv ${companyLevel})</span>`}
        </button>
        <button id="missions-mode-career" class="game-btn game-btn-lg game-btn-blue missions-mode-menu-btn missions-mode-menu-btn-career" type="button" ${careerUnlocked ? "" : "disabled"}>
          <span class="missions-mode-icon-block">
            <img src="/images/career_m.png" alt="" width="56" height="56" aria-hidden="true">
          </span>
          <span class="missions-mode-divider" aria-hidden="true"></span>
          <span class="missions-mode-label">Career</span>
        </button>
        <p class="missions-mode-helper missions-mode-helper-career-desc">Climb an endless ladder of mirrored squad battles, one level at a time.</p>
        ${
          careerUnlocked
            ? ""
            : '<p class="missions-mode-helper">Career unlocks after intro mission completion.</p>'
        }
      </div>`;
  const missionTypesOnboardingPopup =
    store.onboardingMissionTypesIntroPending
      ? `
  <div id="missions-types-onboarding-popup" class="home-onboarding-popup helper-onboarding-popup" role="dialog" aria-modal="true" data-step="0">
    <div class="home-onboarding-dialog helper-onboarding-dialog">
      <div class="home-onboarding-copy helper-onboarding-copy">
        <h4 class="home-onboarding-title helper-onboarding-title">Mission Types Briefing</h4>
        <div class="missions-types-tutorial-tags" id="missions-types-tutorial-tags">
          <span class="missions-types-tutorial-tag" data-mission-tag="skirmish">Skirmish</span>
          <span class="missions-types-tutorial-tag" data-mission-tag="defend">Defend</span>
          <span class="missions-types-tutorial-tag" data-mission-tag="manhunt">Manhunt</span>
        </div>
        <p class="home-onboarding-text helper-onboarding-text helper-onboarding-typed-text" id="missions-types-onboarding-typed-text" data-full-text="Mission control online. Let’s walk through your three core mission types and how each plays."></p>
        <button id="missions-types-onboarding-continue" type="button" class="game-btn game-btn-md game-btn-green home-onboarding-continue helper-onboarding-continue">Continue</button>
      </div>
      <div class="home-onboarding-image-wrap helper-onboarding-image-wrap">
        <img src="/images/green-portrait/portrait_0.png" alt="Squad soldier" class="home-onboarding-image helper-onboarding-image">
      </div>
    </div>
  </div>`
      : "";
  const suppliesIntroPopup =
    store.onboardingSuppliesStep === "market_popup"
      ? `
  <div id="home-supplies-onboarding-popup" class="home-onboarding-popup helper-onboarding-popup" role="dialog" aria-modal="true">
    <div class="home-onboarding-dialog helper-onboarding-dialog">
      <div class="home-onboarding-copy helper-onboarding-copy">
        <h4 class="home-onboarding-title helper-onboarding-title">Resupply Needed</h4>
        <p class="home-onboarding-text helper-onboarding-text helper-onboarding-typed-text" id="home-supplies-onboarding-typed-text" data-full-text="Commander, it looks like you need supplies. Head to the Market to replenish your armaments."></p>
        <button id="home-supplies-onboarding-continue" type="button" class="game-btn game-btn-md game-btn-green home-onboarding-continue helper-onboarding-continue">Continue</button>
      </div>
      <div class="home-onboarding-image-wrap helper-onboarding-image-wrap">
        <img src="/images/green-portrait/portrait_0.png" alt="Squad soldier" class="home-onboarding-image helper-onboarding-image">
      </div>
    </div>
  </div>`
      : "";
  return `
<div id="missions-screen" class="missions-root troops-market-root">
  ${companyHeaderPartial("Missions")}
  <div class="${mainClass}">
    <div class="missions-sections-wrapper">
      ${modeContent}
    </div>
  </div>
  ${companyActionsTemplate()}
  <div id="mission-flavor-popup" class="mission-flavor-popup" role="dialog" aria-modal="true" aria-labelledby="mission-flavor-popup-title" hidden>
    <div class="mission-flavor-popup-inner">
      <div class="mission-flavor-popup-header popup-dialog-header">
        <h4 id="mission-flavor-popup-title" class="mission-flavor-popup-title">Mission Brief</h4>
        <button type="button" class="game-btn game-btn-md game-btn-red mission-flavor-popup-close popup-close-btn" id="mission-flavor-popup-close" aria-label="Close">Close</button>
      </div>
      <p id="mission-flavor-popup-text" class="mission-flavor-popup-text"></p>
    </div>
  </div>
  ${missionTypesOnboardingPopup}
  ${suppliesIntroPopup}
</div>`;
}
