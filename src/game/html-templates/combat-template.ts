import { companyHeaderPartial } from "./game-setup-template.ts";
import { formatDisplayName } from "../../utils/name-utils.ts";
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
    ? `<img class="combat-card-weapon" src="${weaponIcon}" alt="" width="18" height="18">`
    : '<span class="combat-card-weapon combat-card-weapon-placeholder"></span>';
  const rb = roleBadge(c.designation);
  const spdMs = c.attackIntervalMs;
  const spdText =
    spdMs != null && spdMs > 0 ? `SPD: ${(spdMs / 1000).toFixed(1)}s` : "";

  const lvl = c.level ?? 1;
  const des = (c.designation ?? "rifleman").toLowerCase();
  const epicEliteClass = c.isEpicElite ? " combat-card-epic-elite" : "";
  return `
<div class="combat-card designation-${des}${downClass}${epicEliteClass}" data-combatant-id="${c.id}" data-side="${c.side}">
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
    <span class="combat-card-name">${formatDisplayName(c.name)}</span>
    ${spdText ? `<span class="combat-card-spd-badge">${spdText}</span>` : ""}
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

  const frontCount = 5;
  const playerFront = playerCards.slice(0, frontCount);
  const playerBack = playerCards.slice(frontCount);
  const enemyFront = enemyCards.slice(0, frontCount);
  const enemyBack = enemyCards.slice(frontCount);

  return `
<div id="combat-screen" class="combat-root" data-mission-json="${missionData}" data-players-json="${playersData}" data-enemies-json="${enemiesData}">
  ${companyHeaderPartial(missionName)}
  <div class="combat-main combat-main-with-drawer">
    <div id="combat-battle-area" class="combat-battle-area">
      <svg id="combat-attack-lines-svg" class="combat-attack-lines-svg" aria-hidden="true">
        <defs>
          <marker id="combat-arrow-player" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="rgba(100, 200, 100, 0.8)" />
          </marker>
          <marker id="combat-arrow-enemy" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="rgba(220, 80, 80, 0.8)" />
          </marker>
        </defs>
        <g id="combat-attack-lines-g"></g>
      </svg>
      <svg id="combat-projectiles-svg" class="combat-projectiles-svg" aria-hidden="true"><g id="combat-projectiles-g"></g></svg>
      <div class="combat-row combat-enemies">
        <div class="combat-formation" id="combat-enemies-grid">
          ${enemyBack.length ? `<div class="combat-cards-row combat-formation-back">${enemyBack.join("")}</div>` : ""}
          <div class="combat-cards-row combat-formation-front">${enemyFront.join("")}</div>
        </div>
      </div>
      <div class="combat-divider"></div>
      <div class="combat-row combat-players">
        <div class="combat-formation" id="combat-players-grid">
          <div class="combat-cards-row combat-formation-front">${playerFront.join("")}</div>
          ${playerBack.length ? `<div class="combat-cards-row combat-formation-back">${playerBack.join("")}</div>` : ""}
        </div>
      </div>
    </div>
    <button type="button" id="combat-begin" class="combat-begin-floating combat-begin-poppy">Begin</button>
  </div>
  <div class="combat-footer troops-market-footer combat-footer-layout">
    <button type="button" id="combat-reset" class="game-btn game-btn-sm game-btn-blue">Reset</button>
    <button type="button" id="combat-mission-details" class="game-btn game-btn-sm game-btn-blue">Details</button>
    <button type="button" id="combat-quit" class="game-btn game-btn-sm game-btn-red">Quit</button>
  </div>
  <div id="combat-mission-details-popup" class="combat-mission-details-popup" role="dialog" aria-modal="true" hidden>
    <div class="combat-mission-details-inner">
      <h4 id="combat-mission-details-title">Details</h4>
      <div id="combat-mission-details-body"></div>
      <button type="button" id="combat-mission-details-close" class="mbtn blue mbtn-sm">Close</button>
    </div>
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
  <div id="combat-summary-container" class="combat-summary-container"></div>
  <div id="combat-abilities-popup" class="combat-abilities-popup" aria-hidden="true">
    <div class="combat-abilities-popup-content" id="combat-abilities-popup-content">
      <h4 class="combat-abilities-popup-title" id="combat-abilities-popup-title"></h4>
      <div class="combat-abilities-list" id="combat-abilities-list"></div>
    </div>
    <div class="combat-abilities-popup-hint" id="combat-abilities-popup-hint"></div>
  </div>
</div>`;
}
