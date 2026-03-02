import { DOM } from "../../constants/css-selectors.ts";
import {
  getRecruitCost,
} from "../../constants/economy.ts";
import { getMaxCompanySize } from "../entities/company/company.ts";
import { clrHash } from "../../utils/html-utils.ts";
import {
  companyActionsTemplate,
  companyHeaderPartial,
  marketCreditsPartial,
} from "./game-setup-template.ts";
import type { Soldier } from "../entities/types.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { Partial } from "./partials/partial.ts";
import { getSuppliesMarketItems } from "../../constants/equipment-market.ts";
import {
  getWeaponsMarketItems,
  getArmorMarketItems,
  getWeaponsMarketItemsAll,
  getArmorMarketItemsAll,
} from "../../constants/gear-market.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import { getWeaponRestrictRole } from "../../utils/equip-utils.ts";
import { getMaxSoldierLevel } from "../../utils/company-utils.ts";
import { MAX_GEAR_LEVEL } from "../../constants/items/types.ts";
import { getItemSellPrice } from "../../utils/sell-pricing.ts";
import { CREDIT_SYMBOL } from "../../constants/currency.ts";

export const marketTemplate = () => {
  const { market } = DOM;
  const c = (d: string) => clrHash(d);

  return `
	<div id="cc-market" class="flex h-100 column">
    ${companyHeaderPartial()}
	
		<div class="text-center">
			<h1>Market</h1>
			<div class="flex column align-center justify-between">
				<button id="${c(market.marketTroopsLink)}" class="blue mbtn mb-3">Troops</button>
				<button id="${c(market.marketArmorLink)}" class="blue mbtn mb-3">Body Armor</button>
				<button id="${c(market.marketWeaponsLink)}" class="blue mbtn mb-3">Weapons</button>
				<button id="${c(market.marketSuppliesLink)}" class="blue mbtn mb-3">Supplies</button>
				<button id="${c(market.marketDevCatalogLink)}" class="gray mbtn market-dev-btn" title="Developer: view all weapons and armor">Dev Catalog</button>
			</div>
			<div class="market-credits-inline">${marketCreditsPartial(usePlayerCompanyStore.getState().creditBalance)}</div>
		</div>

		${companyActionsTemplate()}
	</div>
	`;
};

/** Level navigator for gear tier browsing: [←] Level N [→]. Optional quick jumps for large ranges. */
function marketLevelNavigatorPartial(currentLevel: number, maxLevel: number, options: { quickJumps?: boolean } = {}): string {
  const canDec = currentLevel > 1;
  const canInc = currentLevel < maxLevel;
  const quick = options.quickJumps === true;
  return `
<div class="market-level-nav" data-market-level-nav>
  <button type="button" class="market-level-nav-btn market-level-nav-prev" data-market-tier-prev aria-label="Previous level" ${!canDec ? "disabled" : ""}>
    <span class="market-level-nav-arrow">←</span>
  </button>
  <span class="market-level-nav-label">Level ${currentLevel}</span>
  <button type="button" class="market-level-nav-btn market-level-nav-next" data-market-tier-next aria-label="Next level" ${!canInc ? "disabled" : ""}>
    <span class="market-level-nav-arrow">→</span>
  </button>
  ${quick
    ? `<div class="market-level-nav-quick">
      <button type="button" class="market-level-nav-btn market-level-nav-jump" data-market-tier-delta="-100" aria-label="Jump back 100 levels">-100</button>
      <button type="button" class="market-level-nav-btn market-level-nav-jump" data-market-tier-delta="-10" aria-label="Jump back 10 levels">-10</button>
      <input type="number" class="market-level-nav-input" data-market-tier-input min="1" max="${maxLevel}" value="${currentLevel}" aria-label="Set level">
      <button type="button" class="market-level-nav-btn market-level-nav-go" data-market-tier-go aria-label="Go to level">Go</button>
      <button type="button" class="market-level-nav-btn market-level-nav-jump" data-market-tier-delta="10" aria-label="Jump forward 10 levels">+10</button>
      <button type="button" class="market-level-nav-btn market-level-nav-jump" data-market-tier-delta="100" aria-label="Jump forward 100 levels">+100</button>
    </div>`
    : ""}
</div>`;
}

