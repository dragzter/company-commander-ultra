import { DOM } from "../../constants/css-selectors.ts";
import { getTotalArmorySlots } from "../../constants/economy.ts";
import type { MemorialEntry } from "../entities/memorial-types.ts";
import { clrHash } from "../../utils/html-utils.ts";
import { Images } from "../../constants/images.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { TRAIT_CODEX } from "../../constants/trait-codex.ts";
import { TraitProfileStats } from "../entities/soldier/soldier-traits.ts";

const TRAIT_STAT_ABBR: Record<string, string> = {
  hit_points: "HP",
  dexterity: "DEX",
  morale: "MOR",
  toughness: "TGH",
  awareness: "AWR",
};

/** Stat explanations for the codex Stats tab. Abbreviations match display (HP, MIT, AVD, CTH, etc.). */
const STAT_HELP_ITEMS: { stat: string; abbr: string; desc: string; isBaseStat?: boolean }[] = [
  { stat: "Hit Points", abbr: "HP", desc: "Health. Damage capacity before incapacitation. Styled distinctly as a resource stat." },
  { stat: "Mitigation", abbr: "MIT", desc: "Damage reduction. Lowers incoming damage. Capped at 60%. From TGH and armor." },
  { stat: "Avoidance", abbr: "AVD", desc: "Chance to evade or dodge incoming attacks. Capped at 30%. 16 AWR or 20 DEX per 1%.", isBaseStat: false },
  { stat: "Chance to Hit", abbr: "CTH", desc: "Accuracy. Likelihood your attacks land. Capped at 98%. 12 DEX or 18 AWR per 1%.", isBaseStat: false },
  { stat: "Morale", abbr: "MOR", desc: "Resistance to suppression, psychic effects, and panic. Affects duration of mental debuffs.", isBaseStat: true },
  { stat: "Toughness", abbr: "TGH", desc: "Contributes to mitigation. Reduces damage taken. From level, traits, and armor.", isBaseStat: true },
  { stat: "Awareness", abbr: "AWR", desc: "Spotting and reflexes. Boosts hit chance and avoidance.", isBaseStat: true },
  { stat: "Dexterity", abbr: "DEX", desc: "Aiming and reflexes. Boosts hit chance and avoidance. Also increases attack speed.", isBaseStat: true },
  { stat: "Attack Speed", abbr: "SPD", desc: "Time between attacks in seconds. From weapon speed_base and dexterity." },
];

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
    { abbr: "CTH", desc: "12 DEX or 18 AWR per 1%", badges: [{ cls: "codex-badge-cap", text: "cap 98%" }] },
    { abbr: "AVD", desc: "16 AWR or 20 DEX per 1%", badges: [{ cls: "codex-badge-cap", text: "cap 30%" }] },
    { abbr: "MIT", desc: "TGH ÷ 9 ÷ 100", badges: [{ cls: "codex-badge-cap", text: "cap 60%" }, { cls: "codex-badge-neutral", text: "stun halves" }] },
    { abbr: "SPD", desc: "Spd 1 ≈ 5.5s", badges: [{ cls: "codex-badge-neutral", text: "Spd 10 ≈ 1s" }], extra: "DEX up to 20% faster at 500" },
    {
      abbr: "MOR",
      desc: "Panic/Suppression: 1% per 10 MOR",
      badges: [{ cls: "codex-badge-cap", text: "cap 80%" }, { cls: "codex-badge-neutral", text: "0.1s precision" }],
    },
  ];
  const combatEffects = [
    { name: "Stun", desc: "Cannot act.", badges: [{ cls: "codex-badge-negative", text: "MIT halved" }] },
    { name: "Panic", desc: "50% slower.", badges: [], remediedBy: "MOR" },
    { name: "Suppressed", desc: "Cannot attack.", badges: [{ cls: "codex-badge-neutral", text: "+10% AVD" }], remediedBy: "MOR" },
    { name: "Burning", desc: "Damage over time.", badges: [{ cls: "codex-badge-negative", text: "DoT" }] },
    { name: "Smoked", desc: "Direct hit -40% CTH, adjacent -10%. +5% AVD.", badges: [{ cls: "codex-badge-negative", text: "–40% CTH" }, { cls: "codex-badge-positive", text: "+5% AVD" }] },
    { name: "Blinded", desc: "50% CTH reduction.", badges: [{ cls: "codex-badge-negative", text: "–50% CTH" }] },
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
      <button type="button" class="popup-close-btn codex-popup-close" id="codex-popup-close" aria-label="Close">×</button>
      <h4 class="codex-popup-title">Game Codex</h4>
      <div class="codex-tabs">
        <button type="button" class="codex-tab active" data-tab="stats">Stats</button>
        <button type="button" class="codex-tab" data-tab="traits">Traits</button>
        <button type="button" class="codex-tab" data-tab="effects">Effects</button>
      </div>
      <div class="codex-tab-panels">
        <div class="codex-tab-panel active" data-panel="stats"><div class="codex-stats-content"><section class="codex-section"><h5 class="codex-section-title">Base Stats</h5><div class="codex-stat-table">${statsRows}</div></section>${combatSection}</div></div>
        <div class="codex-tab-panel" data-panel="traits"><p class="codex-traits-intro">Traits add a little flavor to your soldiers—each modifies base stats as shown below.</p><div class="codex-traits-grid">${codexTraitsHTML()}</div></div>
        <div class="codex-tab-panel" data-panel="effects"><div class="codex-effects-content"><section class="codex-section"><h5 class="codex-section-title">Status Effects</h5><div class="codex-stat-table">${effectsRows}</div></section></div></div>
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
            (e) =>
              `<div class="memorial-fallen-row"><span class="memorial-fallen-name">${escapeHtml(e.name)}</span><span class="memorial-fallen-meta">Lv${e.level} · ${escapeHtml(e.missionName)} · ${e.enemiesKilled} kills</span></div>`,
          )
          .join("");
  return `
  <div id="memorial-popup" class="codex-popup memorial-popup" role="dialog" aria-modal="true" hidden>
    <div class="codex-popup-inner">
      <button type="button" class="popup-close-btn codex-popup-close" id="memorial-popup-close" aria-label="Close">×</button>
      <h4 class="codex-popup-title">Memorial Wall</h4>
      <p class="memorial-count">Total lost in combat: <strong>${menLost}</strong></p>
      <div class="memorial-fallen-list">${fallenList}</div>
    </div>
  </div>`;
}

