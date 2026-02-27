import { companyHeaderPartial, companyActionsTemplate } from "./game-setup-template.ts";
import { equipPickerTemplate } from "./equip-picker-template.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import {
  getWeaponArmorySlots,
  getArmorArmorySlots,
  getEquipmentArmorySlots,
} from "../../constants/economy.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import type { Item, ArmorBonus } from "../../constants/items/types.ts";
import { ITEM_TYPES } from "../../constants/items/types.ts";
import { computeAttackIntervalMs } from "../../constants/combat.ts";
import { WEAPON_EFFECTS } from "../../constants/items/weapon-effects.ts";
import {
  getItemEffectDescription,
  renderEffectDescriptionHtml,
  type EffectDescription,
} from "../../constants/item-effect-descriptions.ts";
import { getItemSpecialEffect } from "../../constants/item-special-effects.ts";
import { getWeaponRestrictRole } from "../../utils/equip-utils.ts";

/** Shared item stats popup markup – used by inventory and roster (equip picker from roster needs it). */
export function itemStatsPopupHtml(): string {
  return `
<div id="item-stats-popup" class="item-stats-popup gear-buy-popup supplies-buy-popup" hidden role="dialog" aria-modal="true">
  <div class="item-stats-popup-inner gear-buy-popup-inner supplies-buy-popup-inner">
    <div class="gear-buy-title-wrap">
      <h4 id="item-stats-popup-title" class="supplies-buy-title"></h4>
      <button type="button" id="item-stats-popup-close" class="game-btn game-btn-md game-btn-red popup-close-btn">Close</button>
    </div>
    <div id="item-stats-popup-body" class="item-stats-popup-body supplies-buy-body"></div>
    <div class="item-popup-actions item-market-purchase item-popup-equip-only">
      <button type="button" id="item-stats-popup-equip" class="mbtn blue equipment-buy-btn-full" style="display:none">Equip</button>
    </div>
  </div>
</div>`;
}

const STAT_LABELS: Record<string, string> = {
  toughness: "TGH",
  hp: "HP",
  dex: "DEX",
  awareness: "AWR",
  morale: "MOR",
  mitigation: "MIT",
  avoidance: "AVD",
  chanceToHit: "CTH",
};

