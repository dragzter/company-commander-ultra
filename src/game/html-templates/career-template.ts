import { companyActionsTemplate, companyHeaderPartial } from "./game-setup-template.ts";
import type { Mission } from "../../constants/missions.ts";
import { MISSION_FACTION_META } from "../../constants/missions.ts";
import { getDisplayEnemyCount } from "../../services/missions/mission-scenarios.ts";
import { CREDIT_SYMBOL } from "../../constants/currency.ts";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toFactionClass(factionId: string | undefined): string {
  if (!factionId) return "career-faction-default";
  const key = factionId.trim().toLowerCase();
  if (key === "libertys_vanguard") return "career-faction-liberty";
  if (key === "iron_corps") return "career-faction-iron";
  if (key === "desert_wolves") return "career-faction-desert";
  return "career-faction-default";
}

export function careerTemplate(input: {
  mission: Mission;
  nextMission: Mission;
  upcomingMission?: Mission | null;
  unlocked: boolean;
  activeSoldierCount: number;
  companyName: string;
  companyLevel: number;
  averageSoldierLevel: number;
  careerLevel: number;
  bestLevel: number;
  totalCareerWins: number;
  animateAdvance?: boolean;
  companyPatchUrl?: string;
}): string {
  const {
    mission,
    nextMission,
    upcomingMission,
    unlocked,
    activeSoldierCount,
    companyName,
    companyLevel,
    averageSoldierLevel,
    careerLevel,
    bestLevel,
    totalCareerWins,
    animateAdvance,
    companyPatchUrl,
  } = input;
  const factionMeta =
    (mission.factionId && MISSION_FACTION_META[mission.factionId]) || null;
  const nextFactionMeta =
    (nextMission.factionId && MISSION_FACTION_META[nextMission.factionId]) || null;
  const currentFactionClass = toFactionClass(mission.factionId);
  const nextFactionClass = toFactionClass(nextMission.factionId);
  const enemyCount = getDisplayEnemyCount(mission);
  const nextEnemyCount = getDisplayEnemyCount(nextMission);
  const currentMissionLevel = Math.max(1, Math.floor(mission.careerLevel ?? mission.difficulty ?? 1));
  const upcomingMissionLevel = Math.max(1, Math.floor(nextMission.careerLevel ?? (careerLevel + 1)));
  const queuedMissionLevel = Math.max(1, Math.floor(upcomingMission?.careerLevel ?? (careerLevel + 1)));
  const queuedFactionMeta =
    (upcomingMission?.factionId && MISSION_FACTION_META[upcomingMission.factionId]) || null;
  const queuedFactionClass = toFactionClass(upcomingMission?.factionId);
  const queuedEnemyCount = upcomingMission ? getDisplayEnemyCount(upcomingMission) : 0;
  const canLaunch = unlocked && activeSoldierCount > 0 && !animateAdvance;
  const launchLevel = Math.max(1, Math.floor(careerLevel));
  const promoteCardClass = animateAdvance ? " career-mission-card-promote" : "";
  const resolvedPatchUrl = (() => {
    const raw = (companyPatchUrl ?? "").trim();
    if (!raw) return "";
    if (raw.startsWith("/")) return raw;
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    return `/images/unit-patches/${raw}`;
  })();
  const lockMsg = unlocked
    ? ""
    : "Career unlocks after intro mission completion.";

  return `
<div id="career-screen" class="career-root troops-market-root">
  ${companyHeaderPartial("Career")}
  <div class="career-main">
    <div class="career-hud">
      <span class="career-hud-pill">Current Lv ${careerLevel}</span>
      <span class="career-hud-pill">Best Lv ${bestLevel}</span>
      <span class="career-hud-pill">Career Wins ${totalCareerWins}</span>
    </div>
    ${
      !unlocked
        ? `<div class="career-locked">${esc(lockMsg)}</div>`
        : ""
    }
    <div class="career-ladder ${animateAdvance ? "career-ladder-advance" : ""}">
      <div class="career-ladder-line"></div>
      <article class="career-company-card">
        <div class="career-company-card-head">
          <img
            class="career-company-logo${resolvedPatchUrl ? "" : " career-company-logo-hidden"}"
            src="${resolvedPatchUrl ? esc(resolvedPatchUrl) : ""}"
            alt="Company patch"
            width="320"
            height="76"
            onerror="this.classList.add('career-company-logo-hidden'); this.nextElementSibling?.classList.add('career-company-logo-fallback-visible');"
          >
          <div class="career-company-logo career-company-logo-fallback${resolvedPatchUrl ? "" : " career-company-logo-fallback-visible"}">CO</div>
          <div class="career-company-card-copy">
            <h4 class="career-company-name">${esc(companyName || "Unnamed Company")}</h4>
            <span class="career-company-sub">Career Lv ${careerLevel}</span>
            <span class="career-company-sub career-company-sub-secondary">Company Lv ${companyLevel}</span>
            <span class="career-company-sub career-company-sub-secondary">Avg Soldier Lv ${averageSoldierLevel}</span>
          </div>
        </div>
        <div class="career-company-meta">
          <span class="career-company-meta-item">Active ${activeSoldierCount}</span>
        </div>
      </article>
      <article class="career-mission-card career-mission-card-current ${currentFactionClass}" data-mission-id="${esc(mission.id)}" data-mission-json="${esc(JSON.stringify(mission))}">
        <div class="career-mission-level-hero" aria-hidden="true">
          <span class="career-mission-level-hero-prefix">Lv</span>
          <span class="career-mission-level-hero-value">${currentMissionLevel}</span>
        </div>
        <span class="career-mission-state-badge">Current</span>
        <header class="career-mission-head">
          <span class="career-mission-brand">
            ${factionMeta?.emblem ? `<img class="career-mission-faction-emblem" src="${esc(factionMeta.emblem)}" alt="${esc(factionMeta.name)} emblem" width="24" height="24">` : ""}
            <span class="career-mission-brand-copy">
              <span class="career-mission-faction">${esc(factionMeta?.name ?? "Hostile Force")}</span>
              <span class="career-mission-level-badge">Mission Lv ${currentMissionLevel}</span>
            </span>
          </span>
        </header>
        <h4 class="career-mission-title">Current Mission</h4>
        <p class="career-mission-brief">Eliminate all hostile targets.</p>
        <div class="career-mission-meta">
          <span class="career-mission-meta-tag">Enemies ${enemyCount}</span>
          <span class="career-mission-meta-tag"><span class="career-credit-symbol">${CREDIT_SYMBOL}</span>${mission.creditReward}</span>
        </div>
      </article>
      ${animateAdvance && upcomingMission ? `
      <article class="career-mission-card career-mission-card-upcoming ${queuedFactionClass}" data-preview-level="${queuedMissionLevel}">
        <div class="career-mission-level-hero" aria-hidden="true">
          <span class="career-mission-level-hero-prefix">Lv</span>
          <span class="career-mission-level-hero-value">${queuedMissionLevel}</span>
        </div>
        <span class="career-mission-state-badge">Next</span>
        <header class="career-mission-head">
          <span class="career-mission-brand">
            ${queuedFactionMeta?.emblem ? `<img class="career-mission-faction-emblem" src="${esc(queuedFactionMeta.emblem)}" alt="${esc(queuedFactionMeta.name)} emblem" width="24" height="24">` : ""}
            <span class="career-mission-brand-copy">
              <span class="career-mission-faction">${esc(queuedFactionMeta?.name ?? "Hostile Force")}</span>
              <span class="career-mission-level-badge">Mission Lv ${queuedMissionLevel}</span>
            </span>
          </span>
        </header>
        <h4 class="career-mission-title">Next Up</h4>
        <p class="career-mission-brief">Advance the ladder by winning current mission.</p>
        <div class="career-mission-meta">
          <span class="career-mission-meta-tag">Enemies ${queuedEnemyCount}</span>
          <span class="career-mission-meta-tag"><span class="career-credit-symbol">${CREDIT_SYMBOL}</span>${upcomingMission.creditReward}</span>
        </div>
        <div class="career-mission-lock-overlay" aria-hidden="true">
          <span class="career-mission-lock-glyph"></span>
          <span class="career-mission-lock-text">Locked</span>
        </div>
      </article>
      ` : ""}
      <article class="career-mission-card career-mission-card-next${promoteCardClass} ${nextFactionClass}" data-preview-level="${nextMission.careerLevel ?? (careerLevel + 1)}">
        <div class="career-mission-level-hero" aria-hidden="true">
          <span class="career-mission-level-hero-prefix">Lv</span>
          <span class="career-mission-level-hero-value">${upcomingMissionLevel}</span>
        </div>
        <span class="career-mission-state-badge">Next</span>
        <header class="career-mission-head">
          <span class="career-mission-brand">
            ${nextFactionMeta?.emblem ? `<img class="career-mission-faction-emblem" src="${esc(nextFactionMeta.emblem)}" alt="${esc(nextFactionMeta.name)} emblem" width="24" height="24">` : ""}
            <span class="career-mission-brand-copy">
              <span class="career-mission-faction">${esc(nextFactionMeta?.name ?? "Hostile Force")}</span>
              <span class="career-mission-level-badge">Mission Lv ${upcomingMissionLevel}</span>
            </span>
          </span>
        </header>
        <h4 class="career-mission-title">Next Up</h4>
        <p class="career-mission-brief">Advance the ladder by winning current mission.</p>
        <div class="career-mission-meta">
          <span class="career-mission-meta-tag">Enemies ${nextEnemyCount}</span>
          <span class="career-mission-meta-tag"><span class="career-credit-symbol">${CREDIT_SYMBOL}</span>${nextMission.creditReward}</span>
        </div>
        <div class="career-mission-lock-overlay${animateAdvance ? " career-mission-lock-overlay-promote" : ""}" aria-hidden="true">
          <span class="career-mission-lock-glyph"></span>
          <span class="career-mission-lock-text">Locked</span>
        </div>
      </article>
    </div>
  </div>
  <div class="career-launch-strip">
    <button type="button" id="career-back-to-missions" class="game-btn game-btn-md game-btn-blue career-launch-btn career-launch-btn-back">Back</button>
    <button type="button" id="career-launch-next" class="game-btn game-btn-md game-btn-green career-launch-btn" ${canLaunch ? "" : "disabled"}>Launch Lv ${launchLevel}</button>
  </div>
  ${companyActionsTemplate()}
</div>`;
}