const WEAPON_ROLE_LABELS: Record<string, string> = {
  rifleman: "Rifleman",
  support: "Support",
  medic: "Medic",
  any: "Any",
};

function marketItemCard(
  entry: { item: import("../../constants/items/types.ts").Item; price: number },
  dataAttrs: string,
  slotClass: string,
  nameOverride?: string,
): string {
  const iconUrl = getItemIconUrl(entry.item);
  const name = nameOverride ?? entry.item.name;
  const level = entry.item.level ?? 1;
  const noLevel = (entry.item as { noLevel?: boolean }).noLevel;
  const uses = entry.item.uses;
  const rarity = entry.item.rarity ?? "common";
  const rarityClass = rarity !== "common" ? ` market-item-rarity-${rarity} rarity-${rarity}` : "";
  const isSupplies = slotClass.includes("supplies-market-item");
  const isWeapon = slotClass.includes("gear-market-item") && (entry.item.type === "ballistic_weapon" || entry.item.type === "melee_weapon");
  const usesBadgeHtml = uses != null ? `<span class="market-item-uses-badge">×${uses}</span>` : "";
  const weaponRole = isWeapon
    ? (getWeaponRestrictRole(entry.item) ?? (entry.item as { restrictRole?: string }).restrictRole ?? "any")
    : null;
  const roleBadgeHtml = weaponRole
    ? `<span class="market-weapon-role-badge role-${weaponRole}">${WEAPON_ROLE_LABELS[weaponRole] ?? weaponRole}</span>`
    : "";
  const levelBadgeHtml = !noLevel ? `<span class="item-level-badge rarity-${rarity}">Lv${level}</span>` : "";
  const iconHtml = iconUrl
    ? `<div class="market-item-icon-wrap"><img class="market-item-icon" src="${iconUrl}" alt="${name}" width="42" height="42">${levelBadgeHtml}${isSupplies && uses != null ? usesBadgeHtml : ""}${roleBadgeHtml}</div>`
    : "";
  const slotLevelUsesBadge = !isSupplies && uses != null ? usesBadgeHtml : "";
  return `
<div class="market-item-slot ${slotClass}${rarityClass}" ${dataAttrs} role="button" tabindex="0">
  <div class="market-item-inner">
    ${iconHtml}
    <div class="market-item-details">
      <span class="market-item-name">${name}</span>
      <span class="market-item-price">$${entry.price}</span>
    </div>
  </div>
  ${slotLevelUsesBadge}
</div>`;
}

function marketSellItemCard(item: import("../../constants/items/types.ts").Item, index: number, companyLevel: number): string {
  const iconUrl = getItemIconUrl(item);
  const rarity = item.rarity ?? "common";
  const level = item.level ?? 1;
  const noLevel = (item as { noLevel?: boolean }).noLevel;
  const uses = item.uses ?? item.quantity;
  const sellValue = getItemSellPrice(item, companyLevel);
  const levelBadgeHtml = !noLevel ? `<span class="item-level-badge rarity-${rarity}">Lv${level}</span>` : "";
  const usesBadgeHtml = uses != null ? `<span class="market-item-uses-badge">×${uses}</span>` : "";
  return `
<button type="button" class="market-sell-item${rarity !== "common" ? ` rarity-${rarity}` : ""}" data-item-index="${index}" data-item-rarity="${rarity}" data-sell-value="${sellValue}">
  <span class="market-sell-item-left">
    <span class="market-sell-item-icon-wrap">
      ${iconUrl ? `<img class="market-sell-item-icon" src="${iconUrl}" alt="">` : ""}
      ${levelBadgeHtml}
      ${usesBadgeHtml}
    </span>
    <span class="market-sell-item-name">${item.name}</span>
  </span>
  <span class="market-sell-item-value">${CREDIT_SYMBOL}${sellValue}</span>
</button>`;
}

