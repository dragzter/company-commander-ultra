import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import type { Mission } from "../../constants/missions.ts";
import { DIFFICULTY_LABELS, MISSION_KIND_META } from "../../constants/missions.ts";

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

function missionCard(m: Mission): string {
  const meta = MISSION_KIND_META[m.kind] ?? { name: m.kind.replace(/_/g, " "), description: "" };
  const diffLabel = DIFFICULTY_LABELS[m.difficulty] ?? "Unknown";
  const rewardText = `$${m.creditReward}`;
  const rarity = m.rarity ?? (m.isEpic ? "epic" : "normal");
  const epicClass = rarity === "epic" ? " mission-card-epic" : "";
  const flavorText = m.flavorText ?? meta.description;
  const showReadMore = flavorText.length > READ_MORE_THRESHOLD;

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
  <div class="mission-card-meta">
    <span class="mission-card-enemies" data-kind="${m.kind}">${ENEMY_COUNT_ICON}<span class="mission-enemies-count">× ${m.enemyCount}</span></span>
    <span class="mission-card-reward"><span class="mission-reward-amount">${rewardText}</span></span>
  </div>
  <button type="button" class="game-btn game-btn-md game-btn-red mission-launch-btn" data-mission-id="${m.id}">Launch</button>
</div>`;
}

function sortMissionsByDifficulty(ms: Mission[]): Mission[] {
  return [...ms].sort((a, b) => a.difficulty - b.difficulty);
}

export function missionsTemplate(missions: Mission[]): string {
  const regular = sortMissionsByDifficulty(missions.filter((m) => (m.rarity ?? (m.isEpic ? "epic" : "normal")) !== "epic"));
  const epic = sortMissionsByDifficulty(missions.filter((m) => (m.rarity ?? (m.isEpic ? "epic" : "normal")) === "epic"));
  return `
<div id="missions-screen" class="missions-root troops-market-root">
  ${companyHeaderPartial("Missions")}
  <div class="missions-main">
    <div class="missions-section">
      <h4 class="missions-section-title">Available Missions</h4>
      <div class="missions-grid">
        ${regular.map((m) => missionCard(m)).join("")}
      </div>
    </div>
    <div class="missions-section missions-section-epic">
      <h4 class="missions-section-title">Epic Missions</h4>
      <div class="missions-grid missions-grid-epic">
        ${epic.map((m) => missionCard(m)).join("")}
      </div>
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
