import type { Soldier } from "../../entities/types.ts";
import {
  getLevelFromExperience,
  getSoldierXpRequiredForLevel,
  MAX_SOLDIER_LEVEL,
  ENERGY_MAX,
} from "../../../constants/economy.ts";

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Reusable soldier XP bar component.
 * Structure: label | bar (fill + progress text) | next-level label; energy bar below.
 * Used in roster cards, equip picker (inventory), ready room, formation, combat.
 */
type SoldierXpBarOptions = {
  variant?: "default" | "roster";
};

export function soldierXpBar(soldier: Soldier, options: SoldierXpBarOptions = {}): string {
  const variant = options.variant ?? "default";
  const isRoster = variant === "roster";
  const exp = Math.max(0, soldier.experience ?? 0);
  const lvl = getLevelFromExperience(exp);
  const current = getSoldierXpRequiredForLevel(lvl);
  const next = getSoldierXpRequiredForLevel(lvl + 1);
  const xpToNext = next - current;
  const progressInLevel = Math.min(Math.max(0, exp - current), xpToNext);
  const progressInLevelDisplay = Math.floor(progressInLevel);
  const xpToNextDisplay = Math.floor(xpToNext);
  const expDisplay = Math.floor(exp);
  const atMaxLevel = lvl >= MAX_SOLDIER_LEVEL;
  const pct = atMaxLevel ? 100 : Math.max(0, Math.min(100, (progressInLevel / Math.max(1, xpToNext)) * 100));
  const xpText = atMaxLevel ? `${expDisplay} XP (max)` : `${progressInLevelDisplay} / ${xpToNextDisplay} XP to Lvl ${lvl + 1}`;
  const progressLabel = atMaxLevel ? "max" : `${progressInLevelDisplay}/${xpToNextDisplay}`;
  const nextLvlLabel = atMaxLevel
    ? `<span class="soldier-xp-next${isRoster ? " soldier-xp-next-roster" : ""}">MAX</span>`
    : `<span class="soldier-xp-next${isRoster ? " soldier-xp-next-roster" : ""}">Lv ${lvl + 1}</span>`;
  const barFill = `<div class="soldier-xp-fill" style="width:${pct}%"></div>`;
  const barTrack = `<div class="soldier-xp-bar${isRoster ? " soldier-xp-bar-roster" : ""}">${barFill}<span class="soldier-xp-progress-inline">${progressLabel}</span></div>`;

  const energy = Math.max(0, Math.min(ENERGY_MAX, soldier.energy ?? ENERGY_MAX));
  const energyPct = Math.max(0, Math.min(100, (energy / ENERGY_MAX) * 100));
  const energyText = `${Math.round(energy)}/${ENERGY_MAX}`;
  const energyBarFill = `<div class="soldier-energy-fill" style="width:${energyPct}%"></div>`;
  const energyBar = `<div class="soldier-energy-bar${isRoster ? " soldier-energy-bar-roster" : ""} tooltip-wrapper energy-tooltip-wrap" tabindex="0">${energyBarFill}<span class="soldier-energy-text">${energyText}</span><div class="tooltip-body energy-tooltip">Energy</div></div>`;

  const currentLvlLabel = `<span class="soldier-xp-current-level">Lv ${lvl}</span>`;

  return `<div class="soldier-xp-wrapper${isRoster ? " soldier-xp-wrapper-roster" : ""} tooltip-wrapper xp-tooltip-wrap" tabindex="0">
  <div class="soldier-xp-row${isRoster ? " soldier-xp-row-roster" : ""}">
    ${isRoster ? currentLvlLabel : '<span class="soldier-xp-label">XP</span>'}
    ${barTrack}
    ${nextLvlLabel}
  </div>
  <div class="soldier-energy-row${isRoster ? " soldier-energy-row-roster" : ""}">${energyBar}</div>
  <div class="tooltip-body xp-tooltip">${escapeHtml(xpText)}</div>
</div>`;
}