export const gameSetupTemplate = `<div class="setup-game-wrapper">
                    <div class="step flex column justify-between h-100">
                        <div class="step-content">
                            <h3 class="font-h2">Create Your Company</h3>

                            <div class="input-wrapper">
                                <label for="commander-name">Your Name</label>
                                <input id="commander-name" type="text" placeholder="Your Name" data-min="3">
                                <p class="helper-text">3 - 15 characters.</p>
                            </div>

                            <div class="input-wrapper">
                                <label for="company-name">Company Name</label>
                                <input id="company-name" type="text" placeholder="e.g. The Tiger Hawks" data-min="5">
                                <p class="helper-text">5 - 15 characters.</p>
                            </div>

                            <div class="setup-patch-section">
                                <h3>Choose Your Unit Patch</h3>
                                <div class="grid grid-4-col setup-patch-grid">
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

                        <div class="setup-footer flex justify-between">
                            <button id="cancel-game-setup" class="mbtn red">&#10005; Cancel</button>
                            <button id="finish-game-setup" class="mbtn green disabled" disabled>Next &#10140;</button>
                        </div>
                    </div>
                </div>`;

export const setupConfirmationTemplate = (
  name: string,
  companyName: string,
  unitPatch: string,
) => `
<div id="setup-confirmation" class="confirm-screen-root flex column align-center">
	<h1>CONFIRM SELECTION</h1>
	<p class="confirm-screen-intro">${name} commanding ${companyName}</p>
	<div class="confirm-screen-quote">
		<blockquote>"Leadership is the art of getting someone else to do something you want done because he wants to do it."</blockquote>
		<p class="helper-text">Dwight D. Eisenhower</p>
	</div>
	<img width="120" class="confirm-screen-patch" src="images/unit-patches/${unitPatch}" alt="Company Patch">
	<div class="confirm-screen-buttons">
		<button id="launch-game" class="green mbtn">Begin</button>
		<button id="go-back" class="red mbtn">Go Back</button>
	</div>
</div>
`;

export const mainMenuTemplate = () => {
  return `
		<div id="g-menu-wrapper" class="flex align-center column justify-center h-100">
				<img width="170" src="images/ui/${Images.logo.cc_logo}" alt="Game Logo">
				<button id="${clrHash(DOM.mainMenu.newGame)}" class="mbtn green mb-3">New Game</button>
<!--				<button id="${clrHash(DOM.mainMenu.continue)}" class="mbtn green
		// mb-3">Continue</button>-->
				<button id="${clrHash(DOM.mainMenu.credits)}" class="mbtn black mb-3">Credits</button>
				<button id="${clrHash(DOM.mainMenu.settings)}" class="mbtn blue mb-3">Settings</button>
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
    <span class="market-credits-label">Credits</span>
    <span class="market-credits-amount">$${formatted}</span>
  </div>`;
};