function marketSellPopupHtml(companyLevel: number, inventory: import("../../constants/items/types.ts").Item[]): string {
  const sorted = inventory
    .map((item, index) => ({ item, index, sellValue: getItemSellPrice(item, companyLevel) }))
    .sort((a, b) => (a.sellValue - b.sellValue) || a.item.name.localeCompare(b.item.name));
  return `
  <div id="market-sell-popup" class="supplies-buy-popup market-sell-popup" role="dialog" aria-modal="true" hidden>
    <div class="supplies-buy-popup-inner market-sell-popup-inner">
      <div class="gear-buy-title-wrap">
        <h4 class="supplies-buy-title">Sell Items</h4>
        <button type="button" id="market-sell-close" class="game-btn game-btn-md game-btn-red popup-close-btn">Close</button>
      </div>
      <p class="market-sell-hint">Tap items to select. Tap again to deselect.</p>
      <div id="market-sell-grid" class="market-sell-grid">
        ${sorted.map((entry) => marketSellItemCard(entry.item, entry.index, companyLevel)).join("")}
      </div>
      <button type="button" id="market-sell-confirm" class="mbtn red equipment-buy-btn-full market-sell-confirm" disabled>${CREDIT_SYMBOL} Sell 0 Items • ${CREDIT_SYMBOL}0</button>
    </div>
  </div>`;
}

export const weaponsMarketTemplate = () => {
  const store = usePlayerCompanyStore.getState();
  const maxLevel = Math.max(1, getMaxSoldierLevel(store.company));
  const selectedTier = Math.max(1, Math.min(maxLevel, store.marketTierLevel || maxLevel));
  const companyLvl = store.company?.level ?? store.companyLevel ?? 1;
  const creditBalance = store.creditBalance;
  const inv = store.company?.inventory ?? [];

  const allWeapons = getWeaponsMarketItems(selectedTier, companyLvl);
  const commonWeapons = allWeapons.filter((e) => (e.item.rarity ?? "common") === "common");
  const rareWeapons = allWeapons.filter((e) => e.item.rarity === "rare");
  const epicWeapons = allWeapons.filter((e) => e.item.rarity === "epic");

  const gearData = (e: { item: import("../../constants/items/types.ts").Item; price: number }, i: number) =>
    `data-gear-index="${i}" data-gear-context="weapons" data-gear-price="${e.price}" data-gear-item="${escapeAttr(JSON.stringify(e.item))}"`;

  const section = (title: string, items: typeof allWeapons, offset: number, rarityClass: string) =>
    items.length > 0
      ? `
    <div class="market-section ${rarityClass}">
      <h4 class="market-section-title">${title}</h4>
      <div class="market-grid market-grid-2col">
        ${items.map((e, i) => marketItemCard(e, gearData(e, offset + i), "gear-market-item")).join("")}
      </div>
    </div>`
      : "";

  const sections =
    section("Common", commonWeapons, 0, "market-section-common") +
    section("Rare", rareWeapons, commonWeapons.length, "market-section-rare") +
    section("Epic", epicWeapons, commonWeapons.length + rareWeapons.length, "market-section-epic");

  return `
<div id="weapons-market" class="weapons-market-root troops-market-root">
  ${marketSellPopupHtml(companyLvl, inv)}
  <div id="weapons-buy-popup" class="gear-buy-popup supplies-buy-popup" role="dialog" aria-modal="true" hidden>
    <div class="gear-buy-popup-inner supplies-buy-popup-inner">
      <div class="gear-buy-title-wrap">
        <h4 id="weapons-buy-title" class="supplies-buy-title"></h4>
        <button type="button" id="weapons-buy-close" class="game-btn game-btn-md game-btn-red popup-close-btn">Close</button>
      </div>
      <div id="weapons-buy-body" class="supplies-buy-body"></div>
      <div class="item-market-purchase">
        <div class="supplies-buy-qty-row">
          <label>Quantity:</label>
          <div class="supplies-buy-qty-controls">
            <button type="button" id="weapons-qty-minus" class="mbtn icon-btn">−</button>
            <input type="number" id="weapons-qty-input" min="1" value="1" readonly>
            <button type="button" id="weapons-qty-plus" class="mbtn icon-btn">+</button>
          </div>
        </div>
        <p id="weapons-buy-error" class="supplies-buy-error" role="alert"></p>
        <button type="button" id="weapons-buy-btn" class="mbtn green equipment-buy-btn-full">Buy</button>
      </div>
    </div>
  </div>
  ${companyHeaderPartial("Weapons Market")}
  <div class="weapons-market-main market-main-2col">
    ${sections}
  </div>
  <div class="weapons-market-footer troops-market-footer">
    <div class="market-controls-row">
      <div class="market-controls-cell market-controls-nav">
        ${marketLevelNavigatorPartial(selectedTier, maxLevel)}
      </div>
      <div class="market-controls-cell market-controls-credits">
        ${marketCreditsPartial(creditBalance)}
      </div>
      <div class="market-controls-cell market-controls-sell">
        <button type="button" id="market-sell-open" class="equip-troops-btn">Sell</button>
      </div>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>
`;
};

