import type { Soldier } from "../entities/types.ts";
import type { Item } from "../../constants/items/types.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import { formatDesignation, formatDisplayName, getSoldierPortraitUrl } from "../../utils/name-utils.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { MAX_EQUIPMENT_SLOTS } from "../../constants/inventory-slots.ts";
import { getLevelFromExperience } from "../../constants/economy.ts";
import { getActiveSlots, getFormationSlots, getSoldierById } from "../../constants/company-slots.ts";
import { soldierXpBar } from "./components/soldier-xp-bar.ts";

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function slotHtml(
  soldierId: string,
  slotType: "weapon" | "armor" | "equipment",
  item: Item | undefined,
  eqIndex: number,
  designation: string,
): string {
  const iconUrl = item ? getItemIconUrl(item) : "";
  const name = item?.name ?? "Empty";
  const level = item?.level;
  const dataSlot = slotType === "equipment" ? `data-eq-index="${eqIndex}"` : "";
  const slotClass = item ? "equip-slot-filled" : "equip-slot-empty";
  const rarityClass = item && item.rarity && item.rarity !== "common" ? ` rarity-${item.rarity}` : "";
  const designationClass = `designation-${designation}`;
  const slotTypeClass = slotType === "weapon" ? "equip-slot-weapon" : slotType === "armor" ? "equip-slot-armor" : "";
  const slotLetter = slotType === "weapon" ? "W" : slotType === "armor" ? "A" : "";
  const content = iconUrl
    ? `<img src="${iconUrl}" alt="${name}" width="48" height="48">`
    : slotLetter
      ? `<span class="equip-slot-letter">${slotLetter}</span>`
      : "<span class='equip-slot-placeholder'>—</span>";
  const uses = item?.uses;
  const rarity = item?.rarity ?? "common";
  const noLevel = (item as { noLevel?: boolean })?.noLevel;
  const usesBadge = uses != null ? `<span class="equip-slot-uses-badge">×${uses}</span>` : "";
  const levelBadge = item && !noLevel ? `<span class="equip-slot-level rarity-${rarity}">Lv${level ?? 1}</span>` : "";
  return `
<div class="equip-slot ${slotClass}${rarityClass} ${slotTypeClass} ${designationClass}" data-soldier-id="${soldierId}" data-slot-type="${slotType}" ${dataSlot} data-slot-item="${item ? escapeAttr(JSON.stringify(item)) : ""}" role="button" tabindex="0">
  <div class="equip-slot-inner">
    ${content}
    ${usesBadge}
    ${levelBadge}
  </div>
</div>`;
}

function soldierRow(s: Soldier, isActive: boolean): string {
  const des = (s.designation ?? "").toLowerCase();
  const weaponSlot = slotHtml(s.id, "weapon", s.weapon as Item | undefined, 0, des);
  const armorSlot = slotHtml(s.id, "armor", s.armor as Item | undefined, 0, des);
  const inv = s.inventory ?? [];
  const eqSlots: string[] = [];
  for (let i = 0; i < Math.max(MAX_EQUIPMENT_SLOTS, inv.length); i++) {
    eqSlots.push(slotHtml(s.id, "equipment", inv[i], i, des));
  }
  for (let i = eqSlots.length; i < MAX_EQUIPMENT_SLOTS; i++) {
    eqSlots.push(slotHtml(s.id, "equipment", undefined, i, des));
  }
  const unequipBtn = `<button type="button" class="equip-unequip-all-btn" data-soldier-id="${s.id}" title="Unequip all to armory"><span class="equip-unequip-icon">&#8595;&#65038;</span><span class="equip-unequip-label">All</span></button>`;
  const coreSlots = `${weaponSlot}${armorSlot}${eqSlots.join("")}`;
  const level = getLevelFromExperience(s.experience ?? 0);
  const statusBadge = `<span class="equip-picker-status-badge ${isActive ? "equip-picker-status-active" : "equip-picker-status-reserve"}">${isActive ? "Active" : "Reserve"}</span>`;
  return `
<div class="equip-picker-soldier entity-card designation-${des}" data-soldier-id="${s.id}" data-soldier-json="${escapeAttr(JSON.stringify(s))}">
  ${statusBadge}
  <div class="equip-picker-soldier-top-row">
    <span class="equip-picker-name">${formatDisplayName(s.name)}</span>
    <span class="equip-picker-name-role-sep" aria-hidden="true">|</span>
    <span class="equip-picker-role equip-picker-role-${des || "rifleman"}" data-role="${des || "rifleman"}">${formatDesignation(s.designation)}</span>
  </div>
  <div class="equip-picker-soldier-bottom-row">
    <div class="equip-picker-avatar-wrap">
      <img class="equip-picker-avatar" src="${getSoldierPortraitUrl(s.avatar, s.designation)}" alt="" width="48" height="48">
      <span class="equip-picker-soldier-level">Lv${level}</span>
    </div>
    <div class="equip-picker-slots-wrap">
      <div class="equip-picker-slots equip-picker-slots-1x5">
        ${coreSlots}
      </div>
    </div>
    ${unequipBtn}
  </div>
  <div class="card-footer">
    ${soldierXpBar(s)}
  </div>
</div>`;
}

/** Returns HTML for soldiers list - used to refresh picker without full re-render. Uses formation order (no sort). */
export function getEquipPickerBodyHtml(): { soldiers: string } {
  const store = usePlayerCompanyStore.getState();
  const company = store.company;
  const formationSlots = getFormationSlots(company);
  const activeCount = getActiveSlots(company);
  const rows: string[] = [];
  for (let i = 0; i < formationSlots.length; i++) {
    const sid = formationSlots[i];
    const s = sid ? getSoldierById(company, sid) : null;
    if (s) rows.push(soldierRow(s, i < activeCount));
  }
  return { soldiers: rows.join("") };
}

export function equipPickerTemplate(): string {
  const { soldiers } = getEquipPickerBodyHtml();

  return `
<div id="equip-picker-popup" class="equip-picker-popup" role="dialog" aria-modal="true" hidden>
  <div class="equip-picker-inner">
    <div class="equip-picker-header">
      <h4 id="equip-picker-title">Equip Troops</h4>
      <button type="button" id="equip-picker-close" class="game-btn game-btn-md game-btn-red">Close</button>
    </div>
    <div class="equip-picker-body">
      <div class="equip-picker-soldiers-list">
        ${soldiers}
      </div>
    </div>
    <div id="equip-slot-tooltip" class="equip-slot-tooltip-floating" hidden>
      <div id="equip-slot-tooltip-inner" class="equip-slot-tooltip-inner item-stats-popup-inner supplies-buy-popup-inner">
        <div id="equip-slot-tooltip-content" class="equip-slot-tooltip-content"></div>
      </div>
    </div>
    <div id="equip-supplies-popup" class="equip-supplies-popup" hidden role="dialog" aria-label="Armory">
      <div class="equip-supplies-header">
        <span id="equip-supplies-title" class="equip-supplies-title">Armory</span>
        <button type="button" class="game-btn game-btn-sm game-btn-red" id="equip-supplies-close" aria-label="Close">Close</button>
      </div>
      <div class="equip-supplies-grid" id="equip-supplies-grid"></div>
    </div>
  </div>
</div>`;
}
