import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";

export function memorialTemplate(): string {
  const store = usePlayerCompanyStore.getState();
  const menLost = store.totalMenLostAllTime ?? 0;

  return `
<div id="memorial-screen" class="memorial-root troops-market-root">
  ${companyHeaderPartial("Memorial Wall")}
  <div class="memorial-main">
    <h3 class="memorial-title">Fallen Soldiers</h3>
    <p class="memorial-count">Total lost in combat: <strong>${menLost}</strong></p>
    <div class="memorial-placeholder">
      <p>Those who gave their lives for the company shall not be forgotten.</p>
      <p class="memorial-note">Detailed memorial records coming soon.</p>
    </div>
  </div>
  <div class="memorial-footer troops-market-footer">
    <div class="recruit-balance-bar">
      <span class="recruit-balance-item"><strong>Credits</strong> $${store.creditBalance}</span>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>`;
}
