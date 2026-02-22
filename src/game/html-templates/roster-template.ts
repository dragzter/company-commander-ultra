import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import { Partial } from "./partials/partial.ts";
import { equipPickerTemplate } from "./equip-picker-template.ts";
import type { Soldier } from "../entities/types.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { getActiveSlots } from "../../constants/company-slots.ts";
import { getReserveSlotsByLevel } from "../../constants/company-capacity.ts";

function rosterSoldierCard(s: Soldier, index: number, isActive: boolean): string {
  return Partial.create.rosterCard(s, index, isActive);
}

export function rosterTemplate(): string {
  const store = usePlayerCompanyStore.getState();
  const company = store.company;
  const soldiers = company?.soldiers ?? [];
  const activeCount = getActiveSlots(company);
  const reserveCount = getReserveSlotsByLevel(company?.level ?? 1);
  const activeSoldiers = soldiers.slice(0, activeCount);
  const reserveSoldiers = soldiers.slice(activeCount);

  return `
<div id="roster-screen" class="roster-root troops-market-root">
  ${equipPickerTemplate()}
  ${companyHeaderPartial("Company Roster")}
  <div class="roster-main">
    <div class="roster-section">
      <div class="roster-section-header roster-section-active">
        <span class="roster-section-label">Active</span>
        <span class="roster-section-count">${activeSoldiers.length} / ${activeCount}</span>
      </div>
      <div class="roster-grid" id="roster-active-grid">
        ${activeSoldiers.map((s, i) => rosterSoldierCard(s, i, true)).join("")}
      </div>
    </div>
    <div class="roster-section">
      <div class="roster-section-header roster-section-reserve">
        <span class="roster-section-label">Reserve</span>
        <span class="roster-section-count">${reserveSoldiers.length} / ${reserveCount}</span>
      </div>
      <div class="roster-grid" id="roster-reserve-grid">
        ${reserveSoldiers.map((s, i) => rosterSoldierCard(s, activeCount + i, false)).join("")}
      </div>
    </div>
  </div>
  <div class="roster-footer troops-market-footer">
    <div class="recruit-balance-bar">
      <span class="recruit-balance-item"><strong>Credits</strong> $${store.creditBalance}</span>
      <span class="recruit-balance-item"><strong>Soldiers</strong> ${soldiers.length}</span>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>`;
}
