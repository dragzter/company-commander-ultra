import { DOM } from "../../constants/css-selectors.ts";
import {
  getTotalArmorySlots,
  getXpRequiredForLevel,
  MAX_COMPANY_LEVEL,
} from "../../constants/economy.ts";
import {
  COMPANY_LEVEL_PROGRESSION,
  getCompanyLevelSnapshot,
} from "../../constants/company-progression.ts";
import type { MemorialEntry } from "../entities/memorial-types.ts";
import { clrHash } from "../../utils/html-utils.ts";
import { Images } from "../../constants/images.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { TRAIT_CODEX } from "../../constants/trait-codex.ts";
import { TraitProfileStats } from "../entities/soldier/soldier-traits.ts";
import { getLevelBenefitsForCodex } from "../entities/levels.ts";
import { APP_VERSION } from "../../constants/version.ts";
import { CREDIT_SYMBOL } from "../../constants/currency.ts";
import { getSoldierPortraitUrl } from "../../utils/name-utils.ts";

const TRAIT_STAT_ABBR: Record<string, string> = {
  hit_points: "HP",
  dexterity: "DEX",
  morale: "MOR",
  toughness: "TGH",
  awareness: "AWR",
};

/** Stat explanations for the codex Stats tab. Abbreviations match display (HP, MIT, AVD, HIT, etc.). */
const STAT_HELP_ITEMS: { stat: string; abbr: string; desc: string; isBaseStat?: boolean }[] = [
  { stat: "Hit Points", abbr: "HP", desc: "Health. Damage capacity before incapacitation. Styled distinctly as a resource stat." },
  { stat: "Mitigation", abbr: "MIT", desc: "Damage reduction. Lowers incoming damage. Capped at 60%. From TGH and armor." },
  { stat: "Avoidance", abbr: "AVD", desc: "Chance to evade or dodge incoming attacks. Capped at 30%. 16 AWR or 20 DEX per 1%.", isBaseStat: false },
  { stat: "Chance to Hit", abbr: "HIT", desc: "Accuracy. Likelihood your attacks land. Capped at 98%. 12 DEX or 18 AWR per 1%.", isBaseStat: false },
  { stat: "Morale", abbr: "MOR", desc: "Resistance to suppression, psychic effects, and panic. Affects duration of mental debuffs.", isBaseStat: true },
  { stat: "Toughness", abbr: "TGH", desc: "Contributes to mitigation. Reduces damage taken. From level, traits, and armor.", isBaseStat: true },
  { stat: "Awareness", abbr: "AWR", desc: "Spotting and reflexes. Boosts hit chance and avoidance.", isBaseStat: true },
  { stat: "Dexterity", abbr: "DEX", desc: "Aiming and reflexes. Boosts hit chance and avoidance. Also increases attack speed.", isBaseStat: true },
  { stat: "Attack Speed", abbr: "SPD", desc: "Time between attacks in seconds. From weapon speed_base and dexterity." },
];

/** Builds level rows for the codex Levels tab. */
function codexLevelsHTML(): string {
	const rows = getLevelBenefitsForCodex();
	return rows
		.map((r) => {
			const gainsHtml =
				r.gainsBadges.length > 0
					? r.gainsBadges.map((b) => `<span class="codex-stat-badge codex-badge-positive">${b}</span>`).join("")
					: '<span class="codex-stat-badge codex-badge-neutral">Base</span>';
			const isRangeRow = Boolean(r.levelLabel);
			const specialHtml = r.special
				? isRangeRow
					? `<div class="codex-level-range-note">${r.special}</div>`
					: `<span class="codex-level-special">${r.special}</span>`
				: "";
			if (isRangeRow) {
				return `
		<div class="codex-level-row codex-level-row-range">
			<span class="codex-level-num">${r.levelLabel ?? `Lv ${r.level}`}</span>
			<div class="codex-level-gains">${gainsHtml}</div>
		</div>
		${specialHtml}`;
			}
			return `
		<div class="codex-level-row">
			<span class="codex-level-num">${r.levelLabel ?? `Lv ${r.level}`}</span>
			<div class="codex-level-gains">${gainsHtml}</div>
			<div class="codex-level-special-wrap">${specialHtml}</div>
		</div>`;
		})
		.join("");
}

/** Builds soldier slot unlock rows for the codex Slots tab. */
function codexSlotsHTML(): string {
  return COMPANY_LEVEL_PROGRESSION.map((row, i) => {
    const prev = i > 0 ? COMPANY_LEVEL_PROGRESSION[i - 1] : null;
    const rosterIncreased = !prev || row.roster.total > prev.roster.total;
    const activeIncreased = !prev || row.roster.active > prev.roster.active;
    return `
      <div class="codex-slot-row">
        <span class="codex-slot-lv">Lv ${row.level}</span>
        <span class="codex-slot-value${rosterIncreased ? " codex-slot-unlocked" : ""}">${row.roster.total}</span>
        <span class="codex-slot-value${activeIncreased ? " codex-slot-unlocked" : ""}">${row.roster.active}</span>
        <span class="codex-slot-value">${row.roleCaps.active.rifleman}</span>
        <span class="codex-slot-value">${row.roleCaps.active.support}</span>
        <span class="codex-slot-value">${row.roleCaps.active.medic}</span>
      </div>`;
  }).join("");
}

