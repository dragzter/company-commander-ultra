import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import { Partial } from "./partials/partial.ts";
import { equipPickerTemplate } from "./equip-picker-template.ts";
import type { Soldier } from "../entities/types.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { getActiveSlots, getReserveSlots, getFormationSlots, getSoldierById } from "../../constants/company-slots.ts";

function rosterSoldierCard(s: Soldier, index: number, isActive: boolean): string {
  return Partial.create.rosterCard(s, index, isActive);
}

export function rosterTemplate(): string {
  const store = usePlayerCompanyStore.getState();
  const company = store.company;
  const soldiers = company?.soldiers ?? [];
  const formationSlots = getFormationSlots(company);
  const activeCount = getActiveSlots(company);
  const reserveCount = getReserveSlots(company);
  const activeEntries: { soldier: NonNullable<ReturnType<typeof getSoldierById>>; slotIndex: number }[] = [];
  for (let i = 0; i < activeCount; i++) {
    const sid = formationSlots[i];
    const s = sid ? getSoldierById(company, sid) : null;
    if (s) activeEntries.push({ soldier: s, slotIndex: i });
  }
  const reserveEntries: { soldier: NonNullable<ReturnType<typeof getSoldierById>>; slotIndex: number }[] = [];
  for (let i = 0; i < reserveCount; i++) {
    const idx = activeCount + i;
    const sid = formationSlots[idx];
    const s = sid ? getSoldierById(company, sid) : null;
    if (s) reserveEntries.push({ soldier: s, slotIndex: idx });
  }

  let equipPickerHtml = "";
  try {
    equipPickerHtml = equipPickerTemplate();
  } catch (e) {
    console.warn("[Roster] equipPickerTemplate failed:", e);
  }

  return `
<div id="roster-screen" class="roster-root troops-market-root">
  ${equipPickerHtml}
  ${companyHeaderPartial("Company Roster")}
  <div class="roster-main">
    <div class="roster-section">
      <div class="roster-section-header roster-section-active">
        <span class="roster-section-label">Active</span>
        <span class="roster-section-count">${activeEntries.length} / ${activeCount}</span>
      </div>
      <div class="roster-grid" id="roster-active-grid">
        ${activeEntries.map((e) => rosterSoldierCard(e.soldier, e.slotIndex, true)).join("")}
      </div>
    </div>
    <div class="roster-section">
      <div class="roster-section-header roster-section-reserve">
        <span class="roster-section-label">Reserve</span>
        <span class="roster-section-count">${reserveEntries.length} / ${reserveCount}</span>
      </div>
      <div class="roster-grid" id="roster-reserve-grid">
        ${reserveEntries.map((e) => rosterSoldierCard(e.soldier, e.slotIndex, false)).join("")}
      </div>
    </div>
  </div>
  <div class="roster-footer troops-market-footer roster-footer-banner">
    <div class="roster-footer-actions">
      <button type="button" id="roster-formation-btn" class="equip-troops-btn">Formation</button>
    </div>
    <div class="recruit-balance-bar">
      <span class="recruit-balance-item"><strong>Soldiers</strong> ${soldiers.length}</span>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>`;
}
