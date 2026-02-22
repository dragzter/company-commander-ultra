import type { Soldier } from "../entities/types.ts";
import type { Item } from "../../constants/items/types.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import { formatDisplayName } from "../../utils/name-utils.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { MAX_EQUIPMENT_SLOTS } from "../../constants/inventory-slots.ts";

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
  const designationClass = `designation-${designation}`;
  return `
<div class="equip-slot ${slotClass} ${designationClass}" data-soldier-id="${soldierId}" data-slot-type="${slotType}" ${dataSlot} data-slot-item="${item ? escapeAttr(JSON.stringify(item)) : ""}" role="button" tabindex="0">
  <div class="equip-slot-inner">
    ${iconUrl ? `<img src="${iconUrl}" alt="${name}" width="32" height="32">` : "<span class='equip-slot-placeholder'>—</span>"}
    ${level != null ? `<span class="equip-slot-level">Lv${level}</span>` : ""}
  </div>
</div>`;
}

function soldierRow(s: Soldier): string {
  const des = (s.designation ?? "").toLowerCase();
  const weaponSlot = slotHtml(s.id, "weapon", s.weapon as Item | undefined, 0, des);
  const armorSlot = slotHtml(s.id, "armor", s.armor as Item | undefined, 0, des);
  const inv = s.inventory ?? [];
  const eqSlots: string[] = [];
  for (let i = 0; i < Math.max(MAX_EQUIPMENT_SLOTS, inv.length); i++) {
    eqSlots.push(slotHtml(s.id, "equipment", inv[i], i, des));
  }
  if (eqSlots.length < 6) {
    for (let i = eqSlots.length; i < 6; i++) {
      eqSlots.push(slotHtml(s.id, "equipment", undefined, i, des));
    }
  }
  return `
<div class="equip-picker-soldier" data-soldier-id="${s.id}" data-soldier-json="${escapeAttr(JSON.stringify(s))}">
  <div class="equip-picker-soldier-header">
    <img class="equip-picker-avatar" src="/images/green-portrait/${s.avatar}" alt="" width="36" height="36">
    <div>
      <span class="equip-picker-name">${formatDisplayName(s.name)}</span>
      <span class="equip-picker-role">${s.designation}</span>
    </div>
  </div>
  <div class="equip-picker-slots">
    <div class="equip-slot-group">
      <span class="equip-slot-label">W</span>${weaponSlot}
    </div>
    <div class="equip-slot-group">
      <span class="equip-slot-label">A</span>${armorSlot}
    </div>
    <div class="equip-slot-group equip-slot-group-eq">
      <span class="equip-slot-label">Eq</span>${eqSlots.slice(0, 6).join("")}
    </div>
  </div>
</div>`;
}

function armoryItemCard(item: Item, index: number): string {
  const iconUrl = getItemIconUrl(item);
  const name = item.name;
  const level = item.level;
  return `
<div class="equip-picker-armory-item" data-armory-index="${index}" data-armory-item="${escapeAttr(JSON.stringify(item))}" role="button" tabindex="0">
  <div class="equip-picker-armory-item-inner">
    ${iconUrl ? `<img src="${iconUrl}" alt="${name}" width="40" height="40">` : ""}
    <span class="equip-picker-armory-name">${name}</span>
    ${level != null ? `<span class="equip-picker-armory-level">Lv${level}</span>` : ""}
  </div>
</div>`;
}

/** Returns HTML for soldiers list and armory - used to refresh picker without full re-render */
export function getEquipPickerBodyHtml(): { soldiers: string; armory: string } {
  const store = usePlayerCompanyStore.getState();
  const soldiers = store.company?.soldiers ?? [];
  const armory = store.company?.inventory ?? [];
  const armoryItems = armory
    .map((item, idx) => ({ item, idx }))
    .filter(
      ({ item }) =>
        (item.type as string) === "ballistic_weapon" ||
        (item.type as string) === "armor" ||
        (item.type as string) === "throwable" ||
        (item.type as string) === "medical" ||
        (item.type as string) === "gear",
    );
  return {
    soldiers: soldiers.map((s) => soldierRow(s)).join(""),
    armory: armoryItems.map(({ item, idx }) => armoryItemCard(item, idx)).join(""),
  };
}

export function equipPickerTemplate(): string {
  const { soldiers, armory } = getEquipPickerBodyHtml();

  return `
<div id="equip-picker-popup" class="equip-picker-popup" role="dialog" aria-modal="true" hidden>
  <div class="equip-picker-inner">
    <div class="equip-picker-header">
      <h4 id="equip-picker-title">Equip Troops</h4>
      <button type="button" id="equip-picker-close" class="mbtn red mbtn-sm">Close</button>
    </div>
    <div class="equip-picker-body">
      <div class="equip-picker-soldiers">
        <h5>Soldiers</h5>
        <div class="equip-picker-soldiers-list">
          ${soldiers}
        </div>
      </div>
      <div class="equip-picker-armory">
        <h5>Armory</h5>
        <div class="equip-picker-armory-grid">
          ${armory}
      </div>
    </div>
  </div>
</div>`;
}
