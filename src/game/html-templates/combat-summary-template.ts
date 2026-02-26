import type { Combatant } from "../combat/types.ts";
import type { Mission } from "../../constants/missions.ts";
import type { Item } from "../../constants/items/types.ts";
import type { Soldier } from "../../entities/types.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import { getWeaponRestrictRole } from "../../utils/equip-utils.ts";
import { formatDisplayName } from "../../utils/name-utils.ts";
import {
  getLevelFromExperience,
  getSoldierXpRequiredForLevel,
} from "../../constants/economy.ts";

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
  leveledUpIds: Set<string>;
  newLevels: Map<string, number>;
  creditReward: number;
  rewardItems: Item[];
  lootItems: Item[];
  leveledUpCount: number;
  /** Soldiers after combat (with updated experience) for XP bar display */
  soldiersAfterCombat: Map<string, Soldier>;
  /** XP earned this mission per soldier id (survivors only; KIA = 0) */
  xpEarnedBySoldier: Map<string, number>;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function itemCard(item: Item): string {
  const iconUrl = getItemIconUrl(item);
  const name = item.name ?? item.id ?? "Unknown";
  const level = item.level ?? 1;
  const rarity = (item.rarity ?? "common") as string;
  const rarityClass = rarity !== "common" ? ` rarity-${rarity}` : "";
  const isWeapon = item.type === "ballistic_weapon" || item.type === "melee_weapon";
  const weaponRole = isWeapon ? (getWeaponRestrictRole(item) ?? (item as { restrictRole?: string }).restrictRole ?? "any") : null;
  const roleBadgeHtml = weaponRole ? `<span class="market-weapon-role-badge role-${weaponRole}">${WEAPON_ROLE_LABELS[weaponRole] ?? weaponRole}</span>` : "";
  const uses = item.uses ?? item.quantity;
  const usesBadge = uses != null ? `<span class="market-item-uses-badge">×${uses}</span>` : "";
  const iconHtml = iconUrl
    ? `<div class="market-item-icon-wrap"><img class="market-item-icon" src="${escapeAttr(iconUrl)}" alt="${escapeAttr(name)}" width="42" height="42"><span class="item-level-badge rarity-${rarity}">Lv${level}</span>${usesBadge}${roleBadgeHtml}</div>`
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

function summaryXpBar(soldier: Soldier | undefined, xpEarned: number): string {
  if (!soldier) return "";
  const exp = Math.round((soldier.experience ?? 0) * 10) / 10;
  const lvl = getLevelFromExperience(exp);
  const current = getSoldierXpRequiredForLevel(lvl);
  const next = getSoldierXpRequiredForLevel(lvl + 1);
  const xpToNext = next - current;
  const progressInLevel = Math.round(Math.min(Math.max(0, exp - current), xpToNext) * 10) / 10;
  const pct = lvl >= 20 ? 100 : Math.max(0, Math.min(100, (progressInLevel / Math.max(1, xpToNext)) * 100));
  const progressLabel = lvl >= 20 ? "max" : `${progressInLevel}/${xpToNext}`;
  const xpEarnedHtml = xpEarned > 0 ? `<span class="combat-summary-xp-earned">+${xpEarned} XP</span>` : "";
  return `<div class="combat-summary-xp">
  <div class="combat-summary-xp-row">
    <span class="combat-summary-xp-label">XP</span>
    <div class="combat-summary-xp-bar">
      <div class="combat-summary-xp-fill" style="width:${pct}%"></div>
      <span class="combat-summary-xp-text">${progressLabel}</span>
    </div>
  </div>
  ${xpEarnedHtml}
</div>`;
}

function summaryCombatCard(
  c: Combatant,
  kills: number,
  leveledUpIds: Set<string>,
  newLevels: Map<string, number>,
  soldier: Soldier | undefined,
  xpEarned: number,
): string {
  const imgSrc = `/images/green-portrait/${c.avatar ?? "default.png"}`;
  const weaponIcon = c.weaponIconUrl ?? "";
  const pct = Math.max(0, Math.min(100, (c.hp / (c.maxHp || 1)) * 100));
  const isDown = c.hp <= 0 || c.downState;
  const downClass = isDown ? " combat-card-down" : "";
  const levelUpClass = leveledUpIds.has(c.id) ? " combat-summary-leveled-up" : "";
  const weaponHtml = weaponIcon
    ? `<img class="combat-card-weapon" src="${escapeAttr(weaponIcon)}" alt="" width="18" height="18">`
    : '<span class="combat-card-weapon combat-card-weapon-placeholder"></span>';
  const rb = roleBadge(c.designation);
  const lvl = newLevels.get(c.id) ?? c.level ?? 1;
  const des = (c.designation ?? "rifleman").toLowerCase();
  const levelBadgeClass = leveledUpIds.has(c.id) ? " combat-card-level-badge-leveled-up" : "";
  const xpBarHtml = summaryXpBar(soldier, xpEarned);
  return `
<div class="combat-card combat-summary-card designation-${des}${downClass}${levelUpClass}" data-combatant-id="${c.id}">
  <div class="combat-card-inner">
    <div class="combat-card-avatar-wrap">
      <span class="combat-card-level-badge${levelBadgeClass}">${lvl}</span>
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
    ${xpBarHtml}
  </div>
</div>`;
}

export function combatSummaryTemplate(data: CombatSummaryData): string {
  const { victory, mission, participants, playerKills, leveledUpIds, newLevels, creditReward, rewardItems, lootItems, leveledUpCount, soldiersAfterCombat, xpEarnedBySoldier } = data;
  const title = victory ? "Victory!" : "Defeat";
  const titleClass = victory ? "combat-summary-victory" : "combat-summary-defeat";
  const levelUpHtml =
    leveledUpCount > 0
      ? '<div class="combat-summary-levelup-wrap"><div class="combat-summary-levelup-burst"></div><div class="combat-summary-levelup-text">Level up!</div></div>'
      : "";

  const participantsHtml =
    participants.length === 0
      ? "<p class=\"combat-summary-participants-none\">No soldiers.</p>"
      : participants.map((p) => summaryCombatCard(p, playerKills.get(p.id) ?? 0, leveledUpIds, newLevels, soldiersAfterCombat.get(p.id), xpEarnedBySoldier.get(p.id) ?? 0)).join("");

  const creditsFormatted = creditReward > 0 ? creditReward.toLocaleString() : "";
  const creditsHtml =
    victory && creditReward > 0
      ? `<div class="combat-summary-credit-reward">
          <span class="combat-summary-credit-icon">₡</span>
          <span class="combat-summary-credit-amount">${creditsFormatted}</span>
          <span class="combat-summary-credit-label">Credits</span>
        </div>`
      : "";

  const rewardsSection =
    victory && (creditReward > 0 || rewardItems.length > 0)
      ? `
    <div class="combat-summary-section combat-summary-rewards-section">
      <h4>Rewards</h4>
      <div class="combat-summary-rewards">
        ${creditsHtml}
        <div class="combat-summary-items-grid">${rewardItems.map((item) => itemCard(item)).join("")}</div>
      </div>
    </div>
    `
      : "";

  const lootSection =
    victory && lootItems.length > 0
      ? `
    <div class="combat-summary-section combat-summary-loot-section">
      <h4>LOOT</h4>
      <div class="combat-summary-items-grid">
        ${lootItems.map((item) => itemCard(item)).join("")}
      </div>
    </div>
    `
      : "";

  const holdingNote =
    (rewardItems.length > 0 || lootItems.length > 0)
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
  leveledUpIds: Set<string> = new Set(),
  newLevels: Map<string, number> = new Map(),
  soldiersAfterCombat: Map<string, Soldier> = new Map(),
  xpEarnedBySoldier: Map<string, number> = new Map(),
): CombatSummaryData {
  const creditReward = mission?.creditReward ?? 0;

  return {
    victory,
    mission,
    participants: players,
    playerKills: playerKills ?? new Map(),
    leveledUpIds,
    newLevels,
    creditReward,
    rewardItems,
    lootItems,
    leveledUpCount,
    soldiersAfterCombat,
    xpEarnedBySoldier,
  };
}
