import { DOM } from "../../constants/css-selectors.ts";
import { clrHash } from "../../utils/html-utils.ts";
import { Images } from "../../constants/images.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";

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
                        </div>

                        <div class="step-body">
                            <h3>Choose Your Unit Patch</h3>
                            <div class="grid grid-8-col grid-align-center grid-justify-center">
                                <img class="grid-img-fit" src="/images/unit-patches/patch_1.png" data-img="patch_1.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/unit-patches/patch_2.png" data-img="patch_2.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/unit-patches/patch_3.png" data-img="patch_3.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/unit-patches/patch_4.png" data-img="patch_4.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/unit-patches/patch_5.png" data-img="patch_5.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/unit-patches/patch_6.png" data-img="patch_6.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/unit-patches/patch_7.png" data-img="patch_7.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/unit-patches/patch_8.png" data-img="patch_8.png" alt="Unit Patch">
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
<div id="setup-confirmation" class=" flex column align-center">
<h1>CONFIRM SELECTION</h1>
	<h2>Hello Commander, ${name}</h2>
	<p>You are commanding: ${companyName}</p>
	<div class="mt-4 text-center p-2">
		<h3 class="px-5">"Leadership is the art of getting someone else to do something you want done because he wants to do it."</h3>
		<p class="helper-text">Dwight D. Eisenhower</p>
	</div>

	<img width="170" class="mb-2" src="images/unit-patches/${unitPatch}" alt="Company Patch">
	<div class="flex column">
		<button id="launch-game" class="green mbtn mb-3">Begin</button>
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
        <img width="80" src="/images/unit-patches/${companyUnitPatchURL}"/>
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
  return `
  <div class="company-actions grid grid-8-col p-2">
      ${[
        ["company-go-home", "Go Home", Images.btn.sq_home],
        ["company-go-market", "Market", Images.btn.sq_market],
        ["company-go-roster", "Company Roster", Images.btn.sq_list_1],
        ["company-go-training", "Training", Images.btn.sq_training],
        ["company-go-missions", "Missions", Images.btn.sq_mission],
        ["company-go-inventory", "Company Inventory", Images.btn.sq_inventory],
        ["company-go-memorial", "Memorial Wall", Images.btn.sq_heroes],
        ["company-go-abilities", "Company Abilities", "list_2_button.png"],
      ]
        .map(
          ([id, tooltip, img]) => `
        <div class="flip-container">
          <button id="${id}" class="mbtn icon-btn flip-btn" data-tooltip="${tooltip}">
            <div class="flipper">
              <div class="front-face">
                <img class="grid-img-fit" src="/images/ui/square/${img}" alt="${tooltip}" />
              </div>
              <div class="back-face">${tooltip}</div>
            </div>
          </button>
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
    totalMenInCompany,
    totalMissionsFailed,
    totalMissionsCompleted,
    totalInventoryCapacity,
    totalItemsInInventory,
    totalMenLostAllTime,
    totalEnemiesKilledAllTime,
    companyLevel,
    companyExperience,
    creditBalance,
  } = store;

  const stats = `
	<div class="company-stats p-2">
			<p class="company-count">Total Men <span>${totalMenInCompany}</span></p>
			<p class="company-men-lost">Men Lost <span>${totalMenLostAllTime}</span></p>
			<p class="company-enemies-killed">Enemies Killed <span>${totalEnemiesKilledAllTime}</span></p>
			<p class="company-missions-completed">Missions Completed <span>${totalMissionsCompleted}</span></p>
			<p class="company-missions-failed">Missions Failed <span>${totalMissionsFailed}</span></p>
			<p class="credit-balance">Credit Balance <span>$${creditBalance}</span></p>
			<p class="company-level">Company Level <span>${companyLevel}</span></p>
			<p class="company-inventory-status">Inventory Items/ Capacity <span>${totalItemsInInventory} / ${totalInventoryCapacity}</span></p>
		</div>
	`;
  const promptToSelectMen = `
	<div class="flex align-center justify-center w-100">
		<button id="select-men" class="mbtn red">Visit Market</button>
	</div>
	`;

  return `
  <div id="campaign-home-screen" class="flex h-100 column justify-between">
    ${companyHeaderPartial()}

    ${totalMenInCompany > 0 ? stats : promptToSelectMen}

    <div class="company-level-bar-wrapper">
      <p class="ms-2 mb-1">Level ${companyLevel}</p>
      <div class="company-level-progress">
        <div class="progress-bar" data-experience="${companyExperience}"></div>
      </div>
    </div>

    ${companyActionsTemplate()}
  </div>
`;
};
