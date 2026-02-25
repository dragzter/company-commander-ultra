import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import type { Soldier } from "../entities/types.ts";
import { getLevelFromExperience } from "../../constants/economy.ts";
import type { Item } from "../../constants/items/types.ts";
import type { Mission } from "../../constants/missions.ts";
import { getActiveSlots, getReserveSlots, getFormationSlots, getSoldierById } from "../../constants/company-slots.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { formatDisplayName } from "../../utils/name-utils.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import { Partial } from "./partials/partial.ts";

let _lastEquipMoveSoldierIds: string[] = [];
export function setLastEquipMoveSoldierIds(ids: string[]) {
  _lastEquipMoveSoldierIds = ids;
}
export function clearLastEquipMoveSoldierIds() {
  _lastEquipMoveSoldierIds = [];
}

let _lastReadyRoomMoveSlotIndices: number[] = [];
export function setLastReadyRoomMoveSlotIndices(indices: number[]) {
  _lastReadyRoomMoveSlotIndices = indices;
}
export function clearLastReadyRoomMoveSlotIndices() {
  _lastReadyRoomMoveSlotIndices = [];
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function readyRoomEquipSlot(
  item: Item | undefined,
  soldierId: string,
  slotType: "weapon" | "armor" | "equipment",
  eqIndex: number,
): string {
  const dataAttrs = `data-soldier-id="${soldierId}" data-slot-type="${slotType}" data-eq-index="${eqIndex}" data-slot-item="${item ? escapeAttr(JSON.stringify(item)) : ""}" role="button" tabindex="0"`;
  if (!item) return `<div class="ready-room-equip-slot ready-room-equip-empty ready-room-equip-droppable" title="Empty" ${dataAttrs}><span class="ready-room-equip-placeholder">—</span></div>`;
  const iconUrl = getItemIconUrl(item);
  const level = item.level ?? 1;
  const rarity = (item.rarity ?? "common") as string;
  const name = item.name ?? "?";
  const uses = item.uses ?? item.quantity;
  const usesBadge = uses != null ? `<span class="equip-slot-uses-badge">×${uses}</span>` : "";
  if (!iconUrl) return `<div class="ready-room-equip-slot ready-room-equip-empty ready-room-equip-droppable" title="${name}" ${dataAttrs}><span class="ready-room-equip-placeholder">—</span></div>`;
  return `
<div class="ready-room-equip-slot item-icon-wrap ready-room-equip-droppable" title="${name}" ${dataAttrs}>
  <img class="ready-room-equip-icon" src="${iconUrl}" alt="" width="38" height="38">
  <span class="item-level-badge ready-room-equip-level rarity-${rarity}">Lv${level}</span>
  ${usesBadge}
</div>`;
}

function readyRoomSoldierCard(s: Soldier, slotIndex: number, isActive: boolean): string {
  const des = (s.designation ?? "rifleman").toLowerCase();
  const slotClass = isActive ? "ready-room-active-slot" : "ready-room-reserve-slot";
  const justMoved = _lastEquipMoveSoldierIds.includes(s.id) || _lastReadyRoomMoveSlotIndices.includes(slotIndex);
  const animateClass = justMoved ? " ready-room-card-just-moved" : "";
  const lvl = getLevelFromExperience(s.experience ?? 0);
  const levelRarity = lvl >= 6 ? "epic" : lvl >= 3 ? "rare" : "common";
  return `
<div class="ready-room-soldier-card entity-card designation-${des} ${slotClass}${animateClass}" data-soldier-id="${s.id}" data-slot-index="${slotIndex}" data-soldier-json="${escapeAttr(JSON.stringify(s))}" data-has-soldier="true">
  <div class="ready-room-card-inner">
    <div class="ready-room-left">
      <div class="ready-room-avatar-wrap">
        <img class="ready-room-avatar" src="/images/green-portrait/${s.avatar}" alt="">
        <span class="ready-room-level-badge item-level-badge rarity-${levelRarity}">Lv${lvl}</span>
        <span class="ready-room-role-badge market-weapon-role-badge role-${des}">${s.designation ?? "Rifleman"}</span>
      </div>
      <div class="ready-room-hp-wrap">
        <div class="ready-room-hp-bar" style="width: 100%"></div>
        <span class="ready-room-hp-value">HP ${s.attributes.hit_points}</span>
      </div>
    </div>
    <div class="ready-room-details">
      <div class="ready-room-name-block">
        <span class="ready-room-name">${formatDisplayName(s.name)}</span>
      </div>
      <div class="ready-room-equip-row">
        ${readyRoomEquipSlot(s.weapon as Item | undefined, s.id, "weapon", 0)}
        ${readyRoomEquipSlot(s.armor as Item | undefined, s.id, "armor", 0)}
      </div>
      <div class="ready-room-equip-row">
        ${readyRoomEquipSlot((s.inventory ?? [])[0] as Item | undefined, s.id, "equipment", 0)}
        ${readyRoomEquipSlot((s.inventory ?? [])[1] as Item | undefined, s.id, "equipment", 1)}
      </div>
    </div>
  </div>
  <div class="card-footer">
    ${Partial.create.soldierXpBar(s)}
  </div>
</div>`;
}

function readyRoomEmptySlot(slotIndex: number, isActive: boolean): string {
  const slotClass = isActive ? "ready-room-active-slot" : "ready-room-reserve-slot";
  return `
<div class="ready-room-soldier-card ready-room-empty-slot ${slotClass}" data-slot-index="${slotIndex}" data-has-soldier="false" aria-hidden="true">
  <div class="ready-room-card-inner">
    <span class="ready-room-empty-label">Empty</span>
  </div>
</div>`;
}

export function readyRoomTemplate(mission: Mission | null): string {
  const store = usePlayerCompanyStore.getState();
  const company = store.company;
  const soldiers = company?.soldiers ?? [];
  const formationSlots = getFormationSlots(company);
  const activeCount = getActiveSlots(company);
  const reserveCount = getReserveSlots(company);

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

  const activeSlots: string[] = [];
  for (let i = 0; i < activeCount; i++) {
    const sid = formationSlots[i];
    const s = sid ? getSoldierById(company, sid) : null;
    if (s) {
      activeSlots.push(readyRoomSoldierCard(s, i, true));
    } else {
      activeSlots.push(readyRoomEmptySlot(i, true));
    }
  }

  const reserveSlots: string[] = [];
  for (let i = 0; i < reserveCount; i++) {
    const idx = activeCount + i;
    const sid = formationSlots[idx];
    const s = sid ? getSoldierById(company, sid) : null;
    if (s) {
      reserveSlots.push(readyRoomSoldierCard(s, idx, false));
    } else {
      reserveSlots.push(readyRoomEmptySlot(idx, false));
    }
  }

  return `
<div id="ready-room-screen" class="ready-room-root troops-market-root" data-mission-json="${missionData}" data-selected-index="-1">
  ${companyHeaderPartial(missionTitle)}
  <div class="ready-room-role-banner">${roleBreakdown}</div>
  <div class="ready-room-main">
    <div class="ready-room-section">
      <h4 class="ready-room-section-title">Active (${formationSlots.slice(0, activeCount).filter((id) => id != null).length}/${activeCount})</h4>
      <div class="ready-room-grid ready-room-grid-2col" id="ready-room-active-grid">
        ${activeSlots.join("")}
      </div>
    </div>
    <div class="ready-room-section">
      <h4 class="ready-room-section-title">Reserve</h4>
      <div class="ready-room-grid ready-room-grid-2col" id="ready-room-reserve-grid">
        ${reserveSlots.join("")}
      </div>
    </div>
  </div>
  <div class="ready-room-footer troops-market-footer">
    <div class="footer-banner">
      <div class="roster-footer-actions">
        <button type="button" id="ready-room-proceed" class="equip-troops-btn ${soldiers.length === 0 ? "disabled" : ""}">Proceed to Mission</button>
      </div>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>`;
}