/** Builds trait cards for the codex Traits tab. */
function codexTraitsHTML(): string {
  const traits = Object.keys(TraitProfileStats).sort();
  return traits
    .map((name) => {
      const stats = TraitProfileStats[name];
      const entry = TRAIT_CODEX[name];
      const desc = entry?.description ?? "Modifies stats as listed.";
      const flavor = entry?.flavor ?? "—";
      const badges = Object.entries(stats)
        .map(([k, v]) => {
          const cls = v > 0 ? "codex-badge-positive" : v < 0 ? "codex-badge-negative" : "codex-badge-neutral";
          const abbr = TRAIT_STAT_ABBR[k] ?? k.replace(/_/g, " ").slice(0, 3).toUpperCase();
          return `<span class="codex-stat-badge ${cls}">${abbr} ${v > 0 ? "+" : ""}${v}</span>`;
        })
        .join("");
      return `
        <div class="codex-trait-card">
          <h5 class="codex-trait-name">${name.replace(/_/g, " ").toUpperCase()}</h5>
          <div class="codex-trait-badges">${badges}</div>
          <p class="codex-trait-desc">${desc}</p>
          <p class="codex-trait-flavor">${flavor}</p>
        </div>`;
    })
    .join("");
}

/** Game Codex popup template with Stats, Traits, Effects tabs. */
export function codexPopupTemplate(): string {
  const statsRows = STAT_HELP_ITEMS.map((s) => {
    const baseBadge = s.isBaseStat ? '<span class="codex-stat-base-badge">base</span>' : "";
    return `<div class="codex-stat-item"><div class="codex-stat-header">${s.abbr} (${s.stat})${baseBadge}</div><div class="codex-stat-desc">${s.desc}</div></div>`;
  }).join("");
  const combatStats = [
    { abbr: "HIT", desc: "12 DEX or 18 AWR per 1%", badges: [{ cls: "codex-badge-cap", text: "cap 98%" }] },
    { abbr: "AVD", desc: "16 AWR or 20 DEX per 1%", badges: [{ cls: "codex-badge-cap", text: "cap 30%" }] },
    { abbr: "MIT", desc: "TGH ÷ 9 ÷ 100", badges: [{ cls: "codex-badge-cap", text: "cap 60%" }, { cls: "codex-badge-neutral", text: "stun halves" }] },
    { abbr: "SPD", desc: "Spd 1 ≈ 5.5s", badges: [{ cls: "codex-badge-neutral", text: "Spd 10 ≈ 1s" }], extra: "DEX up to 20% faster at 300" },
    {
      abbr: "MOR",
      desc: "Panic/Suppression: 1% per 10 MOR",
      badges: [{ cls: "codex-badge-cap", text: "cap 80%" }, { cls: "codex-badge-neutral", text: "0.1s precision" }],
    },
  ];
  const combatEffects = [
    {
      name: "Incapacitation",
      desc: "At 0 HP, soldiers have a 20% base + 1% per level chance to be incapacitated instead of KIA. Relentless trait increases that by 60%.",
      badges: [{ cls: "codex-badge-positive", text: "survival" }],
    },
    { name: "Stun", desc: "Cannot act.", badges: [{ cls: "codex-badge-negative", text: "MIT halved" }] },
    { name: "Panic", desc: "50% slower.", badges: [], remediedBy: "MOR" },
    { name: "Suppressed", desc: "Cannot attack.", badges: [{ cls: "codex-badge-neutral", text: "+10% AVD" }], remediedBy: "MOR" },
    { name: "Burning", desc: "Damage over time.", badges: [{ cls: "codex-badge-negative", text: "DoT" }] },
    { name: "Smoked", desc: "Direct hit -40% HIT, adjacent -10%. +5% AVD.", badges: [{ cls: "codex-badge-negative", text: "–40% HIT" }, { cls: "codex-badge-positive", text: "+5% AVD" }] },
    { name: "Blinded", desc: "50% HIT reduction.", badges: [{ cls: "codex-badge-negative", text: "–50% HIT" }] },
  ];
  const combatStatCards = combatStats
    .map(
      (s) =>
        `<div class="codex-combat-card"><div class="codex-combat-header"><span class="codex-combat-abbr">${s.abbr}</span>${s.badges.map((b) => `<span class="codex-stat-badge ${b.cls}">${b.text}</span>`).join("")}</div><div class="codex-combat-desc">${s.desc}</div>${s.extra ? `<div class="codex-combat-extra">${s.extra}</div>` : ""}</div>`,
    )
    .join("");
  const combatEffectCards = combatEffects
    .map((e) => {
      const remedied =
        "remediedBy" in e && e.remediedBy
          ? `<div class="codex-combat-remedied">Shortened by <span class="codex-stat-badge codex-badge-positive">${e.remediedBy}</span></div>`
          : "";
      return `<div class="codex-combat-card codex-combat-effect"><div class="codex-combat-header"><span class="codex-combat-name">${e.name}</span>${(e.badges ?? []).map((b) => `<span class="codex-stat-badge ${b.cls}">${b.text}</span>`).join("")}</div><div class="codex-combat-desc">${e.desc}</div>${remedied}</div>`;
    })
    .join("");
  const combatSection = `
<section class="codex-section codex-section-combat">
  <h5 class="codex-section-title">Combat</h5>
  <p class="codex-section-intro">Turn-based. Attack speed from weapon + DEX.</p>
  <div class="codex-section-mechanics">
    <span class="codex-stat-badge codex-badge-positive">Take Cover 3s</span>
    <span class="codex-stat-badge codex-badge-neutral">grenades area</span>
    <span class="codex-stat-badge codex-badge-positive">medics heal</span>
    <span class="codex-stat-badge codex-badge-positive">stim +50% SPD 10s</span>
  </div>
  <div class="codex-combat-stats-grid">${combatStatCards}</div>
  <h5 class="codex-section-title codex-section-subtitle">Status Effects</h5>
  <div class="codex-combat-effects-grid">${combatEffectCards}</div>
</section>`;
  const effectsRows = [
    { name: "Stun", desc: "Cannot act. Toughness mitigation reduced by 50%." },
    { name: "Panic", desc: "Attack speed slowed by 50%. Duration reduced by 1% per 10 morale (rounded up, cap 80%)." },
    { name: "Smoked", desc: "Reduces chance to hit and be hit." },
    { name: "Burning", desc: "Damage over time. Incendiary grenades apply this effect." },
    { name: "Blinded", desc: "Chance to hit reduced by 50%." },
    { name: "Suppressed", desc: "+10% avoidance but cannot attack. Duration reduced by 1% per 10 morale (rounded up, cap 80%)." },
  ]
    .map((e) => `<div class="codex-stat-item"><div class="codex-stat-header">${e.name}</div><div class="codex-stat-desc">${e.desc}</div></div>`)
    .join("");
  return `
  <div id="codex-popup" class="codex-popup" role="dialog" aria-modal="true" hidden>
    <div class="codex-popup-inner codex-popup-tall">
      <div class="codex-popup-header popup-dialog-header">
        <h4 class="codex-popup-title">Game Codex</h4>
        <button type="button" class="game-btn game-btn-md game-btn-red codex-popup-close popup-close-btn" id="codex-popup-close" aria-label="Close">Close</button>
      </div>
      <div class="codex-tabs">
        <button type="button" class="codex-tab active" data-tab="stats">Stats</button>
        <button type="button" class="codex-tab" data-tab="traits">Traits</button>
        <button type="button" class="codex-tab" data-tab="effects">Effects</button>
        <button type="button" class="codex-tab" data-tab="levels">Levels</button>
      </div>
      <div class="codex-tab-panels">
        <div class="codex-tab-panel active" data-panel="stats"><div class="codex-stats-content"><section class="codex-section"><h5 class="codex-section-title">Base Stats</h5><div class="codex-stat-table">${statsRows}</div></section>${combatSection}</div></div>
        <div class="codex-tab-panel" data-panel="traits"><p class="codex-traits-intro">Traits add a little flavor to your soldiers—each modifies base stats as shown below.</p><div class="codex-traits-grid">${codexTraitsHTML()}</div></div>
        <div class="codex-tab-panel" data-panel="effects"><div class="codex-effects-content"><section class="codex-section"><h5 class="codex-section-title">Status Effects</h5><div class="codex-stat-table">${effectsRows}</div></section></div></div>
        <div class="codex-tab-panel" data-panel="levels"><div class="codex-levels-content"><section class="codex-section"><h5 class="codex-section-title">Slot Unlocks</h5><p class="codex-levels-intro">Company level increases squad roster capacity and active deployment slots.</p><div class="codex-slot-table"><div class="codex-slot-row codex-slot-row-head"><span class="codex-slot-lv">Level</span><span class="codex-slot-value">Roster</span><span class="codex-slot-value">Active</span><span class="codex-slot-value">Rifle</span><span class="codex-slot-value">Gunner</span><span class="codex-slot-value">Medic</span></div>${codexSlotsHTML()}</div></section><section class="codex-section"><h5 class="codex-section-title">Level Benefits</h5><p class="codex-levels-intro">Soldiers can level up to Lv 999. Most base stat growth happens through Lv20, then progression continues mainly through HP gains, gear scaling, traits, and abilities.</p><div class="codex-level-rows">${codexLevelsHTML()}</div></section></div></div>
      </div>
    </div>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Memorial popup for fallen soldiers (name, level, mission, enemies killed). */
export function memorialPopupTemplate(): string {
  const store = usePlayerCompanyStore.getState();
  const fallen = (store.memorialFallen ?? []) as MemorialEntry[];
  const menLost = store.totalMenLostAllTime ?? 0;
  const fallenList =
    fallen.length === 0
      ? '<p class="memorial-note">No recorded casualties yet.</p>'
      : fallen
          .map(
            (e) => {
              const role = e.role ? escapeHtml(e.role) : "";
              const roleBadge = role ? `<span class="memorial-badge memorial-badge-role">${role}</span>` : "";
              const killedBy = e.killedBy ? `<div class="memorial-fallen-killedby-row"><span class="memorial-fallen-killedby">Killed by ${escapeHtml(e.killedBy)}</span></div>` : "";
              const missionsCompleted = Math.max(0, Math.floor(e.missionsCompleted ?? 0));
              const totalKills = Math.max(0, Math.floor(e.totalKills ?? e.enemiesKilled ?? 0));
              const missionKills = Math.max(0, Math.floor(e.missionKills ?? e.enemiesKilled ?? 0));
              return `
<div class="memorial-fallen-row">
  <div class="memorial-fallen-top">
    <span class="memorial-fallen-name">${escapeHtml(e.name)}</span>
    <span class="memorial-fallen-badges">
      <span class="memorial-badge memorial-badge-level">Lv ${e.level}</span>
      ${roleBadge}
    </span>
  </div>
  <div class="memorial-fallen-meta">
    <span class="memorial-fallen-mission">${escapeHtml(e.missionName)}</span>
    <span class="memorial-fallen-kills">Mission Kills ${missionKills}</span>
  </div>
  <div class="memorial-fallen-career">
    <span class="memorial-fallen-career-item">Missions Completed ${missionsCompleted}</span>
    <span class="memorial-fallen-career-item">Total Kills ${totalKills}</span>
  </div>
  ${killedBy}
</div>`;
            },
          )
          .join("");
  return `
  <div id="memorial-popup" class="codex-popup memorial-popup" role="dialog" aria-modal="true" hidden>
    <div class="codex-popup-inner memorial-popup-inner">
      <div class="codex-popup-header popup-dialog-header">
        <h4 class="codex-popup-title">Memorial Wall</h4>
        <button type="button" class="game-btn game-btn-md game-btn-red codex-popup-close popup-close-btn" id="memorial-popup-close" aria-label="Close">Close</button>
      </div>
      <p class="memorial-count">Total lost in combat: <strong>${menLost}</strong></p>
      <div class="memorial-fallen-list">${fallenList}</div>
    </div>
  </div>`;
}

/** Settings popup with destructive reset action. */
export function settingsPopupTemplate(): string {
  return `
  <div id="settings-popup" class="codex-popup settings-popup" role="dialog" aria-modal="true" hidden>
    <div class="codex-popup-inner settings-popup-inner">
      <div class="codex-popup-header popup-dialog-header">
        <h4 class="codex-popup-title">Settings</h4>
        <button type="button" class="game-btn game-btn-md game-btn-red codex-popup-close popup-close-btn" id="settings-popup-close" aria-label="Close">Close</button>
      </div>
      <div class="settings-popup-body">
        <section class="settings-panel settings-panel-identity">
          <div class="settings-panel-head">
            <h5 class="settings-panel-title">Identity</h5>
            <p class="settings-panel-copy">Update your squad/company name.</p>
          </div>
          <div class="settings-input-group">
            <label class="settings-input-label" for="settings-squad-name-input">Squad Name</label>
            <input
              id="settings-squad-name-input"
              class="settings-text-input"
              type="text"
              maxlength="15"
              minlength="5"
              placeholder="5-15 characters"
              autocomplete="off"
              spellcheck="false"
            >
          </div>
          <div class="settings-identity-actions">
            <button type="button" id="settings-squad-name-save" class="game-btn game-btn-md game-btn-blue settings-name-save-btn">Save Name</button>
          </div>
          <p id="settings-squad-name-status" class="settings-input-status" aria-live="polite"></p>
        </section>
        <section class="settings-panel settings-panel-audio">
          <div class="settings-panel-head">
            <h5 class="settings-panel-title">Audio</h5>
            <p class="settings-panel-copy">Set music and sound effects independently.</p>
          </div>
          <label class="settings-toggle-row settings-sound-switch" for="settings-music-toggle">
            <span class="settings-toggle-label">Music</span>
            <input id="settings-music-toggle" class="settings-sound-toggle" type="checkbox" checked>
            <span class="settings-sound-track" aria-hidden="true">
              <span class="settings-sound-thumb"></span>
            </span>
          </label>
          <label class="settings-toggle-row settings-sound-switch" for="settings-sfx-toggle">
            <span class="settings-toggle-label">SFX</span>
            <input id="settings-sfx-toggle" class="settings-sound-toggle" type="checkbox" checked>
            <span class="settings-sound-track" aria-hidden="true">
              <span class="settings-sound-thumb"></span>
            </span>
          </label>
        </section>
        <section class="settings-panel settings-panel-danger">
          <div class="settings-panel-head">
            <h5 class="settings-panel-title">Danger Zone</h5>
            <p class="settings-panel-copy">Resetting erases your company, soldiers, armory, missions, and all progress.</p>
          </div>
          <div class="settings-danger-actions">
            <button type="button" id="settings-reset-game-btn" class="game-btn game-btn-md game-btn-red settings-reset-btn">Reset Game</button>
          </div>
        </section>
      </div>
    </div>
  </div>`;
}

/** Reset confirmation dialog. */
export function settingsResetConfirmPopupTemplate(): string {
  return `
  <div id="settings-reset-confirm-popup" class="codex-popup settings-reset-confirm-popup" role="dialog" aria-modal="true" hidden>
    <div class="codex-popup-inner settings-reset-confirm-inner">
      <div class="codex-popup-header popup-dialog-header">
        <h4 class="codex-popup-title">Confirm Reset</h4>
      </div>
      <div class="settings-reset-confirm-body">
        <p class="settings-reset-confirm-copy">Are you sure? All saved game data will be erased and the game will restart from the beginning.</p>
        <div class="settings-reset-confirm-actions">
          <button type="button" id="settings-reset-confirm-no" class="game-btn game-btn-md game-btn-blue">Cancel</button>
          <button type="button" id="settings-reset-confirm-yes" class="game-btn game-btn-md game-btn-red">Yes, Reset</button>
        </div>
      </div>
    </div>
  </div>`;
}

export const gameSetupTemplate = `<div class="setup-game-wrapper">
                    <div class="setup-game-content">
                        <h3 class="setup-title">Create Your Company</h3>
                        <div class="setup-input-wrapper">
                            <label for="commander-name">Your Name</label>
                            <input id="commander-name" type="text" placeholder="Your Name" data-min="3">
                            <p class="helper-text">3 - 15 characters.</p>
                        </div>
                        <div class="setup-input-wrapper">
                            <label for="company-name">Company Name</label>
                            <input id="company-name" type="text" placeholder="e.g. The Tiger Hawks" data-min="5">
                            <p class="helper-text">5 - 15 characters.</p>
                        </div>
                        <div class="setup-patch-section">
                            <h3 class="setup-patch-title">Choose Your Unit Patch</h3>
                            <div class="setup-patch-grid">
                                <img class="setup-patch-img" src="/images/unit-patches/patch_1.png" data-img="patch_1.png" alt="Unit Patch">
                                <img class="setup-patch-img" src="/images/unit-patches/patch_2.png" data-img="patch_2.png" alt="Unit Patch">
                                <img class="setup-patch-img" src="/images/unit-patches/patch_3.png" data-img="patch_3.png" alt="Unit Patch">
                                <img class="setup-patch-img" src="/images/unit-patches/patch_4.png" data-img="patch_4.png" alt="Unit Patch">
                                <img class="setup-patch-img" src="/images/unit-patches/patch_5.png" data-img="patch_5.png" alt="Unit Patch">
                                <img class="setup-patch-img" src="/images/unit-patches/patch_6.png" data-img="patch_6.png" alt="Unit Patch">
                                <img class="setup-patch-img" src="/images/unit-patches/patch_7.png" data-img="patch_7.png" alt="Unit Patch">
                                <img class="setup-patch-img" src="/images/unit-patches/patch_8.png" data-img="patch_8.png" alt="Unit Patch">
                            </div>
                        </div>
                    </div>
                    <div class="setup-footer">
                        <button id="cancel-game-setup" class="game-btn game-btn-md game-btn-red">&#10005; Cancel</button>
                        <button id="finish-game-setup" class="game-btn game-btn-md game-btn-green disabled" disabled>Next &#10140;</button>
                    </div>
                </div>`;

const LEADERSHIP_QUOTES: { quote: string; author: string }[] = [
	{ quote: "Leadership is the art of getting someone else to do something you want done because he wants to do it.", author: "Dwight D. Eisenhower" },
	{ quote: "The supreme quality of leadership is integrity.", author: "Dwight D. Eisenhower" },
	{ quote: "Plans are nothing; planning is everything.", author: "Dwight D. Eisenhower" },
	{ quote: "Accept the challenges so that you can feel the exhilaration of victory.", author: "George S. Patton" },
	{ quote: "Lead me, follow me, or get out of my way.", author: "George S. Patton" },
	{ quote: "A pint of sweat saves a gallon of blood.", author: "George S. Patton" },
	{ quote: "No man is entitled to the blessings of freedom unless he be vigilant in its preservation.", author: "Douglas MacArthur" },
	{ quote: "The soldier above all others prays for peace, for it is the soldier who must suffer and bear the deepest wounds and scars of war.", author: "Douglas MacArthur" },
	{ quote: "In war there is no substitute for victory.", author: "Douglas MacArthur" },
	{ quote: "We shall fight on the beaches, we shall fight on the landing grounds. We shall never surrender.", author: "Winston Churchill" },
	{ quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
	{ quote: "The best executive is the one who has sense enough to pick good men to do what he wants done.", author: "Theodore Roosevelt" },
	{ quote: "The art of war is simple enough. Find out where your enemy is. Get at him as soon as you can. Strike him as hard as you can.", author: "Ulysses S. Grant" },
	{ quote: "In the midst of chaos, there is also opportunity.", author: "Sun Tzu" },
	{ quote: "Victory belongs to the most persevering.", author: "Napoleon Bonaparte" },
	{ quote: "If everyone is thinking alike, then somebody isn't thinking.", author: "George S. Patton" },
	{ quote: "Courage is fear holding on a minute longer.", author: "George S. Patton" },
	{ quote: "Duty, Honor, Country. Those three hallowed words reverently dictate what you ought to be.", author: "Douglas MacArthur" },
	{ quote: "I came, I saw, I conquered.", author: "Julius Caesar" },
	{ quote: "In war, events of importance are the result of trivial causes.", author: "Julius Caesar" },
	{ quote: "Experience is the teacher of all things.", author: "Julius Caesar" },
	{ quote: "Let him who desires peace prepare for war.", author: "Vegetius" },
	{ quote: "It is the nature of war that what is beneficial to you is detrimental to the enemy.", author: "Vegetius" },
	{ quote: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" },
	{ quote: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
	{ quote: "They make a desert and call it peace.", author: "Tacitus" },
	{ quote: "The sinews of war are infinite money.", author: "Cicero" },
	{ quote: "Few men have the virtue to withstand the highest bidder.", author: "Sallust" },
	{ quote: "A city's best defense is the courage of its citizens.", author: "Lycurgus" },
	{ quote: "The walls of Sparta are its young men, and their borders the points of their spears.", author: "Lycurgus" },
];

function pickRandomQuote(): { quote: string; author: string } {
	return LEADERSHIP_QUOTES[Math.floor(Math.random() * LEADERSHIP_QUOTES.length)];
}

export const setupConfirmationTemplate = (
  name: string,
  companyName: string,
  unitPatch: string,
) => {
	const { quote, author } = pickRandomQuote();
	return `
<div id="setup-confirmation" class="confirm-screen-root flex column align-center">
	<h1>CONFIRM SELECTION</h1>
	<p class="confirm-screen-intro">${name} commanding ${companyName}</p>
	<div class="confirm-screen-quote">
		<blockquote>"${quote}"</blockquote>
		<p class="helper-text">${author}</p>
	</div>
	<img width="120" class="confirm-screen-patch" src="images/unit-patches/${unitPatch}" alt="Company Patch">
	<div class="confirm-screen-buttons">
		<button id="go-back" class="game-btn game-btn-md game-btn-red">Go Back</button>
		<button id="launch-game" class="game-btn game-btn-md game-btn-green">Begin</button>
	</div>
</div>
`;
};

export const mainMenuTemplate = () => {
  return `
		<div id="g-menu-wrapper" class="flex align-center column justify-center h-100">
				<img width="170" src="/images/ft_logo_main.png" alt="Game Logo">
				<button id="${clrHash(DOM.mainMenu.newGame)}" class="game-btn game-btn-lg game-btn-green menu-btn">New Game</button>
				<button id="${clrHash(DOM.mainMenu.credits)}" class="game-btn game-btn-lg game-btn-black menu-btn">Credits</button>
				<button id="${clrHash(DOM.mainMenu.settings)}" class="game-btn game-btn-lg game-btn-blue menu-btn">Settings</button>
		</div>
	`;
};

export const companyHeaderPartial = (title = "") => {
  const store = usePlayerCompanyStore.getState();
  const { companyUnitPatchURL, companyName, commanderName } = store;
  const titleHtml = title ? `<h3 class="company-header-title">${title}</h3>` : "";

  return `
<div id="company-meta" class="company-header">
  <div class="company-header-inner">
    <div class="company-header-patch">
      <img src="/images/unit-patches/${companyUnitPatchURL}" alt="Company patch" width="44" height="44"/>
    </div>
    ${titleHtml}
    <div class="company-header-info">
      <span class="company-header-name">${companyName}</span>
      <span class="company-header-commander">${commanderName}</span>
      <span class="company-header-version" aria-hidden="true">v${APP_VERSION}</span>
    </div>
  </div>
</div>
  `;
};

/** Sleek credits display for market screens */
export const marketCreditsPartial = (creditBalance: number) => {
  const formatted = creditBalance.toLocaleString();
  return `
  <div class="market-credits-display">
    <span class="market-credits-amount"><span class="market-credits-symbol">${CREDIT_SYMBOL}</span><span class="market-credits-value">${formatted}</span></span>
  </div>`;
};

export const companyActionsTemplate = () => {
  const store = usePlayerCompanyStore.getState();
  const marketLocked = !!store.onboardingFirstMissionPending;
  const actions = [
    ["company-go-home", "Home", Images.btn.sq_home, "company-action-home"],
    ["company-go-missions", "Missions", Images.btn.sq_mission, "company-action-missions"],
    ["company-go-roster", "Roster", Images.btn.sq_list_1, "company-action-roster"],
    ["company-go-inventory", "Armory", Images.btn.sq_inventory, "company-action-armory"],
    ["company-go-market", "Market", Images.btn.sq_market, "company-action-market"],
    // ["company-go-memorial", "Memorial Wall", Images.btn.sq_heroes],
    ["company-go-abilities", "Tactics", "list_2_button.png", "company-action-tactics"],
  ];
  return `
  <div class="company-actions grid grid-6-col">
      ${actions
        .map(
          ([id, label, img, styleClass]) => `
        <div class="company-action-item">
          <button id="${id}" class="mbtn icon-btn company-action-btn ${styleClass}${id === "company-go-market" && marketLocked ? " company-action-btn-locked" : ""}" data-tooltip="${label}" ${id === "company-go-market" && marketLocked ? "disabled aria-disabled=\"true\" title=\"Complete your first mission to unlock Market\"" : ""}>
            <img class="grid-img-fit" src="/images/ui/square/${img}" alt="${label}" />
          </button>
          <span class="company-action-label">${label}</span>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
};

export const companyHomePageTemplate = () => {
  const store = usePlayerCompanyStore.getState();
  const {
    totalMenInCompany: storeMen,
    totalMissionsFailed,
    totalMissionsCompleted,
    totalItemsInInventory: storeItems,
    totalMenLostAllTime,
    totalEnemiesKilledAllTime,
    careerCurrentLevel,
    totalCareerMissionsCompleted,
    companyLevel,
    companyExperience,
    creditBalance,
    company,
  } = store;
  const totalMenInCompany = company?.soldiers?.length ?? storeMen ?? 0;
  const companyLvl = company?.level ?? companyLevel ?? 1;
  const companyExpTotal = company?.experience ?? companyExperience ?? 0;
  const totalInventoryCapacity = getTotalArmorySlots(companyLvl);
  const totalItemsInInventory = company?.inventory?.length ?? storeItems ?? 0;
  const levelSnap = getCompanyLevelSnapshot(companyLvl);

  const xpFloor = getXpRequiredForLevel(companyLvl);
  const xpCeiling = getXpRequiredForLevel(companyLvl + 1);
  const xpInLevel = Math.max(1, xpCeiling - xpFloor);
  const progressInLevel = Math.max(0, companyExpTotal - xpFloor);
  const xpFillPct =
    companyLvl >= MAX_COMPANY_LEVEL
      ? 100
      : Math.max(0, Math.min(100, (progressInLevel / xpInLevel) * 100));
  const nextLevel = Math.min(MAX_COMPANY_LEVEL, companyLvl + 1);
  const playerName = (store.commanderName ?? company?.commander ?? "").trim() || "Commander";

  const memorialCodexRow = `
    <div class="company-home-buttons-row">
      <button id="company-stats-memorial" class="game-btn game-btn-md game-btn-blue codex-memorial-btn">Memorial Wall</button>
      <button id="company-go-codex" class="game-btn game-btn-md game-btn-blue codex-memorial-btn">Game Codex</button>
    </div>
  `;

  const statRow = (label: string, value: string | number, type: "positive" | "neutral" | "accent" = "neutral") =>
    `<div class="company-stat-row"><span class="company-stat-label">${label}</span><span class="company-stat-value company-stat-${type}">${value}</span></div>`;

  const totalMissions = (totalMissionsCompleted ?? 0) + (totalMissionsFailed ?? 0);
  const winRatePct = totalMissions > 0 ? Math.round(((totalMissionsCompleted ?? 0) / totalMissions) * 100) : 0;
  const enemiesKilled = totalEnemiesKilledAllTime ?? 0;
  const killLossRatio = totalMenLostAllTime > 0
    ? (enemiesKilled / totalMenLostAllTime).toFixed(2)
    : `${enemiesKilled > 0 ? enemiesKilled : 0}.00`;

  const heroSubtitle = totalMissions > 0
    ? `${totalMissions.toLocaleString()} operations logged`
    : "Build your company and start your first operation";
  const heroBlock = `
    <section class="company-home-hero">
      <div class="company-home-hero-top">
        <div class="company-home-hero-head">
          <div class="company-home-hero-head-copy">
            <h2 class="company-home-hero-title">Command Center</h2>
            <span class="company-home-hero-subtitle">${heroSubtitle}</span>
          </div>
          <button id="company-go-settings" class="game-btn game-btn-md game-btn-blue codex-memorial-btn company-home-settings-btn" aria-label="Settings"><span class="company-home-settings-gear" aria-hidden="true">⚙︎</span> Settings</button>
        </div>
      </div>
      <div class="company-home-kpi-strip">
        <div class="company-home-kpi">
          <span class="company-home-kpi-label">Enemies Killed</span>
          <span class="company-home-kpi-value positive">${enemiesKilled.toLocaleString()}</span>
        </div>
        <div class="company-home-kpi">
          <span class="company-home-kpi-label">Win Rate</span>
          <span class="company-home-kpi-value accent">${winRatePct}%</span>
        </div>
        <div class="company-home-kpi">
          <span class="company-home-kpi-label">Credits</span>
          <span class="company-home-kpi-value accent">$${creditBalance.toLocaleString()}</span>
        </div>
      </div>
    </section>
  `;

  const statsBlockExciting = `
    ${heroBlock}
    <section class="company-home-card">
      <h3 class="company-home-card-title">Operational Snapshot</h3>
      ${totalMenInCompany === 0 ? '<p class="company-home-empty-hint">No active soldiers in company. Recruit to begin operations.</p>' : ""}
      <div class="company-stats-grid">
        ${statRow("Total Men", totalMenInCompany, "positive")}
        ${statRow("Armory", `${totalItemsInInventory} / ${totalInventoryCapacity}`, "neutral")}
        ${statRow("Missions Done", totalMissionsCompleted, "positive")}
        ${statRow("Missions Failed", totalMissionsFailed, "neutral")}
        ${statRow("Career Lv", careerCurrentLevel ?? 1, "accent")}
        ${statRow("Career Wins", totalCareerMissionsCompleted ?? 0, "positive")}
        ${statRow("Men Lost", totalMenLostAllTime, "neutral")}
        ${statRow("K/L Ratio", killLossRatio, "positive")}
      </div>
    </section>
    <section class="company-home-card">
      <h3 class="company-home-card-title">Progression</h3>
      <div class="company-stats-grid">
        ${statRow("Roster Capacity", `${levelSnap.current.roster.total}`, "neutral")}
        ${statRow("Active Slots", `${levelSnap.current.roster.active}`, "neutral")}
        ${statRow("Armory W/A/S", `${levelSnap.current.armory.weapon}/${levelSnap.current.armory.armor}/${levelSnap.current.armory.equipment}`, "neutral")}
        ${statRow("Medic/Gunner Caps", `${levelSnap.current.roleCaps.active.medic}/${levelSnap.current.roleCaps.active.support}`, "neutral")}
      </div>
    </section>
  `;

  const emptyRecruitRow = totalMenInCompany === 0
    ? `
    <div class="flex align-center justify-center w-100 company-home-recruit-cta">
      <button id="go-to-troops-screen" class="game-btn game-btn-lg company-home-recruit-btn company-home-recruit-btn-attn">Recruit Soldiers</button>
    </div>
  `
    : "";

  const onboardingSoldiers = company?.soldiers ?? [];
  const onboardingFeatured = onboardingSoldiers.length > 0
    ? onboardingSoldiers[Math.floor(Math.random() * onboardingSoldiers.length)]
    : null;
  const onboardingPortrait = onboardingFeatured
    ? getSoldierPortraitUrl(onboardingFeatured.avatar, onboardingFeatured.designation)
    : "/images/green-portrait/portrait_0.png";
  const onboardingPopup = store.onboardingHomeIntroPending
    ? `
    <div id="home-onboarding-popup" class="home-onboarding-popup helper-onboarding-popup" role="dialog" aria-modal="true">
      <div class="home-onboarding-dialog helper-onboarding-dialog">
        <div class="home-onboarding-copy helper-onboarding-copy">
          <h4 class="home-onboarding-title helper-onboarding-title">Welcome, ${playerName}</h4>
          <p class="home-onboarding-text helper-onboarding-text helper-onboarding-typed-text" id="home-onboarding-typed-text" data-full-text="Your squad is assembled and awaiting orders. Start by opening Missions to launch your first operation."></p>
          <button id="home-onboarding-continue" type="button" class="game-btn game-btn-md game-btn-green home-onboarding-continue helper-onboarding-continue">Continue</button>
        </div>
        <div class="home-onboarding-image-wrap helper-onboarding-image-wrap">
          <img src="${onboardingPortrait}" alt="Squad soldier" class="home-onboarding-image helper-onboarding-image">
        </div>
      </div>
    </div>
  `
    : "";
  const recruitOnboardingPopup = store.onboardingRecruitStep === "home_popup"
    ? `
    <div id="home-recruit-onboarding-popup" class="home-onboarding-popup helper-onboarding-popup" role="dialog" aria-modal="true">
      <div class="home-onboarding-dialog helper-onboarding-dialog">
        <div class="home-onboarding-copy helper-onboarding-copy">
          <h4 class="home-onboarding-title helper-onboarding-title">Nice Work, Commander</h4>
          <p class="home-onboarding-text helper-onboarding-text helper-onboarding-typed-text" id="home-recruit-onboarding-typed-text" data-full-text="That went swell, but we need more firepower. Let's recruit a gunner."></p>
          <button id="home-recruit-onboarding-continue" type="button" class="game-btn game-btn-md game-btn-green home-onboarding-continue helper-onboarding-continue">Continue</button>
        </div>
        <div class="home-onboarding-image-wrap helper-onboarding-image-wrap">
          <img src="${onboardingPortrait}" alt="Squad soldier" class="home-onboarding-image helper-onboarding-image">
        </div>
      </div>
    </div>
  `
    : "";
  const medicOnboardingPopup = store.onboardingMedicRecruitNoticePending
    ? `
    <div id="home-medic-onboarding-popup" class="home-onboarding-popup helper-onboarding-popup" role="dialog" aria-modal="true">
      <div class="home-onboarding-dialog helper-onboarding-dialog">
        <div class="home-onboarding-copy helper-onboarding-copy">
          <h4 class="home-onboarding-title helper-onboarding-title">New Recruits Available</h4>
          <p class="home-onboarding-text helper-onboarding-text helper-onboarding-typed-text" id="home-medic-onboarding-typed-text" data-full-text="Command update: Medics are now available in the Troops market. Recruit one to add battlefield healing to your squad."></p>
          <button id="home-medic-onboarding-continue" type="button" class="game-btn game-btn-md game-btn-green home-onboarding-continue helper-onboarding-continue">Continue</button>
        </div>
        <div class="home-onboarding-image-wrap helper-onboarding-image-wrap">
          <img src="${onboardingPortrait}" alt="Squad soldier" class="home-onboarding-image helper-onboarding-image">
        </div>
      </div>
    </div>
  `
    : "";
  const suppliesIntroPopup = store.onboardingSuppliesStep === "market_popup"
    ? `
    <div id="home-supplies-onboarding-popup" class="home-onboarding-popup helper-onboarding-popup" role="dialog" aria-modal="true">
      <div class="home-onboarding-dialog helper-onboarding-dialog">
        <div class="home-onboarding-copy helper-onboarding-copy">
          <h4 class="home-onboarding-title helper-onboarding-title">Resupply Needed</h4>
          <p class="home-onboarding-text helper-onboarding-text helper-onboarding-typed-text" id="home-supplies-onboarding-typed-text" data-full-text="Commander, it looks like you need supplies. Head to the Market to replenish your armaments."></p>
          <button id="home-supplies-onboarding-continue" type="button" class="game-btn game-btn-md game-btn-green home-onboarding-continue helper-onboarding-continue">Continue</button>
        </div>
        <div class="home-onboarding-image-wrap helper-onboarding-image-wrap">
          <img src="${onboardingPortrait}" alt="Squad soldier" class="home-onboarding-image helper-onboarding-image">
        </div>
      </div>
    </div>
  `
    : "";
  const companyAbilityPopup = (store.companyAbilityNotificationText ?? "").trim()
    ? `
    <div id="home-company-ability-popup" class="home-onboarding-popup helper-onboarding-popup" role="dialog" aria-modal="true">
      <div class="home-onboarding-dialog helper-onboarding-dialog">
        <div class="home-onboarding-copy helper-onboarding-copy">
          <h4 class="home-onboarding-title helper-onboarding-title">New Company Capability</h4>
          <p class="home-onboarding-text helper-onboarding-text helper-onboarding-typed-text" id="home-company-ability-typed-text" data-full-text="${(store.companyAbilityNotificationText ?? "").replace(/\"/g, "&quot;")}"></p>
          <button id="home-company-ability-continue" type="button" class="game-btn game-btn-md game-btn-green home-onboarding-continue helper-onboarding-continue">Continue</button>
        </div>
        <div class="home-onboarding-image-wrap helper-onboarding-image-wrap">
          <img src="${onboardingPortrait}" alt="Squad soldier" class="home-onboarding-image helper-onboarding-image">
        </div>
      </div>
    </div>
  `
    : "";
  const levelUpSummary = store.companyLevelUpSummary;
  const companyLevelUpPopup = levelUpSummary
    ? `
    <div id="home-company-levelup-popup" class="home-onboarding-popup helper-onboarding-popup" role="dialog" aria-modal="true">
      <div class="home-onboarding-dialog helper-onboarding-dialog">
        <div class="home-onboarding-copy helper-onboarding-copy">
          <h4 class="home-onboarding-title helper-onboarding-title">Company Level ${levelUpSummary.toLevel}</h4>
          <p class="home-onboarding-text helper-onboarding-text">Advanced from Lv ${levelUpSummary.fromLevel} to Lv ${levelUpSummary.toLevel}. Rerolls +${levelUpSummary.rerollsGained}.</p>
          <ul class="company-levelup-list">${(levelUpSummary.bullets ?? []).slice(0, 8).map((line) => `<li>${line}</li>`).join("")}</ul>
          <button id="home-company-levelup-continue" type="button" class="game-btn game-btn-md game-btn-green home-onboarding-continue helper-onboarding-continue">Continue</button>
        </div>
        <div class="home-onboarding-image-wrap helper-onboarding-image-wrap">
          <img src="${onboardingPortrait}" alt="Squad soldier" class="home-onboarding-image helper-onboarding-image">
        </div>
      </div>
    </div>
  `
    : "";

  return `
  <div id="campaign-home-screen" class="flex h-100 column">
    ${companyHeaderPartial()}

	    <div class="campaign-home-scroll">
	      <div class="company-home-stats-block">
	        ${statsBlockExciting}
	        ${memorialCodexRow}
          ${emptyRecruitRow}
	      </div>
    </div>

	    <div class="company-level-bar-wrapper">
	      <div class="company-xp-header">
	        <span class="company-level-badge${companyLvl === 2 ? " company-level-badge-lv2" : ""}">Lv ${companyLvl}</span>
	        ${companyLvl < MAX_COMPANY_LEVEL
	          ? `<span class="company-xp-text"><span class="company-xp-current">${Math.floor(progressInLevel).toLocaleString()}</span> / <span class="company-xp-required">${Math.floor(xpInLevel).toLocaleString()}</span> XP</span>`
	          : '<span class="company-xp-max">MAX LEVEL</span>'}
          ${companyLvl < MAX_COMPANY_LEVEL
            ? `<span class="company-level-badge company-level-badge-target${nextLevel === 2 ? " company-level-badge-lv2" : ""}">Lv ${nextLevel}</span>`
            : '<span class="company-xp-header-spacer" aria-hidden="true"></span>'}
	      </div>
      <div class="company-level-progress">
        <div class="company-xp-fill" style="width: ${xpFillPct}%"></div>
        ${companyLvl < MAX_COMPANY_LEVEL ? '<div class="company-xp-shine"></div>' : ""}
      </div>
    </div>

    ${companyActionsTemplate()}

    ${codexPopupTemplate()}
    ${memorialPopupTemplate()}
    ${settingsPopupTemplate()}
    ${settingsResetConfirmPopupTemplate()}
    ${onboardingPopup}
    ${recruitOnboardingPopup}
    ${medicOnboardingPopup}
    ${suppliesIntroPopup}
    ${companyAbilityPopup}
    ${companyLevelUpPopup}
  </div>
`;
};
