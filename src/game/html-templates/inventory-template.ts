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
import { getWeaponRestrictRole } from "../../utils/equip-utils.ts";

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
      rows.push(["Class", `${Math.max(1, Math.min(10, speedBase))} (speed 1–10)`]);
    rows.push(["Speed", `${(intervalMs / 1000).toFixed(1)}s`]);
    if (speedMult != null) {
      const pct = Math.round((1 / speedMult - 1) * 100);
      const rateLabel = pct > 0 ? `+${pct}%` : `${pct}%`;
      rows.push(["Rate", rateLabel]);
    }
  }
  if (item.type === "ballistic_weapon" || item.type === "melee_weapon") {
    const role = getWeaponRestrictRole(item) ?? (item as Item & { restrictRole?: string }).restrictRole ?? "any";
    const roleLabel = role === "any" ? "Any" : role.charAt(0).toUpperCase() + role.slice(1) + " only";
    rows.push(["Role", roleLabel]);
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

const WEAPON_ROLE_LABELS: Record<string, string> = {
  rifleman: "Rifleman",
  support: "Support",
  medic: "Medic",
  any: "Any",
};

function inventoryItemCard(item: Item, index: number): string {
  const iconUrl = getItemIconUrl(item);
  const uses = item.uses;
  const level = item.level ?? 1;
  const rarity = item.rarity ?? "common";
  const qty = item.quantity ?? 1;
  const badgeN = uses ?? (item.quantity != null ? item.quantity : (qty > 1 ? qty : null));
  const isWeapon = item.type === "ballistic_weapon" || item.type === "melee_weapon";
  const isSupplies = item.type === "throwable" || item.type === "medical" || item.type === "gear";
  const weaponRole = isWeapon ? (getWeaponRestrictRole(item) ?? (item as { restrictRole?: string }).restrictRole ?? "any") : null;
  const roleBadgeHtml = weaponRole ? `<span class="market-weapon-role-badge role-${weaponRole}">${WEAPON_ROLE_LABELS[weaponRole] ?? weaponRole}</span>` : "";
  const usesBadgeHtml = isSupplies && badgeN != null && badgeN >= 1 ? `<span class="market-item-uses-badge">×${badgeN}</span>` : "";
  const iconHtml = iconUrl
    ? `<div class="market-item-icon-wrap"><img class="market-item-icon" src="${iconUrl}" alt="${item.name}" width="42" height="42"><span class="item-level-badge rarity-${rarity}">Lv${level}</span>${usesBadgeHtml}${roleBadgeHtml}</div>`
    : "";
  const cardRarity = rarity !== "common" ? ` market-item-rarity-${rarity} rarity-${rarity}` : "";
  return `
<div class="inventory-item-card market-item-slot gear-market-item${cardRarity}" data-item-index="${index}" data-item-id="${item.id}" data-item-json="${escapeAttr(JSON.stringify(item))}" role="button" tabindex="0">
  <div class="market-item-inner">
    ${iconHtml}
    <div class="market-item-details">
      <span class="market-item-name">${item.name}</span>
      <span class="market-item-rarity-badge rarity-${rarity}">${(rarity as string).toUpperCase()}</span>
    </div>
  </div>
  <button type="button" class="inventory-destroy-btn" data-item-index="${index}" title="Destroy">🗑</button>
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
  const isWeapon = item.type === "ballistic_weapon" || item.type === "melee_weapon";
  const isSupplies = item.type === "throwable" || item.type === "medical" || item.type === "gear";
  const weaponRole = isWeapon ? (getWeaponRestrictRole(item) ?? (item as { restrictRole?: string }).restrictRole ?? "any") : null;
  const roleBadgeHtml = weaponRole ? `<span class="market-weapon-role-badge role-${weaponRole}">${WEAPON_ROLE_LABELS[weaponRole] ?? weaponRole}</span>` : "";
  const usesBadgeHtml = isSupplies && badgeN != null && badgeN >= 1 ? `<span class="market-item-uses-badge">×${badgeN}</span>` : "";
  const iconHtml = iconUrl
    ? `<div class="market-item-icon-wrap"><img class="market-item-icon" src="${iconUrl}" alt="${item.name}" width="42" height="42"><span class="item-level-badge rarity-${rarity}">Lv${level}</span>${usesBadgeHtml}${roleBadgeHtml}</div>`
    : "";
  const cardRarity = rarity !== "common" ? ` market-item-rarity-${rarity} rarity-${rarity}` : "";
  return `
<div class="inventory-item-card holding-item-card market-item-slot gear-market-item${cardRarity}" data-item-json="${escapeAttr(JSON.stringify(item))}" role="button" tabindex="0">
  <div class="market-item-inner">
    ${iconHtml}
    <div class="market-item-details">
      <span class="market-item-name">${item.name}</span>
      <span class="market-item-rarity-badge rarity-${rarity}">${(rarity as string).toUpperCase()}</span>
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
  <div id="item-stats-popup" class="item-stats-popup gear-buy-popup supplies-buy-popup" hidden role="dialog" aria-modal="true">
    <div class="item-stats-popup-inner gear-buy-popup-inner supplies-buy-popup-inner">
      <div class="gear-buy-title-wrap">
        <h4 id="item-stats-popup-title" class="supplies-buy-title"></h4>
        <button type="button" id="item-stats-popup-close" class="popup-close-btn">×</button>
      </div>
      <div id="item-stats-popup-body" class="item-stats-popup-body supplies-buy-body"></div>
      <div class="item-popup-actions item-market-purchase item-popup-equip-only">
        <button type="button" id="item-stats-popup-equip" class="mbtn blue equipment-buy-btn-full" style="display:none">Equip</button>
      </div>
    </div>
  </div>
  ${companyHeaderPartial("Company Armory")}
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
    <div class="footer-banner">
      <div class="inventory-footer-actions">
        <button type="button" id="equip-troops-btn" class="equip-troops-btn">Equip Soldiers</button>
      </div>
      <div class="recruit-balance-bar">
        <span class="recruit-balance-item">
          <img src="/images/soldier_count.png" alt="" class="roster-soldier-count-icon" width="14" height="18" aria-hidden="true">
          <strong>Soldiers</strong> ${company?.soldiers?.length ?? 0}
        </span>
        <span class="recruit-balance-item inventory-level-label">Armory Level ${store.company?.level ?? store.companyLevel ?? 1}</span>
      </div>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>`;
}
