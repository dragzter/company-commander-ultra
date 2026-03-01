import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import { Partial } from "./partials/partial.ts";
import { equipPickerTemplate } from "./equip-picker-template.ts";
import { itemStatsPopupHtml } from "./inventory-template.ts";
import type { Soldier } from "../entities/types.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { getActiveSlots, getReserveSlots, getFormationSlots, getSoldierById } from "../../constants/company-slots.ts";
import { formatDisplayName, getSoldierPortraitUrl } from "../../utils/name-utils.ts";

function rosterSoldierCard(s: Soldier, index: number, isActive: boolean): string {
  return Partial.create.rosterCard(s, index, isActive);
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function restTroopsPopupHtml(soldiers: Soldier[], activeIds: Set<string>): string {
  const sorted = [...soldiers].sort((a, b) => {
    const ea = Math.max(0, Math.min(100, a.energy ?? 100));
    const eb = Math.max(0, Math.min(100, b.energy ?? 100));
    if (ea !== eb) return ea - eb;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });
  const cards = sorted.map((s) => {
    const energy = Math.max(0, Math.min(100, s.energy ?? 100));
    const canRecover = energy < 100;
    const recover = Math.min(30, 100 - energy);
    const cost = recover <= 0 ? 0 : Math.max(1, Math.round((recover / 30) * 50));
    const isActive = activeIds.has(s.id);
    const status = isActive ? "Active" : "Reserve";
    const roleRaw = (s.designation ?? "Rifleman").toString();
    const roleLabel = roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1).toLowerCase();
    const roleShort = roleLabel.charAt(0);
    const roleClass = `role-${roleRaw.toLowerCase()}`;
    const img = getSoldierPortraitUrl(s.avatar ?? "default.png", s.designation);
    const shortName = formatDisplayName(s.name ?? "Soldier");
    const energyPct = `${Math.max(0, Math.min(100, energy))}%`;
    return `
      <button
        type="button"
        class="rest-soldier-pill${canRecover ? "" : " disabled"}"
        data-rest-soldier-id="${s.id}"
        data-rest-energy="${energy}"
        data-rest-recover="${recover}"
        data-rest-cost="${cost}"
        ${canRecover ? "" : "disabled"}
      >
        <span class="rest-soldier-status">${status}</span>
        <span class="rest-soldier-avatar-wrap">
          <img class="rest-soldier-avatar" src="${img}" alt="${escapeHtml(s.name ?? "Soldier")}" width="34" height="34">
          <span class="rest-soldier-role-badge ${escapeHtml(roleClass)}" aria-label="${escapeHtml(roleLabel)}" title="${escapeHtml(roleLabel)}">${escapeHtml(roleShort)}</span>
        </span>
        <span class="rest-soldier-name">${escapeHtml(shortName || "Soldier")}</span>
        <span class="rest-soldier-energybar">
          <span class="rest-soldier-energyfill" style="width:${energyPct}"></span>
          <span class="rest-soldier-energy">EN ${energy}</span>
        </span>
      </button>
    `;
  }).join("");

  return `
<div id="roster-rest-popup" class="equip-picker-popup rest-popup" hidden>
  <div class="equip-picker-inner rest-popup-inner">
    <div class="equip-picker-header rest-popup-header">
      <h4>Rest Troops</h4>
      <button type="button" id="rest-popup-close" class="game-btn game-btn-md game-btn-red popup-close-btn">Close</button>
    </div>
    <div class="equip-picker-body rest-popup-body">
      <div class="rest-popup-summary">
        <span id="rest-popup-selected-count">0 selected</span>
        <span id="rest-popup-preview">Recovery +0 | Cost $0</span>
      </div>
      <div id="rest-popup-grid" class="rest-popup-grid">
        ${cards}
      </div>
      <div class="rest-popup-actions">
        <button type="button" id="rest-popup-send-btn" class="equip-troops-btn rest-send-btn" disabled>Send on Leave</button>
        <div id="rest-popup-progress-wrap" class="rest-popup-progress-wrap" hidden>
          <div class="rest-popup-progress-track">
            <div id="rest-popup-progress-fill" class="rest-popup-progress-fill"></div>
          </div>
        </div>
        <p id="rest-popup-feedback" class="rest-popup-feedback" aria-live="polite"></p>
      </div>
    </div>
  </div>
</div>`;
}

export function rosterTemplate(): string {
  const store = usePlayerCompanyStore.getState();
  const company = store.company;
  const soldiers = company?.soldiers ?? [];
  const isEmptyRoster = soldiers.length === 0;
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
  const activeIds = new Set(activeEntries.map((e) => e.soldier.id));

  let equipPickerHtml = "";
  try {
    equipPickerHtml = equipPickerTemplate();
  } catch (e) {
    console.warn("[Roster] equipPickerTemplate failed:", e);
  }

  return `
<div id="roster-screen" class="roster-root troops-market-root">
  ${equipPickerHtml}
  ${restTroopsPopupHtml(soldiers, activeIds)}
  ${itemStatsPopupHtml()}
  ${companyHeaderPartial("Company Roster")}
  <div class="roster-main">
    <div class="roster-section">
      <div class="roster-section-header roster-section-active">
        <span class="roster-section-label">Active</span>
        <span class="roster-section-count">${activeEntries.length} / ${activeCount}</span>
      </div>
      <div class="roster-grid" id="roster-active-grid">
        ${activeEntries.map((e) => rosterSoldierCard(e.soldier, e.slotIndex, true)).join("")}
        ${isEmptyRoster
          ? `<div class="roster-empty-recruit-wrap">
              <button type="button" id="roster-empty-recruit-btn" class="game-btn game-btn-lg roster-empty-recruit-btn">Recruit Soldiers</button>
            </div>`
          : ""}
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
  <div class="roster-footer troops-market-footer">
    <div class="footer-banner">
      <div class="roster-footer-actions">
        <button type="button" id="roster-formation-btn" class="equip-troops-btn">Formation</button>
        <button type="button" id="roster-rest-btn" class="equip-troops-btn roster-rest-btn">Rest Troops</button>
      </div>
      <div class="recruit-balance-bar">
        <span class="recruit-balance-item">
          <img src="/images/soldier_count.png" alt="" class="roster-soldier-count-icon" width="14" height="18" aria-hidden="true">
          <strong>Soldiers</strong> ${company?.soldiers?.length ?? 0}
        </span>
      </div>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>`;
}