export const armorMarketTemplate = () => {
  const store = usePlayerCompanyStore.getState();
  const maxLevel = Math.max(1, getMaxSoldierLevel(store.company));
  const selectedTier = Math.max(1, Math.min(maxLevel, store.marketTierLevel || maxLevel));
  const companyLvl = store.company?.level ?? store.companyLevel ?? 1;
  const creditBalance = store.creditBalance;
  const inv = store.company?.inventory ?? [];

  const allArmor = getArmorMarketItems(selectedTier, companyLvl);
  const commonArmor = allArmor.filter((e) => (e.item.rarity ?? "common") === "common");
  const rareArmor = allArmor.filter((e) => e.item.rarity === "rare");
  const epicArmor = allArmor.filter((e) => e.item.rarity === "epic");

  const gearData = (e: { item: import("../../constants/items/types.ts").Item; price: number }, i: number) =>
    `data-gear-index="${i}" data-gear-context="armor" data-gear-price="${e.price}" data-gear-item="${escapeAttr(JSON.stringify(e.item))}"`;

  const section = (title: string, items: typeof allArmor, offset: number, rarityClass: string) =>
    items.length > 0
      ? `
    <div class="market-section ${rarityClass}">
      <h4 class="market-section-title">${title}</h4>
      <div class="market-grid market-grid-2col">
        ${items.map((e, i) => marketItemCard(e, gearData(e, offset + i), "gear-market-item")).join("")}
      </div>
    </div>`
      : "";

  const sections =
    section("Common", commonArmor, 0, "market-section-common") +
    section("Rare", rareArmor, commonArmor.length, "market-section-rare") +
    section("Epic", epicArmor, commonArmor.length + rareArmor.length, "market-section-epic");

  return `
<div id="armor-market" class="armor-market-root troops-market-root">
  ${marketSellPopupHtml(companyLvl, inv)}
  <div id="armor-buy-popup" class="gear-buy-popup supplies-buy-popup" role="dialog" aria-modal="true" hidden>
    <div class="gear-buy-popup-inner supplies-buy-popup-inner">
      <div class="gear-buy-title-wrap">
        <h4 id="armor-buy-title" class="supplies-buy-title"></h4>
        <button type="button" id="armor-buy-close" class="game-btn game-btn-md game-btn-red popup-close-btn">Close</button>
      </div>
      <div id="armor-buy-body" class="supplies-buy-body"></div>
      <div class="item-market-purchase">
        <div class="supplies-buy-qty-row">
          <label>Quantity:</label>
          <div class="supplies-buy-qty-controls">
            <button type="button" id="armor-qty-minus" class="mbtn icon-btn">−</button>
            <input type="number" id="armor-qty-input" min="1" value="1" readonly>
            <button type="button" id="armor-qty-plus" class="mbtn icon-btn">+</button>
          </div>
        </div>
        <p id="armor-buy-error" class="supplies-buy-error" role="alert"></p>
        <button type="button" id="armor-buy-btn" class="mbtn green equipment-buy-btn-full">Buy</button>
      </div>
    </div>
  </div>
  ${companyHeaderPartial("Body Armor Market")}
  <div class="armor-market-main market-main-2col">
    ${sections}
  </div>
  <div class="armor-market-footer troops-market-footer">
    <div class="market-controls-row">
      <div class="market-controls-cell market-controls-nav">
        ${marketLevelNavigatorPartial(selectedTier, maxLevel)}
      </div>
      <div class="market-controls-cell market-controls-credits">
        ${marketCreditsPartial(creditBalance)}
      </div>
      <div class="market-controls-cell market-controls-sell">
        <button type="button" id="market-sell-open" class="equip-troops-btn">Sell</button>
      </div>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>
`;
};

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Dev-only: view all weapons and armor including epics. View-only, no purchase. */
export const devCatalogMarketTemplate = () => {
  const store = usePlayerCompanyStore.getState();
  const maxLevel = MAX_GEAR_LEVEL; // Dev catalog: browse all levels 1-999
  const selectedTier = Math.max(1, Math.min(MAX_GEAR_LEVEL, store.devCatalogTierLevel || 1));
  const tier = selectedTier as import("../../constants/items/types.ts").GearLevel;

  const allWeapons = getWeaponsMarketItemsAll(tier);
  const allArmor = getArmorMarketItemsAll(tier);
  const commonWeapons = allWeapons.filter((e) => (e.item.rarity ?? "common") === "common");
  const rareWeapons = allWeapons.filter((e) => e.item.rarity === "rare");
  const epicWeapons = allWeapons.filter((e) => e.item.rarity === "epic");
  const commonArmor = allArmor.filter((e) => (e.item.rarity ?? "common") === "common");
  const rareArmor = allArmor.filter((e) => e.item.rarity === "rare");
  const epicArmor = allArmor.filter((e) => e.item.rarity === "epic");

  const devCard = (
    entry: { item: import("../../constants/items/types.ts").Item; price: number },
    dataAttrs: string,
    slotClass: string,
  ) => {
    const iconUrl = getItemIconUrl(entry.item);
    const name = entry.item.name;
    const level = entry.item.level ?? 1;
    const noLevel = (entry.item as { noLevel?: boolean }).noLevel;
    const rarity = entry.item.rarity ?? "common";
    const rarityClass = rarity !== "common" ? ` market-item-rarity-${rarity} rarity-${rarity}` : "";
    const isWeapon = entry.item.type === "ballistic_weapon" || entry.item.type === "melee_weapon";
    const weaponRole = isWeapon
      ? (getWeaponRestrictRole(entry.item) ?? (entry.item as { restrictRole?: string }).restrictRole ?? "any")
      : null;
    const roleBadgeHtml = weaponRole
      ? `<span class="market-weapon-role-badge role-${weaponRole}">${WEAPON_ROLE_LABELS[weaponRole] ?? weaponRole}</span>`
      : "";
    const levelBadgeHtml = !noLevel ? `<span class="item-level-badge rarity-${rarity}">Lv${level}</span>` : "";
    const iconHtml = iconUrl
      ? `<div class="market-item-icon-wrap"><img class="market-item-icon" src="${iconUrl}" alt="${name}" width="42" height="42">${levelBadgeHtml}${roleBadgeHtml}</div>`
      : "";
    return `
<div class="market-item-slot ${slotClass}${rarityClass}" ${dataAttrs} role="button" tabindex="0">
  <div class="market-item-inner">
    ${iconHtml}
    <div class="market-item-details">
      <span class="market-item-name">${name}</span>
      <span class="market-item-price dev-catalog-label">VIEW</span>
    </div>
  </div>
</div>`;
  };

  const gearData = (e: { item: import("../../constants/items/types.ts").Item; price: number }, i: number, ctx: string) =>
    `data-gear-index="${i}" data-gear-context="${ctx}" data-gear-item="${escapeAttr(JSON.stringify(e.item))}"`;

  const section = (
    title: string,
    items: { item: import("../../constants/items/types.ts").Item; price: number }[],
    offset: number,
    rarityClass: string,
    ctx: string,
  ) =>
    items.length > 0
      ? `
    <div class="market-section ${rarityClass}">
      <h4 class="market-section-title">${title}</h4>
      <div class="market-grid market-grid-2col">
        ${items.map((e, i) => devCard(e, gearData(e, offset + i, ctx), "gear-market-item dev-catalog-item")).join("")}
      </div>
    </div>`
      : "";

  const weaponsSections =
    section("Weapons — Common", commonWeapons, 0, "market-section-common", "dev-weapons") +
    section("Weapons — Rare", rareWeapons, commonWeapons.length, "market-section-rare", "dev-weapons") +
    section("Weapons — Epic", epicWeapons, commonWeapons.length + rareWeapons.length, "market-section-epic", "dev-weapons");

  const armorSections =
    section("Armor — Common", commonArmor, 0, "market-section-common", "dev-armor") +
    section("Armor — Rare", rareArmor, commonArmor.length, "market-section-rare", "dev-armor") +
    section("Armor — Epic", epicArmor, commonArmor.length + rareArmor.length, "market-section-epic", "dev-armor");

  const { common: commonSupplies, rare: rareSupplies, epic: epicSupplies } = getSuppliesMarketItems(
    selectedTier,
    Math.max(4, store.company?.level ?? store.companyLevel ?? 1),
    { allowPost20: true },
  );
  const suppliesSections =
    section("Supplies — Common", commonSupplies, 0, "market-section-common", "dev-supplies") +
    section("Supplies — Rare", rareSupplies, commonSupplies.length, "market-section-rare", "dev-supplies") +
    section("Supplies — Epic", epicSupplies, commonSupplies.length + rareSupplies.length, "market-section-epic", "dev-supplies");

  return `
<div id="dev-catalog-market" class="dev-catalog-root weapons-market-root troops-market-root">
  <div id="dev-catalog-popup" class="gear-buy-popup supplies-buy-popup" role="dialog" aria-modal="true" hidden>
    <div class="gear-buy-popup-inner supplies-buy-popup-inner">
      <div class="gear-buy-title-wrap"><button type="button" id="dev-catalog-popup-close" class="game-btn game-btn-md game-btn-red popup-close-btn">Close</button></div>
      <div id="dev-catalog-popup-body" class="supplies-buy-body"></div>
      <div class="dev-catalog-actions">
        <button type="button" id="dev-catalog-grant-btn" class="mbtn green equipment-buy-btn-full">Add to Armory</button>
      </div>
      <p class="dev-catalog-hint">Dev Catalog — add any item for testing</p>
    </div>
  </div>
  ${companyHeaderPartial("Dev Catalog — All Gear & Supplies")}
  <div class="dev-catalog-main market-main-2col">
    ${weaponsSections}
    ${armorSections}
    ${suppliesSections}
  </div>
  <div class="dev-catalog-footer weapons-market-footer troops-market-footer">
    ${marketLevelNavigatorPartial(selectedTier, maxLevel, { quickJumps: true })}
    <div class="footer-banner">
      ${companyActionsTemplate()}
    </div>
  </div>
</div>
`;
};

