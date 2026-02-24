import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";

export function abilitiesTemplate(): string {
  const { creditBalance } = usePlayerCompanyStore.getState();
  return `
<div id="abilities-screen" class="abilities-root troops-market-root">
  ${companyHeaderPartial("Company Abilities")}
  <div class="abilities-main">
    <div class="abilities-placeholder p-4 text-center">
      <h3>Company Abilities</h3>
      <p>Unlock and manage company-wide abilities as you level up.</p>
    </div>
  </div>
  <div class="abilities-footer troops-market-footer">
    <div class="footer-banner">
      <div class="recruit-balance-bar">
        <span class="recruit-balance-item"><strong>Credits</strong> $${creditBalance}</span>
      </div>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>`;
}
