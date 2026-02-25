import type { Soldier } from "../../entities/types.ts";
import { getLevelFromExperience, getSoldierXpRequiredForLevel } from "../../../constants/economy.ts";

/**
 * Reusable soldier XP bar component.
 * Structure: label | bar (fill + progress text) | next-level label
 * Used in roster cards, equip picker (inventory), ready room, formation, combat.
 */
export function soldierXpBar(soldier: Soldier): string {
  const exp = Math.round((soldier.experience ?? 0) * 10) / 10;
  const lvl = getLevelFromExperience(exp);
  const current = getSoldierXpRequiredForLevel(lvl);
  const next = getSoldierXpRequiredForLevel(lvl + 1);
  const xpToNext = next - current;
  const progressInLevel = Math.round(Math.min(Math.max(0, exp - current), xpToNext) * 10) / 10;
  const pct = lvl >= 20 ? 100 : Math.max(0, Math.min(100, (progressInLevel / Math.max(1, xpToNext)) * 100));
  const xpText = lvl >= 20 ? `${exp} XP (max)` : `${progressInLevel} / ${xpToNext} XP to Lvl ${lvl + 1}`;
  const progressLabel = lvl >= 20 ? "max" : `${progressInLevel}/${xpToNext}`;
  const nextLvlLabel = lvl >= 20 ? "" : `<span class="soldier-xp-next">Lv ${lvl + 1}</span>`;
  const barFill = `<div class="soldier-xp-fill" style="width:${pct}%"></div>`;
  const barTrack = `<div class="soldier-xp-bar">${barFill}<span class="soldier-xp-progress-inline">${progressLabel}</span></div>`;
  return `<div class="soldier-xp-wrapper tooltip-wrapper xp-tooltip-wrap" tabindex="0">
  <div class="soldier-xp-row">
    <span class="soldier-xp-label">XP</span>
    ${barTrack}
    ${nextLvlLabel}
  </div>
  <div class="tooltip-body xp-tooltip">${xpText}</div>
</div>`;
}