export const companyActionsTemplate = () => {
  const actions = [
    ["company-go-home", "Home", Images.btn.sq_home],
    ["company-go-market", "Market", Images.btn.sq_market],
    ["company-go-roster", "Roster", Images.btn.sq_list_1],
    // ["company-go-training", "Training", Images.btn.sq_training],
    ["company-go-missions", "Missions", Images.btn.sq_mission],
    ["company-go-inventory", "Armory", Images.btn.sq_inventory],
    // ["company-go-memorial", "Memorial Wall", Images.btn.sq_heroes],
    ["company-go-abilities", "Tactics", "list_2_button.png"],
  ];
  return `
  <div class="company-actions grid grid-6-col">
      ${actions
        .map(
          ([id, label, img]) => `
        <div class="company-action-item">
          <button id="${id}" class="mbtn icon-btn company-action-btn" data-tooltip="${label}">
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
    companyLevel,
    companyExperience,
    creditBalance,
    company,
  } = store;
  const totalMenInCompany = company?.soldiers?.length ?? storeMen ?? 0;
  const companyLvl = company?.level ?? companyLevel ?? 1;
  const totalInventoryCapacity = getTotalArmorySlots(companyLvl);
  const totalItemsInInventory = company?.inventory?.length ?? storeItems ?? 0;

  const statsBlock = totalMenInCompany > 0
    ? `
	<div class="company-stats p-2">
			<p class="company-count">Total Men <span>${totalMenInCompany}</span></p>
			<p class="company-men-lost">Men Lost <span>${totalMenLostAllTime}</span></p>
			<p class="company-enemies-killed">Enemies Killed <span>${totalEnemiesKilledAllTime}</span></p>
			<p class="company-missions-completed">Missions Completed <span>${totalMissionsCompleted}</span></p>
			<p class="company-missions-failed">Missions Failed <span>${totalMissionsFailed}</span></p>
			<p class="credit-balance">Credit Balance <span>$${creditBalance}</span></p>
			<p class="company-level">Company Level <span>${companyLevel}</span></p>
			<p class="company-inventory-status">Armory / Capacity <span>${totalItemsInInventory} / ${totalInventoryCapacity}</span></p>
		</div>
	`
    : `
    <div class="company-stats p-2">
			<p class="company-count">Total Men <span>${totalMenInCompany}</span></p>
			<p class="credit-balance">Credit Balance <span>$${creditBalance}</span></p>
			<p class="company-level">Company Level <span>${companyLevel}</span></p>
			<p class="company-inventory-status">Armory / Capacity <span>${totalItemsInInventory} / ${totalInventoryCapacity}</span></p>
		</div>
	  <div class="flex align-center justify-center w-100">
		    <button id="go-to-troops-screen" class="mbtn red">Recruit Men</button>
	  </div>
	`;

  const memorialCodexRow = `
    <div class="company-home-buttons-row flex align-center justify-center gap-2">
      <button id="company-stats-memorial" class="game-btn game-btn-md game-btn-blue codex-memorial-btn">Memorial Wall</button>
      <button id="company-go-codex" class="game-btn game-btn-md game-btn-blue codex-memorial-btn">Game Codex</button>
    </div>
  `;

  return `
  <div id="campaign-home-screen" class="flex h-100 column">
    ${companyHeaderPartial()}

    <div class="campaign-home-scroll">
      <div class="company-home-stats-block">
        ${statsBlock}
        ${memorialCodexRow}
      </div>

      <div class="company-level-bar-wrapper">
        <p class="ms-2 mb-1">Level ${companyLevel}</p>
        <div class="company-level-progress">
          <div class="progress-bar" data-experience="${companyExperience}"></div>
        </div>
      </div>
    </div>

    <div class="troops-market-footer">
      <div class="recruit-balance-bar">
        <span class="recruit-balance-item"><strong>Credits</strong> $${creditBalance}</span>
      </div>
      ${companyActionsTemplate()}
    </div>

    ${codexPopupTemplate()}
    ${memorialPopupTemplate()}
  </div>
`;
};
