import type { Combatant } from "../combat/types.ts";
import type { Mission } from "../../constants/missions.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import { getRewardItemById } from "../../utils/reward-utils.ts";

export interface CombatSummaryData {
  victory: boolean;
  mission: Mission | null;
  participants: { name: string; avatar: string; kills: number; state?: "kia" | "wounded" }[];
  creditReward: number;
  itemRewards: { id: string; name: string; iconUrl: string }[];
  leveledUpCount: number;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function combatSummaryTemplate(data: CombatSummaryData): string {
  const { victory, mission, participants, creditReward, itemRewards, leveledUpCount } = data;
  const title = victory ? "Victory!" : "Defeat";
  const titleClass = victory ? "combat-summary-victory" : "combat-summary-defeat";
  const levelUpHtml =
    leveledUpCount > 0
      ? '<div class="combat-summary-levelup-wrap"><div class="combat-summary-levelup-burst"></div><div class="combat-summary-levelup-text">Level up!</div></div>'
      : "";

  const participantsHtml =
    participants.length === 0
      ? "<p class=\"combat-summary-participants-none\">No soldiers.</p>"
      : participants
          .map(
            (p) =>
              `<div class="combat-summary-participant"><img class="combat-summary-participant-avatar" src="/images/green-portrait/${escapeAttr(p.avatar)}" alt="" width="40" height="40"><span class="combat-summary-participant-name">${escapeHtml(p.name)}</span><span class="combat-summary-participant-kills">${p.kills} kill${p.kills === 1 ? "" : "s"}</span>${p.state === "kia" ? '<span class="combat-summary-participant-status combat-summary-kia">KIA</span>' : p.state === "wounded" ? '<span class="combat-summary-participant-status combat-summary-wounded">Wounded</span>' : ""}</div>`,
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
  <div class="combat-summary-inner${leveledUpCount > 0 ? " combat-summary-levelup-celebrate" : ""}">
    ${levelUpHtml}
    <h3 class="combat-summary-title ${titleClass}">${title}</h3>
    ${mission ? `<p class="combat-summary-mission-name">${escapeHtml(mission.name)}</p>` : ""}
    <div class="combat-summary-section">
      <h4>Soldiers</h4>
      <div class="combat-summary-participants">${participantsHtml}</div>
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
  playerKills?: Map<string, number>,
  leveledUpCount = 0,
): CombatSummaryData {
  const participants: { name: string; avatar: string; kills: number; state?: "kia" | "wounded" }[] = [];
  for (const p of players) {
    const state =
      p.downState === "kia" ? ("kia" as const) : p.hp <= 0 || p.downState ? ("wounded" as const) : undefined;
    participants.push({
      name: p.name,
      avatar: p.avatar ?? "default.png",
      kills: playerKills?.get(p.id) ?? 0,
      ...(state && { state }),
    });
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
    participants,
    creditReward,
    itemRewards,
    leveledUpCount,
  };
}
