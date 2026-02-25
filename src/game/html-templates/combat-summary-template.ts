import type { Combatant } from "../combat/types.ts";
import type { Mission } from "../../constants/missions.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import { getRewardItemById } from "../../utils/reward-utils.ts";

export interface CombatSummaryData {
  victory: boolean;
  mission: Mission | null;
  casualties: { name: string; state: "kia" | "wounded" }[];
  creditReward: number;
  itemRewards: { id: string; name: string; iconUrl: string }[];
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function combatSummaryTemplate(data: CombatSummaryData): string {
  const { victory, mission, casualties, creditReward, itemRewards } = data;
  const title = victory ? "Victory!" : "Defeat";
  const titleClass = victory ? "combat-summary-victory" : "combat-summary-defeat";

  const casualtiesHtml =
    casualties.length === 0
      ? "<p class=\"combat-summary-casualty-none\">No casualties.</p>"
      : casualties
          .map(
            (c) =>
              `<div class="combat-summary-casualty-row"><span class="combat-summary-casualty-name">${escapeHtml(c.name)}</span><span class="combat-summary-casualty-state">${c.state === "kia" ? "KIA" : "Wounded"}</span></div>`,
          )
          .join("");

  const creditsHtml =
    victory && creditReward > 0
      ? `<div class="combat-summary-reward-row"><span class="combat-summary-reward-icon">$</span><span class="combat-summary-reward-amount">${creditReward}</span></div>`
      : "";

  const itemsHtml =
    victory && itemRewards.length > 0
      ? itemRewards
          .map(
            (r) =>
              `<div class="combat-summary-item-reward"><img src="${escapeAttr(r.iconUrl)}" alt="" width="32" height="32"><span>${escapeHtml(r.name)}</span></div>`,
          )
          .join("")
      : "";

  const holdingNote =
    mission?.rewardItems && mission.rewardItems.length > 0
      ? '<p class="combat-summary-holding-note">Some items may be in Holding (armory full). Claim from armory.</p>'
      : "";

  return `
<div id="combat-summary-overlay" class="combat-summary-overlay" role="dialog" aria-modal="true">
  <div class="combat-summary-inner">
    <h3 class="combat-summary-title ${titleClass}">${title}</h3>
    ${mission ? `<p class="combat-summary-mission-name">${escapeHtml(mission.name)}</p>` : ""}
    <div class="combat-summary-section">
      <h4>Casualties</h4>
      <div class="combat-summary-casualties">${casualtiesHtml}</div>
    </div>
    ${victory ? `
    <div class="combat-summary-section">
      <h4>Rewards</h4>
      <div class="combat-summary-rewards">
        ${creditsHtml}
        <div class="combat-summary-item-rewards">${itemsHtml}</div>
      </div>
      ${holdingNote}
    </div>
    ` : ""}
    <button type="button" id="combat-summary-return" class="game-btn game-btn-green combat-summary-return-btn">Return to Missions</button>
  </div>
</div>`;
}

/** Build summary data from combat state. */
export function buildCombatSummaryData(
  victory: boolean,
  mission: Mission | null,
  players: Combatant[],
): CombatSummaryData {
  const kiaIds = new Set<string>();
  const casualties: { name: string; state: "kia" | "wounded" }[] = [];
  for (const p of players) {
    if (p.hp <= 0 || p.downState) {
      const state = p.downState === "kia" ? "kia" : "wounded";
      casualties.push({ name: p.name, state });
      if (state === "kia") kiaIds.add(p.id);
    }
  }

  const creditReward = mission?.creditReward ?? 0;
  const rewardIds = victory && mission?.rewardItems ? mission.rewardItems : [];
  const itemRewards: { id: string; name: string; iconUrl: string }[] = [];
  for (const id of rewardIds) {
    const item = getRewardItemById(id);
    if (item)
      itemRewards.push({
        id,
        name: item.name ?? item.id ?? "Unknown",
        iconUrl: getItemIconUrl(item),
      });
  }

  return {
    victory,
    mission,
    casualties,
    creditReward,
    itemRewards,
  };
}
