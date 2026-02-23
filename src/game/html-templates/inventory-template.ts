import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import { equipPickerTemplate } from "./equip-picker-template.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import {
  getWeaponArmorySlots,
  getArmorArmorySlots,
  getEquipmentArmorySlots,
  getTotalArmorySlots,
} from "../../constants/economy.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import type { Item, ArmorBonus } from "../../constants/items/types.ts";
import { ITEM_TYPES } from "../../constants/items/types.ts";
import { computeAttackIntervalMs } from "../../constants/combat.ts";
import { WEAPON_EFFECTS } from "../../constants/items/weapon-effects.ts";
import { getItemEffectDescription } from "../../constants/item-effect-descriptions.ts";

const STAT_LABELS: Record<string, string> = {
  toughness: "TGH",
  hp: "HP",
  dex: "DEX",
  awareness: "AWR",
  morale: "MOR",
  mitigation: "MIT",
  avoidance: "AVD",
};

export function getItemPopupBodyHtml(item: Item): string {
  const rarity = (item.rarity ?? "common") as string;
  const iconUrl = getItemIconUrl(item);
  const level = item.level ?? 1;

  let html = '<div class="item-popup-body" data-rarity="' + rarity + '">';
  html += '<div class="item-popup-hero">';
  if (iconUrl) {
    html += `<div class="item-popup-icon-wrap item-icon-wrap"><img class="item-popup-icon" src="${iconUrl}" alt="" width="64" height="64"><span class="item-level-badge rarity-${rarity}">Lv${level}</span></div>`;
  }
  html += '<div class="item-popup-name-wrap"><h4 class="item-popup-name">' + escapeHtml(item.name) + '</h4></div>';
  html += '</div>';

  const rows: [string, string][] = [];
  if (item.damage_min != null && item.damage_max != null) {
    rows.push(["Damage", `${item.damage_min}–${item.damage_max}`]);
  } else if (item.damage != null) {
    rows.push(["Damage", String(item.damage)]);
  }
  if (item.toughness != null) rows.push(["Toughness", String(item.toughness)]);
  const speedBase = item.speed_base ?? (item as Item & { speed_base?: number }).speed_base;
  if (speedBase != null) {
    let intervalMs = computeAttackIntervalMs(item as Item & { speed_base?: number }, 0);
    const weaponEffect = (item as Item & { weaponEffect?: string }).weaponEffect;
    let speedMult: number | null = null;
    if (weaponEffect) {
      const mult = WEAPON_EFFECTS[weaponEffect as keyof typeof WEAPON_EFFECTS]?.modifiers?.attackIntervalMultiplier;
      if (mult != null) {
        intervalMs = Math.round(intervalMs * mult);
        speedMult = mult;
      }
    }
    rows.push(["Speed", `${(intervalMs / 1000).toFixed(1)}s`]);
    if (speedMult != null) rows.push(["Spd×", String(speedMult)]);
  }
  rows.push(["Rarity", (rarity as string).toUpperCase()]);
  html += '<div class="item-popup-stats">';
  for (const [label, value] of rows) {
    const valueClass = label === "Rarity" ? `item-popup-stat-value rarity-badge-inline rarity-${rarity}` : "item-popup-stat-value";
    html += `<div class="item-popup-stat-row"><span class="item-popup-stat-label">${escapeHtml(label)}</span><span class="${valueClass}">${escapeHtml(value)}</span></div>`;
  }
  html += '</div>';

  const bonuses = (item as Item & { bonuses?: ArmorBonus[] }).bonuses;
  if (bonuses?.length) {
    const badges = bonuses.map((b) => {
      const label = STAT_LABELS[b.stat] ?? b.stat.toUpperCase();
      const text = b.type === "percent" ? `+${b.value}% ${label}` : `+${b.value} ${label}`;
      return `<span class="item-popup-bonus-badge">${escapeHtml(text)}</span>`;
    });
    html += `<div class="item-popup-bonus"><span class="item-popup-bonus-hint">Bonus</span><div class="item-popup-bonus-row">${badges.join("")}</div></div>`;
  }
  const effectDesc = getItemEffectDescription(item);
  if (effectDesc) {
    html += `<div class="item-popup-effect"><span class="item-popup-effect-hint">Effect</span><p class="item-popup-effect-text">${escapeHtml(effectDesc)}</p></div>`;
  }
  if (item.description) {
    html += `<p class="item-popup-desc">${escapeHtml(item.description)}</p>`;
  }
  const weaponEffect = (item as Item & { weaponEffect?: string }).weaponEffect;
  if (weaponEffect && WEAPON_EFFECTS[weaponEffect as keyof typeof WEAPON_EFFECTS]) {
    const ef = WEAPON_EFFECTS[weaponEffect as keyof typeof WEAPON_EFFECTS];
    html += `<div class="item-popup-trait"><span class="item-popup-trait-name">${escapeHtml(ef.name)}</span> <span class="item-popup-trait-desc">${escapeHtml(ef.description)}</span></div>`;
  }
  html += "</div>";
  return html;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inventoryItemCard(item: Item, index: number): string {
  const iconUrl = getItemIconUrl(item);
  const qty = item.quantity ?? 1;
  const uses = item.uses;
  const level = item.level ?? 1;
  const rarity = item.rarity ?? "common";
  const badgeN = uses ?? (item.quantity != null ? item.quantity : (qty > 1 ? qty : null));
  const iconHtml = iconUrl
    ? `<div class="item-icon-wrap"><img class="inventory-item-icon" src="${iconUrl}" alt="${item.name}" width="48" height="48"><span class="item-level-badge rarity-${rarity}">Lv${level}</span></div>`
    : "";
  const cardRarity = rarity !== "common" ? ` rarity-${rarity}` : "";
  return `
<div class="inventory-item-card${cardRarity}" data-item-index="${index}" data-item-id="${item.id}" data-item-json="${escapeAttr(JSON.stringify(item))}">
  <div class="inventory-item-inner">
    ${iconHtml}
    <div class="inventory-item-details">
      <span class="inventory-item-name">${item.name}</span>
      <span class="inventory-item-rarity rarity-${rarity}">${(rarity as string).toUpperCase()}</span>
      ${badgeN != null && badgeN >= 1 ? `<span class="inventory-item-qty inventory-uses-badge">×${badgeN}</span>` : ""}
    </div>
    <button type="button" class="mbtn icon-btn inventory-destroy-btn" data-item-index="${index}" title="Destroy">🗑</button>
  </div>
</div>`;
}

function filterByType(items: Item[], type: string): Item[] {
  return items.filter((i) => (i.type as string) === type);
}

function holdingItemCard(item: Item): string {
  const iconUrl = getItemIconUrl(item);
  const qty = item.quantity ?? 1;
  const uses = item.uses;
  const level = item.level ?? 1;
  const rarity = item.rarity ?? "common";
  const badgeN = uses ?? (item.quantity != null ? item.quantity : (qty > 1 ? qty : null));
  const iconHtml = iconUrl
    ? `<div class="item-icon-wrap"><img class="inventory-item-icon" src="${iconUrl}" alt="${item.name}" width="48" height="48"><span class="item-level-badge rarity-${rarity}">Lv${level}</span></div>`
    : "";
  const cardRarity = rarity !== "common" ? ` rarity-${rarity}` : "";
  return `
<div class="inventory-item-card holding-item-card${cardRarity}" data-item-json="${escapeAttr(JSON.stringify(item))}">
  <div class="inventory-item-inner">
    ${iconHtml}
    <div class="inventory-item-details">
      <span class="inventory-item-name">${item.name}</span>
      <span class="inventory-item-rarity rarity-${rarity}">${(rarity as string).toUpperCase()}</span>
      ${badgeN != null && badgeN >= 1 ? `<span class="inventory-item-qty inventory-uses-badge">×${badgeN}</span>` : ""}
    </div>
  </div>
</div>`;
}

export function inventoryTemplate(): string {
  const store = usePlayerCompanyStore.getState();
  const company = store.company;
  const items = company?.inventory ?? [];
  const holding = company?.holding_inventory ?? [];
  const weapons = filterByType(items, ITEM_TYPES.ballistic_weapon);
  const armor = filterByType(items, ITEM_TYPES.armor);
  const equipment = items.filter((i) => {
    const t = i.type as string;
    return t === ITEM_TYPES.throwable || t === ITEM_TYPES.medical || t === ITEM_TYPES.gear;
  });

  const weaponIndices = weapons.map((w) => items.indexOf(w));
  const armorIndices = armor.map((a) => items.indexOf(a));
  const equipmentIndices = equipment.map((e) => items.indexOf(e));

  const holdingSection =
    holding.length === 0
      ? ""
      : `
    <div class="inventory-section inventory-holding-section">
      <h4 class="inventory-section-title">Items Waiting (Armory Full)</h4>
      <p class="inventory-holding-hint">Mission rewards are waiting. Make room in your armory to claim them.</p>
      <div class="inventory-holding-actions">
        <button type="button" id="claim-holding-inventory-btn" class="mbtn blue mbtn-sm">Claim to Armory</button>
      </div>
      <div class="inventory-grid" id="inventory-holding">
        ${holding.map((item) => holdingItemCard(item)).join("")}
      </div>
    </div>`;

  return `
<div id="inventory-screen" class="inventory-root troops-market-root">
  ${equipPickerTemplate()}
  <div id="item-stats-popup" class="item-stats-popup" hidden role="dialog">
    <div class="item-stats-popup-inner">
      <h4 id="item-stats-popup-title" class="item-stats-popup-title"></h4>
      <div id="item-stats-popup-body" class="item-stats-popup-body"></div>
      <div class="item-stats-popup-actions">
        <button type="button" id="item-stats-popup-equip" class="mbtn blue mbtn-sm" style="display:none">Equip</button>
        <button type="button" id="item-stats-popup-close" class="popup-close-btn">×</button>
      </div>
    </div>
  </div>
  ${companyHeaderPartial("Company Armory")}
  <div class="inventory-level-banner flex align-center justify-center p-2">
    <span class="inventory-level-label">Armory Level ${store.company?.level ?? store.companyLevel ?? 1}</span>
  </div>
  <div class="inventory-banner flex justify-between align-center p-2">
    <span></span>
    <button type="button" id="equip-troops-btn" class="mbtn blue mbtn-sm">Equip Troops</button>
  </div>
  <div class="inventory-main">
    <div class="inventory-section">
      <h4 class="inventory-section-title">Weapons <span class="inventory-section-cap">${weapons.length} / ${getWeaponArmorySlots(store.company?.level ?? store.companyLevel ?? 1)}</span></h4>
      <div class="inventory-grid" id="inventory-weapons">
        ${weapons.map((item, i) => inventoryItemCard(item, weaponIndices[i])).join("")}
        ${weapons.length === 0 ? '<p class="inventory-empty">No weapons</p>' : ""}
      </div>
    </div>
    <div class="inventory-section">
      <h4 class="inventory-section-title">Armor <span class="inventory-section-cap">${armor.length} / ${getArmorArmorySlots(store.company?.level ?? store.companyLevel ?? 1)}</span></h4>
      <div class="inventory-grid" id="inventory-armor">
        ${armor.map((item, i) => inventoryItemCard(item, armorIndices[i])).join("")}
        ${armor.length === 0 ? '<p class="inventory-empty">No armor</p>' : ""}
      </div>
    </div>
    <div class="inventory-section">
      <h4 class="inventory-section-title">Equipment & Supplies <span class="inventory-section-cap">${equipment.length} / ${getEquipmentArmorySlots(store.company?.level ?? store.companyLevel ?? 1)}</span></h4>
      <div class="inventory-grid" id="inventory-equipment">
        ${equipment.map((item, i) => inventoryItemCard(item, equipmentIndices[i])).join("")}
        ${equipment.length === 0 ? '<p class="inventory-empty">No equipment</p>' : ""}
      </div>
    </div>
    ${holdingSection}
  </div>
  <div class="inventory-footer troops-market-footer">
    <div class="recruit-balance-bar">
      <span class="recruit-balance-item"><strong>Credits</strong> $${store.creditBalance}</span>
      <span class="recruit-balance-item"><strong>Armory</strong> ${items.length}/${getTotalArmorySlots(store.company?.level ?? store.companyLevel ?? 1)}</span>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>`;
}
