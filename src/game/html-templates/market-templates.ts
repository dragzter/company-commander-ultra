import { DOM } from "../../constants/css-selectors.ts";
import { getRecruitCost, getArmorySlots } from "../../constants/economy.ts";
import { getMaxCompanySize } from "../entities/company/company.ts";
import { clrHash } from "../../utils/html-utils.ts";
import {
  companyActionsTemplate,
  companyHeaderPartial,
} from "./game-setup-template.ts";
import type { Soldier } from "../entities/types.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { Partial } from "./partials/partial.ts";
import {
  EQUIPMENT_MARKET_COMMON,
  EQUIPMENT_MARKET_RARE,
  EQUIPMENT_MARKET_EPIC,
} from "../../constants/equipment-market.ts";
import { getWeaponsMarketItems, getArmorMarketItems } from "../../constants/gear-market.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";

export const marketTemplate = () => {
  const { market } = DOM;
  const c = (d: string) => clrHash(d);

  return `
	<div id="cc-market" class="flex h-100 column">
    ${companyHeaderPartial()}
	
		<div class="text-center">
			<h1>Market</h1>
			<div class="flex column align-center justify-between">
				<button id="${c(market.marketTroopsLink)}" class="green mbtn mb-3">Troops</button>
				<button id="${c(market.marketArmorLink)}" class="blue mbtn mb-3">Body Armor</button>
				<button id="${c(market.marketWeaponsLink)}" class="red mbtn mb-3">Weapons</button>
				<button id="${c(market.marketSuppliesLink)}" class="blue mbtn">Supplies</button>
			</div>
		</div>

		<div class="troops-market-footer">
			<div class="recruit-balance-bar">
				<span class="recruit-balance-item"><strong>Credits</strong> $${usePlayerCompanyStore.getState().creditBalance}</span>
			</div>
			${companyActionsTemplate()}
		</div>
	</div>
	`;
};

function gearMarketItemCard(
  entry: { item: import("../../constants/items/types.ts").Item; price: number },
  index: number,
  context: "weapons" | "armor",
): string {
  const iconUrl = getItemIconUrl(entry.item);
  const name = entry.item.name;
  const level = entry.item.level ?? 1;
  const rarity = entry.item.rarity ?? "common";
  const rarityClass = rarity !== "common" ? ` rarity-${rarity}` : "";
  return `
<div class="gear-market-item company-inv-slot company-inv-slot-filled${rarityClass}" data-gear-index="${index}" data-gear-context="${context}" data-gear-price="${entry.price}" data-gear-item="${escapeAttr(JSON.stringify(entry.item))}" role="button" tabindex="0">
  <div class="gear-market-item-inner">
    <span class="gear-market-level-badge">Lv${level}</span>
    ${iconUrl ? `<img class="gear-market-icon" src="${iconUrl}" alt="${name}" width="48" height="48">` : ""}
    <span class="company-inv-slot-name">${name}</span>
    <span class="gear-market-price-badge">$${entry.price}</span>
  </div>
</div>`;
}

export const weaponsMarketTemplate = () => {
  const store = usePlayerCompanyStore.getState();
  const companyLvl = store.company?.level ?? store.companyLevel ?? 1;
  const creditBalance = store.creditBalance;
  const totalCapacity = getArmorySlots(companyLvl);
  const currentItems = store.company?.inventory?.length ?? 0;
  const slotsFree = totalCapacity - currentItems;

  const allWeapons = getWeaponsMarketItems(companyLvl);
  const support = allWeapons.filter((e) => e.item.restrictRole === "support");
  const rifleman = allWeapons.filter((e) => e.item.restrictRole === "rifleman");
  const anyUser = allWeapons.filter((e) => e.item.restrictRole === "any" || e.item.restrictRole === "medic");

  return `
<div id="weapons-market" class="weapons-market-root troops-market-root">
  <div id="weapons-buy-popup" class="gear-buy-popup supplies-buy-popup" role="dialog" aria-modal="true" hidden>
    <div class="gear-buy-popup-inner supplies-buy-popup-inner">
      <h4 id="weapons-buy-title" class="supplies-buy-title"></h4>
      <div id="weapons-buy-body" class="supplies-buy-body"></div>
      <div class="supplies-buy-qty-row">
        <label>Quantity:</label>
        <div class="supplies-buy-qty-controls">
          <button type="button" id="weapons-qty-minus" class="mbtn icon-btn">−</button>
          <input type="number" id="weapons-qty-input" min="1" value="1" readonly>
          <button type="button" id="weapons-qty-plus" class="mbtn icon-btn">+</button>
        </div>
      </div>
      <p id="weapons-buy-error" class="supplies-buy-error" role="alert"></p>
      <div class="supplies-buy-actions">
        <button type="button" id="weapons-buy-btn" class="mbtn green">Buy</button>
        <button type="button" id="weapons-buy-close" class="mbtn red mbtn-sm">Close</button>
      </div>
    </div>
  </div>
  ${companyHeaderPartial("Weapons Market")}
  <div class="weapons-market-main company-inv-body">
    <div class="company-inv-section">
      <h4 class="company-inv-section-title">Support</h4>
      <div class="gear-market-grid company-inv-slot-grid inventory-grid">
        ${support.map((e, i) => gearMarketItemCard(e, i, "weapons")).join("")}
      </div>
    </div>
    <div class="company-inv-section">
      <h4 class="company-inv-section-title">Rifleman</h4>
      <div class="gear-market-grid company-inv-slot-grid inventory-grid">
        ${rifleman.map((e, i) => gearMarketItemCard(e, support.length + i, "weapons")).join("")}
      </div>
    </div>
    <div class="company-inv-section">
      <h4 class="company-inv-section-title">Any User</h4>
      <div class="gear-market-grid company-inv-slot-grid inventory-grid">
        ${anyUser.map((e, i) => gearMarketItemCard(e, support.length + rifleman.length + i, "weapons")).join("")}
      </div>
    </div>
  </div>
  <div class="weapons-market-footer troops-market-footer">
    <div class="recruit-balance-bar">
      <span class="recruit-balance-item"><strong>Credits</strong> $${creditBalance}</span>
      <span class="recruit-balance-item"><strong>Slots Free</strong> ${slotsFree}/${totalCapacity}</span>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>
`;
};

