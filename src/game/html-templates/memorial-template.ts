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
            (e) =>
              `<div class="memorial-fallen-row"><span class="memorial-fallen-name">${escapeHtml(e.name)}</span><span class="memorial-fallen-meta">Lv${e.level} · ${escapeHtml(e.missionName)} · ${e.enemiesKilled} kills</span></div>`,
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