function abbreviateItemName(name: string): string {
  return name.replace(/Incendiary/g, "Incend.");
}

export const suppliesMarketTemplate = () => {
  const store = usePlayerCompanyStore.getState();
  const maxLevel = Math.max(1, getMaxSoldierLevel(store.company));
  const selectedTier = Math.max(1, Math.min(maxLevel, store.marketTierLevel || maxLevel));
  const creditBalance = store.creditBalance;
  const companyLvl = store.company?.level ?? store.companyLevel ?? 1;
  const inv = store.company?.inventory ?? [];

  const suppliesData = (e: { item: import("../../constants/items/types.ts").Item; price: number }, i: number) =>
    `data-supplies-index="${i}" data-supplies-price="${e.price}" data-supplies-item="${escapeAttr(JSON.stringify(e.item))}"`;

  const section = (
    title: string,
    items: { item: import("../../constants/items/types.ts").Item; price: number }[],
    offset: number,
    rarityClass: string,
  ) =>
    items.length > 0
      ? `
    <div class="market-section ${rarityClass}">
      <h4 class="market-section-title">${title}</h4>
      <div class="market-grid market-grid-2col">
        ${items.map((e, i) => marketItemCard(e, suppliesData(e, offset + i), "supplies-market-item", abbreviateItemName(e.item.name))).join("")}
      </div>
    </div>`
      : "";

  const { common: commonSupplies, rare: rareSupplies, epic: epicSupplies } = getSuppliesMarketItems(selectedTier, companyLvl);
  const sections =
    section("Common", commonSupplies, 0, "market-section-common") +
    section("Rare", rareSupplies, commonSupplies.length, "market-section-rare") +
    section("Epic", epicSupplies, commonSupplies.length + rareSupplies.length, "market-section-epic");

  return `
<div id="supplies-market" class="supplies-market-root troops-market-root">
  ${marketSellPopupHtml(companyLvl, inv)}
  <div id="supplies-buy-popup" class="supplies-buy-popup" role="dialog" aria-modal="true" hidden>
    <div class="supplies-buy-popup-inner">
      <h4 id="supplies-buy-title" class="supplies-buy-title"></h4>
      <div id="supplies-buy-body" class="supplies-buy-body"></div>
      <div class="supplies-buy-qty-row">
        <label>Quantity:</label>
        <div class="supplies-buy-qty-controls">
          <button type="button" id="supplies-qty-minus" class="mbtn icon-btn">−</button>
          <input type="number" id="supplies-qty-input" min="1" value="1" readonly>
          <button type="button" id="supplies-qty-plus" class="mbtn icon-btn">+</button>
        </div>
      </div>
      <p id="supplies-buy-error" class="supplies-buy-error" role="alert"></p>
      <div class="supplies-buy-actions">
        <button type="button" id="supplies-buy-btn" class="mbtn green equipment-buy-btn-full">Buy</button>
        <button type="button" id="supplies-buy-close" class="game-btn game-btn-md game-btn-red popup-close-btn">Close</button>
      </div>
    </div>
  </div>
  ${companyHeaderPartial("Supplies Market")}
  <div class="supplies-market-main market-main-2col">
    ${sections}
  </div>
  <div class="supplies-market-footer troops-market-footer">
    <div class="market-controls-row">
      <div class="market-controls-cell market-controls-nav">
        ${marketLevelNavigatorPartial(selectedTier, maxLevel)}
      </div>
      <div class="market-controls-cell market-controls-credits">
        ${marketCreditsPartial(creditBalance)}
      </div>
      <div class="market-controls-cell market-controls-sell">
        <button type="button" id="market-sell-open" class="equip-troops-btn">Sell</button>
      </div>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>
`;
};

