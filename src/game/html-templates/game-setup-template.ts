import { DOM } from "../../constants/css-selectors.ts";
import { getArmorySlots } from "../../constants/economy.ts";
import { clrHash } from "../../utils/html-utils.ts";
import { Images } from "../../constants/images.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { TRAIT_CODEX } from "../../constants/trait-codex.ts";
import { TraitProfileStats } from "../entities/soldier/soldier-traits.ts";

/** Stat explanations for the codex Stats tab. */
const STAT_HELP_ITEMS: { stat: string; desc: string }[] = [
  { stat: "Hit Points", desc: "Health. When reduced to 0 the soldier is incapacitated." },
  { stat: "Dexterity", desc: "Affects accuracy, evasion, and attack speed." },
  { stat: "Awareness", desc: "Improves hit chance and evade chance." },
  { stat: "Toughness", desc: "Reduces incoming damage (mitigation)." },
  { stat: "Morale", desc: "Affects suppression resistance and mental stability." },
  { stat: "Mitigation", desc: "Percentage of damage reduced by armor and toughness." },
  { stat: "Evade Chance", desc: "Chance to dodge an incoming attack." },
  { stat: "Hit Chance", desc: "Chance to land a successful shot." },
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
          return `<span class="codex-stat-badge ${cls}">${k.replace(/_/g, " ")} ${v > 0 ? "+" : ""}${v}</span>`;
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

/** Game Codex popup template with Stats, Traits, Combat tabs. */
export function codexPopupTemplate(): string {
  const statsRows = STAT_HELP_ITEMS.map(
    (s) => `<div class="codex-stat-row"><span class="codex-stat-label">${s.stat}</span><span class="codex-stat-desc">${s.desc}</span></div>`,
  ).join("");
  const combatText = `
    <p>Combat is turn-based. Soldiers attack based on attack speed (dex + weapon).</p>
    <p>Take Cover removes a soldier from the fight for 3 seconds; enemies targeting them must retarget.</p>
    <p>Grenades deal area damage. Smoke grenades reduce enemy accuracy and grant evasion.</p>
    <p>Medics can heal allies with stim packs (50 HP) or themselves (20 HP).</p>
  `;
  const effectsRows = [
    { name: "Stun", desc: "Cannot act. Toughness mitigation reduced by 50%." },
    { name: "Panic", desc: "Attack speed slowed by 50%. Duration reduced by morale/2% (cap 50%)." },
    { name: "Smoked", desc: "Reduces chance to hit and be hit." },
    { name: "Burning", desc: "Damage over time. Incendiary grenades apply this effect." },
    { name: "Blinded", desc: "Chance to hit reduced by 50%." },
    { name: "Suppressed", desc: "+10% avoidance but cannot attack. Duration reduced by morale (cap 50%)." },
  ]
    .map((e) => `<div class="codex-stat-row"><span class="codex-stat-label">${e.name}</span><span class="codex-stat-desc">${e.desc}</span></div>`)
    .join("");
  return `
  <div id="codex-popup" class="codex-popup" role="dialog" aria-modal="true" hidden>
    <div class="codex-popup-inner codex-popup-tall">
      <button type="button" class="codex-popup-close" id="codex-popup-close" aria-label="Close">×</button>
      <h4 class="codex-popup-title">Game Codex</h4>
      <div class="codex-tabs">
        <button type="button" class="codex-tab active" data-tab="stats">Stats</button>
        <button type="button" class="codex-tab" data-tab="traits">Traits</button>
        <button type="button" class="codex-tab" data-tab="effects">Effects</button>
        <button type="button" class="codex-tab" data-tab="combat">Combat</button>
      </div>
      <div class="codex-tab-panels">
        <div class="codex-tab-panel active" data-panel="stats">${statsRows}</div>
        <div class="codex-tab-panel" data-panel="traits"><div class="codex-traits-grid">${codexTraitsHTML()}</div></div>
        <div class="codex-tab-panel" data-panel="effects"><div class="codex-effects-content">${effectsRows}</div></div>
        <div class="codex-tab-panel" data-panel="combat">${combatText}</div>
      </div>
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
  let titleHtml = "";

  if (title) {
    titleHtml = `<h3>${title}</h3>`;
  }

  return `
      <div id="company-meta" class="p-2">
      <div class="company-name flex justify-between align-center m-0">
        <img width="56" src="/images/unit-patches/${companyUnitPatchURL}" alt="Company patch"/>
        ${titleHtml}
        <div>
            <span class="ms-2">${companyName}</span>
            <p class="company-commander text-end">Commander: ${commanderName}</p>
        </div>
      </div>
    </div>
  `;
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
  const totalInventoryCapacity = getArmorySlots(companyLvl);
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
      <button id="company-stats-memorial" class="game-btn game-btn-lg game-btn-blue codex-memorial-btn">Memorial Wall</button>
      <button id="company-go-codex" class="game-btn game-btn-lg game-btn-blue codex-memorial-btn">Game Codex</button>
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
  </div>
`;
};
