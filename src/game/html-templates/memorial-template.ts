import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import type { MemorialEntry } from "../entities/memorial-types.ts";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function memorialTemplate(): string {
  const store = usePlayerCompanyStore.getState();
  const menLost = store.totalMenLostAllTime ?? 0;
  const fallen = (store.memorialFallen ?? []) as MemorialEntry[];

  const fallenList =
    fallen.length === 0
      ? "<p class=\"memorial-note\">No recorded casualties yet.</p>"
      : fallen
          .map(
            (e) => {
              const role = e.role ? escapeHtml(e.role) : "";
              const roleBadge = role ? `<span class="memorial-badge memorial-badge-role">${role}</span>` : "";
              const killedBy = e.killedBy ? `<div class="memorial-fallen-killedby-row"><span class="memorial-fallen-killedby">Killed by ${escapeHtml(e.killedBy)}</span></div>` : "";
              const missionsCompleted = Math.max(0, Math.floor(e.missionsCompleted ?? 0));
              const totalKills = Math.max(0, Math.floor(e.totalKills ?? e.enemiesKilled ?? 0));
              const missionKills = Math.max(0, Math.floor(e.missionKills ?? e.enemiesKilled ?? 0));
              return `<div class="memorial-fallen-row">
  <div class="memorial-fallen-top">
    <span class="memorial-fallen-name">${escapeHtml(e.name)}</span>
    <span class="memorial-fallen-badges">
      <span class="memorial-badge memorial-badge-level">Lv ${e.level}</span>
      ${roleBadge}
    </span>
  </div>
  <div class="memorial-fallen-meta">
    <span class="memorial-fallen-mission">${escapeHtml(e.missionName)}</span>
    <span class="memorial-fallen-kills">Mission Kills ${missionKills}</span>
  </div>
  <div class="memorial-fallen-career">
    <span class="memorial-fallen-career-item">Missions Completed ${missionsCompleted}</span>
    <span class="memorial-fallen-career-item">Total Kills ${totalKills}</span>
  </div>
  ${killedBy}
</div>`;
            },
          )
          .join("");

  return `
<div id="memorial-screen" class="memorial-root troops-market-root">
  ${companyHeaderPartial("Memorial Wall")}
  <div class="memorial-main">
    <h3 class="memorial-title">Fallen Soldiers</h3>
    <p class="memorial-count">Total lost in combat: <strong>${menLost}</strong></p>
    <div class="memorial-placeholder">
      <p>Those who gave their lives for the company shall not be forgotten.</p>
      <div class="memorial-fallen-list">${fallenList}</div>
    </div>
  </div>
  <div class="memorial-footer troops-market-footer">
    <div class="footer-banner">
      <div class="recruit-balance-bar">
        <span class="recruit-balance-item"><strong>Credits</strong> $${store.creditBalance}</span>
      </div>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>`;
}
