import { DOM } from "../../constants/css-selectors.ts";
import { clrHash } from "../../utils/html-utils.ts";

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
                                <img class="grid-img-fit" src="/images/ui/patch_1.png" data-img="patch_1.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/ui/patch_2.png" data-img="patch_2.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/ui/patch_3.png" data-img="patch_3.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/ui/patch_4.png" data-img="patch_4.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/ui/patch_5.png" data-img="patch_5.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/ui/patch_6.png" data-img="patch_6.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/ui/patch_7.png" data-img="patch_7.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/ui/patch_8.png" data-img="patch_8.png" alt="Unit Patch">
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

	<img width="170" class="mb-2" src="images/ui/${unitPatch}" alt="Company Patch">
	<div class="flex column">
		<button id="launch-game" class="green mbtn mb-3">Begin</button>
		<button id="go-back" class="red mbtn">Go Back</button>
	</div>

</div>
`;

export const mainMenuTemplate = () => {
  return `
		<div id="g-menu-wrapper" class="flex align-center column justify-center h-100">
				<img width="170" src="images/ui/cc_logo.png" alt="Game Logo">
				<button id="${clrHash(DOM.mainMenu.newGame)}" class="mbtn green mb-3">New Game</button>
<!--				<button id="${clrHash(DOM.mainMenu.continue)}" class="mbtn green
		// mb-3">Continue</button>-->
				<button id="${clrHash(DOM.mainMenu.credits)}" class="mbtn black mb-3">Credits</button>
				<button id="${clrHash(DOM.mainMenu.settings)}" class="mbtn blue mb-3">Settings</button>
		</div>
	`;
};

export const companyHomePageTemplate = (
  companyName: string,
  companyCommander: string,
  companyUnitPatch: string,
) => {
  return `
	<div id="campaign-home-screen">
		<div id="company-meta">
			<p class="company-name">
				<img src="/images/ui/${companyUnitPatch}"/>
				<span class="ms-2">${companyName}</span>
			</p>
			<p class="company-commander">Commander: ${companyCommander}</p>
		</div>
		<div class="company-stats">
			<p class="company-count">Total Men</p>
			<p class="company-men-lost">Men Lost</p>
			<p class="company-missions-completed">Missions Completed</p>
			<p class="company-missions-failed">Missions Failed</p>
			<p class="company-total-missions">Total Missions</p>
			<p class="company-level">Company Level</p>
			<p class="company-inventory-status">Inventory Items/ Total Items</p>
		</div>
		<div class="company-level">
			<div class="company-level-progress"></div>
		</div>
		<div class="company-actions">
			<button id="company-go-home">
				<img src="/images/ui/square/home_button.png" alt="Go Home"/>
			</button>
			<button id="company-go-market">
				<img src="/images/ui/square/market_button.png" alt="Go To Market"/>
			</button>
			<button id="company-go-roster">
				<img src="/images/ui/square/list_1_button.png" alt="Go To Roster"/>
			</button>
			<button id="company-go-training">
				<img src="/images/ui/square/training_button.png" alt="Go To Training"/>
			</button>
			<button id="company-go-missions">
				<img src="/images/ui/square/missions_button.png" alt="Go To Missions"/>
			</button>
			<button id="company-go-inventory">
				<img src="/images/ui/square/inventory_button.png" alt="Go To Inventory"/>
			</button>
			<button id="company-go-memorial">
				<img src="/images/ui/square/heroes_button.png" alt="Go To Fallen Heroes"/>
			</button>
			<button id="company-go-abilities">
				<img src="/images/ui/square/list_2_button.png" alt="Go To Abilities"/>
			</button>
		</div>
	</div>
	`;
};