export function getItemPopupBodyHtml(item: Item): string {
  const rarity = (item.rarity ?? "common") as string;
  const iconUrl = getItemIconUrl(item);
  const level = item.level ?? 1;

  let html = '<div class="item-popup-body" data-rarity="' + rarity + '">';
  html += '<div class="item-popup-hero">';
  const noLevel = (item as { noLevel?: boolean }).noLevel;
  if (iconUrl) {
    const levelBadge = !noLevel ? `<span class="item-level-badge rarity-${rarity}">Lv${level}</span>` : "";
    html += `<div class="item-popup-icon-wrap item-icon-wrap"><img class="item-popup-icon" src="${iconUrl}" alt="" width="64" height="64">${levelBadge}</div>`;
  }
  html += '<div class="item-popup-name-wrap"><h4 class="item-popup-name">' + escapeHtml(item.name) + '</h4></div>';
  html += '</div>';

  const rows: [string, string, string?][] = [];
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
        intervalMs = mult < 1 ? Math.floor(intervalMs * mult) : Math.round(intervalMs * mult);
        speedMult = mult;
      }
    }
    rows.push(["Class", `${Math.max(1, Math.min(10, speedBase))} (speed 1–10)`]);
    const speedValue = speedMult != null && speedMult < 1
      ? `${(intervalMs / 1000).toFixed(1)}s ↑${Math.round((1 - speedMult) * 100)}%`
      : `${(intervalMs / 1000).toFixed(1)}s`;
    rows.push(["Speed", speedValue, speedMult != null && speedMult < 1 ? "speed-upgraded" : undefined]);
  }
  if (item.type === "ballistic_weapon" || item.type === "melee_weapon") {
    const role = getWeaponRestrictRole(item) ?? (item as Item & { restrictRole?: string }).restrictRole ?? "any";
    const roleLabel = role === "any" ? "Any" : role.charAt(0).toUpperCase() + role.slice(1) + " only";
    rows.push(["Role", roleLabel]);
  }
  rows.push(["Rarity", (rarity as string).toUpperCase(), undefined]);
  html += '<div class="item-popup-stats">';
  for (const row of rows) {
    const [label, value, valueExtraClass] = row;
    let valueClass = label === "Rarity" ? `item-popup-stat-value rarity-badge-inline rarity-${rarity}` : "item-popup-stat-value";
    if (valueExtraClass) valueClass += ` item-popup-stat-${valueExtraClass}`;
    html += `<div class="item-popup-stat-row"><span class="item-popup-stat-label">${escapeHtml(label)}</span><span class="${valueClass}">${escapeHtml(value)}</span></div>`;
  }
  html += '</div>';

  const bonuses = (item as Item & { bonuses?: ArmorBonus[] }).bonuses;
  if (bonuses?.length) {
    const badges = bonuses.map((b) => {
      const label = STAT_LABELS[b.stat] ?? b.stat.replace(/([A-Z])/g, " $1").trim().toUpperCase().replace(/ /g, "");
      // chanceToHit bonus: show as "+1 CTH" (1% = 1 CTH). Focused effect (2% CTH) is a separate effect box.
      const text = b.type === "percent" && b.stat === "chanceToHit"
        ? `+${b.value} CTH`
        : b.type === "percent"
          ? `+${b.value}% ${label}`
          : `+${b.value} ${label}`;
      return `<span class="item-popup-bonus-badge">${escapeHtml(text)}</span>`;
    });
    html += `<div class="item-popup-bonus"><span class="item-popup-bonus-hint">Bonus</span><div class="item-popup-bonus-row">${badges.join("")}</div></div>`;
  }
  const flavor = (item as Item & { flavor?: string }).flavor;
  if (flavor) {
    html += `<p class="item-popup-flavor">${escapeHtml(flavor)}</p>`;
  }
  const specialEffectId = (item as Item & { specialEffect?: string }).specialEffect;
  const immunities = (item as Item & { immunities?: ("stun" | "panic" | "suppression" | "burning")[] }).immunities;
  if (specialEffectId) {
    const eff = getItemSpecialEffect(specialEffectId as import("../../constants/item-special-effects.ts").ItemSpecialEffectId);
    if (eff) {
      html += `<div class="item-popup-effect"><span class="item-popup-effect-hint">${escapeHtml(eff.name)}</span><p class="item-popup-effect-text">${escapeHtml(eff.description)}</p></div>`;
    }
  } else if (immunities?.length) {
    const IMMUNITY_LABELS: Record<string, string> = {
      stun: "Immune to Stun",
      panic: "Immune to Panic",
      suppression: "Immune to Suppression",
      burning: "Immune to Burning",
    };
    const immunityText = immunities.map((im) => IMMUNITY_LABELS[im] ?? im).join(". ");
    html += `<div class="item-popup-effect"><span class="item-popup-effect-hint">Immunities</span><p class="item-popup-effect-text">${escapeHtml(immunityText)}</p></div>`;
  }
  const effectDesc = getItemEffectDescription(item);
  const descForEffectBox: EffectDescription | string | null =
    effectDesc ?? ((item.type === "throwable" || item.type === "medical") && item.description ? item.description : null);
  if (descForEffectBox) {
    html += '<div class="item-popup-effect"><span class="item-popup-effect-hint">Effect</span>';
    if (typeof descForEffectBox === "string") {
      html += `<p class="item-popup-effect-text">${escapeHtml(descForEffectBox)}</p>`;
    } else {
      html += renderEffectDescriptionHtml(descForEffectBox, escapeHtml);
    }
    html += "</div>";
  }
  if (item.description && !effectDesc && descForEffectBox !== item.description) {
    html += `<p class="item-popup-desc">${escapeHtml(item.description)}</p>`;
  }
  const weaponEffect = (item as Item & { weaponEffect?: string }).weaponEffect;
  if (weaponEffect && WEAPON_EFFECTS[weaponEffect as keyof typeof WEAPON_EFFECTS]) {
    const ef = WEAPON_EFFECTS[weaponEffect as keyof typeof WEAPON_EFFECTS];
    html += `<div class="item-popup-effect"><span class="item-popup-effect-hint">${escapeHtml(ef.name)}</span><p class="item-popup-effect-text">${escapeHtml(ef.description)}</p></div>`;
  }
  html += "</div>";
  return html;
}

