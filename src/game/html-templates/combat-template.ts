import { companyHeaderPartial } from "./game-setup-template.ts";
import type { Mission } from "../../constants/missions.ts";
import type { Combatant } from "../combat/types.ts";

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function roleBadge(designation: string | undefined): string {
  if (!designation) return "";
  const d = (designation as string).toUpperCase();
  if (d === "RIFLEMAN") return "R";
  if (d === "SUPPORT") return "S";
  if (d === "MEDIC") return "M";
  return d[0] ?? "";
}

function combatCard(c: Combatant, portraitDir: "player" | "enemy"): string {
  const imgSrc = portraitDir === "player"
    ? `/images/green-portrait/${c.avatar}`
    : `/images/red-portrait/${c.avatar}`;
  const weaponIcon = c.weaponIconUrl ?? "";
  const pct = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));
  const isDown = c.hp <= 0 || c.downState;
  const downClass = isDown ? " combat-card-down" : "";
  const weaponHtml = weaponIcon
    ? `<img class="combat-card-weapon" src="${weaponIcon}" alt="" width="16" height="16">`
    : '<span class="combat-card-weapon combat-card-weapon-placeholder"></span>';
  const rb = roleBadge(c.designation);

  return `
<div class="combat-card${downClass}" data-combatant-id="${c.id}" data-side="${c.side}">
  <div class="combat-card-inner">
    <div class="combat-card-avatar-wrap">
      <img class="combat-card-avatar" src="${imgSrc}" alt="" width="48" height="48">
      ${weaponHtml}
      ${rb ? `<span class="combat-card-role-badge">${rb}</span>` : ""}
    </div>
    <div class="combat-card-hp-wrap">
      <div class="combat-card-hp-bar" style="width: ${pct}%"></div>
      <span class="combat-card-hp-value">${Math.floor(c.hp)}/${Math.floor(c.maxHp)}</span>
    </div>
    <span class="combat-card-name">${c.name}</span>
  </div>
</div>`;
}

export function combatTemplate(
  mission: Mission | null,
  players: Combatant[],
  enemies: Combatant[],
): string {
  const missionName = mission?.name ?? "Combat";
  const missionData = mission ? escapeAttr(JSON.stringify(mission)) : "";
  const playersData = escapeAttr(JSON.stringify(players));
  const enemiesData = escapeAttr(JSON.stringify(enemies));

  const playerCards = players.map((p) => combatCard(p, "player"));
  const enemyCards = enemies.map((e) => combatCard(e, "enemy"));

  return `
<div id="combat-screen" class="combat-root" data-mission-json="${missionData}" data-players-json="${playersData}" data-enemies-json="${enemiesData}">
  ${companyHeaderPartial(missionName)}
  <div class="combat-header-bar">
    <button type="button" id="combat-begin" class="mbtn green">Begin</button>
    <button type="button" id="combat-reset" class="mbtn blue mbtn-sm">Reset</button>
  </div>
  <div class="combat-main combat-main-with-drawer">
    <div id="combat-battle-area" class="combat-battle-area">
      <svg id="combat-projectiles-svg" class="combat-projectiles-svg" aria-hidden="true"><g id="combat-projectiles-g"></g></svg>
      <div class="combat-row combat-enemies">
        <h4>Enemies</h4>
        <div class="combat-cards-grid" id="combat-enemies-grid">
          ${enemyCards.join("")}
        </div>
      </div>
      <div class="combat-divider"></div>
      <div class="combat-row combat-players">
        <h4>Your Soldiers</h4>
        <div class="combat-cards-grid" id="combat-players-grid">
          ${playerCards.join("")}
        </div>
      </div>
    </div>
  </div>
  <div class="combat-footer troops-market-footer combat-footer-layout">
    <button type="button" id="combat-mission-details" class="mbtn blue">Mission Details</button>
    <button type="button" id="combat-quit" class="mbtn red">Quit</button>
  </div>
  <div id="combat-quit-confirm-popup" class="combat-quit-confirm-popup" role="dialog" aria-modal="true" hidden>
    <div class="combat-quit-confirm-inner">
      <p>Quit combat? Progress will be lost.</p>
      <div class="combat-quit-confirm-actions">
        <button type="button" id="combat-quit-confirm-yes" class="mbtn red mbtn-sm">Yes, Quit</button>
        <button type="button" id="combat-quit-confirm-no" class="mbtn green mbtn-sm">Cancel</button>
      </div>
    </div>
  </div>
  <div id="combat-abilities-popup" class="combat-abilities-popup" aria-hidden="true">
    <div class="combat-abilities-popup-content" id="combat-abilities-popup-content">
      <h4 class="combat-abilities-popup-title" id="combat-abilities-popup-title"></h4>
      <div class="combat-abilities-list" id="combat-abilities-list"></div>
    </div>
    <div class="combat-abilities-popup-hint" id="combat-abilities-popup-hint"></div>
  </div>
</div>`;
}
