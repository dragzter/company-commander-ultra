import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import { Partial } from "./partials/partial.ts";
import { getLevelFromExperience } from "../../constants/economy.ts";
import type { Soldier } from "../entities/types.ts";
import type { Item } from "../../constants/items/types.ts";
import {
  getActiveSlots,
  getReserveSlots,
  getFormationSlots,
  getSoldierById,
  getActiveRoleCounts,
} from "../../constants/company-slots.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { formatDesignation, formatDisplayName, getSoldierPortraitUrl } from "../../utils/name-utils.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import { getBaseAndGearStats } from "../../utils/soldier-stats-utils.ts";

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

let _lastFormationSwap: [number, number] | null = null;
export function setFormationSwapIndices(indices: [number, number] | null) {
  _lastFormationSwap = indices;
}

function formationEquipSlot(
  item: Item | undefined,
  soldierId: string,
  slotType: "weapon" | "armor" | "equipment",
  eqIndex: number,
): string {
  const dataAttrs = `data-soldier-id="${soldierId}" data-slot-type="${slotType}" data-eq-index="${eqIndex}" data-slot-item="${item ? escapeAttr(JSON.stringify(item)) : ""}" role="button" tabindex="0"`;
  if (!item) return `<div class="formation-equip-slot formation-equip-empty formation-equip-droppable" title="Empty" ${dataAttrs}><span class="formation-equip-placeholder">—</span></div>`;
  const iconUrl = getItemIconUrl(item);
  const level = item.level ?? 1;
  const rarity = (item.rarity ?? "common") as string;
  const name = item.name ?? "?";
  const uses = item.uses ?? item.quantity;
  const usesBadge = uses != null ? `<span class="equip-slot-uses-badge">×${uses}</span>` : "";
  if (!iconUrl) return `<div class="formation-equip-slot formation-equip-empty formation-equip-droppable" title="${name}" ${dataAttrs}><span class="formation-equip-placeholder">—</span></div>`;
  return `
<div class="formation-equip-slot item-icon-wrap formation-equip-droppable" title="${name}" ${dataAttrs}>
  <img class="formation-equip-icon" src="${iconUrl}" alt="" width="32" height="32">
  <span class="item-level-badge formation-equip-level rarity-${rarity}">Lv${level}</span>
  ${usesBadge}
</div>`;
}

function formationSoldierCard(
  s: Soldier,
  slotIndex: number,
  isActive: boolean,
  justSwapped: boolean
): string {
  const des = (s.designation ?? "rifleman").toLowerCase();
  const slotClass = isActive ? "formation-active-slot" : "formation-reserve-slot";
  const swapClass = justSwapped ? " formation-just-swapped" : "";
  const lvl = getLevelFromExperience(s.experience ?? 0);
  const bg = getBaseAndGearStats(s);
  return `
<div class="formation-soldier-card entity-card designation-${des} ${slotClass}${swapClass}" data-soldier-id="${s.id}" data-slot-index="${slotIndex}" data-soldier-json="${escapeAttr(JSON.stringify(s))}" data-has-soldier="true">
  <div class="formation-card-inner">
    <div class="formation-left">
      <div class="formation-avatar-wrap">
        <img class="formation-avatar" src="${getSoldierPortraitUrl(s.avatar, s.designation)}" alt="">
        <span class="formation-level-badge item-level-badge">Lv${lvl}</span>
        <span class="formation-role-badge market-weapon-role-badge role-${des}">${formatDesignation(s.designation)}</span>
      </div>
      <div class="formation-hp-wrap">
        <div class="formation-hp-bar" style="width: 100%"></div>
        <span class="formation-hp-value">HP ${bg.hp.base}${bg.hp.gear > 0 ? `+<span class="stat-gear">${bg.hp.gear}</span>` : ""}</span>
      </div>
    </div>
      <div class="formation-details">
      <div class="formation-name-block">
        <span class="formation-name">${formatDisplayName(s.name)}</span>
      </div>
      <div class="formation-equip-row">
        ${formationEquipSlot(s.weapon as Item | undefined, s.id, "weapon", 0)}
        ${formationEquipSlot(s.armor as Item | undefined, s.id, "armor", 0)}
      </div>
      <div class="formation-equip-row">
        ${formationEquipSlot((s.inventory ?? [])[0] as Item | undefined, s.id, "equipment", 0)}
        ${formationEquipSlot((s.inventory ?? [])[1] as Item | undefined, s.id, "equipment", 1)}
      </div>
    </div>
  </div>
  <div class="card-footer">
    ${Partial.create.soldierXpBar(s)}
  </div>
</div>`;
}