export const armorMarketTemplate = () => {
  const store = usePlayerCompanyStore.getState();
  const companyLvl = store.company?.level ?? store.companyLevel ?? 1;
  const creditBalance = store.creditBalance;
  const totalCapacity = getArmorySlots(companyLvl);
  const currentItems = store.company?.inventory?.length ?? 0;
  const slotsFree = totalCapacity - currentItems;

  const allArmor = getArmorMarketItems(companyLvl);
  const bodyArmor = allArmor.filter((e) => (e.item.rarity ?? "common") === "common");
  const rareArmor = allArmor.filter((e) => e.item.rarity === "rare");
  const epicArmor = allArmor.filter((e) => e.item.rarity === "epic");

  return `
<div id="armor-market" class="armor-market-root troops-market-root">
  <div id="armor-buy-popup" class="gear-buy-popup supplies-buy-popup" role="dialog" aria-modal="true" hidden>
    <div class="gear-buy-popup-inner supplies-buy-popup-inner">
      <h4 id="armor-buy-title" class="supplies-buy-title"></h4>
      <div id="armor-buy-body" class="supplies-buy-body"></div>
      <div class="supplies-buy-qty-row">
        <label>Quantity:</label>
        <div class="supplies-buy-qty-controls">
          <button type="button" id="armor-qty-minus" class="mbtn icon-btn">−</button>
          <input type="number" id="armor-qty-input" min="1" value="1" readonly>
          <button type="button" id="armor-qty-plus" class="mbtn icon-btn">+</button>
        </div>
      </div>
      <p id="armor-buy-error" class="supplies-buy-error" role="alert"></p>
      <div class="supplies-buy-actions">
        <button type="button" id="armor-buy-btn" class="mbtn green">Buy</button>
        <button type="button" id="armor-buy-close" class="mbtn red mbtn-sm">Close</button>
      </div>
    </div>
  </div>
  ${companyHeaderPartial("Body Armor Market")}
  <div class="armor-market-main company-inv-body">
    <div class="company-inv-section">
      <h4 class="company-inv-section-title">Body Armor</h4>
      <div class="gear-market-grid company-inv-slot-grid inventory-grid">
        ${bodyArmor.map((e, i) => gearMarketItemCard(e, i, "armor")).join("")}
      </div>
    </div>
    <div class="company-inv-section">
      <h4 class="company-inv-section-title">Rare Armor</h4>
      <div class="gear-market-grid company-inv-slot-grid inventory-grid">
        ${rareArmor.map((e, i) => gearMarketItemCard(e, bodyArmor.length + i, "armor")).join("")}
      </div>
    </div>
    <div class="company-inv-section">
      <h4 class="company-inv-section-title">Epic Armor</h4>
      <div class="gear-market-grid company-inv-slot-grid inventory-grid">
        ${epicArmor.map((e, i) => gearMarketItemCard(e, bodyArmor.length + rareArmor.length + i, "armor")).join("")}
      </div>
    </div>
  </div>
  <div class="armor-market-footer troops-market-footer">
    <div class="recruit-balance-bar">
      <span class="recruit-balance-item"><strong>Credits</strong> $${creditBalance}</span>
      <span class="recruit-balance-item"><strong>Slots Free</strong> ${slotsFree}/${totalCapacity}</span>
    </div>
    ${companyActionsTemplate()}
  </div>
</div>
`;
};

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function abbreviateItemName(name: string): string {
  return name.replace(/Incendiary/g, "Incend.");
}

