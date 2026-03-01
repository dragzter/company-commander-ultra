import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import type { Mission, MissionKind } from "../../constants/missions.ts";
import { DIFFICULTY_LABELS, MISSION_KIND_META, MISSION_KIND_ORDER } from "../../constants/missions.ts";
import { getRewardItemById } from "../../utils/reward-utils.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";

const ENEMY_COUNT_ICON = `<img src="/images/soldier_count.png" alt="" class="mission-enemies-icon" aria-hidden="true" width="14" height="18">`;

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
  const meta = MISSION_KIND_META[m.kind] ?? { name: m.kind.replace(/_/g, " "), description: "" };
  const diffLabel = DIFFICULTY_LABELS[m.difficulty] ?? "Unknown";
  const rarity = m.rarity ?? (m.isEpic ? "epic" : "normal");
  const epicClass = rarity === "epic" ? " mission-card-epic" : "";
  const flavorText = m.flavorText ?? meta.description;
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
<div class="mission-card${epicClass}" data-mission-id="${m.id}" data-kind="${m.kind}" data-level="${m.difficulty}" data-rarity="${rarity}" data-mission-json="${escapeAttr(JSON.stringify(m))}">
  <span class="mission-card-rarity-badge mission-card-rarity-badge-${rarity}">${rarity === "epic" ? "Epic" : rarity === "rare" ? "Rare" : "Normal"}</span>
  <div class="mission-card-kind-badge">${meta.name}</div>
  <h4 class="mission-card-name">${escapeHtml(m.name)}</h4>
  <div class="mission-card-body">
    <p class="mission-card-desc">${escapeHtml(flavorText)}</p>
  </div>
  <div class="mission-card-difficulty" title="${diffLabel}" aria-label="${diffLabel}">
    <div class="mission-card-difficulty-row">
      <span class="mission-diff-bars"><span class="mission-diff-fill" style="width: ${(m.difficulty / 5) * 100}%"></span></span>
      <span class="mission-card-enemies" data-kind="${m.kind}">${ENEMY_COUNT_ICON}<span class="mission-enemies-count">× ${m.enemyCount}</span></span>
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

function missionSectionByKind(missions: Mission[], kind: MissionKind): string {
  const meta = MISSION_KIND_META[kind];
  const kindMissions = sortMissionsByDifficulty(missions.filter((m) => m.kind === kind));
  if (kindMissions.length === 0) return "";
  return `
    <div class="missions-section missions-section-kind" data-kind="${kind}">
      <div class="missions-kind-banner">${meta.name}</div>
      <div class="missions-grid">
        ${kindMissions.map((m) => missionCard(m)).join("")}
      </div>
    </div>`;
}

export function missionsTemplate(
  missions: Mission[],
  companyLevel = 1,
  activeMode: "menu" | "normal" | "epic" | "dev" = "menu",
  devMissions: Mission[] = [],
): string {
  const regular = missions.filter((m) => (m.rarity ?? (m.isEpic ? "epic" : "normal")) !== "epic");
  const epic = missions.filter((m) => (m.rarity ?? (m.isEpic ? "epic" : "normal")) === "epic");
  const mode = activeMode;
  const showEpic = companyLevel >= 2;
  const mainClass = mode === "menu" ? "missions-main missions-main-menu" : "missions-main";
  const regularSections = MISSION_KIND_ORDER.map((k) => missionSectionByKind(regular, k)).filter(Boolean).join("");
  const epicSection = `
    <div class="missions-section missions-section-epic">
      <div class="missions-kind-banner missions-kind-banner-epic">Epic Missions</div>
      <div class="missions-grid missions-grid-epic">
        ${sortMissionsByDifficulty(epic).map((m) => missionCard(m)).join("")}
      </div>
    </div>`;
  const emptyState = mode === "epic"
    ? '<div class="missions-empty-state">No epic missions available.</div>'
    : '<div class="missions-empty-state">No normal missions available.</div>';
  const modeContent = mode === "epic"
    ? showEpic
      ? (epic.length > 0 ? epicSection : emptyState)
      : '<div class="missions-empty-state">Epic missions unlock at Company Level 2.</div>'
    : mode === "dev"
      ? (devMissions.length > 0
        ? `
      <div class="missions-section missions-section-dev">
        <div class="missions-kind-banner missions-kind-banner-dev">Dev Test Missions</div>
        <div class="missions-grid missions-grid-dev">
          ${sortMissionsByDifficulty(devMissions).map((m) => missionCard(m)).join("")}
        </div>
      </div>`
        : '<div class="missions-empty-state">No dev test missions available.</div>')
    : mode === "normal"
      ? (regularSections || emptyState)
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
        </button>
        <button id="missions-mode-career" class="game-btn game-btn-lg game-btn-blue missions-mode-menu-btn missions-mode-menu-btn-career" type="button">
          <span class="missions-mode-icon-block">
            <img src="/images/career_m.png" alt="" width="56" height="56" aria-hidden="true">
          </span>
          <span class="missions-mode-divider" aria-hidden="true"></span>
          <span class="missions-mode-label">Career</span>
        </button>
        <button id="missions-mode-dev" class="game-btn game-btn-md game-btn-black missions-mode-menu-btn missions-mode-menu-btn-dev" type="button">
          <span class="missions-mode-icon-block missions-mode-icon-block-dev">
            <img src="/images/career_m.png" alt="" width="40" height="40" aria-hidden="true">
          </span>
          <span class="missions-mode-divider" aria-hidden="true"></span>
          <span class="missions-mode-label">Dev 999 Test</span>
        </button>
        ${
          showEpic
            ? '<p class="missions-mode-helper">Elite missions available.</p>'
            : `<p class="missions-mode-helper">Elite missions unlock at Company Level 2. Current Level: ${companyLevel}.</p>`
        }
      </div>`;
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
      <button type="button" class="game-btn game-btn-md game-btn-red mission-flavor-popup-close" id="mission-flavor-popup-close" aria-label="Close">Close</button>
      <h4 id="mission-flavor-popup-title" class="mission-flavor-popup-title">Mission Brief</h4>
      <p id="mission-flavor-popup-text" class="mission-flavor-popup-text"></p>
    </div>
  </div>
</div>`;
}