/** Compact version for popover/tooltip – no scrollbar, fits in small space. */
export function getItemPopupBodyHtmlCompact(item: Item): string {
  const rarity = (item.rarity ?? "common") as string;
  const iconUrl = getItemIconUrl(item);
  const level = item.level ?? 1;
  const noLevel = (item as { noLevel?: boolean }).noLevel;

  let html = '<div class="item-popup-body item-popup-compact" data-rarity="' + rarity + '">';
  html += '<div class="item-popup-hero item-popup-hero-compact">';
  if (iconUrl) {
    const levelBadge = !noLevel ? `<span class="item-level-badge rarity-${rarity}">Lv${level}</span>` : "";
    html += `<div class="item-popup-icon-wrap item-popup-icon-wrap-compact"><img class="item-popup-icon" src="${iconUrl}" alt="" width="38" height="38">${levelBadge}</div>`;
  }
  html += '<div class="item-popup-name-wrap"><h4 class="item-popup-name item-popup-name-compact">' + escapeHtml(item.name) + '</h4></div>';
  html += '</div>';

  const parts: string[] = [];
  if (item.damage_min != null && item.damage_max != null) {
    parts.push(`${item.damage_min}–${item.damage_max} dmg`);
  } else if (item.damage != null) {
    parts.push(`${item.damage} dmg`);
  }
  if (item.toughness != null) parts.push(`${item.toughness} TGH`);
  const speedBase = item.speed_base ?? (item as Item & { speed_base?: number }).speed_base;
  if (speedBase != null) {
    const intervalMs = computeAttackIntervalMs(item as Item & { speed_base?: number }, 0);
    parts.push(`${(intervalMs / 1000).toFixed(1)}s`);
  }
  parts.push((rarity as string).toUpperCase());
  if (parts.length) {
    html += '<div class="item-popup-stats-compact">' + escapeHtml(parts.join(" · ")) + '</div>';
  }

  const bonuses = (item as Item & { bonuses?: ArmorBonus[] }).bonuses;
  if (bonuses?.length) {
    const badges = bonuses.slice(0, 3).map((b) => {
      const label = STAT_LABELS[b.stat] ?? b.stat.replace(/([A-Z])/g, " $1").trim().slice(0, 4).toUpperCase().replace(/ /g, "");
      const text = b.type === "percent" && b.stat === "chanceToHit"
        ? `+${b.value} CTH`
        : b.type === "percent"
          ? `+${b.value}% ${label}`
          : `+${b.value} ${label}`;
      return `<span class="item-popup-bonus-badge item-popup-bonus-badge-compact">${escapeHtml(text)}</span>`;
    });
    html += `<div class="item-popup-bonus-compact">${badges.join("")}</div>`;
  }

  const specialEffectId = (item as Item & { specialEffect?: string }).specialEffect;
  const effectDesc = getItemEffectDescription(item);
  let oneLiner: string | null = specialEffectId
    ? (getItemSpecialEffect(specialEffectId as import("../../constants/item-special-effects.ts").ItemSpecialEffectId)?.name ?? "")
    : typeof effectDesc === "string"
      ? effectDesc
      : (item.type === "throwable" || item.type === "medical") && item.description
        ? item.description
        : null;
  if (!oneLiner && item.description) oneLiner = item.description;
  if (oneLiner) {
    const short = oneLiner.length > 48 ? oneLiner.slice(0, 45) + "…" : oneLiner;
    html += `<div class="item-popup-effect-compact">${escapeHtml(short)}</div>`;
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
  const noLevel = (item as { noLevel?: boolean }).noLevel;
  const rarity = item.rarity ?? "common";
  const qty = item.quantity ?? 1;
  const badgeN = uses ?? (item.quantity != null ? item.quantity : (qty > 1 ? qty : null));
  const isWeapon = item.type === "ballistic_weapon" || item.type === "melee_weapon";
  const isSupplies = item.type === "throwable" || item.type === "medical" || item.type === "gear";
  const weaponRole = isWeapon ? (getWeaponRestrictRole(item) ?? (item as { restrictRole?: string }).restrictRole ?? "any") : null;
  const roleBadgeHtml = weaponRole ? `<span class="market-weapon-role-badge role-${weaponRole}">${WEAPON_ROLE_LABELS[weaponRole] ?? weaponRole}</span>` : "";
  const usesBadgeHtml = isSupplies && badgeN != null && badgeN >= 1 ? `<span class="market-item-uses-badge">×${badgeN}</span>` : "";
  const levelBadgeHtml = !noLevel ? `<span class="item-level-badge rarity-${rarity}">Lv${level}</span>` : "";
  const iconHtml = iconUrl
    ? `<div class="market-item-icon-wrap"><img class="market-item-icon" src="${iconUrl}" alt="${item.name}" width="42" height="42">${levelBadgeHtml}${usesBadgeHtml}${roleBadgeHtml}</div>`
    : "";
  const cardRarity = rarity !== "common" ? ` market-item-rarity-${rarity} rarity-${rarity}` : "";
  return `
<div class="inventory-item-card market-item-slot gear-market-item${cardRarity}" data-item-index="${index}" data-item-id="${item.id}" data-item-json="${escapeAttr(JSON.stringify(item))}" role="button" tabindex="0">
  <div class="market-item-inner">
    ${iconHtml}
    <div class="market-item-details">
      <span class="market-item-name">${item.name}</span>
    </div>
  </div>
  <button type="button" class="inventory-destroy-btn" data-item-index="${index}" title="Destroy" aria-label="Destroy">
    <svg class="inventory-destroy-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="white" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
</button>
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
  const noLevel = (item as { noLevel?: boolean }).noLevel;
  const rarity = item.rarity ?? "common";
  const badgeN = uses ?? (item.quantity != null ? item.quantity : (qty > 1 ? qty : null));
  const isWeapon = item.type === "ballistic_weapon" || item.type === "melee_weapon";
  const isSupplies = item.type === "throwable" || item.type === "medical" || item.type === "gear";
  const weaponRole = isWeapon ? (getWeaponRestrictRole(item) ?? (item as { restrictRole?: string }).restrictRole ?? "any") : null;
  const roleBadgeHtml = weaponRole ? `<span class="market-weapon-role-badge role-${weaponRole}">${WEAPON_ROLE_LABELS[weaponRole] ?? weaponRole}</span>` : "";
  const usesBadgeHtml = isSupplies && badgeN != null && badgeN >= 1 ? `<span class="market-item-uses-badge">×${badgeN}</span>` : "";
  const levelBadgeHtml = !noLevel ? `<span class="item-level-badge rarity-${rarity}">Lv${level}</span>` : "";
  const iconHtml = iconUrl
    ? `<div class="market-item-icon-wrap"><img class="market-item-icon" src="${iconUrl}" alt="${item.name}" width="42" height="42">${levelBadgeHtml}${usesBadgeHtml}${roleBadgeHtml}</div>`
    : "";
  const cardRarity = rarity !== "common" ? ` market-item-rarity-${rarity} rarity-${rarity}` : "";
  return `
<div class="inventory-item-card holding-item-card market-item-slot gear-market-item${cardRarity}" data-item-json="${escapeAttr(JSON.stringify(item))}" role="button" tabindex="0">
  <div class="market-item-inner">
    ${iconHtml}
    <div class="market-item-details">
      <span class="market-item-name">${item.name}</span>
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

  const companyLevel = store.company?.level ?? store.companyLevel ?? 1;
  const weaponSlots = getWeaponArmorySlots(companyLevel);
  const armorSlots = getArmorArmorySlots(companyLevel);
  const equipmentSlots = getEquipmentArmorySlots(companyLevel);

  function armorySectionSlots(
    itemsInCategory: Item[],
    indices: number[],
    capacity: number,
    sectionId: string,
    sectionTitle: string,
  ): string {
    const filled = itemsInCategory.map((item, i) => ({ item, index: indices[i] }));
    const slots: (Item | null)[] = Array.from({ length: capacity }, (_, i) => filled[i]?.item ?? null);
    const slotIndices: (number | null)[] = Array.from({ length: capacity }, (_, i) =>
      filled[i] != null ? indices[i] : null,
    );
    const gridItems = slots
      .map((item, i) =>
        item
          ? inventoryItemCard(item, slotIndices[i]!)
          : '<div class="inventory-empty-slot" aria-label="Empty slot"><span class="inventory-empty-slot-text">Empty</span></div>',
      )
      .join("");
    return `
    <div class="inventory-section market-section">
      <h4 class="inventory-section-title market-section-title">${sectionTitle} <span class="inventory-section-cap">${itemsInCategory.length} / ${capacity}</span></h4>
      <div class="inventory-grid market-grid market-grid-2col" id="${sectionId}">
        ${gridItems}
      </div>
    </div>`;
  }

  const holdingSection =
    holding.length === 0
      ? ""
      : `
    <div class="inventory-section market-section inventory-holding-section">
      <h4 class="inventory-section-title market-section-title">Items Waiting (Armory Full)</h4>
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
  ${itemStatsPopupHtml()}
  ${companyHeaderPartial("Company Armory")}
  <div class="inventory-main market-main-2col">
    ${armorySectionSlots(weapons, weaponIndices, weaponSlots, "inventory-weapons", "Weapons")}
    ${armorySectionSlots(armor, armorIndices, armorSlots, "inventory-armor", "Armor")}
    ${armorySectionSlots(equipment, equipmentIndices, equipmentSlots, "inventory-equipment", "Equipment & Supplies")}
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