function getStagingTotalCost(staging: Soldier[]): number {
  return staging.reduce((sum, s) => sum + getRecruitCost(s.trait_profile?.stats), 0);
}

export const troopsMarketTemplate = (
  troops: Soldier[],
  rerolls = usePlayerCompanyStore.getState().rerollCounter,
) => {
  const store = usePlayerCompanyStore.getState();
  const recruitStaging = store.recruitStaging ?? [];
  const { creditBalance, companyLevel } = store;
  const totalCost = getStagingTotalCost(recruitStaging);
  const canAfford = creditBalance >= totalCost;
  const hasStaged = recruitStaging.length > 0;
  const maxSize = getMaxCompanySize(companyLevel ?? 1);
  const currentCount = store.company?.soldiers?.length ?? store.totalMenInCompany ?? 0;
  const slotsLeft = maxSize - currentCount;
  const remaining = creditBalance - totalCost;
  const canAffordSoldier = (s: Soldier) =>
    slotsLeft > recruitStaging.length &&
    remaining >= getRecruitCost(s.trait_profile?.stats);

  const soldiers = store.company?.soldiers ?? [];
  const roleCounts = soldiers.reduce((acc, s) => {
    const r = (s.designation ?? "rifleman").toLowerCase();
    acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const totalMaxPill = `<span class="troops-role-pill troops-total-max">${currentCount}/${maxSize}</span>`;
  const rolePills =
    soldiers.length === 0
      ? ""
      : ["rifleman", "support", "medic"]
          .filter((r) => (roleCounts[r] ?? 0) > 0)
          .map(
            (r) =>
              `<span class="troops-role-pill role-${r}">${r.charAt(0).toUpperCase()} × ${roleCounts[r] ?? 0}</span>`,
          )
          .join("");
  const roleBreakdownHtml = totalMaxPill + rolePills;

  const formattedCredits = creditBalance.toLocaleString();
  const roleRank: Record<string, number> = { rifleman: 0, support: 1, medic: 2 };
  const orderedTroops = [...troops].sort((a, b) => {
    const ar = roleRank[(a.designation ?? "rifleman").toLowerCase()] ?? 99;
    const br = roleRank[(b.designation ?? "rifleman").toLowerCase()] ?? 99;
    return ar - br;
  });

  return `
<div id="troops-market" class="troops-market-root" data-troops-screen="v2">
	<div id="troops-recruit-error" class="troops-recruit-error" role="alert" aria-live="polite"></div>
		${companyHeaderPartial("Available Troops")}
		<div class="troops-market-main">
			<div class="troops-list">
				${orderedTroops.map((t) => Partial.create.trooper(t, canAffordSoldier(t), rerolls > 0)).join("")}
			</div>
		<div id="recruit-staging-area" class="recruit-staging-area">
			<p class="recruit-staging-label">Selected ${slotsLeft > 0 ? `(${recruitStaging.length}/${slotsLeft})` : ""}</p>
			<div class="recruit-staging-reroll reroll-counter${rerolls <= 0 ? " reroll-empty" : ""}">Rerolls: ${rerolls}</div>
			<div id="recruit-staging">
				${recruitStaging.map((s) => Partial.create.stagedTrooperCard(s)).join("")}
			</div>
			<div class="staging-total-banner">$${totalCost}</div>
			<button id="confirm-recruitment" type="button" class="confirm-recruit-btn ${!hasStaged || !canAfford ? "disabled" : ""}" ${!hasStaged || !canAfford ? "disabled" : ""}>Confirm</button>
		</div>
	</div>
	<div class="troops-market-footer">
		<div class="footer-banner">
			<div class="troops-metadata-banner">
				<div class="troops-metadata-row troops-metadata-credits">Credits <span class="troops-credits-amount">$${formattedCredits}</span></div>
				<div class="troops-metadata-row troops-soldier-breakdown">${roleBreakdownHtml}</div>
			</div>
		</div>
		${companyActionsTemplate()}
	</div>
</div>
	`;
};