function formationEmptySlot(slotIndex: number, isActive: boolean): string {
  const slotClass = isActive ? "formation-active-slot" : "formation-reserve-slot";
  return `
<div class="formation-soldier-card formation-empty-slot ${slotClass}" data-slot-index="${slotIndex}" data-has-soldier="false" aria-hidden="true">
  <div class="formation-card-inner">
    <span class="formation-empty-label">Empty</span>
  </div>
</div>`;
}

export function formationTemplate(): string {
  const store = usePlayerCompanyStore.getState();
  const company = store.company;
  const formationSlots = getFormationSlots(company);
  const activeCount = getActiveSlots(company);
  const reserveCount = getReserveSlots(company);
  const roleCounts = getActiveRoleCounts(company);
  const swapped = _lastFormationSwap;
  const roleSummary = `
    <span class="role-pill role-pill-rifleman">${roleCounts.rifleman}/${roleCounts.activeCapacity} Rifleman</span>
    <span class="role-pill role-pill-support">${roleCounts.support}/${roleCounts.maxSupport} Support</span>
    <span class="role-pill role-pill-medic">${roleCounts.medic}/${roleCounts.maxMedic} Medic</span>
  `;

  const activeSlots: string[] = [];
  for (let i = 0; i < activeCount; i++) {
    const sid = formationSlots[i];
    const s = sid ? getSoldierById(company, sid) : null;
    if (s) {
      activeSlots.push(formationSoldierCard(s, i, true, swapped !== null && swapped.includes(i)));
    } else {
      activeSlots.push(formationEmptySlot(i, true));
    }
  }

  const reserveSlots: string[] = [];
  for (let i = 0; i < reserveCount; i++) {
    const idx = activeCount + i;
    const sid = formationSlots[idx];
    const s = sid ? getSoldierById(company, sid) : null;
    if (s) {
      reserveSlots.push(formationSoldierCard(s, idx, false, swapped !== null && swapped.includes(idx)));
    } else {
      reserveSlots.push(formationEmptySlot(idx, false));
    }
  }

  return `
<div id="formation-screen" class="formation-root troops-market-root" data-selected-index="-1">
  ${companyHeaderPartial("Formation")}
  <div class="formation-role-banner">${roleSummary}</div>
  <div class="formation-main">
    <div class="formation-section">
      <h4 class="formation-section-title">Active (${formationSlots.slice(0, activeCount).filter((id) => id != null).length}/${activeCount})</h4>
      <div class="formation-grid formation-grid-2col" id="formation-active-grid">
        ${activeSlots.join("")}
      </div>
    </div>
    <div class="formation-section">
      <h4 class="formation-section-title">Reserve</h4>
      <div class="formation-grid formation-grid-2col" id="formation-reserve-grid">
        ${reserveSlots.join("")}
      </div>
    </div>
  </div>
  <div class="formation-footer troops-market-footer">
    <div class="footer-banner">
      <div class="roster-footer-actions">
        <button type="button" id="formation-back-btn" class="equip-troops-btn">Back to Roster</button>
      </div>
      <div class="recruit-balance-bar">
        <span class="recruit-balance-item"><strong>Soldiers</strong> ${company?.soldiers?.length ?? 0}</span>
      </div>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>`;
}
