import type { Combatant } from "../combat/types.ts";
import type { Mission } from "../../constants/missions.ts";
import type { Item } from "../../constants/items/types.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import { getWeaponRestrictRole } from "../../utils/equip-utils.ts";
import { formatDisplayName } from "../../utils/name-utils.ts";

const WEAPON_ROLE_LABELS: Record<string, string> = {
  rifleman: "Rifleman",
  support: "Support",
  medic: "Medic",
  any: "Any",
};

export interface CombatSummaryData {
  victory: boolean;
  mission: Mission | null;
  participants: Combatant[];
  playerKills: Map<string, number>;
  creditReward: number;
  rewardItems: Item[];
  lootItems: Item[];
  leveledUpCount: number;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Group items by id, count occurrences. Returns { item, quantity }[]. */
function groupItemsWithQuantity(items: Item[]): { item: Item; quantity: number }[] {
  const byKey = new Map<string, { item: Item; quantity: number }>();
  for (const it of items) {
    const key = it.id ?? "";
    const existing = byKey.get(key);
    if (existing) {
      existing.quantity += 1;
    } else {
      byKey.set(key, { item: it, quantity: 1 });
    }
  }
  return Array.from(byKey.values());
}

function itemCard(item: Item, quantity: number): string {
  const iconUrl = getItemIconUrl(item);
  const name = item.name ?? item.id ?? "Unknown";
  const level = item.level ?? 1;
  const rarity = (item.rarity ?? "common") as string;
  const rarityClass = rarity !== "common" ? ` rarity-${rarity}` : "";
  const isWeapon = item.type === "ballistic_weapon" || item.type === "melee_weapon";
  const weaponRole = isWeapon ? (getWeaponRestrictRole(item) ?? (item as { restrictRole?: string }).restrictRole ?? "any") : null;
  const roleBadgeHtml = weaponRole ? `<span class="market-weapon-role-badge role-${weaponRole}">${WEAPON_ROLE_LABELS[weaponRole] ?? weaponRole}</span>` : "";
  const qtyBadge = `<span class="market-item-uses-badge">×${quantity}</span>`;
  const iconHtml = iconUrl
    ? `<div class="market-item-icon-wrap"><img class="market-item-icon" src="${escapeAttr(iconUrl)}" alt="${escapeAttr(name)}" width="42" height="42"><span class="item-level-badge rarity-${rarity}">Lv${level}</span>${qtyBadge}${roleBadgeHtml}</div>`
    : "";
  return `
<div class="market-item-slot combat-summary-item-slot${rarityClass}">
  <div class="market-item-inner">
    ${iconHtml}
    <div class="market-item-details">
      <span class="market-item-name">${escapeHtml(name)}</span>
    </div>
  </div>
</div>`;
}

function roleBadge(designation: string | undefined): string {
  if (!designation) return "";
  const d = (designation as string).toUpperCase();
  if (d === "RIFLEMAN") return "R";
  if (d === "SUPPORT") return "S";
  if (d === "MEDIC") return "M";
  return d[0] ?? "";
}

function summaryCombatCard(c: Combatant, kills: number): string {
  const imgSrc = `/images/green-portrait/${c.avatar ?? "default.png"}`;
  const weaponIcon = c.weaponIconUrl ?? "";
  const pct = Math.max(0, Math.min(100, (c.hp / (c.maxHp || 1)) * 100));
  const isDown = c.hp <= 0 || c.downState;
  const downClass = isDown ? " combat-card-down" : "";
  const weaponHtml = weaponIcon
    ? `<img class="combat-card-weapon" src="${escapeAttr(weaponIcon)}" alt="" width="18" height="18">`
    : '<span class="combat-card-weapon combat-card-weapon-placeholder"></span>';
  const rb = roleBadge(c.designation);
  const lvl = c.level ?? 1;
  const des = (c.designation ?? "rifleman").toLowerCase();
  return `
<div class="combat-card combat-summary-card designation-${des}${downClass}" data-combatant-id="${c.id}">
  <div class="combat-card-inner">
    <div class="combat-card-avatar-wrap">
      <span class="combat-card-level-badge">${lvl}</span>
      <img class="combat-card-avatar" src="${imgSrc}" alt="">
      ${weaponHtml}
      ${rb ? `<span class="combat-card-role-badge">${rb}</span>` : ""}
    </div>
    <div class="combat-card-hp-wrap">
      <div class="combat-card-hp-bar" style="width: ${pct}%"></div>
      <span class="combat-card-hp-value">${Math.floor(c.hp)}/${Math.floor(c.maxHp)}</span>
    </div>
    <span class="combat-card-name">${escapeHtml(formatDisplayName(c.name))}</span>
    <span class="combat-summary-kills">${kills} kill${kills === 1 ? "" : "s"}</span>
    ${c.downState === "kia" ? '<span class="combat-summary-status combat-summary-kia">KIA</span>' : (c.hp <= 0 || c.downState) ? '<span class="combat-summary-status combat-summary-wounded">Wounded</span>' : ""}
  </div>
</div>`;
}

export function combatSummaryTemplate(data: CombatSummaryData): string {
  const { victory, mission, participants, playerKills, creditReward, rewardItems, lootItems, leveledUpCount } = data;
  const title = victory ? "Victory!" : "Defeat";
  const titleClass = victory ? "combat-summary-victory" : "combat-summary-defeat";
  const levelUpHtml =
    leveledUpCount > 0
      ? '<div class="combat-summary-levelup-wrap"><div class="combat-summary-levelup-burst"></div><div class="combat-summary-levelup-text">Level up!</div></div>'
      : "";

  const participantsHtml =
    participants.length === 0
      ? "<p class=\"combat-summary-participants-none\">No soldiers.</p>"
      : participants.map((p) => summaryCombatCard(p, playerKills.get(p.id) ?? 0)).join("");

  const creditsHtml =
    victory && creditReward > 0
      ? `<div class="combat-summary-reward-row"><span class="combat-summary-reward-icon">$</span><span class="combat-summary-reward-amount">${creditReward}</span></div>`
      : "";

  const groupedRewards = groupItemsWithQuantity(rewardItems);
  const groupedLoot = groupItemsWithQuantity(lootItems);

  const rewardsSection =
    victory && (creditReward > 0 || groupedRewards.length > 0)
      ? `
    <div class="combat-summary-section combat-summary-rewards-section">
      <h4>Rewards</h4>
      <div class="combat-summary-rewards">
        ${creditsHtml}
        <div class="combat-summary-items-grid">${groupedRewards.map(({ item, quantity }) => itemCard(item, quantity)).join("")}</div>
      </div>
    </div>
    `
      : "";

  const lootSection =
    victory && groupedLoot.length > 0
      ? `
    <div class="combat-summary-section combat-summary-loot-section">
      <h4>LOOT</h4>
      <div class="combat-summary-items-grid">
        ${groupedLoot.map(({ item, quantity }) => itemCard(item, quantity)).join("")}
      </div>
    </div>
    `
      : "";

  const holdingNote =
    (groupedRewards.length > 0 || groupedLoot.length > 0)
      ? '<p class="combat-summary-holding-note">Some items may be in Holding (armory full). Claim from armory.</p>'
      : "";

  return `
<div id="combat-summary-overlay" class="combat-summary-overlay" role="dialog" aria-modal="true">
  <div class="combat-summary-inner${leveledUpCount > 0 ? " combat-summary-levelup-celebrate" : ""}">
    ${levelUpHtml}
    <h3 class="combat-summary-title ${titleClass}">${title}</h3>
    ${mission ? `<p class="combat-summary-mission-name">${escapeHtml(mission.name)}</p>` : ""}
    <div class="combat-summary-section">
      <h4>Soldiers</h4>
      <div class="combat-summary-participants combat-summary-cards-row">${participantsHtml}</div>
    </div>
    ${rewardsSection}
    ${lootSection}
    ${holdingNote}
    <button type="button" id="combat-summary-return" class="game-btn game-btn-green combat-summary-return-btn">Return to Missions</button>
  </div>
</div>`;
}

/** Build summary data from combat state. */
export function buildCombatSummaryData(
  victory: boolean,
  mission: Mission | null,
  players: Combatant[],
  playerKills?: Map<string, number>,
  leveledUpCount = 0,
  rewardItems: Item[] = [],
  lootItems: Item[] = [],
): CombatSummaryData {
  const creditReward = mission?.creditReward ?? 0;

  return {
    victory,
    mission,
    participants: players,
    playerKills: playerKills ?? new Map(),
    creditReward,
    rewardItems,
    lootItems,
    leveledUpCount,
  };
}
