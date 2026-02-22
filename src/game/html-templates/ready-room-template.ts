import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import type { Soldier } from "../entities/types.ts";
import type { Mission } from "../../constants/missions.ts";
import { getActiveSlots } from "../../constants/company-slots.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { formatDisplayName } from "../../utils/name-utils.ts";

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function readyRoomSoldierCard(s: Soldier, slotIndex: number, isActive: boolean): string {
  const slotClass = isActive ? "ready-room-active-slot" : "ready-room-reserve-slot";
  return `
<div class="ready-room-soldier-card ${slotClass}" data-soldier-id="${s.id}" data-slot-index="${slotIndex}" data-soldier-json="${escapeAttr(JSON.stringify(s))}">
  <div class="ready-room-card-inner">
    <img class="ready-room-avatar" src="/images/green-portrait/${s.avatar}" alt="">
    <div class="ready-room-details">
      <div class="ready-room-name-block">
        <span class="ready-room-name">${formatDisplayName(s.name)}</span>
        <span class="ready-room-role-badge">${s.designation}</span>
      </div>
      <div class="ready-room-stats-row">
        <span>HP ${s.attributes.hit_points}</span>
        <span>Lv ${s.level}</span>
      </div>
    </div>
  </div>
</div>`;
}

export function readyRoomTemplate(mission: Mission | null): string {
  const store = usePlayerCompanyStore.getState();
  const company = store.company;
  const soldiers = company?.soldiers ?? [];
  const activeCount = getActiveSlots(company);
  const activeSoldiers = soldiers.slice(0, activeCount);
  const reserveSoldiers = soldiers.slice(activeCount);

  const missionTitle = mission?.name ?? "Ready Room";
  const missionData = mission ? escapeAttr(JSON.stringify(mission)) : "";

  const roleCounts = soldiers.reduce((acc, s) => {
    const r = s.designation?.toLowerCase() ?? "rifleman";
    acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const roleBreakdown = ["rifleman", "support", "medic"]
    .map((r) => `${r.charAt(0).toUpperCase() + r.slice(1)} ${roleCounts[r] ?? 0}`)
    .join(" · ");

  return `
<div id="ready-room-screen" class="ready-room-root troops-market-root" data-mission-json="${missionData}">
  ${companyHeaderPartial(missionTitle)}
  <div class="ready-room-role-banner">${roleBreakdown}</div>
  <div class="ready-room-main">
    <div class="ready-room-section">
      <h4 class="ready-room-section-title">Active (${activeSoldiers.length}/${activeCount})</h4>
      <div class="ready-room-grid" id="ready-room-active-grid">
        ${activeSoldiers.map((s, i) => readyRoomSoldierCard(s, i, true)).join("")}
      </div>
    </div>
    <div class="ready-room-section">
      <h4 class="ready-room-section-title">Reserve</h4>
      <div class="ready-room-grid" id="ready-room-reserve-grid">
        ${reserveSoldiers.map((s, i) => readyRoomSoldierCard(s, activeCount + i, false)).join("")}
      </div>
    </div>
  </div>
  <div class="ready-room-footer troops-market-footer">
    <button type="button" id="ready-room-proceed" class="mbtn green ${soldiers.length === 0 ? "disabled" : ""}">Proceed to Mission</button>
    <div class="recruit-balance-bar">
      <span class="recruit-balance-item"><strong>Credits</strong> $${store.creditBalance}</span>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>`;
}
