import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import type { Mission, MissionKind } from "../../constants/missions.ts";
import { DIFFICULTY_LABELS, MISSION_KIND_META } from "../../constants/missions.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";

const READ_MORE_THRESHOLD = 55;

const ENEMY_COUNT_ICON = `<img src="/images/ui/soldier-silhouette.svg" alt="" class="mission-enemies-icon" aria-hidden="true" width="18" height="24">`;

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
  const epicClass = m.isEpic ? " mission-card-epic" : "";
  const flavorText = m.flavorText ?? meta.description;
  const showReadMore = flavorText.length > READ_MORE_THRESHOLD;

  return `
<div class="mission-card${epicClass}" data-mission-id="${m.id}" data-kind="${m.kind}" data-level="${m.difficulty}" data-mission-json="${escapeAttr(JSON.stringify(m))}">
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
  <button type="button" class="mbtn green mission-launch-btn" data-mission-id="${m.id}">Launch</button>
</div>`;
}

const MISSION_KIND_ORDER: MissionKind[] = [
  "defend_objective",
  "ambush",
  "attack_objective",
  "seek_and_destroy",
  "manhunt",
];

function sortMissionsByKind(ms: Mission[]): Mission[] {
  const order = (k: MissionKind) => MISSION_KIND_ORDER.indexOf(k);
  return [...ms].sort((a, b) => order(a.kind) - order(b.kind));
}

export function missionsTemplate(missions: Mission[]): string {
  const regular = sortMissionsByKind(missions.filter((m) => !m.isEpic));
  const epic = sortMissionsByKind(missions.filter((m) => m.isEpic));
  const { creditBalance } = usePlayerCompanyStore.getState();

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
  <div class="troops-market-footer">
    <div class="recruit-balance-bar">
      <span class="recruit-balance-item"><strong>Credits</strong> $${creditBalance}</span>
    </div>
    ${companyActionsTemplate()}
  </div>
  <div id="mission-flavor-popup" class="mission-flavor-popup" role="dialog" aria-modal="true" aria-labelledby="mission-flavor-popup-title" hidden>
    <div class="mission-flavor-popup-inner">
      <button type="button" class="mission-flavor-popup-close" id="mission-flavor-popup-close" aria-label="Close">×</button>
      <h4 id="mission-flavor-popup-title" class="mission-flavor-popup-title">Mission Brief</h4>
      <p id="mission-flavor-popup-text" class="mission-flavor-popup-text"></p>
    </div>
  </div>
</div>`;
}
