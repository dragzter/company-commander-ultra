import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import type { Mission, MissionKind } from "../../constants/missions.ts";
import { DIFFICULTY_LABELS, MISSION_KIND_META, MISSION_KINDS } from "../../constants/missions.ts";
import { getRewardItemById } from "../../utils/reward-utils.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";

const READ_MORE_THRESHOLD = 55;

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
  const showReadMore = flavorText.length > READ_MORE_THRESHOLD;
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
    <p class="mission-card-desc${showReadMore ? " mission-card-desc-truncate" : ""}"${showReadMore ? ` data-full-text="${escapeAttr(flavorText)}"` : ""}>${escapeHtml(flavorText)}</p>
    ${showReadMore ? '<button type="button" class="mission-card-read-more" aria-label="Read full mission text">Read more</button>' : ""}
  </div>
  <div class="mission-card-difficulty" title="${diffLabel}" aria-label="${diffLabel}">
    <span class="mission-diff-bars"><span class="mission-diff-fill" style="width: ${(m.difficulty / 5) * 100}%"></span></span>
    <span class="mission-diff-label">${diffLabel}</span>
  </div>
  <div class="mission-card-rewards" aria-label="Rewards">
    <span class="mission-rewards-label">Rewards:</span>
    <span class="mission-rewards-list">${rewardsHtml}</span>
  </div>
  <div class="mission-card-meta">
    <span class="mission-card-enemies" data-kind="${m.kind}">${ENEMY_COUNT_ICON}<span class="mission-enemies-count">× ${m.enemyCount}</span></span>
  </div>
  <button type="button" class="game-btn game-btn-md game-btn-red mission-launch-btn" data-mission-id="${m.id}">Launch</button>
</div>`;
}

function sortMissionsByDifficulty(ms: Mission[]): Mission[] {
  return [...ms].sort((a, b) => a.difficulty - b.difficulty);
}

const MISSION_KIND_ORDER: MissionKind[] = [
  MISSION_KINDS.defend_objective,
  MISSION_KINDS.ambush,
  MISSION_KINDS.attack_objective,
  MISSION_KINDS.seek_and_destroy,
  MISSION_KINDS.manhunt,
];

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

export function missionsTemplate(missions: Mission[], companyLevel = 1): string {
  const regular = missions.filter((m) => (m.rarity ?? (m.isEpic ? "epic" : "normal")) !== "epic");
  const epic = missions.filter((m) => (m.rarity ?? (m.isEpic ? "epic" : "normal")) === "epic");
  const showEpic = companyLevel >= 4;
  const regularSections = MISSION_KIND_ORDER.map((k) => missionSectionByKind(regular, k)).filter(Boolean).join("");
  const epicSection = showEpic
    ? `
    <div class="missions-section missions-section-epic">
      <div class="missions-kind-banner missions-kind-banner-epic">Epic Missions</div>
      <div class="missions-grid missions-grid-epic">
        ${sortMissionsByDifficulty(epic).map((m) => missionCard(m)).join("")}
      </div>
    </div>`
    : "";
  return `
<div id="missions-screen" class="missions-root troops-market-root">
  ${companyHeaderPartial("Missions")}
  <div class="missions-main">
    <div class="missions-sections-wrapper">
      ${regularSections}
      ${epicSection}
    </div>
  </div>
  ${companyActionsTemplate()}
  <div id="mission-flavor-popup" class="mission-flavor-popup" role="dialog" aria-modal="true" aria-labelledby="mission-flavor-popup-title" hidden>
    <div class="mission-flavor-popup-inner">
      <button type="button" class="popup-close-btn mission-flavor-popup-close" id="mission-flavor-popup-close" aria-label="Close">×</button>
      <h4 id="mission-flavor-popup-title" class="mission-flavor-popup-title">Mission Brief</h4>
      <p id="mission-flavor-popup-text" class="mission-flavor-popup-text"></p>
    </div>
  </div>
</div>`;
}