function suppliesMarketItemCard(
  entry: { item: import("../../constants/items/types.ts").Item; price: number },
  index: number,
): string {
  const iconUrl = getItemIconUrl(entry.item);
  const name = abbreviateItemName(entry.item.name);
  return `
<div class="supplies-market-item company-inv-slot company-inv-slot-filled" data-supplies-index="${index}" data-supplies-price="${entry.price}" data-supplies-item="${escapeAttr(JSON.stringify(entry.item))}" role="button" tabindex="0">
  <div class="supplies-market-item-inner">
    ${iconUrl ? `<img class="supplies-market-item-icon" src="${iconUrl}" alt="${name}" width="48" height="48">` : ""}
    <span class="company-inv-slot-name">${name}</span>
    <span class="supplies-market-price">$${entry.price}</span>
  </div>
</div>`;
}

export const suppliesMarketTemplate = () => {
  const store = usePlayerCompanyStore.getState();
  const creditBalance = store.creditBalance;
  const companyLvl = store.company?.level ?? store.companyLevel ?? 1;
  const totalCapacity = getArmorySlots(companyLvl);
  const currentItems = store.company?.inventory?.length ?? 0;
  const slotsFree = totalCapacity - currentItems;

  return `
<div id="supplies-market" class="supplies-market-root troops-market-root">
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
        <button type="button" id="supplies-buy-btn" class="mbtn green">Buy</button>
        <button type="button" id="supplies-buy-close" class="mbtn red">Close</button>
      </div>
    </div>
  </div>
  ${companyHeaderPartial("Supplies Market")}
  <div class="supplies-market-main company-inv-body">
    <div class="company-inv-section">
      <h4 class="company-inv-section-title">Common Supplies</h4>
      <div class="supplies-market-grid company-inv-slot-grid inventory-grid">
        ${EQUIPMENT_MARKET_COMMON.map((e, i) => suppliesMarketItemCard(e, i)).join("")}
      </div>
    </div>
    ${EQUIPMENT_MARKET_RARE.length > 0 ? `
    <div class="company-inv-section">
      <h4 class="company-inv-section-title">Rare Supplies</h4>
      <div class="supplies-market-grid company-inv-slot-grid inventory-grid">
        ${EQUIPMENT_MARKET_RARE.map((e, i) => suppliesMarketItemCard(e, EQUIPMENT_MARKET_COMMON.length + i)).join("")}
      </div>
    </div>` : ""}
    <div class="company-inv-section">
      <h4 class="company-inv-section-title">Epic Supplies</h4>
      <div class="supplies-market-grid company-inv-slot-grid inventory-grid">
        ${EQUIPMENT_MARKET_EPIC.map((e, i) => suppliesMarketItemCard(e, EQUIPMENT_MARKET_COMMON.length + EQUIPMENT_MARKET_RARE.length + i)).join("")}
      </div>
    </div>
  </div>
  <div class="supplies-market-footer troops-market-footer">
    <div class="recruit-balance-bar">
      <span class="recruit-balance-item"><strong>Credits</strong> $${creditBalance}</span>
      <span class="recruit-balance-item"><strong>Slots Free</strong> ${slotsFree}/${totalCapacity}</span>
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
  const isFull = currentCount >= maxSize && slotsLeft === 0;
  const remaining = creditBalance - totalCost;
  const canAffordSoldier = (s: Soldier) =>
    slotsLeft > recruitStaging.length &&
    remaining >= getRecruitCost(s.trait_profile?.stats);

  const balanceBarItems: string[] = [];
  if (isFull) {
    balanceBarItems.push(`<span class="recruit-balance-full">Full (${currentCount}/${maxSize})</span>`);
  } else {
    balanceBarItems.push(`<strong>Men</strong> ${currentCount}/${maxSize}`);
    balanceBarItems.push(`<strong>Bal</strong> $${creditBalance}`);
    balanceBarItems.push(`<strong>Sel</strong> ${recruitStaging.length} · $${totalCost}`);
    balanceBarItems.push(`<strong>Max</strong> ${maxSize}`);
  }


  return `
<div id="troops-market" class="troops-market-root" data-troops-screen="v2">
	<div id="troops-recruit-error" class="troops-recruit-error" role="alert" aria-live="polite"></div>
	${companyHeaderPartial("Available Troops")}
	<div class="troops-market-main">
		<div class="troops-list">
			${troops.map((t) => Partial.create.trooper(t, canAffordSoldier(t))).join("")}
		</div>
		<div id="recruit-staging-area" class="recruit-staging-area">
			<p class="recruit-staging-label">Selected ${slotsLeft > 0 ? `(${recruitStaging.length}/${slotsLeft})` : ""}</p>
			<div class="recruit-staging-reroll reroll-counter">Rerolls: ${rerolls}</div>
			<div id="recruit-staging">
				${recruitStaging.map((s) => Partial.create.stagedTrooperCard(s)).join("")}
			</div>
			<div class="staging-total-banner">$${totalCost}</div>
			<button id="confirm-recruitment" type="button" class="confirm-recruit-btn ${!hasStaged || !canAfford ? "disabled" : ""}" ${!hasStaged || !canAfford ? "disabled" : ""}>Confirm</button>
		</div>
	</div>
	<div class="troops-market-footer">
		<div class="recruit-balance-bar">${balanceBarItems.join(" ")}</div>
		${companyActionsTemplate()}
	</div>
</div>
	`;
};
