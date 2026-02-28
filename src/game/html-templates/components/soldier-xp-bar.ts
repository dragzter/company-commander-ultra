import type { Soldier } from "../../entities/types.ts";
import {
  getLevelFromExperience,
  getSoldierXpRequiredForLevel,
  MAX_SOLDIER_LEVEL,
  ENERGY_MAX,
} from "../../../constants/economy.ts";

/**
 * Reusable soldier XP bar component.
 * Structure: label | bar (fill + progress text) | next-level label; energy bar below.
 * Used in roster cards, equip picker (inventory), ready room, formation, combat.
 */
export function soldierXpBar(soldier: Soldier): string {
  const exp = Math.round((soldier.experience ?? 0) * 10) / 10;
  const lvl = getLevelFromExperience(exp);
  const current = getSoldierXpRequiredForLevel(lvl);
  const next = getSoldierXpRequiredForLevel(lvl + 1);
  const xpToNext = next - current;
  const progressInLevel = Math.round(Math.min(Math.max(0, exp - current), xpToNext) * 10) / 10;
  const atMaxLevel = lvl >= MAX_SOLDIER_LEVEL;
  const pct = atMaxLevel ? 100 : Math.max(0, Math.min(100, (progressInLevel / Math.max(1, xpToNext)) * 100));
  const xpText = atMaxLevel ? `${exp} XP (max)` : `${progressInLevel} / ${xpToNext} XP to Lvl ${lvl + 1}`;
  const progressLabel = atMaxLevel ? "max" : `${progressInLevel}/${xpToNext}`;
  const nextLvlLabel = atMaxLevel ? "" : `<span class="soldier-xp-next">Lv ${lvl + 1}</span>`;
  const barFill = `<div class="soldier-xp-fill" style="width:${pct}%"></div>`;
  const barTrack = `<div class="soldier-xp-bar">${barFill}<span class="soldier-xp-progress-inline">${progressLabel}</span></div>`;

  const energy = Math.max(0, Math.min(ENERGY_MAX, soldier.energy ?? ENERGY_MAX));
  const energyPct = Math.max(0, Math.min(100, (energy / ENERGY_MAX) * 100));
  const energyText = `${Math.round(energy)}/${ENERGY_MAX}`;
  const energyBarFill = `<div class="soldier-energy-fill" style="width:${energyPct}%"></div>`;
  const energyBar = `<div class="soldier-energy-bar tooltip-wrapper energy-tooltip-wrap" tabindex="0">${energyBarFill}<span class="soldier-energy-text">${energyText}</span><div class="tooltip-body energy-tooltip">Energy</div></div>`;

  return `<div class="soldier-xp-wrapper tooltip-wrapper xp-tooltip-wrap" tabindex="0">
  <div class="soldier-xp-row">
    <span class="soldier-xp-label">XP</span>
    ${barTrack}
    ${nextLvlLabel}
  </div>
  <div class="soldier-energy-row">${energyBar}</div>
  <div class="tooltip-body xp-tooltip">${xpText}</div>
</div>`;
}
