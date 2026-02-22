import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import { equipPickerTemplate } from "./equip-picker-template.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { getArmorySlots } from "../../constants/economy.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import type { Item } from "../../constants/items/types.ts";
import { ITEM_TYPES } from "../../constants/items/types.ts";

export function getItemPopupBodyHtml(item: Item): string {
  const rows: [string, string][] = [];
  if (item.damage != null) rows.push(["Damage", String(item.damage)]);
  if (item.toughness != null) rows.push(["Armor", String(item.toughness)]);
  if (item.speed_base != null) rows.push(["Speed", String(item.speed_base)]);
  if (item.rarity) rows.push(["Rarity", (item.rarity as string).toUpperCase()]);
  if (item.description) rows.push(["Description", item.description]);
  const col1 = rows.filter((_, i) => i % 2 === 0);
  const col2 = rows.filter((_, i) => i % 2 === 1);
  const maxLen = Math.max(col1.length, col2.length);
  let html = '<div class="item-popup-grid">';
  for (let i = 0; i < maxLen; i++) {
    html += '<div class="item-popup-row">';
    html += col1[i] ? `<div class="item-popup-cell"><strong>${col1[i][0]}</strong> ${col1[i][1]}</div>` : "<div></div>";
    html += col2[i] ? `<div class="item-popup-cell"><strong>${col2[i][0]}</strong> ${col2[i][1]}</div>` : "<div></div>";
    html += "</div>";
  }
  html += "</div>";
  return html;
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inventoryItemCard(item: Item, index: number): string {
  const iconUrl = getItemIconUrl(item);
  const qty = item.quantity ?? 1;
  const uses = item.uses;
  const rarity = item.rarity ?? "common";
  const badgeN = uses != null ? uses : (qty > 1 ? qty : 0);
  return `
<div class="inventory-item-card" data-item-index="${index}" data-item-id="${item.id}" data-item-json="${escapeAttr(JSON.stringify(item))}">
  <div class="inventory-item-inner">
    ${iconUrl ? `<img class="inventory-item-icon" src="${iconUrl}" alt="${item.name}" width="48" height="48">` : ""}
    <div class="inventory-item-details">
      <span class="inventory-item-name">${item.name}</span>
      <span class="inventory-item-rarity rarity-${rarity}">${(rarity as string).toUpperCase()}</span>
      ${badgeN > 0 ? `<span class="inventory-item-qty inventory-uses-badge">×${badgeN}</span>` : ""}
    </div>
    <button type="button" class="mbtn icon-btn inventory-destroy-btn" data-item-index="${index}" title="Destroy">🗑</button>
  </div>
</div>`;
}

function filterByType(items: Item[], type: string): Item[] {
  return items.filter((i) => (i.type as string) === type);
}

export function inventoryTemplate(): string {
  const store = usePlayerCompanyStore.getState();
  const company = store.company;
  const items = company?.inventory ?? [];
  const weapons = filterByType(items, ITEM_TYPES.ballistic_weapon);
  const armor = filterByType(items, ITEM_TYPES.armor);
  const equipment = items.filter((i) => {
    const t = i.type as string;
    return t === ITEM_TYPES.throwable || t === ITEM_TYPES.medical || t === ITEM_TYPES.gear;
  });

  const weaponIndices = weapons.map((w) => items.indexOf(w));
  const armorIndices = armor.map((a) => items.indexOf(a));
  const equipmentIndices = equipment.map((e) => items.indexOf(e));

  return `
<div id="inventory-screen" class="inventory-root troops-market-root">
  ${equipPickerTemplate()}
  <div id="item-stats-popup" class="item-stats-popup" hidden role="dialog">
    <div class="item-stats-popup-inner">
      <h4 id="item-stats-popup-title" class="item-stats-popup-title"></h4>
      <div id="item-stats-popup-body" class="item-stats-popup-body"></div>
      <div class="item-stats-popup-actions">
        <button type="button" id="item-stats-popup-equip" class="mbtn blue mbtn-sm" style="display:none">Equip</button>
        <button type="button" id="item-stats-popup-close" class="mbtn red mbtn-sm">Close</button>
      </div>
    </div>
  </div>
  ${companyHeaderPartial("Company Armory")}
  <div class="inventory-banner flex justify-between align-center p-2">
    <span></span>
    <button type="button" id="equip-troops-btn" class="mbtn blue mbtn-sm">Equip Troops</button>
  </div>
  <div class="inventory-main">
    <div class="inventory-section">
      <h4 class="inventory-section-title">Weapons</h4>
      <div class="inventory-grid" id="inventory-weapons">
        ${weapons.map((item, i) => inventoryItemCard(item, weaponIndices[i])).join("")}
        ${weapons.length === 0 ? '<p class="inventory-empty">No weapons</p>' : ""}
      </div>
    </div>
    <div class="inventory-section">
      <h4 class="inventory-section-title">Armor</h4>
      <div class="inventory-grid" id="inventory-armor">
        ${armor.map((item, i) => inventoryItemCard(item, armorIndices[i])).join("")}
        ${armor.length === 0 ? '<p class="inventory-empty">No armor</p>' : ""}
      </div>
    </div>
    <div class="inventory-section">
      <h4 class="inventory-section-title">Equipment & Supplies</h4>
      <div class="inventory-grid" id="inventory-equipment">
        ${equipment.map((item, i) => inventoryItemCard(item, equipmentIndices[i])).join("")}
        ${equipment.length === 0 ? '<p class="inventory-empty">No equipment</p>' : ""}
      </div>
    </div>
  </div>
  <div class="inventory-footer troops-market-footer">
    <div class="recruit-balance-bar">
      <span class="recruit-balance-item"><strong>Credits</strong> $${store.creditBalance}</span>
      <span class="recruit-balance-item"><strong>Armory</strong> ${items.length}/${getArmorySlots(store.company?.level ?? store.companyLevel ?? 1)}</span>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>`;
}
