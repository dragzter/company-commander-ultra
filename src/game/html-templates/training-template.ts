import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";

export function trainingTemplate(): string {
  const { creditBalance } = usePlayerCompanyStore.getState();
  return `
<div id="training-screen" class="training-root troops-market-root">
  ${companyHeaderPartial("Training")}
  <div class="training-main">
    <div class="training-placeholder p-4 text-center">
      <h3>Training</h3>
      <p>Training facilities coming soon. Train your soldiers to improve their skills.</p>
    </div>
  </div>
  <div class="training-footer troops-market-footer">
    <div class="footer-banner">
      <div class="recruit-balance-bar">
        <span class="recruit-balance-item"><strong>Credits</strong> $${creditBalance}</span>
      </div>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>`;
}
